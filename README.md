# GuestGuide - Digital Concierge Platform

A production-ready SaaS platform that automates 90% of hotel guest communication through AI-powered interactive digital guides.

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase (PostgreSQL-compatible)
- **Vector DB**: Supabase Vector
- **AI**: OpenAI / Claude / Gemini 

## 📁 Project Structure

```
Hotel/
├── backend/          # Node.js + Express API
├── frontend/         # React + TypeScript app
├── shared/           # Shared types and utilities
└── docs/             # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account (free tier works)
- OpenAI API key (or alternative AI provider)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Configure your .env file
npm run dev
```

## 🔑 Environment Variables

See `.env.example` files in backend/ and frontend/ directories.

## 📚 Features

- ✅ Guest web app (mobile-first, no login)
- ✅ Admin dashboard
- ✅ AI chatbot with RAG
- ✅ Analytics & insights
- ✅ Multilingual support
- ✅ Document upload & processing

## 📄 License

Proprietary


