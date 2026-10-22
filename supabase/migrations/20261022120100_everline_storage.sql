-- =============================================================================
-- Everline media storage
--
-- One private bucket. Objects live at  <story_id>/<media_id>.<ext>
-- Reading an object requires being able to read its row in public.media, so
-- a photograph is only visible to the people who can see its moment.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'story-media',
  'story-media',
  false,
  209715200, -- 200 MB; your Supabase plan may impose a lower global limit
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif',
    'video/mp4', 'video/quicktime', 'video/webm',
    'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Story media is readable by those who can see it"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'story-media'
    and (
      exists (select 1 from public.media m where m.path = storage.objects.name)
      -- the uploader can read their file before it is registered
      or (owner_id = (select auth.uid())::text)
    )
  );

create policy "Contributors can upload into their story's folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'story-media'
    and public.has_story_role(public.try_uuid((storage.foldername(name))[1]), 'contributor')
  );

create policy "Uploaders and editors can delete story media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'story-media'
    and (
      owner_id = (select auth.uid())::text
      or public.has_story_role(public.try_uuid((storage.foldername(name))[1]), 'editor')
    )
  );
