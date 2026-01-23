GenieOps Lead Engine
GenieOps is an AI-powered marketing automation platform designed to generate high-converting lead generation funnels in minutes. It takes an Ideal Customer Profile (ICP) and a website URL, analyzes the brand voice, and autonomously generates a complete marketing funnel including lead magnet concepts, downloadable assets (PDFs/Calculators), landing pages, email nurture sequences, and social media promotional posts.
🚀 Features
AI Brand Analysis: Scrapes a provided website URL to extract brand voice, color palette, unique selling propositions, and design vibes.
Lead Magnet Ideation: Generates targeted lead magnet concepts (Checklists, Templates, Calculators) based on ICP pain points using OpenAI (GPT-4o).
Asset Generation: Automatically writes the content for the selected lead magnet (Markdown or JSON logic for interactive calculators).
Landing Page Builder: Generates high-conversion copy and JSON-driven layouts for landing pages, rendered dynamically in React.
Email Nurture Sequences: Creates a multi-touch email sequence (delivery, value-add, upsell) with automated scheduling.
Social Media Distribution: Drafts and publishes promotional posts directly to LinkedIn.
Public-Facing Pages: Hosts generated landing pages and "Thank You" pages with form handling and lead capture.
Dashboard: Manage campaigns, view leads, and track project status.
🛠 Tech Stack
Backend
Framework: Python (FastAPI)
Database: PostgreSQL (SQLModel / SQLAlchemy)
Migrations: Alembic
AI: OpenAI API
Scheduling: APScheduler (Background email sending)
Scraping: Beautiful Soup 4 & HTTPX
Auth: JWT (OAuth2 Password Bearer)
Frontend
Framework: React 19 + Vite
Language: TypeScript
Styling: Tailwind CSS + Custom Cyberpunk/Terminal UI
Icons: Lucide React
Routing: React Router (HashRouter)
📂 Project Structure
code
Code
./
├── alembic/                # Database migrations
├── app/
│   ├── api/                # API Routes (Auth, Campaigns, Generation, Public)
│   ├── core/               # App config and error handling
│   ├── db/                 # Database session and connection
│   ├── models/             # SQLModel database schemas
│   └── services/           # Business logic (LLM, Email, Social, Scraper)
├── components/             # React UI components (Wizard, Renderers)
├── pages/                  # React Pages (Dashboard, Create Flow)
├── services/               # Frontend API clients
└── tests/                  # Backend tests
⚡️ Getting Started
Prerequisites
Python 3.10+
Node.js 18+
PostgreSQL Database
OpenAI API Key
1. Backend Setup
Create a virtual environment:
code
Bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
Install dependencies:
code
Bash
pip install -r requirements.txt
Configure Environment:
Create a .env file in the root directory (see .env.example):
code
Ini
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/genieops
LLM_API_KEY=sk-proj-...
LLM_MODEL=gpt-4o-mini
JWT_SECRET=your_secret_key
EMAIL_PROVIDER=none  # or 'mailersend' / 'sendgrid'
# Optional External Integrations
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
UNSPLASH_ACCESS_KEY=...
Run Migrations:
Initialize the database schema:
code
Bash
alembic upgrade head
Start the Server:
code
Bash
uvicorn app.main:app --reload
The API will be available at http://127.0.0.1:8000. API Docs at /docs.
2. Frontend Setup
Install dependencies:
code
Bash
npm install
Configure Environment:
Create a .env.local file:
code
Ini
VITE_APP_BASE_URL=http://localhost:5173
# If backend is on a different domain/port not handled by proxy:
# VITE_API_BASE_URL=http://127.0.0.1:8000
Start the Development Server:
code
Bash
npm run dev
Access the application at http://localhost:3000 (or the port shown in terminal).
🧩 Key Features Breakdown
The "Wizard" Flow (/create)
The core user experience is a step-by-step wizard located in components/Wizard/:
Audience & Goals: Define ICP or import from LinkedIn post analysis.
Ideation: Generates 3 unique lead magnet angles.
Asset Creation: Generates the actual content (text or calculator logic).
Landing Page: Generates copy and design configuration.
Nurture: Generates email sequences and upgrade offers.
Social: Generates a LinkedIn hook and connects to API for publishing.
Landing Page Renderer (components/LandingPageRenderer.tsx)
A dynamic engine that takes a JSON configuration (headline, sections, theme, form schema) and renders a responsive landing page. It supports multiple visual variants (split_feature, bento_grid, hero, etc.) and themes (light/dark).
Calculator Widget (components/CalculatorWidget.tsx)
A secure, tokenizer-based math evaluator that renders interactive ROI/Diagnostic calculators defined by the AI in the Asset Generation step.
📧 Email & Scheduler
The system runs a background scheduler (app/services/email_scheduler.py) that checks for due emails every 30 seconds. Emails are stored in the email_logs table and sent via the configured provider (MailerSend or SendGrid).
🔒 Authentication
The platform uses JWT authentication.
Sign Up: /signup -> creates user, returns token.
Login: /login -> validates credentials, returns token.
Frontend: Stores token in localStorage and attaches to API requests via services/api.ts.
🧪 Testing
Run backend tests using:
code
Bash
python -m unittest tests/test_review_copy.py
Or run the manual flow test script:
code
Bash
python tests/manual_test_flow.py