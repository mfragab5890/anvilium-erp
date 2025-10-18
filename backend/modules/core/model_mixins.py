from typing import List


class QueryHelperMixin:
    """Common helpers for models that want thin routes."""
    __abstract__ = True

    @classmethod
    def default_eager_options(cls) -> List:
        """Override in models to eager-load relationships."""
        return []

    @classmethod
    def base_query(cls):
        """Base query with default eager-loads applied."""
        return cls.query.options(*cls.default_eager_options())

    @classmethod
    def by_id(cls, _id: int):
        return cls.base_query().get(int(_id))
