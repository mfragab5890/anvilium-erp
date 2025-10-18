# modules/hr/schemas.py
from marshmallow import Schema, fields

class EmployeeOut(Schema):
    id = fields.Int()
    code = fields.Str()
    first_name = fields.Str()
    last_name = fields.Str()
    email = fields.Str(allow_none=True)
    phone = fields.Str(allow_none=True)
    position = fields.Str(allow_none=True)
    branch_id = fields.Int(allow_none=True)
    is_active = fields.Bool()
    salary_monthly = fields.Decimal(as_string=True, allow_none=True)
    nationality = fields.Str(allow_none=True)
    dob = fields.Date(allow_none=True)
    hire_date = fields.Date(allow_none=True)
    termination_date = fields.Date(allow_none=True)

class EmployeeListOut(Schema):
    items = fields.List(fields.Nested(EmployeeOut))
    total = fields.Int()
    page = fields.Int()
    size = fields.Int()
    pages = fields.Int()
