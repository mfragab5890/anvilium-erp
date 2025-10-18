# backend/modules/auth/routes.py
from __future__ import annotations

from enum import Enum
from flask import Blueprint, request, jsonify
from flask_babel import gettext as _
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from sqlalchemy import func

from modules.users.models import User
from modules.users.schemas import UserOut
from common.utils import infer_modules_from_permissions
from .security import verify_password

bp = Blueprint("auth", __name__)

@bp.post("/login")
def login():
    payload = request.get_json() or {}
    raw_email = (payload.get("email") or "").strip()
    password = payload.get("password") or ""

    # case-insensitive lookup
    user = User.query.filter(func.lower(User.email) == raw_email.lower()).first()
    if not user or not verify_password(user.password_hash, password):
        return jsonify({"message": _("Invalid credentials")}), 401

    # get everything needed from the model
    auth_payload = user.as_auth_payload()
    claims = auth_payload.pop("claims")  # {"role": "...", "is_superuser": bool}

    # PyJWT v2: identity must be a string
    token = create_access_token(identity=str(user.id), additional_claims=claims)

    return jsonify({
        "access_token": token,
        **auth_payload,  # -> user, modules
    })


@bp.post("/logout")
@jwt_required()
def logout():
    # Stateless JWT; client should discard its token.
    return jsonify({"message": _("Logged out")})

@bp.get("/whoami")
@jwt_required()
def whoami():
    uid = get_jwt_identity()          # string
    user = User.query.get_or_404(int(uid))
    perms = user.permissions()
    modules = infer_modules_from_permissions(perms)
    data = UserOut().dump(user)
    return jsonify({"user": data, "modules": modules})
