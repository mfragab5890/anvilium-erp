import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
INSTANCE_DIR = BASE_DIR / 'instance'
INSTANCE_DIR.mkdir(exist_ok=True)

def build_database_uri() -> str:
    # Highest priority: full URL
    url = os.getenv("DATABASE_URL") or os.getenv("DATABASE_URI")
    if url:
        return url

    engine = (os.getenv("DB_ENGINE") or "sqlite").lower()
    if engine == "sqlite":
        path = os.getenv("SQLITE_PATH", str(INSTANCE_DIR / "dev.db"))
        return f"sqlite:///{path}"
    elif engine in ("postgresql", "postgres"):
        user = os.getenv("DB_USER", "postgres")
        pwd  = os.getenv("DB_PASS", "postgres")
        host = os.getenv("DB_HOST", "localhost")
        port = os.getenv("DB_PORT", "5432")
        name = os.getenv("DB_NAME", "erp")
        return f"postgresql+psycopg2://{user}:{pwd}@{host}:{port}/{name}"
    elif engine in ("mysql", "mariadb"):
        user = os.getenv("DB_USER", "root")
        pwd  = os.getenv("DB_PASS", "")
        host = os.getenv("DB_HOST", "localhost")
        port = os.getenv("DB_PORT", "3306")
        name = os.getenv("DB_NAME", "erp")
        # PyMySQL pure-python driver
        return f"mysql+pymysql://{user}:{pwd}@{host}:{port}/{name}?charset=utf8mb4"
    else:
        raise RuntimeError(f"Unsupported DB_ENGINE: {engine}")

class BaseConfig:
    SQLALCHEMY_DATABASE_URI = build_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    JWT_COOKIE_CSRF_PROTECT = False
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")  # comma-separated allowed origins
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "ADMIN@ANVILIUM")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "ADMIN@ANVILIUM")
    DEFAULT_LOCALE = os.getenv("DEFAULT_LOCALE", "en")

class DevConfig(BaseConfig):
    DEBUG = True

class ProdConfig(BaseConfig):
    DEBUG = False

def config(env: str | None):
    env = (env or os.getenv("APP_ENV") or "dev").lower()
    return DevConfig if env.startswith("dev") else ProdConfig
