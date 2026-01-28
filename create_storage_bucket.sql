-- Create a storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Policy to allow authenticated users to upload their own avatar
create policy "Users can upload their own avatar"
on storage.objects for insert
with check ( bucket_id = 'avatars' and auth.uid() = owner );

-- Policy to allow authenticated users to update their own avatar
create policy "Users can update their own avatar"
on storage.objects for update
with check ( bucket_id = 'avatars' and auth.uid() = owner );

-- Policy to allow anyone to view avatars
create policy "Anyone can view avatars"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- Policy to allow authenticated users to delete their own avatar
create policy "Users can delete their own avatar"
on storage.objects for delete
using ( bucket_id = 'avatars' and auth.uid() = owner );
