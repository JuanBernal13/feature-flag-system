export function percentageBucket(flagKey: string, salt: string, userId: string): number {
  const hash = fnv1a(`${flagKey}:${salt}:${userId}`);
  return Number(((hash / 0xffffffff) * 100).toFixed(3));
}

export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}
