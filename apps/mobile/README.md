# SOTI House Mobile

Private community app for SOTI House, built with Expo, Convex, and Convex Auth.

## Local setup

```bash
bun install
bun run dev:backend
```

The app already points at the development deployment:

- `EXPO_PUBLIC_CONVEX_URL=https://reliable-robin-175.eu-west-1.convex.cloud`

Convex Auth also needs OAuth credentials configured in the Convex
deployment environment:

- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

Once backend code has been pushed, run the app with:

```bash
bun run dev
```

## What is included

- GitHub + Google sign-in with Convex Auth
- invite-only access with admin-managed allowlist
- onboarding flow with profile + city geocoding
- chronological threaded feed
- nested comments and `@mentions`
- in-app mention inbox
- city-level member map
