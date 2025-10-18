# modules/hr/models.py
from datetime import datetime, date
from sqlalchemy import UniqueConstraint, Index, event, or_, func
from sqlalchemy.orm import relationship, backref, joinedload
from extensions import db
from modules.core.models import Branch
from modules.core.model_mixins import QueryHelperMixin

JSONType = db.JSON  # switch to JSONB on Postgres if you like


class TimestampMixin:
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Employee(db.Model, QueryHelperMixin, TimestampMixin):
    __tablename__ = "employees"
    __table_args__ = (
        UniqueConstraint("code", name="uq_employee_code"),
        UniqueConstraint("email", name="uq_employee_email"),
        Index("ix_employee_branch", "branch_id"),
    )

    id = db.Column(db.Integer, primary_key=True)

    # Identifiers / basic info
    code       = db.Column(db.String(50), unique=True, index=True)
    first_name = db.Column(db.String(120), nullable=False)
    last_name  = db.Column(db.String(120), nullable=False)
    email      = db.Column(db.String(255))
    phone      = db.Column(db.String(50))

    # Job info
    position   = db.Column(db.String(120))
    branch_id  = db.Column(db.Integer, db.ForeignKey(Branch.id))
    branch     = relationship(Branch, backref=backref("employees", lazy="dynamic"))

    hire_date        = db.Column(db.Date)
    termination_date = db.Column(db.Date)
    is_active        = db.Column(db.Boolean, nullable=False, default=True)

    # Payroll + personal
    salary_monthly = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    nationality    = db.Column(db.String(80))
    dob            = db.Column(db.Date)  # date of birth

    # Catch-all
    meta = db.Column(JSONType)

    def __repr__(self):
        return f"<Employee {self.id} code={self.code}>"

    @property
    def full_name(self) -> str:
        fn = (self.first_name or "").strip()
        ln = (self.last_name or "").strip()
        return f"{fn} {ln}".strip()

    # ---------- API query helpers ----------
    @classmethod
    def default_eager_options(cls):
        # preload branch to avoid N+1 when needed
        return [joinedload(cls.branch)]

    @classmethod
    def search(cls, q: str | None):
        base = cls.base_query()
        if not q:
            return base
        like = f"%{q.strip().lower()}%"
        return base.filter(or_(
            func.lower(cls.code).like(like),
            func.lower(cls.first_name).like(like),
            func.lower(cls.last_name).like(like),
            func.lower(cls.email).like(like),
        ))

    @classmethod
    def _apply_branch(cls, query, branch: str | None):
        if not branch or branch.upper() == "ALL":
            return query
        if branch.isdigit():
            return query.filter(cls.branch_id == int(branch))
        # branch code (case-insensitive)
        return query.join(Branch, isouter=True).filter(func.lower(Branch.code) == branch.lower())

    @classmethod
    def list_for_api(cls, q: str | None, branch: str | None, order: str | None = None):
        qry = cls.search(q)
        qry = cls._apply_branch(qry, branch)
        # default newest first
        if order == "name_asc":
            qry = qry.order_by(cls.first_name.asc(), cls.last_name.asc())
        elif order == "name_desc":
            qry = qry.order_by(cls.first_name.desc(), cls.last_name.desc())
        else:
            qry = qry.order_by(cls.id.desc())
        return qry


@event.listens_for(Employee, "after_insert")
def _employee_set_code(mapper, connection, target: "Employee"):
    if not target.code:
        new_code = f"ARA{target.id}"
        employees_tbl = Employee.__table__
        connection.execute(
            employees_tbl.update().where(employees_tbl.c.id == target.id).values(code=new_code)
        )


class DocumentType(db.Model, TimestampMixin):
    __tablename__ = "document_types"
    __table_args__ = (db.UniqueConstraint("code", name="uq_document_type_code"),)
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), nullable=False)
    name_en = db.Column(db.String(120), nullable=False)
    name_ar = db.Column(db.String(120))
    category = db.Column(db.String(20), nullable=False, default="employee")
    requires_expiry = db.Column(db.Boolean, nullable=False, default=True)
    default_validity_days = db.Column(db.Integer)
    # 🔔 reminder config
    remind_before_days = db.Column(db.Integer)
    remind_every_days  = db.Column(db.Integer)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    field_schema = db.Column(JSONType)  # dynamic UI schema

    def __repr__(self): return f"<DocumentType {self.code}>"


class EmployeeDocument(db.Model, TimestampMixin):
    __tablename__ = "employees_documents"
    __table_args__ = (
        Index("ix_empdoc_employee", "employee_id"),
        Index("ix_empdoc_doctype", "document_type_id"),
        Index("ix_empdoc_expiry", "expiry_date"),
    )
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey(Employee.id, ondelete="CASCADE"), nullable=False)
    document_type_id = db.Column(db.Integer, db.ForeignKey(DocumentType.id), nullable=False)

    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(512), nullable=False)

    issued_date = db.Column(db.Date)
    expiry_date = db.Column(db.Date)

    is_expirable = db.Column(db.Boolean, nullable=False, default=True)
    is_active    = db.Column(db.Boolean, nullable=False, default=True)

    notifications_muted = db.Column(db.Boolean, nullable=False, default=False)
    muted_until         = db.Column(db.Date)
    last_reminded_at    = db.Column(db.DateTime)

    notes = db.Column(db.Text)
    meta_values = db.Column(JSONType)

    employee      = relationship(Employee, backref=backref("documents", lazy="dynamic", cascade="all, delete-orphan"))
    document_type = relationship(DocumentType)

    def __repr__(self):
        return f"<EmployeeDocument emp={self.employee_id} type={self.document_type_id} active={self.is_active}>"
