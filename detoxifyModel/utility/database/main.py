from sqlmodel import create_engine, Session
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set!")
    
engine = create_engine(DATABASE_URL)
def get_session():
    db = Session(engine)
    try:
        yield db
    finally:
        db.close()