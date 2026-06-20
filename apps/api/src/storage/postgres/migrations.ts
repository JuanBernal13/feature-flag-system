import type pg from "pg";

export async function runMigrations(pool: pg.Pool): Promise<void> {
  await pool.query(`
    create table if not exists feature_flags (
      id uuid primary key,
      project_key text not null,
      environment text not null,
      key text not null,
      name text not null,
      description text,
      enabled boolean not null default false,
      rollout_percentage numeric not null default 0,
      rules jsonb not null default '[]'::jsonb,
      tags text[] not null default '{}',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique(project_key, environment, key)
    );

    create table if not exists segments (
      id uuid primary key,
      project_key text not null,
      environment text not null,
      key text not null,
      name text not null,
      included_user_ids text[] not null default '{}',
      excluded_user_ids text[] not null default '{}',
      rules jsonb not null default '[]'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique(project_key, environment, key)
    );

    create table if not exists audit_log (
      id uuid primary key,
      project_key text not null,
      environment text not null,
      action text not null,
      actor text not null,
      resource_type text not null,
      resource_id text not null,
      before_value jsonb,
      after_value jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists flag_evaluations (
      id uuid primary key,
      project_key text not null,
      environment text not null,
      flag_key text not null,
      user_id text not null,
      enabled boolean not null,
      reason text not null,
      created_at timestamptz not null default now()
    );

    create index if not exists idx_feature_flags_lookup
      on feature_flags(project_key, environment, key);

    create index if not exists idx_flag_evaluations_metrics
      on flag_evaluations(project_key, environment, flag_key, created_at desc);

    create index if not exists idx_audit_lookup
      on audit_log(project_key, environment, created_at desc);
  `);
}
