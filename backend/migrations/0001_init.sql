create table project_images (
  id         uuid primary key default gen_random_uuid(),
  mime       text not null check (mime in ('image/png', 'image/jpeg', 'image/webp', 'image/gif')),
  size       integer not null check (size > 0 and size <= 4194304),
  bytes      bytea not null,
  created_at timestamptz not null default now()
);

create table projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  title       text not null check (length(title) between 1 and 120),
  summary     text not null default '' check (length(summary) <= 400),
  description text not null default '' check (length(description) <= 20000),
  category    text not null default 'Projects' check (length(category) between 1 and 40),
  period      text not null default '' check (length(period) <= 60),
  tags        text[] not null default '{}',
  highlights  text[] not null default '{}',
  repo_url    text check (repo_url ~ '^https?://'),
  demo_url    text check (demo_url ~ '^https?://'),
  image_id    uuid references project_images (id) on delete set null,
  color       text not null default '#2dd4bf' check (color ~ '^#[0-9a-f]{6}$'),
  featured    boolean not null default false,
  published   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index projects_listing on projects (published, category, sort_order);

-- One row: the name and links shown in the centre of the galaxy.
create table profile (
  id            integer primary key check (id = 1),
  name          text not null check (length(name) between 1 and 80),
  headline      text not null check (length(headline) <= 160),
  bio           text not null check (length(bio) <= 2000),
  github_url    text check (github_url ~ '^https?://'),
  linkedin_url  text check (linkedin_url ~ '^https?://'),
  contact_email text check (length(contact_email) <= 200),
  updated_at    timestamptz not null default now()
);
