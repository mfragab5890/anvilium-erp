from flask import Flask
from modules.auth.routes import bp as auth_bp
from modules.users.routes import bp as users_bp
from modules.hr.routes import bp as hr_bp
from modules.admin.routes import bp as admin_bp
from modules.users.models import Role, Permission, User
from extensions import db
from werkzeug.security import generate_password_hash
from flask import current_app
from sqlalchemy import select

def register_all_blueprints(app: Flask, api_prefix: str = "/api"):
    app.register_blueprint(auth_bp,  url_prefix=f"{api_prefix}/auth")
    app.register_blueprint(users_bp, url_prefix=f"{api_prefix}/users")
    app.register_blueprint(hr_bp,    url_prefix=f"{api_prefix}/hr")
    app.register_blueprint(admin_bp,    url_prefix=f"{api_prefix}/admin")

def seed_admin_if_empty():
    if not Role.query.filter_by(code="admin").first():
        admin_role = Role(name_en="Administrator", name_ar="مسؤول النظام", code="admin", is_editable=False)
        db.session.add(admin_role)
        db.session.commit()

    # Seed permissions once
    if not db.session.execute(select(Permission)).first():
        perms = [
            Permission(code="page:dashboard:view", name_en="View Dashboard", name_ar="عرض لوحة التحكم", type="page"),
            Permission(code="page:roles:manage", name_en="Manage Roles", name_ar="إدارة الأدوار", type="page"),
            Permission(code="api:users:read", name_en="List Users", name_ar="عرض المستخدمين", type="api", method="GET", path="/users/"),
            Permission(code="api:users:create", name_en="Create User", name_ar="إنشاء مستخدم", type="api", method="POST", path="/users/"),
        ]
        db.session.add_all(perms); db.session.commit()
        admin_role = Role.query.filter_by(code="admin").first()
        admin_role.permissions.extend(perms)
        db.session.commit()

    admin_email = current_app.config.get('ADMIN_EMAIL', 'ADMIN@ANVILIUM')
    admin_password = current_app.config.get('ADMIN_PASSWORD', 'ADMIN@ANVILIUM')
    if not User.query.filter_by(email=admin_email).first():
        admin_role = Role.query.filter_by(code="admin").first()
        admin = User(
            email=admin_email,
            first_name="System",
            last_name="Admin",
            password_hash=generate_password_hash(admin_password),
            is_active=True,
            role=admin_role,
        )
        db.session.add(admin)
        db.session.commit()
