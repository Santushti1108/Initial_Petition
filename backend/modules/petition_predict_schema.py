from collections import Counter

def safe_mean(values):
  values = [v for v in values if v is not None]
  return sum(values) / len(values) if values else 0.0

def get_top(cases, k):
  return cases[:k] if cases else []

def pct(count, total):
  return count / total if total > 0 else 0.0

def build_pred_dataset(petition, retrieve_cases):
  cases = retrieve_cases
  n = len(cases)

  top3 = get_top(cases, 3)
  top5 = get_top(cases, 5)
  top10 = get_top(cases, 10)

  top1_score = float(cases[0]["final_score"]) if n >= 1 else 0.0
  top2_score = float(cases[1]["final_score"]) if n >= 2 else 0.0

  outcome_counts = Counter()

  for case in top5:
    outcome = str(
      case.get("outcome_label", "")
    ).strip().upper()

    if outcome in {
      "ALLOWED",
      "REJECTED",
      "PARTLY_ALLOWED"
    }:
      outcome_counts[outcome] += 1

  total_outcomes = sum(
    outcome_counts.values()
  )

  features = {

    "topic":
      petition.get("topic"),

    "case_type":
      petition.get("case_type"),

    "court":
      petition.get("court"),

    "jurisdiction":
      petition.get("jurisdiction"),

    "relief_type":
      petition.get("relief_type"),

    "top1_final_score":
      top1_score,

    "top2_final_score":
      top2_score,

    "top1_top2_score_gap":
      top1_score - top2_score,

    "top3_final_score_mean":
      safe_mean([
        float(c.get("final_score", 0.0))
        for c in top3
      ]),

    "top5_final_score_mean":
      safe_mean([
        float(c.get("final_score", 0.0))
        for c in top5
      ]),

    "mean_top3_issue_similarity":
      safe_mean([
        float(c.get("issue_sim", 0.0))
        for c in top3
      ]),

    "mean_top3_fact_similarity":
      safe_mean([
        float(c.get("facts_sim", 0.0))
        for c in top3
      ]),

    "mean_top5_holding_similarity":
      safe_mean([
        float(c.get("holding_sim", 0.0))
        for c in top5
      ]),

    "same_statute_match_count":
      sum(
        1
        for c in top10
        if float(
          c.get("statute_overlap", 0.0)
        ) > 0
      ),

    "same_section_match_count":
      sum(
        1
        for c in top10
        if float(
          c.get("section_overlap", 0.0)
        ) > 0
      ),

    "num_cases_with_semantic_hits_ge_2":
      sum(
        1
        for c in top10
        if int(
          c.get("semantic_hits", 0)
        ) >= 2
      ),

    "num_cases_with_statute_overlap_gt_0":
      sum(
        1
        for c in top10
        if float(
          c.get("statute_overlap", 0.0)
        ) > 0
      ),

    "num_cases_with_section_overlap_gt_0":
      sum(
        1
        for c in top10
        if float(
          c.get("section_overlap", 0.0)
        ) > 0
      ),

    "pct_allowed":
      pct(
        outcome_counts.get("ALLOWED", 0),
        total_outcomes
      ),

    "pct_rejected":
      pct(
        outcome_counts.get("REJECTED", 0),
        total_outcomes
      ),

    "pct_partly_allowed":
      pct(
        outcome_counts.get(
          "PARTLY_ALLOWED",
          0
        ),
        total_outcomes
      ),

    "unique_outcome_count":
      len(outcome_counts),

    "outcome_agreement_score":
      (
        max(outcome_counts.values())
        / total_outcomes
      )
      if total_outcomes > 0
      else 0.0,
  }
  
  return features

