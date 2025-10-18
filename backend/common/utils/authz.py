# backend/common/utils/authz.py
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from common.utils.http import error

def superuser_required(fn):
    """
    Enforce superuser from JWT claims only (no DB calls).
    Works with 'role' == 'superuser' OR 'is_superuser' == True.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt() or {}
        if claims.get("role") == "superuser" or bool(claims.get("is_superuser")):
            return fn(*args, **kwargs)
        return error("Forbidden", 403)
    return wrapper
