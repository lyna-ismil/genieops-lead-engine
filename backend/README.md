# GenieOps Lead Engine API

## Local setup
1) Create a virtual environment
2) Install dependencies: pip install -r requirements.txt
3) Copy .env.example to .env and set values
4) Run: uvicorn app.main:app --reload

## Notes
- Uses an in-memory store for now.
- Replace services with database-backed repositories as needed.

## Email provider
- Set EMAIL_PROVIDER=sendgrid and EMAIL_API_KEY for sending.
- Configure EMAIL_FROM and EMAIL_FROM_NAME.

## Scheduler
- Background scheduler runs every 30 seconds and sends queued emails.
