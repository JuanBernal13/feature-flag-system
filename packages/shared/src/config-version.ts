import { fnv1a } from "./hashing";
import { type FeatureFlag, type Segment } from "./types";

export function stableConfigVersion(flags: FeatureFlag[], segments: Segment[]): string {
  const source = JSON.stringify({
    flags: flags.map(({ id, key, updatedAt }) => ({ id, key, updatedAt })),
    segments: segments.map(({ id, key, updatedAt }) => ({ id, key, updatedAt }))
  });

  return fnv1a(source).toString(16);
}
