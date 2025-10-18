from datetime import datetime
from modules.auth.security import hash_password
from modules.core.model_mixins import QueryHelperMixin
from extensions import db
from sqlalchemy.orm import relationship, joinedload
from modules.core.models import Branch, UserBranch
from sqlalchemy import Index, func, event, or_

class TimestampMixin:
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


# Association table for roles ↔ permissions (this can stay a Table or be refactored later)
roles_permissions = db.Table(
    "roles_permissions",
    db.Column("role_id", db.Integer, db.ForeignKey("roles.id"), primary_key=True),
    db.Column("permission_id", db.Integer, db.ForeignKey("permissions.id"), primary_key=True),
)

class Role(db.Model, TimestampMixin):
    __tablename__ = "roles"
    id = db.Column(db.Integer, primary_key=True)
    name_en = db.Column(db.String(120), nullable=False, unique=True)
    name_ar = db.Column(db.String(120))
    code = db.Column(db.String(60), nullable=False, unique=True)
    is_editable = db.Column(db.Boolean, default=True, nullable=False)

    permissions = relationship("Permission", secondary=roles_permissions, backref="roles", lazy="joined")


class Permission(db.Model, TimestampMixin):
    __tablename__ = "permissions"
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(120), unique=True, nullable=False)
    name_en = db.Column(db.String(160), nullable=False)
    name_ar = db.Column(db.String(160))
    type = db.Column(db.String(20), nullable=False)  # 'api' or 'page'
    method = db.Column(db.String(10))
    path = db.Column(db.String(255))
    description = db.Column(db.Text)


class User(db.Model, QueryHelperMixin, TimestampMixin):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    # NOTE: keep index=True (non-unique). Uniqueness is enforced via a
    # case-insensitive functional unique index and/or DB collation/migration.
    email = db.Column(db.String(255), nullable=False, index=True)

    first_name = db.Column(db.String(120), nullable=False)
    last_name = db.Column(db.String(120), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=False)
    role = relationship("Role", backref="users", lazy="joined")

    branch_links = relationship("UserBranch", back_populates="user", cascade="all, delete-orphan")
    branches = relationship(
        Branch,
        secondary="user_branches",
        primaryjoin="User.id==UserBranch.user_id",
        secondaryjoin="Branch.id==UserBranch.branch_id",
        viewonly=True,
        lazy="dynamic",
    )

    # SQLAlchemy will emit a functional UNIQUE index for dialects that support it.
    # On SQLite, Alembic can't auto-diff expression indexes (warning is expected),
    # so we also create it explicitly in the migration.
    __table_args__ = (
        Index("uq_users_email_lower", func.lower(email), unique=True),
    )

    def set_password(self, raw: str) -> None:
        self.password_hash = hash_password(raw)

    @property
    def is_admin(self) -> bool:
        return bool(self.role and self.role.code == "admin")

    @property
    def is_superuser(self) -> bool:
        """Treat role code 'superuser' as the platform super admin."""
        return bool(self.role and getattr(self.role, "code", "") == "superuser")
    
    def permissions(self) -> set[str]:
        if not self.role:
            return set()
        return {p.code for p in self.role.permissions}

    # helpers
    def branch_codes(self) -> set[str]:
        return {link.branch.code for link in self.branch_links}

    def has_all_branches(self) -> bool:
        return "ALL" in self.branch_codes()

    def has_branch(self, code: str) -> bool:
        return self.has_all_branches() or (code in self.branch_codes())

    # ---- API query helpers ----
    @classmethod
    def default_eager_options(cls):
        # Always load role when fetching users for API
        return [joinedload(cls.role)]

    @classmethod
    def search(cls, q: str | None):
        base = cls.base_query()
        if not q:
            return base
        s = f"%{q.strip().lower()}%"
        return base.filter(
            or_(
                func.lower(cls.email).like(s),
                func.lower(cls.first_name).like(s),
                func.lower(cls.last_name).like(s),
            )
        )

    @classmethod
    def list_for_api(cls, q: str | None, order: str | None = None):
        qry = cls.search(q)
        # simple ordering; extend as needed
        if order == "email_desc":
            qry = qry.order_by(cls.email.desc())
        else:
            qry = qry.order_by(cls.email.asc())
        return qry

    def as_auth_payload(self) -> dict:
        """
        One-stop bundle for auth responses.
        - user: serialized user (your existing Marshmallow schema)
        - modules: inferred FE modules from permissions
        - claims: minimal, stable JWT claims (strings/bools only)
        """
        # Lazy imports to avoid circulars
        from modules.users.schemas import UserOut
        from modules.core.models import AppModule

        user_dict = UserOut().dump(self)

        # DB is the source of truth
        modules = [m.to_dict() for m in AppModule.query.order_by(AppModule.code.asc()).all()]

        claims = {
            "role": (self.role.code if self.role else None),
            "is_superuser": bool(self.role and self.role.code == "superuser"),
        }
        return {"user": user_dict, "modules": modules, "claims": claims}

# ─────────────────────────────────────────────────────────────────────────────
# Normalize emails to lowercase on write (prevents future mixed-case rows)
# NOTE: these must live OUTSIDE the class body.
# ─────────────────────────────────────────────────────────────────────────────

@event.listens_for(User, "before_insert")
def _user_email_lower_insert(mapper, connection, target: User):
    if target.email:
        target.email = target.email.strip().lower()

@event.listens_for(User, "before_update")
def _user_email_lower_update(mapper, connection, target: User):
    if target.email:
        target.email = target.email.strip().lower()
