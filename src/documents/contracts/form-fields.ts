import { containsDangerousPayload, isSafeUrl, stripHtml } from '../security/document-security';

export const FORM_FIELD_TYPES = [
  'name',
  'email',
  'phone',
  'message',
  'subject',
  'company',
  'website',
  'text',
  'textarea',
  'select',
  'checkbox',
  'radio',
  'number',
  'date',
  'custom',
] as const;

export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

export const CONTACT_FORM_VARIANTS = [
  'simple',
  'split',
  'image',
  'contact-info',
  'centered',
  'business',
  'minimal',
  'full-width',
] as const;

export type ContactFormVariant = (typeof CONTACT_FORM_VARIANTS)[number];

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldDefinition {
  id: string;
  type: FormFieldType;
  name?: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: FormFieldOption[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ContactSubmissionConfig {
  action: 'leads';
  source: string;
}

export const DEFAULT_CONTACT_FIELD_IDS = ['name', 'email', 'phone', 'message'] as const;

export const FORM_FIELD_CATALOG: Record<string, FormFieldDefinition> = {
  name: {
    id: 'name',
    type: 'name',
    name: 'name',
    label: 'Full name',
    placeholder: 'Jane Doe',
    required: true,
    validation: { maxLength: 100 },
  },
  email: {
    id: 'email',
    type: 'email',
    name: 'email',
    label: 'Email',
    placeholder: 'jane@studio.com',
    required: true,
    validation: { maxLength: 200 },
  },
  phone: {
    id: 'phone',
    type: 'phone',
    name: 'phone',
    label: 'Phone',
    placeholder: '+1 555 0100',
    required: false,
    validation: { maxLength: 30 },
  },
  message: {
    id: 'message',
    type: 'textarea',
    name: 'message',
    label: 'Message',
    placeholder: 'Tell us about the project',
    required: true,
    validation: { maxLength: 3000 },
  },
  subject: {
    id: 'subject',
    type: 'subject',
    name: 'subject',
    label: 'Subject',
    placeholder: 'Website launch',
    required: false,
    validation: { maxLength: 200 },
  },
  company: {
    id: 'company',
    type: 'company',
    name: 'company',
    label: 'Company',
    placeholder: 'Studio name',
    required: false,
    validation: { maxLength: 200 },
  },
  website: {
    id: 'website',
    type: 'website',
    name: 'website',
    label: 'Website',
    placeholder: 'https://',
    required: false,
    validation: { maxLength: 500 },
  },
  select: {
    id: 'select',
    type: 'select',
    name: 'topic',
    label: 'How can we help?',
    required: false,
    options: [
      { value: 'new-website', label: 'New website' },
      { value: 'redesign', label: 'Redesign' },
      { value: 'support', label: 'Support' },
    ],
  },
  checkbox: {
    id: 'checkbox',
    type: 'checkbox',
    name: 'consent',
    label: 'I agree to be contacted about this inquiry',
    required: true,
  },
  radio: {
    id: 'radio',
    type: 'radio',
    name: 'budget',
    label: 'Approximate budget',
    required: false,
    options: [
      { value: 'starter', label: 'Starter' },
      { value: 'growth', label: 'Growth' },
      { value: 'custom', label: 'Custom' },
    ],
  },
  textarea: {
    id: 'textarea',
    type: 'textarea',
    name: 'details',
    label: 'Details',
    placeholder: 'Anything else we should know?',
    required: false,
    validation: { maxLength: 3000 },
  },
  number: {
    id: 'number',
    type: 'number',
    name: 'quantity',
    label: 'Quantity',
    placeholder: '1',
    required: false,
    validation: { min: 0, max: 1000000 },
  },
  date: {
    id: 'date',
    type: 'date',
    name: 'preferredDate',
    label: 'Preferred date',
    required: false,
  },
};

export function isFormFieldType(value: string): value is FormFieldType {
  return (FORM_FIELD_TYPES as readonly string[]).includes(value);
}

export function isContactFormVariant(value: string): value is ContactFormVariant {
  return (CONTACT_FORM_VARIANTS as readonly string[]).includes(value);
}

export function listFormFieldCatalog() {
  return Object.values(FORM_FIELD_CATALOG).map((field) => ({
    id: field.id,
    type: field.type,
    name: field.name || field.id,
    label: field.label,
    required: Boolean(field.required),
    options: field.options || [],
  }));
}

function cloneField(field: FormFieldDefinition): FormFieldDefinition {
  return JSON.parse(JSON.stringify(field)) as FormFieldDefinition;
}

function sanitizeFieldText(value: unknown, fallback: string, max = 200): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = stripHtml(value).trim();
  if (!cleaned || containsDangerousPayload(cleaned)) return fallback;
  return cleaned.slice(0, max);
}

export function fieldFromCatalog(id: string): FormFieldDefinition {
  const found = FORM_FIELD_CATALOG[id];
  if (found) return cloneField(found);
  return {
    id: id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50) || `custom_${Date.now()}`,
    type: 'custom',
    name: id,
    label: id,
    required: false,
    validation: { maxLength: 500 },
  };
}

export function resolveFormFields(ids?: string[]): FormFieldDefinition[] {
  const selected = ids?.length ? ids : [...DEFAULT_CONTACT_FIELD_IDS];
  return selected.map((id) => fieldFromCatalog(id));
}

export function normalizeFormFields(raw: unknown): FormFieldDefinition[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return resolveFormFields();
  }

  const seen = new Set<string>();
  const fields: FormFieldDefinition[] = [];

  for (const item of raw) {
    if (typeof item === 'string') {
      const field = fieldFromCatalog(item);
      if (seen.has(field.id)) continue;
      seen.add(field.id);
      fields.push(field);
      continue;
    }

    if (!item || typeof item !== 'object') {
      throw new Error('Form fields must be strings or field objects');
    }

    const record = item as Record<string, unknown>;
    const type = typeof record.type === 'string' && isFormFieldType(record.type) ? record.type : 'custom';
    const id = sanitizeFieldText(record.id, `field_${fields.length + 1}`, 50).replace(
      /[^a-zA-Z0-9_-]/g,
      '_',
    );
    if (!id || seen.has(id)) {
      throw new Error('Form fields must have unique, safe ids');
    }
    seen.add(id);

    const options = Array.isArray(record.options)
      ? record.options
          .filter((option) => option && typeof option === 'object')
          .map((option) => {
            const opt = option as Record<string, unknown>;
            return {
              value: sanitizeFieldText(opt.value, '', 80),
              label: sanitizeFieldText(opt.label, String(opt.value || ''), 80),
            };
          })
          .filter((option) => option.value)
      : undefined;

    fields.push({
      id,
      type,
      name: sanitizeFieldText(record.name, id, 80),
      label: sanitizeFieldText(record.label, id, 120),
      placeholder:
        typeof record.placeholder === 'string'
          ? sanitizeFieldText(record.placeholder, '', 200)
          : undefined,
      required: Boolean(record.required),
      options,
      validation:
        record.validation && typeof record.validation === 'object'
          ? {
              minLength:
                typeof (record.validation as { minLength?: unknown }).minLength === 'number'
                  ? (record.validation as { minLength: number }).minLength
                  : undefined,
              maxLength:
                typeof (record.validation as { maxLength?: unknown }).maxLength === 'number'
                  ? (record.validation as { maxLength: number }).maxLength
                  : undefined,
              min:
                typeof (record.validation as { min?: unknown }).min === 'number'
                  ? (record.validation as { min: number }).min
                  : undefined,
              max:
                typeof (record.validation as { max?: unknown }).max === 'number'
                  ? (record.validation as { max: number }).max
                  : undefined,
              pattern:
                typeof (record.validation as { pattern?: unknown }).pattern === 'string'
                  ? sanitizeFieldText((record.validation as { pattern: string }).pattern, '', 120)
                  : undefined,
            }
          : undefined,
    });
  }

  return fields;
}

export function defaultContactFormProps(variant: ContactFormVariant = 'simple') {
  return {
    action: 'leads' as const,
    variant,
    fields: resolveFormFields(),
    labels: {
      submit: 'Send message',
      success: 'Thank you. We received your message.',
      error: 'Please check the form and try again.',
    },
    submissionConfig: {
      action: 'leads',
      source: 'contact_form',
    } satisfies ContactSubmissionConfig,
    submitLabel: 'Send message',
    successMessage: 'Thank you. We received your message.',
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-().\s]{6,30}$/;

export interface ContactSubmissionInput {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  message?: unknown;
  subject?: unknown;
  company?: unknown;
  website?: unknown;
  source?: unknown;
  fields?: unknown;
}

export interface ValidatedContactSubmission {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source: string;
}

function asSafeString(value: unknown, path: string, max: number, required = false): string | undefined {
  if (value === undefined || value === null || value === '') {
    if (required) throw new Error(`${path} is required`);
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new Error(`${path} must be a string`);
  }
  const cleaned = stripHtml(value).trim();
  if (containsDangerousPayload(cleaned)) {
    throw new Error(`${path} contains unsafe content`);
  }
  if (cleaned.length > max) {
    throw new Error(`${path} exceeds ${max} characters`);
  }
  if (required && !cleaned) {
    throw new Error(`${path} is required`);
  }
  return cleaned || undefined;
}

function readSubmittedValue(
  input: ContactSubmissionInput,
  field: FormFieldDefinition,
): unknown {
  const extras =
    input.fields && typeof input.fields === 'object' && !Array.isArray(input.fields)
      ? (input.fields as Record<string, unknown>)
      : {};
  const key = field.name || field.id;
  if (field.id in extras) return extras[field.id];
  if (key in extras) return extras[key];
  return (input as Record<string, unknown>)[key];
}

function validateFieldValue(field: FormFieldDefinition, value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    if (field.required) throw new Error(`${field.label} is required`);
    return undefined;
  }

  if (field.type === 'checkbox') {
    const accepted = value === true || value === 'true' || value === 'on' || value === '1';
    if (field.required && !accepted) throw new Error(`${field.label} is required`);
    return accepted ? 'true' : 'false';
  }

  if (field.type === 'number') {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric)) {
      throw new Error(`${field.label} must be a number`);
    }
    if (field.validation?.min !== undefined && numeric < field.validation.min) {
      throw new Error(`${field.label} is below the minimum`);
    }
    if (field.validation?.max !== undefined && numeric > field.validation.max) {
      throw new Error(`${field.label} is above the maximum`);
    }
    return String(numeric);
  }

  if (Array.isArray(value)) {
    const joined = value.map((entry) => asSafeString(entry, field.label, 80) || '').filter(Boolean);
    return joined.join(', ') || undefined;
  }

  const text = asSafeString(value, field.label, field.validation?.maxLength || 500, field.required);
  if (!text) return undefined;

  if (field.type === 'email' && !EMAIL_RE.test(text)) {
    throw new Error(`${field.label} must be a valid email`);
  }
  if (field.type === 'phone' && !PHONE_RE.test(text)) {
    throw new Error(`${field.label} must be a valid phone number`);
  }
  if (field.type === 'website' && !isSafeUrl(text)) {
    throw new Error(`${field.label} must be a safe URL`);
  }
  if (field.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error(`${field.label} must be a valid date`);
  }
  if ((field.type === 'select' || field.type === 'radio') && field.options?.length) {
    if (!field.options.some((option) => option.value === text)) {
      throw new Error(`${field.label} has an invalid option`);
    }
  }
  if (field.validation?.minLength && text.length < field.validation.minLength) {
    throw new Error(`${field.label} is too short`);
  }
  return text;
}

export function validateContactSubmission(
  input: ContactSubmissionInput,
  schema?: FormFieldDefinition[],
): ValidatedContactSubmission {
  const fields = schema?.length
    ? schema
    : resolveFormFields().map((field) =>
        field.id === 'name' || field.id === 'email' ? field : { ...field, required: false },
      );
  const collected: Record<string, string> = {};

  for (const field of fields) {
    const value = validateFieldValue(field, readSubmittedValue(input, field));
    if (value !== undefined) collected[field.name || field.id] = value;
  }

  const name = collected.name || asSafeString(input.name, 'name', 100, true) || '';
  const email = collected.email || asSafeString(input.email, 'email', 200, true) || '';
  if (!EMAIL_RE.test(email)) {
    throw new Error('email must be a valid email');
  }

  const extras = Object.entries(collected)
    .filter(([key]) => !['name', 'email', 'phone', 'message'].includes(key))
    .map(([key, value]) => `${key}: ${value}`);

  for (const key of ['subject', 'company', 'website'] as const) {
    const extra = asSafeString(input[key], key, key === 'website' ? 500 : 200);
    if (key === 'website' && extra && !isSafeUrl(extra)) {
      throw new Error('website must be a safe URL');
    }
    if (extra && !extras.some((line) => line.startsWith(`${key}:`))) {
      extras.push(`${key}: ${extra}`);
    }
  }

  const messageParts = [collected.message || asSafeString(input.message, 'message', 3000), ...extras].filter(
    Boolean,
  ) as string[];

  return {
    name,
    email,
    phone: collected.phone || asSafeString(input.phone, 'phone', 30),
    message: messageParts.length ? messageParts.join('\n') : undefined,
    source: asSafeString(input.source, 'source', 100) || 'contact_form',
  };
}
