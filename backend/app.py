# app.py
from __future__ import annotations
import os, pathlib
from flask import Flask, request
from flask_cors import CORS
from dotenv import load_dotenv
from extensions import db, migrate, jwt, babel
from settings import config
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
app = Flask(__name__)
app.config.from_object(config(None))
app.url_map.strict_slashes = False

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
