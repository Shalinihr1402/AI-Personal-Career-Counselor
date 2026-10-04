"""
generate_embeddings.py
Generates 384-dimensional dense vector embeddings for all 1,016 O*NET careers
using the SentenceTransformer model 'all-MiniLM-L6-v2'.

Output:
- backend/data/career_embeddings.npy  (NumPy binary matrix: 1016 x 384)
- backend/data/career_index.json       (Metadata list linking matrix rows to career details)
"""

import os
import json
import time
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
CAREERS_JSON_PATH = DATA_DIR / "onet_careers.json"
EMBEDDINGS_NPY_PATH = DATA_DIR / "career_embeddings.npy"
INDEX_JSON_PATH = DATA_DIR / "career_index.json"

MODEL_NAME = "all-MiniLM-L6-v2"


def create_career_document(career: dict) -> str:
    """Create a rich, structured text representation of the career for semantic embedding."""
    title = career.get("title", "")
    field = career.get("field", "")
    desc = career.get("description", "")
    skills = ", ".join(career.get("skills", []))
    tools = ", ".join(career.get("software_tools", []))
    riasec = career.get("riasec_code", "")

    return (
        f"Career Title: {title}. "
        f"Industry Field: {field}. "
        f"Holland RIASEC Code: {riasec}. "
        f"Core Summary: {desc} "
        f"Required Workplace Skills: {skills}. "
        f"Key Software and Tools: {tools}."
    )


def generate_career_embeddings():
    if not CAREERS_JSON_PATH.exists():
        raise FileNotFoundError(f"Careers dataset not found at {CAREERS_JSON_PATH}. Run setup_onet.py first.")

    print(f"Loading careers from {CAREERS_JSON_PATH}...")
    with open(CAREERS_JSON_PATH, "r", encoding="utf-8") as f:
        careers = json.load(f)

    print(f"Loaded {len(careers)} careers. Preparing semantic documents...")
    documents = [create_career_document(c) for c in careers]
    metadata_index = [
        {
            "index": i,
            "soc_code": c.get("soc_code"),
            "slug": c.get("slug"),
            "title": c.get("title"),
            "field": c.get("field"),
            "riasec_code": c.get("riasec_code"),
            "salary_inr": c.get("salary_inr"),
            "skills": c.get("skills", []),
        }
        for i, c in enumerate(careers)
    ]

    print(f"Loading SentenceTransformer model '{MODEL_NAME}'...")
    from sentence_transformers import SentenceTransformer
    import numpy as np

    model = SentenceTransformer(MODEL_NAME)

    print(f"Encoding {len(documents)} career documents into 384-dimensional dense vectors...")
    start_time = time.time()
    embeddings = model.encode(
        documents,
        batch_size=64,
        show_progress_bar=True,
        normalize_embeddings=True,  # Normalized for instant cosine similarity via dot product
        convert_to_numpy=True
    )
    elapsed = time.time() - start_time
    print(f"Encoding complete in {elapsed:.2f} seconds!")
    print(f"Embeddings matrix shape: {embeddings.shape} (Type: {embeddings.dtype})")

    # Save NumPy array
    np.save(EMBEDDINGS_NPY_PATH, embeddings)
    print(f"Saved dense embeddings to {EMBEDDINGS_NPY_PATH} ({EMBEDDINGS_NPY_PATH.stat().st_size // 1024} KB)")

    # Save index mapping
    with open(INDEX_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata_index, f, indent=2, ensure_ascii=False)
    print(f"Saved career metadata index to {INDEX_JSON_PATH}")

    # Run quick sanity check
    print("\n--- Running Sanity Check Query ---")
    test_query = "I love designing beautiful visual user interfaces, user research, wireframing, and Figma"
    query_vec = model.encode([test_query], normalize_embeddings=True)
    scores = np.dot(embeddings, query_vec.T).flatten()
    top_indices = np.argsort(scores)[::-1][:3]

    print(f"Test Query: '{test_query}'")
    print("Top 3 Semantic Matches:")
    for rank, idx in enumerate(top_indices, start=1):
        c_meta = metadata_index[idx]
        print(f"  {rank}. {c_meta['title']} ({c_meta['field']}) — Similarity: {scores[idx]:.3f}")

    return len(careers)


if __name__ == "__main__":
    generate_career_embeddings()
