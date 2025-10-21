from app import app
from extensions import db
from modules.users.models import Role, Permission
import json

USERS_PERMS = [
    dict(code="api:users:read",   name_en="Users: Read",   name_ar="المستخدمون: قراءة", type="api", method="GET",  path="/api/users"),
    dict(code="api:users:create", name_en="Users: Create", name_ar="المستخدمون: إضافة", type="api", method="POST", path="/api/users"),
]

def ensure_permissions():
    created = 0
    existing = {p.code: p for p in Permission.query.all()}
    for p in USERS_PERMS:
        if p["code"] not in existing:
            db.session.add(Permission(**p))
            created += 1
    if created:
        db.session.commit()
    return created

def grant_to_admin_and_super():
    # grant both perms to admin + superuser
    perms = {p.code: p for p in Permission.query.filter(Permission.code.in_([x["code"] for x in USERS_PERMS])).all()}
    changed = 0
    for role_code in ("admin", "superuser"):
        role = Role.query.filter_by(code=role_code).first()
        if not role:
            continue
        before = set(p.code for p in role.permissions)
        for c in perms.values():
            if c not in role.permissions:
                role.permissions.append(c)
                changed += 1
        if changed:
            db.session.add(role)
    if changed:
        db.session.commit()
    return changed

def main():
    """Main function for seeding permissions."""
    print("🔍 Checking database state for permissions...")

    try:
        c1 = ensure_permissions()
        print(f"   Created {c1} new permissions")

        c2 = grant_to_admin_and_super()
        print(f"   Added {c2} permission grants to roles")

        return {"created_permissions": c1, "grants_added": c2}
    except Exception as e:
        print(f"   ❌ Error in permissions seeding: {e}")
        return {"error": str(e), "created_permissions": 0, "grants_added": 0}

if __name__ == "__main__":
    with app.app_context():
        result = main()
        print(json.dumps(result, indent=2, ensure_ascii=False))
