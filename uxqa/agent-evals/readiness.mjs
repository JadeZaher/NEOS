// Genuine prerequisite completion for existing active synthetic eval members; see AGENTS.md.
const choices = (question) => (question.choices || []).map((choice) => choice && typeof choice === 'object' ? choice.value : choice);
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function candidateQuestions(candidate) {
	if (!candidate?.is_published || !isObject(candidate.survey_json)) throw new Error('Readiness requires a published candidate questionnaire');
	const survey = candidate.survey_json;
	const elements = [...(Array.isArray(survey.elements) ? survey.elements : []),
		...(Array.isArray(survey.pages) ? survey.pages.flatMap((page) => Array.isArray(page.elements) ? page.elements : []) : [])];
	const serialized = JSON.stringify(survey);
	if (/"(?:correctAnswer|correctAnswers|answerKey|answer_key)"\s*:/.test(serialized)) throw new Error('Candidate DTO exposed grading keys; readiness setup refused');
	const questions = elements.filter((question) => !['html', 'image'].includes(question?.type));
	const names = new Set();
	for (const question of questions) {
		if (!question || typeof question.name !== 'string' || !question.name || names.has(question.name)) throw new Error('Candidate questionnaire has invalid or duplicate field names');
		names.add(question.name);
	}
	if (!questions.length) throw new Error('Candidate questionnaire has no answerable fields');
	return questions;
}

export function readinessAnswers(requirement, candidate, answerSources = {}) {
	const questions = candidateQuestions(candidate);
	if (requirement.completion_mode === 'graded') {
		const supplied = answerSources.byQuizId?.[requirement.id] || answerSources.byTitle?.[requirement.title];
		if (!isObject(supplied?.answers) || typeof supplied.source !== 'string' || !supplied.source.trim()) {
			throw new Error(`Graded prerequisite ${requirement.title} needs an explicit vetted fixture answer source`);
		}
		return { answers: supplied.answers, source: supplied.source };
	}
	if (requirement.completion_mode !== 'completion') throw new Error('Unknown readiness completion mode');
	const answers = {};
	for (const question of questions) {
		switch (question.type) {
			case 'boolean': answers[question.name] = false; break;
			case 'comment':
			case 'text': answers[question.name] = 'Synthetic fixture readiness response for the guarded local operator study.'; break;
			case 'radiogroup':
			case 'dropdown':
			case 'checkbox': {
				const options = choices(question);
				if (!options.length || options[0] == null) throw new Error('Candidate choice field has no usable options');
				answers[question.name] = question.type === 'checkbox' ? [options[0]] : options[0];
				break;
			}
			case 'rating': {
				const low = question.rateMin ?? 1, high = question.rateMax ?? 5;
				if (typeof low !== 'number' || typeof high !== 'number' || !Number.isFinite(low) || low > high) throw new Error('Candidate rating range is invalid');
				answers[question.name] = low;
				break;
			}
			default: throw new Error(`Readiness does not fabricate answers for unsupported field type ${question.type}`);
		}
	}
	return { answers, source: 'synthetic-completion-fixture-v1' };
}

export async function prepareActiveReadiness(client, personas, { answerSources = {}, record = () => {} } = {}) {
	const evidence = [];
	const emit = (entry) => { evidence.push(entry); record(entry); };
	for (const persona of personas) {
		if (!/^qa-agent-[a-z]+$/.test(persona.handle)) throw new Error('Readiness preparation is limited to synthetic agent-eval personas');
		if (persona.seed?.prepare_readiness === false || persona.seed?.join_gate_test === true) {
			emit({ actor: persona.handle, status: 'preserved', reason: 'explicit entry-test fixture' });
			continue;
		}
		const me = await client.must(persona.handle, 'GET', '/api/v1/auth/me');
		for (const membership of persona.seed?.memberships || []) {
			const actual = (me.ecosystems || []).find((row) => row.name === membership.ecosystem);
			if (membership.status !== 'active' || actual?.membership_status !== 'active') {
				emit({ actor: persona.handle, ecosystem: membership.ecosystem, status: 'preserved', reason: 'not an existing active fixture membership' });
				continue;
			}
			const path = `/api/v1/ecosystems/${actual.id}/join-gates`;
			const before = await client.must(persona.handle, 'GET', path);
			for (const requirement of before.join_gates?.required_quizzes || []) {
				if (['passed', 'completed', 'bypassed'].includes(requirement.status)) {
					emit({ actor: persona.handle, ecosystem_id: actual.id, quiz_id: requirement.id, title: requirement.title, status: 'already-ready', prerequisite_status: requirement.status });
					continue;
				}
				if (requirement.status !== 'required') throw new Error(`Readiness unavailable for ${persona.handle}: ${requirement.title}`);
				const candidate = await client.must(persona.handle, 'GET', `/api/v1/quizzes/${requirement.id}?candidate=1`);
				const prepared = readinessAnswers(requirement, candidate, answerSources);
				const response = await client.must(persona.handle, 'POST', `/api/v1/quizzes/${requirement.id}/submit`, {
					survey_results: prepared.answers, target_ecosystem_id: actual.id,
				});
				if (response.result?.completion_verified !== true || (requirement.completion_mode === 'graded' ? response.result?.is_passed !== true : response.result?.is_passed !== null)) {
					throw new Error(`Server did not verify genuine prerequisite completion for ${persona.handle}: ${requirement.title}`);
				}
				const after = await client.must(persona.handle, 'GET', path);
				const current = after.join_gates?.required_quizzes?.find((row) => row.id === requirement.id);
				if (!current || !['passed', 'completed', 'bypassed'].includes(current.status)) throw new Error('Submitted prerequisite did not become current server-verified readiness');
				emit({ actor: persona.handle, ecosystem_id: actual.id, quiz_id: requirement.id, title: requirement.title,
					status: 'completed-through-api', completion_mode: requirement.completion_mode, result_id: response.result.id,
					completion_verified: true, prerequisite_status: current.status, answer_source: prepared.source });
			}
		}
	}
	return evidence;
}
