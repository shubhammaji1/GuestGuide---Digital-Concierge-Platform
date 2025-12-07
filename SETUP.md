# GuestGuide Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (or Supabase account)
- OpenAI API key (or alternative AI provider)
- Supabase account (for vector database - optional but recommended)

## Installation

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup (Supabase)

1. **Create a Supabase project**
   - Go to https://supabase.com
   - Sign up or log in
   - Click "New Project"
   - Choose a name, database password, and region
   - Wait for the project to be created (takes ~2 minutes)

2. **Get your connection string**
   - Go to your Supabase project dashboard
   - Navigate to **Settings** > **Database**
   - Under "Connection string", select "URI"
   - Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres`)

3. **Update `backend/.env`**
   - Paste your Supabase connection string into `DATABASE_URL`
   - Replace `[YOUR-PASSWORD]` with the database password you set when creating the project
   - Example: `DATABASE_URL=postgresql://postgres:mypassword123@abcdefghijklmnop.supabase.co:5432/postgres`

4. **Get Supabase API keys** (for vector DB features)
   - In your Supabase dashboard, go to **Settings** > **API**
   - Copy the "Project URL" → `SUPABASE_URL`
   - Copy the "anon public" key → `SUPABASE_KEY`
   - Copy the "service_role" key → `SUPABASE_SERVICE_KEY` (keep this secret!)

### 3. Environment Configuration

#### Backend (.env)

The `.env` file has been created from `backend/env.template`. Update it with your actual values:

```env
# Server
PORT=3001
NODE_ENV=development

# Database (Supabase)
# Get from Supabase Dashboard > Settings > Database
DATABASE_URL=postgresql://postgres:your-password@your-project-ref.supabase.co:5432/postgres

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Session
SESSION_SECRET=your-super-secret-session-key-change-in-production

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Vector DB (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# CORS
FRONTEND_URL=http://localhost:5173

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

#### Frontend (.env)

The `.env` file has been created from `frontend/env.template`. Update it if needed:

```env
VITE_API_URL=http://localhost:3001
```

### 4. Database Migration & Seeding

```bash
cd backend

# Run migrations (automatic on server start)
npm run dev

# In another terminal, seed the database
npm run seed
```

This will create:
- A demo hotel (slug: `demo`)
- An admin user (email: `admin@demohotel.com`, password: `admin123`)
- Sample FAQs and guide sections

### 5. Vector Database Setup (Optional but Recommended)

For RAG (Retrieval-Augmented Generation) to work with document embeddings:

1. **Enable pgvector extension** (if not already enabled):
   - Go to Supabase Dashboard > **Database** > **Extensions**
   - Search for "vector" and enable it

2. **Create the embeddings table**:
   - Go to Supabase Dashboard > **SQL Editor**
   - Run this SQL:
   ```sql
   CREATE TABLE IF NOT EXISTS document_embeddings (
     id BIGSERIAL PRIMARY KEY,
     content TEXT,
     chunks TEXT[],
     embeddings FLOAT[][],
     metadata JSONB,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. **Create an index** (for better search performance):
   ```sql
   CREATE INDEX IF NOT EXISTS idx_embeddings_vector 
   ON document_embeddings USING ivfflat (embeddings vector_cosine_ops)
   WITH (lists = 100);
   ```
   
   Note: If you get an error about vector type, you may need to install the pgvector extension first. Supabase usually has it pre-installed, but if not, contact Supabase support.

### 6. Start Development Servers

#### Option A: Run separately

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

#### Option B: Run together (from root)

```bash
npm run dev
```

## Access the Application

- **Guest App**: http://localhost:5173/hotel/demo
- **Admin Dashboard**: http://localhost:5173/admin/login
  - Email: `admin@demohotel.com`
  - Password: `admin123`

## Production Deployment

### Backend

1. Build the backend:
```bash
cd backend
npm run build
```

2. Deploy to Railway/Render:
   - Set environment variables
   - Point to your Supabase database (use DATABASE_URL)
   - Configure CORS for your frontend domain

### Frontend

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Deploy to Vercel/Netlify:
   - Set `VITE_API_URL` to your backend URL
   - Deploy the `dist` folder

## Features

✅ Guest web app (mobile-first, no login)
✅ Admin dashboard with authentication
✅ AI chatbot with RAG
✅ FAQ management
✅ Document upload & processing
✅ Analytics & insights
✅ Multilingual support (EN, ES, FR)
✅ Guide sections management
✅ Hotel branding customization

## Troubleshooting

### Database Connection Issues
- Verify your Supabase project is active (check Supabase dashboard)
- Check connection string in `.env` - make sure password is correct
- Ensure SSL is enabled (Supabase requires SSL - handled automatically)
- Verify you're using the correct project reference in the connection string

### AI Not Working
- Verify OpenAI API key is set
- Check API key has sufficient credits
- Review error logs in backend console

### Vector DB Issues
- Ensure Supabase credentials are correct
- Verify `document_embeddings` table exists
- Check Supabase service key permissions

## Support

For issues or questions, check the logs:
- Backend: Check terminal output
- Frontend: Check browser console
- Database: Check PostgreSQL logs

