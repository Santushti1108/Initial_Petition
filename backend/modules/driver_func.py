import joblib
import pandas as pd
from pathlib import Path

from petition_extractor import extract_petition_fields
from petition_embeddings import create_embeddings
from retrieval_and_rerank import retrieve_and_rerank
from petition_predict_schema import build_pred_dataset

MODEL_PATH = Path(r"D:\College\8th sem\final_yr_proj\Initial_Petition\backend\modules\petition_prediction.pkl")
PRE_MODEL_PATH = Path(r"D:\College\8th sem\final_yr_proj\Initial_Petition\backend\modules\preprocessor.pkl")

model = joblib.load(MODEL_PATH)
preprocessor = joblib.load(PRE_MODEL_PATH)

FEATURE_ORDER = [
  "topic",
  "case_type",
  "court",
  "jurisdiction",
  "relief_type",

  "top1_final_score",
  "top2_final_score",
  "top1_top2_score_gap",

  "top3_final_score_mean",
  "top5_final_score_mean",

  "mean_top3_issue_similarity",
  "mean_top3_fact_similarity",
  "mean_top5_holding_similarity",

  "same_statute_match_count",
  "same_section_match_count",

  "num_cases_with_semantic_hits_ge_2",
  "num_cases_with_statute_overlap_gt_0",
  "num_cases_with_section_overlap_gt_0",

  "pct_allowed",
  "pct_rejected",
  "pct_partly_allowed",

  "unique_outcome_count",
  "outcome_agreement_score"
]

def predict_petition_outcome(pdf_path):
  petition = extract_petition_fields(pdf_path)

  # ----------------------------------
  # 2. Create embeddings
  # ----------------------------------

  embeddings = create_embeddings(
    petition
  )

  # ----------------------------------
  # 3. Retrieve + rerank
  # ----------------------------------

  retrieval_result = retrieve_and_rerank(
    petition,
    embeddings["issue_embedding"],
    embeddings["facts_embedding"],
    embeddings["holding_embedding"]
  )

  retrieved_cases = retrieval_result[
    "retrieved_cases"
  ]

  # ----------------------------------
  # 4. Build prediction features
  # ----------------------------------

  features = build_pred_dataset(
    petition,
    retrieved_cases
  )

  # ----------------------------------
  # 5. Build dataframe
  # ----------------------------------

  X = pd.DataFrame(
    [[features[col] for col in FEATURE_ORDER]],
    columns=FEATURE_ORDER
  )
  
  X_transformed = preprocessor.transform(X)

  # ----------------------------------
  # 6. Predict
  # ----------------------------------

  prediction = model.predict(X_transformed)[0]

  # ----------------------------------
  # 7. Confidence
  # ----------------------------------

  confidence = None

  if hasattr(model, "predict_proba"):

    probs = model.predict_proba(X_transformed)[0]

    confidence = float(
      probs.max()
    )

  # ----------------------------------
  # 8. Return everything
  # ----------------------------------

  return {
    "prediction": prediction,
    "confidence": round(
      confidence * 100,
      2
    ) if confidence is not None else None,

    "petition": petition,

    "retrieved_cases": retrieved_cases,

    "features": features
  }
  
if __name__ == "__main__":

  pdf_path = r"D:\College\8th sem\final_yr_proj\writ_petition.pdf"

  result = predict_petition_outcome(
    pdf_path
  )

  print("\nPrediction:")
  print(result["prediction"])

  print("\nConfidence:")
  print(result["confidence"], "%")