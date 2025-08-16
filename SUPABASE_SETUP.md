# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in the details:
   - **Name**: `pbco-app`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: **Australia (Sydney)** - Important for data residency
   - **Pricing Plan**: Free tier

## Step 2: Get Project Credentials

1. Go to **Settings > API** in your Supabase dashboard
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **anon/public key** (starts with `eyJ`)
   - **service_role key** (starts with `eyJ`) - Keep this secret!

## Step 3: Set Up Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Step 4: Run Database Schema

### Option A: Using Supabase Dashboard (Recommended)

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the entire contents of `database/schema.sql`
3. Paste it into the SQL editor
4. Click "Run" to execute the schema

### Option B: Using Supabase CLI

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link your project: `supabase link --project-ref your-project-id`
4. Run migrations: `supabase db push`

## Step 5: Test Database Connection

After setting up the schema, test the connection:

```bash
npm run test:db
```

## Step 6: Configure Authentication

1. Go to **Authentication > Settings** in Supabase dashboard
2. Configure:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/auth/callback`
3. Enable email confirmations (optional for development)

## Step 7: Set Up Row Level Security (RLS)

The RLS policies are included in the schema.sql file and will be automatically applied when you run it.

## Step 8: Create Admin User

1. Go to **Authentication > Users** in Supabase dashboard
2. Create a new user with admin role:
   ```sql
   INSERT INTO public.users (id, email, role) 
   VALUES ('your-user-id', 'admin@example.com', 'admin');
   ```

## Verification Checklist

- [ ] Supabase project created in AU region
- [ ] Environment variables configured
- [ ] Database schema executed successfully
- [ ] Authentication settings configured
- [ ] RLS policies applied
- [ ] Admin user created
- [ ] Database connection test passes

## Troubleshooting

### Common Issues:

1. **"Cannot find module" errors**: Run `npm install` again
2. **Database connection fails**: Check your environment variables
3. **RLS policies not working**: Ensure the schema was executed completely
4. **Authentication issues**: Check redirect URLs in Supabase settings

### Getting Help:

- Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Review the database schema in `database/schema.sql`
- Check the TypeScript types in `src/types/index.ts`
