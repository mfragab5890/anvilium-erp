from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from modules.core.pagination import parse_pagination_args, paginate, page_to_dict
from .models import User, Role
from .schemas import UserOut
from extensions import db
from ..auth.permissions import permission_required
from common.utils import infer_modules_from_permissions

bp = Blueprint("users", __name__)


@bp.get("/me")
@jwt_required()
def me():
    uid = get_jwt_identity()
    user = User.query.get_or_404(int(uid))
    perms = user.permissions()
    modules = infer_modules_from_permissions(perms)
    data = UserOut().dump(user)
    return jsonify({"user": data, "modules": modules})


@bp.route("/", methods=["GET"], strict_slashes=False)
@jwt_required()
@permission_required("api:users:read")
def list_users():
    page, size = parse_pagination_args()
    q = request.args.get("q")
    order = request.args.get("order")
    query = User.list_for_api(q=q, order=order)
    paged = paginate(query, page, size)
    data = UserOut(many=True).dump(paged.items)
    return jsonify(page_to_dict(paged, data)), 200


@bp.post("/")
@jwt_required()
@permission_required("api:users:create")
def create_user():
    payload = request.get_json() or {}
    role_code = payload.get("role_code") or "employee"
    role = Role.query.filter_by(code=role_code).first()
    if not role:
        return jsonify({"message": "Unknown role"}), 400
    u = User(
        email=payload["email"],
        first_name=payload.get("first_name", "New"),
        last_name=payload.get("last_name", "User"),
        is_active=True,
        role=role,
    )
    u.set_password(payload.get("password", "changeme123"))
    db.session.add(u); db.session.commit()
    return UserOut().dump(u), 201
