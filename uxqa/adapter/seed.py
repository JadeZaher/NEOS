"""Seed qa-* personas into the isolated neos_uxqa DB and mint one session cookie each. See uxqa/adapter/AGENTS.md."""
from __future__ import annotations

import asyncio
import json
import os
import re
import sys
import uuid
from datetime import datetime, timedelta, timezone
from typing import NoReturn
from urllib.parse import urlparse

HANDLE_RULE = re.compile(r"^qa-[a-z0-9-]+$")
EXPECTED_DB = ("127.0.0.1", 5433, "neos_uxqa")
DEFAULT_MEMBERSHIP = {"ecosystem": "OmniOne", "role": "user", "profile": "townhall", "status": "active"}
SENTINEL_KEY = "uxqa_environment"
GOLD_MARKER = "(uxqa gold)"


def refuse(reason: str) -> NoReturn:
    print(f"REFUSED {reason}")
    sys.exit(2)


def in_target_guard() -> None:
    """Second guard: this process may only write to the local neos_uxqa database."""
    url = urlparse(os.environ.get("DATABASE_URL", "").replace("+asyncpg", ""))
    actual = (url.hostname, url.port, (url.path or "/")[1:])
    if actual != EXPECTED_DB:
        refuse(f"DATABASE_URL is not the isolated uxqa DB ({actual[0]}:{actual[1]}/{actual[2]})")


async def seed(personas_path: str, out_path: str) -> int:
    from sqlalchemy import delete, select, update

    from neos_agent.auth.middleware import make_session_cookie
    from neos_agent.config import get_settings
    from neos_agent.db.models import AppSetting, AuthSession, CircleMembership, Ecosystem, Member, Proposal, SharesNeeds, User
    from neos_agent.db.models.userjourneyprogress import UserJourneyProgress
    from neos_agent.db.session import create_db_engine
    from sqlalchemy.ext.asyncio import async_sessionmaker

    with open(personas_path, encoding="utf-8") as handle_file:
        document = json.load(handle_file)
    personas = document["personas"] if isinstance(document, dict) else document
    bad = [p.get("handle") for p in personas if not HANDLE_RULE.match(p.get("handle") or "")]
    if bad:
        refuse(f"non-persona handles {bad}")

    settings = get_settings()
    engine = await create_db_engine(os.environ["DATABASE_URL"])
    sessions_out = []
    async with async_sessionmaker(engine, expire_on_commit=False)() as db:
        ecosystems = {e.name: e for e in (await db.execute(select(Ecosystem))).scalars()}
        for persona in personas:
            handle = persona["handle"]
            seed_spec = persona.get("seed") or {}
            if seed_spec.get("anonymous"):
                sessions_out.append({"handle": handle})
                continue

            username = handle.replace("-", "_")[:100]
            display_name = persona.get("name") or handle
            user = (await db.execute(select(User).where(User.username == username))).scalar_one_or_none()
            if user is None:
                user = User(username=username, display_name=display_name)
                db.add(user)
                await db.flush()
            # Reset profile fields so profile gold tasks start from the same state every pass.
            user.display_name, user.bio, user.headline = display_name, None, None

            member_ids = []
            for spec in seed_spec.get("memberships") or [DEFAULT_MEMBERSHIP]:
                spec = {**DEFAULT_MEMBERSHIP, **spec}
                ecosystem = ecosystems.get(spec["ecosystem"])
                if ecosystem is None:
                    refuse(f"unknown ecosystem {spec['ecosystem']!r} for {handle}")
                member = (await db.execute(select(Member).where(
                    Member.user_id == user.id, Member.ecosystem_id == ecosystem.id))).scalar_one_or_none()
                if member is None:
                    member = Member(user_id=user.id, ecosystem_id=ecosystem.id, member_id=handle, display_name=display_name)
                    db.add(member)
                member.display_name, member.role = display_name, spec["role"]
                member.profile, member.current_status = spec["profile"], spec["status"]
                await db.flush()
                member_ids.append(member.id)

            # Per-pass reset of state that gold tasks create (orientation, shares, domain joins).
            await db.execute(delete(UserJourneyProgress).where(UserJourneyProgress.member_id.in_(member_ids)))
            await db.execute(delete(CircleMembership).where(CircleMembership.member_id.in_(member_ids)))
            await db.execute(update(SharesNeeds).where(
                SharesNeeds.author_member_id.in_(member_ids), SharesNeeds.status == "active").values(status="withdrawn"))

            now = datetime.now(timezone.utc)
            await db.execute(update(AuthSession).where(AuthSession.user_id == user.id, AuthSession.expires_at > now).values(expires_at=now))
            session_id = uuid.uuid4()
            db.add(AuthSession(id=session_id, user_id=user.id, user_agent="uxqa-adapter",
                               expires_at=now + timedelta(hours=settings.SESSION_MAX_AGE_HOURS)))
            sessions_out.append({"handle": handle, "cookie": make_session_cookie(str(session_id), settings.SESSION_SECRET)})

        # Gold proposals from earlier passes would satisfy this pass's predicate without any work.
        await db.execute(update(Proposal).where(
            Proposal.title.like(f"%{GOLD_MARKER}"), Proposal.status != "withdrawn").values(status="withdrawn"))

        sentinel = (await db.execute(select(AppSetting).where(AppSetting.key == SENTINEL_KEY))).scalar_one_or_none()
        if sentinel is None:
            db.add(AppSetting(key=SENTINEL_KEY, value={"db": EXPECTED_DB[2]}))
        await db.commit()
    await engine.dispose()

    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as out_file:
        json.dump(sessions_out, out_file)
    return len(sessions_out)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("usage: seed.py <personas.json> <out.json>")
        sys.exit(1)
    in_target_guard()
    try:
        count = asyncio.run(seed(sys.argv[1], sys.argv[2]))
    except SystemExit:
        raise
    except Exception as error:  # status line only; never echo environment or tracebacks
        print(f"ERROR {type(error).__name__}: {str(error).splitlines()[0][:160]}")
        sys.exit(1)
    print(f"SEEDED {count}")
