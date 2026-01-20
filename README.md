# GenieOps Lead Engine

> AI-powered B2B lead generation and campaign automation platform

GenieOps Lead Engine is a comprehensive full-stack application that streamlines the creation of high-converting B2B lead generation campaigns. Using advanced AI models, it generates personalized lead magnets, landing pages, email sequences, and social media content—all tailored to your ideal customer profile.

---

## Features

### 🎯 **Intelligent Campaign Wizard**

- **ICP Profiling**: Define your target audience with role, industry, company size, pain points, and goals
- **AI-Powered Ideation**: Generate multiple lead magnet concepts optimized for conversion
- **Asset Creation**: Automatically create checklists, templates, calculators, reports, and more
- **Brand Voice Integration**: Maintain consistent tone across all generated content

### 🎨 **Advanced Landing Page Builder**

- **Structured Content Generation**: AI creates sections, testimonials, FAQs, and forms
- **Visual Form Builder**: Drag-and-drop interface to customize lead capture forms
- **Live Preview**: Real-time editing with desktop and mobile views
- **Hero Image Generation**: Context-aware images aligned with your brand and audience
- **React-Based Rendering**: Seamless, instant updates without iframe limitations

### 📧 **Email Nurture Sequences**

- **Multi-Touch Campaigns**: Generate 3-5 email sequences with strategic timing
- **Intent-Based Messaging**: Emails designed for education, engagement, and conversion
- **Upgrade Offers**: AI-suggested upsell and cross-sell opportunities

### 📱 **Social Media Integration**

- **LinkedIn Post Generation**: Platform-optimized promotional content
- **Brand-Aligned Messaging**: Posts that reflect your unique voice and value proposition

### 💾 **Project Management**

- **Dashboard**: View, edit, and manage all campaigns in one place
- **Asset Library**: Read-only view of all generated campaign materials
- **Edit Mode**: Modify existing campaigns using the intelligent wizard

---

## Tech Stack

### **Backend**

- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Migrations**: Alembic
- **AI Integration**: OpenAI, Google Gemini, Perplexity APIs
- **Email**: SendGrid (configurable)
- **Background Tasks**: APScheduler for email automation

### **Frontend**

- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **Build Tool**: Vite
- **State Management**: React Context API

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **PostgreSQL** 14+
- **API Keys**: OpenAI, Google Gemini, or Perplexity (at least one)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/genieops-lead-engine.git
cd genieops-lead-engine
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database and API credentials

# Run migrations
alembic upgrade head

# Start the server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with API base URL

# Start development server
npm run dev
```

The application will be available at:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## Configuration

### Backend Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/genieops

# LLM Provider (openai, gemini, or perplexity)
LLM_PROVIDER=gemini
LLM_API_KEY=your_api_key_here
LLM_MODEL=gemini-1.5-flash
LLM_TEMPERATURE=0.4
LLM_MAX_TOKENS=2048

# Email (optional)
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=your_sendgrid_key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=GenieOps
```

### Frontend Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## Project Structure

```
genieops-lead-engine/
├── backend/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── models/       # Database & Pydantic schemas
│   │   ├── services/     # Business logic
│   │   ├── core/         # Configuration
│   │   └── db/           # Database session management
│   ├── alembic/          # Database migrations
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route pages
│   │   ├── services/     # API clients
│   │   ├── context/      # React context providers
│   │   └── types.ts      # TypeScript definitions
│   └── package.json
│
└── README.md
```

---

## Usage

### Creating a Campaign

1. **Define Your Audience**: Enter ICP details (role, industry, pain points, goals)
2. **Review Ideas**: AI generates 3 lead magnet concepts tailored to your audience
3. **Generate Asset**: Select an idea and create the content (PDF, template, etc.)
4. **Design Landing Page**: Customize headline, form fields, and hero image
5. **Build Email Sequence**: Review and edit AI-generated nurture emails
6. **Promote**: Get a LinkedIn post to drive traffic to your campaign

### Managing Campaigns

- **Dashboard**: View all projects with status, assets, and email metrics
- **View Assets**: See a read-only summary of all campaign materials
- **Modify**: Edit existing campaigns using the wizard with pre-filled data

---

## API Documentation

Once the backend is running, interactive API documentation is available at:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Database Migrations

```bash
cd backend

# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## Deployment

### Backend (Example: Railway, Render, Heroku)

1. Set environment variables in your platform
2. Ensure PostgreSQL database is provisioned
3. Run migrations on deployment: `alembic upgrade head`
4. Start with: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend (Example: Vercel, Netlify, Cloudflare Pages)

1. Build: `npm run build`
2. Set `VITE_API_BASE_URL` to your production backend URL
3. Deploy the `dist/` folder

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request


---

## Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- UI powered by [React](https://react.dev/) and [TailwindCSS](https://tailwindcss.com/)
- AI capabilities via [OpenAI](https://openai.com/), [Google Gemini](https://deepmind.google/technologies/gemini/), and [Perplexity](https://www.perplexity.ai/)
