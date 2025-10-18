from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from ..users.models import User

def permission_required(code: str):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            uid = get_jwt_identity()
            user = User.query.get(uid)
            if not user:
                return jsonify({"message": "User not found"}), 404
            if user.is_admin or code in user.permissions():
                return fn(*args, **kwargs)
            return jsonify({"message": "Forbidden: missing permission", "required": code}), 403
        return wrapper
    return decorator
