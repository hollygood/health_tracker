import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExportPanel from './ExportPanel';
import * as share from './shareReport';

vi.mock('./shareReport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./shareReport')>()),
  canShare: vi.fn(),
  shareText: vi.fn(),
  copyText: vi.fn(),
  downloadText: vi.fn(),
}));

const TEXT = '# Health report: Leo\n\n- Entries: 2\n';

function renderPanel() {
  render(
    <ExportPanel
      text={TEXT}
      title="Health report: Leo"
      fileName="health-report-leo-2026-11-11.md"
      entryCount={2}
    />,
  );
  return userEvent.setup();
}

describe('ExportPanel', () => {
  beforeEach(() => {
    vi.mocked(share.canShare).mockReturnValue(false);
    vi.mocked(share.shareText).mockResolvedValue(true);
    vi.mocked(share.copyText).mockResolvedValue(true);
    vi.mocked(share.downloadText).mockReset();
  });

  it('says how many entries will be exported', () => {
    renderPanel();

    expect(screen.getByText(/^2 entries from the current filters/)).toBeInTheDocument();
  });

  it('shows the exact text in the preview', () => {
    renderPanel();

    expect(screen.getByTestId('export-preview').textContent).toBe(TEXT);
  });

  it('copies the text', async () => {
    const user = renderPanel();

    await user.click(screen.getByRole('button', { name: 'Copy' }));

    expect(share.copyText).toHaveBeenCalledWith(TEXT);
    expect(await screen.findByRole('status')).toHaveTextContent('Copied.');
  });

  it('says so when copying fails', async () => {
    vi.mocked(share.copyText).mockResolvedValue(false);
    const user = renderPanel();

    await user.click(screen.getByRole('button', { name: 'Copy' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Could not copy.');
  });

  it('downloads the text as a file', async () => {
    const user = renderPanel();

    await user.click(screen.getByRole('button', { name: 'Download' }));

    expect(share.downloadText).toHaveBeenCalledWith('health-report-leo-2026-11-11.md', TEXT);
    expect(screen.getByRole('status')).toHaveTextContent('Downloaded health-report-leo-2026-11-11.md.');
  });

  it('has no separate Email button; the share sheet covers email', () => {
    renderPanel();

    expect(screen.queryByRole('link', { name: 'Email' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Email' })).not.toBeInTheDocument();
  });

  it('hides Share where the device has no share sheet', () => {
    renderPanel();

    expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument();
  });

  it('shares through the share sheet where there is one', async () => {
    vi.mocked(share.canShare).mockReturnValue(true);
    const user = renderPanel();

    await user.click(screen.getByRole('button', { name: 'Share' }));

    expect(share.shareText).toHaveBeenCalledWith('Health report: Leo', TEXT);
  });
});
