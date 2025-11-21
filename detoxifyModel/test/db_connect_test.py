from utility.database.main import get_session
from utility.database.model import User
from sqlalchemy import text
session = get_session()
users = session.exec(text('select * from users'))

if(users):
    for user in users:
        print(user)
