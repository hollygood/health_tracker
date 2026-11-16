/**
 * Password encryption for backup files, using the browser's built-in Web Crypto.
 *
 * The password is stretched into a 256-bit key with PBKDF2 (SHA-256, random salt), and
 * the backup is encrypted with AES-GCM, which also detects a wrong password or a file
 * that has been altered. Nothing but the file's own salt and settings is stored: without
 * the password the contents cannot be recovered.
 */

export const ENCRYPTED_BACKUP_VERSION = 1;
/** OWASP's recommended minimum for PBKDF2 with SHA-256. */
export const PBKDF2_ITERATIONS = 600_000;
export const MIN_PASSWORD_LENGTH = 8;

export interface EncryptedBackup {
  app: 'health-tracker';
  encrypted: true;
  version: number;
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string };
  cipher: { name: 'AES-GCM'; iv: string };
  /** The encrypted backup, base64. */
  data: string;
}

/** Web Crypto only exists on secure pages (HTTPS or localhost). */
export const isEncryptionAvailable = () => typeof globalThis.crypto?.subtle !== 'undefined';

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  // In chunks, so a large backup does not overflow the argument limit.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Encrypts backup text with a password. Returns the text of the file to save. */
export async function encryptBackupText(plainText: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, PBKDF2_ITERATIONS);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plainText),
  );

  const file: EncryptedBackup = {
    app: 'health-tracker',
    encrypted: true,
    version: ENCRYPTED_BACKUP_VERSION,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: PBKDF2_ITERATIONS, salt: toBase64(salt) },
    cipher: { name: 'AES-GCM', iv: toBase64(iv) },
    data: toBase64(new Uint8Array(encrypted)),
  };
  return `${JSON.stringify(file)}\n`;
}

function readEncryptedBackup(text: string): EncryptedBackup | null {
  try {
    const file = JSON.parse(text) as Partial<EncryptedBackup> | null;
    const ok =
      file !== null &&
      typeof file === 'object' &&
      file.app === 'health-tracker' &&
      file.encrypted === true &&
      typeof file.data === 'string' &&
      typeof file.kdf?.salt === 'string' &&
      typeof file.kdf?.iterations === 'number' &&
      typeof file.cipher?.iv === 'string';
    return ok ? (file as EncryptedBackup) : null;
  } catch {
    return null;
  }
}

/** True when the text is a password-protected Health Tracker backup. */
export const isEncryptedBackup = (text: string) => readEncryptedBackup(text) !== null;

/**
 * Decrypts an encrypted backup file. Throws an Error with a message for the user when the
 * password is wrong or the file has been changed (the two cannot be told apart).
 */
export async function decryptBackupText(fileText: string, password: string): Promise<string> {
  const file = readEncryptedBackup(fileText);
  if (!file) throw new Error('That file is not an encrypted Health Tracker backup.');
  if (file.version > ENCRYPTED_BACKUP_VERSION) {
    throw new Error('That backup was made by a newer version of the app. Update the app, then try again.');
  }

  try {
    const key = await deriveKey(password, fromBase64(file.kdf.salt), file.kdf.iterations);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(file.cipher.iv) },
      key,
      fromBase64(file.data),
    );
    return new TextDecoder().decode(plain);
  } catch {
    throw new Error('That password does not open this backup. Check it and try again.');
  }
}
