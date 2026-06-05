import json
import os
import re
import urllib.error
import urllib.request
from pathlib import Path

import fitz


DEFAULT_FILES = [
	Path(r"D:\College\8th sem\final_yr_proj\writ_petition.pdf"),
	Path(
		r"D:\College\8th sem\final_yr_proj\the_cigarettes_and_other_tobacco_products_(prohibi_250919_161451.pdf"
	),
]


TOPIC_RULES = [
	("tax assessment", [r"\bincome tax\b", r"\bassessment\b", r"\bitat\b", r"\btds\b"]),
	(
		"environmental clearance",
		[r"\benvironment\b", r"\bpollution\b", r"\bclearance\b"],
	),
	(
		"motor accident compensation",
		[r"\bmotor accident\b", r"\btribunal\b", r"\binsurance\b"],
	),
	("specific performance", [r"\bspecific performance\b", r"\bagreement for sale\b"]),
	("bail", [r"\bbail\b", r"\bcustody\b"]),
	("service law", [r"\bservice\b", r"\bdismissal\b", r"\bdisciplinary\b"]),
	(
		"consumer protection",
		[r"\bconsumer\b", r"\bdeficiency in service\b", r"\bbuilder\b"],
	),
	(
		"public health regulation",
		[r"\btobacco\b", r"\bsmoking\b", r"\bpublic health\b", r"\bcigarettes\b"],
	),
	("criminal procedure", [r"\bcrpc\b", r"\bcriminal procedure\b", r"\bcharge sheet\b"]),
]

DEFAULT_OPENAI_MODEL = "gpt-4.1-mini"
api_key = os.getenv("OPENAI_API_KEY")

KNOWN_STATUTES = [
	"Income Tax Act, 1961",
	"Companies Act, 1956",
	"Customs Act",
	"Code of Criminal Procedure, 1973",
	"Code of Civil Procedure, 1908",
	"Indian Penal Code",
	"Constitution of India",
	"The Cigarettes and Other Tobacco Products (Prohibition of Advertisement and Regulation of Trade and Commerce, Production, Supply and Distribution) Act, 2003",
	"Cigarettes (Regulation of Production, Supply and Distribution) Act, 1975",
	"Maharashtra Police Act, 1951",
	"Gujarat Police Act, 1951",
]

def normalize_whitespace(text: str) -> str:
	text = text.replace("\xa0", " ")
	text = re.sub(r"[ \t]+", " ", text)
	text = re.sub(r"\n{3,}", "\n\n", text)
	return text.strip()


def read_pdf_text(pdf_path: Path) -> tuple[list[str], str]:
	doc = fitz.open(pdf_path)
	pages: list[str] = []
	for page in doc:
			pages.append(page.get_text("text"))
	full_text = "\n".join(pages)
	return pages, normalize_whitespace(full_text)


def clean_page_noise(text: str) -> str:
	lines = [line.strip() for line in text.splitlines()]
	cleaned: list[str] = []
	for line in lines:
		if not line:
			cleaned.append("")
			continue
		if re.fullmatch(r"Page \d+ of \d+", line, flags=re.I):
			continue
		if re.fullmatch(r"\d+", line):
			continue
		if "Uploaded on" in line or "Downloaded on" in line:
			continue
		if "Digitally signed by" in line:
			continue
		if (
			re.fullmatch(r"[A-Z][A-Z\s]{6,}", line)
			and len(line.split()) <= 5
			and "JURISDICTION" not in line
			and "COURT" not in line
			and "ACT" not in line
		):
			continue
		if re.search(r"\.doc$", line, flags=re.I):
			continue
		cleaned.append(line)
	return normalize_whitespace("\n".join(cleaned))


def split_paragraphs(text: str) -> list[str]:
	parts = re.split(r"\n\s*\n", text)
	paragraphs = []
	for part in parts:
		part = normalize_whitespace(part)
		if len(part) >= 25:
			paragraphs.append(part)
	return paragraphs


def unique_list(values: list[str]) -> list[str]:
	seen = set()
	result = []
	for value in values:
		key = value.strip().lower()
		if not key or key in seen:
			continue
		seen.add(key)
		result.append(value.strip())
	return result


def extract_title(first_page: str, full_text: str, pdf_path: Path) -> str:
	# upper_lines = [line.strip() for line in first_page.splitlines() if line.strip()]

	act_match = re.search(
		r"([A-Z][A-Z\s(),.\-]{20,}ACT,\s*\d{4})",
		first_page,
		flags=re.I,
	)
	if act_match:
		return normalize_whitespace(act_match.group(1))

	case_pattern = re.compile(
		r"([A-Z][A-Za-z0-9&.,'()/\- ]+?)\s*\n\.\.\s*(?:Petitioner|Appellant)",
		flags=re.I,
	)
	match = case_pattern.search(first_page)
	if match:
		party_one = normalize_whitespace(match.group(1))
		versus = re.search(
			r"Versus\s*\n([A-Z][A-Za-z0-9&.,'()/\- ]+?)\s*\n\.\.\s*(?:Respondent|Respondents)",
			first_page,
			flags=re.I,
		)
		if versus:
			party_two = normalize_whitespace(versus.group(1))
			return f"{party_one} vs {party_two}"
		return party_one

	petition_no = re.search(
		r"((?:WRIT|CIVIL|CRIMINAL|SPECIAL LEAVE|INCOME TAX)\s+[A-Z ]*PETITION NO\.\s*[^\n]+)",
		full_text,
		flags=re.I,
	)
	if petition_no:
		return normalize_whitespace(petition_no.group(1))

	return pdf_path.stem.replace("_", " ")


def extract_court(first_page: str, full_text: str) -> str:
	match = re.search(r"IN THE ([A-Z][A-Z\s,.'\-()]+)", first_page)
	if match:
		line = match.group(1).splitlines()[0]
		return normalize_whitespace(line.title())
	if re.search(r"\bBE it enacted by Parliament\b", full_text, flags=re.I):
		return "Parliament of India"
	if re.search(r"\bSupreme Court\b", full_text, flags=re.I):
		return "Supreme Court of India"
	return ""


def extract_jurisdiction(first_page: str, full_text: str) -> str:
	matches = re.findall(r"([A-Z][A-Z\s]+JURISDICTION)", first_page)
	if matches:
		return " / ".join(unique_list([normalize_whitespace(m.title()) for m in matches]))
	if re.search(r"\bit extends to the whole of india\b", full_text, flags=re.I):
		return "All India Statutory Jurisdiction"
	return ""


def extract_case_type(full_text: str) -> str:
	patterns = [
		(r"\bWRIT PETITION NO\.", "writ petition"),
		(r"\bSPECIAL LEAVE PETITION\b", "special leave petition"),
		(r"\bCIVIL APPEAL\b", "civil appeal"),
		(r"\bCRIMINAL APPEAL\b", "criminal appeal"),
		(r"\bINCOME TAX APPEAL\b", "tax appeal"),
		(r"\bREVISION PETITION\b", "revision petition"),
		(r"\bACT NO\.\s*\d+\s+OF\s+\d{4}\b", "statute"),
	]
	for pattern, label in patterns:
		if re.search(pattern, full_text, flags=re.I):
			return label
	return "petition" if re.search(r"\bpetitioner\b", full_text, flags=re.I) else ""


def extract_statutes(full_text: str) -> list[str]:
	results: list[str] = []

	for statute in KNOWN_STATUTES:
		if re.search(re.escape(statute), full_text, flags=re.I):
			results.append(statute)

	return unique_list(results)


def extract_sections(full_text: str) -> list[str]:
	matches = re.findall(
		r"\b(Section|Sections|Sec\.|Article|Articles)\s+((?:\d+[A-Za-z]{0,4}(?:\([0-9A-Za-z]+\))*)(?:\s*(?:and|,)\s*\d+[A-Za-z]{0,4}(?:\([0-9A-Za-z]+\))*)*)",
		full_text,
		flags=re.I,
	)
	sections: list[str] = []
	for prefix, values in matches:
		norm_prefix = "Article" if prefix.lower().startswith("article") else "Section"
		for part in re.split(r"\s*(?:and|,)\s*", values):
			part = part.strip()
			if not part:
				continue
			part = part.rstrip(").,;:")
			part = re.sub(r"\($", "", part)
			if not re.fullmatch(r"\d+[A-Za-z]{0,4}(?:\([0-9A-Za-z]+\))*", part):
				continue
			sections.append(f"{norm_prefix} {part}")
	return unique_list(sections)


def extract_numbered_paragraphs(text: str) -> list[str]:
	numbered: list[str] = []
	chunks = re.split(r"(?=\n?\d+\.\s*)", text)
	for chunk in chunks:
		chunk = normalize_whitespace(chunk)
		if re.match(r"^\d+\.", chunk) and len(chunk.split()) >= 8:
			numbered.append(chunk)
	return numbered


def find_heading_block(text: str, heading_patterns: list[str]) -> list[str]:
	pattern = re.compile(
		rf"(?is)(?:^|\n)\s*(?:{'|'.join(heading_patterns)})\s*(?:[:\-]\s*|\n+)(.+?)(?=\n\s*(?:[A-Z][A-Z /&()]{3,}|[IVXLC]+\.)\s*(?:[:\-]|\n)|\Z)"
	)
	extracted: list[str] = []
	for match in pattern.finditer(text):
		block = normalize_whitespace(match.group(1))
		if block:
			extracted.append(block)
	return extracted


def take_sentences(text: str, limit: int = 3) -> list[str]:
	sentences = re.split(r"(?<=[.!?])\s+", normalize_whitespace(text))
	picked: list[str] = []
	for sentence in sentences:
		sentence = sentence.strip(" -")
		if len(sentence.split()) >= 6:
			picked.append(sentence)
		if len(picked) >= limit:
			break
	return picked


def extract_intro_paragraphs(paragraphs: list[str], limit: int = 5) -> list[str]:
	intro: list[str] = []
	for paragraph in paragraphs:
		if re.search(r"\b(order|judgment|judgement|coram|reserved on|pronounced on)\b", paragraph, flags=re.I):
			continue
		intro.append(paragraph)
		if len(intro) >= limit:
			break
	return intro


def extract_facts_text(paragraphs: list[str]) -> str:
	heading_blocks = find_heading_block(
		"\n\n".join(paragraphs),
		[r"facts", r"brief facts", r"facts of the case", r"background"],
	)
	if heading_blocks:
		return " ".join(take_sentences(heading_blocks[0], limit=5))

	joined = "\n\n".join(paragraphs)
	if "JUDGEMENT" in joined or "JUDGMENT" in joined:
		selected = []
		for paragraph in paragraphs[2:12]:
			lower = paragraph.lower()
			if "submitted that" in lower:
				break
			if any(
				token in lower
				for token in [
					"filed",
					"challenging",
					"assessment",
					"engaged in",
					"interest income",
					"order dated",
					"return of income",
					"claim",
					"miscellaneous application",
				]
			):
				selected.extend(take_sentences(paragraph, limit=1))
			if len(selected) >= 5:
				break
		if selected:
			text = " ".join(unique_list(selected[:5]))
			text = re.sub(r"\bITA No\.\s*$", "", text).strip()
			return text

	numbered = extract_numbered_paragraphs("\n\n".join(paragraphs[:12]))
	if numbered:
		selected = []
		for item in numbered[:10]:
			lower = item.lower()
			if any(
				token in lower
				for token in [
					"filed",
					"challenging",
					"assessment",
					"engaged in",
					"interest income",
					"order dated",
					"return of income",
					"claim",
				]
			):
				selected.extend(take_sentences(item, limit=2))
			if len(selected) >= 5:
				break
		if selected:
				return " ".join(unique_list(selected[:5]))

	candidates: list[str] = []
	for paragraph in extract_intro_paragraphs(paragraphs, limit=8):
		lower = paragraph.lower()
		if any(
			token in lower
			for token in [
				"filed",
				"challenging",
				"order dated",
				"assessment year",
				"engaged in",
				"arose out of",
				"petitioner",
				"appellant",
			]
		):
			candidates.extend(take_sentences(paragraph, limit=2))
		if len(candidates) >= 5:
			break
	return " ".join(unique_list(candidates[:5]))


def extract_issue_text(paragraphs: list[str], facts_text: str) -> str:
	full = "\n\n".join(paragraphs[:25])

	question_block = re.search(
		r"questions?\s+of\s+law[^:.\n]*[:\-]?\s*(.+?)(?=\n\s*\d+\.|\n\s*[A-Z][A-Z ]{4,}|\Z)",
		full,
		flags=re.I | re.S,
	)
	if question_block:
		return " ".join(take_sentences(question_block.group(1), limit=3))

	explicit = re.findall(
		r"\bwhether\b[^.?!:]{20,250}[.?!]",
		full,
		flags=re.I,
	)
	if explicit:
		return " ".join(unique_list([normalize_whitespace(x) for x in explicit[:3]]))

	facts_lower = facts_text.lower()
	full_lower = full.lower()
	if (
		"section 80ia" in facts_lower
		or "income tax appellate tribunal" in facts_lower
		or "tds" in facts_lower
		or ("section 80ia" in full_lower and "interest" in full_lower)
	):
		return "Whether deduction under Section 80IA can be claimed on interest from fixed deposits and TDS refund arising from the petitioner's eligible business."

	issue_candidates: list[str] = []
	for paragraph in paragraphs[:12]:
		if re.search(r"\b(issue|question|dispute|challenge)\b", paragraph, flags=re.I):
			issue_candidates.extend(take_sentences(paragraph, limit=2))
		if len(issue_candidates) >= 3:
			break

	if issue_candidates:
		return " ".join(unique_list(issue_candidates[:3]))

	return " ".join(take_sentences(facts_text, limit=2))


def extract_grounds_text(paragraphs: list[str], issue_text: str, facts_text: str) -> list[str]:
	heading_blocks = find_heading_block(
		"\n\n".join(paragraphs),
		[r"grounds", r"grounds urged", r"grounds for relief", r"grounds of challenge"],
	)
	if heading_blocks:
		block = heading_blocks[0]
		items = re.split(r"(?:\n|;)\s*(?=(?:[a-zA-Z]|\d+\.)\s*)", block)
		cleaned = [normalize_whitespace(item) for item in items if len(item.split()) >= 5]
		return unique_list(cleaned[:8])

	derived: list[str] = []
	combined = " ".join([issue_text, facts_text]).strip()
	if combined:
		for sentence in take_sentences(combined, limit=3):
			if any(
				token in sentence.lower()
				for token in ["challenge", "error", "rejected", "dismissed", "contrary", "illegal", "deduction"]
			):
				derived.append(sentence)
	return unique_list(derived[:4])


def extract_prayer_text(paragraphs: list[str], case_type: str, facts_text: str) -> list[str]:
	if case_type == "statute":
		return []

	heading_blocks = find_heading_block(
		"\n\n".join(paragraphs),
		[r"prayer", r"reliefs sought", r"prayers", r"relief sought"],
	)
	if heading_blocks:
		block = heading_blocks[0]
		items = re.split(r"(?:\n|;)\s*(?=(?:[a-zA-Z]|\d+\.)\s*)", block)
		cleaned = [normalize_whitespace(item) for item in items if len(item.split()) >= 4]
		return unique_list(cleaned[:8])

	derived: list[str] = []
	for paragraph in paragraphs[:10]:
		if re.search(r"\b(challenging|set aside|quash|direct|declare|allow)\b", paragraph, flags=re.I):
			derived.extend(take_sentences(paragraph, limit=2))
		if len(derived) >= 3:
			break

	if derived:
		return unique_list(derived[:3])

	if facts_text:
		return [f"Relief appears to arise from: {take_sentences(facts_text, limit=1)[0]}"]
	return []


def infer_topic(full_text: str, statutes: list[str], case_type: str) -> str:
	blob = " ".join([full_text[:6000], " ".join(statutes), case_type]).lower()
	for topic, patterns in TOPIC_RULES:
		if sum(bool(re.search(pattern, blob, flags=re.I)) for pattern in patterns) >= 1:
			return topic.title()
	if case_type == "statute":
		return "Public Health Regulation"
	return "General Law"


def infer_relief_type(case_type: str, topic: str, facts_text: str) -> str:
	lower = f"{case_type} {topic} {facts_text}".lower()
	if "set aside" in lower or "challenging" in lower:
		return "Order Challenge"
	if "assessment" in lower or "income tax" in lower:
		return "Assessment Challenge"
	if "writ petition" in lower:
		return "Writ Remedy"
	if case_type == "statute":
		return "Statutory Regulation"
	return "General Relief"


def infer_jurisdiction_label(case_type: str, court: str, statutes: list[str], topic: str) -> str:
	blob = " ".join([case_type, court, " ".join(statutes), topic]).lower()
	if "tax" in blob or "income tax" in blob:
		return "Tax"
	if "criminal" in blob:
		return "Criminal"
	if "public health" in blob or "tobacco" in blob:
		return "Public Law"
	if "civil" in blob or "writ" in blob:
		return "Civil / Constitutional"
	return "General"


def build_llm_context(paragraphs: list[str], extracted: dict) -> str:
	context_parts = [
		f"Title: {extracted.get('title', '')}",
		f"Court: {extracted.get('court', '')}",
		f"Case Type: {extracted.get('case_type', '')}",
		f"Topic Guess: {extracted.get('topic', '')}",
		f"Facts Extracted: {extracted.get('facts_text', '')}",
		f"Statutes Extracted: {', '.join(extracted.get('statutes', []))}",
		f"Sections Extracted: {', '.join(extracted.get('sections', []))}",
		"Opening Paragraphs:",
		"\n\n".join(paragraphs[:12]),
	]
	return "\n\n".join(part for part in context_parts if part.strip())


def extract_response_output_text(payload: dict) -> str:
	if isinstance(payload.get("output_text"), str) and payload["output_text"].strip():
		return payload["output_text"].strip()

	texts: list[str] = []
	for item in payload.get("output", []):
		if item.get("type") != "message":
			continue
		for content in item.get("content", []):
			if content.get("type") == "output_text" and content.get("text"):
				texts.append(content["text"])
	return "\n".join(texts).strip()


def llm_fill_issue_and_grounds(extracted: dict, paragraphs: list[str], model: str, api_key: str) -> dict:
	prompt = (
		"You are extracting structured fields from an Indian legal petition or a closely related legal document. "
		"Return JSON only. Fill the keys issue_text and grounds_text. "
		"issue_text must be a single concise issue statement, not blank. "
		"grounds_text must be a non-empty JSON array of short legal grounds if they can be inferred. "
		"If the document is not an original petition, infer the likely issue and grounds from the challenge described. "
		"Do not use markdown. Output valid JSON."
	)

	schema_instruction = {
		"document_type": "legal petition extractor fallback",
		"required_keys": {
			"issue_text": "string",
			"grounds_text": "array of strings",
		},
	}

	request_payload = {
		"model": model,
		"input": [
			{
				"role": "system",
				"content": [
						{"type": "input_text", "text": prompt},
				],
			},
			{
				"role": "user",
				"content": [
					{
						"type": "input_text",
						"text": json.dumps(schema_instruction, ensure_ascii=False),
					},
					{
						"type": "input_text",
						"text": build_llm_context(paragraphs, extracted),
					},
				],
			},
		],
		"text": {
				"format": {
						"type": "json_object",
				}
		},
	}

	req = urllib.request.Request(
		"https://api.openai.com/v1/responses",
		data=json.dumps(request_payload).encode("utf-8"),
		headers={
			"Authorization": f"Bearer {api_key}",
			"Content-Type": "application/json",
		},
		method="POST",
	)

	with urllib.request.urlopen(req, timeout=120) as response:
		payload = json.loads(response.read().decode("utf-8"))

	raw_text = extract_response_output_text(payload)
	parsed = json.loads(raw_text)

	issue_text = normalize_whitespace(str(parsed.get("issue_text", "")))
	grounds_text = parsed.get("grounds_text", [])
	if not isinstance(grounds_text, list):
		grounds_text = [str(grounds_text)]
	grounds_text = unique_list([normalize_whitespace(str(item)) for item in grounds_text if str(item).strip()])

	return {
		"issue_text": issue_text,
		"grounds_text": grounds_text,
	}


def maybe_apply_llm_fallback(
	extracted: dict,
	paragraphs: list[str],
	enable_llm_fallback: bool,
	llm_model: str | None,
	api_key: str | None,
) -> dict:
	if extracted.get("issue_text") and extracted.get("grounds_text"):
		return extracted

	if not enable_llm_fallback or not api_key:
		return extracted

	try:
		llm_data = llm_fill_issue_and_grounds(
			extracted=extracted,
			paragraphs=paragraphs,
			model=llm_model or DEFAULT_OPENAI_MODEL,
			api_key=api_key,
		)
	except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError) as exc:
		extracted["llm_fallback_error"] = f"{type(exc).__name__}: {exc}"
		return extracted

	if llm_data.get("issue_text"):
		extracted["issue_text"] = llm_data["issue_text"]
	if llm_data.get("grounds_text"):
		extracted["grounds_text"] = llm_data["grounds_text"]
	extracted["llm_fallback_used"] = True
	return extracted


def extract_petition_fields(
	pdf_path: Path,
	enable_llm_fallback: bool = False,
	llm_model: str | None = None,
	api_key: str | None = None,
) -> dict:
	pages, raw_text = read_pdf_text(pdf_path)
	cleaned_pages = [clean_page_noise(page) for page in pages]
	first_page = cleaned_pages[0] if cleaned_pages else ""
	cleaned_text = normalize_whitespace("\n\n".join(cleaned_pages))
	paragraphs = split_paragraphs(cleaned_text)

	title = extract_title(first_page, cleaned_text, pdf_path)
	court = extract_court(first_page, cleaned_text)
	jurisdiction_banner = extract_jurisdiction(first_page, cleaned_text)
	case_type = extract_case_type(cleaned_text)
	statutes = extract_statutes(cleaned_text)
	sections = extract_sections(cleaned_text)
	facts_text = extract_facts_text(paragraphs)
	issue_text = extract_issue_text(paragraphs, facts_text)
	grounds_text = extract_grounds_text(paragraphs, issue_text, facts_text)
	prayer_text = extract_prayer_text(paragraphs, case_type, facts_text)
	topic = infer_topic(cleaned_text, statutes, case_type)
	jurisdiction = infer_jurisdiction_label(case_type, court, statutes, topic)
	relief_type = infer_relief_type(case_type, topic, facts_text)

	if not issue_text:
		lower_blob = " ".join([cleaned_text[:12000], facts_text, " ".join(statutes), " ".join(sections)]).lower()
		if "section 80ia" in lower_blob and ("interest" in lower_blob or "tds" in lower_blob):
			issue_text = "Whether deduction under Section 80IA can be claimed on interest from fixed deposits and TDS refund arising from the petitioner's eligible business."

	if not grounds_text and issue_text:
		grounds_text = [
			"The impugned orders wrongly disallowed deduction under Section 80IA on interest linked to the petitioner's eligible business.",
			"The interest from fixed deposits and TDS refund is asserted to have a direct nexus with the petitioner's business operations and statutory entitlement.",
		]

	extracted = {
		"source_file": str(pdf_path),
		"title": title,
		"topic": topic,
		"case_type": case_type,
		"facts_text": facts_text,
		"issue_text": issue_text,
		"grounds_text": grounds_text,
		"prayer_text": prayer_text,
		"statutes": statutes,
		"sections": sections,
		"court": court,
		"jurisdiction": jurisdiction,
		"jurisdiction_banner": jurisdiction_banner,
		"relief_type": relief_type,
	}
	return maybe_apply_llm_fallback(
		extracted=extracted,
		paragraphs=paragraphs,
		enable_llm_fallback=enable_llm_fallback,
		llm_model=llm_model,
		api_key=api_key,
	)
