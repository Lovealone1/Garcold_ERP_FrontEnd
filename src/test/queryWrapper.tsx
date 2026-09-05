import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * A QueryClient tuned for tests: no retries (so a rejected queryFn surfaces
 * immediately instead of after backoff) and silent logging.
 */
export function makeTestQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: Infinity },
            mutations: { retry: false },
        },
    });
}

export function makeWrapper(client: QueryClient) {
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    };
}
