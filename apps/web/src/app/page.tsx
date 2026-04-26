import type { ReactNode } from "react";
import { Activity, ArrowRight, Database, Sparkles } from "lucide-react";
import { SocialProofFeed } from "@/components/social-proof-feed";

const setupSteps = [
  "Run `bun run dev:backend` once and sign in to create or connect a Convex project.",
  "Let Convex write `NEXT_PUBLIC_CONVEX_URL` into `.env.local` for you.",
  "Restart `bun run dev` and seed the demo feed from the UI.",
];

export default function Home() {
  const isConvexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-[var(--paper)] shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:py-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-sm font-medium text-slate-700">
                <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                Bun + Next.js + Convex starter
              </div>
              <div className="space-y-4">
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Ship a real-time social proof app without wrestling the stack.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  This project is ready for Bun-first local development, a
                  Next.js App Router frontend, and a Convex backend with a demo
                  posts feed.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <FeatureCard
                  icon={<Database className="h-5 w-5" />}
                  title="Convex backend"
                  body="Schema and starter queries are already in place."
                />
                <FeatureCard
                  icon={<Activity className="h-5 w-5" />}
                  title="Live-friendly UI"
                  body="A client feed is ready to hydrate once Convex is connected."
                />
                <FeatureCard
                  icon={<ArrowRight className="h-5 w-5" />}
                  title="One Bun command"
                  body="`bun run dev` starts the web app and Convex watcher together."
                />
              </div>
            </div>

            <aside className="rounded-[1.75rem] border border-slate-200/80 bg-white/85 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Status
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    {isConvexConfigured
                      ? "Convex is connected"
                      : "Finish the first Convex login"}
                  </h2>
                </div>

                {isConvexConfigured ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
                    `NEXT_PUBLIC_CONVEX_URL` is available, so the feed below can
                    query live data as soon as your Convex dev deployment is up.
                  </div>
                ) : (
                  <ol className="space-y-3">
                    {setupSteps.map((step, index) => (
                      <li
                        key={step}
                        className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                          {index + 1}
                        </span>
                        <span className="text-sm leading-6 text-slate-700">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}

                <div className="rounded-2xl bg-slate-950 px-5 py-4 text-sm text-slate-100">
                  <p className="font-medium text-white">Bun workflow</p>
                  <pre className="mt-2 overflow-x-auto text-sm leading-6 text-slate-300">
                    <code>{`bun install\nbun run dev:backend\nbun run dev`}</code>
                  </pre>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <SocialProofFeed enabled={isConvexConfigured} />
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/80 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}
