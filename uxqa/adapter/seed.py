"""Seed qa-* personas into the isolated neos_uxqa DB and mint one session cookie each. See uxqa/adapter/AGENTS.md."""
from __future__ import annotations

import asyncio
import json
import os
import re
import sys
import uuid
from collections.abc import Awaitable, Callable
from datetime import datetime, timedelta, timezone
from typing import Any, NoReturn
from urllib.parse import urlparse

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from neos_agent.auth.middleware import make_session_cookie
from neos_agent.config import get_settings
from neos_agent.db.models import AppSetting, AuthSession, CircleMembership, Ecosystem, Member, Proposal, SharesNeeds, User
from neos_agent.db.models.userjourneyprogress import UserJourneyProgress
from neos_agent.db.session import create_db_engine

HANDLE_RULE = re.compile(r"^qa-[a-z0-9-]+$")
EXPECTED_DB = ("127.0.0.1", 5433, "neos_uxqa")
DEFAULT_MEMBERSHIP = {"ecosystem": "OmniOne", "role": "user", "profile": "townhall", "status": "active"}
SENTINEL_KEY = "uxqa_environment"
GOLD_MARKER = "(uxqa gold)"

Persona = dict[str, Any]
MemberReset = Callable[[AsyncSession, list[uuid.UUID]], Awaitable[None]]
StudyReset = Callable[[AsyncSession], Awaitable[None]]
MEMBER_RESETS: list[MemberReset] = []
STUDY_RESETS: list[StudyReset] = []


def refuse(reason: str) -> NoReturn:
    print(f"REFUSED {reason}")
    sys.exit(2)


def in_target_guard() -> None:
    """Second guard: this process may only write to the local neos_uxqa database."""
    url = urlparse(os.environ.get("DATABASE_URL", "").replace("+asyncpg", ""))
    actual = (url.hostname, url.port, (url.path or "/")[1:])
    if actual != EXPECTED_DB:
        refuse(f"DATABASE_URL is not the isolated uxqa DB ({actual[0]}:{actual[1]}/{actual[2]})")


# Registry pattern: each gold task registers the state its personas must start every pass without.
def member_reset(step: MemberReset) -> MemberReset:
    MEMBER_RESETS.append(step)
    return step


def study_reset(step: StudyReset) -> StudyReset:
    STUDY_RESETS.append(step)
    return step


@member_reset
async def restart_orientation(db: AsyncSession, member_ids: list[uuid.UUID]) -> None:  # gold-orient
    await db.execute(delete(UserJourneyProgress).where(UserJourneyProgress.member_id.in_(member_ids)))


@member_reset
async def leave_domains(db: AsyncSession, member_ids: list[uuid.UUID]) -> None:  # domain joins
    await db.execute(delete(CircleMembership).where(CircleMembership.member_id.in_(member_ids)))


@member_reset
async def withdraw_shares(db: AsyncSession, member_ids: list[uuid.UUID]) -> None:  # gold-share
    await db.execute(update(SharesNeeds).where(
        SharesNeeds.author_member_id.in_(member_ids), SharesNeeds.status == "active").values(status="withdrawn"))


@study_reset
async def withdraw_gold_proposals(db: AsyncSession) -> None:  # gold-propose, gold-advise
    await db.execute(update(Proposal).where(
        Proposal.title.like(f"%{GOLD_MARKER}"), Proposal.status != "withdrawn").values(status="withdrawn"))


def load_personas(path: str) -> list[Persona]:
    with open(path, encoding="utf-8") as personas_file:
        document = json.load(personas_file)
    personas = document["personas"] if isinstance(document, dict) else document
    invalid = [p.get("handle") for p in personas if not HANDLE_RULE.match(p.get("handle") or "")]
    if invalid:
        refuse(f"non-persona handles {invalid}")
    return personas


async def upsert_user(db: AsyncSession, persona: Persona) -> User:
    """Find or create the persona's user; profile fields reset so gold-profile starts from the same state."""
    display_name = persona.get("name") or persona["handle"]
    username = persona["handle"].replace("-", "_")[:100]
    user = (await db.execute(select(User).where(User.username == username))).scalar_one_or_none()
    if user is None:
        user = User(username=username, display_name=display_name)
        db.add(user)
        await db.flush()
    user.display_name, user.bio, user.headline = display_name, None, None
    return user


async def upsert_members(db: AsyncSession, user: User, persona: Persona, ecosystems: dict[str, Ecosystem]) -> list[uuid.UUID]:
    """One Member per requested ecosystem, with role/profile/status forced to the persona's spec."""
    member_ids = []
    for requested in (persona.get("seed") or {}).get("memberships") or [DEFAULT_MEMBERSHIP]:
        spec = {**DEFAULT_MEMBERSHIP, **requested}
        ecosystem = ecosystems.get(spec["ecosystem"]) or refuse(f"unknown ecosystem {spec['ecosystem']!r} for {persona['handle']}")
        member = (await db.execute(select(Member).where(
            Member.user_id == user.id, Member.ecosystem_id == ecosystem.id))).scalar_one_or_none()
        if member is None:
            member = Member(user_id=user.id, ecosystem_id=ecosystem.id, member_id=persona["handle"], display_name=user.display_name)
            db.add(member)
        member.display_name, member.role = user.display_name, spec["role"]
        member.profile, member.current_status = spec["profile"], spec["status"]
        await db.flush()
        member_ids.append(member.id)
    return member_ids


async def mint_session(db: AsyncSession, user: User) -> str:
    """Expire the persona's live sessions (agent_tokens reference them, so no delete) and sign a fresh one."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    await db.execute(update(AuthSession).where(AuthSession.user_id == user.id, AuthSession.expires_at > now).values(expires_at=now))
    session_id = uuid.uuid4()
    db.add(AuthSession(id=session_id, user_id=user.id, user_agent="uxqa-adapter",
                       expires_at=now + timedelta(hours=settings.SESSION_MAX_AGE_HOURS)))
    return make_session_cookie(str(session_id), settings.SESSION_SECRET)


async def ensure_sentinel(db: AsyncSession) -> None:
    """The row verify-target.mjs reads through the running server to prove it is on neos_uxqa."""
    existing = (await db.execute(select(AppSetting).where(AppSetting.key == SENTINEL_KEY))).scalar_one_or_none()
    if existing is None:
        db.add(AppSetting(key=SENTINEL_KEY, value={"db": EXPECTED_DB[2]}))


async def seed(personas_path: str, out_path: str) -> int:
    personas = load_personas(personas_path)
    sessions: list[dict[str, str]] = []
    engine = await create_db_engine(os.environ["DATABASE_URL"])
    try:
        async with async_sessionmaker(engine, expire_on_commit=False)() as db:
            ecosystems = {e.name: e for e in (await db.execute(select(Ecosystem))).scalars()}
            for persona in personas:
                if (persona.get("seed") or {}).get("anonymous"):
                    sessions.append({"handle": persona["handle"]})
                    continue
                user = await upsert_user(db, persona)
                member_ids = await upsert_members(db, user, persona, ecosystems)
                for reset in MEMBER_RESETS:
                    await reset(db, member_ids)
                sessions.append({"handle": persona["handle"], "cookie": await mint_session(db, user)})
            for reset in STUDY_RESETS:
                await reset(db)
            await ensure_sentinel(db)
            await db.commit()
    finally:
        await engine.dispose()

    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as out_file:
        json.dump(sessions, out_file)
    return len(sessions)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("usage: seed.py <personas.json> <out.json>")
        sys.exit(1)
    in_target_guard()  # before the engine exists; imports above never open a connection
    try:
        count = asyncio.run(seed(sys.argv[1], sys.argv[2]))
    except SystemExit:
        raise
    except Exception as error:  # status line only; never echo environment or tracebacks
        print(f"ERROR {type(error).__name__}: {str(error).splitlines()[0][:160]}")
        sys.exit(1)
    print(f"SEEDED {count}")
