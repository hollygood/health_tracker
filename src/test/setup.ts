import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
// @ts-expect-error -- Node built-in; this file only runs under Vitest, and Node's types are not installed
import { webcrypto } from 'node:crypto';
import { afterEach, vi } from 'vitest';

// jsdom does not implement scrolling.
window.scrollTo = vi.fn();

// jsdom has no Web Crypto `subtle`; use Node's, which follows the same standard.
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.location.hash = '';
});
