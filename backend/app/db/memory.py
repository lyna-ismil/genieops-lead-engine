from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime
from uuid import uuid4


def new_id() -> str:
    return str(uuid4())


def utc_now() -> datetime:
    return datetime.utcnow()


@dataclass
class MemoryStore:
    campaigns: dict = field(default_factory=dict)
    lead_magnets: dict = field(default_factory=dict)
    assets: dict = field(default_factory=dict)
    landing_pages: dict = field(default_factory=dict)
    email_sequences: dict = field(default_factory=dict)
    email_templates: dict = field(default_factory=dict)
    leads: dict = field(default_factory=dict)
    email_logs: dict = field(default_factory=dict)
    settings: dict = field(default_factory=dict)


store = MemoryStore()
