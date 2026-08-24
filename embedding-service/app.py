from __future__ import annotations

import os
import unicodedata
from functools import lru_cache
from typing import TYPE_CHECKING

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer

MODEL_NAME = os.getenv(
    "MODEL_NAME", "bkai-foundation-models/vietnamese-bi-encoder"
)


class EmbedRequest(BaseModel):
    texts: list[str] = Field(min_length=1, max_length=50)


class EmbedResponse(BaseModel):
    embeddings: list[list[float]]


@lru_cache(maxsize=1)
def get_model() -> SentenceTransformer:
    import torch
    from sentence_transformers import SentenceTransformer

    model = SentenceTransformer(MODEL_NAME, device="cpu")
    quantized_model = torch.quantization.quantize_dynamic(
        model,
        {torch.nn.Linear},
        dtype=torch.qint8,
    )
    quantized_model.eval()
    return quantized_model


app = FastAPI(title="Vietnamese embedding service", version="1.0.0")


@app.get("/health")
def health() -> dict[str, str | int]:
    model = get_model()
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "dimensions": model.get_sentence_embedding_dimension(),
    }


@app.post("/embed", response_model=EmbedResponse)
def embed(request: EmbedRequest) -> EmbedResponse:
    from pyvi import ViTokenizer

    if any(not text.strip() for text in request.texts):
        raise HTTPException(status_code=422, detail="texts must not contain empty strings")
    tokenized = [
        ViTokenizer.tokenize(unicodedata.normalize("NFC", text))
        for text in request.texts
    ]
    vectors = get_model().encode(
        tokenized,
        batch_size=min(32, len(tokenized)),
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return EmbedResponse(embeddings=vectors.tolist())
