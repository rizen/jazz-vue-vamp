// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { useIsAuthenticated } from "../composables.js";
import { createJazzTestAccount, createJazzTestGuest } from "../testing.js";
import { withJazzTestSetup } from "./testUtils.js";

describe("useIsAuthenticated", () => {
    it("should return true when user is authenticated", async () => {
        const account = await createJazzTestAccount();

        const [result] = withJazzTestSetup(
            () => useIsAuthenticated(),
            {
                account,
                isAuthenticated: true,
            },
        );

        expect(result.value).toBe(true);
    });

    it("should return false when user is not authenticated", async () => {
        const account = await createJazzTestAccount();

        const [result] = withJazzTestSetup(
            () => useIsAuthenticated(),
            {
                account,
                isAuthenticated: false,
            },
        );

        expect(result.value).toBe(false);
    });

    it("should return false when in guest mode", async () => {
        const guest = await createJazzTestGuest();

        const [result] = withJazzTestSetup(
            () => useIsAuthenticated(),
            {
                account: guest,
                isAuthenticated: false,
            },
        );

        expect(result.value).toBe(false);
    });
}); 