import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  console.log('🌱 Seeding database...')

  try {
    // Sign up demo user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'demo@taskflow.app',
      password: 'DemoPass123!',
    })

    if (authError) throw authError
    if (!authData.user?.id) throw new Error('No user ID returned')

    const userId = authData.user.id
    console.log(`✅ Created demo user: demo@taskflow.app`)

    // Create sample boards
    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .insert([
        { user_id: userId, name: 'Personal Projects' },
        { user_id: userId, name: 'Work Tasks' },
      ])
      .select()

    if (boardsError) throw boardsError
    console.log(`✅ Created ${boards?.length || 0} boards`)

    // Create sample tasks for first board
    if (boards && boards.length > 0) {
      const boardId = boards[0].id

      const tasks = [
        {
          board_id: boardId,
          title: 'Design landing page',
          description: 'Create hero section and feature grid',
          status: 'to_do',
          order_index: 1,
        },
        {
          board_id: boardId,
          title: 'Build authentication',
          description: 'Implement sign up and login with Supabase Auth',
          status: 'in_progress',
          order_index: 1,
        },
        {
          board_id: boardId,
          title: 'Set up database',
          description: 'Create tables and RLS policies',
          status: 'in_progress',
          order_index: 2,
        },
        {
          board_id: boardId,
          title: 'Implement drag-drop',
          description: 'Use @dnd-kit for Kanban columns',
          status: 'in_progress',
          order_index: 3,
        },
        {
          board_id: boardId,
          title: 'Add real-time sync',
          description: 'Supabase Realtime subscriptions for tasks',
          status: 'done',
          order_index: 1,
        },
        {
          board_id: boardId,
          title: 'Deploy to Vercel',
          description: 'Set up CI/CD and deploy frontend',
          status: 'done',
          order_index: 2,
        },
      ]

      const { data: createdTasks, error: tasksError } = await supabase
        .from('tasks')
        .insert(tasks)
        .select()

      if (tasksError) throw tasksError
      console.log(`✅ Created ${createdTasks?.length || 0} sample tasks`)
    }

    console.log('\n🎉 Seeding complete!')
    console.log('\nDemo Credentials:')
    console.log('Email: demo@taskflow.app')
    console.log('Password: DemoPass123!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seed()
