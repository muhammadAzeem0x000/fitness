-- Add default_reps column to profiles table
alter table public.profiles
add column default_reps integer default 12;

-- Check if it exists and add it (safeguard, though simple alter is usually fine for manual run)
-- DO NOT RUN THE BELOW IF THE ABOVE WORKED. This is just for context.
-- If you need to revert:
-- alter table public.profiles drop column default_reps;
