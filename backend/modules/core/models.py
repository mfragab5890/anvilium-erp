# modules/core/models.py
from __future__ import annotations

from datetime import datetime, date
from sqlalchemy import UniqueConstraint, Index
from sqlalchemy.orm import relationship
from extensions import db


class TimestampMixin:
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


# ---------------------------
# Modules Registry (DB source of truth)
# ---------------------------
class AppModule(db.Model, TimestampMixin):
    __tablename__ = "app_modules"
    __table_args__ = (
        # sort by sort_order first, then code (helps queries & admin UI)
        Index("ix_app_modules_sort", "sort_order", "code"),
    )

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)   # 'users', 'hr', 'inventory', ...
    name_en = db.Column(db.String(120), nullable=False)
    name_ar = db.Column(db.String(120))
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    is_locked = db.Column(db.Boolean, nullable=False, default=False)
    # NEW: persisted order for the whole module list
    sort_order = db.Column(db.Integer, nullable=False, default=0)

    # children tabs (pre-ordered by sort_order then code when loaded via relationship)
    tabs = relationship(
        "AppModuleTab",
        back_populates="module",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="(AppModuleTab.sort_order, AppModuleTab.code)",
    )

    def __repr__(self) -> str:
        return f"<AppModule {self.code}>"

    def to_dict(self) -> dict:
        return {
            "code": self.code,
            "name_en": self.name_en,
            "name_ar": self.name_ar,
            "is_active": bool(self.is_active),
            "is_locked": bool(self.is_locked),
            "sort_order": int(self.sort_order or 0),
        }


class AppModuleTab(db.Model, TimestampMixin):
    __tablename__ = "app_module_tabs"
    __table_args__ = (
        UniqueConstraint("module_code", "code", name="uq_module_tab_code"),
        Index("ix_module_tabs_sort", "module_code", "sort_order", "code"),
    )

    id = db.Column(db.Integer, primary_key=True)
    module_code = db.Column(
        db.String(50),
        db.ForeignKey("app_modules.code", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    code = db.Column(db.String(64), nullable=False)  # e.g. 'employees', 'candidates', 'tickets', ...
    name_en = db.Column(db.String(120), nullable=False)
    name_ar = db.Column(db.String(120))
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    is_locked = db.Column(db.Boolean, nullable=False, default=False)
    sort_order = db.Column(db.Integer, nullable=False, default=0)

    module = relationship("AppModule", back_populates="tabs", lazy="joined")

    def __repr__(self) -> str:
        return f"<AppModuleTab {self.module_code}/{self.code}>"

    def to_dict(self) -> dict:
        return {
            "module_code": self.module_code,
            "code": self.code,
            "name_en": self.name_en,
            "name_ar": self.name_ar,
            "is_active": bool(self.is_active),
            "is_locked": bool(self.is_locked),
            "sort_order": int(self.sort_order or 0),
        }


# ---------------------------
# Branches & Holidays
# ---------------------------
class Branch(db.Model, TimestampMixin):
    """
    'ALL' used for backend authorization only (hide in UI via is_ui_visible=False).
    """
    __tablename__ = "branches"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(10), unique=True, nullable=False)     # RAK, DXB, FUJ, ALL
    name = db.Column(db.String(120), unique=True, nullable=False)    # Ras Al-Khaimah, Dubai...
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    is_ui_visible = db.Column(db.Boolean, nullable=False, default=True)

    user_links = relationship("UserBranch", back_populates="branch")

    def __repr__(self) -> str:
        return f"<Branch {self.code}>"


class NationalHoliday(db.Model, TimestampMixin):
    """
    UAE holidays; city=None => nationwide. Control UI ops via editable/deletable.
    """
    __tablename__ = "national_holidays"
    __table_args__ = (Index("ix_holiday_date", "holiday_date"),)

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    holiday_date = db.Column(db.Date, nullable=False)
    city = db.Column(db.String(120))          # optional emirate/city
    editable = db.Column(db.Boolean, nullable=False, default=True)
    deletable = db.Column(db.Boolean, nullable=False, default=True)
    notes = db.Column(db.Text)

    def __repr__(self) -> str:
        return f"<Holiday {self.holiday_date} {self.title} {self.city or 'ALL'}>"


# ---------------------------
# Users ↔ Branches (M2M)
# ---------------------------
class UserBranch(db.Model, TimestampMixin):
    __tablename__ = "user_branches"

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    branch_id = db.Column(
        db.Integer,
        db.ForeignKey("branches.id", ondelete="CASCADE"),
        primary_key=True,
    )

    user = relationship("User", back_populates="branch_links")
    branch = relationship("Branch", back_populates="user_links")


# ---------------------------
# Notifications
# ---------------------------
class Notification(db.Model, TimestampMixin):
    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_user_read", "user_id", "read_at"),
        Index("ix_notifications_object", "object_table", "object_id"),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), index=True, nullable=True)  # null => broadcast
    type = db.Column(db.String(50), nullable=False)            # e.g., 'doc_expiry'
    severity = db.Column(db.String(20), nullable=False, default="info")  # 'info'|'warning'|'critical'
    title = db.Column(db.String(200), nullable=False)
    body = db.Column(db.Text)
    object_table = db.Column(db.String(50))                    # 'employees_documents'
    object_id = db.Column(db.Integer)
    read_at = db.Column(db.DateTime)
    sent_email = db.Column(db.Boolean, default=False, nullable=False)
    email_sent_at = db.Column(db.DateTime)


# ---------------------------
# Seed registry
# ---------------------------
class SeedRegistry(db.Model):
    __tablename__ = "seed_registry"

    key = db.Column(db.String(120), primary_key=True)
    completed_at = db.Column(db.DateTime, nullable=False)
    details = db.Column(db.Text)
