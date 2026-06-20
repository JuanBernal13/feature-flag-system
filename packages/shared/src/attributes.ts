import { type EvaluationContext } from "./types";

export function readAttributeValues(attribute: string, context: EvaluationContext): string[] {
  const normalizedAttribute = attribute.trim();
  const rawValue =
    normalizedAttribute === "userId"
      ? context.userId
      : normalizedAttribute === "country"
        ? context.country
        : normalizedAttribute === "email"
          ? context.email
          : normalizedAttribute === "group" || normalizedAttribute === "groups"
            ? context.groups
            : normalizedAttribute === "environment"
              ? context.environment
              : context.attributes?.[normalizedAttribute];

  if (Array.isArray(rawValue)) {
    return rawValue.map((value) => normalizeValue(attribute, value)).filter(Boolean);
  }

  if (rawValue === undefined || rawValue === null) {
    return [];
  }

  return [normalizeValue(attribute, rawValue)];
}

export function normalizeExpectedValues(attribute: string, values: string[]): string[] {
  return values.map((value) => normalizeValue(attribute, value));
}

function normalizeValue(attribute: string, value: string | number | boolean): string {
  const text = String(value).trim();

  if (attribute === "country") {
    return text.toUpperCase();
  }

  if (attribute === "email") {
    return text.toLowerCase();
  }

  return text;
}
