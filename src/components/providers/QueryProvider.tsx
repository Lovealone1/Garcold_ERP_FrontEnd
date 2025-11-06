"use client";

import { useEffect, useState, PropsWithChildren } from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider, type Persister } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

const VERSION = "transactions-cache-v1";
const MAX_AGE = 1000 * 60 * 60 * 24 * 3; 

export default function QueryProvider({ children }: PropsWithChildren) {
    const [client] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 1000 * 60 * 30,
                        gcTime: MAX_AGE,
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
            key: VERSION,
            throttleTime: 1000,
            storage: {
                getItem: async (k: string) => window.localStorage.getItem(k),
                setItem: async (k: string, v: string) => {
                    window.localStorage.setItem(k, v);
                },
                removeItem: async (k: string) => {
                    window.localStorage.removeItem(k);
                },
            },
        })
        : undefined;

    if (!hydrated) {
        return <>{children}</>;
    }

    return (
        <PersistQueryClientProvider client={client} persistOptions={{ persister: persister!, maxAge: MAX_AGE }}>
            {children}
        </PersistQueryClientProvider>
    );
}
