from __future__ import annotations

import os
import unicodedata
from threading import Lock, Thread
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


_model: SentenceTransformer | None = None
_model_lock = Lock()


def get_model() -> SentenceTransformer:
    global _model
    if _model is not None:
        return _model

    import torch
    from sentence_transformers import SentenceTransformer

    with _model_lock:
        if _model is None:
            _model = SentenceTransformer(
                MODEL_NAME,
                device="cpu",
                model_kwargs={"dtype": torch.float16},
            )
            _model.eval()
    return _model


app = FastAPI(title="Vietnamese embedding service", version="1.0.0")


@app.on_event("startup")
def warm_model() -> None:
    Thread(target=get_model, name="embedding-model-warmup", daemon=True).start()


@app.api_route("/", methods=["GET", "HEAD"])
def root() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health")
def health() -> dict[str, str | int | bool]:
    return {
        "status": "ok" if _model is not None else "warming",
        "model": MODEL_NAME,
        "dimensions": 768,
        "model_loaded": _model is not None,
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
