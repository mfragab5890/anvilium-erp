from __future__ import annotations

from datetime import datetime, date
import json
from typing import Iterable, Mapping

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as psql
from sqlalchemy.dialects import mysql as mysql_dialect

from app import app
from extensions import db

# --- import models you already have ---
from modules.core.models import AppModule, Branch, NationalHoliday, UserBranch, SeedRegistry
from modules.users.models import Role, Permission, User
from modules.hr.models import DocumentType
from modules.auth.security import hash_password

SEED_KEY = "phase1_2025_08_20"

def _seed_already_completed() -> bool:
    """
    Check registry; rollback immediately to clear any implicit txn
    that Session.get() may have started under this scoped session.
    """
    rec = db.session.get(SeedRegistry, SEED_KEY)
    # Release txn so later we can start a single all-or-nothing commit cleanly
    db.session.rollback()
    return rec is not None

def _insert_seed_registry(details: dict):
    rec = SeedRegistry(key=SEED_KEY, completed_at=datetime.utcnow(),
                       details=json.dumps(details, ensure_ascii=False))
    db.session.add(rec)

# -------------------------
# Bulk "insert ignore" helpers
# -------------------------
def _bulk_ignore_insert(model, rows: Iterable[Mapping], conflict_cols: list[str] | None = None):
    """
    Fast, idempotent batch insert that:
      - Postgres: ON CONFLICT DO NOTHING
      - MySQL:    INSERT IGNORE
      - SQLite:   INSERT OR IGNORE
    """
    if not rows:
        return 0

    table = sa.inspect(model).local_table
    dialect = db.engine.dialect.name
    inserted = 0

    if dialect == "postgresql":
        stmt = psql.insert(table).values(list(rows))
        if not conflict_cols:
            conflict_cols = _infer_conflict_cols(table) or []
        if conflict_cols:
            # For PostgreSQL with functional indexes, use the constraint name or DO NOTHING without columns
            try:
                stmt = stmt.on_conflict_do_nothing(index_elements=[table.c[c] for c in conflict_cols])
            except Exception:
                # Fallback: if column-based conflict fails, try constraint-name based
                print(f"   ⚠️  Column-based conflict failed, trying constraint-based...")
                stmt = stmt.on_conflict_do_nothing()
        else:
            stmt = stmt.on_conflict_do_nothing()
        res = db.session.execute(stmt)
        inserted = res.rowcount or 0

    elif dialect == "mysql":
        # MySQL: INSERT IGNORE
        stmt = mysql_dialect.insert(table).values(list(rows)).prefix_with("IGNORE")
        res = db.session.execute(stmt)
        inserted = res.rowcount or 0

    else:
        # SQLite/dev: INSERT OR IGNORE
        stmt = sa.insert(table).values(list(rows)).prefix_with("OR IGNORE")
        res = db.session.execute(stmt)
        inserted = res.rowcount or 0

    return inserted

def _infer_conflict_cols(table: sa.Table) -> list[str] | None:
    # prefer explicit UniqueConstraint(s)
    for uc in table.constraints:
        if isinstance(uc, sa.UniqueConstraint):
            cols = [c.name for c in uc.columns]
            if cols:
                return cols
    uniques = [c.name for c in table.columns if c.unique]
    return uniques or None

# -------------------------
# Seed payloads
# -------------------------
def _rows_app_modules():
    return [
        dict(code="users",      name_en="Users & Access",          name_ar="المستخدمون والصلاحيات", is_active=True,  is_locked=False),
        dict(code="hr",         name_en="HR (Employees)",          name_ar="الموارد البشرية",        is_active=True,  is_locked=False),
        dict(code="inventory",  name_en="Inventory & Maintenance", name_ar="المخزون والصيانة",       is_active=True,  is_locked=True),
        dict(code="proposals",  name_en="Proposals",               name_ar="العروض",                 is_active=True,  is_locked=True),
        dict(code="projects",   name_en="Projects",                name_ar="المشاريع",               is_active=True,  is_locked=True),
        dict(code="financials", name_en="Financials",              name_ar="المالية",                 is_active=True,  is_locked=True),
        dict(code="reports",    name_en="Analytics & Reports",     name_ar="التقارير",               is_active=True,  is_locked=True),
        dict(code="notify",     name_en="Notifications",           name_ar="الإشعارات",              is_active=True,  is_locked=True),
    ]

def _rows_branches():
    return [
        dict(code="RAK", name="Ras Al-Khaimah", is_active=True, is_ui_visible=True),
        dict(code="DXB", name="Dubai",          is_active=True, is_ui_visible=True),
        dict(code="FUJ", name="Fujairah",       is_active=True, is_ui_visible=True),
        dict(code="ALL", name="ALL",            is_active=True, is_ui_visible=False),  # backend-only
    ]

def _rows_document_types():
    return [
        dict(code="passport",  name_en="Passport",       name_ar="جواز السفر",      category="employee",
             requires_expiry=True, remind_before_days=30, remind_every_days=7,
             field_schema=[{"key":"passport_no","label_en":"Passport No","label_ar":"رقم الجواز","type":"text","required":True}]),
        dict(code="visa",      name_en="Residence Visa", name_ar="تأشيرة الإقامة",  category="employee",
             requires_expiry=True, remind_before_days=30, remind_every_days=7,
             field_schema=[{"key":"uid","label_en":"UID","label_ar":"رقم الهوية الموحد","type":"text","required":False}]),
        dict(code="eid",       name_en="Emirates ID",    name_ar="الهوية الإماراتية", category="employee",
             requires_expiry=True, remind_before_days=30, remind_every_days=7,
             field_schema=[{"key":"eid_no","label_en":"EID No","label_ar":"رقم الهوية","type":"text","required":True}]),
        dict(code="license",   name_en="Driver License", name_ar="رخصة القيادة",    category="employee",
             requires_expiry=True, remind_before_days=30, remind_every_days=7, field_schema=[]),
        dict(code="health_card", name_en="Health Card",  name_ar="بطاقة الصحة",     category="employee",
             requires_expiry=True, remind_before_days=30, remind_every_days=7, field_schema=[]),
        dict(code="contract",  name_en="Employment Contract", name_ar="عقد العمل",  category="employee",
             requires_expiry=False, remind_before_days=None, remind_every_days=None, field_schema=[]),
    ]

def _rows_holidays():
    return [
        dict(title="New Year", holiday_date=date(2025, 1, 1), city=None, editable=False, deletable=False),
        dict(title="Eid Al Fitr", holiday_date=date(2025, 3, 31), city=None, editable=False, deletable=False),
        dict(title="Local Foundation Day", holiday_date=date(2025, 6, 10), city="Ras Al-Khaimah", editable=True, deletable=True),
    ]

def _rows_permissions():
    return [
        dict(code="page:dashboard:view",  name_en="View Dashboard",      name_ar="عرض لوحة التحكم", type="page"),
        dict(code="page:hr:view",         name_en="View HR",             name_ar="عرض الموارد البشرية", type="page"),
        dict(code="page:documents:view",  name_en="View Documents",      name_ar="عرض المستندات", type="page"),
        dict(code="api:employees:read",   name_en="Employees: Read",     name_ar="الموظفون: قراءة", type="api", method="GET",  path="/api/employees"),
        dict(code="api:employees:write",  name_en="Employees: Write",    name_ar="الموظفون: تعديل", type="api", method="POST", path="/api/employees"),
        dict(code="api:docs:read",        name_en="Documents: Read",     name_ar="المستندات: قراءة", type="api", method="GET",  path="/api/employee-documents"),
        dict(code="api:docs:write",       name_en="Documents: Write",    name_ar="المستندات: تعديل", type="api", method="POST", path="/api/employee-documents"),
        dict(code="api:attendance:read",  name_en="Attendance: Read",    name_ar="الحضور: قراءة", type="api", method="GET",  path="/api/attendance"),
        dict(code="api:attendance:write", name_en="Attendance: Write",   name_ar="الحضور: تعديل", type="api", method="POST", path="/api/attendance"),
        dict(code="api:modules:toggle",   name_en="Toggle Modules",      name_ar="تفعيل/تعطيل الوحدات", type="api", method="POST", path="/api/modules/toggle"),
    ]

def _rows_roles():
    return [
        dict(code="admin",     name_en="Administrator", name_ar="مدير النظام",   is_editable=False),
        dict(code="superuser", name_en="Super User",    name_ar="المستخدم الخارق", is_editable=False),
    ]

def _rows_users():
    # dev defaults; rotate in prod
    return [
        dict(email="ADMIN@ANVILIUM",     first_name="Admin", last_name="User",
             password_hash=hash_password("ADMIN@ANVILIUM"),     is_active=True, role_code="admin"),
        dict(email="SUPERUSER@ANVILIUM", first_name="Super", last_name="User",
             password_hash=hash_password("SUPERUSER@ANVILIUM"), is_active=True, role_code="superuser"),
    ]

# -------------------------
# Seeding Steps (each idempotent)
# -------------------------
def seed_app_modules():
    return _bulk_ignore_insert(AppModule, _rows_app_modules(), conflict_cols=["code"])

def seed_branches():
    return _bulk_ignore_insert(Branch, _rows_branches(), conflict_cols=["code"])

def seed_document_types():
    return _bulk_ignore_insert(DocumentType, _rows_document_types(), conflict_cols=["code"])

def seed_holidays():
    return _bulk_ignore_insert(NationalHoliday, _rows_holidays())

def seed_permissions():
    return _bulk_ignore_insert(Permission, _rows_permissions(), conflict_cols=["code"])

def seed_roles():
    return _bulk_ignore_insert(Role, _rows_roles(), conflict_cols=["code"])

def _attach_role_ids_for_users(rows):
    role_by_code = {r.code: r.id for r in Role.query.all()}
    out = []
    for r in rows:
        rid = role_by_code.get(r["role_code"])
        if not rid:
            continue
        x = dict(r)
        x["role_id"] = rid
        x.pop("role_code", None)
        out.append(x)
    return out

def seed_users():
    # Re-fetch roles after they are seeded to get correct IDs
    role_by_code = {r.code: r.id for r in Role.query.all()}
    print(f"   Available roles: {role_by_code}")

    out = []
    for user_data in _rows_users():
        rid = role_by_code.get(user_data["role_code"])
        if not rid:
            print(f"   ⚠️  Role {user_data['role_code']} not found, skipping user {user_data['email']}")
            continue

        # Check if user already exists
        existing_user = User.query.filter_by(email=user_data["email"]).first()
        if existing_user:
            print(f"   ⚠️  User {user_data['email']} already exists, skipping")
            continue

        user_row = dict(user_data)
        user_row["role_id"] = rid
        user_row.pop("role_code", None)
        out.append(user_row)

    if not out:
        print("   ⚠️  No valid users to insert")
        return 0

    # Use simple insert instead of bulk insert for users to avoid constraint issues
    inserted = 0
    for user_row in out:
        try:
            db.session.add(User(**user_row))
            inserted += 1
        except Exception as e:
            print(f"   ❌ Failed to insert user {user_row['email']}: {e}")
            db.session.rollback()

    if inserted > 0:
        db.session.commit()
        print(f"   ✅ Successfully inserted {inserted} users")

    return inserted

def seed_user_branches_all():
    all_branch = Branch.query.filter_by(code="ALL").first()
    if not all_branch:
        return 0
    users = User.query.filter(User.email.in_(["ADMIN@ANVILIUM", "SUPERUSER@ANVILIUM"])).all()
    pairs = []
    for u in users:
        exists = db.session.query(UserBranch).filter_by(user_id=u.id, branch_id=all_branch.id).first()
        if not exists:
            pairs.append(dict(user_id=u.id, branch_id=all_branch.id,
                              created_at=datetime.utcnow(), updated_at=datetime.utcnow()))
    if not pairs:
        return 0
    return _bulk_ignore_insert(UserBranch, pairs, conflict_cols=["user_id", "branch_id"])

# -------------------------
# Orchestrate in one transaction
# -------------------------
def run_all() -> dict:
    """
    Run all seeding operations with comprehensive logging.
    """
    import os

    print("🔍 SEED DEBUG INFO:")
    print(f"   APP_ENV: {os.getenv('APP_ENV', 'NOT_SET')}")
    print(f"   DATABASE_URL: {os.getenv('DATABASE_URL', 'NOT_SET')[:50]}...")
    print(f"   Seed key: {SEED_KEY}")

    # Test database connection first
    try:
        print("🔗 Testing database connection...")
        # Simple connection test - try to execute a basic query
        db.session.execute(db.text("SELECT 1"))
        print("✅ Database connection successful!")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print(f"   Error type: {type(e).__name__}")
        raise

    # Check if already completed
    if _seed_already_completed():
        print(f"⚠️  Seed {SEED_KEY} already completed - skipping")
        return {"skipped": True, "key": SEED_KEY}

    print("🚀 Starting database seeding...")

    try:
        print("\n📊 COUNTS BEFORE SEEDING:")
        print(f"   Users: {User.query.count()}")
        print(f"   Roles: {Role.query.count()}")
        print(f"   Permissions: {Permission.query.count()}")
        print(f"   Branches: {Branch.query.count()}")
        print(f"   AppModules: {AppModule.query.count()}")

        summary = {}

        print("\n🔄 SEEDING OPERATIONS:")

        try:
            print("   Seeding app modules...")
            summary["modules"]        = seed_app_modules()
            print(f"   ✅ Modules seeded: {summary['modules']}")
        except Exception as e:
            print(f"   ❌ Modules seeding failed: {e}")
            summary["modules"] = 0

        try:
            print("   Seeding branches...")
            summary["branches"]       = seed_branches()
            print(f"   ✅ Branches seeded: {summary['branches']}")
        except Exception as e:
            print(f"   ❌ Branches seeding failed: {e}")
            summary["branches"] = 0

        try:
            print("   Seeding document types...")
            summary["doc_types"]      = seed_document_types()
            print(f"   ✅ Document types seeded: {summary['doc_types']}")
        except Exception as e:
            print(f"   ❌ Document types seeding failed: {e}")
            summary["doc_types"] = 0

        try:
            print("   Seeding holidays...")
            summary["holidays"]       = seed_holidays()
            print(f"   ✅ Holidays seeded: {summary['holidays']}")
        except Exception as e:
            print(f"   ❌ Holidays seeding failed: {e}")
            summary["holidays"] = 0

        try:
            print("   Seeding permissions...")
            summary["permissions"]    = seed_permissions()
            print(f"   ✅ Permissions seeded: {summary['permissions']}")
        except Exception as e:
            print(f"   ❌ Permissions seeding failed: {e}")
            summary["permissions"] = 0

        try:
            print("   Seeding roles...")
            summary["roles"]          = seed_roles()
            print(f"   ✅ Roles seeded: {summary['roles']}")
        except Exception as e:
            print(f"   ❌ Roles seeding failed: {e}")
            summary["roles"] = 0

        try:
            print("   Seeding users...")
            summary["users"]          = seed_users()
            print(f"   ✅ Users seeded: {summary['users']}")
        except Exception as e:
            print(f"   ❌ Users seeding failed: {e}")
            summary["users"] = 0

        try:
            print("   Seeding user branches...")
            summary["user_branches"]  = seed_user_branches_all()
            print(f"   ✅ User branches seeded: {summary['user_branches']}")
        except Exception as e:
            print(f"   ❌ User branches seeding failed: {e}")
            summary["user_branches"] = 0

        print("   Recording seed completion...")
        _insert_seed_registry({"summary": summary})

        print("\n💾 COMMITTING TO DATABASE...")
        try:
            db.session.commit()
            print("✅ Database transaction committed successfully!")
        except Exception as e:
            print(f"⚠️  Commit failed: {e}")
            print("   This might be due to failed operations - checking what's already in DB...")
            db.session.rollback()

        print("\n📊 COUNTS AFTER SEEDING:")
        print(f"   Users: {User.query.count()}")
        print(f"   Roles: {Role.query.count()}")
        print(f"   Permissions: {Permission.query.count()}")
        print(f"   Branches: {Branch.query.count()}")
        print(f"   AppModules: {AppModule.query.count()}")

        return {"skipped": False, "key": SEED_KEY, "summary": summary}
    except Exception as e:
        if "InvalidColumnReference" in str(e) or "ON CONFLICT" in str(e):
            print(f"⚠️  Database constraint error (continuing deployment): {e}")
            print("💡 This might be due to database schema mismatch - deployment will continue")
            # Still try to commit what we have
            try:
                db.session.commit()
                print("✅ Partial commit successful!")
            except Exception:
                db.session.rollback()
                print("❌ Rollback completed")
            return {"skipped": False, "key": SEED_KEY, "summary": summary, "error": str(e)}
        else:
            print(f"❌ CRITICAL ERROR during seeding: {e}")
            db.session.rollback()
            raise

if __name__ == "__main__":
    print("🚀 Starting database seeding... in init_seed.py")
    with app.app_context():
        result = run_all()
        print(json.dumps(result, indent=2, ensure_ascii=False))
