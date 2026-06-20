import type pg from "pg";
import { createSeedFlags, createSeedSegments } from "../../sample-data";

export async function seedPostgresIfEmpty(pool: pg.Pool): Promise<void> {
  const result = await pool.query("select count(*)::int as count from feature_flags");

  if (Number(result.rows[0]?.count ?? 0) > 0) {
    return;
  }

  for (const flag of createSeedFlags()) {
    await pool.query(
      `
        insert into feature_flags (
          id, project_key, environment, key, name, description,
          enabled, rollout_percentage, rules, tags, created_at, updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12)
      `,
      [
        flag.id,
        flag.projectKey,
        flag.environment,
        flag.key,
        flag.name,
        flag.description ?? null,
        flag.enabled,
        flag.rolloutPercentage,
        JSON.stringify(flag.rules),
        flag.tags,
        flag.createdAt,
        flag.updatedAt
      ]
    );
  }

  for (const segment of createSeedSegments()) {
    await pool.query(
      `
        insert into segments (
          id, project_key, environment, key, name, included_user_ids,
          excluded_user_ids, rules, created_at, updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
      `,
      [
        segment.id,
        segment.projectKey,
        segment.environment,
        segment.key,
        segment.name,
        segment.includedUserIds,
        segment.excludedUserIds,
        JSON.stringify(segment.rules),
        segment.createdAt,
        segment.updatedAt
      ]
    );
  }
}
