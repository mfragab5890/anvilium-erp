from werkzeug.security import generate_password_hash, check_password_hash

def hash_password(raw: str) -> str:
    return generate_password_hash(raw)

def verify_password(hash_: str, raw: str) -> bool:
    return check_password_hash(hash_, raw)
