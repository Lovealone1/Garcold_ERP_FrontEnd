import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PeriodProvider } from "@/components/providers/PeriodProvider";

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

/**
 * The list hooks read the selected period from context, the way they do under
 * the app shell. Without the provider they would throw rather than fall back
 * to a period of their own -- which is the point: a screen with no period is
 * the bug that made every total read as the whole history of the business.
 */
export function makeWrapper(client: QueryClient) {
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <QueryClientProvider client={client}>
                <PeriodProvider>{children}</PeriodProvider>
            </QueryClientProvider>
        );
    };
}
