import { afterEach, describe, expect, it, vi } from 'vitest';
import { canShare, copyText, shareText } from './shareReport';

afterEach(() => vi.unstubAllGlobals());

describe('shareText', () => {
  it('is unavailable where the device has no share sheet', async () => {
    vi.stubGlobal('navigator', {});

    expect(canShare()).toBe(false);
    expect(await shareText('Title', 'Text')).toBe(false);
  });

  it('passes the title and text to the share sheet', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });

    expect(canShare()).toBe(true);
    expect(await shareText('Health report: Leo', '# Report')).toBe(true);
    expect(share).toHaveBeenCalledWith({ title: 'Health report: Leo', text: '# Report' });
  });

  it('reports false when the user closes the share sheet', async () => {
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(new Error('AbortError')) });

    expect(await shareText('Title', 'Text')).toBe(false);
  });
});

describe('copyText', () => {
  it('writes the text to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    expect(await copyText('# Report')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('# Report');
  });

  it('reports false when the clipboard is blocked or missing', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    expect(await copyText('# Report')).toBe(false);

    vi.stubGlobal('navigator', {});
    expect(await copyText('# Report')).toBe(false);
  });
});
