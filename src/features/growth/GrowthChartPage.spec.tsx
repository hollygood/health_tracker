import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { leo, localIso } from '../../test/fixtures';
import { whoFixture } from '../../test/whoFixture';
import { saveEntries } from '../logs/entryStorage';
import type { Entry } from '../logs/entryTypes';
import type { Profile } from '../profiles/profileStorage';
import GrowthChartPage from './GrowthChartPage';
import { loadWhoData } from './loadWhoData';

vi.mock('./loadWhoData', () => ({ loadWhoData: vi.fn() }));

// Leo was born 2024-01-15. In the fixture the median weight is 4 kg at birth and
// 10 kg at 600 days (2025-09-06); the median height is 80 cm at 600 days.
const growth = (id: string, time: string, fields: object): Entry => ({
  id,
  profileId: leo.id,
  type: 'growth',
  time,
  heightCm: null,
  weightKg: null,
  headCm: null,
  ...fields,
});
const entries = [
  growth('birth', localIso(2024, 1, 15), { weightKg: 4 }),
  growth('later', localIso(2025, 9, 6), { weightKg: 11, heightCm: 80 }),
];

function renderPage(profile: Profile | null = leo) {
  const onBack = vi.fn();
  const onOpenProfiles = vi.fn();
  render(<GrowthChartPage profile={profile} onBack={onBack} onOpenProfiles={onOpenProfiles} />);
  return { onBack, onOpenProfiles, user: userEvent.setup() };
}

const latest = () => screen.getByRole('region', { name: 'Latest measurements' });

describe('GrowthChartPage', () => {
  beforeEach(() => {
    vi.mocked(loadWhoData).mockResolvedValue(whoFixture);
  });

  it('asks for a profile when there is none', async () => {
    const { user, onOpenProfiles } = renderPage(null);

    await user.click(screen.getByRole('button', { name: 'Add profile' }));

    expect(onOpenProfiles).toHaveBeenCalledOnce();
  });

  it('points to the Growth page when nothing is measured yet', async () => {
    const { user, onBack } = renderPage();

    expect(screen.getByText('No growth measurements for Leo yet')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add a measurement' }));

    expect(onBack).toHaveBeenCalledOnce();
  });

  it('shows the latest value and percentile of each measurement, with BMI', async () => {
    saveEntries(entries);
    renderPage();

    // weight 11 kg vs median 10 -> z = 1 -> 84th; height on the median -> 50th
    expect(await within(latest()).findByText('84th percentile', { exact: false })).toBeInTheDocument();
    expect(latest()).toHaveTextContent('Weight11 kg, 84th percentile');
    expect(latest()).toHaveTextContent('Height80 cm, 50th percentile');
    // BMI = 11 / 0.8^2 = 17.2; fixture median 16 -> z = 0.75 -> 77th
    expect(latest()).toHaveTextContent('BMI17.2 kg/m², 77th percentile');
    expect(latest()).toHaveTextContent('Head circumferenceNot measured yet');
    expect(latest()).toHaveTextContent('age 19 mo');
  });

  it('charts weight first, with the WHO lines and a point per measurement', async () => {
    saveEntries(entries);
    renderPage();

    expect(await screen.findByTestId('curve-50')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Weight by age (kg)' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Weight by age, with WHO percentile lines' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /: 4 kg, 50th percentile$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /: 11 kg, 84th percentile$/ })).toBeInTheDocument();
    expect(screen.getByText(/percentiles for boys; the purple line is Leo/)).toBeInTheDocument();
  });

  it('describes the latest point, then whichever point is tapped', async () => {
    saveEntries(entries);
    const { user } = renderPage();

    await screen.findByTestId('curve-50');
    expect(screen.getByTestId('selected-point')).toHaveTextContent('11 kg, 84th percentile');

    await user.click(screen.getByRole('button', { name: /: 4 kg, 50th percentile$/ }));
    expect(screen.getByTestId('selected-point')).toHaveTextContent('4 kg, 50th percentile');
  });

  it('switches to another measurement', async () => {
    saveEntries(entries);
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Height' }));

    expect(screen.getByRole('heading', { name: 'Height by age (cm)' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /: 80 cm, 50th percentile$/ })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2); // header + one height measurement
  });

  it('says when a measurement type has no data', async () => {
    saveEntries(entries);
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Head' }));

    expect(screen.getByText('No head circumference measurements yet.')).toBeInTheDocument();
  });

  it('lists the measurements newest first with their percentiles', async () => {
    saveEntries(entries);
    renderPage();

    await screen.findByTestId('curve-50');
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent('19 mo');
    expect(rows[1]).toHaveTextContent('84th');
    expect(rows[2]).toHaveTextContent('0 d');
    expect(rows[2]).toHaveTextContent('50th');
  });

  it('still shows the values, with a notice, when the WHO data is not installed', async () => {
    vi.mocked(loadWhoData).mockResolvedValue(null);
    saveEntries(entries);
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('npm run who:data');
    expect(latest()).toHaveTextContent('Weight11 kg, percentile not available');
    expect(screen.queryByTestId('curve-50')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: / kg$/ })).toHaveLength(2);
  });

  it('goes back to the Growth page', async () => {
    const { user, onBack } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Growth' }));

    expect(onBack).toHaveBeenCalledOnce();
  });
});
