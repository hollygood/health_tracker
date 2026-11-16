import { describe, expect, it } from 'vitest';
import {
  decryptBackupText,
  encryptBackupText,
  isEncryptedBackup,
  isEncryptionAvailable,
  PBKDF2_ITERATIONS,
  type EncryptedBackup,
} from './backupCrypto';

const SECRET = '{"app":"health-tracker","profiles":[{"name":"Leo"}],"note":"38.5 °C, café"}';
const PASSWORD = 'correct horse battery';

const rejection = async (promise: Promise<unknown>) => {
  try {
    await promise;
    return 'did not reject';
  } catch (error) {
    return (error as Error).message;
  }
};

describe('backupCrypto', () => {
  it('is available in the test environment', () => {
    expect(isEncryptionAvailable()).toBe(true);
  });

  it('round-trips text through encryption, including non-ASCII characters', async () => {
    const file = await encryptBackupText(SECRET, PASSWORD);

    expect(await decryptBackupText(file, PASSWORD)).toBe(SECRET);
  });

  it('does not leave the contents readable in the file', async () => {
    const file = await encryptBackupText(SECRET, PASSWORD);

    expect(file.includes('Leo')).toBe(false);
    expect(file.includes('profiles')).toBe(false);
    expect(file.includes(PASSWORD)).toBe(false);
  });

  it('records how the file was encrypted, but not the password', async () => {
    const parsed = JSON.parse(await encryptBackupText(SECRET, PASSWORD)) as EncryptedBackup;

    expect(parsed.app).toBe('health-tracker');
    expect(parsed.encrypted).toBe(true);
    expect(parsed.kdf.name).toBe('PBKDF2');
    expect(parsed.kdf.hash).toBe('SHA-256');
    expect(parsed.kdf.iterations).toBe(PBKDF2_ITERATIONS);
    expect(parsed.cipher.name).toBe('AES-GCM');
    expect(Object.keys(parsed).sort()).toEqual(['app', 'cipher', 'data', 'encrypted', 'kdf', 'version']);
  });

  it('uses a fresh salt and nonce every time', async () => {
    const first = JSON.parse(await encryptBackupText(SECRET, PASSWORD)) as EncryptedBackup;
    const second = JSON.parse(await encryptBackupText(SECRET, PASSWORD)) as EncryptedBackup;

    expect(first.kdf.salt).not.toBe(second.kdf.salt);
    expect(first.cipher.iv).not.toBe(second.cipher.iv);
    expect(first.data).not.toBe(second.data);
  });

  it('refuses the wrong password', async () => {
    const file = await encryptBackupText(SECRET, PASSWORD);

    expect(await rejection(decryptBackupText(file, 'wrong password'))).toBe(
      'That password does not open this backup. Check it and try again.',
    );
  });

  it('refuses a file whose contents were altered', async () => {
    const parsed = JSON.parse(await encryptBackupText(SECRET, PASSWORD)) as EncryptedBackup;
    const flipped = parsed.data[0] === 'A' ? 'B' : 'A';
    const tampered = JSON.stringify({ ...parsed, data: flipped + parsed.data.slice(1) });

    expect(await rejection(decryptBackupText(tampered, PASSWORD))).toMatch(/does not open this backup/);
  });

  it('tells an encrypted backup from other files', async () => {
    expect(isEncryptedBackup(await encryptBackupText(SECRET, PASSWORD))).toBe(true);
    expect(isEncryptedBackup(SECRET)).toBe(false);
    expect(isEncryptedBackup('# Health report: Leo')).toBe(false);
    expect(isEncryptedBackup('null')).toBe(false);
  });

  it('refuses to decrypt something that is not an encrypted backup', async () => {
    expect(await rejection(decryptBackupText(SECRET, PASSWORD))).toBe(
      'That file is not an encrypted Health Tracker backup.',
    );
  });
});
