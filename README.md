# jazz-vue-vamp

Vue 3 composition API bindings for [Jazz.Tools](https://jazz.tools) - a framework for local-first collaborative applications.

## Vamp?
Vamp is a chord progression in Jazz that extends a song's duration. The whole point of this package is to extend Jazz.Tools into the Vue ecosystem, so it seemed like a good name. And we can't just call it `jazz-vue`, because that namespace was used back when Jazz was maintaining their own Vue package.

## Features

- 🎵 **Vue 3 Composition API** - Built for modern Vue with `<script setup>` support
- 🔄 **Real-time sync** - Collaborative state that updates across all connected clients
- 💾 **Offline-first** - Works seamlessly offline with automatic sync when reconnected
- 🔐 **End-to-end encrypted** - Your data is encrypted and signed on-device
- 🚀 **No backend required** - Jazz handles sync, storage, and permissions
- 🎯 **Type-safe** - Full TypeScript support with schema validation

## Installation

```bash
npm install jazz-vue-vamp jazz-tools jazz-browser
```

## Quick Start

### 1. Define Your Schema

```ts
// schema.ts
import { co, z } from "jazz-tools";

const TodoItem = co.map({
  title: z.string(),
  completed: z.boolean(),
});

const TodoList = co.list(TodoItem);

const AccountRoot = co.map({
  todos: TodoList,
});

export const MyAppAccount = co.account({
  root: AccountRoot,
  profile: co.map({ 
    name: z.string() 
  }),
});
```


### 2. Set Up the Provider

```vue
<!-- App.vue -->
<template>
  <JazzProvider
    :sync="{ peer: 'wss://cloud.jazz.tools/?key=your-app@example.com' }"
    :AccountSchema="MyAppAccount"
  >
    <TodoApp />
  </JazzProvider>
</template>

<script setup lang="ts">
import { JazzProvider } from "jazz-vue-vamp";
import { MyAppAccount } from "./schema";
import TodoApp from "./TodoApp.vue";
</script>
```

### 3. Use Jazz Composables

```vue
<!-- TodoApp.vue -->
<template>
  <div>
    <h1>My Todos</h1>
    
    <form @submit.prevent="addTodo">
      <input v-model="newTodo" placeholder="Add a todo..." />
      <button type="submit">Add</button>
    </form>
    
    <ul>
      <li v-for="todo in todos" :key="todo.id">
        <input 
          type="checkbox" 
          :checked="todo.completed" 
          @change="toggleTodo(todo)"
        />
        {{ todo.title }}
      </li>
    </ul>
    
    <button @click="logOut">Sign Out</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAccount } from "jazz-vue-vamp";
import { MyAppAccount, TodoItem } from "./schema";

// Get the current user with resolved data  
const { me, agent, logOut } = useAccount(MyAppAccount, {
  resolve: { root: { todos: true } }
});

const newTodo = ref("");

// Reactive access to todos
const todos = computed(() => me.value?.root?.todos || []);

function addTodo() {
  if (!newTodo.value.trim() || !me.value?.root?.todos) return;
  
  const todo = TodoItem.create({
    title: newTodo.value,
    completed: false
  }, { owner: me.value });
  
  me.value.root.todos.push(todo);
  newTodo.value = "";
}

function toggleTodo(todo: any) {
  todo.completed = !todo.completed;
}
</script>
```

## Core Composables

### `useAccount()`

Access the current user account and agent. Works in all authentication modes.

**Return Value:**
- `me` - The authenticated user account (always nullable)
- `agent` - Current agent (authenticated account or anonymous guest) 
- `logOut` - Function to sign out

```ts
// Basic usage - works for authenticated and guest users
const { me, agent, logOut } = useAccount();

// Check authentication state
if (agent.value._type === "Anonymous") {
  // Guest user - me will be null
  // Use agent to load public data
} else {
  // Authenticated user - me may be null until loaded
  // Use agent to load data
}

// With schema (provides better typing)
const { me, agent, logOut } = useAccount(MyAppAccount);

// With deep resolution
const { me, agent, logOut } = useAccount(MyAppAccount, {
  resolve: { 
    root: { todos: true },
    profile: true
  }
});

// For guest access to public data, use the agent
const publicTodos = useCoState(TodoList, publicTodoListId.value, {
  loadAs: agent.value  // Works for both authenticated and guest users
});
```

### `useCoState()`

Subscribe to any CoValue by ID with automatic updates.

```ts
const todo = useCoState(TodoItem, todoId, {
  resolve: { assignee: true }
});

// todo.value updates automatically when the data changes
```

### `useAcceptInvite()`

Handle collaborative invites in your app.

```ts
useAcceptInvite({
  invitedObjectSchema: TodoList,
  onAccept: (todoListId) => {
    // Navigate to the shared todo list
    router.push(`/todos/${todoListId}`);
  }
});
```

### `useIsAuthenticated()`

Check if the current user is authenticated.

```ts
const isAuthenticated = useIsAuthenticated();

// Use in template
// <div v-if="isAuthenticated">Welcome back!</div>
// <AuthForm v-else />

// Or watch for changes
watchEffect(() => {
  if (isAuthenticated.value) {
    // User just signed in
    router.push('/dashboard');
  }
});
```

### `useJazzContext()`

Access the raw Jazz context for advanced use cases.

```ts
const context = useJazzContext();
// Access node, networking, etc.
```

## Authentication

Jazz supports multiple authentication methods:

### Passkey Authentication

```vue
<template>
  <div>
    <DemoAuthBasicUI />
  </div>
</template>

<script setup lang="ts">
import { DemoAuthBasicUI } from "jazz-vue-vamp/auth";
</script>
```

### Custom Authentication

```ts
import { usePasskeyAuth, usePassphraseAuth } from "jazz-vue-vamp/auth";

// Passkey auth (recommended)
const { signUp, signIn } = usePasskeyAuth();

// Passphrase auth
const { signUp, signIn } = usePassphraseAuth();
```

## Sharing and Permissions

Create collaborative features with Groups:

```ts
import { Group } from "jazz-tools";

// Create a group for collaboration
const group = Group.create({ owner: me.value });
group.addMember(friend, "writer");

// Create shared data
const sharedTodos = TodoList.create([], { owner: group });

// Create invite links
import { createInviteLink } from "jazz-vue-vamp";
const inviteLink = createInviteLink(sharedTodos, "writer");
```

## Advanced Usage

### TypeScript Support

The package provides full TypeScript support. For the best experience, augment the account type:

```ts
// For traditional class-based schemas
declare module "jazz-vue-vamp/provider" {
  interface Register {
    Account: MyAppAccount;
  }
}

// For new co.account() schemas, type inference works automatically
```

### Deep Loading

Control what data is loaded and when:

```ts
// Load specific references
const { me, agent } = useAccount(MyAppAccount, {
  resolve: {
    root: {
      todos: {
        assignee: true  // Load assignee details for each todo
      }
    }
  }
});

// Conditional loading
const { me, agent } = useAccount(MyAppAccount, {
  resolve: selectedTodoId.value ? {
    root: { todos: { [selectedTodoId.value]: true } }
  } : {}
});
```

### Guest Mode

Allow anonymous users to access public data:

```vue
<JazzProvider 
  :guestMode="true"
  :sync="{ peer: 'wss://cloud.jazz.tools' }"
>
  <PublicTodosView />
</JazzProvider>
```

## Testing

The package includes utilities for testing:

```ts
import { withJazzTestSetup, createJazzTestAccount } from "jazz-vue-vamp/testing";

describe("Todo functionality", () => {
  it("should create todos", async () => {
    const account = await createJazzTestAccount({ 
      AccountSchema: MyAppAccount 
    });

    const [result] = withJazzTestSetup(
      () => useAccount(MyAppAccount),
      { account }
    );

    expect(result.agent.value).toBeDefined();
    expect(result.me.value).toBeDefined(); // May be null initially
  });
});
```

## Examples

Check out these examples to see jazz-vue-vamp in action:

- **Todo App** - Basic collaborative todo list
- **Chat App** - Real-time messaging 
- **Drawing Canvas** - Collaborative drawing with presence
- **Document Editor** - Rich text collaboration

## Migration from jazz-vue

If you're migrating from the original `jazz-vue` package:

1. Update imports: `jazz-vue` → `jazz-vue-vamp`
2. The API is largely compatible, but check the composable signatures
3. New `co.account()` syntax is now supported alongside class-based schemas

## Migration from pre-0.15.0 versions

If you're upgrading from earlier versions of vamp or jazz-vue, note these changes in 0.15.0:

### `useAccount()` Changes

```ts
// Before (pre-0.15.0)
const { me, logOut } = useAccount();
// me was never null (auto-fallback to contextMe)

// After (0.15.0) 
const { me, agent, logOut } = useAccount();
// me is now always nullable, agent is always available
```

### `useAccountOrGuest()` Removed

```ts
// Before (pre-0.15.0)
const { me } = useAccountOrGuest();
if (me.value._type === "Anonymous") {
  // Handle guest
} else {
  // Handle authenticated user
}

// After (0.15.0) - Use useAccount() instead
const { me, agent } = useAccount();
if (agent.value._type === "Anonymous") {
  // Handle guest - me will be null
  // Use agent to load data
} else {
  // Handle authenticated user - me may be null until loaded
  // Use agent to load data
}
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT - see [LICENSE.txt](LICENSE.txt) for details.

## Related

- [Jazz.Tools](https://jazz.tools) - Main Jazz framework
- [jazz-tools](https://npmjs.com/package/jazz-tools) - Core Jazz package
- [jazz-react](https://npmjs.com/package/jazz-react) - React bindings

