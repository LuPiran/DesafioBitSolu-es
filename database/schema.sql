-- Modelo anterior, com usuários e senha dentro da própria API.
-- O banco usado na entrega é o Supabase. O script vigente é database/supabase.sql.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  username text not null unique check (username ~ '^[a-z0-9.]{3,32}$'),
  email text,
  password_hash text not null check (char_length(password_hash) between 50 and 200),
  created_at timestamptz not null default now()
);

alter table users add column if not exists email text;

update users
set email = lower(username) || '@portal.interno'
where email is null;

alter table users drop constraint if exists users_email_format;
alter table users add constraint users_email_format
  check (email ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$');

create unique index if not exists users_email_unique on users (lower(email));

alter table users alter column email set not null;

create table if not exists categories (
  id smallserial primary key,
  name text not null unique check (name in ('TI', 'RH', 'Compras', 'Financeiro', 'Infraestrutura'))
);

insert into categories (name)
values ('TI'), ('RH'), ('Compras'), ('Financeiro'), ('Infraestrutura')
on conflict (name) do nothing;

create sequence if not exists solicitation_code_seq;

create table if not exists solicitations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^SOL-[0-9]{4}$'),
  title text not null check (char_length(title) between 5 and 120),
  description text not null check (char_length(description) between 15 and 2000),
  category_id smallint not null references categories (id),
  requester_id uuid not null references users (id),
  status text not null default 'ABERTO' check (status in ('ABERTO', 'EM_ATENDIMENTO', 'CONCLUIDO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists solicitations_created_at_idx on solicitations (created_at desc);
create index if not exists solicitations_requester_idx on solicitations (requester_id);
create index if not exists solicitations_status_idx on solicitations (status);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  family_id uuid not null,
  token_hash text not null unique,
  previous_hash text,
  rotated_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_family_idx on sessions (family_id);
create index if not exists sessions_previous_hash_idx on sessions (previous_hash);

create or replace function next_solicitation_code()
returns text
language plpgsql
as $$
declare
  n integer;
begin
  n := nextval('solicitation_code_seq');
  if n > 9999 then
    raise exception 'limite de codigos';
  end if;
  return 'SOL-' || lpad(n::text, 4, '0');
end;
$$;

create or replace function guard_solicitation_update()
returns trigger
language plpgsql
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
       or new.category_id is distinct from old.category_id then
      raise exception 'nao altere o conteudo junto com o status';
    end if;
  elsif old.status <> 'ABERTO'
     or current_setting('portal.actor', true) is distinct from old.requester_id::text then
    raise exception 'edicao nao permitida';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists solicitations_guard_update on solicitations;
create trigger solicitations_guard_update
  before update on solicitations
  for each row execute function guard_solicitation_update();
