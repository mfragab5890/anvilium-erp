from dataclasses import dataclass
from math import ceil
from flask import request
from .constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE

@dataclass
class Page:
    items: list
    page: int
    size: int
    total: int

    @property
    def pages(self) -> int:
        return ceil(self.total / self.size) if self.size else 1

def parse_pagination_args(default_size: int = DEFAULT_PAGE_SIZE, max_size: int = MAX_PAGE_SIZE):
    try:
        page = int(request.args.get("page", 1))
    except Exception:
        page = 1
    try:
        size = int(request.args.get("size", default_size))
    except Exception:
        size = default_size
    size = max(1, min(size, max_size))
    page = max(1, page)
    return page, size

def paginate(query, page: int, size: int) -> Page:
    # Avoid counting with ORDER BY for speed
    total = query.order_by(None).count()
    items = query.limit(size).offset((page - 1) * size).all()
    return Page(items=items, page=page, size=size, total=total)

def page_to_dict(p: Page, items_json: list) -> dict:
    return {"items": items_json, "page": p.page, "size": p.size, "total": p.total, "pages": p.pages}
