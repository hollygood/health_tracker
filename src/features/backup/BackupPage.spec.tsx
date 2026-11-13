import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { leo, mia, sampleEntries } from '../../test/fixtures';
import { loadEntries, saveEntries } from '../logs/entryStorage';
import { loadData, saveData } from '../profiles/profileStorage';
import { downloadText } from '../reports/shareReport';
import { parseBackup, serializeBackup, type BackupFile } from './backupFile';
import BackupPage from './BackupPage';

vi.mock('../reports/shareReport', () => ({ downloadText: vi.fn() }));

const backup: BackupFile = {
  app: 'health-tracker',
  version: 1,
  exportedAt: '2026-11-13T20:00:00.000Z',
  profiles: [leo],
  activeProfileId: leo.id,
  entries: sampleEntries,
  categories: { sickness: [], history: [] },
};
const backupFile = (text = serializeBackup(backup)) =>
  new File([text], 'health-tracker-backup-2026-11-13.json', { type: 'application/json' });

function renderPage() {
  const onBack = vi.fn();
  const onRestored = vi.fn();
  render(<BackupPage onBack={onBack} onRestored={onRestored} />);
  return { onBack, onRestored, user: userEvent.setup() };
}

const chooseFile = (user: ReturnType<typeof userEvent.setup>, file: File) =>
  user.upload(screen.getByLabelText('Backup file'), file);

describe('BackupPage', () => {
  beforeEach(() => vi.mocked(downloadText).mockReset());

  it('saves everything on the device to a dated JSON file', async () => {
    saveData({ profiles: [leo, mia], activeProfileId: leo.id });
    saveEntries(sampleEntries);
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Save backup file' }));

    expect(downloadText).toHaveBeenCalledOnce();
    const [fileName, text, mimeType] = vi.mocked(downloadText).mock.calls[0];
    expect(fileName).toMatch(/^health-tracker-backup-\d{4}-\d{2}-\d{2}\.json$/);
    expect(mimeType).toBe('application/json');
    expect(parseBackup(text)).toEqual(
      expect.objectContaining({ profiles: [leo, mia], activeProfileId: leo.id, entries: sampleEntries }),
    );
    expect(screen.getByRole('status')).toHaveTextContent('with 2 profiles and 5 entries');
  });

  it('describes a chosen backup before doing anything with it', async () => {
    const { user, onRestored } = renderPage();

    await chooseFile(user, backupFile());

    const summary = await screen.findByTestId('backup-summary');
    expect(summary).toHaveTextContent('This backup has 1 profile (Leo) and 5 entries');
    expect(loadEntries()).toEqual([]);
    expect(onRestored).not.toHaveBeenCalled();
  });

  it('adds the backup to what is already here', async () => {
    saveData({ profiles: [mia], activeProfileId: mia.id });
    const { user, onRestored } = renderPage();

    await chooseFile(user, backupFile());
    await user.click(await screen.findByRole('button', { name: 'Add to what is here' }));

    expect(loadData()).toEqual({ profiles: [mia, leo], activeProfileId: mia.id });
    expect(loadEntries()).toHaveLength(5);
    expect(onRestored).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent('Added 1 profile and 5 entries');
    expect(screen.queryByTestId('backup-summary')).not.toBeInTheDocument();
  });

  it('replaces everything only after a second confirmation', async () => {
    saveData({ profiles: [mia], activeProfileId: mia.id });
    const { user, onRestored } = renderPage();

    await chooseFile(user, backupFile());
    await user.click(await screen.findByRole('button', { name: 'Replace everything here' }));

    expect(screen.getByRole('alert')).toHaveTextContent('deletes everything now on this device');
    expect(loadData().profiles).toEqual([mia]);
    expect(onRestored).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Yes, replace everything' }));

    expect(loadData()).toEqual({ profiles: [leo], activeProfileId: leo.id });
    expect(loadEntries()).toEqual(sampleEntries);
    expect(onRestored).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent('Restored 1 profile and 5 entries');
  });

  it('can back out of replacing', async () => {
    saveData({ profiles: [mia], activeProfileId: mia.id });
    const { user, onRestored } = renderPage();

    await chooseFile(user, backupFile());
    await user.click(await screen.findByRole('button', { name: 'Replace everything here' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('button', { name: 'Add to what is here' })).toBeInTheDocument();
    expect(loadData().profiles).toEqual([mia]);
    expect(onRestored).not.toHaveBeenCalled();
  });

  it('rejects a file that is not a backup and changes nothing', async () => {
    saveData({ profiles: [mia], activeProfileId: mia.id });
    const { user, onRestored } = renderPage();

    await chooseFile(user, backupFile('# Health report: Leo'));

    expect(await screen.findByRole('alert')).toHaveTextContent('not a Health Tracker backup');
    expect(screen.queryByTestId('backup-summary')).not.toBeInTheDocument();
    expect(loadData().profiles).toEqual([mia]);
    expect(onRestored).not.toHaveBeenCalled();
  });

  it('goes back to Home', async () => {
    const { user, onBack } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Home' }));

    expect(onBack).toHaveBeenCalledOnce();
  });
});
