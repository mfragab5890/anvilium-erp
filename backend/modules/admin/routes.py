# backend/modules/admin/routes.py
from __future__ import annotations
from flask import Blueprint, request
from sqlalchemy import desc, asc
from extensions import db
from common.utils.http import json_body, ok, error, pag_params
from common.utils.authz import superuser_required
from .models import Issue
from flask_jwt_extended import jwt_required
from modules.core.models import AppModule as Module, AppModuleTab

bp = Blueprint("admin", __name__, url_prefix="/admin")

# -------- issues (create is open to any logged-in/optional; listing is superuser-only) -------- #

@bp.post("/issues")
@jwt_required(optional=True)   # allow report from any session; keep optional if you want anon reports
def create_issue():
    body = json_body()
    client = (body.get("client") or {}) if hasattr(body, "get") else {}
    client.setdefault("ua", request.headers.get("User-Agent"))
    client.setdefault("route", request.headers.get("X-Client-Route"))
    client.setdefault("full_url", request.headers.get("X-Client-URL"))
    client.setdefault("locale", request.headers.get("X-Client-Locale"))
    client.setdefault("app_version", request.headers.get("X-App-Version"))

    issue = Issue.from_payload({
        "method": body.get("method") if hasattr(body, "get") else None,
        "url": body.get("url") if hasattr(body, "get") else None,
        "status": (body.get("status") if hasattr(body, "get") else None) or 500,
        "note": ((body.get("note") if hasattr(body, "get") else "") or "").strip() or None,
        "client": client,
        "request": body.get("request") if hasattr(body, "get") else None,
        "response": body.get("response") if hasattr(body, "get") else None,
        "headers": body.get("headers") if hasattr(body, "get") else None,
    })
    db.session.add(issue)
    db.session.commit()
    return ok({"id": issue.id, "created_at": issue.created_at.isoformat() + "Z"}, 201)


@bp.get("/issues")
@jwt_required()
@superuser_required
def list_issues():
    status = request.args.get("status")
    page, per_page = pag_params()
    q = Issue.query
    if status:
        q = q.filter(Issue.status == status)
    total = q.count()
    items = (
        q.order_by(desc(Issue.created_at))
         .offset((page - 1) * per_page)
         .limit(per_page)
         .all()
    )
    return ok({"items": [i.to_summary() for i in items],
               "page": page, "per_page": per_page, "total": total})


@bp.get("/issues/<int:issue_id>")
@jwt_required()
@superuser_required
def get_issue(issue_id: int):
    issue = Issue.query.get(issue_id)
    if not issue:
        return error("Not found", 404)
    data = issue.to_summary()
    data["request"] = issue.request
    data["response"] = issue.response
    data["headers"] = issue.headers
    return ok(data)


@bp.patch("/issues/<int:issue_id>")
@jwt_required()
@superuser_required
def update_issue(issue_id: int):
    body = json_body()
    issue = Issue.query.get(issue_id)
    if not issue:
        return error("Not found", 404)
    if "status" in body:
        new_status = body["status"]
        if new_status not in {"open", "in_progress", "resolved", "ignored"}:
            return error("Invalid status", 400)
        issue.status = new_status
    if "pr_url" in body:
        issue.pr_url = (body.get("pr_url") or "").strip() or None
    if "note" in body:
        issue.note = (body.get("note") or "").strip() or None
    db.session.commit()
    return ok(issue.to_summary())

# ----------------------------- modules (superuser-only) ----------------------------- #

@bp.get("/modules")
@jwt_required()
@superuser_required
def list_modules():
    items = Module.query.order_by(Module.code.asc()).all()
    return ok([m.to_dict() for m in items])


@bp.post("/modules")
@jwt_required()
@superuser_required
def create_module():
    body = json_body()
    m = Module(
        code=(body.get("code") or "").strip(),
        name_en=body.get("name_en"),
        name_ar=body.get("name_ar"),
        is_active=bool(body.get("is_active", True)),
        is_locked=bool(body.get("is_locked", False)),
    )
    db.session.add(m)
    db.session.commit()
    return ok(m.to_dict(), 201)


@bp.put("/modules/<string:code>")
@jwt_required()
@superuser_required
def update_module(code: str):
    m = Module.query.filter_by(code=code).first()
    if not m:
        return error("Not found", 404)
    body = json_body()
    for f in ("name_en", "name_ar", "is_active", "is_locked"):
        if f in body:
            setattr(m, f, body[f])
    db.session.commit()
    return ok(m.to_dict())


# ---------- Tabs for a module ----------
@bp.get("/modules/<string:module_code>/tabs")
@jwt_required()
@superuser_required
def list_tabs(module_code: str):
    mod = Module.query.filter_by(code=module_code).first()
    if not mod:
        return error("Module not found", 404)
    tabs = (
        AppModuleTab.query
        .filter_by(module_code=module_code)
        .order_by(asc(AppModuleTab.sort_order), asc(AppModuleTab.code))
        .all()
    )
    return ok([t.to_dict() for t in tabs])


@bp.post("/modules/<string:module_code>/tabs")
@jwt_required()
@superuser_required
def create_tab(module_code: str):
    mod = Module.query.filter_by(code=module_code).first()
    if not mod:
        return error("Module not found", 404)
    body = json_body()
    t = AppModuleTab(
        module_code=module_code,
        code=(body.get("code") or "").strip(),
        name_en=body.get("name_en") or "",
        name_ar=body.get("name_ar"),
        is_active=bool(body.get("is_active", True)),
        is_locked=bool(body.get("is_locked", False)),
        sort_order=int(body.get("sort_order", 0)),
    )
    db.session.add(t)
    db.session.commit()
    return ok(t.to_dict(), 201)


@bp.put("/modules/<string:module_code>/tabs/<string:tab_code>")
@jwt_required()
@superuser_required
def update_tab(module_code: str, tab_code: str):
    t = AppModuleTab.query.filter_by(module_code=module_code, code=tab_code).first()
    if not t:
        return error("Tab not found", 404)
    body = json_body()
    for f in ("name_en","name_ar","is_active","is_locked","sort_order"):
        if f in body:
            setattr(t, f, body[f])
    db.session.commit()
    return ok(t.to_dict())


# ---------- NEW: modules tree (for FE navigation, not superuser-only) ----------
@bp.get("/modules/tree")
@jwt_required()  # let any authenticated user load their navigation tree (filtered to active)
def modules_tree():
    """
    Returns modules -> tabs in a FE-friendly shape.
    Supports ?include=tabs[,sections] (sections reserved for future use).
    Only active modules/tabs are returned. Sorting by sort_order then code when available.
    """
    include = (request.args.get("include") or "").lower().split(",")
    include_tabs = "tabs" in include
    include_sections = "sections" in include  # placeholder for future extension

    # Order by sort_order if present on the model, then by code
    has_mod_sort = hasattr(Module, "sort_order")
    mod_order = [asc(Module.sort_order)] if has_mod_sort else []
    mod_order.append(asc(Module.code))

    modules_q = Module.query.filter_by(is_active=True).order_by(*mod_order)
    modules = modules_q.all()

    def module_node(m: Module) -> dict:
        node = {
            "code": m.code,
            "name": getattr(m, "name_en", None) or m.code,
            "icon": getattr(m, "icon", None),
            "sort_order": getattr(m, "sort_order", 0),
            "is_locked": getattr(m, "is_locked", False),
        }
        if include_tabs:
            has_tab_sort = hasattr(AppModuleTab, "sort_order")
            tab_order = [asc(AppModuleTab.sort_order)] if has_tab_sort else []
            tab_order.append(asc(AppModuleTab.code))
            tabs_q = (
                AppModuleTab.query
                .filter_by(module_code=m.code, is_active=True)
                .order_by(*tab_order)
            )
            tabs = []
            for t in tabs_q.all():
                tab_node = {
                    "code": t.code,
                    "name": getattr(t, "name_en", None) or t.code,
                    "sort_order": getattr(t, "sort_order", 0),
                    "is_locked": getattr(t, "is_locked", False),
                }
                if include_sections:
                    # sections are not modeled yet; reserve the field
                    tab_node["sections"] = []
                tabs.append(tab_node)
            node["tabs"] = tabs
        return node

    data = {"modules": [module_node(m) for m in modules]}
    return ok(data)
