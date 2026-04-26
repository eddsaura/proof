"use client";

import { useState, useTransition } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

export function SocialProofFeed({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return (
      <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-6 text-slate-700 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <h2 className="text-2xl font-semibold text-slate-950">Live feed preview</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          The frontend is ready. Once Convex writes your deployment URL to
          `.env.local`, this section will switch from placeholder mode to live
          queries automatically.
        </p>
      </section>
    );
  }

  return <LiveSocialProofFeed />;
}

function LiveSocialProofFeed() {
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const posts = useQuery(api.posts.listLatest, {});
  const seedDemoPosts = useMutation(api.posts.seedDemoPosts);

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Demo feed
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Recent social proof moments
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Seed the backend once, then replace these demo records with your own
            app&apos;s events.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            startTransition(async () => {
              const result = await seedDemoPosts({});
              setSeedStatus(
                result.inserted > 0
                  ? `Seeded ${result.inserted} demo posts.`
                  : "Demo posts already exist.",
              );
            });
          }}
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Seeding..." : "Seed demo feed"}
        </button>
      </div>

      {seedStatus ? (
        <p className="mt-4 rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-sm text-slate-800">
          {seedStatus}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {posts?.length ? (
          posts.map((post) => (
            <article
              key={post._id}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-slate-950">
                    {post.author}
                  </p>
                  <p className="text-sm text-slate-500">{post.channel}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                  {formatRelative(post.createdAt)}
                </span>
              </div>
              <p className="mt-4 text-base leading-7 text-slate-700">{post.body}</p>
            </article>
          ))
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
            No posts yet. Use the seed button above to create a demo dataset.
          </div>
        )}
      </div>
    </section>
  );
}

function formatRelative(timestamp: number) {
  const minutesAgo = Math.max(1, Math.round((Date.now() - timestamp) / 60000));

  if (minutesAgo < 60) {
    return `${minutesAgo}m ago`;
  }

  const hoursAgo = Math.round(minutesAgo / 60);
  return `${hoursAgo}h ago`;
}
