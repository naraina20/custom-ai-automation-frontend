# NexusAI Frontend — Next.js 16 & React 19 Web Application

The frontend client application for **NexusAI**, built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Clerk Authentication**. It provides an intuitive interface for building custom AI tools, reviewing Human-in-the-Loop (HITL) checkpoints, connecting Google Workspace assets, and chatting with autonomous AI agents.

---

## 🛠️ Tech Stack & Key Libraries

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server & Client Components)
- **UI Library**: React 19 (`react`, `react-dom`)
- **Language**: TypeScript (`~6.0.3`)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/postcss`
- **Authentication**: [Clerk](https://clerk.com/) (`@clerk/nextjs`)
- **Google Integrations**:
  - `@googleworkspace/drive-picker-element` & `@googleworkspace/drive-picker-react` (Google Drive & Sheets file picker)
  - `@react-oauth/google` (Google OAuth consent)
- **Icons & Animations**: `lucide-react`, `framer-motion`, `@tsparticles/react`, `@tsparticles/slim`
- **Markdown Rendering**: `react-markdown`

---

## 📂 Architecture & Directory Structure

```text
frontend/
├── public/                 # Static public assets & icons
├── src/
│   ├── app/                # Next.js App Router pages and API routes
│   │   ├── layout.tsx      # Root layout with ClerkProvider, NotificationProvider & AppShell
│   │   ├── page.tsx        # Homepage & feature overview
│   │   ├── globals.css     # Global styles & Tailwind CSS v4 configuration
│   │   ├── api/
│   │   │   └── proxy/      # Next.js server proxy forwarding requests to Django backend
│   │   ├── chat/           # Agent execution chat view
│   │   ├── gst-tax-chat/   # GST tax analysis chatbot with file upload support
│   │   ├── sign-in/        # Clerk sign-in page
│   │   ├── sign-up/        # Clerk sign-up page
│   │   └── tools/          # Custom AI Tools hub
│   │       ├── page.tsx            # Tool creation, listing, configuration & deployment
│   │       ├── hitl-review/        # Human-in-the-loop pending approval dashboard
│   │       └── oauth-reauth/       # Google OAuth reauthorization & consent screen
│   │
│   ├── components/         # Reusable React components
│   │   ├── chat/           # TaxChatView and message components
│   │   ├── home/           # Landing page navbar & auth status controls
│   │   ├── layout/         # AppShell navigation, header, sidebar & NotificationPanel
│   │   ├── providers/      # Context providers (GoogleAuthProvider, Clerk)
│   │   ├── tools/          # ToolCard, CreateToolModal, EditToolModal, ToolDeployModal,
│   │   │                   # ToolExecuteModal, GoogleDrivePicker, GoogleOAuthConsentButton
│   │   └── ui/             # UI primitives (ParticlesBackground, buttons, dialogs)
│   │
│   ├── config/
│   │   └── site.ts         # Global site metadata, navigation links & branding
│   ├── lib/
│   │   ├── api-client.ts   # Centralized fetch wrapper for backend communication
│   │   ├── NotificationContext.tsx # Context for real-time WebSocket alerts & badges
│   │   └── types.ts        # Shared TypeScript interfaces (CustomTool, Deployment, etc.)
│   └── middleware.ts       # Clerk middleware for protecting authenticated routes
│
├── .env.local              # Local environment variables (ignored by Git)
├── env.example             # Example environment variables template
├── next.config.mjs         # Next.js configuration
├── package.json            # Node.js dependencies & scripts
├── postcss.config.mjs      # PostCSS configuration for Tailwind CSS v4
└── tsconfig.json           # TypeScript configuration
```

---

## 🔑 Key Features

1. **AI Tool Builder & Deployment**:
   - Create multi-step workflows from natural language prompts.
   - Configure input parameters, execution constraints, and external integrations (Webhooks, Google Sheets, Gmail).
   - Instant deployment with unique inbound webhook endpoints and live testing modals.

2. **Human-in-the-Loop (HITL) Review Dashboard (`/tools/hitl-review`)**:
   - Inspect paused workflows awaiting manual confirmation.
   - Review planned tool execution steps, adjust parameters, and approve or reject actions in real time.

3. **Google Workspace Asset Connection**:
   - One-click Google OAuth authentication.
   - Native Google Drive & Google Sheets selector to link spreadsheets directly into automated reasoning graphs.

4. **Real-Time WebSocket Notifications**:
   - Instant push notifications for webhook triggers, graph completions, and review requests via `NotificationPanel`.

---

## 🚀 Setup & Local Development

### 1. Prerequisites

- Node.js 20 or newer
- `npm`, `pnpm`, or `yarn`

### 2. Environment Configuration

Copy the example environment file and fill in your keys:

```bash
cp env.example .env.local
```

Required environment variables in `.env.local`:

```env
# Clerk Authentication Keys (https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk Routing URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Internal Backend Gateway (Django REST Framework)
BACKEND_API_URL=http://127.0.0.1:8000

# Dynamic Company / Brand Name
NEXT_PUBLIC_COMPANY_NAME=NexusAI
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 5. Build for Production

```bash
npm run build
npm run start
```
