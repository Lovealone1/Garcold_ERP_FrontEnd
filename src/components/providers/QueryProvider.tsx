"use client";

import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider, type Query } from "@tanstack/react-query";
import {
    PersistQueryClientProvider,
    type Persister,
} from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { useSupabaseSession } from "@/app/auth/useSupabaseAuth";
import {
    CACHE_SCHEMA_VERSION,
    isOwnPersistKey,
    persistKeyForUser,
    shouldPersistQuery,
    staleTimeForKey,
} from "@/lib/query/cachePolicy";

/**
 * How long a persisted entry may be restored at all, regardless of tier.
 * Only contacts and lookup tables reach storage, so a day is generous.
 */
const MAX_AGE = 1000 * 60 * 60 * 24;

export function createAppQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Per-tier: financial data is 0, lookup tables are minutes.
                // The old flat 30 minutes applied to money too.
                staleTime: (query: Query) => staleTimeForKey(query.queryKey),
                gcTime: MAX_AGE,
                // Both were off, so a tab left open overnight or a laptop
                // resumed on another network kept showing whatever it had.
                refetchOnWindowFocus: true,
                refetchOnReconnect: true,
                refetchOnMount: true,
            },
        },
    });
}

/** Clear every cache entry this app has ever written, across users. */
function purgePersistedCaches() {
    if (typeof window === "undefined") return;
    try {
        const doomed: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            if (key && isOwnPersistKey(key)) doomed.push(key);
        }
        for (const key of doomed) window.localStorage.removeItem(key);
    } catch {
        // Storage disabled or unavailable; in-memory state is still correct.
    }
}

export default function QueryProvider({ children }: PropsWithChildren) {
    const [client] = useState(createAppQueryClient);
    const { user, loading } = useSupabaseSession();
    const userId = user?.id ?? null;
    const previousUserId = useRef<string | null | undefined>(undefined);

    // Signing out or switching accounts must not leave the next person looking
    // at the previous one's figures. Nothing used to clear this.
    useEffect(() => {
        if (loading) return;
        const previous = previousUserId.current;
        previousUserId.current = userId;

        if (previous === undefined || previous === userId) return;

        client.clear();
        purgePersistedCaches();
    }, [userId, loading, client]);

    // Built during render, not in an effect.
    //
    // Creating it in an effect meant the first render used QueryClientProvider
    // and a later one switched to PersistQueryClientProvider. Changing the
    // component type unmounts and remounts the whole subtree, which threw away
    // every child's state the moment the session resolved -- and left the
    // persistence subscription with no cache event to react to, so nothing was
    // ever written.
    const persister = useMemo<Persister | null>(() => {
        if (typeof window === "undefined") return null;

        return createAsyncStoragePersister({
            key: persistKeyForUser(userId),
            throttleTime: 1000,
            storage: {
                getItem: async (k: string) => {
                    try {
                        return window.localStorage.getItem(k);
                    } catch {
                        return null;
                    }
                },
                setItem: async (k: string, v: string) => {
                    try {
                        window.localStorage.setItem(k, v);
                    } catch {
                        // Almost always a quota error. Drop our own entries and
                        // carry on from memory rather than letting a storage
                        // failure surface as a broken screen.
                        purgePersistedCaches();
                    }
                },
                removeItem: async (k: string) => {
                    try {
                        window.localStorage.removeItem(k);
                    } catch {
                        /* nothing useful to do */
                    }
                },
            },
        });
    }, [userId]);

    // PersistQueryClientProvider re-subscribes whenever this object's identity
    // changes. Building it inline meant tearing down and re-arming the
    // subscription on every render, and the throttled save never got to fire --
    // so nothing was ever actually written.
    const persistOptions = useMemo(
        () =>
            persister
                ? {
                      persister,
                      maxAge: MAX_AGE,
                      // Changing this discards every previously stored cache,
                      // which is how a policy change takes effect on devices
                      // still holding entries written under the old rules.
                      buster: CACHE_SCHEMA_VERSION,
                      dehydrateOptions: {
                          // Movements, balances and the dashboard never reach disk.
                          shouldDehydrateQuery: shouldPersistQuery,
                      },
                  }
                : null,
        [persister]
    );

    if (!persistOptions) {
        return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    }

    return (
        <PersistQueryClientProvider client={client} persistOptions={persistOptions}>
            {children}
        </PersistQueryClientProvider>
    );
}
