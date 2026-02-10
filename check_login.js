// ============================================
// CHECK IF YOU'RE LOGGED IN
// ============================================
// Copy and paste this into your browser console (F12 → Console)

// 1. Check current user
const { data: { user }, error } = await window.supabase.auth.getUser()
console.log('Current user:', user)
console.log('Auth error:', error)

if (!user) {
    console.error('❌ YOU ARE NOT LOGGED IN!')
    console.log('Go to /auth and log in first')
} else {
    console.log('✅ Logged in as:', user.email)

    // 2. Check if session exists
    const { data: { session } } = await window.supabase.auth.getSession()
    console.log('Session exists:', !!session)
    console.log('Access token:', session?.access_token?.substring(0, 20) + '...')
}
