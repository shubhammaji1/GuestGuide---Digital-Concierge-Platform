# Supabase Setup Guide for GuestGuide

This guide will help you set up Supabase as your database for GuestGuide.

## Step 1: Create a Supabase Project

1. Go to https://supabase.com
2. Sign up or log in to your account
3. Click **"New Project"**
4. Fill in the project details:
   - **Name**: Choose a name (e.g., "guestguide")
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest region to your users
5. Click **"Create new project"**
6. Wait for the project to be created (~2 minutes)

## Step 2: Get Your Connection String

1. In your Supabase project dashboard, go to **Settings** (gear icon)
2. Click **Database** in the left sidebar
3. Scroll down to **"Connection string"**
4. Select the **"URI"** tab
5. Copy the connection string
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres`
   - Replace `[YOUR-PASSWORD]` with the database password you created

## Step 3: Update Your .env File

Open `backend/.env` and update:

```env
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@YOUR_PROJECT_REF.supabase.co:5432/postgres
```

**Example:**
```env
DATABASE_URL=postgresql://postgres:mypassword123@abcdefghijklmnop.supabase.co:5432/postgres
```

## Step 4: Get Supabase API Keys (for Vector DB)

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values to your `backend/.env`:

```env
# Your project URL
SUPABASE_URL=https://abcdefghijklmnop.supabase.co

# Anon/public key (safe to use in frontend)
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service role key (KEEP SECRET - backend only!)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Important**: Never expose `SUPABASE_SERVICE_KEY` in your frontend code!

## Step 5: Enable pgvector Extension (for RAG)

1. In Supabase dashboard, go to **Database** > **Extensions**
2. Search for **"vector"** or **"pgvector"**
3. Click **Enable** if it's not already enabled

## Step 6: Create Vector Embeddings Table (Optional but Recommended)

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **"New query"**
3. Paste and run this SQL:

```sql
-- Create document embeddings table for RAG
CREATE TABLE IF NOT EXISTS document_embeddings (
  id BIGSERIAL PRIMARY KEY,
  content TEXT,
  chunks TEXT[],
  embeddings FLOAT[][],
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_embeddings_vector 
ON document_embeddings USING ivfflat (embeddings vector_cosine_ops)
WITH (lists = 100);
```

4. Click **"Run"** to execute

## Step 7: Test Your Connection

1. Start your backend:
```bash
cd backend
npm run dev
```

2. You should see:
```
📊 Supabase database connected
✅ Database connected
🚀 Server running on port 3001
```

If you see connection errors:
- Double-check your `DATABASE_URL` in `.env`
- Verify your database password is correct
- Make sure your Supabase project is active
- Check that you're using the correct project reference

## Troubleshooting

### Connection Refused
- Verify your Supabase project is not paused
- Check that you're using the correct connection string format
- Ensure your password doesn't contain special characters that need URL encoding

### SSL Error
- Supabase requires SSL connections (this is handled automatically in the code)
- If you still get SSL errors, check your Node.js version (should be 18+)

### Authentication Failed
- Verify your database password is correct
- Make sure you're using the database password, not your Supabase account password
- Check that the connection string format is correct

### Extension Not Found (pgvector)
- Contact Supabase support to enable pgvector
- Or use a different vector database solution (Pinecone, etc.)

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use environment variables** in production
3. **Rotate your database password** regularly
4. **Keep `SUPABASE_SERVICE_KEY` secret** - it has admin access
5. **Use Row Level Security (RLS)** in Supabase for additional security (optional)

## Next Steps

Once your database is connected:
1. Run the seed script to create demo data: `npm run seed`
2. Start developing your application
3. Check the Supabase dashboard to see your tables being created

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [pgvector Documentation](https://github.com/pgvector/pgvector)

