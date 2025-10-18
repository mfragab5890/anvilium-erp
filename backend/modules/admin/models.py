# backend/modules/admin/models.py
import json, zlib
from datetime import datetime
from sqlalchemy import Index
from extensions import db


def _to_blob(obj, max_chars: int = 100_000):
    """Serialize to JSON (fallback to str), truncate, then compress."""
    try:
        s = json.dumps(obj, ensure_ascii=False, default=str)
    except Exception:
        try:
            s = str(obj)
        except Exception:
            return None
    if s is None:
        return None
    if len(s) > max_chars:
        s = s[:max_chars] + f'... (truncated {len(s)-max_chars} chars)'
    return zlib.compress(s.encode("utf-8"))


def _from_blob(blob):
    if not blob:
        return None
    try:
        s = zlib.decompress(blob).decode("utf-8", errors="replace")
        try:
            return json.loads(s)
        except Exception:
            return s
    except Exception:
        return None


class Issue(db.Model):
    __tablename__ = "issues"

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    status = db.Column(db.String(20), default="open", nullable=False)

    # Request meta
    method = db.Column(db.String(10))
    url = db.Column(db.String(512), index=True)
    http_status = db.Column(db.Integer)

    # Reporter/user context
    note = db.Column(db.Text)
    user_id = db.Column(db.Integer, index=True)
    user_email = db.Column(db.String(255), index=True)
    user_name = db.Column(db.String(255))
    locale = db.Column(db.String(32))
    tz = db.Column(db.String(64))
    ua = db.Column(db.Text)
    route = db.Column(db.String(256))
    full_url = db.Column(db.Text)
    app_version = db.Column(db.String(64))
    pr_url = db.Column(db.String(512))
    request_blob  = db.Column(db.LargeBinary)
    response_blob = db.Column(db.LargeBinary)
    headers_blob  = db.Column(db.LargeBinary)

    __table_args__ = (
        Index("ix_issues_status_created", "status", "created_at"),
    )

    @classmethod
    def from_payload(cls, payload: dict):
        client = payload.get("client") or {}
        return cls(
            method      = payload.get("method"),
            url         = payload.get("url"),
            http_status = payload.get("status"),
            note        = payload.get("note"),
            user_id     = client.get("user_id"),
            user_email  = client.get("user_email"),
            user_name   = client.get("user_name"),
            locale      = client.get("locale"),
            tz          = client.get("tz"),
            ua          = client.get("ua"),
            route       = client.get("route"),
            full_url    = client.get("full_url"),
            app_version = client.get("app_version"),
            request_blob  = _to_blob(payload.get("request")),
            response_blob = _to_blob(payload.get("response")),
            headers_blob  = _to_blob(payload.get("headers")),
        )

    def to_summary(self) -> dict:
        """Small payload for Super Admin list."""
        return {
            "id": self.id,
            "created_at": (self.created_at.isoformat() + "Z"),
            "status": self.status,
            "method": self.method,
            "url": self.url,
            "http_status": self.http_status,
            "note": self.note,
            "pr_url": self.pr_url,
        }

    # Optional accessors for internal tools
    @property
    def request(self):  return _from_blob(self.request_blob)
    @property
    def response(self): return _from_blob(self.response_blob)
    @property
    def headers(self):  return _from_blob(self.headers_blob)
