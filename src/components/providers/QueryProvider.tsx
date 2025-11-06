"use client";

import { useEffect, useState, PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider, type Persister } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

const VERSION = "transactions-cache-v1";

export default function QueryProvider({ children }: PropsWithChildren) {
    const [client] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 1000 * 60 * 30,       
                        gcTime: 1000 * 60 * 60 * 24 * 3, 
                        refetchOnWindowFocus: false,
                        refetchOnReconnect: false,
                        refetchOnMount: false,
                    },
                },
            })
    );

    const [hydrated, setHydrated] = useState(false);
    useEffect(() => setHydrated(true), []);

    const persister: Persister | undefined = hydrated
        ? createAsyncStoragePersister({
            storage: window.localStorage,
            key: VERSION,
            throttleTime: 1000,
        })
        : undefined;

    if (!hydrated) {
        return (
            <QueryClientProvider client={client}>
                {children}
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        );
    }

    return (
        <PersistQueryClientProvider
            client={client}
            persistOptions={{ persister: persister!, maxAge: 1000 * 60 * 60 * 24 * 3 }}
        >
            <QueryClientProvider client={client}>
                {children}
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </PersistQueryClientProvider>
    );
}
