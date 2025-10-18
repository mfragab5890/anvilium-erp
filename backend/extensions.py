from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_babel import Babel
from flask_cors import CORS
from flask import jsonify

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
babel = Babel()
cors = CORS()

def init_extensions(app):
    """
    Initialize all shared Flask extensions.
    CORS is limited to /api/*; JWT uses Authorization: Bearer <token>.
    """
    db.init_app(app)
    migrate.init_app(app, db)
    babel.init_app(app)

    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    jwt.init_app(app)

# ---- Optional: make JWT errors predictable for the FE ----

@jwt.unauthorized_loader
def _unauthorized(reason: str):
    # No/invalid Authorization header
    return jsonify({"message": "Missing or invalid token", "reason": reason}), 401

@jwt.invalid_token_loader
def _invalid(reason: str):
    return jsonify({"message": "Invalid token", "reason": reason}), 401

@jwt.expired_token_loader
def _expired(jwt_header, jwt_payload):
    return jsonify({"message": "Token expired"}), 401

@jwt.revoked_token_loader
def _revoked(jwt_header, jwt_payload):
    return jsonify({"message": "Token revoked"}), 401

@jwt.needs_fresh_token_loader
def _needs_fresh(jwt_header, jwt_payload):
    return jsonify({"message": "Fresh token required"}), 401
