# Proof Social

A Bun-first starter using Next.js App Router on the frontend and Convex on the backend.

## Stack

- Bun
- Next.js 16
- React 19
- Convex

## Getting started

```bash
bun install
bun run dev:backend
```

The first `bun run dev:backend` will prompt you to sign in to Convex and create or connect a dev deployment. Once that finishes, Convex will write your deployment URL into `.env.local`.

After that, run the full local stack:

```bash
bun run dev
```

This starts:

- Next.js at `http://localhost:3000`
- Convex in watch mode

## Useful scripts

- `bun run dev` starts both Next.js and Convex together
- `bun run dev:web` starts only the Next.js app
- `bun run dev:backend` starts only Convex
- `bun run build` creates a production build

## Project shape

- `src/app` contains the App Router UI
- `src/components` contains the Convex provider and demo feed
- `convex` contains the schema, queries, and mutations for the starter backend
