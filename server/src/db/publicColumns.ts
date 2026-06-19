/**
 * Columns of `users` that may be sent to other users. Anything joined from `users` in a
 * response must use this whitelist so password hashes and tokens never leave the server.
 */
export const publicUserColumns = {
    id: true,
    fullName: true,
    email: true,
    avatarUrl: true,
} as const;
