import { convexQuery } from "@convex-dev/react-query";
import { useQuery as useTanStackQuery } from "@tanstack/react-query";
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from "convex/server";
import type { OptionalRestArgsOrSkip } from "convex/react";

export {
  useAction,
  useMutation,
} from "convex/react";

type QueryArgs<Query extends FunctionReference<"query">> =
  | FunctionArgs<Query>
  | "skip";

const makeConvexQuery = convexQuery as unknown as <
  Query extends FunctionReference<"query">,
>(
  query: Query,
  args: QueryArgs<Query>,
) => ReturnType<typeof convexQuery>;

export function useQuery<Query extends FunctionReference<"query">>(
  query: Query,
  ...args: OptionalRestArgsOrSkip<Query>
): Query["_returnType"] | undefined {
  const queryArgs = (args[0] ?? {}) as QueryArgs<Query>;
  const result = useTanStackQuery({
    ...makeConvexQuery(query, queryArgs),
    throwOnError: true,
  });

  return result.data as FunctionReturnType<Query> | undefined;
}
