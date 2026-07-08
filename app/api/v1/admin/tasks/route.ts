import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/get-session'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/v1/admin/tasks — list all tasks with project + client joins
export async function GET() {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('tasks')
    .select(
      `id, title, task_type, subreddit, status, base_reward_inr,
       max_assignments, deadline_hours, created_at,
       projects(name, client_id, clients(name))`
    )
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/v1/admin/tasks — create a new task
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    project_id,
    task_type,
    title,
    instructions,
    subreddit,
    thread_url,
    post_title,
    post_body,
    base_reward_inr,
    max_assignments,
    deadline_hours,
  } = body as {
    project_id?: string
    task_type?: string
    title?: string
    instructions?: string
    subreddit?: string
    thread_url?: string
    post_title?: string
    post_body?: string
    base_reward_inr?: number
    max_assignments?: number
    deadline_hours?: number
  }

  if (!project_id) {
    return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
  }
  if (!task_type) {
    return NextResponse.json({ error: 'task_type is required' }, { status: 400 })
  }
  if (!title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }
  if (!instructions?.trim()) {
    return NextResponse.json({ error: 'instructions is required' }, { status: 400 })
  }
  if (base_reward_inr == null) {
    return NextResponse.json({ error: 'base_reward_inr is required' }, { status: 400 })
  }

  // Use admin client — contributors cannot see tasks by project_id under RLS
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      project_id,
      task_type: task_type as 'comment' | 'post' | 'moderation',
      title: title.trim(),
      instructions: instructions.trim(),
      subreddit: subreddit ?? null,
      thread_url: thread_url ?? null,
      post_title: post_title ?? null,
      post_body: post_body ?? null,
      base_reward_inr,
      max_assignments: max_assignments ?? 1,
      deadline_hours: deadline_hours ?? 24,
      created_by: session.userId,
    })
    .select(
      `id, title, task_type, subreddit, status, base_reward_inr,
       max_assignments, deadline_hours, created_at,
       projects(name, client_id, clients(name))`
    )
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
