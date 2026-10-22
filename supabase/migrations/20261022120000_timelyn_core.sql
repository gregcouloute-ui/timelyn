-- =============================================================================
-- TimeLyn core schema
--
-- Stories (one per person), their members and roles, chapters of life,
-- moments contributed by family, media, invitations and a review log.
--
-- Security model: every table has Row Level Security enabled. Access is
-- derived from story membership via the security-definer helper functions
-- below, which read story_members without recursing through its own policies.
-- Triggers guard the columns that only story keepers and editors may change,
-- so a contributor cannot publish their own work even with a crafted request.
-- =============================================================================

-- ----------------------------------------------------------------- types

create type public.story_role as enum ('owner', 'editor', 'contributor', 'viewer');
create type public.moment_status as enum ('pending', 'changes_requested', 'published', 'declined');
create type public.media_kind as enum ('image', 'video', 'audio');
create type public.media_purpose as enum ('moment', 'cover');
create type public.review_decision as enum ('publish', 'request_changes', 'decline');

-- ----------------------------------------------------------------- tables

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 80),
  subject_name text not null check (char_length(subject_name) between 1 and 120),
  known_as text check (char_length(known_as) <= 60),
  birth_year integer not null check (birth_year between 1800 and 2200),
  birth_month smallint check (birth_month between 1 and 12),
  birth_day smallint check (birth_day between 1 and 31),
  birth_circa boolean not null default false,
  birth_place text check (char_length(birth_place) <= 120),
  death_year integer check (death_year between 1800 and 2200),
  death_month smallint check (death_month between 1 and 12),
  death_day smallint check (death_day between 1 and 31),
  death_place text check (char_length(death_place) <= 120),
  introduction text check (char_length(introduction) <= 2000),
  cover_media_id uuid,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint birth_day_needs_month check (birth_day is null or birth_month is not null),
  constraint death_parts_need_year check (death_year is not null or (death_month is null and death_day is null)),
  constraint death_day_needs_month check (death_day is null or death_month is not null),
  constraint death_after_birth check (death_year is null or death_year >= birth_year)
);

create table public.story_members (
  story_id uuid not null references public.stories (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.story_role not null,
  relationship text check (char_length(relationship) <= 60),
  joined_at timestamptz not null default now(),
  primary key (story_id, user_id)
);

-- Exactly one story keeper per story.
create unique index story_members_one_owner on public.story_members (story_id) where role = 'owner';
create index story_members_user_idx on public.story_members (user_id);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  start_year integer not null check (start_year between 1800 and 2200),
  summary text check (char_length(summary) <= 600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_id, start_year)
);

create table public.moments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  body text check (char_length(body) <= 8000),
  date_year integer not null check (date_year between 1800 and 2200),
  date_month smallint check (date_month between 1 and 12),
  date_day smallint check (date_day between 1 and 31),
  date_circa boolean not null default false,
  sort_key integer generated always as (
    date_year * 10000 + coalesce(date_month, 0) * 100 + coalesce(date_day, 0)
  ) stored,
  place text check (char_length(place) <= 120),
  people text[] not null default '{}' check (cardinality(people) <= 20),
  is_milestone boolean not null default false,
  status public.moment_status not null default 'pending',
  contributor_id uuid references public.profiles (id) on delete set null default auth.uid(),
  review_note text check (char_length(review_note) <= 1000),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint moment_day_needs_month check (date_day is null or date_month is not null)
);

create index moments_story_sort_idx on public.moments (story_id, sort_key);
create index moments_story_status_idx on public.moments (story_id, status);
create index moments_contributor_idx on public.moments (contributor_id);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  moment_id uuid references public.moments (id) on delete cascade,
  purpose public.media_purpose not null default 'moment',
  kind public.media_kind not null,
  path text not null unique,
  mime_type text not null check (char_length(mime_type) <= 100),
  size_bytes bigint not null check (size_bytes > 0),
  width integer check (width > 0),
  height integer check (height > 0),
  duration_seconds numeric(10, 2) check (duration_seconds >= 0),
  caption text check (char_length(caption) <= 300),
  position smallint not null default 0,
  uploaded_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  constraint media_path_in_story_folder check (path like story_id::text || '/%')
);

create index media_moment_idx on public.media (moment_id, position);
create index media_story_idx on public.media (story_id);

alter table public.stories
  add constraint stories_cover_media_fk
  foreign key (cover_media_id) references public.media (id) on delete set null;

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  email text not null check (email = lower(email) and char_length(email) <= 254),
  role public.story_role not null check (role <> 'owner'),
  relationship text check (char_length(relationship) <= 60),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  invited_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  accepted_by uuid references public.profiles (id) on delete set null,
  revoked_at timestamptz
);

create index invitations_story_idx on public.invitations (story_id);

create table public.moment_reviews (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments (id) on delete cascade,
  reviewer_id uuid references public.profiles (id) on delete set null,
  decision public.review_decision not null,
  note text,
  created_at timestamptz not null default now()
);

create index moment_reviews_moment_idx on public.moment_reviews (moment_id);

-- ----------------------------------------------------------------- helpers

-- STRICT: no role means no rank (null), never the lowest rank.
create function public.story_role_rank(r public.story_role)
returns integer
language sql
immutable
strict
set search_path = ''
as $$
  select case r
    when 'owner' then 3
    when 'editor' then 2
    when 'contributor' then 1
    when 'viewer' then 0
  end;
$$;

-- The caller's role in a story, or null. Security definer so that policies on
-- other tables can consult membership without recursing through RLS.
create function public.story_role_of(p_story uuid)
returns public.story_role
language sql
stable
security definer
set search_path = ''
as $$
  select m.role
  from public.story_members m
  where m.story_id = p_story and m.user_id = (select auth.uid());
$$;

create function public.has_story_role(p_story uuid, p_min public.story_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.story_role_rank(public.story_role_of(p_story)) >= public.story_role_rank(p_min),
    false
  );
$$;

-- Whether the caller shares at least one story with another user.
create function public.shares_story_with(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.story_members mine
    join public.story_members theirs on theirs.story_id = mine.story_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = p_user
  );
$$;

create function public.try_uuid(p text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return p::uuid;
exception when others then
  return null;
end;
$$;

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger stories_touch before update on public.stories
  for each row execute function public.touch_updated_at();
create trigger chapters_touch before update on public.chapters
  for each row execute function public.touch_updated_at();
create trigger moments_touch before update on public.moments
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------- profiles from auth

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
        split_part(coalesce(new.email, 'Family member'), '@', 1)
      ),
      80
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------- story creation

-- The creator becomes the story keeper, and the story opens with a first chapter.
create function public.handle_new_story()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by is null then
    raise exception 'A story must have a creator';
  end if;

  insert into public.story_members (story_id, user_id, role)
  values (new.id, new.created_by, 'owner');

  insert into public.chapters (story_id, title, start_year)
  values (new.id, 'Early years', new.birth_year);

  return new;
end;
$$;

create trigger on_story_created
  after insert on public.stories
  for each row execute function public.handle_new_story();

create function public.guard_story_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_by is distinct from old.created_by then
    raise exception 'The story creator cannot be changed';
  end if;
  if new.cover_media_id is not null and not exists (
    select 1 from public.media m
    where m.id = new.cover_media_id and m.story_id = new.id and m.kind = 'image'
  ) then
    raise exception 'The cover must be an image from this story';
  end if;
  return new;
end;
$$;

create trigger stories_guard before update on public.stories
  for each row execute function public.guard_story_columns();

-- ----------------------------------------------------------------- moment guards

-- Contributors may write the content of their own moments, but only story
-- keepers and editors may publish, decline, mark milestones or leave review
-- notes. This trigger enforces that regardless of what the client sends.
create function public.guard_moment_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  is_admin boolean := public.has_story_role(new.story_id, 'editor');
begin
  if tg_op = 'INSERT' then
    new.contributor_id := (select auth.uid());
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.review_note := null;
    if not is_admin then
      new.status := 'pending';
      new.is_milestone := false;
    end if;
    if new.status = 'published' then
      new.published_at := now();
      new.reviewed_by := (select auth.uid());
      new.reviewed_at := now();
    else
      new.published_at := null;
    end if;
    return new;
  end if;

  -- UPDATE
  if new.story_id <> old.story_id then
    raise exception 'Moments cannot move between stories';
  end if;
  if new.contributor_id is distinct from old.contributor_id then
    raise exception 'The contributor of a moment cannot be changed';
  end if;

  if not is_admin then
    -- A contributor's edit always (re)submits the moment for review.
    new.status := 'pending';
    new.is_milestone := old.is_milestone;
    new.review_note := old.review_note;
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
    new.published_at := old.published_at;
    return new;
  end if;

  if new.status is distinct from old.status then
    new.reviewed_by := (select auth.uid());
    new.reviewed_at := now();
    if new.status = 'published' then
      new.published_at := coalesce(old.published_at, now());
    end if;
  end if;
  return new;
end;
$$;

create trigger moments_guard before insert or update on public.moments
  for each row execute function public.guard_moment_write();

create function public.log_moment_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status
     and new.status in ('published', 'changes_requested', 'declined')
     and public.has_story_role(new.story_id, 'editor') then
    insert into public.moment_reviews (moment_id, reviewer_id, decision, note)
    values (
      new.id,
      (select auth.uid()),
      case new.status
        when 'published' then 'publish'::public.review_decision
        when 'changes_requested' then 'request_changes'::public.review_decision
        else 'decline'::public.review_decision
      end,
      new.review_note
    );
  end if;
  return new;
end;
$$;

create trigger moments_review_log after update on public.moments
  for each row execute function public.log_moment_review();

create function public.guard_media_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.path <> old.path or new.story_id <> old.story_id or new.kind <> old.kind
       or new.uploaded_by is distinct from old.uploaded_by then
      raise exception 'Only the caption, position and moment of a file can change';
    end if;
  else
    new.uploaded_by := (select auth.uid());
  end if;
  if new.moment_id is not null and not exists (
    select 1 from public.moments m where m.id = new.moment_id and m.story_id = new.story_id
  ) then
    raise exception 'Files can only be attached to moments in the same story';
  end if;
  return new;
end;
$$;

create trigger media_guard before insert or update on public.media
  for each row execute function public.guard_media_write();

-- ----------------------------------------------------------------- invitations

create function public.invitation_preview(p_token text)
returns table (
  story_subject text,
  story_known_as text,
  invited_by_name text,
  role public.story_role,
  email text,
  state text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.subject_name,
    s.known_as,
    p.display_name,
    i.role,
    i.email,
    case
      when i.accepted_at is not null then 'accepted'
      when i.revoked_at is not null then 'revoked'
      when i.expires_at < now() then 'expired'
      else 'open'
    end
  from public.invitations i
  join public.stories s on s.id = i.story_id
  left join public.profiles p on p.id = i.invited_by
  where i.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
$$;

create function public.accept_invitation(p_token text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv public.invitations%rowtype;
  caller uuid := (select auth.uid());
  caller_email text := lower(coalesce((select auth.jwt()) ->> 'email', ''));
  existing public.story_role;
  story_slug text;
begin
  if caller is null then
    raise exception 'Sign in to accept this invitation' using errcode = '42501';
  end if;

  select * into inv
  from public.invitations
  where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
  for update;

  if not found then
    raise exception 'This invitation link is not valid' using errcode = 'P0002';
  end if;
  if inv.revoked_at is not null then
    raise exception 'This invitation has been withdrawn' using errcode = 'P0001';
  end if;
  if inv.accepted_at is not null then
    if inv.accepted_by = caller then
      select slug into story_slug from public.stories where id = inv.story_id;
      return story_slug;
    end if;
    raise exception 'This invitation has already been used' using errcode = 'P0001';
  end if;
  if inv.expires_at < now() then
    raise exception 'This invitation has expired' using errcode = 'P0001';
  end if;
  if inv.email <> caller_email then
    raise exception 'This invitation was sent to a different email address' using errcode = '42501';
  end if;

  select role into existing from public.story_members
  where story_id = inv.story_id and user_id = caller;

  if existing is null then
    insert into public.story_members (story_id, user_id, role, relationship)
    values (inv.story_id, caller, inv.role, inv.relationship);
  elsif public.story_role_rank(inv.role) > public.story_role_rank(existing) then
    update public.story_members
    set role = inv.role, relationship = coalesce(relationship, inv.relationship)
    where story_id = inv.story_id and user_id = caller;
  end if;

  update public.invitations
  set accepted_at = now(), accepted_by = caller
  where id = inv.id;

  select slug into story_slug from public.stories where id = inv.story_id;
  return story_slug;
end;
$$;

-- ----------------------------------------------------------------- row level security

alter table public.profiles enable row level security;
alter table public.stories enable row level security;
alter table public.story_members enable row level security;
alter table public.chapters enable row level security;
alter table public.moments enable row level security;
alter table public.media enable row level security;
alter table public.invitations enable row level security;
alter table public.moment_reviews enable row level security;

-- profiles
create policy "Profiles are visible to yourself and people you share a story with"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_story_with(id));

create policy "You can update your own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- stories
create policy "Members can read their stories"
  on public.stories for select to authenticated
  using (public.has_story_role(id, 'viewer'));

create policy "Signed-in people can start a story"
  on public.stories for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy "Keepers and editors can edit a story"
  on public.stories for update to authenticated
  using (public.has_story_role(id, 'editor'))
  with check (public.has_story_role(id, 'editor'));

create policy "Only the keeper can delete a story"
  on public.stories for delete to authenticated
  using (public.has_story_role(id, 'owner'));

-- story_members (rows are created by triggers and accept_invitation)
create policy "Members can see who else belongs to the story"
  on public.story_members for select to authenticated
  using (public.has_story_role(story_id, 'viewer'));

create policy "Keepers manage members; editors manage contributors and readers"
  on public.story_members for update to authenticated
  using (
    role <> 'owner' and (
      public.story_role_of(story_id) = 'owner'
      or (public.has_story_role(story_id, 'editor') and role in ('contributor', 'viewer'))
    )
  )
  with check (
    role <> 'owner' and (
      public.story_role_of(story_id) = 'owner'
      or (public.has_story_role(story_id, 'editor') and role in ('contributor', 'viewer'))
    )
  );

create policy "Members can leave, and keepers or editors can remove members"
  on public.story_members for delete to authenticated
  using (
    role <> 'owner' and (
      user_id = (select auth.uid())
      or public.story_role_of(story_id) = 'owner'
      or (public.has_story_role(story_id, 'editor') and role in ('contributor', 'viewer'))
    )
  );

-- chapters
create policy "Members can read chapters"
  on public.chapters for select to authenticated
  using (public.has_story_role(story_id, 'viewer'));

create policy "Keepers and editors can add chapters"
  on public.chapters for insert to authenticated
  with check (public.has_story_role(story_id, 'editor'));

create policy "Keepers and editors can edit chapters"
  on public.chapters for update to authenticated
  using (public.has_story_role(story_id, 'editor'))
  with check (public.has_story_role(story_id, 'editor'));

create policy "Keepers and editors can remove chapters"
  on public.chapters for delete to authenticated
  using (public.has_story_role(story_id, 'editor'));

-- moments
create policy "Members read published moments; contributors read their own; editors read all"
  on public.moments for select to authenticated
  using (
    (status = 'published' and public.has_story_role(story_id, 'viewer'))
    or (contributor_id = (select auth.uid()) and public.has_story_role(story_id, 'contributor'))
    or public.has_story_role(story_id, 'editor')
  );

create policy "Contributors can add moments"
  on public.moments for insert to authenticated
  with check (
    public.has_story_role(story_id, 'contributor')
    and contributor_id = (select auth.uid())
  );

create policy "Contributors edit their unpublished moments; editors edit any"
  on public.moments for update to authenticated
  using (
    public.has_story_role(story_id, 'editor')
    or (
      contributor_id = (select auth.uid())
      and status in ('pending', 'changes_requested')
      and public.has_story_role(story_id, 'contributor')
    )
  )
  with check (
    public.has_story_role(story_id, 'editor')
    or (contributor_id = (select auth.uid()) and status = 'pending')
  );

create policy "Contributors remove their unpublished moments; editors remove any"
  on public.moments for delete to authenticated
  using (
    public.has_story_role(story_id, 'editor')
    or (
      contributor_id = (select auth.uid())
      and status <> 'published'
      and public.has_story_role(story_id, 'contributor')
    )
  );

-- media
create policy "Media follows the visibility of its moment"
  on public.media for select to authenticated
  using (
    public.has_story_role(story_id, 'editor')
    or (uploaded_by = (select auth.uid()) and public.has_story_role(story_id, 'contributor'))
    or (
      public.has_story_role(story_id, 'viewer')
      and (
        purpose = 'cover'
        or exists (
          select 1 from public.stories s where s.id = media.story_id and s.cover_media_id = media.id
        )
        or exists (
          select 1 from public.moments m where m.id = media.moment_id and m.status = 'published'
        )
      )
    )
  );

create policy "Contributors can add media"
  on public.media for insert to authenticated
  with check (
    public.has_story_role(story_id, 'contributor')
    and uploaded_by = (select auth.uid())
  );

create policy "Uploaders and editors can update media"
  on public.media for update to authenticated
  using (
    public.has_story_role(story_id, 'editor')
    or (uploaded_by = (select auth.uid()) and public.has_story_role(story_id, 'contributor'))
  )
  with check (
    public.has_story_role(story_id, 'editor')
    or (uploaded_by = (select auth.uid()) and public.has_story_role(story_id, 'contributor'))
  );

create policy "Uploaders and editors can remove media"
  on public.media for delete to authenticated
  using (
    public.has_story_role(story_id, 'editor')
    or (uploaded_by = (select auth.uid()) and public.has_story_role(story_id, 'contributor'))
  );

-- invitations
create policy "Keepers and editors can see invitations"
  on public.invitations for select to authenticated
  using (public.has_story_role(story_id, 'editor'));

create policy "Keepers invite anyone; editors invite contributors and readers"
  on public.invitations for insert to authenticated
  with check (
    invited_by = (select auth.uid())
    and (
      public.story_role_of(story_id) = 'owner'
      or (public.has_story_role(story_id, 'editor') and role in ('contributor', 'viewer'))
    )
  );

create policy "Keepers and editors can withdraw invitations"
  on public.invitations for update to authenticated
  using (public.has_story_role(story_id, 'editor'))
  with check (public.has_story_role(story_id, 'editor'));

-- moment_reviews (written by trigger only)
create policy "Editors and the contributor can read a moment's review history"
  on public.moment_reviews for select to authenticated
  using (
    exists (
      select 1 from public.moments m
      where m.id = moment_reviews.moment_id
        and (public.has_story_role(m.story_id, 'editor') or m.contributor_id = (select auth.uid()))
    )
  );

-- ----------------------------------------------------------------- grants

revoke all on function public.accept_invitation(text) from public, anon;
grant execute on function public.accept_invitation(text) to authenticated;
revoke all on function public.invitation_preview(text) from public;
grant execute on function public.invitation_preview(text) to anon, authenticated;
