import { betterAuth } from 'better-auth'
import { Pool } from 'pg'

/**
 * Better Auth instance.
 * Uses Supabase Postgres as the database via a direct connection.
 * Default table names: user, session, account, verification
 * Better Auth quotes the "user" table name internally so no conflict.
 */
export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  }),

  emailAndPassword: {
    enabled: true, // Enable email and password login for the Admin
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Strictly restrict signup to the admin email only
          const allowedEmails = ['ddhairya16@gmail.com']
          if (!allowedEmails.includes(user.email.toLowerCase())) {
            throw new Error('Sign-ups are disabled for this email.')
          }
          return {
            data: user,
          }
        },
      },
    },
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
})

export type Auth = typeof auth
