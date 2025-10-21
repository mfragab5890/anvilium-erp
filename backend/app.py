# app.py
import os, pathlib
from flask import Flask, request
from flask_cors import CORS
from dotenv import load_dotenv
from extensions import db, migrate, jwt, babel
from modules import register_all_blueprints

def _load_env():
    repo_root = pathlib.Path(__file__).resolve().parents[1]
    load_dotenv(repo_root / ".env", override=False)
    load_dotenv(repo_root / f".env.{os.getenv('APP_ENV', 'dev')}", override=True)

def _select_locale():
    lang = request.args.get("lang")
    if lang: return lang
    accept = request.headers.get("Accept-Language", "")
    return accept.split(",")[0] if accept else "en"

# Load environment variables
_load_env()

# Create Flask app instance
app = Flask(__name__, instance_relative_config=False)
app.secret_key = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")

# Detect environment
APP_ENV = os.getenv("APP_ENV", "dev")

# Database configuration
if APP_ENV == "prod":
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
else:
    # Use DATABASE_URL if provided, otherwise use PostgreSQL for local development
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL") or "postgresql+psycopg2://postgres:tafiTAFI@localhost:5432/anvilium_dev"

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
app.config["JWT_TOKEN_LOCATION"] = ["headers"]
app.config["JWT_HEADER_NAME"] = "Authorization"
app.config["JWT_HEADER_TYPE"] = "Bearer"
app.config["JWT_COOKIE_CSRF_PROTECT"] = False
app.config["CORS_ORIGINS"] = os.getenv("CORS_ORIGINS", "*")
app.config["ADMIN_EMAIL"] = os.getenv("ADMIN_EMAIL", "ADMIN@ANVILIUM")
app.config["ADMIN_PASSWORD"] = os.getenv("ADMIN_PASSWORD", "ADMIN@ANVILIUM")
app.config["DEFAULT_LOCALE"] = os.getenv("DEFAULT_LOCALE", "en")

# Configure CORS
origins = app.config.get("CORS_ORIGINS", "*")
if isinstance(origins, str) and origins != "*":
    origins = [o.strip() for o in origins.split(",") if o.strip()]
CORS(app, resources={r"/*": {"origins": origins}}, supports_credentials=False)

# Initialize extensions
db.init_app(app)
migrate.init_app(app, db)
jwt.init_app(app)
babel.init_app(app, locale_selector=_select_locale)

# Import models so Alembic sees them
import modules.core.models
import modules.users.models
import modules.hr.models
import modules.admin.models

# Register blueprints
register_all_blueprints(app)

@app.shell_context_processor
def _make_shell_ctx():
    return {"db": db}

if __name__ == "__main__":
    app.run(debug=True, host=app.config.get("HOST", "127.0.0.1"), port=int(app.config.get("PORT", 5000)))
