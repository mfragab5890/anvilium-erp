"""initial schema: update Users (case-insensitive unique email)

Revision ID: 3e20845aba82
Revises: 954055777c82
Create Date: 2025-08-22 01:57:15.841163
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "3e20845aba82"
down_revision = "954055777c82"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    dialect = bind.dialect.name

    # 0) Normalize existing rows to lowercase (prevents collisions on unique create)
    op.execute("UPDATE users SET email = LOWER(email)")

    # 1) Best-effort: drop any old unique constraints/indexes so we can recreate cleanly
    #    (Names might not exist on all DBs; ignore errors.)
    try:
        op.drop_constraint("uq_users_email", "users", type_="unique")
    except Exception:
        pass
    for idx in ("uq_users_email", "uq_users_email_lower", "uq_users_email_nocase"):
        try:
            op.drop_index(idx, table_name="users")
        except Exception:
            pass

    # 2) Keep a simple NON-UNIQUE index on email for fast lookups.
    #    Alembic often toggles this, so we enforce non-unique explicitly.
    with op.batch_alter_table("users", schema=None) as batch_op:
        try:
            batch_op.drop_index(batch_op.f("ix_users_email"))
        except Exception:
            pass
        batch_op.create_index(batch_op.f("ix_users_email"), ["email"], unique=False)

    # 3) Create a case-insensitive UNIQUE constraint/index per dialect
    if dialect == "postgresql":
        # Best option: CITEXT makes comparisons case-insensitive at the type level
        op.execute("CREATE EXTENSION IF NOT EXISTS citext")
        op.execute("ALTER TABLE users ALTER COLUMN email TYPE citext")
        op.create_unique_constraint("uq_users_email", "users", ["email"])

    elif dialect in {"mysql", "mariadb"}:
        # Ensure email column uses a case-insensitive collation; then normal UNIQUE works
        # Adjust collation if your server doesn't support _0900; e.g., utf8mb4_general_ci
        op.execute(
            "ALTER TABLE users "
            "MODIFY email VARCHAR(255) "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL"
        )
        op.create_unique_constraint("uq_users_email", "users", ["email"])

    elif dialect == "sqlite":
        # Use a UNIQUE expression index on lower(email) for case-insensitive uniqueness
        op.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower "
            "ON users (lower(email))"
        )
    else:
        # Fallback: try functional unique index; if unsupported, fall back to plain UNIQUE
        try:
            op.create_index("uq_users_email_lower", "users", [sa.text("lower(email)")], unique=True)
        except Exception:
            op.create_unique_constraint("uq_users_email", "users", ["email"])


def downgrade():
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == "postgresql":
        # Drop UNIQUE; optionally revert type to varchar
        try:
            op.drop_constraint("uq_users_email", "users", type_="unique")
        except Exception:
            pass
        op.execute("ALTER TABLE users ALTER COLUMN email TYPE varchar(255)")

    elif dialect in {"mysql", "mariadb"}:
        try:
            op.drop_constraint("uq_users_email", "users", type_="unique")
        except Exception:
            pass
        # Revert to a generic CI collation (adjust to your default if needed)
        op.execute(
            "ALTER TABLE users "
            "MODIFY email VARCHAR(255) "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL"
        )

    elif dialect == "sqlite":
        op.execute("DROP INDEX IF EXISTS uq_users_email_lower")

    # Restore simple non-unique index (kept non-unique to avoid future Alembic churn)
    with op.batch_alter_table("users", schema=None) as batch_op:
        try:
            batch_op.drop_index(batch_op.f("ix_users_email"))
        except Exception:
            pass
        batch_op.create_index(batch_op.f("ix_users_email"), ["email"], unique=False)
