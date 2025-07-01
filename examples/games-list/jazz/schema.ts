import { co, z, Group } from 'jazz-tools'

// Game schema fields definition
export const GameSchemaFields = {
    name: z.string(),
    description: z.string(),
    notes: z.string(),
    archived: z.boolean(),
} as const

// Game schema - represents a board game design
export const GameSchema = co.map(GameSchemaFields)

// Export type for the field names
export type GameField = keyof typeof GameSchemaFields

// UI State schema for local-only state (search, filters, etc.)
export const UIStateSchema = co.map({
    searchQuery: z.string(),
    filterType: z.string(), // 'active', 'archived', 'all'
})

/** The root is an app-specific per-user private `CoMap`
 *  where you can store top-level objects for that user */
export const AccountRoot = co.map({
    games: co.list(GameSchema), // All games (owned and shared) - permissions handled by Jazz groups
    uiState: UIStateSchema,
});

export const AccountProfile = co.profile({
    name: z.string(),
});

export const JazzAccount = co.account({
    root: AccountRoot,
    profile: AccountProfile,
}).withMigration(async (account, creationProps?: { name: string }) => {
    if (account.root === undefined) {
        // Create groups explicitly for all CoValues
        const gamesGroup = Group.create(account);
        const uiStateGroup = Group.create(account);
        const rootGroup = Group.create(account);

        const games = co.list(GameSchema).create([], gamesGroup);
        const uiState = UIStateSchema.create({
            searchQuery: '',
            filterType: 'active'
        }, uiStateGroup);

        account.root = AccountRoot.create({ games, uiState }, rootGroup);
    }

    if (account.profile === undefined) {
        const profileGroup = Group.create(account);
        profileGroup.makePublic();
        account.profile = AccountProfile.create({
            name: creationProps?.name ?? "New user",
        }, profileGroup);
    }
});