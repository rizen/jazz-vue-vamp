# jazz-vue-vamp

## 0.15.0

### Breaking Changes
- **Component Rename**: `JazzProvider` renamed to `JazzVueProvider` for consistency with jazz-tools 0.15.4 naming
  - Import: `import { JazzVueProvider } from "jazz-vue-vamp"` 
  - Usage: `<JazzVueProvider>` instead of `<JazzProvider>`
  - No backward compatibility - `JazzProvider` is no longer available
- **useAccount() API Changes**: Updated to match React 0.15.4 behavior
  - `me` is now always nullable (no auto-fallback to contextMe)
  - Removed `useAccountOrGuest()` function - use `useAccount()` instead
- **New Return Value**: `useAccount()` now returns `{ me, agent, logOut }` instead of `{ me, logOut }`
- **Package Dependencies**: Upgraded to jazz-tools 0.15.4
  - `jazz-browser` dependency removed (now `jazz-tools/browser`)
  - Updated imports: `import { ... } from "jazz-tools/browser"`
- Converting the discontinued jazz-vue package to a standalone package known as jazz-vue-vamp.

### Features
- **Full React 0.15.4 Parity**: Complete feature compatibility with React jazz-tools
- **agent Property**: Added `agent` property to `useAccount()` return value
  - Always available (authenticated account or anonymous guest)
  - Can be used to load data in all rendering modes (guest, authenticated, unauthenticated)
  - Replaces the need for separate `useAccountOrGuest()` function
- **Unified API**: Single `useAccount()` function now handles all use cases
  - Works seamlessly with guest accounts
  - Consistent behavior across authentication states
  - Better null safety with always-nullable `me`
- **useAccount() React API Compatibility**: Added support for React-style API where AccountSchema can be passed as the first parameter
  ```ts
  // New React-style API
  const { me } = useAccount(MyAppAccount);
  const { me } = useAccount(MyAppAccount, { resolve: { root: true } });
  
  // Legacy API still supported
  const { me } = useAccount();
  const { me } = useAccount({ resolve: { root: true } });
  ```
- **useIsAuthenticated() Composable**: Added Vue equivalent of React's useIsAuthenticated hook
  ```ts
  const isAuthenticated = useIsAuthenticated();
  // Reactive boolean that tracks authentication state changes
  ```
- **experimental_useInboxSender() Composable**: Added Vue equivalent of React's experimental inbox sender
  ```ts
  const sendMessage = experimental_useInboxSender(inboxOwnerID);
  await sendMessage(myMessage);
  ```
- **Enhanced useAcceptInvite()**: Now includes hashchange event handling for dynamic invite acceptance
  - Automatically listens for URL changes and re-processes invites
  - Proper cleanup of event listeners on component unmount
- **Enhanced JazzVueProvider**: Added new props for better SSR and logout handling
  - `enableSSR` - Enable server-side rendering support with anonymous fallback
  - `logOutReplacement` - Custom logout handler for advanced use cases
  - Improved context recreation logic for better performance
  - Stable callback references to prevent unnecessary re-renders
- **Jazz-tools 0.15.4 Support**: Full compatibility with latest jazz-tools release
  - Consolidated browser imports (`jazz-tools/browser`)
  - Latest CoValue and subscription patterns
  - Improved type safety and performance

### Migration Guide
```ts
// Before (pre-0.15.0)
const { me } = useAccountOrGuest();
if (me.value._type === "Anonymous") {
  // Handle guest
} else {
  // Handle authenticated user
}

// After (0.15.0)
const { me, agent } = useAccount();
if (agent.value._type === "Anonymous") {
  // Handle guest - me will be null
  // Use agent to load data
} else {
  // Handle authenticated user - me may be null until loaded
  // Use agent to load data
}

// Component rename
// Before (pre-0.15.0)
import { JazzProvider } from "jazz-vue-vamp";
<JazzProvider>...</JazzProvider>

// After (0.15.0)
import { JazzVueProvider } from "jazz-vue-vamp";
<JazzVueProvider>...</JazzVueProvider>

// Import updates (if using jazz-browser directly)
// Before
import { ... } from "jazz-browser";

// After
import { ... } from "jazz-tools/browser";
```

### Important: Schema Migration Pattern
If you encounter "No active account" errors during account creation, ensure your schema migrations pass explicit groups to all CoValue creation:

```ts
// ❌ Wrong - will cause "No active account" error
export const MyAccount = co.account({
  root: MyRoot,
}).withMigration(async (account) => {
  if (!account.root) {
    account.root = MyRoot.create({ items: [] }); // Missing group!
  }
});

// ✅ Correct - explicit group parameters
export const MyAccount = co.account({
  root: MyRoot,
}).withMigration(async (account) => {
  if (!account.root) {
    const group = Group.create(account);
    account.root = MyRoot.create({ items: [] }, group);
  }
});
```

### Fixes
- **useAccount**: Fixed `agent._type` incorrectly returning `"Account"` for unauthenticated users
  - Now correctly returns `agent._type: "Anonymous"` when user is not authenticated
  - Fixes issue where `agent._type` was always `"Account"` regardless of authentication state
- **JazzVueProvider**: Fixed prop validation warning for `AccountSchema` when using `co.account()` schemas
  - Changed prop type from `Function` to `[Function, Object]` to accept both class-based and schema-based accounts
  - Eliminates Vue warning: "Invalid prop: type check failed for prop 'AccountSchema'. Expected Function, got Object"
- **Schema Migration**: Fixed "No active account" error during account creation migrations
  - Added troubleshooting documentation for schema migration patterns
  - Improved error messages to help identify migration issues
- **Schema Validation**: Fixed `schema.ref is not a function` error with jazz-tools 0.15.4
  - Temporarily disabled `co.account()` schema conversion due to compatibility issues
  - `co.account()` schemas now fall back to default Account class until upstream fix is available
  - Class-based account schemas continue to work normally

### Performance
- **Provider Optimization**: Reduced unnecessary context recreations
- **Subscription Management**: Improved cleanup and memory management
- **Callback Stability**: Stable references prevent excessive re-renders

## 0.14.28

### Patch Changes

- Updated dependencies [06c5a1c]
  - jazz-tools@0.14.28
  - jazz-browser@0.14.28
  - cojson@0.14.28

## 0.14.27

### Patch Changes

- Updated dependencies [a026073]
  - jazz-tools@0.14.27
  - jazz-browser@0.14.27
  - cojson@0.14.27

## 0.14.26

### Patch Changes

- Updated dependencies [e74a077]
  - cojson@0.14.26
  - jazz-browser@0.14.26
  - jazz-tools@0.14.26

## 0.14.25

### Patch Changes

- Updated dependencies [99a2d9b]
- Updated dependencies [b3ff726]
  - jazz-tools@0.14.25
  - jazz-browser@0.14.25
  - cojson@0.14.25

## 0.14.24

### Patch Changes

- cojson@0.14.24
- jazz-browser@0.14.24
- jazz-tools@0.14.24

## 0.14.23

### Patch Changes

- Updated dependencies [1ca9299]
- Updated dependencies [9177579]
  - cojson@0.14.23
  - jazz-tools@0.14.23
  - jazz-browser@0.14.23

## 0.14.22

### Patch Changes

- Updated dependencies [57fb69f]
- Updated dependencies [048ac1d]
  - cojson@0.14.22
  - jazz-tools@0.14.22
  - jazz-browser@0.14.22

## 0.14.21

### Patch Changes

- Updated dependencies [e7e505e]
- Updated dependencies [c3d8779]
- Updated dependencies [13b57aa]
- Updated dependencies [5662faa]
- Updated dependencies [2116a59]
  - jazz-tools@0.14.21
  - cojson@0.14.21
  - jazz-browser@0.14.21

## 0.14.20

### Patch Changes

- Updated dependencies [6f72419]
- Updated dependencies [04b20c2]
  - jazz-tools@0.14.20
  - jazz-browser@0.14.20
  - cojson@0.14.20

## 0.14.19

### Patch Changes

- cojson@0.14.19
- jazz-browser@0.14.19
- jazz-tools@0.14.19

## 0.14.18

### Patch Changes

- Updated dependencies [4b950bc]
- Updated dependencies [0d5ee3e]
- Updated dependencies [d6d9c0a]
- Updated dependencies [c559054]
  - jazz-tools@0.14.18
  - cojson@0.14.18
  - jazz-browser@0.14.18

## 0.14.17

### Patch Changes

- Updated dependencies [e512df4]
  - jazz-tools@0.14.17
  - jazz-browser@0.14.17

## 0.14.16

### Patch Changes

- Updated dependencies [5e253cc]
  - cojson@0.14.16
  - jazz-browser@0.14.16
  - jazz-tools@0.14.16

## 0.14.15

### Patch Changes

- Updated dependencies [23daa7c]
  - cojson@0.14.15
  - jazz-browser@0.14.15
  - jazz-tools@0.14.15

## 0.14.14

### Patch Changes

- Updated dependencies [e32a1f7]
  - jazz-tools@0.14.14
  - jazz-browser@0.14.14

## 0.14.10

### Patch Changes

- Updated dependencies [dc746a2]
- Updated dependencies [f869d9a]
- Updated dependencies [3fe6832]
  - jazz-tools@0.14.10
  - jazz-browser@0.14.10

## 0.14.9

### Patch Changes

- Updated dependencies [22c2600]
  - jazz-tools@0.14.9
  - jazz-browser@0.14.9

## 0.14.8

### Patch Changes

- Updated dependencies [637ae13]
  - jazz-tools@0.14.8
  - jazz-browser@0.14.8

## 0.14.7

### Patch Changes

- Updated dependencies [365b0ea]
  - jazz-tools@0.14.7
  - jazz-browser@0.14.7

## 0.14.6

### Patch Changes

- Updated dependencies [9d6d9fe]
- Updated dependencies [9d6d9fe]
  - jazz-tools@0.14.6
  - jazz-browser@0.14.6

## 0.14.5

### Patch Changes

- Updated dependencies [91cbb2f]
- Updated dependencies [20b3d88]
  - jazz-tools@0.14.5
  - jazz-browser@0.14.5

## 0.14.4

### Patch Changes

- Updated dependencies [011af55]
  - jazz-tools@0.14.4
  - jazz-browser@0.14.4

## 0.14.2

### Patch Changes

- Updated dependencies [3d1027f]
- Updated dependencies [c240eed]
  - jazz-tools@0.14.2
  - jazz-browser@0.14.2

## 0.14.1

### Patch Changes

- Updated dependencies [c8b33ad]
- Updated dependencies [cdfc105]
  - cojson@0.14.1
  - jazz-tools@0.14.1
  - jazz-browser@0.14.1

## 0.14.0

### Patch Changes

- Updated dependencies [5835ed1]
- Updated dependencies [5835ed1]
  - cojson@0.14.0
  - jazz-tools@0.14.0
  - jazz-browser@0.14.0

## 0.13.32

### Patch Changes

- jazz-browser@0.13.32

## 0.13.31

### Patch Changes

- Updated dependencies [e5b170f]
- Updated dependencies [d63716a]
- Updated dependencies [d5edad7]
  - jazz-tools@0.13.31
  - cojson@0.13.31
  - jazz-browser@0.13.31

## 0.13.30

### Patch Changes

- Updated dependencies [07dd2c5]
  - cojson@0.13.30
  - jazz-browser@0.13.30
  - jazz-tools@0.13.30

## 0.13.29

### Patch Changes

- Updated dependencies [eef1a5d]
- Updated dependencies [191ae38]
- Updated dependencies [daee7b9]
  - cojson@0.13.29
  - jazz-browser@0.13.29
  - jazz-tools@0.13.29

## 0.13.28

### Patch Changes

- Updated dependencies [e7ccb2c]
  - cojson@0.13.28
  - jazz-browser@0.13.28
  - jazz-tools@0.13.28

## 0.13.27

### Patch Changes

- Updated dependencies [6357052]
  - cojson@0.13.27
  - jazz-browser@0.13.27
  - jazz-tools@0.13.27

## 0.13.26

### Patch Changes

- Updated dependencies [ff846d9]
  - jazz-tools@0.13.26
  - jazz-browser@0.13.26

## 0.13.25

### Patch Changes

- Updated dependencies [a846e07]
  - cojson@0.13.25
  - jazz-browser@0.13.25
  - jazz-tools@0.13.25

## 0.13.23

### Patch Changes

- Updated dependencies [6b781cf]
- Updated dependencies [02a240c]
  - cojson@0.13.23
  - jazz-tools@0.13.23
  - jazz-browser@0.13.23

## 0.13.21

### Patch Changes

- Updated dependencies [e14e61f]
  - cojson@0.13.21
  - jazz-browser@0.13.21
  - jazz-tools@0.13.21

## 0.13.20

### Patch Changes

- Updated dependencies [adfc9a6]
- Updated dependencies [1389207]
- Updated dependencies [d6e143e]
- Updated dependencies [439f0fe]
- Updated dependencies [3e6229d]
  - cojson@0.13.20
  - jazz-tools@0.13.20
  - jazz-browser@0.13.20

## 0.13.19

### Patch Changes

- Updated dependencies [80530a4]
  - jazz-tools@0.13.19
  - jazz-browser@0.13.19

## 0.13.18

### Patch Changes

- Updated dependencies [9089252]
- Updated dependencies [b470f63]
- Updated dependencies [761759c]
- Updated dependencies [66373ba]
- Updated dependencies [f24cad1]
  - cojson@0.13.18
  - jazz-tools@0.13.18
  - jazz-browser@0.13.18

## 0.13.17

### Patch Changes

- Updated dependencies [9fb98e2]
- Updated dependencies [0b89fad]
  - cojson@0.13.17
  - jazz-browser@0.13.17
  - jazz-tools@0.13.17

## 0.13.16

### Patch Changes

- Updated dependencies [c6fb8dc]
  - cojson@0.13.16
  - jazz-browser@0.13.16
  - jazz-tools@0.13.16

## 0.13.15

### Patch Changes

- Updated dependencies [c712ef2]
  - cojson@0.13.15
  - jazz-browser@0.13.15
  - jazz-tools@0.13.15

## 0.13.14

### Patch Changes

- Updated dependencies [5c2c7d4]
  - cojson@0.13.14
  - jazz-browser@0.13.14
  - jazz-tools@0.13.14

## 0.13.13

### Patch Changes

- Updated dependencies [ec9cb40]
  - cojson@0.13.13
  - jazz-browser@0.13.13
  - jazz-tools@0.13.13

## 0.13.12

### Patch Changes

- Updated dependencies [4547525]
- Updated dependencies [29e05c4]
- Updated dependencies [65719f2]
  - jazz-tools@0.13.12
  - jazz-browser@0.13.12
  - cojson@0.13.12

## 0.13.11

### Patch Changes

- Updated dependencies [17273a6]
- Updated dependencies [3396ed4]
- Updated dependencies [17273a6]
- Updated dependencies [267ea4c]
  - cojson@0.13.11
  - jazz-tools@0.13.11
  - jazz-browser@0.13.11

## 0.13.10

### Patch Changes

- Updated dependencies [f837cfe]
  - cojson@0.13.10
  - jazz-browser@0.13.10
  - jazz-tools@0.13.10

## 0.13.9

### Patch Changes

- Updated dependencies [a6cf01f]
  - jazz-tools@0.13.9
  - jazz-browser@0.13.9

## 0.13.7

### Patch Changes

- Updated dependencies [bc3d7bb]
- Updated dependencies [4e9aae1]
- Updated dependencies [21c935c]
- Updated dependencies [aa1c80e]
- Updated dependencies [13074be]
  - jazz-tools@0.13.7
  - cojson@0.13.7
  - jazz-browser@0.13.7

## 0.13.5

### Patch Changes

- Updated dependencies [e090b39]
- Updated dependencies [fe6f561]
  - cojson@0.13.5
  - jazz-tools@0.13.5
  - jazz-browser@0.13.5

## 0.13.4

### Patch Changes

- Updated dependencies [3129982]
  - jazz-browser@0.13.4
  - jazz-tools@0.13.4

## 0.13.3

### Patch Changes

- Updated dependencies [12f8bfa]
- Updated dependencies [bd57177]
  - jazz-tools@0.13.3
  - jazz-browser@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies [c551839]
  - cojson@0.13.2
  - jazz-browser@0.13.2
  - jazz-tools@0.13.2

## 0.13.0

### Patch Changes

- Updated dependencies [a013538]
- Updated dependencies [afd1374]
- Updated dependencies [bce3bcc]
  - cojson@0.13.0
  - jazz-tools@0.13.0
  - jazz-browser@0.13.0

## 0.12.2

### Patch Changes

- Updated dependencies [cc684eb]
- Updated dependencies [c2f4827]
  - jazz-browser@0.12.2
  - cojson@0.12.2
  - jazz-tools@0.12.2

## 0.12.1

### Patch Changes

- Updated dependencies [5a00fe0]
  - cojson@0.12.1
  - jazz-browser@0.12.1
  - jazz-tools@0.12.1

## 0.12.0

### Patch Changes

- 4c01459: Fix types compilation for useAccount
- Updated dependencies [01523dc]
- Updated dependencies [4ea87dc]
- Updated dependencies [1e6da19]
- Updated dependencies [01523dc]
- Updated dependencies [b6c6a0a]
  - jazz-tools@0.12.0
  - cojson@0.12.0
  - jazz-browser@0.12.0

## 0.11.8

### Patch Changes

- Updated dependencies [6c86c4f]
- Updated dependencies [9d0c9dc]
  - cojson@0.11.8
  - jazz-browser@0.11.8
  - jazz-tools@0.11.8

## 0.11.7

### Patch Changes

- Updated dependencies [a140f55]
- Updated dependencies [2b94bc8]
- Updated dependencies [2957362]
- Updated dependencies [2b0d1b0]
  - jazz-tools@0.11.7
  - cojson@0.11.7
  - jazz-browser@0.11.7

## 0.11.6

### Patch Changes

- e7c85b7: Add targetWidth to highestResAvailable to add a way to fetch the next size up
- Updated dependencies [e7c85b7]
- Updated dependencies [8ed144e]
  - jazz-tools@0.11.6
  - cojson@0.11.6
  - jazz-browser@0.11.6

## 0.11.5

### Patch Changes

- Updated dependencies [60f5b3f]
  - cojson@0.11.5
  - jazz-browser@0.11.5
  - jazz-tools@0.11.5

## 0.11.4

### Patch Changes

- Updated dependencies [57a3dbe]
- Updated dependencies [a717754]
- Updated dependencies [a91f343]
- Updated dependencies [7f036c1]
  - jazz-tools@0.11.4
  - cojson@0.11.4
  - jazz-browser@0.11.4

## 0.11.3

### Patch Changes

- Updated dependencies [68b0242]
  - cojson@0.11.3
  - jazz-browser@0.11.3
  - jazz-tools@0.11.3

## 0.11.2

### Patch Changes

- Updated dependencies [6892dc6]
  - jazz-tools@0.11.2
  - jazz-browser@0.11.2

## 0.11.0

### Patch Changes

- Updated dependencies [6a96d8b]
- Updated dependencies [a35249a]
- Updated dependencies [b9d194a]
- Updated dependencies [b9d194a]
- Updated dependencies [a4713df]
- Updated dependencies [e22de9f]
- Updated dependencies [34cbdc3]
- Updated dependencies [0f67e0a]
- Updated dependencies [18428ea]
- Updated dependencies [f039e8f]
- Updated dependencies [e22de9f]
  - jazz-tools@0.11.0
  - cojson@0.11.0
  - jazz-browser@0.11.0

## 0.10.15

### Patch Changes

- Updated dependencies [2f99de0]
- Updated dependencies [f86e278]
  - jazz-tools@0.10.15
  - cojson@0.10.15
  - jazz-browser@0.10.15

## 0.10.14

### Patch Changes

- Updated dependencies [75211e3]
  - jazz-tools@0.10.14
  - jazz-browser@0.10.14

## 0.10.13

### Patch Changes

- Updated dependencies [07feedd]
  - jazz-tools@0.10.13
  - jazz-browser@0.10.13

## 0.10.12

### Patch Changes

- 4612e05: Fix type inference on `useCoState`
- Updated dependencies [4612e05]
  - jazz-tools@0.10.12
  - jazz-browser@0.10.12

## 0.10.9

### Patch Changes

- Updated dependencies [834203f]
  - jazz-browser@0.10.9

## 0.10.8

### Patch Changes

- Updated dependencies [153dc99]
- Updated dependencies [1e87fc7]
- Updated dependencies [2fb6428]
  - cojson@0.10.8
  - jazz-browser@0.10.8
  - jazz-tools@0.10.8

## 0.10.7

### Patch Changes

- Updated dependencies [0f83320]
- Updated dependencies [012022d]
- Updated dependencies [1136d9b]
- Updated dependencies [bf76d79]
- Updated dependencies [0eed228]
  - cojson@0.10.7
  - jazz-browser@0.10.7
  - jazz-tools@0.10.7

## 0.10.6

### Patch Changes

- Updated dependencies [5c76e37]
- Updated dependencies [ada802b]
  - cojson@0.10.6
  - jazz-tools@0.10.6
  - jazz-browser@0.10.6

## 0.10.5

### Patch Changes

- Updated dependencies [59ff77e]
  - jazz-tools@0.10.5
  - jazz-browser@0.10.5

## 0.10.4

### Patch Changes

- Updated dependencies [1af6072]
  - cojson@0.10.4
  - jazz-browser@0.10.4
  - jazz-tools@0.10.4

## 0.10.3

### Patch Changes

- Updated dependencies [d8582fc]
  - jazz-tools@0.10.3
  - jazz-browser@0.10.3

## 0.10.2

### Patch Changes

- Updated dependencies [cae3a9e]
  - cojson@0.10.2
  - jazz-browser@0.10.2
  - jazz-tools@0.10.2

## 0.10.1

### Patch Changes

- Updated dependencies [5a63cba]
- Updated dependencies [5a63cba]
  - jazz-tools@0.10.1
  - cojson@0.10.1
  - jazz-browser@0.10.1

## 0.10.0

### Minor Changes

- b426342: Return null when a coValue is not found

### Patch Changes

- Updated dependencies [b426342]
- Updated dependencies [498954f]
- Updated dependencies [8217981]
- Updated dependencies [d42c2aa]
- Updated dependencies [dd03464]
- Updated dependencies [b426342]
- Updated dependencies [ac3d9fa]
- Updated dependencies [610543c]
  - cojson@0.10.0
  - jazz-browser@0.10.0
  - jazz-tools@0.10.0

## 0.9.23

### Patch Changes

- Updated dependencies [70c9a5d]
  - cojson@0.9.23
  - jazz-browser@0.9.23
  - jazz-tools@0.9.23

## 0.9.22

### Patch Changes

- jazz-browser@0.9.22

## 0.9.21

### Patch Changes

- Updated dependencies [1be017d]
  - jazz-tools@0.9.21
  - jazz-browser@0.9.21

## 0.9.20

### Patch Changes

- Updated dependencies [b01cc1f]
  - jazz-tools@0.9.20
  - jazz-browser@0.9.20

## 0.9.19

### Patch Changes

- Updated dependencies [6ad0a9f]
  - cojson@0.9.19
  - jazz-browser@0.9.19
  - jazz-tools@0.9.19

## 0.9.18

### Patch Changes

- Updated dependencies [8898b10]
  - cojson@0.9.18
  - jazz-browser@0.9.18
  - jazz-tools@0.9.18

## 0.9.17

### Patch Changes

- Updated dependencies [c2ca1fe]
- Updated dependencies [1227047]
  - jazz-tools@0.9.17
  - jazz-browser@0.9.17

## 0.9.16

### Patch Changes

- Updated dependencies [24b3b6a]
  - jazz-tools@0.9.16
  - jazz-browser@0.9.16

## 0.9.15

### Patch Changes

- Updated dependencies [7491711]
  - jazz-tools@0.9.15
  - jazz-browser@0.9.15

## 0.9.14

### Patch Changes

- Updated dependencies [3df93cc]
  - jazz-tools@0.9.14
  - jazz-browser@0.9.14

## 0.9.13

### Patch Changes

- Updated dependencies [8d29e50]
  - cojson@0.9.13
  - jazz-browser@0.9.13
  - jazz-tools@0.9.13

## 0.9.12

### Patch Changes

- Updated dependencies [15d4b2a]
  - cojson@0.9.12
  - jazz-browser@0.9.12
  - jazz-tools@0.9.12

## 0.9.11

### Patch Changes

- Updated dependencies [efbf3d8]
- Updated dependencies [5863bad]
  - cojson@0.9.11
  - jazz-browser@0.9.11
  - jazz-tools@0.9.11

## 0.9.10

### Patch Changes

- Updated dependencies [4aa377d]
- Updated dependencies [5e83864]
  - cojson@0.9.10
  - jazz-tools@0.9.10
  - jazz-browser@0.9.10

## 0.9.9

### Patch Changes

- Updated dependencies [8eb9247]
- Updated dependencies [8eb9247]
  - jazz-tools@0.9.9
  - cojson@0.9.9
  - jazz-browser@0.9.9

## 0.9.8

### Patch Changes

- Updated dependencies [d1d773b]
  - jazz-tools@0.9.8
  - jazz-browser@0.9.8

## 0.9.1

### Patch Changes

- Updated dependencies [1b71969]
- Updated dependencies [5d98189]
  - jazz-browser@0.9.1
  - jazz-tools@0.9.1

## 0.9.0

### Minor Changes

- 9dd8d95: Change the way the JazzProvider is created and make the composables available as top-level imports.

  This is a breaking change.

### Patch Changes

- Updated dependencies [8eda792]
- Updated dependencies [8eda792]
- Updated dependencies [1ef3226]
  - cojson@0.9.0
  - jazz-tools@0.9.0
  - jazz-browser@0.9.0

## 0.8.51

### Patch Changes

- Updated dependencies [dc62b95]
- Updated dependencies [1de26f8]
  - jazz-tools@0.8.51
  - jazz-browser@0.8.51

## 0.8.50

### Patch Changes

- Updated dependencies [43378ef]
  - cojson@0.8.50
  - jazz-browser@0.8.50
  - jazz-tools@0.8.50

## 0.8.49

### Patch Changes

- Updated dependencies [25dfd90]
  - cojson@0.8.49
  - jazz-browser@0.8.49
  - jazz-tools@0.8.49

## 0.8.48

### Patch Changes

- Updated dependencies [635e824]
- Updated dependencies [10ea733]
- Updated dependencies [0a85982]
  - jazz-tools@0.8.48
  - cojson@0.8.48
  - jazz-browser@0.8.48

## 0.8.45

### Patch Changes

- Updated dependencies [6f0bd7f]
- Updated dependencies [fca6a0b]
- Updated dependencies [fa41f8e]
- Updated dependencies [88d7d9a]
- Updated dependencies [60e35ea]
  - jazz-browser@0.8.45
  - cojson@0.8.45
  - jazz-tools@0.8.45

## 0.8.44

### Patch Changes

- Updated dependencies [5d20c81]
  - cojson@0.8.44
  - jazz-browser@0.8.44
  - jazz-tools@0.8.44

## 0.8.41

### Patch Changes

- Updated dependencies [3252502]
- Updated dependencies [6370348]
- Updated dependencies [ac216b9]
  - cojson@0.8.41
  - jazz-browser@0.8.41
  - jazz-tools@0.8.41

## 0.8.40

### Patch Changes

- jazz-browser@0.8.40

## 0.8.39

### Patch Changes

- Updated dependencies [e386f2b]
- Updated dependencies [249eecb]
- Updated dependencies [3121551]
  - jazz-browser@0.8.39
  - jazz-tools@0.8.39
  - cojson@0.8.39

## 0.8.38

### Patch Changes

- Updated dependencies [b00ee91]
- Updated dependencies [f488c09]
  - cojson@0.8.38
  - jazz-browser@0.8.38
  - jazz-tools@0.8.38

## 0.8.25

### Patch Changes

- Updated dependencies [3d9f12e]
  - cojson@0.8.37
  - jazz-browser@0.8.37
  - jazz-tools@0.8.37

## 0.8.24

### Patch Changes

- Updated dependencies [441fe27]
  - cojson@0.8.36
  - jazz-tools@0.8.36
  - jazz-browser@0.8.36

## 0.8.23

### Patch Changes

- Updated dependencies [3f15a23]
- Updated dependencies [46f2ab8]
- Updated dependencies [8b87117]
- Updated dependencies [a6b6ccf]
  - cojson@0.8.35
  - jazz-tools@0.8.35
  - jazz-browser@0.8.35

## 0.8.22

### Patch Changes

- Updated dependencies [e4f110f]
  - cojson@0.8.34
  - jazz-browser@0.8.34
  - jazz-tools@0.8.34

## 0.8.21

### Patch Changes

- Updated dependencies [3cb27e1]
  - jazz-browser@0.8.33

## 0.8.20

### Patch Changes

- Updated dependencies [df42b2b]
- Updated dependencies [df42b2b]
  - cojson@0.8.32
  - jazz-tools@0.8.32
  - jazz-browser@0.8.32

## 0.8.19

### Patch Changes

- Updated dependencies [e511d6d]
  - cojson@0.8.31
  - jazz-browser@0.8.31
  - jazz-tools@0.8.31

## 0.8.18

### Patch Changes

- Updated dependencies [0a2fae3]
- Updated dependencies [99cda2f]
  - cojson@0.8.30
  - jazz-browser@0.8.30
  - jazz-tools@0.8.30

## 0.8.17

### Patch Changes

- Updated dependencies [dcc9c2e]
- Updated dependencies [699553f]
  - cojson@0.8.29
  - jazz-browser@0.8.29
  - jazz-tools@0.8.29

## 0.8.16

### Patch Changes

- Updated dependencies [605734c]
  - cojson@0.8.28
  - jazz-browser@0.8.28
  - jazz-tools@0.8.28

## 0.8.15

### Patch Changes

- Updated dependencies [75fdff4]
  - cojson@0.8.27
  - jazz-browser@0.8.27
  - jazz-tools@0.8.27

## 0.8.14

### Patch Changes

- jazz-browser@0.8.24

## 0.8.13

### Patch Changes

- Updated dependencies [6f745be]
- Updated dependencies [d348c2d]
- Updated dependencies [124bf67]
- Updated dependencies [e442bb8]
- Updated dependencies [6902b5b]
- Updated dependencies [1a0cd3d]
  - cojson@0.8.23
  - jazz-tools@0.8.23
  - jazz-browser@0.8.23

## 0.8.12

### Patch Changes

- a734530: fix useCoState reactivity
- Updated dependencies [f6bc8af]
  - jazz-browser@0.8.22

## 0.8.11

### Patch Changes

- Updated dependencies [0f30eea]
- Updated dependencies [149ca97]
  - cojson@0.8.21
  - jazz-tools@0.8.21
  - jazz-browser@0.8.21

## 0.8.10

### Patch Changes

- jazz-browser@0.8.20

## 0.8.9

### Patch Changes

- Updated dependencies [9c2aadb]
  - cojson@0.8.19
  - jazz-browser@0.8.19
  - jazz-tools@0.8.19

## 0.8.8

### Patch Changes

- Updated dependencies [d4319d8]
  - cojson@0.8.18
  - jazz-browser@0.8.18
  - jazz-tools@0.8.18

## 0.8.7

### Patch Changes

- Updated dependencies [d433cf4]
  - cojson@0.8.17
  - jazz-browser@0.8.17
  - jazz-tools@0.8.17

## 0.8.6

### Patch Changes

- 244e5ee: Implemented Vue support for Jazz
- Updated dependencies [2af107c]
- Updated dependencies [b934fab]
  - jazz-browser@0.8.16
  - cojson@0.8.16
  - jazz-tools@0.8.16

## 0.8.5

### Patch Changes

- Updated dependencies [c3f4e6b]
- Updated dependencies [d9152ed]
  - jazz-tools@0.8.5
  - cojson@0.8.5
  - jazz-browser@0.8.5

## 0.8.3

### Patch Changes

- Updated dependencies
  - cojson@0.8.3
  - jazz-browser@0.8.3
  - jazz-tools@0.8.3

## 0.8.2

### Patch Changes

- Updated dependencies [a075f90]
  - jazz-tools@0.8.2
  - jazz-browser@0.8.2

## 0.8.1

### Patch Changes

- Updated dependencies
  - jazz-tools@0.8.1
  - jazz-browser@0.8.1

## 0.8.0

### Minor Changes

- bcec3be: Implement new top-level context creation and auth method API

### Patch Changes

- 23369dc: Re-add logout functionality to AuthMethods
- c2b62a0: Make anonymous auth work better
- 1a979b6: Implement guest auth without account
- 6ce2051: Make me in useAccount potentially undefined to work with logged out state
- Updated dependencies [6a147c2]
- Updated dependencies [ad40b88]
- Updated dependencies [23369dc]
- Updated dependencies [c2b62a0]
- Updated dependencies [1a979b6]
- Updated dependencies [bcec3be]
  - cojson@0.8.0
  - jazz-tools@0.8.0
  - jazz-browser@0.8.0

## 0.7.35-guest-auth.6

### Patch Changes

- Re-add logout functionality to AuthMethods
- Updated dependencies
  - jazz-tools@0.7.35-guest-auth.6
  - jazz-browser@0.7.35-guest-auth.6

## 0.7.35

### Patch Changes

- cac2ec9: mark the auth as loading when authState is not ready
- Updated dependencies [49a8b54]
- Updated dependencies [35bbcd9]
- Updated dependencies [6f80282]
- Updated dependencies [35bbcd9]
- Updated dependencies [f350e90]
  - jazz-tools@0.7.35
  - cojson@0.7.35
  - jazz-browser@0.7.35

## 0.7.34

### Patch Changes

- Updated dependencies [5d91f9f]
- Updated dependencies [5094e6d]
- Updated dependencies [b09589b]
- Updated dependencies [2c3a40c]
- Updated dependencies [4e16575]
- Updated dependencies [ea882ab]
  - cojson@0.7.34
  - jazz-browser@0.7.34
  - jazz-tools@0.7.34

## 0.7.34-neverthrow.8

### Patch Changes

- Updated dependencies
  - cojson@0.7.34-neverthrow.8
  - jazz-browser@0.7.34-neverthrow.8
  - jazz-tools@0.7.34-neverthrow.8

## 0.7.34-neverthrow.7

### Patch Changes

- Updated dependencies
  - cojson@0.7.34-neverthrow.7
  - jazz-browser@0.7.34-neverthrow.7
  - jazz-tools@0.7.34-neverthrow.7

## 0.7.34-neverthrow.4

### Patch Changes

- Updated dependencies
  - cojson@0.7.34-neverthrow.4
  - jazz-browser@0.7.34-neverthrow.4
  - jazz-tools@0.7.34-neverthrow.4

## 0.7.34-neverthrow.3

### Patch Changes

- Updated dependencies
  - cojson@0.7.34-neverthrow.3
  - jazz-browser@0.7.34-neverthrow.3
  - jazz-tools@0.7.34-neverthrow.3

## 0.7.34-neverthrow.2

### Patch Changes

- jazz-browser@0.7.34-neverthrow.2

## 0.7.34-neverthrow.1

### Patch Changes

- Updated dependencies
  - cojson@0.7.34-neverthrow.1
  - jazz-browser@0.7.34-neverthrow.1
  - jazz-tools@0.7.34-neverthrow.1

## 0.7.34-neverthrow.0

### Patch Changes

- Updated dependencies
  - cojson@0.7.34-neverthrow.0
  - jazz-browser@0.7.34-neverthrow.0
  - jazz-tools@0.7.34-neverthrow.0

## 0.7.33

### Patch Changes

- Updated dependencies [b297c93]
- Updated dependencies [3bf5127]
- Updated dependencies [a8b74ff]
- Updated dependencies [db53161]
  - cojson@0.7.33
  - jazz-browser@0.7.33
  - jazz-tools@0.7.33

## 0.7.33-hotfixes.5

### Patch Changes

- Updated dependencies
  - cojson@0.7.33-hotfixes.5
  - jazz-browser@0.7.33-hotfixes.5
  - jazz-tools@0.7.33-hotfixes.5

## 0.7.33-hotfixes.4

### Patch Changes

- Updated dependencies
  - cojson@0.7.33-hotfixes.4
  - jazz-browser@0.7.33-hotfixes.4
  - jazz-tools@0.7.33-hotfixes.4

## 0.7.33-hotfixes.3

### Patch Changes

- Updated dependencies
  - cojson@0.7.33-hotfixes.3
  - jazz-browser@0.7.33-hotfixes.3
  - jazz-tools@0.7.33-hotfixes.3

## 0.7.33-hotfixes.2

### Patch Changes

- jazz-browser@0.7.33-hotfixes.2

## 0.7.33-hotfixes.1

### Patch Changes

- jazz-browser@0.7.33-hotfixes.1

## 0.7.33-hotfixes.0

### Patch Changes

- Updated dependencies
  - cojson@0.7.33-hotfixes.0
  - jazz-browser@0.7.33-hotfixes.0
  - jazz-tools@0.7.33-hotfixes.0

## 0.7.32

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.32
  - jazz-browser@0.7.32

## 0.7.31

### Patch Changes

- Updated dependencies
  - cojson@0.7.31
  - jazz-browser@0.7.31
  - jazz-tools@0.7.31

## 0.7.30

### Patch Changes

- jazz-browser@0.7.30

## 0.7.29

### Patch Changes

- Updated dependencies
  - cojson@0.7.29
  - jazz-browser@0.7.29
  - jazz-tools@0.7.29

## 0.7.28

### Patch Changes

- Updated dependencies
  - cojson@0.7.28
  - jazz-browser@0.7.28
  - jazz-tools@0.7.28

## 0.7.27

### Patch Changes

- jazz-browser@0.7.27

## 0.7.26

### Patch Changes

- Remove Effect from jazz/cojson internals
- Updated dependencies
  - cojson@0.7.26
  - jazz-browser@0.7.26
  - jazz-tools@0.7.26

## 0.7.25

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.25
  - jazz-browser@0.7.25

## 0.7.24

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.24
  - jazz-browser@0.7.24

## 0.7.23

### Patch Changes

- Mostly complete OPFS implementation (single-tab only)
- Updated dependencies
  - cojson@0.7.23
  - jazz-tools@0.7.23
  - jazz-browser@0.7.23

## 0.7.22

### Patch Changes

- jazz-browser@0.7.22

## 0.7.21

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.21
  - jazz-browser@0.7.21

## 0.7.20

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.20
  - jazz-browser@0.7.20

## 0.7.19

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.19
  - jazz-browser@0.7.19

## 0.7.18

### Patch Changes

- Updated dependencies
  - cojson@0.7.18
  - jazz-browser@0.7.18
  - jazz-tools@0.7.18

## 0.7.17

### Patch Changes

- Updated dependencies
  - cojson@0.7.17
  - jazz-browser@0.7.17
  - jazz-tools@0.7.17

## 0.7.16

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.16
  - jazz-browser@0.7.16

## 0.7.15

### Patch Changes

- Provide current res in ProgressiveImg

## 0.7.14

### Patch Changes

- Updated dependencies
  - cojson@0.7.14
  - jazz-tools@0.7.14
  - jazz-browser@0.7.14

## 0.7.13

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.13
  - jazz-browser@0.7.13

## 0.7.12

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.12
  - jazz-browser@0.7.12

## 0.7.11

### Patch Changes

- Updated dependencies
  - cojson@0.7.11
  - jazz-browser@0.7.11
  - jazz-tools@0.7.11

## 0.7.10

### Patch Changes

- Updated dependencies
  - cojson@0.7.10
  - jazz-browser@0.7.10
  - jazz-tools@0.7.10

## 0.7.9

### Patch Changes

- Updated dependencies
  - cojson@0.7.9
  - jazz-browser@0.7.9
  - jazz-tools@0.7.9

## 0.7.8

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.8
  - jazz-browser@0.7.8

## 0.7.7

### Patch Changes

- 9fdc91c: Improve compatibility with React compiler and concurrent features

## 0.7.6

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.6
  - jazz-browser@0.7.6

## 0.7.5

### Patch Changes

- Ability to add seed accounts to DemoAuth
- Updated dependencies
  - jazz-browser@0.7.5

## 0.7.4

### Patch Changes

- Expose auth loading state in a simple way

## 0.7.3

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.3
  - jazz-browser@0.7.3

## 0.7.2

### Patch Changes

- Fix type signature / depth of useCoState

## 0.7.1

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.1
  - jazz-browser@0.7.1

## 0.7.0

### Minor Changes

- e299c3e: New simplified API

### Patch Changes

- 59c18c3: CoMap fix
- 8636319: Implement deep loading, simplify API
- 1a35307: Use fresh subscribe context for useProgressiveImg
- d8fe2b1: Expose experimental OPFS storage
- 6d49e9b: Fix Provider params
- 704af7d: Add maxWidth option for loading images
- e97f730: Fix useAccount
- 6b0418f: Fix image resolution loading
- c4151fc: Support stricter TS lint rules
- 8636319: Only load each image resolution once
- 952982e: Consistent proxy based API
- d2e03ff: Fix variance of ID.\_\_type
- 354bdcd: Even friendlier for subclassing CoMap
- ece35b3: Fix subscription to account in useAccount
- 60d5ca2: Clean up exports
- 69ac514: Use effect schema much less
- f0f6f1b: Clean up API more & re-add jazz-nodejs
- 1a44f87: Refactoring
- 627d895: Get rid of Co namespace
- 85d2b62: More subclass-friendly types in CoMap
- Updated dependencies [8636319]
- Updated dependencies [1a35307]
- Updated dependencies [8636319]
- Updated dependencies [1a35307]
- Updated dependencies [96c494f]
- Updated dependencies [59c18c3]
- Updated dependencies [19f52b7]
- Updated dependencies [8636319]
- Updated dependencies [d8fe2b1]
- Updated dependencies [19004b4]
- Updated dependencies [a78f168]
- Updated dependencies [1200aae]
- Updated dependencies [52675c9]
- Updated dependencies [129e2c1]
- Updated dependencies [1cfa279]
- Updated dependencies [704af7d]
- Updated dependencies [1a35307]
- Updated dependencies [460478f]
- Updated dependencies [6b0418f]
- Updated dependencies [e299c3e]
- Updated dependencies [ed5643a]
- Updated dependencies [bde684f]
- Updated dependencies [bf0f8ec]
- Updated dependencies [c4151fc]
- Updated dependencies [63374cc]
- Updated dependencies [8636319]
- Updated dependencies [01ac646]
- Updated dependencies [a5e68a4]
- Updated dependencies [daee49c]
- Updated dependencies [952982e]
- Updated dependencies [1a35307]
- Updated dependencies [5fa277c]
- Updated dependencies [60d5ca2]
- Updated dependencies [21771c4]
- Updated dependencies [77c2b56]
- Updated dependencies [63374cc]
- Updated dependencies [d2e03ff]
- Updated dependencies [354bdcd]
- Updated dependencies [60d5ca2]
- Updated dependencies [69ac514]
- Updated dependencies [f8a5c46]
- Updated dependencies [f0f6f1b]
- Updated dependencies [e5eed5b]
- Updated dependencies [1a44f87]
- Updated dependencies [627d895]
- Updated dependencies [1200aae]
- Updated dependencies [63374cc]
- Updated dependencies [ece35b3]
- Updated dependencies [38d4410]
- Updated dependencies [85d2b62]
- Updated dependencies [fd86c11]
- Updated dependencies [52675c9]
  - jazz-tools@0.7.0
  - jazz-browser@0.7.0
  - cojson@0.7.0

## 0.7.0-alpha.42

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.0-alpha.42
  - cojson@0.7.0-alpha.42
  - jazz-browser@0.7.0-alpha.42

## 0.7.0-alpha.41

### Patch Changes

- jazz-tools@0.7.0-alpha.41
- jazz-browser@0.7.0-alpha.41

## 0.7.0-alpha.40

### Patch Changes

- Fix useAccount

## 0.7.0-alpha.39

### Patch Changes

- Updated dependencies
  - cojson@0.7.0-alpha.39
  - jazz-browser@0.7.0-alpha.39
  - jazz-tools@0.7.0-alpha.39

## 0.7.0-alpha.38

### Patch Changes

- Implement deep loading, simplify API
- Only load each image resolution once
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - jazz-tools@0.7.0-alpha.38
  - jazz-browser@0.7.0-alpha.38
  - cojson@0.7.0-alpha.38

## 0.7.0-alpha.37

### Patch Changes

- Expose experimental OPFS storage
- Updated dependencies
  - jazz-browser@0.7.0-alpha.37
  - cojson@0.7.0-alpha.37
  - jazz-tools@0.7.0-alpha.37

## 0.7.0-alpha.36

### Patch Changes

- 1a35307: Use fresh subscribe context for useProgressiveImg
- 6b0418f: Fix image resolution loading
- Updated dependencies [1a35307]
- Updated dependencies [1a35307]
- Updated dependencies [1a35307]
- Updated dependencies [6b0418f]
- Updated dependencies [1a35307]
  - jazz-browser@0.7.0-alpha.36
  - cojson@0.7.0-alpha.36
  - jazz-tools@0.7.0-alpha.36

## 0.7.0-alpha.35

### Patch Changes

- Updated dependencies
- Updated dependencies
  - cojson@0.7.0-alpha.35
  - jazz-tools@0.7.0-alpha.35
  - jazz-browser@0.7.0-alpha.35

## 0.7.0-alpha.34

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.0-alpha.34
  - jazz-browser@0.7.0-alpha.34

## 0.7.0-alpha.33

### Patch Changes

- Fix Provider params

## 0.7.0-alpha.32

### Patch Changes

- Clean up exports
- Updated dependencies
- Updated dependencies
  - jazz-tools@0.7.0-alpha.32
  - jazz-browser@0.7.0-alpha.32

## 0.7.0-alpha.31

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.0-alpha.31
  - jazz-browser@0.7.0-alpha.31

## 0.7.0-alpha.30

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.0-alpha.30
  - jazz-browser@0.7.0-alpha.30

## 0.7.0-alpha.29

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.0-alpha.29
  - cojson@0.7.0-alpha.29
  - jazz-browser@0.7.0-alpha.29

## 0.7.0-alpha.28

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.0-alpha.28
  - cojson@0.7.0-alpha.28
  - jazz-browser@0.7.0-alpha.28

## 0.7.0-alpha.27

### Patch Changes

- Updated dependencies
- Updated dependencies
  - jazz-tools@0.7.0-alpha.27
  - cojson@0.7.0-alpha.27
  - jazz-browser@0.7.0-alpha.27

## 0.7.0-alpha.26

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.0-alpha.26
  - jazz-browser@0.7.0-alpha.26

## 0.7.0-alpha.25

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.0-alpha.25
  - jazz-browser@0.7.0-alpha.25

## 0.7.0-alpha.24

### Patch Changes

- Updated dependencies
- Updated dependencies
- Updated dependencies
  - jazz-tools@0.7.0-alpha.24
  - cojson@0.7.0-alpha.24
  - jazz-browser@0.7.0-alpha.24

## 0.7.0-alpha.23

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.0-alpha.23
  - jazz-browser@0.7.0-alpha.23

## 0.7.0-alpha.22

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.0-alpha.22
  - jazz-browser@0.7.0-alpha.22

## 0.7.0-alpha.21

### Patch Changes

- Add maxWidth option for loading images
- Updated dependencies
  - jazz-tools@0.7.0-alpha.21
  - jazz-browser@0.7.0-alpha.21

## 0.7.0-alpha.20

### Patch Changes

- Fix subscription to account in useAccount
- Updated dependencies
  - jazz-tools@0.7.0-alpha.20
  - jazz-browser@0.7.0-alpha.20

## 0.7.0-alpha.19

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.0-alpha.19
  - jazz-browser@0.7.0-alpha.19

## 0.7.0-alpha.18

### Patch Changes

- Updated dependencies
  - jazz-browser@0.7.0-alpha.18

## 0.7.0-alpha.17

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.0-alpha.17
  - jazz-browser@0.7.0-alpha.17

## 0.7.0-alpha.16

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.0-alpha.16
  - jazz-browser@0.7.0-alpha.16

## 0.7.0-alpha.15

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.0-alpha.15
  - jazz-browser@0.7.0-alpha.15

## 0.7.0-alpha.14

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.0-alpha.14
  - jazz-browser@0.7.0-alpha.14

## 0.7.0-alpha.13

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.0-alpha.13
  - jazz-browser@0.7.0-alpha.13

## 0.7.0-alpha.12

### Patch Changes

- Fix variance of ID.\_\_type
- Updated dependencies
  - jazz-browser@0.7.0-alpha.12
  - jazz-tools@0.7.0-alpha.12

## 0.7.0-alpha.11

### Patch Changes

- Support stricter TS lint rules
- Updated dependencies
  - jazz-browser@0.7.0-alpha.11
  - jazz-tools@0.7.0-alpha.11
  - cojson@0.7.0-alpha.11

## 0.7.0-alpha.10

### Patch Changes

- Clean up API more & re-add jazz-nodejs
- Updated dependencies
  - jazz-browser@0.7.0-alpha.10
  - jazz-tools@0.7.0-alpha.10
  - cojson@0.7.0-alpha.10

## 0.7.0-alpha.9

### Patch Changes

- Even friendlier for subclassing CoMap
- Updated dependencies
  - jazz-browser@0.7.0-alpha.9
  - jazz-tools@0.7.0-alpha.9

## 0.7.0-alpha.8

### Patch Changes

- More subclass-friendly types in CoMap
- Updated dependencies
  - jazz-browser@0.7.0-alpha.8
  - jazz-tools@0.7.0-alpha.8

## 0.7.0-alpha.7

### Patch Changes

- Consistent proxy based API
- Updated dependencies
  - jazz-browser@0.7.0-alpha.7
  - jazz-tools@0.7.0-alpha.7

## 0.7.0-alpha.6

### Patch Changes

- CoMap fix
- Updated dependencies
  - jazz-browser@0.7.0-alpha.6
  - jazz-tools@0.7.0-alpha.6

## 0.7.0-alpha.5

### Patch Changes

- Refactoring
- Updated dependencies
  - jazz-browser@0.7.0-alpha.5
  - jazz-tools@0.7.0-alpha.5

## 0.7.0-alpha.4

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.0-alpha.4
  - jazz-browser@0.7.0-alpha.4

## 0.7.0-alpha.3

### Patch Changes

- Updated dependencies
  - jazz-tools@0.7.0-alpha.3
  - jazz-browser@0.7.0-alpha.3

## 0.7.0-alpha.2

### Patch Changes

- Get rid of Co namespace
- Updated dependencies
  - jazz-browser@0.7.0-alpha.2
  - jazz-tools@0.7.0-alpha.2

## 0.7.0-alpha.1

### Patch Changes

- Use effect schema much less
- Updated dependencies
  - jazz-browser@0.7.0-alpha.1
  - jazz-tools@0.7.0-alpha.1

## 0.7.0-alpha.0

### Minor Changes

- New simplified API

### Patch Changes

- Updated dependencies
  - jazz-browser@0.7.0-alpha.0
  - jazz-tools@0.7.0-alpha.0
  - cojson@0.7.0-alpha.0

## 0.5.4

### Patch Changes

- Fix migration changes being lost on loaded account
- Updated dependencies
  - cojson@0.6.6
  - jazz-browser@0.6.3

## 0.5.3

### Patch Changes

- Fix loading of accounts
- Updated dependencies
  - cojson@0.6.5
  - jazz-browser@0.6.2

## 0.5.2

### Patch Changes

- IndexedDB & timer perf improvements
- Updated dependencies
  - cojson@0.6.4
  - jazz-browser@0.6.1

## 0.5.1

### Patch Changes

- Updated dependencies
  - jazz-browser@0.6.0
  - cojson@0.6.0

## 0.5.0

### Minor Changes

- Adding a lot of performance improvements to cojson, add a stresstest for the twit example and make that run smoother in a lot of ways.

### Patch Changes

- Updated dependencies
  - jazz-browser@0.5.0
  - cojson@0.5.0
