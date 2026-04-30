from app.db.session import Base
target_metadata = Base.metadata
APP_NAME=SmartStore AI
DEBUG=True

DATABASE_URL=postgresql+psycopg2://neondb_owner:npg_t3FShMa8omAH@ep-empty-dust-ane6pyt0-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require

SECRET_KEY=supersecretkey
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

REDIS_URL=redis://localhost:6379

OPENAI_API_KEY=your_openai_key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASSWORD=your_password