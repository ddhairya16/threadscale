import { betterAuth } from 'better-auth'
import { magicLink } from 'better-auth/plugins'
import { Pool } from 'pg'
import nodemailer from 'nodemailer'

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
    enabled: false, // Magic links only
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const smtpEmail = process.env.SMTP_EMAIL
        const smtpPassword = process.env.SMTP_PASSWORD

        if (!smtpEmail || !smtpPassword) {
          console.error('[Better Auth] SMTP_EMAIL or SMTP_PASSWORD not set')
          return
        }

        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: smtpEmail, pass: smtpPassword },
        })

        await transporter.sendMail({
          from: `"Community Growth Platform" <${smtpEmail}>`,
          to: email,
          subject: 'Your magic link to sign in',
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #111;">Sign in to Community Growth</h2>
              <p style="color: #555;">Click the button below to sign in. This link expires in 10 minutes.</p>
              <a href="${url}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
                Sign In
              </a>
              <p style="color: #999; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        })
      },
    }),
  ],

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
})

export type Auth = typeof auth
