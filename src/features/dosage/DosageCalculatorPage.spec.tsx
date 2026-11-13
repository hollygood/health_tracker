import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { leo, mia } from '../../test/fixtures';
import DosageCalculatorPage from './DosageCalculatorPage';

function renderPage(props: Partial<ComponentProps<typeof DosageCalculatorPage>> = {}) {
  const onSaveProfile = vi.fn();
  const onBack = vi.fn();
  render(
    <DosageCalculatorPage profile={null} onSaveProfile={onSaveProfile} onBack={onBack} {...props} />,
  );
  return { onSaveProfile, onBack, user: userEvent.setup() };
}

describe('DosageCalculatorPage', () => {
  it('offers the four medicines', () => {
    renderPage();

    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual([
      'Advil Concentrated Drops',
      "Advil Children's Liquid",
      'Tylenol Concentrated Drops',
      "Tylenol Children's Liquid",
    ]);
  });

  it('shows the concentration and standard dosage of the selected medicine', async () => {
    const { user } = renderPage();

    expect(screen.getByText('200mg/5mL or 40mg/mL')).toBeInTheDocument();
    expect(screen.getByText(/10 mg\/kg, every 6 hours/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Medicine'), 'Tylenol Concentrated Drops');

    expect(screen.getByText('80mg/mL')).toBeInTheDocument();
    expect(screen.getByText(/15 mg\/kg, every 4 hours.*maximum of 5 doses in 24 hours/)).toBeInTheDocument();
  });

  it('calculates the dose as the weight is typed', async () => {
    const { user } = renderPage();

    await user.type(screen.getByLabelText('Weight'), '14');

    expect(screen.getByTestId('dose-mg')).toHaveTextContent('140 mg');
    expect(screen.getByTestId('dose-ml')).toHaveTextContent('3.5 mL');
  });

  it('accepts pounds', async () => {
    const { user } = renderPage();

    await user.selectOptions(screen.getByLabelText('Medicine'), 'Tylenol Concentrated Drops');
    await user.click(screen.getByRole('button', { name: 'pounds' }));
    await user.type(screen.getByLabelText('Weight'), '45');

    expect(screen.getByTestId('dose-mg')).toHaveTextContent('300 mg');
    expect(screen.getByTestId('dose-ml')).toHaveTextContent('3.75 mL');
  });

  it('warns instead of showing mL when the product is not listed', async () => {
    const { user } = renderPage();

    await user.type(screen.getByLabelText('Weight'), '20');

    expect(screen.getByRole('alert')).toHaveTextContent('not listed for this weight');
    expect(screen.queryByTestId('dose-ml')).not.toBeInTheDocument();
  });

  it("starts from the profile's saved weight", () => {
    renderPage({ profile: leo });

    expect(screen.getByLabelText("Leo's weight")).toHaveValue(12);
    expect(screen.getByTestId('dose-mg')).toHaveTextContent('120 mg');
  });

  it('saves a new weight to the profile', async () => {
    const { user, onSaveProfile } = renderPage({ profile: mia });

    await user.type(screen.getByLabelText("Mia's weight"), '14');
    await user.click(screen.getByRole('button', { name: "Save 14 kg to Mia's profile" }));

    expect(onSaveProfile).toHaveBeenCalledWith(
      expect.objectContaining({ id: mia.id, weightKg: 14, weightUpdatedAt: expect.any(String) }),
    );
    expect(screen.getByRole('status')).toHaveTextContent('Weight saved to profile.');
  });

  it('saves the true weight when entered in pounds', async () => {
    const { user, onSaveProfile } = renderPage({ profile: mia });

    await user.click(screen.getByRole('button', { name: 'pounds' }));
    await user.type(screen.getByLabelText("Mia's weight"), '30');
    await user.click(screen.getByRole('button', { name: /^Save 13.61 kg/ }));

    expect(onSaveProfile).toHaveBeenCalledWith(expect.objectContaining({ weightKg: 13.61 }));
  });

  it('does not offer to save without a profile', async () => {
    const { user } = renderPage();

    await user.type(screen.getByLabelText('Weight'), '14');

    expect(screen.queryByRole('button', { name: /^Save/ })).not.toBeInTheDocument();
  });

  it('goes back to Home', async () => {
    const { user, onBack } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Home' }));

    expect(onBack).toHaveBeenCalledOnce();
  });
});
