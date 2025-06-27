// @vitest-environment happy-dom

import { Account, CoMap, coField } from "jazz-tools";
import { describe, expect, it } from "vitest";
import { useAccount } from "../composables.js";
import { createJazzTestAccount } from "../testing.js";
import { withJazzTestSetup } from "./testUtils.js";

class AccountRoot extends CoMap {
  value = coField.string;
}

class AccountSchema extends Account {
  root = coField.ref(AccountRoot);

  migrate() {
    if (!this._refs.root) {
      this.root = AccountRoot.create({ value: "123" }, { owner: this });
    }
  }
}

declare module "../provider" {
  interface Register {
    Account: AccountSchema;
  }
}

describe("useAccount", () => {
  it("should return the correct value", async () => {
    const account = await createJazzTestAccount();

    const [result] = withJazzTestSetup(() => useAccount(), {
      account,
    });

    expect(result.me.value).toEqual(account);
  });

  it("should load nested values if requested", async () => {
    const account = await createJazzTestAccount({ AccountSchema });

    const [result] = withJazzTestSetup(
      () =>
        useAccount({
          resolve: {
            root: true,
          },
        }),
      {
        account,
      },
    );

    expect(result.me.value?.root?.value).toBe("123");
  });

  // New React-style API tests
  it("should work with React-style API (AccountSchema as first parameter)", async () => {
    const account = await createJazzTestAccount({ AccountSchema });

    const [result] = withJazzTestSetup(
      () => useAccount(AccountSchema),
      {
        account,
      },
    );

    expect(result.me.value).toEqual(account);
    expect(result.me.value?.root).toBeDefined();
  });

  it("should work with React-style API and resolve options", async () => {
    const account = await createJazzTestAccount({ AccountSchema });

    const [result] = withJazzTestSetup(
      () =>
        useAccount(AccountSchema, {
          resolve: {
            root: true,
          },
        }),
      {
        account,
      },
    );

    expect(result.me.value?.root?.value).toBe("123");
  });

  it("should have correct types with React-style API", async () => {
    const account = await createJazzTestAccount({ AccountSchema });

    const [result] = withJazzTestSetup(
      () => useAccount(AccountSchema),
      {
        account,
      },
    );

    // TypeScript should infer the correct type
    if (result.me.value) {
      // This should not cause type errors
      const rootValue = result.me.value.root?.value;
      expect(typeof rootValue).toBe("string");
    }
  });
});
