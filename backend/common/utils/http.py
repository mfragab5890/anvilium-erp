# backend/common/utils/http.py
from __future__ import annotations
from typing import Any, Dict, Tuple
from flask import request, jsonify

def json_body() -> Dict[str, Any]:
    """Safe JSON parse that never raises."""
    return request.get_json(silent=True) or {}

def ok(payload: Any = None, status: int = 200) -> Tuple[Any, int]:
    return (jsonify({} if payload is None else payload), status)

def error(message: str, status: int = 400) -> Tuple[Any, int]:
    return (jsonify({"message": message}), status)

def pag_params(default_per: int = 20, max_per: int = 100) -> tuple[int, int]:
    """Read ?page & ?per_page with sane bounds."""
    try:
        page = int(request.args.get("page", 1))
    except Exception:
        page = 1
    try:
        per = int(request.args.get("per_page", default_per))
    except Exception:
        per = default_per
    page = page if page > 0 else 1
    per = min(max(per, 1), max_per)
    return page, per
