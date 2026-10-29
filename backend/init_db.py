
import models
from database import Base, engine

Base.metadata.create_all(bind=engine)

print("Database initialized successfully!")
print("Users and expenses tables are ready.")
