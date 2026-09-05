import { describe, it, expect } from "vitest";
import type { Query } from "@tanstack/react-query";
import {
    CACHE_SCHEMA_VERSION,
    DEFAULT_TIER,
    TIER_PERSISTED,
    TIER_STALE_TIME,
    isOwnPersistKey,
    persistKeyForUser,
    shouldPersistQuery,
    staleTimeForKey,
    tierForKey,
    tierForRoot,
} from "../cachePolicy";
import { QUERY_ROOTS } from "../queryKeys";

const asQuery = (queryKey: readonly unknown[], status = "success") =>
    ({ queryKey, state: { status } }) as unknown as Query;

describe("tier classification", () => {
    it("treats money and anything derived from it as volatile", () => {
        for (const root of [
            "sales",
            "purchases",
            "expenses",
            "transactions",
            "transactions-head",
            "banks",
            "profits",
            "dashboard",
            "sale-payments",
            "purchase-payments",
        ]) {
            expect(tierForRoot(root), root).toBe("volatile");
        }
    });

    it("classifies stock and contacts on their own clocks", () => {
        expect(tierForRoot("products")).toBe("inventory");
        expect(tierForRoot("all-products")).toBe("inventory");
        expect(tierForRoot("customers")).toBe("contacts");
        expect(tierForRoot("customer")).toBe("contacts");
        expect(tierForRoot("suppliers")).toBe("contacts");
    });

    // A new root that nobody classified must not silently inherit a long
    // staleTime and start serving stale money.
    it("fails safe to volatile for unknown or malformed roots", () => {
        expect(tierForRoot("something-new")).toBe(DEFAULT_TIER);
        expect(tierForRoot(undefined)).toBe(DEFAULT_TIER);
        expect(tierForRoot(42)).toBe(DEFAULT_TIER);
        expect(tierForKey([])).toBe(DEFAULT_TIER);
        expect(tierForKey(undefined)).toBe(DEFAULT_TIER);
        expect(DEFAULT_TIER).toBe("volatile");
    });

    it("classifies a full key by its root", () => {
        expect(tierForKey(["transactions-head", { pageSize: 8 }])).toBe("volatile");
        expect(tierForKey(["customers", "all", { force: 0 }])).toBe("contacts");
    });

    it("assigns a tier to every root in the catalog", () => {
        for (const root of QUERY_ROOTS) {
            expect(["volatile", "inventory", "contacts", "static"]).toContain(
                tierForRoot(root)
            );
        }
    });
});

describe("stale times", () => {
    it("never lets financial data be served without revalidating", () => {
        expect(TIER_STALE_TIME.volatile).toBe(0);
        expect(staleTimeForKey(["sales", { pageSize: 8 }])).toBe(0);
        expect(staleTimeForKey(["banks", "list"])).toBe(0);
        expect(staleTimeForKey(["dashboard", {}])).toBe(0);
    });

    it("grows with decreasing volatility", () => {
        expect(TIER_STALE_TIME.volatile).toBeLessThan(TIER_STALE_TIME.inventory);
        expect(TIER_STALE_TIME.inventory).toBeLessThan(TIER_STALE_TIME.contacts);
        expect(TIER_STALE_TIME.contacts).toBeLessThan(TIER_STALE_TIME.static);
    });

    // The old flat policy was 30 minutes for everything, money included.
    it("is far below the previous flat 30 minutes for volatile data", () => {
        expect(staleTimeForKey(["transactions", {}])).toBeLessThan(1000 * 60 * 30);
    });
});

describe("shouldPersistQuery", () => {
    it("refuses to write any financial data to disk", () => {
        for (const root of [
            "sales",
            "purchases",
            "expenses",
            "transactions",
            "transactions-head",
            "banks",
            "profits",
            "dashboard",
            "sale-payments",
            "purchase-payments",
        ]) {
            expect(shouldPersistQuery(asQuery([root, {}])), root).toBe(false);
        }
    });

    it("refuses to persist stock levels", () => {
        expect(shouldPersistQuery(asQuery(["products", {}]))).toBe(false);
        expect(shouldPersistQuery(asQuery(["all-products", {}]))).toBe(false);
    });

    it("allows directory data", () => {
        expect(shouldPersistQuery(asQuery(["customers", {}]))).toBe(true);
        expect(shouldPersistQuery(asQuery(["suppliers", {}]))).toBe(true);
    });

    // Rehydrating a failure paints an empty screen that only a manual refresh
    // can clear.
    it("never persists a failed or pending query", () => {
        expect(shouldPersistQuery(asQuery(["customers", {}], "error"))).toBe(false);
        expect(shouldPersistQuery(asQuery(["customers", {}], "pending"))).toBe(false);
    });

    it("does not persist an unknown root", () => {
        expect(shouldPersistQuery(asQuery(["brand-new", {}]))).toBe(false);
    });

    it("agrees with the tier table", () => {
        expect(TIER_PERSISTED.volatile).toBe(false);
        expect(TIER_PERSISTED.inventory).toBe(false);
    });
});

describe("persist keys", () => {
    // Two accounts on one machine previously shared the single key
    // "transactions-cache-v11", so signing in as someone else restored the
    // previous person's data.
    it("scopes storage per user", () => {
        expect(persistKeyForUser("user-a")).not.toBe(persistKeyForUser("user-b"));
        expect(persistKeyForUser("user-a")).toContain("user-a");
    });

    it("has a stable anonymous key", () => {
        expect(persistKeyForUser(null)).toBe(persistKeyForUser(undefined));
        expect(persistKeyForUser(null)).toContain("anon");
    });

    it("carries the schema version so a shape change invalidates old entries", () => {
        expect(persistKeyForUser("u")).toContain(CACHE_SCHEMA_VERSION);
    });

    it("recognises its own keys, including the pre-migration one", () => {
        expect(isOwnPersistKey(persistKeyForUser("u"))).toBe(true);
        expect(isOwnPersistKey("transactions-cache-v11")).toBe(true);
        expect(isOwnPersistKey("theme")).toBe(false);
        expect(isOwnPersistKey("sb-auth-token")).toBe(false);
    });
});
