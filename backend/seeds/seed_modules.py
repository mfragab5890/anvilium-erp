from __future__ import annotations
from datetime import datetime
from app import app
from extensions import db
from modules.core.models import AppModule, AppModuleTab, SeedRegistry

# Canonical modules + order (codes lowercase). Tabs are minimal initial tabs per module.
MODULES = [
    # 10s – Access
    {"code": "users", "name_en": "Users & Access", "name_ar": "المستخدمون و الصلاحيات",
     "is_active": True, "is_locked": False, "sort_order": 10,
     "tabs": [
         {"code": "users", "name_en": "Users", "name_ar": "المستخدمون",
          "is_active": True, "is_locked": False, "sort_order": 10},
     ]},

    # 20s – People
    {"code": "hr", "name_en": "HR (Employees)", "name_ar": "الموارد البشرية",
     "is_active": True, "is_locked": False, "sort_order": 20,
     "tabs": [
         {"code": "employees", "name_en": "Employees", "name_ar": "الموظفون",
          "is_active": True, "is_locked": False, "sort_order": 10},
     ]},

    # 30s – CRM
    {"code": "clients", "name_en": "Clients", "name_ar": "العملاء",
     "is_active": True, "is_locked": True, "sort_order": 30,
     "tabs": [
         {"code": "clients", "name_en": "Clients", "name_ar": "العملاء",
          "is_active": False, "is_locked": True, "sort_order": 10},
     ]},

    # 40s – Sales
    {"code": "proposals", "name_en": "Proposals", "name_ar": "العروض",
     "is_active": True, "is_locked": True, "sort_order": 40,
     "tabs": [
         {"code": "proposals", "name_en": "Proposals", "name_ar": "العروض",
          "is_active": False, "is_locked": True, "sort_order": 10},
     ]},

    # 50s – Delivery
    {"code": "projects", "name_en": "Projects", "name_ar": "المشاريع",
     "is_active": True, "is_locked": True, "sort_order": 50,
     "tabs": [
         {"code": "projects", "name_en": "Projects", "name_ar": "المشاريع",
          "is_active": False, "is_locked": True, "sort_order": 10},
     ]},

    # 60s – Ops
    {"code": "inventory", "name_en": "Inventory & Maintenance", "name_ar": "المخزون و الصيانة",
     "is_active": True, "is_locked": True, "sort_order": 60,
     "tabs": [
         {"code": "items", "name_en": "Items", "name_ar": "الأصناف",
          "is_active": False, "is_locked": True, "sort_order": 10},
     ]},

    # 70s – Finance
    {"code": "financials", "name_en": "Financials", "name_ar": "المالية",
     "is_active": True, "is_locked": True, "sort_order": 70,
     "tabs": [
         {"code": "invoices", "name_en": "Invoices", "name_ar": "الفواتير",
          "is_active": False, "is_locked": True, "sort_order": 10},
         {"code": "expenses", "name_en": "Expenses", "name_ar": "المصروفات",
          "is_active": False, "is_locked": True, "sort_order": 20},
     ]},

    # 80s – Insights
    {"code": "reports", "name_en": "Analytics & Reports", "name_ar": "التقارير",
     "is_active": True, "is_locked": True, "sort_order": 80,
     "tabs": [
         {"code": "analytics", "name_en": "Analytics", "name_ar": "التحليلات",
          "is_active": False, "is_locked": True, "sort_order": 10},
     ]},

    # 90s – Messaging (keep code 'notify' to match current DB)
    {"code": "notify", "name_en": "Notifications", "name_ar": "الإشعارات",
     "is_active": True, "is_locked": True, "sort_order": 90,
     "tabs": [
         {"code": "notifications", "name_en": "Notifications", "name_ar": "الإشعارات",
          "is_active": False, "is_locked": True, "sort_order": 10},
     ]},

    # 100s – Files
    {"code": "documents", "name_en": "Documents", "name_ar": "المستندات",
     "is_active": True, "is_locked": True, "sort_order": 100,
     "tabs": [
         {"code": "documents", "name_en": "Documents", "name_ar": "المستندات",
          "is_active": False, "is_locked": True, "sort_order": 10},
     ]},

    # 110s – Admin
    {"code": "superuser", "name_en": "Super User", "name_ar": "المستخدم الخارق",
     "is_active": True, "is_locked": False, "sort_order": 110,
     "tabs": [
         {"code": "modules", "name_en": "Modules", "name_ar": "الوحدات",
          "is_active": True, "is_locked": False, "sort_order": 10},
     ]},
]

def seed_modules_and_tabs() -> None:
    # Drop ALL tabs then ALL modules to make DB the single source of truth
    db.session.query(AppModuleTab).delete()
    db.session.query(AppModule).delete()
    db.session.commit()

    # Insert modules in desired order with their tabs
    for m in MODULES:
        mod = AppModule(
            code=m["code"].strip().lower(),
            name_en=m.get("name_en") or m["code"].title(),
            name_ar=m.get("name_ar"),
            is_active=bool(m.get("is_active", True)),
            is_locked=bool(m.get("is_locked", False)),
            sort_order=int(m.get("sort_order", 0)),
        )
        db.session.add(mod)
        db.session.flush()

        for t in m.get("tabs", []):
            tab = AppModuleTab(
                module_code=mod.code,
                code=t["code"].strip().lower(),
                name_en=t.get("name_en") or t["code"].title(),
                name_ar=t.get("name_ar"),
                is_active=bool(t.get("is_active", True)),
                is_locked=bool(t.get("is_locked", False)),
                sort_order=int(t.get("sort_order", 0)),
            )
            db.session.add(tab)

    db.session.commit()

    # ✅ SQLAlchemy 2.x style: use Session.get instead of Query.get
    sr = db.session.get(SeedRegistry, "modules_seed_drop_all")
    if not sr:
        sr = SeedRegistry(key="modules_seed_drop_all", completed_at=datetime.utcnow(),
                          details="modules/tabs dropped & reseeded")
        db.session.add(sr)
    else:
        sr.completed_at = datetime.utcnow()
        sr.details = "modules/tabs dropped & reseeded"
    db.session.commit()

def main():
    with app.app_context():
        seed_modules_and_tabs()
        print("✅ Dropped & reseeded modules/tabs")

if __name__ == "__main__":
    main()
