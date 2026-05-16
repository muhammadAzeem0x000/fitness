import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...value] = line.split('=');
    if (key && value.length) acc[key.trim()] = value.join('=').trim();
    return acc;
}, {});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
const priceId = env.VITE_STRIPE_PRICE_MONTHLY;


const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log('Logging in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'azeem@example.com', // Replace with a valid test email if needed, or we can just create a test user
        password: 'password123'
    });

    if (authError) {
        console.error('Login error:', authError.message);
        // Let's create a test user instead
        console.log('Creating test user...');
        const email = `test_${Date.now()}@example.com`;
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: 'password123'
        });
        if (signUpError) {
            console.error('Signup error:', signUpError.message);
            return;
        }
        console.log('Created user:', email);
        await testCheckout(signUpData.session);
        return;
    }

    console.log('Logged in as:', authData.user.email);
    await testCheckout(authData.session);
}

async function testCheckout(session) {
    console.log('Testing create-checkout-session with price:', priceId);
    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
                'apikey': supabaseAnonKey
            },
            body: JSON.stringify({ priceId })
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

run();
