import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function GET() {
  const results: any = {
    databaseUrlExists: !!process.env.DATABASE_URL,
    connectionTest: 'not_started',
    error: null,
    tables: {}
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'DATABASE_URL env is missing' }, { status: 500 })
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    const connTest = await pool.query('SELECT NOW()')
    results.connectionTest = 'success'
    results.dbTime = connTest.rows[0].now
    
    // Check if profiles table exists and query count
    try {
      const profiles = await pool.query('SELECT COUNT(*) FROM profiles')
      results.tables.profilesCount = profiles.rows[0].count
    } catch (e: any) {
      results.tables.profilesError = e.message
    }

    // Check if ba_user or "user" table exists and query count
    try {
      const users = await pool.query('SELECT COUNT(*) FROM "user"')
      results.tables.userCount = users.rows[0].count
    } catch (e: any) {
      results.tables.userError = e.message
    }

    // Check if ba_account or account table exists
    try {
      const accounts = await pool.query('SELECT COUNT(*) FROM account')
      results.tables.accountCount = accounts.rows[0].count
    } catch (e: any) {
      results.tables.accountError = e.message
    }

  } catch (err: any) {
    results.connectionTest = 'failed'
    results.error = err.message
  } finally {
    await pool.end()
  }

  return NextResponse.json(results)
}
