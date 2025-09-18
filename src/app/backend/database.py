import databases

DATABASE_URL = "postgresql+asyncpg://postgres:4260@localhost/please_go_away"

database = databases.Database(DATABASE_URL)