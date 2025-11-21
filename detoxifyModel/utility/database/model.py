# corrected utility/database/model.py

from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column # <-- IMPORT THIS
from typing import Optional, List
import uuid
from datetime import datetime, timezone

def now_utc():
    return datetime.now(timezone.utc)

class User(SQLModel, table=True):
    __tablename__ = "users"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(index=True, unique=True)
    password_hash: str = Field( nullable=False)
    credits: int = Field(default=100)
    createdat: datetime = Field(default_factory=now_utc)
    apikeys: List["APIKey"] = Relationship(back_populates="user")
    text_analysis_requests: List["TextAnalysisRequest"] = Relationship(back_populates="user")


class Admin(SQLModel, table=True):
    __tablename__ = "admins"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(index=True, unique=True)
    password_hash: str = Field( nullable=False)
    createdat: datetime = Field(default_factory=now_utc)


class APIKey(SQLModel, table=True):
    __tablename__ = "apikeys"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    thekey: str = Field(unique=True, nullable=False)
    isactive: bool = Field(default=True)
    createdat: datetime = Field(default_factory=now_utc)
    userid: uuid.UUID = Field(foreign_key="users.id")
    user: Optional[User] = Relationship(back_populates="apikeys")


class TextAnalysisRequest(SQLModel, table=True):
    __tablename__ = "text_analysis_requests"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    inputtext: str = Field(nullable=False)
    isprofane: Optional[bool] = Field(default=None)
    toxicityscore: Optional[float] = Field(default=None)
    createdat: datetime = Field(default_factory=now_utc)
    userid: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    user: Optional[User] = Relationship(back_populates="text_analysis_requests")
    usagelogs: List["UsageLog"] = Relationship(back_populates="request")


class UsageLog(SQLModel, table=True):
    __tablename__ = "usagelogs"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    statuscode: int = Field()
    issuccessful: bool = Field(default=False)
    endpointurl: str = Field()
    ipaddress: str = Field()
    createdat: datetime = Field(default_factory=now_utc)
    requestid: Optional[uuid.UUID] = Field(default=None, foreign_key="text_analysis_requests.id")
    request: Optional[TextAnalysisRequest] = Relationship(back_populates="usagelogs")
    userid: Optional[uuid.UUID] = Field(default=None)
