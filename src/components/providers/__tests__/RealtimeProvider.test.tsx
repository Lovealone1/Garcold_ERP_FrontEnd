import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import type { RealtimeClientOptions } from "@/lib/realtime/realtimeClient";

// Capture the options the provider hands to the client instead of opening a
// real socket, so we can drive events directly.
let captured: RealtimeClientOptions | null = null;
const start = vi.fn();
const stop = vi.fn();

vi.mock("@/lib/realtime/realtimeClient", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/lib/realtime/realtimeClient")>();
    return {
        ...actual,
        createRealtimeClient: (opts: RealtimeClientOptions) => {
            captured = opts;
            return { start, stop, getStatus: () => "open" as const };
        },
    };
});

const getSession = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
    supabase: () => ({ auth: { getSession } }),
}));

const invalidateMovement = vi.fn().mockResolvedValue(undefined);
const invalidateAllVolatile = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/query/invalidateMovement", async (importOriginal) => {
    const actual = await importOriginal<
        typeof import("@/lib/query/invalidateMovement")
    >();
    return {
        ...actual,
        invalidateMovement: (...a: unknown[]) => invalidateMovement(...a),
        invalidateAllVolatile: (...a: unknown[]) => invalidateAllVolatile(...a),
    };
});

import { RealtimeProvider } from "../RealtimeProvider";
import { makeTestQueryClient, makeWrapper } from "@/test/queryWrapper";

function mount() {
    const client = makeTestQueryClient();
    const Wrapper = makeWrapper(client);
    render(
        <Wrapper>
            <RealtimeProvider>
                <div>child</div>
            </RealtimeProvider>
        </Wrapper>
    );
    return client;
}

/** The MovementKind passed to invalidateMovement on the Nth call. */
function kindOf(call: number): string {
    return (invalidateMovement.mock.calls[call][1] as { kind: string }).kind;
}
function eventOf(call: number) {
    return invalidateMovement.mock.calls[call][1] as {
        kind: string;
        ids?: Record<string, number | null>;
        affects?: string[];
    };
}

describe("RealtimeProvider", () => {
    beforeEach(() => {
        captured = null;
        vi.clearAllMocks();
        getSession.mockResolvedValue({ data: { session: { access_token: "tok" } } });
    });

    it("starts the client on mount and stops it on unmount", () => {
        const client = makeTestQueryClient();
        const Wrapper = makeWrapper(client);
        const { unmount } = render(
            <Wrapper>
                <RealtimeProvider>
                    <div>child</div>
                </RealtimeProvider>
            </Wrapper>
        );

        expect(start).toHaveBeenCalledTimes(1);
        unmount();
        expect(stop).toHaveBeenCalledTimes(1);
    });

    it("renders its children", () => {
        const client = makeTestQueryClient();
        const Wrapper = makeWrapper(client);
        const { getByText } = render(
            <Wrapper>
                <RealtimeProvider>
                    <div>child</div>
                </RealtimeProvider>
            </Wrapper>
        );
        expect(getByText("child")).toBeInTheDocument();
    });

    it("supplies the current access token", async () => {
        mount();
        await waitFor(() => expect(captured).not.toBeNull());
        await expect(captured!.getToken()).resolves.toBe("tok");
    });

    it("supplies null when there is no session", async () => {
        getSession.mockResolvedValue({ data: { session: null } });
        mount();
        await waitFor(() => expect(captured).not.toBeNull());
        await expect(captured!.getToken()).resolves.toBeNull();
    });

    // The API publishes twelve resources; the old provider handled eight and
    // silently dropped expense, bank, investment and loan.
    const RESOURCES: [string, string][] = [
        ["sale", "sale"],
        ["sale_payment", "sale_payment"],
        ["purchase", "purchase"],
        ["purchase_payment", "purchase_payment"],
        ["expense", "expense"],
        ["transaction", "transaction"],
        ["customer", "customer"],
        ["customer_payment", "customer_payment"],
        ["supplier", "supplier"],
        ["product", "product"],
        ["bank", "bank"],
        ["investment", "investment"],
        ["loan", "loan"],
    ];

    it.each(RESOURCES)("maps resource %s onto movement %s", async (resource, kind) => {
        mount();
        await waitFor(() => expect(captured).not.toBeNull());

        captured!.onEvent({ resource, action: "created", payload: { id: 1 } });

        await waitFor(() => expect(invalidateMovement).toHaveBeenCalledTimes(1));
        expect(kindOf(0)).toBe(kind);
    });

    it("accepts the combined type form", async () => {
        mount();
        await waitFor(() => expect(captured).not.toBeNull());

        captured!.onEvent({ type: "expense.deleted", payload: { id: 3 } });

        await waitFor(() => expect(invalidateMovement).toHaveBeenCalledTimes(1));
        expect(kindOf(0)).toBe("expense");
    });

    it("forwards sale_id, purchase_id and customer_id to the matrix", async () => {
        mount();
        await waitFor(() => expect(captured).not.toBeNull());

        captured!.onEvent({
            resource: "sale_payment",
            action: "created",
            payload: { sale_id: 12 },
        });
        await waitFor(() => expect(invalidateMovement).toHaveBeenCalledTimes(1));
        expect(eventOf(0).ids?.saleId).toBe(12);

        captured!.onEvent({
            resource: "purchase_payment",
            action: "created",
            payload: { purchase_id: 34 },
        });
        await waitFor(() => expect(invalidateMovement).toHaveBeenCalledTimes(2));
        expect(eventOf(1).ids?.purchaseId).toBe(34);

        captured!.onEvent({
            resource: "customer_payment",
            action: "created",
            payload: { customer_id: 56 },
        });
        await waitFor(() => expect(invalidateMovement).toHaveBeenCalledTimes(3));
        expect(eventOf(2).ids?.customerId).toBe(56);
    });

    it("treats a resource's own id as its detail id", async () => {
        mount();
        await waitFor(() => expect(captured).not.toBeNull());

        captured!.onEvent({ resource: "sale", action: "deleted", payload: { id: 99 } });
        await waitFor(() => expect(invalidateMovement).toHaveBeenCalledTimes(1));
        expect(eventOf(0).ids?.saleId).toBe(99);

        captured!.onEvent({ resource: "customer", action: "updated", payload: { id: 5 } });
        await waitFor(() => expect(invalidateMovement).toHaveBeenCalledTimes(2));
        expect(eventOf(1).ids?.customerId).toBe(5);
    });

    it("passes the server's affects list through", async () => {
        mount();
        await waitFor(() => expect(captured).not.toBeNull());

        captured!.onEvent({
            resource: "supplier",
            action: "updated",
            payload: { id: 1 },
            affects: ["banks", "dashboard"],
        });

        await waitFor(() => expect(invalidateMovement).toHaveBeenCalledTimes(1));
        expect(eventOf(0).affects).toEqual(["banks", "dashboard"]);
    });

    it("ignores unknown resources and unparseable events", async () => {
        mount();
        await waitFor(() => expect(captured).not.toBeNull());

        captured!.onEvent({ resource: "unicorn", action: "created" });
        captured!.onEvent({});
        captured!.onEvent({ type: "malformed" });

        await new Promise((r) => setTimeout(r, 10));
        expect(invalidateMovement).not.toHaveBeenCalled();
    });

    it("survives a payload with no ids", async () => {
        mount();
        await waitFor(() => expect(captured).not.toBeNull());

        captured!.onEvent({ resource: "bank", action: "updated", payload: null });

        await waitFor(() => expect(invalidateMovement).toHaveBeenCalledTimes(1));
        expect(eventOf(0).ids).toEqual({
            saleId: null,
            purchaseId: null,
            customerId: null,
        });
    });

    // Events published while the socket was down are never replayed.
    it("refetches everything volatile on resync", async () => {
        mount();
        await waitFor(() => expect(captured).not.toBeNull());

        captured!.onResync!();

        await waitFor(() => expect(invalidateAllVolatile).toHaveBeenCalledTimes(1));
    });
});
