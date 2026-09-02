type JsonRecord = Record<string, unknown>;

type Criterion = {
  criterion_id: string;
  value_type: string;
  allowed_operators: string[];
  scopes: string[];
};

type Alias = {
  alias: string;
  criterion_id: string;
  fixed_when?: 'source_true';
  fixed_operator?: string;
  fixed_value?: unknown;
  transform?: string;
};

export type MatchingFactContract = {
  taxonomyVersion: string;
  factSchema: {
    requiredFields: string[];
    effects: string[];
    evidenceStatuses: string[];
    unknownFields: 'reject';
    scalarSchemas: Record<string, JsonRecord>;
    numericConstraints: Record<string, { minimum: number; maximum: number; unit: string }>;
    enumDomains: Record<string, string[]>;
    statusRules: Record<
      string,
      {
        value: 'typed_non_null' | 'null';
        sourceFields: 'required_non_null' | 'nullable_as_group';
        reviewerFields: 'required_non_null' | 'all_null' | 'nullable_as_group';
        matchingAvailable: boolean;
      }
    >;
    statusFieldGroups: { sourceFields: string[]; reviewerFields: string[] };
  };
  criteria: Criterion[];
  aliasPolicy: {
    transforms: Record<string, Record<string, { operator: string; value: unknown }>>;
  };
  aliases: Alias[];
};

const identifierPattern = /^[a-z0-9][a-z0-9._:-]{0,127}$/;
const fullDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFullDate(value: unknown): value is string {
  if (typeof value !== 'string' || !fullDatePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isIsoTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) &&
    !Number.isNaN(new Date(value).valueOf())
  );
}

function validateScalar(
  contract: MatchingFactContract,
  criterion: Criterion,
  value: unknown,
): string[] {
  const errors: string[] = [];
  const enumDomain = contract.factSchema.enumDomains[criterion.criterion_id];
  switch (criterion.value_type) {
    case 'boolean':
      if (typeof value !== 'boolean') errors.push('value must be boolean');
      break;
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) errors.push('value must be finite number');
      break;
    case 'integer':
      if (!Number.isInteger(value)) errors.push('value must be integer');
      break;
    case 'string':
      if (typeof value !== 'string' || value.length < 1 || value.length > 500) {
        errors.push('value must be a nonempty string of at most 500 characters');
      }
      break;
    case 'date':
      if (!isFullDate(value)) errors.push('value must be a real YYYY-MM-DD date');
      break;
    case 'enum':
      if (!enumDomain || typeof value !== 'string' || !enumDomain.includes(value)) {
        errors.push('value must be a member of the criterion enum domain');
      }
      break;
    case 'identifier':
      if (typeof value !== 'string' || !identifierPattern.test(value)) {
        errors.push('value must be a normalized identifier');
      }
      break;
    default:
      errors.push(`unsupported scalar value type ${criterion.value_type}`);
  }
  const numeric = contract.factSchema.numericConstraints[criterion.criterion_id];
  if (
    numeric &&
    typeof value === 'number' &&
    (value < numeric.minimum || value > numeric.maximum)
  ) {
    errors.push(`value must be within ${numeric.minimum}..${numeric.maximum} ${numeric.unit}`);
  }
  return errors;
}

function validateCriterionValue(
  contract: MatchingFactContract,
  criterion: Criterion,
  operator: string,
  value: unknown,
): string[] {
  if (operator === 'exists') {
    return typeof value === 'boolean' ? [] : ['exists value must be boolean'];
  }
  if (operator === 'between') {
    if (!isRecord(value)) return ['between value must be an object'];
    const keys = Object.keys(value).sort();
    const expected = ['lower', 'lower_inclusive', 'upper', 'upper_inclusive'];
    if (JSON.stringify(keys) !== JSON.stringify(expected)) {
      return ['between value has invalid fields'];
    }
    const errors = [
      ...validateScalar(contract, criterion, value.lower),
      ...validateScalar(contract, criterion, value.upper),
    ];
    if (typeof value.lower_inclusive !== 'boolean' || typeof value.upper_inclusive !== 'boolean') {
      errors.push('between inclusive flags must be boolean');
    }
    if (
      (typeof value.lower === 'number' && typeof value.upper === 'number' && value.lower > value.upper) ||
      (typeof value.lower === 'string' && typeof value.upper === 'string' && value.lower > value.upper)
    ) {
      errors.push('between lower must not exceed upper');
    }
    return errors;
  }
  if (criterion.value_type === 'enum_set' || criterion.value_type === 'identifier_set') {
    if (!Array.isArray(value) || value.length < 1 || value.length > 64) {
      return ['set value must contain 1..64 items'];
    }
    if (new Set(value.map((item) => JSON.stringify(item))).size !== value.length) {
      return ['set value items must be unique'];
    }
    if (criterion.value_type === 'enum_set') {
      const domain = contract.factSchema.enumDomains[criterion.criterion_id];
      if (!domain || value.some((item) => typeof item !== 'string' || !domain.includes(item))) {
        return ['set value contains a member outside the criterion enum domain'];
      }
    } else if (value.some((item) => typeof item !== 'string' || !identifierPattern.test(item))) {
      return ['set value contains an invalid identifier'];
    }
    return [];
  }
  return validateScalar(contract, criterion, value);
}

function validateFieldGroup(
  fact: JsonRecord,
  fields: string[],
  rule: 'required_non_null' | 'all_null' | 'nullable_as_group',
  label: string,
): string[] {
  const present = fields.map((field) => fact[field] !== null && fact[field] !== '');
  if (rule === 'required_non_null' && present.some((item) => !item)) {
    return [`${label} fields must all be non-null`];
  }
  if (rule === 'all_null' && present.some(Boolean)) return [`${label} fields must all be null`];
  if (rule === 'nullable_as_group' && present.some(Boolean) && present.some((item) => !item)) {
    return [`${label} fields must be all null or all non-null`];
  }
  return [];
}

export function validateMatchingFact(
  contract: MatchingFactContract,
  value: unknown,
): string[] {
  if (!isRecord(value)) return ['fact must be an object'];
  const errors: string[] = [];
  const allowedFields = new Set(contract.factSchema.requiredFields);
  for (const field of contract.factSchema.requiredFields) {
    if (!(field in value)) errors.push(`missing required field ${field}`);
  }
  if (contract.factSchema.unknownFields === 'reject') {
    for (const field of Object.keys(value)) {
      if (!allowedFields.has(field)) errors.push(`unknown field ${field}`);
    }
  }
  if (value.taxonomy_version !== contract.taxonomyVersion) errors.push('taxonomy version mismatch');
  if (typeof value.award_id !== 'string' || !identifierPattern.test(value.award_id)) {
    errors.push('award_id must be a normalized identifier');
  }
  if (value.cycle_id !== null && (typeof value.cycle_id !== 'string' || !identifierPattern.test(value.cycle_id))) {
    errors.push('cycle_id must be null or a normalized identifier');
  }
  const criterion = contract.criteria.find((item) => item.criterion_id === value.criterion_id);
  if (!criterion) return [...errors, 'unknown criterion_id'];
  if (criterion.scopes.length === 1 && criterion.scopes[0] === 'cycle' && value.cycle_id === null) {
    errors.push('cycle_id is required for a cycle-only criterion');
  }
  if (!contract.factSchema.effects.includes(String(value.effect))) errors.push('invalid effect');
  if (!criterion.allowed_operators.includes(String(value.operator))) errors.push('invalid operator for criterion');
  const status = String(value.evidence_status);
  const statusRule = contract.factSchema.statusRules[status];
  if (!statusRule || !contract.factSchema.evidenceStatuses.includes(status)) {
    return [...errors, 'invalid evidence_status'];
  }
  const valueIsNull = value.value === null;
  if (statusRule.value === 'null' && !valueIsNull) errors.push(`${status} value must be null`);
  if (statusRule.value === 'typed_non_null' && valueIsNull) errors.push(`${status} value must be non-null`);
  if (!valueIsNull) {
    errors.push(...validateCriterionValue(contract, criterion, String(value.operator), value.value));
  }
  errors.push(
    ...validateFieldGroup(
      value,
      contract.factSchema.statusFieldGroups.sourceFields,
      statusRule.sourceFields,
      'source',
    ),
    ...validateFieldGroup(
      value,
      contract.factSchema.statusFieldGroups.reviewerFields,
      statusRule.reviewerFields,
      'reviewer',
    ),
  );
  if (value.source_url !== null) {
    try {
      const sourceUrl = new URL(String(value.source_url));
      if (
        typeof value.source_url !== 'string' ||
        value.source_url.length > 2048 ||
        !['https:', 'http:'].includes(sourceUrl.protocol)
      ) {
        errors.push('source_url must be a bounded HTTP(S) URL');
      }
    } catch {
      errors.push('source_url must be a bounded HTTP(S) URL');
    }
  }
  if (
    value.source_revision !== null &&
    (typeof value.source_revision !== 'string' ||
      value.source_revision.length < 1 ||
      value.source_revision.length > 256)
  ) {
    errors.push('source_revision must be a nonempty string of at most 256 characters');
  }
  if (
    value.evidence_excerpt !== null &&
    (typeof value.evidence_excerpt !== 'string' ||
      value.evidence_excerpt.length < 1 ||
      value.evidence_excerpt.length > 500)
  ) {
    errors.push('evidence_excerpt must be a nonempty string of at most 500 characters');
  }
  if (
    value.reviewer_id !== null &&
    (typeof value.reviewer_id !== 'string' || !identifierPattern.test(value.reviewer_id))
  ) {
    errors.push('reviewer_id must be null or a normalized identifier');
  }
  if (
    value.review_rationale !== null &&
    (typeof value.review_rationale !== 'string' ||
      value.review_rationale.length < 1 ||
      value.review_rationale.length > 500)
  ) {
    errors.push('review_rationale must be a nonempty string of at most 500 characters');
  }
  if (value.observed_at !== null && !isIsoTimestamp(value.observed_at)) errors.push('observed_at must be an ISO UTC timestamp');
  if (value.reviewed_at !== null && !isIsoTimestamp(value.reviewed_at)) errors.push('reviewed_at must be an ISO UTC timestamp');
  return errors;
}

export function expandAlias(
  contract: MatchingFactContract,
  aliasName: string,
  sourceValue: unknown,
): { criterion_id: string; operator?: string; value: unknown } | null {
  const alias = contract.aliases.find((item) => item.alias === aliasName);
  if (!alias) return null;
  if (alias.transform) {
    const transformed = contract.aliasPolicy.transforms[alias.transform]?.[String(sourceValue)];
    return transformed
      ? {
          criterion_id: alias.criterion_id,
          operator: transformed.operator,
          value: transformed.value,
        }
      : null;
  }
  if ('fixed_operator' in alias && 'fixed_value' in alias) {
    if (alias.fixed_when === 'source_true' && sourceValue !== true) return null;
    return {
      criterion_id: alias.criterion_id,
      operator: alias.fixed_operator,
      value: alias.fixed_value,
    };
  }
  return { criterion_id: alias.criterion_id, value: sourceValue };
}
