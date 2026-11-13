import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { localIso } from '../../test/fixtures';
import { whoFixture } from '../../test/whoFixture';
import GrowthChart, { niceTicks } from './GrowthChart';
import { ageWindow, referenceCurves, type GrowthPoint } from './growthStats';

const ageRange = ageWindow(600, 6960);
const curves = referenceCurves(whoFixture, 'weight', 'male', ageRange.fromDays, ageRange.toDays);
const points: GrowthPoint[] = [
  { entryId: 'a', time: localIso(2024, 1, 15), ageDays: 0, value: 4, z: 0, percentile: 50 },
  { entryId: 'b', time: localIso(2025, 9, 6), ageDays: 600, value: 11, z: 1, percentile: 84.13 },
];

function renderChart(props: Partial<ComponentProps<typeof GrowthChart>> = {}) {
  const onSelect = vi.fn();
  render(
    <GrowthChart
      label="Weight"
      unit="kg"
      curves={curves}
      points={points}
      ageRange={ageRange}
      selectedId={null}
      onSelect={onSelect}
      {...props}
    />,
  );
  return { onSelect, user: userEvent.setup() };
}

describe('GrowthChart', () => {
  it('names the chart', () => {
    renderChart();

    expect(screen.getByRole('group', { name: 'Weight by age, with WHO percentile lines' })).toBeInTheDocument();
  });

  it('draws and labels the five percentile lines', () => {
    renderChart();

    for (const percentile of [3, 15, 50, 85, 97]) {
      const line = screen.getByTestId(`curve-${percentile}`);
      expect(line.querySelector('path')).toHaveAttribute('d', expect.stringMatching(/^M/));
      expect(line).toHaveTextContent(String(percentile));
    }
  });

  it('shows the age ticks', () => {
    renderChart();

    for (const label of ['Birth', '6 mo', '12 mo', '18 mo', '24 mo']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('gives each measurement a point described in words', () => {
    renderChart();

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveAccessibleName(/: 4 kg, 50th percentile$/);
    expect(buttons[1]).toHaveAccessibleName(/: 11 kg, 84th percentile$/);
  });

  it('selects a point when it is tapped or activated from the keyboard', async () => {
    const { user, onSelect } = renderChart();

    await user.click(screen.getAllByRole('button')[1]);
    expect(onSelect).toHaveBeenLastCalledWith('b');

    screen.getAllByRole('button')[0].focus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith('a');
  });

  it('marks the selected point', () => {
    renderChart({ selectedId: 'b' });

    const buttons = screen.getAllByRole('button');
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows no tooltip until a point is hovered or selected', () => {
    renderChart();

    expect(screen.queryByTestId('point-tooltip')).not.toBeInTheDocument();
  });

  it('shows the value, percentile, date and age in a tooltip while a point is hovered', async () => {
    const { user } = renderChart();

    await user.hover(screen.getAllByRole('button')[1]);
    const tooltip = screen.getByTestId('point-tooltip');
    expect(tooltip).toHaveTextContent('11 kg, 84th percentile');
    expect(tooltip).toHaveTextContent('age 19 mo');

    await user.unhover(screen.getAllByRole('button')[1]);
    expect(screen.queryByTestId('point-tooltip')).not.toBeInTheDocument();
  });

  it('shows the tooltip for a point focused from the keyboard', async () => {
    const { user } = renderChart();

    await user.tab();

    expect(screen.getByTestId('point-tooltip')).toHaveTextContent('4 kg, 50th percentile');
  });

  it('keeps the tooltip on the selected point, and moves it to a hovered one', async () => {
    const { user } = renderChart({ selectedId: 'a' });

    expect(screen.getByTestId('point-tooltip')).toHaveTextContent('4 kg, 50th percentile');

    await user.hover(screen.getAllByRole('button')[1]);
    expect(screen.getByTestId('point-tooltip')).toHaveTextContent('11 kg, 84th percentile');
  });

  it('says so in the tooltip when a point has no percentile', () => {
    renderChart({
      selectedId: 'a',
      points: [{ ...points[0], z: null, percentile: null }],
    });

    expect(screen.getByTestId('point-tooltip')).toHaveTextContent('4 kg, no percentile');
  });

  it('still plots the measurements when there is no reference data', () => {
    renderChart({ curves: [] });

    expect(screen.getByRole('group', { name: 'Weight by age' })).toBeInTheDocument();
    expect(screen.queryByTestId('curve-50')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('leaves out points beyond the age range shown', () => {
    renderChart({
      points: [...points, { entryId: 'c', time: localIso(2030, 1, 1), ageDays: 2000, value: 20, z: null, percentile: null }],
    });

    expect(screen.getAllByRole('button')).toHaveLength(2);
  });
});

describe('niceTicks', () => {
  it('picks round steps that cover the range', () => {
    expect(niceTicks(0, 10)).toEqual([0, 2, 4, 6, 8, 10]);
    expect(niceTicks(3.2, 13.8)).toEqual([4, 6, 8, 10, 12]);
    expect(niceTicks(45, 92)).toEqual([50, 60, 70, 80, 90]);
    expect(niceTicks(13.1, 18.4)).toEqual([14, 15, 16, 17, 18]);
  });

  it('copes with a single value', () => {
    expect(niceTicks(5, 5)).toEqual([5]);
  });
});
