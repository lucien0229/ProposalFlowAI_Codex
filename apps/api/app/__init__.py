from sqlalchemy import MetaData

metadata = MetaData()

from app import activity_logs as _activity_logs  # noqa: E402,F401
from app import account_models as _account_models  # noqa: E402,F401
from app import lead_brief_models as _lead_brief_models  # noqa: E402,F401
from app import opportunity_models as _opportunity_models  # noqa: E402,F401

__all__ = ["metadata"]
