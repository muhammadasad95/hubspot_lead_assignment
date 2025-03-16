
# HubSpot Lead Assignment System

An AI-powered system for automatically assigning leads to sales agents based on matching scores and specialties.

## Features

- Automatic lead assignment using AI scoring
- Integration with HubSpot CRM
- Real-time agent performance tracking
- Dashboard with analytics
- Specialty-based matching

## Prerequisites

- Node.js 20.x or higher
- HubSpot API access token
- OpenAI API key

## Setup Instructions

1. Clone this repository in Replit or create a new Repl from this template

2. Set up environment variables in Replit's Secrets tab:
   - `HUBSPOT_ACCESS_TOKEN`: Your HubSpot API access token
   - `OPENAI_API_KEY`: Your OpenAI API key

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at port 5000.

## Project Structure

- `/client` - React frontend code
- `/server` - Express backend code
  - `hubspot.ts` - HubSpot API integration
  - `openai.ts` - OpenAI integration for scoring
  - `routes.ts` - API endpoints
- `/shared` - Shared types and schemas

## API Endpoints

- `GET /api/leads` - Get all unassigned leads
- `GET /api/agents` - Get all sales agents
- `GET /api/assignments` - Get lead assignments
- `POST /api/assignments` - Create new lead assignment

## Technology Stack

- Frontend: React, TailwindCSS, shadcn/ui
- Backend: Express.js, TypeScript
- APIs: HubSpot, OpenAI
- Database: PostgreSQL with Drizzle ORM
