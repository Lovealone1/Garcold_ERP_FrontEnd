import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Next reads these at module scope in several files; give the suite stable values.
process.env.NEXT_PUBLIC_API_URL = "http://api.test";
process.env.NEXT_PUBLIC_WS_URL = "ws://api.test/api/v1/ws/realtime";

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
});
