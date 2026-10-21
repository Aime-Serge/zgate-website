/**
 * The slug rule for courses (and articles), shared across products: a
 * course is joined between the website CMS and the e-learning platform by
 * its slug (ADR-007). The CMS enforces the same pattern
 * (backend/content/validators.py, SLUG_PATTERN); tests/contracts checks it
 * against the e-learning contract.
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const isValidSlug = (value: string): boolean => SLUG_PATTERN.test(value);
