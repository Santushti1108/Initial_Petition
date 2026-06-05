import json
import faiss
import numpy as np
import re

from collections import defaultdict
from pathlib import Path

EMBEDDINGS_DIR = Path(r"D:\College\8th sem\final_yr_proj\Initial_Petition\backend\modules\embeddings")

TOP_K_ISSUE = 30
TOP_K_FACTS = 30
TOP_K_HOLDING_PROXY = 20
FINAL_TOP_K = 5

def load_jsonl(path):
  records = []
  with path.open("r", encoding="utf-8") as f:
    for line in f:
      line = line.strip()
      if line:
        records.append(json.loads(line))
  return records

def join_list_field(value):
  if not value:
    return ""
  if isinstance(value, list):
    return "\n".join(str(x).strip() for x in value if str(x).strip())
  return str(value).strip()

def normalize_embeddings(arr):
  norms = np.linalg.norm(arr, axis=1, keepdims=True)
  norms = np.clip(norms, 1e-12, None)
  return arr / norms

def cosine_from_ip(score):
  # IndexFlatIP on normalized vectors gives cosine similarity directly
  return float(score)

"""def overlap_score(list1, list2):
  s1 = {x.strip().lower() for x in (list1 or []) if str(x).strip()}
  s2 = {x.strip().lower() for x in (list2 or []) if str(x).strip()}
  if not s1 or not s2:
    return 0.0
  return len(s1 & s2) / len(s1 | s2)"""

def normalize_text(s):
  if not s:
    return ""
  s = str(s).strip().lower()
  s = re.sub(r"\s+", " ", s)
  return s

def normalize_section_name(s):
  s = normalize_text(s)
  if not s:
    return ""

  s = s.replace("article ", "art ")
  s = s.replace("article", "art ")
  s = s.replace("section ", "sec ")
  s = s.replace("section", "sec ")
  s = s.replace("u/s", "sec ")
  s = s.replace("u. s.", "sec ")
  s = re.sub(r"\s+", " ", s).strip()

  if s in {"unspecified_section", "unspecified section", "articles", "sections"}:
    return ""

  return s

def normalize_statute_name(s):
  s = normalize_text(s)
  if not s:
    return ""

  aliases = {
    "code of criminal procedure": "crpc",
    "criminal procedure code": "crpc",
    "cr.p.c.": "crpc",
    "crpc": "crpc",

    "indian penal code": "ipc",
    "i.p.c.": "ipc",
    "ipc": "ipc",

    "constitution of india": "constitution",
    "indian constitution": "constitution",

    "motor vehicles act, 1988": "motor vehicles act",
    "motor vehicles act": "motor vehicles act",

    "environment protection act, 1986": "environment protection act",
    "environment protection act": "environment protection act",

    "right to fair compensation and transparency in land acquisition act, 2013":
      "land acquisition act 2013",
  }

  return aliases.get(s, s)

def overlap_score(list1, list2, normalizer=normalize_text):
  s1 = {normalizer(x) for x in (list1 or []) if normalizer(x)}
  s2 = {normalizer(x) for x in (list2 or []) if normalizer(x)}
  
  if not s1 or not s2:
    return 0.0
  
  return len(s1 & s2) / len(s1 | s2)

def soft_case_type_score(pet_case_type, judg_case_type):
  p = normalize_text(pet_case_type)
  j = normalize_text(judg_case_type)

  if not p or not j:
    return 0.0

  if p == j:
    return 1.0

  compatible_groups = [
    {"writ petition", "application"},
    {"appeal", "civil appeal"},
    {"appeal", "criminal appeal"},
    {"application", "revision petition"},
    {"application", "special leave petition"},
    {"suit", "civil appeal"},
  ]

  for group in compatible_groups:
    if p in group and j in group:
      return 0.5

  return -0.4


def court_match_score(pet_court, judg_court):
  p = normalize_text(pet_court)
  j = normalize_text(judg_court)

  if not p or not j:
    return 0.0

  if p in j or j in p:
    return 1.0

  if "high court" in p and "high court" in j:
    return 0.7

  if "supreme court" in p and "supreme court" in j:
    return 1.0

  if "tribunal" in p and "tribunal" in j:
    return 0.7

  return 0.0

"""def case_type_match_score(pet_case_type, judg_case_type):
  if not pet_case_type or not judg_case_type:
    return 0.0
  return 1.0 if pet_case_type.strip().lower() == judg_case_type.strip().lower() else 0.0"""

def topic_match_scoring(topic, judgment_tags, judgment_title, judgment_statutes):
  topic = normalize_text(topic)

  blob = " ".join([
    " ".join(judgment_tags or []),
    judgment_title or "",
    " ".join(judgment_statutes or [])
  ]).lower()

  topic_keywords = {
    "land acquisition": ["land acquisition", "compensation", "acquired land"],
    "service law": ["service", "dismissal", "disciplinary"],
    "motor accident compensation": ["motor accident", "tribunal", "disability"],
    "environmental clearance": ["environment", "pollution", "clearance"],
    "criminal procedure": ["charge sheet", "discharge"],
    "preventive detention": ["detention", "detenu"],
    "specific performance": ["specific performance", "agreement for sale"],
    "tax assessment": ["income tax", "assessment", "assessee"],
    "bail": ["bail", "custody"],
    "election law": ["election", "corrupt practice"],
    "company law": ["company", "oppression", "mismanagement"],
    "family law": ["maintenance", "wife", "husband"],
    "consumer protection": ["consumer", "builder", "deficiency"],
    "electricity regulation": ["electricity", "board", "meter"],
    "tender and contractual fairness": ["tender", "bid", "contract"],
  }

  keywords = topic_keywords.get(topic, [])

  if not keywords:
    return 0.0

  hits = sum(1 for kw in keywords if kw in blob)

  if hits >= 3:
    return 1.0
  if hits == 2:
    return 0.7
  if hits == 1:
    return 0.35

  return 0.0

def topic_mismatch_penalty(topic, judgment_tags, judgment_title, judgment_statutes):
  topic = normalize_text(topic)

  blob = " ".join([
    " ".join(judgment_tags or []),
    judgment_title or "",
    " ".join(judgment_statutes or [])
  ]).lower()

  strong_topic_markers = {
    "land acquisition": ["land acquisition", "acquisition", "compensation"],
    "motor accident compensation": ["motor accident", "tribunal", "insurance"],
    "preventive detention": ["detention", "detenu", "preventive detention"],
    "specific performance": ["specific performance", "agreement for sale"],
    "tax assessment": ["income tax", "assessment", "assessee"],
    "bail": ["bail", "custody"],
    "environmental clearance": ["environment", "pollution", "clearance"],
  }

  keywords = strong_topic_markers.get(topic, [])
  if not keywords:
    return 0.0

  hits = sum(1 for kw in keywords if kw in blob)

  if hits == 0:
    return -0.08

  return 0.0


def build_petition_holding_proxy(petition):
  grounds = join_list_field(petition.get("grounds_text"))
  prayer = join_list_field(petition.get("prayer_text"))
  issue = petition.get("issue_text", "")
  return f"{issue}\n{grounds}\n{prayer}".strip()

metadata = load_jsonl(EMBEDDINGS_DIR / "metadata.jsonl")

issue_index = faiss.read_index(str(EMBEDDINGS_DIR / "issue_index.faiss"))
facts_index = faiss.read_index(str(EMBEDDINGS_DIR / "facts_index.faiss"))
holding_index = faiss.read_index(str(EMBEDDINGS_DIR / "holding_index.faiss"))

def retrieve_and_rerank(
  petition,
  issue_emb,
  facts_emb,
  holding_emb
):
  
  issue_emb_np = np.asanyarray(
    issue_emb,
    dtype=np.float32
  )
  
  facts_emb_np = np.asanyarray(
    facts_emb,
    dtype=np.float32
  )
  
  holding_emb_np = np.asanyarray(
    holding_emb,
    dtype=np.float32
  )
  
  issue_scores, issue_ids = issue_index.search(issue_emb_np.reshape(1,-1), TOP_K_ISSUE)
  facts_scores, facts_ids = facts_index.search(facts_emb_np.reshape(1, -1), TOP_K_FACTS)
  holding_scores, holding_ids = holding_index.search(holding_emb_np.reshape(1, -1), TOP_K_HOLDING_PROXY)
  
  candidates = defaultdict(lambda: {
    "issue_sim": 0.0,
    "facts_sim": 0.0,
    "holding_sim": 0.0,
    "metadata": None,
  })
  
  for score, idx in zip(issue_scores[0], issue_ids[0]):
    if idx == -1:
      continue
    candidates[idx]["issue_sim"] = max(candidates[idx]["issue_sim"], cosine_from_ip(score))
    candidates[idx]["metadata"] = metadata[idx]

  for score, idx in zip(facts_scores[0], facts_ids[0]):
    if idx == -1:
      continue
    candidates[idx]["facts_sim"] = max(candidates[idx]["facts_sim"], cosine_from_ip(score))
    candidates[idx]["metadata"] = metadata[idx]

  for score, idx in zip(holding_scores[0], holding_ids[0]):
    if idx == -1:
      continue
    candidates[idx]["holding_sim"] = max(candidates[idx]["holding_sim"], cosine_from_ip(score))
    candidates[idx]["metadata"] = metadata[idx]
    
  reranked = []

  for idx, data in candidates.items():
    m = data["metadata"]

    judgment_statutes = m.get("statutes", [])
    judgment_sections = m.get("sections", [])
    judgment_case_type = m.get("case_type", "")
    judgment_court = m.get("court", "")
    judgment_tags = m.get("subject_tags", [])
    judgment_title = m.get("title", "")

    statute_score = overlap_score(
      petition.get("statutes"),
      judgment_statutes,
      normalizer=normalize_statute_name
    )

    section_score = overlap_score(
      petition.get("sections"),
      judgment_sections,
      normalizer=normalize_section_name
    )

    case_type_score = soft_case_type_score(
      petition.get("case_type"),
      judgment_case_type
    )

    court_score = court_match_score(
      petition.get("court"),
      judgment_court
    )

    topic_score = topic_match_scoring(
      petition.get("topic"),
      judgment_tags,
      judgment_title,
      judgment_statutes,
    )
    
    topic_penalty = topic_mismatch_penalty(
      petition.get("topic"),
      judgment_tags,
      judgment_title,
      judgment_statutes,
    )

    semantic_hits = sum([
      data["issue_sim"] > 0.0,
      data["facts_sim"] > 0.0,
      data["holding_sim"] > 0.0,
    ])

    final_score = (
      0.34 * data["issue_sim"] +
      0.28 * data["facts_sim"] +
      0.04 * data["holding_sim"] +
      0.16 * statute_score +
      0.08 * section_score +
      0.06 * max(case_type_score, 0.0) +
      0.02 * court_score +
      0.05 * topic_score
    )

    final_score += topic_penalty

    if semantic_hits >= 3:
      final_score += 0.08
    elif semantic_hits == 2:
      final_score += 0.04
    else:
      final_score -= 0.04
    
    if data["issue_sim"] < 0.50 and data["facts_sim"] < 0.50:
      final_score -= 0.12

    if case_type_score < 0:
      final_score += 0.12 * case_type_score

    if petition.get("statutes") and not judgment_statutes:
      final_score -= 0.05

    if petition.get("sections") and not judgment_sections:
      final_score -= 0.04

    if (
      data["issue_sim"] < 0.52 and
      data["facts_sim"] < 0.52 and
      statute_score == 0.0 and
      section_score == 0.0 and
      topic_score == 0.0
    ):
      continue
    
    reranked.append({
      "row_id": int(idx),
      "final_score": float(final_score),

      "issue_sim": float(data["issue_sim"]),
      "facts_sim": float(data["facts_sim"]),
      "holding_sim": float(data["holding_sim"]),

      "statute_overlap": float(statute_score),
      "section_overlap": float(section_score),

      "case_type_score": float(case_type_score),
      "court_score": float(court_score),
      "topic_score": float(topic_score),

      "semantic_hits": float(semantic_hits),

      "case_id": m.get("case_id"),
      "title": judgment_title,
      "outcome_label": m.get("outcome_label"),
      "case_type": judgment_case_type,
      "court": judgment_court,
      "source_path": m.get("source_path"),
    })

  reranked.sort(key=lambda x: x["final_score"], reverse=True)
  
  top_res = reranked[:FINAL_TOP_K]
  
  retrieved_cases = []
  
  for rank, item in enumerate(top_res, start=1):
    retrieved_cases.append({
      "rank": rank,
      "row_id": item["row_id"],
      "case_id": item["case_id"],
      "title": item["title"],
      "outcome_label": item["outcome_label"],
      "final_score": item["final_score"],

      "issue_sim": item["issue_sim"],
      "facts_sim": item["facts_sim"],
      "holding_sim": item["holding_sim"],

      "statute_overlap": item["statute_overlap"],
      "section_overlap": item["section_overlap"],

      "case_type_score": item["case_type_score"],
      "court_score": item["court_score"],
      "topic_score": item["topic_score"],

      "semantic_hits": item["semantic_hits"],

      "case_type": item["case_type"],
      "court": item["court"],
      "source_path": item["source_path"],
    })
    
  return {
    "petition": petition,
    "retrieved_cases": retrieved_cases
  }