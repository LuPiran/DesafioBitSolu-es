-- Portal no Supabase. A API usa a chave anônima com o JWT do usuário logado.
-- A service role não atende pedidos da aplicação: ela só cria os usuários iniciais.
-- RLS é a barreira contra IDOR. O papel fica em profiles e o usuário não consegue alterá-lo.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  username text not null unique check (username ~ '^[a-z0-9.]{3,32}$'),
  email text not null,
  role text not null default 'padrao' check (role in ('padrao', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text;

update public.profiles
set email = lower(username) || '@portal.interno'
where email is null;

update public.profiles
set role = 'padrao'
where role is null or role not in ('padrao', 'admin');

alter table public.profiles alter column email set not null;
alter table public.profiles alter column role set default 'padrao';
alter table public.profiles alter column role set not null;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('padrao', 'admin'));

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_id_fkey
      foreign key (id) references auth.users (id) on delete cascade;
  end if;
end $$;

create unique index if not exists profiles_email_unique on public.profiles (lower(email));

create sequence if not exists public.solicitation_code_seq as integer;

create table if not exists public.solicitations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^SOL-[0-9]{4}$'),
  title text not null check (char_length(title) between 5 and 120),
  description text not null check (char_length(description) between 15 and 2000),
  category text not null check (category in ('TI', 'RH', 'Compras', 'Financeiro', 'Infraestrutura')),
  requester_id uuid not null references public.profiles (id),
  status text not null default 'ABERTO' check (status in ('ABERTO', 'EM_ATENDIMENTO', 'CONCLUIDO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists solicitations_requester_idx on public.solicitations (requester_id);
create index if not exists solicitations_created_at_idx on public.solicitations (created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_role text;
  next_username text;
begin
  next_role := case when new.raw_app_meta_data->>'role' = 'admin' then 'admin' else 'padrao' end;
  next_username := lower(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  insert into public.profiles (id, name, username, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    next_username,
    lower(new.email),
    next_role
  )
  on conflict (id) do update
    set role = excluded.role,
        name = excluded.name,
        email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.prepare_solicitation_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.requester_id is distinct from auth.uid() then
    raise exception 'idor';
  end if;

  n := nextval('public.solicitation_code_seq');
  if n > 9999 then
    raise exception 'limite de codigos';
  end if;

  new.code := 'SOL-' || lpad(n::text, 4, '0');
  new.status := 'ABERTO';
  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.guard_solicitation_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.code is distinct from old.code
     or new.requester_id is distinct from old.requester_id
     or new.created_at is distinct from old.created_at then
    raise exception 'alteracao nao permitida';
  end if;

  if new.status is distinct from old.status then
    if not (
      (old.status = 'ABERTO' and new.status = 'EM_ATENDIMENTO')
      or (old.status = 'EM_ATENDIMENTO' and new.status = 'CONCLUIDO')
    ) then
      raise exception 'transicao de status nao permitida';
    end if;
    if new.title is distinct from old.title
       or new.description is distinct from old.description
       or new.category is distinct from old.category then
      raise exception 'nao altere o conteudo junto com o status';
    end if;
  elsif old.status <> 'ABERTO' then
    raise exception 'edicao nao permitida';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists solicitations_prepare_insert on public.solicitations;
create trigger solicitations_prepare_insert
  before insert on public.solicitations
  for each row execute function public.prepare_solicitation_insert();

drop trigger if exists solicitations_guard_update on public.solicitations;
create trigger solicitations_guard_update
  before update on public.solicitations
  for each row execute function public.guard_solicitation_update();

create or replace function public.protect_profile_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null then
    raise exception 'perfil protegido';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_mutation on public.profiles;
create trigger profiles_protect_mutation
  before insert or update or delete on public.profiles
  for each row execute function public.protect_profile_mutation();

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.solicitations enable row level security;
alter table public.solicitations force row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists solicitations_select on public.solicitations;
create policy solicitations_select on public.solicitations
  for select to authenticated
  using (requester_id = auth.uid() or public.is_admin());

drop policy if exists solicitations_insert on public.solicitations;
create policy solicitations_insert on public.solicitations
  for insert to authenticated
  with check (requester_id = auth.uid());

drop policy if exists solicitations_update on public.solicitations;
create policy solicitations_update on public.solicitations
  for update to authenticated
  using (requester_id = auth.uid() or public.is_admin())
  with check (requester_id = auth.uid() or public.is_admin());

drop policy if exists solicitations_delete on public.solicitations;
create policy solicitations_delete on public.solicitations
  for delete to authenticated
  using (
    status = 'ABERTO'
    and (requester_id = auth.uid() or public.is_admin())
  );

revoke all on table public.profiles from anon, public;
revoke all on table public.solicitations from anon, public;
revoke all on sequence public.solicitation_code_seq from anon, authenticated, public;
grant select on table public.profiles to authenticated;
grant select, insert, update, delete on table public.solicitations to authenticated;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.prepare_solicitation_insert() from public, anon;
revoke all on function public.guard_solicitation_update() from public, anon;
revoke all on function public.protect_profile_mutation() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.prepare_solicitation_insert() to authenticated;
grant execute on function public.guard_solicitation_update() to authenticated;
grant execute on function public.protect_profile_mutation() to authenticated;
