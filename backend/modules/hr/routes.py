# modules/hr/routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from .models import Employee, DocumentType, EmployeeDocument
from .utils import employee_to_dict, doctype_to_dict, doc_to_dict
from .schemas import EmployeeOut, EmployeeListOut
from ..auth.permissions import permission_required
from modules.core.pagination import parse_pagination_args, paginate, page_to_dict

bp = Blueprint("hr", __name__)

# --------- Employees ---------
@bp.route("/employees/", methods=["GET"], strict_slashes=False)  # accepts /employees and /employees/
@jwt_required()
# @permission_required("api:hr:employees:read")
def list_employees():
    """
    Query params:
      q: search term (code/first/last/email)
      branch: branch id or code; 'ALL' or empty = no filter
      page: 1-based (default 1)
      size: page size (default 50, max from core.constants)
      order: name_asc | name_desc | (default newest)
    """
    page, size = parse_pagination_args()
    q = (request.args.get("q") or "").strip()
    branch = (request.args.get("branch") or "").strip()
    order = (request.args.get("order") or "").strip() or None

    query = Employee.list_for_api(q=q, branch=branch, order=order)
    p = paginate(query, page, size)
    data = EmployeeOut(many=True).dump(p.items)
    # keep old keys + pages for consistency
    return jsonify({**page_to_dict(p, data)}), 200


@bp.post("/employees")
@jwt_required()
# @permission_required("api:hr:employees:create")
def create_employee():
    data = request.get_json() or {}
    e = Employee(
        code=data.get("code"),
        first_name=data["first_name"],
        last_name=data["last_name"],
        email=data.get("email"),
        phone=data.get("phone"),
        position=data.get("position"),
        branch_id=data.get("branch_id"),
        hire_date=data.get("hire_date"),
        termination_date=data.get("termination_date"),
        is_active=data.get("is_active", True),
        salary_monthly=data.get("salary_monthly", 0),
        nationality=data.get("nationality"),
        dob=data.get("dob"),
        meta=data.get("meta"),
    )
    db.session.add(e); db.session.commit()
    return EmployeeOut().dump(e), 201


@bp.get("/employees/<int:eid>")
@jwt_required()
# @permission_required("api:hr:employees:read")
def get_employee(eid: int):
    e = Employee.query.get_or_404(eid)
    return EmployeeOut().dump(e), 200


@bp.patch("/employees/<int:eid>")
@jwt_required()
# @permission_required("api:hr:employees:update")
def update_employee(eid: int):
    e = Employee.query.get_or_404(eid)
    data = request.get_json() or {}
    for f in [
        "code", "first_name", "last_name", "email", "phone", "position",
        "branch_id", "hire_date", "termination_date", "is_active",
        "salary_monthly", "nationality", "dob", "meta"
    ]:
        if f in data:
            setattr(e, f, data[f])
    db.session.commit()
    return EmployeeOut().dump(e), 200


@bp.delete("/employees/<int:eid>")
@jwt_required()
# @permission_required("api:hr:employees:delete")
def delete_employee(eid: int):
    e = Employee.query.get_or_404(eid)
    db.session.delete(e); db.session.commit()
    return {"deleted": True}, 200


# --------- Document Types ---------
@bp.get("/document-types")
@jwt_required()
# @permission_required("api:hr:documents:read")
def list_document_types():
    items = DocumentType.query.order_by(DocumentType.name_en.asc()).all()
    return jsonify([doctype_to_dict(t) for t in items]), 200


@bp.post("/document-types")
@jwt_required()
# @permission_required("api:hr:documents:create")
def create_document_type():
    data = request.get_json() or {}
    t = DocumentType(
        code=data["code"],
        name_en=data["name_en"],
        name_ar=data.get("name_ar"),
        category=data.get("category", "employee"),
        requires_expiry=data.get("requires_expiry", True),
        default_validity_days=data.get("default_validity_days"),
        remind_before_days=data.get("remind_before_days"),
        remind_every_days=data.get("remind_every_days"),
        field_schema=data.get("field_schema"),
        is_active=data.get("is_active", True),
    )
    db.session.add(t); db.session.commit()
    return doctype_to_dict(t), 201


# --------- Employee Documents ---------
@bp.get("/documents")
@jwt_required()
# @permission_required("api:hr:documents:read")
def list_documents():
    eid = request.args.get("employee_id", type=int)
    dtype = request.args.get("document_type_id", type=int)
    active = request.args.get("active", type=int)  # 1 or 0
    qry = EmployeeDocument.query
    if eid:
        qry = qry.filter_by(employee_id=eid)
    if dtype:
        qry = qry.filter_by(document_type_id=dtype)
    if active is not None:
        qry = qry.filter_by(is_active=bool(active))
    items = qry.order_by(EmployeeDocument.id.desc()).limit(200).all()
    return jsonify([doc_to_dict(d) for d in items]), 200


@bp.post("/documents")
@jwt_required()
# @permission_required("api:hr:documents:create")
def create_document():
    data = request.get_json() or {}
    d = EmployeeDocument(
        employee_id=data["employee_id"],
        document_type_id=data["document_type_id"],
        file_name=data["file_name"],
        file_path=data["file_path"],
        issued_date=data.get("issued_date"),
        expiry_date=data.get("expiry_date"),
        is_expirable=data.get("is_expirable", True),
        is_active=data.get("is_active", True),
        notifications_muted=data.get("notifications_muted", False),
        muted_until=data.get("muted_until"),
        last_reminded_at=data.get("last_reminded_at"),
        notes=data.get("notes"),
        meta_values=data.get("meta_values"),
    )
    db.session.add(d); db.session.commit()
    return doc_to_dict(d), 201


@bp.patch("/documents/<int:did>")
@jwt_required()
# @permission_required("api:hr:documents:update")
def update_document(did: int):
    d = EmployeeDocument.query.get_or_404(did)
    data = request.get_json() or {}
    for f in [
        "employee_id","document_type_id","file_name","file_path",
        "issued_date","expiry_date","is_expirable","is_active",
        "notifications_muted","muted_until","last_reminded_at",
        "notes","meta_values"
    ]:
        if f in data:
            setattr(d, f, data[f])
    db.session.commit()
    return doc_to_dict(d), 200


# Optional: expiring soon
@bp.get("/expiring-documents")
@jwt_required()
# @permission_required("api:hr:documents:read")
def expiring_documents():
    from datetime import timedelta
    days = request.args.get("days", default=30, type=int)
    cutoff = date.today() + timedelta(days=days)
    items = EmployeeDocument.query.filter(
        EmployeeDocument.expiry_date.isnot(None),
        EmployeeDocument.expiry_date <= cutoff
    ).order_by(EmployeeDocument.expiry_date.asc()).limit(200).all()
    return jsonify([doc_to_dict(d) for d in items]), 200
