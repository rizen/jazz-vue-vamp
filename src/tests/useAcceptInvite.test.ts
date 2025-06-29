// @vitest-environment happy-dom

import { co, z, Group, type ID } from "jazz-tools";
import { describe, expect, it } from "vitest";
import { createInviteLink } from "jazz-tools/browser";
import { useAcceptInvite } from "../index.js";
import { createJazzTestAccount, linkAccounts } from "../testing.js";
import { waitFor, withJazzTestSetup } from "./testUtils.js";

describe("useAcceptInvite", () => {
  it("should accept the invite", async () => {
    const TestMap = co.map({
      value: z.string(),
    });

    const account = await createJazzTestAccount();
    const inviteSender = await createJazzTestAccount();

    await linkAccounts(account, inviteSender);

    let acceptedId: ID<typeof TestMap> | undefined;

    const invitelink = createInviteLink(
      TestMap.create(
        { value: "hello" },
        { owner: Group.create({ owner: inviteSender }) },
      ),
      "reader",
    );

    location.href = invitelink;

    withJazzTestSetup(
      () =>
        useAcceptInvite({
          invitedObjectSchema: TestMap,
          onAccept: (id) => {
            acceptedId = id;
          },
        }),
      {
        account,
      },
    );

    await waitFor(() => {
      expect(acceptedId).toBeDefined();
    });

    const accepted = await TestMap.load(acceptedId!, {
      loadAs: account,
    });

    expect(accepted?.value).toEqual("hello");
  });
});
