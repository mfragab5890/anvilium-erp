from marshmallow import Schema, fields

class RoleOut(Schema):
    id = fields.Int()
    code = fields.Str()
    name_en = fields.Str(allow_none=True)
    name_ar = fields.Str(allow_none=True)
    is_editable = fields.Bool()

class PermissionOut(Schema):
    id = fields.Int()
    code = fields.Str()
    name_en = fields.Str(allow_none=True)
    name_ar = fields.Str(allow_none=True)
    type = fields.Str()  # 'api' or 'page'
    method = fields.Str(allow_none=True)
    path = fields.Str(allow_none=True)


class UserOut(Schema):
    id = fields.Int()
    email = fields.Email()
    first_name = fields.Str()
    last_name = fields.Str()
    is_active = fields.Bool()

    role = fields.Nested(RoleOut, dump_only=True)
    role_code = fields.Function(lambda o: getattr(getattr(o, "role", None), "code", None))

    permissions = fields.Method("get_permissions", dump_only=True)

    def get_permissions(self, obj):
        try:
            perms = obj.permissions()
            return sorted([str(p) for p in perms])
        except Exception:
            return []
