# Graphic Novel Reader with Supabase Integration

A Next.js application for reading and learning Japanese through graphic novels, with Supabase as the backend.

## Features

- **User Authentication**: Sign up, login, and profile management using Supabase Auth
- **Admin Dashboard**: Create and manage stories, chapters, and panels
- **Database Schema**: Structured database for stories, chapters, panels, sentences, and words
- **Protected Routes**: Middleware to ensure only authenticated users can access certain pages

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI Components**: Custom components based on Radix UI primitives

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Docker (for local Supabase development)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd graphic-novel-reader
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. Apply database migrations:
   ```bash
   npm run migrate
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Setting Up Admin Access

To set up an admin account:

1. Register a new user account at `/register`
2. Navigate to `/admin-setup` in your browser
3. Enter the setup key: `setup-graphic-novel-admin`
4. Enter the email address of the user you want to make an admin
5. The user will now have admin privileges and can access the admin dashboard

## Database Schema

The application uses the following database schema:

- **stories**: Main story information (titles, description, difficulty level, etc.)
- **chapters**: Chapters belonging to stories
- **panels**: Visual panels within chapters
- **sentences**: Japanese sentences within panels
- **words**: Individual words within sentences with translations and notes
- **user_progress**: Tracks user progress through stories

## Authentication

The application uses Supabase Auth for user authentication. Protected routes include:

- `/admin/*`: Admin dashboard and management pages
- `/profile/*`: User profile and settings

## Troubleshooting

### Common Issues

1. **Login Redirect Not Working**: Make sure your Supabase Auth is properly configured and the middleware is correctly set up.

2. **Admin Access Denied**: If you can't access the admin dashboard, make sure your account has admin privileges. Visit `/admin-setup` to set up an admin account.

3. **Profile Page Not Loading**: Ensure you're logged in and the authentication state is properly managed.

## Deployment

This application can be deployed to any platform that supports Next.js applications, such as Vercel or Netlify.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 