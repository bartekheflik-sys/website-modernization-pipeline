# Website Modernization Platform - Foundation

This is a scalable automation platform monorepo powered by Turborepo, Next.js, and Supabase.

## Architecture

The project follows a standard scalable monorepo structure:

```
/apps
  /dashboard       - Next.js App Router for the main user interface
  /api             - Next.js API holding the REST endpoints
/packages
  /shared-types    - Shared TypeScript interfaces across the workspace
  /ui              - Future shared React components
/services          - Future microservices/workers
  /crawler         - Will handle web scraping
  /prompt-engine   - Will generate advanced AI prompts
  /qa-engine       - Will validate the generated websites
  /lovable-bot     - Will interact with Lovable API
/infra
  schema.sql       - Supabase SQL migrations
```

## Setup & Running Locally

1. **Install Dependencies**
   Since this uses Turborepo, install dependencies at the root level using pnpm:
   ```bash
   pnpm install
   ```

2. **Environment Variables**
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   Fill in the Supabase keys from your Supabase dashboard (Project Settings > API).

3. **Database Setup**
   - Go to your Supabase project's SQL Editor.
   - Run the SQL queries located in `/infra/schema.sql`.
   - This sets up the tables with Row Level Security (RLS) configured for public access during the foundation phase.

4. **Run Development Servers**
   Start the Turborepo pipeline from the root directory:
   ```bash
   pnpm dev
   ```
   This will spin up both apps simultaneously:
   - Dashboard: `http://localhost:3000`
   - API: `http://localhost:3001`

## Connecting n8n Workflow

The platform provides a webhook trigger placeholder inside `apps/api/app/api/webhook/route.ts`.

When you're ready to integrate n8n:
1. Create a Webhook trigger node in n8n.
2. Update the `.env.local` file with the n8n webhook URL (`N8N_WEBHOOK_URL`).
3. In `apps/api/app/api/projects/route.ts`, uncomment the `fetch` call that triggers the n8n webhook.
4. The n8n workflow can receive the `projectId` and `url`, process it through the crawling and AI steps, and send a `POST` request back to `/api/webhook` to update the project status using Supabase.
