# modules/hr/utils.py
from .models import Employee, DocumentType, EmployeeDocument

# --------- helpers (used by detail endpoints) ---------
def employee_to_dict(e: Employee) -> dict:
    return {
        "id": e.id,
        "code": e.code,
        "first_name": e.first_name,
        "last_name": e.last_name,
        "email": e.email,
        "phone": getattr(e, "phone", None),
        "position": getattr(e, "position", None),
        "branch_id": getattr(e, "branch_id", None),
        "is_active": getattr(e, "is_active", True),
        "hire_date": getattr(e, "hire_date", None).isoformat() if getattr(e, "hire_date", None) else None,
        "termination_date": getattr(e, "termination_date", None).isoformat() if getattr(e, "termination_date", None) else None,
        "salary_monthly": str(getattr(e, "salary_monthly", None)) if getattr(e, "salary_monthly", None) is not None else None,
        "nationality": getattr(e, "nationality", None),
        "dob": getattr(e, "dob", None).isoformat() if getattr(e, "dob", None) else None,
        "meta": getattr(e, "meta", None),
        "created_at": e.created_at.isoformat() if getattr(e, "created_at", None) else None,
        "updated_at": e.updated_at.isoformat() if getattr(e, "updated_at", None) else None,
    }

def doctype_to_dict(t: DocumentType) -> dict:
    return {
        "id": t.id, "code": t.code, "name_en": t.name_en, "name_ar": t.name_ar,
        "category": getattr(t, "category", "employee"),
        "requires_expiry": getattr(t, "requires_expiry", True),
        "default_validity_days": getattr(t, "default_validity_days", None),
        "remind_before_days": getattr(t, "remind_before_days", None),
        "remind_every_days": getattr(t, "remind_every_days", None),
        "field_schema": getattr(t, "field_schema", None),
        "is_active": getattr(t, "is_active", True),
        "created_at": t.created_at.isoformat() if getattr(t, "created_at", None) else None,
        "updated_at": t.updated_at.isoformat() if getattr(t, "updated_at", None) else None,
    }

def doc_to_dict(d: EmployeeDocument) -> dict:
    return {
        "id": d.id,
        "employee_id": d.employee_id,
        "document_type_id": d.document_type_id,
        "file_name": getattr(d, "file_name", None),
        "file_path": getattr(d, "file_path", None),
        "issued_date": getattr(d, "issued_date", None).isoformat() if getattr(d, "issued_date", None) else None,
        "expiry_date": getattr(d, "expiry_date", None).isoformat() if getattr(d, "expiry_date", None) else None,
        "is_expirable": getattr(d, "is_expirable", True),
        "is_active": getattr(d, "is_active", True),
        "notifications_muted": getattr(d, "notifications_muted", False),
        "muted_until": getattr(d, "muted_until", None).isoformat() if getattr(d, "muted_until", None) else None,
        "last_reminded_at": getattr(d, "last_reminded_at", None).isoformat() if getattr(d, "last_reminded_at", None) else None,
        "notes": getattr(d, "notes", None),
        "meta_values": getattr(d, "meta_values", None),
        "created_at": d.created_at.isoformat() if getattr(d, "created_at", None) else None,
        "updated_at": d.updated_at.isoformat() if getattr(d, "updated_at", None) else None,
    }
