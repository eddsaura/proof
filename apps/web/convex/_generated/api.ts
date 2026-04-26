import { makeFunctionReference } from "convex/server";

type Post = {
  _id: string;
  author: string;
  body: string;
  channel: string;
  createdAt: number;
};

export const api = {
  posts: {
    listLatest: makeFunctionReference<"query", Record<string, never>, Post[]>(
      "posts:listLatest",
    ),
    createPost: makeFunctionReference<
      "mutation",
      { author: string; body: string; channel: string },
      string
    >("posts:createPost"),
    seedDemoPosts: makeFunctionReference<
      "mutation",
      Record<string, never>,
      { inserted: number }
    >("posts:seedDemoPosts"),
  },
};

export const internal = api;
