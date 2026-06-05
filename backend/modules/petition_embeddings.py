from sentence_transformers import SentenceTransformer
import numpy as np

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

model = SentenceTransformer(MODEL_NAME)

def build_holding_proxy(petition):
  grounds = petition.get("grounds_text", [])
  prayer = petition.get("prayer_text", [])
  
  if not isinstance(grounds, list):
    grounds = [str(grounds)]
    
  if not isinstance(prayer, list):
    prayer = [str(prayer)]
  
  issue = petition.get("issue_text", "")

  return "\n".join([
    issue,
    " ".join(grounds),
    " ".join(prayer)
  ]).strip()

def create_embeddings(petition):
  
  issue_text = petition.get(
    "issue_text",
    ""
  ).strip()
  
  facts_text = petition.get(
    "facts_text",
    ""
  ).strip()
  
  holding_text = build_holding_proxy(petition)
  
  issue_emb = model.encode(
    issue_text,
    convert_to_numpy=True,
    normalize_embeddings=True
  ).astype(np.float32)

  facts_emb = model.encode(
    facts_text,
    convert_to_numpy=True,
    normalize_embeddings=True
  ).astype(np.float32)

  holding_emb = model.encode(
    holding_text,
    convert_to_numpy=True,
    normalize_embeddings=True
  ).astype(np.float32)

  return {
    "issue_embedding": issue_emb,
    "facts_embedding": facts_emb,
    "holding_embedding": holding_emb,
  }