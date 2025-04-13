import { createHash } from 'crypto';

/**
 * Generates a SHA-256 hash of the given value.
 *
 * @param value - The input string to hash.
 * @returns The SHA-256 hash of the input as a hexadecimal string.
 */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
