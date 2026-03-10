# Bridge Agent Guide

Bridge is a multilingual AI health companion that collects patient context and returns structured safety guidance.

## Stack

- Next.js App Router + React 19 + TypeScript
- Convex database/functions with Better Auth
- AI SDK v6 + Google Gemini
- Tailwind CSS v4 + shadcn/ui + Tabler icons
- React Hook Form + Zod validation
- Serwist PWA setup + lingo.dev localization workflow

## Commands

| Command             | Purpose                                           |
| ------------------- | ------------------------------------------------- |
| `bun run dev`       | Run app locally with Turbopack                    |
| `bun run build`     | Production build                                  |
| `bun run lint`      | ESLint checks                                     |
| `bun run typecheck` | TypeScript no-emit check                          |
| `bun run translate` | Generate/update locale translations via lingo.dev |

## Installing Dependencies

- Runtime dependency: `bun add <package>`
- Dev dependency: `bun add -d <package>`
- This repo is a single-project app (no workspace filter syntax needed).

## Code Style

- Keep implementation simple and typed: small functions, Zod-validated inputs, minimal abstraction.
- Reuse existing server/client patterns (server pages for data/guards, client components for interactivity).
- Before adding UI text, add locale keys first and use `copy`/`localizedCopy` rather than hardcoded strings.
- Any UI change must be mobile-friendly first, because the app is used as a PWA on phones.
- Prefer incremental Convex mutations for profile/state updates instead of large one-shot writes.

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give a list of unresolved questions to answer, if any.
