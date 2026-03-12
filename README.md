# Bridge

Bridge is a multilingual AI health companion for patients and caregivers. It helps users set up a health profile, track medicines, upload health related images, and get short structured safety guidance.

## Features

- Better-Auth
- Guided onboarding with language selection, profile questions, and medicine setup
- Medicine tracking with schedules, daily dose states, and adherence history
- Reminder preferences for in app and local reminder flows
- Image uploads for prescriptions, medicine labels, food labels, meals, menus, and other health related items
- OCR plus Gemini based analysis with structured results such as safety status, flagged risks, and next action
- Multilingual UI and localized patient facing output
- Caregiver invite flow with shared access to linked patient profiles
- PWA support for mobile first use

## Stack

- Next.js App Router
- React 19 and TypeScript
- Convex
- Better Auth
- AI SDK v6 with Google Gemini
- Tesseract OCR
- Tailwind CSS v4 and shadcn/ui
- React Hook Form and Zod
- Serwist
- lingo.dev

## Setup

1. Install dependencies.

```bash
bun install
```

2. Add the required environment variables in `.env.local`.

```bash
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
```

3. Add optional environment variables if you want AI analysis and translations.

```bash
GOOGLE_GENERATIVE_AI_API_KEY=
LINGODOTDEV_API_KEY=
```

4. Start the app.

```bash
bun run dev
```

5. Open [http://localhost:3000](http://localhost:3000).
