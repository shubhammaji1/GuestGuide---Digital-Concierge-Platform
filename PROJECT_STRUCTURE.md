# GuestGuide Project Structure

## Overview

GuestGuide is a production-ready SaaS platform for hotels that automates guest communication through AI-powered digital guides.

## Directory Structure

```
Hotel/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── db/            # Database connection & migrations
│   │   ├── middleware/    # Auth, error handling, rate limiting
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic (AI, analytics, document processing)
│   │   ├── types/         # TypeScript type definitions
│   │   └── index.ts        # Express app entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/               # React + TypeScript SPA
│   ├── src/
│   │   ├── api/           # API client configuration
│   │   ├── components/    # React components
│   │   │   ├── admin/     # Admin dashboard components
│   │   │   └── guest/     # Guest app components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand state management
│   │   ├── i18n/          # Internationalization
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── README.md
├── SETUP.md
└── package.json           # Root workspace config
```

## Backend Architecture

### Database Schema

- **hotels**: Hotel information, branding, WiFi, timing
- **users**: Admin/staff accounts with role-based access
- **faqs**: Frequently asked questions per hotel
- **documents**: Uploaded PDFs/DOCX for AI training
- **chat_logs**: All guest chat interactions
- **analytics_events**: Event tracking for insights
- **guide_sections**: Structured hotel guide content
- **migrations**: Tracks executed database migrations

### API Routes

- `/api/auth` - Authentication (login, register, me)
- `/api/hotels` - Hotel CRUD operations
- `/api/faqs` - FAQ management
- `/api/documents` - Document upload/management
- `/api/chat` - AI chat interface
- `/api/analytics` - Analytics dashboard data
- `/api/guest` - Public guest endpoints
- `/api/guide-sections` - Guide sections management

### Services

- **aiService.ts**: RAG-based AI chatbot using OpenAI
- **documentProcessor.ts**: PDF/DOCX text extraction & embeddings
- **analytics.ts**: Event tracking and reporting

## Frontend Architecture

### Guest App (`/hotel/:slug`)

- Mobile-first responsive design
- No login required
- Chat interface with AI
- Guide sections browser
- Language switcher (EN, ES, FR)
- Quick action buttons (WiFi, check-in, etc.)

### Admin Dashboard (`/admin/*`)

- Secure JWT authentication
- Dashboard with key metrics
- FAQ management (CRUD)
- Document upload & management
- Analytics & insights
- Hotel settings & branding

### State Management

- Zustand for global state (auth)
- React hooks for component state
- LocalStorage persistence for auth

## Key Features

### ✅ Implemented

1. **Guest Experience**
   - QR code accessible (via slug)
   - Mobile-first UI
   - Real-time chat with AI
   - Guide sections
   - Language switching
   - Quick actions menu

2. **AI Concierge**
   - RAG implementation with vector DB
   - OpenAI integration
   - Document-based training
   - Confidence scoring
   - Escalation to staff
   - Fallback to FAQs

3. **Admin Dashboard**
   - Secure authentication
   - FAQ management
   - Document upload (PDF, DOCX, TXT)
   - Analytics dashboard
   - Hotel settings & branding
   - Guide sections management

4. **Analytics**
   - Chat message tracking
   - AI resolution rate
   - Confidence metrics
   - Top questions
   - Daily activity charts
   - Hours saved estimation

5. **Multilingual**
   - English, Spanish, French
   - i18n integration
   - Language switcher in guest app

## Technology Stack

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL
- OpenAI API
- Supabase (vector DB)
- JWT authentication
- Express sessions

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand
- Axios
- i18next
- Lucide React icons

## Security Features

- JWT-based admin authentication
- Session-based guest access
- Rate limiting on API endpoints
- CORS configuration
- Password hashing (bcrypt)
- Role-based access control
- Input validation

## Deployment

### Backend
- Railway / Render recommended
- Requires PostgreSQL database
- Environment variables required
- File uploads stored locally (can use S3)

### Frontend
- Vercel / Netlify recommended
- Static build output
- Environment variables for API URL

## Next Steps / Enhancements

Potential improvements:
- [ ] WhatsApp integration
- [ ] Email notifications
- [ ] SMS support
- [ ] Advanced analytics
- [ ] A/B testing for AI responses
- [ ] Multi-hotel management (super admin)
- [ ] API rate limiting per hotel
- [ ] Webhook support
- [ ] Export analytics reports
- [ ] Custom AI model fine-tuning

