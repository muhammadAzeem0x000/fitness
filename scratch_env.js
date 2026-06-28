import { loadEnv } from 'vite';

const env = loadEnv('production', process.cwd(), '');
console.log("Loaded VITE_REVENUECAT_API_KEY:", env.VITE_REVENUECAT_API_KEY);
