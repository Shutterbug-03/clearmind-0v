from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Integer, DateTime, JSON
from datetime import datetime


class Base(DeclarativeBase):
    pass


class Scan(Base):
    __tablename__ = "scans"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    type: Mapped[str] = mapped_column(String(20))
    input_label: Mapped[str] = mapped_column(String(512))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    confidence: Mapped[int] = mapped_column(Integer)
    flags: Mapped[dict] = mapped_column(JSON)
    summary: Mapped[str] = mapped_column(String(512))


