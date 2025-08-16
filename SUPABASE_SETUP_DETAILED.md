# 🚀 Detailed Supabase Setup Guide

## Prerequisites
- A web browser (Chrome, Firefox, Safari, or Edge)
- Your project ready (✅ Already done!)

## Step 1: Create Supabase Account & Project

### 1.1 Go to Supabase
1. Open your browser
2. Go to: https://supabase.com
3. Click **"Start your project"** or **"Sign In"** if you already have an account

### 1.2 Sign In/Create Account
1. If you don't have an account:
   - Click **"Sign up"**
   - Choose **GitHub** (recommended) or **Google**
   - Authorize the connection
2. If you have an account:
   - Sign in with your existing credentials

### 1.3 Create New Project
1. Once logged in, you'll see the Supabase dashboard
2. Click the **"New Project"** button (usually a big blue button)
3. You'll be taken to the project creation form

### 1.4 Fill in Project Details
**Organization:**
- If you don't have an organization, create one:
  - Click **"Create a new organization"**
  - Enter organization name: `pbco-app-org` (or your preferred name)
  - Click **"Create organization"**

**Project Settings:**
- **Name**: `pbco-app` (or your preferred name)
- **Database Password**: 
  - Click **"Generate a password"** 
  - **IMPORTANT**: Copy this password and save it somewhere secure!
  - This is your database admin password
- **Region**: **Australia (Sydney)** - This is crucial for data residency
- **Pricing Plan**: Select **Free** (or Pro if you have it)

### 1.5 Create Project
1. Click **"Create new project"**
2. Wait for the project to be created (this takes 1-2 minutes)
3. You'll see a success message when it's ready

## Step 2: Get Your Project Credentials

### 2.1 Navigate to API Settings
1. In your new project dashboard, look for the left sidebar
2. Click on **"Settings"** (gear icon)
3. Click on **"API"** in the settings submenu

### 2.2 Copy Required Keys
You'll see three important sections:

**Project URL:**
- Copy the **Project URL** (starts with `https://`)
- Example: `https://abcdefghijklmnop.supabase.co`

**Project API keys:**
- Copy the **anon public** key (starts with `eyJ`)
- Copy the **service_role** key (starts with `eyJ`)
- **⚠️ IMPORTANT**: Keep the service_role key secret - never expose it in client-side code!

## Step 3: Set Up Environment Variables

### 3.1 Create .env.local File
1. In your project root directory (`/Users/alex/Documents/GitHub/pbco-app`)
2. Create a new file called `.env.local`
3. Open it in your code editor

### 3.2 Add Your Credentials
Copy and paste this template, then replace the values with your actual credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Replace these values:**
- `https://your-project-id.supabase.co` → Your actual Project URL
- `your_anon_key_here` → Your actual anon public key
- `your_service_role_key_here` → Your actual service_role key

### 3.3 Save the File
1. Save the `.env.local` file
2. Make sure it's in your project root (same level as `package.json`)

## Step 4: Set Up Database Schema

### 4.1 Method 1: Using Supabase Dashboard (Recommended)

1. **Go to SQL Editor:**
   - In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
   - Click **"New query"**

2. **Copy the Schema:**
   - Open the file `database/schema.sql` in your project
   - Copy all the content

3. **Paste and Run:**
   - Paste the SQL into the Supabase SQL Editor
   - Click **"Run"** button
   - You should see success messages

### 4.2 Method 2: Using Our Script (Alternative)

1. **Run the setup script:**
   ```bash
   npm run test:db
   ```

2. **Check for errors:**
   - If successful, you'll see "✅ Database schema created successfully!"
   - If there are errors, check your environment variables

## Step 5: Verify Setup

### 5.1 Check Database Tables
1. In Supabase dashboard, go to **"Table Editor"**
2. You should see these tables:
   - `users`
   - `profiles`
   - `portfolios`
   - `properties`
   - `loans`
   - `cashflow_forecasts`
   - `reference_data`

### 5.2 Test Connection
1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:3000`
3. You should see the landing page without errors

## Step 6: Configure Authentication (Optional for now)

### 6.1 Set Up Auth Settings
1. In Supabase dashboard, go to **"Authentication"** → **"Settings"**
2. Configure your site URL: `http://localhost:3000`
3. Add redirect URLs: `http://localhost:3000/auth/callback`

## Troubleshooting

### Common Issues:

**"Cannot find module" errors:**
- Run: `npm install` to reinstall dependencies

**"Invalid API key" errors:**
- Double-check your environment variables
- Make sure you copied the keys correctly
- Restart your development server after changing `.env.local`

**Database connection errors:**
- Verify your Supabase project is active
- Check that you're using the correct region
- Ensure your database password is correct

**Permission errors:**
- Make sure you're using the service_role key for admin operations
- Check that RLS policies are set up correctly

## Next Steps

Once Supabase is set up:
1. ✅ Test the connection
2. 🔄 Set up authentication flows
3. 🔄 Create the first user interface
4. 🔄 Implement portfolio management

## Need Help?

If you encounter any issues:
1. Check the Supabase documentation: https://supabase.com/docs
2. Look at the error messages in your terminal
3. Verify all environment variables are set correctly
