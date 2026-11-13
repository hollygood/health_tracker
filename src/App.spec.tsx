import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { loadEntries, saveEntries } from './features/logs/entryStorage';
import { saveData } from './features/profiles/profileStorage';
import { leo, mia, sampleEntries } from './test/fixtures';

describe('App', () => {
  it('starts on Home with a prompt to add a profile', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: 'Add profile' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dosage calculator/ })).toBeInTheDocument();
  });

  it('navigates Home -> Dosage calculator -> Reports -> Home', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Dosage calculator/ }));
    expect(await screen.findByRole('heading', { name: 'Dosage calculator' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reports' }));
    expect(await screen.findByRole('heading', { name: 'Reports' })).toBeInTheDocument();

    await user.click(screen.getByRole('navigation', { name: 'Main' }).querySelector('button')!);
    expect(await screen.findByRole('button', { name: /Dosage calculator/ })).toBeInTheDocument();
  });

  it('creates a profile and shows its name in the header', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Add profile' }));
    await user.type(screen.getByLabelText('Name'), 'Mia');
    await user.type(screen.getByLabelText('Birthday'), '2022-05-04');
    await user.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(screen.getByRole('button', { name: 'Mia' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('restores saved profiles on load', () => {
    saveData({ profiles: [mia, leo], activeProfileId: leo.id });

    render(<App />);

    expect(screen.getByRole('button', { name: 'Leo' })).toBeInTheDocument();
  });

  it('uses the newly selected profile weight in the calculator', async () => {
    saveData({ profiles: [mia, leo], activeProfileId: mia.id });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Dosage calculator/ }));
    expect(await screen.findByLabelText("Mia's weight")).toHaveValue(null);

    await user.click(screen.getByRole('button', { name: 'Mia' }));
    await user.click(screen.getByRole('button', { name: /Leo/ }));

    expect(screen.getByLabelText("Leo's weight")).toHaveValue(12);
  });

  it('opens a log page from Home and returns', async () => {
    saveData({ profiles: [mia], activeProfileId: mia.id });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Temperature/ }));
    expect(await screen.findByRole('heading', { name: 'Temperature' })).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Home' })[0]);
    expect(await screen.findByRole('button', { name: /Dosage calculator/ })).toBeInTheDocument();
  });

  it("deletes a profile's entries with the profile", async () => {
    saveData({ profiles: [leo], activeProfileId: leo.id });
    saveEntries(sampleEntries);
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Leo' }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Delete profile' }));
    await user.click(screen.getByRole('button', { name: 'Delete Leo and all their data?' }));

    expect(loadEntries()).toEqual([]);
  });

  it('edits an entry from Reports and returns to Reports', async () => {
    saveData({ profiles: [leo], activeProfileId: leo.id });
    saveEntries(sampleEntries.filter((e) => e.type === 'temperature'));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Reports' }));
    await user.click(await screen.findByRole('button', { name: 'Edit entry' }));

    const value = await screen.findByLabelText('Temperature');
    expect(screen.getByRole('form', { name: 'Edit temperature' })).toBeInTheDocument();
    expect(value).toHaveValue(38.5);
    await user.clear(value);
    await user.type(value, '39');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('heading', { name: 'Reports' })).toBeInTheDocument();
    expect(await screen.findByText('39 °C (102.2 °F)')).toBeInTheDocument();
  });

  it('does not reopen that edit when the log page is opened again from Home', async () => {
    saveData({ profiles: [leo], activeProfileId: leo.id });
    saveEntries(sampleEntries.filter((e) => e.type === 'temperature'));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Reports' }));
    await user.click(await screen.findByRole('button', { name: 'Edit entry' }));
    await screen.findByRole('form', { name: 'Edit temperature' });

    await user.click(screen.getAllByRole('button', { name: 'Home' })[0]);
    await user.click(await screen.findByRole('button', { name: /Temperature/ }));

    expect(await screen.findByRole('form', { name: 'Log temperature' })).toBeInTheDocument();
  });

  it('opens the growth chart from the Growth page and returns', async () => {
    saveData({ profiles: [leo], activeProfileId: leo.id });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Growth/ }));
    await user.click(await screen.findByRole('button', { name: 'View growth chart' }));
    expect(await screen.findByRole('heading', { name: 'Growth chart' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Growth' }));
    expect(await screen.findByRole('heading', { name: 'Growth' })).toBeInTheDocument();
  });
});
