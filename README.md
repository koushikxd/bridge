# Bridge

Bridge is a multilingual AI health companion built for a hackathon.

It helps patients and caregivers set up a simple health profile, track medicines, scan prescriptions or food labels, and get short safety guidance in their preferred language.

## Preview

[![Bridge Demo](https://img.youtube.com/vi/p9Zu4Umf0DM/maxresdefault.jpg)](https://youtu.be/p9Zu4Umf0DM)

**[Blog Post](https://dev.to/koushikxd/i-built-bridge-a-multilingual-ai-health-companion-for-everyone-2185)**

## What Bridge does

- Multilingual onboarding with language selection and guided profile setup
- AI chat during onboarding to collect health context one step at a time
- Medicine tracking with dosage, schedule, duration, and daily dose states
- Daily dashboard with adherence progress, next dose, and recent scans
- Scan health-related images and get structured safety feedback
- Supports prescriptions, medicine labels, food labels, meals, menus, and general health images (in any language/locale)
- Voice input and spoken responses for onboarding and the assistant (TTS and SST)
- Caregiver invite flow with shared access to linked patient profiles
- Localized UI and patient-facing responses in multiple languages
- Mobile-first PWA experience

## How it works

1. Sign up and choose your preferred language.
2. Complete onboarding by sharing basic health details like allergies, conditions, and restrictions.
3. Add medicines with timings and duration.
4. Use the dashboard to track doses and adherence.
5. Upload a prescription, food label, medicine label, meal photo, or menu.
6. Bridge uses Gemini + OCR fallback to return short, structured safety guidance in the user’s language.

## Features

- **AI health scan analysis**: analyzes uploaded images and returns detected item, safety status, flagged risks, and next action
- **Profile-aware checks**: matches scans against allergies, chronic conditions, dietary restrictions, religious restrictions, and current medicines
- **Localized scan output**: after scanning, Bridge translates the generated safety summary into the user's default language
- **Food labels and menus across languages**: users can upload labels or menus from other countries/languages and read the result in their own language
- **Medicine management**: create and update medicines, schedules, active state, and reminders
- **Care network**: invite a caregiver and let them view the linked profile
- **Voice-friendly UX**: speech-to-text input and text-to-speech output for accessibility
- **Localized experience**: the full app UI is translated and patient-facing responses adapt to the user's language

## Tech stack

- Next.js App Router + React 19 + TypeScript
- Convex + Better Auth
- AI SDK v6 + Google Gemini
- Tesseract OCR fallback
- Tailwind CSS v4 + shadcn/ui
- React Hook Form + Zod
- Serwist PWA
- lingo.dev for localization workflow

## Setup

1. Install dependencies.

```bash
bun install
```

2. Create `.env.local`.

```bash
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
SITE_URL=http://localhost:3000
GOOGLE_GENERATIVE_AI_API_KEY=
LINGODOTDEV_API_KEY=
```

3. Start Convex in another terminal.

```bash
bunx convex dev
```

4. Start the app.

```bash
bun run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

## Notes

- `GOOGLE_GENERATIVE_AI_API_KEY` is needed for the AI assistant and scan analysis.
- `LINGODOTDEV_API_KEY` is optional, but recommended for better localization of generated output.
- Convex backend env vars are separate from `.env.local`. If you add a new env var for Convex functions, run:

```bash
npx convex env set KEY value
```

## Scripts

```bash
bun run dev
bun run build
bun run lint
bun run typecheck
bun run translate
```
