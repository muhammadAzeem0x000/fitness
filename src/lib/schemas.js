import { z } from 'zod';

// Auth Schemas
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

// Profile / Onboarding Schema
export const profileSchema = z.object({
    display_name: z.string().min(2, 'Name must be at least 2 characters'),
    gender: z.enum(['male', 'female', 'other'], { required_error: 'Please select a gender' }),
    birth_date: z.string().min(1, 'Date of birth is required'),

    // Physical Stats (Stored in DB units: cm/kg)
    height: z.string()
        .transform(val => parseFloat(val))
        .pipe(z.number().positive('Height must be positive').max(300, 'Height seems invalid')),

    current_weight: z.string()
        .transform(val => parseFloat(val))
        .pipe(z.number().positive('Weight must be positive').max(500, 'Weight seems invalid')),

    goal_weight: z.string()
        .transform(val => parseFloat(val))
        .pipe(z.number().positive('Weight must be positive').max(500, 'Weight seems invalid')),

    activity_level: z.string().optional(),
    dietary_preference: z.string().optional(),
    primary_goal: z.string().optional(),
    workout_days: z.array(z.string()).min(1, 'Select at least one workout day'),
});

export const weightEntrySchema = z.object({
    weight: z.string()
        .transform(val => parseFloat(val))
        .pipe(z.number().positive().max(500))
});
