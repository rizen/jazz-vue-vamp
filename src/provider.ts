import { JazzBrowserContextManager } from "jazz-browser";
import type {
  Account,
  AccountClass,
  AnyAccountSchema,
  CoValueFromRaw,
  JazzContextType,
  SyncConfig,
} from "jazz-tools";
import {
  type PropType,
  defineComponent,
  onMounted,
  onUnmounted,
  provide,
  ref,
  watch,
} from "vue";

export const logoutHandler = ref<() => void>();

// biome-ignore lint/suspicious/noEmptyInterface: This interface is meant to be module augmented by users
export interface Register {}

export type RegisteredAccount = Register extends { Account: infer Acc }
  ? Acc
  : Account;

declare module "jazz-tools" {
  export interface Register {
    Account: RegisteredAccount;
  }
}

export const JazzContextSymbol = Symbol("JazzContext");
export const JazzAuthContextSymbol = Symbol("JazzAuthContext");

export const JazzProvider = defineComponent({
  name: "JazzProvider",
  props: {
    guestMode: {
      type: Boolean,
      default: false,
    },
    sync: {
      type: Object as PropType<SyncConfig>,
      required: true,
    },
    AccountSchema: {
      type: Function as unknown as PropType<
        (AccountClass<Account> & CoValueFromRaw<Account>) | AnyAccountSchema
      >,
      required: false,
    },
    storage: {
      type: String as PropType<"indexedDB">,
      default: undefined,
    },
    defaultProfileName: {
      type: String,
      required: false,
    },
    onAnonymousAccountDiscarded: {
      // biome-ignore lint/suspicious/noExplicitAny: Complex generic typing with Jazz framework internals
      type: Function as PropType<(anonymousAccount: any) => Promise<void>>,
      required: false,
    },
    onLogOut: {
      type: Function as PropType<() => void>,
      required: false,
    },
  },
  setup(props, { slots }) {
    const contextManager = new JazzBrowserContextManager<
      (AccountClass<Account> & CoValueFromRaw<Account>) | AnyAccountSchema
    >();
    // biome-ignore lint/suspicious/noExplicitAny: Complex generic typing with Jazz framework internals
    const ctx = ref<JazzContextType<any>>();

    provide(JazzContextSymbol, ctx);
    provide(JazzAuthContextSymbol, contextManager.getAuthSecretStorage());

    watch(
      () => ({
        peer: props.sync.peer,
        syncWhen: props.sync.when,
        storage: props.storage,
        guestMode: props.guestMode,
      }),
      async () => {
        contextManager
          .createContext({
            sync: props.sync,
            storage: props.storage,
            guestMode: props.guestMode,
            AccountSchema: props.AccountSchema,
            defaultProfileName: props.defaultProfileName,
            onAnonymousAccountDiscarded: props.onAnonymousAccountDiscarded,
            onLogOut: props.onLogOut,
          })
          .catch((error) => {
            console.error("Error creating Jazz browser context:", error);
          });
      },
      { immediate: true },
    );

    onMounted(() => {
      const cleanup = contextManager.subscribe(() => {
        ctx.value = contextManager.getCurrentValue();
      });
      onUnmounted(cleanup);
    });

    onUnmounted(() => {
      if (ctx.value) ctx.value.done?.();
    });

    return () => (ctx.value ? slots.default?.() : null);
  },
});
