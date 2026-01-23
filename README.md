# GenieOps Lead Engine

GenieOps is an AI-powered marketing automation platform that generates high-converting lead funnels in minutes. Provide an Ideal Customer Profile (ICP) and a website URL to automatically produce lead magnet ideas, downloadable assets (PDFs or calculators), landing pages, email nurture sequences, and social distribution content.

## 🚀 Features

- **AI Brand Analysis:** Extracts brand voice, color palette, positioning, and design cues from a website.
- **Lead Magnet Ideation:** Generates targeted lead magnet concepts (checklists, templates, calculators).
- **Asset Generation:** Writes the full asset content (Markdown or JSON logic for calculators).
- **Landing Page Builder:** Produces conversion-focused copy and JSON-driven layouts rendered in React.
- **Email Nurture Sequences:** Creates multi-touch sequences (delivery, value-add, upsell).
- **Social Distribution:** Drafts and publishes LinkedIn promotional posts.
- **Public Pages:** Hosts landing pages and thank-you pages with lead capture.
- **Dashboard:** Manage campaigns, view leads, and track project status.

## 🛠 Tech Stack

### Backend

- **Framework:** Python (FastAPI)
- **Database:** PostgreSQL (SQLModel / SQLAlchemy)
- **Migrations:** Alembic
- **AI:** OpenAI API
- **Scheduling:** APScheduler
- **Scraping:** Beautiful Soup 4 & HTTPX
- **Auth:** JWT (OAuth2 Password Bearer)

### Frontend

- **Framework:** React 19 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Custom Cyberpunk/Terminal UI
- **Icons:** Lucide React
- **Routing:** React Router (HashRouter)

## 📂 Project Structure

```
./
├── alembic/                # Database migrations
├── app/
│   ├── api/                # API Routes (Auth, Campaigns, Generation, Public)
│   ├── core/               # App config and error handling
│   ├── db/                 # Database session and connection
│   ├── models/             # SQLModel database schemas
│   └── services/           # Business logic (LLM, Email, Social, Scraper)
├── components/             # React UI components (Wizard, Renderers)
├── pages/                  # React pages (Dashboard, Create Flow)
├── services/               # Frontend API clients
└── tests/                  # Backend tests
```

## ⚡️ Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL
- OpenAI API key

### 1) Backend Setup

Create a virtual environment:

```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install dependencies:

```
pip install -r requirements.txt
```

Configure environment variables (create .env at the repo root):

```
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/genieops
LLM_API_KEY=sk-proj-...
LLM_MODEL=gpt-4o-mini
JWT_SECRET=your_secret_key
EMAIL_PROVIDER=none  # or 'mailersend' / 'sendgrid'
# Optional External Integrations
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
UNSPLASH_ACCESS_KEY=...
```

Run migrations:

```
alembic upgrade head
```

Start the server:

```
uvicorn app.main:app --reload
```

API available at http://127.0.0.1:8000 (docs at /docs).

### 2) Frontend Setup

Install dependencies:

```
npm install
```

Configure environment variables (create .env.local):

```
VITE_APP_BASE_URL=http://localhost:5173
# If backend is on a different domain/port not handled by proxy:
# VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start the development server:

```
npm run dev
```

Access the app at http://localhost:3000 (or the port shown in terminal).

## 🧩 Key Features Breakdown

### The Wizard Flow (/create)

The core user experience is a step-by-step wizard located in components/Wizard/:

1. **Audience & Goals:** Define ICP or import from LinkedIn post analysis.
2. **Ideation:** Generate 3 unique lead magnet angles.
3. **Asset Creation:** Generate the asset content (text or calculator logic).
4. **Landing Page:** Generate copy and design configuration.
5. **Nurture:** Generate email sequences and upgrade offers.
6. **Social:** Generate a LinkedIn post and publish.

### Landing Page Renderer (components/LandingPageRenderer.tsx)

A dynamic engine that renders landing pages from JSON configuration (headline, sections, theme, form schema). It supports multiple variants (split_feature, bento_grid, hero) and themes (light/dark).

### Calculator Widget (components/CalculatorWidget.tsx)

A secure tokenizer-based math evaluator that renders interactive ROI/diagnostic calculators defined by the AI.

## 📧 Email & Scheduler

The system runs a background scheduler (app/services/email_scheduler.py) that checks for due emails every 30 seconds. Emails are stored in the email_logs table and sent via the configured provider (MailerSend or SendGrid).

## 🔒 Authentication

- **Sign Up:** /signup → creates user, returns token
- **Login:** /login → validates credentials, returns token
- **Frontend:** Stores token in localStorage and attaches it via services/api.ts

## 🧪 Testing

Run backend tests:

```
python -m unittest tests/test_review_copy.py
```

Run the manual flow test:

```
python tests/manual_test_flow.py
```