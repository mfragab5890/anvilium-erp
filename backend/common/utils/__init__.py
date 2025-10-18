from flask_babel import gettext as _
from modules.core.models import AppModule


def infer_modules_from_permissions(perms: set[str]) -> list[dict]:
    """ Map permission codes to module codes and return active modules. """
    # Derive module code by taking the prefix before ':' or '.'
    mod_codes = set()
    for code in perms:
        head = code.split(":", 1)[0]
        head = head.split(".", 1)[0]
        if head:
            mod_codes.add(head)
    if not mod_codes:
        return []

    q = AppModule.query.filter(AppModule.code.in_(mod_codes),
                               AppModule.is_active.is_(True),
                               AppModule.is_locked.is_(False))
    mods = q.all()
    return [{"code": m.code, "name_en": m.name_en, "name_ar": m.name_ar} for m in mods]