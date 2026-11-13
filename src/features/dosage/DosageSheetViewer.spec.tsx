import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import DosageSheetViewer from './DosageSheetViewer';

describe('DosageSheetViewer', () => {
  it('shows only a text link until opened', () => {
    render(<DosageSheetViewer />);

    expect(screen.getByRole('button', { name: 'View the dosage sheet' })).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('opens the sheet full screen and closes with the close button', async () => {
    const user = userEvent.setup();
    render(<DosageSheetViewer />);

    await user.click(screen.getByRole('button', { name: 'View the dosage sheet' }));
    expect(screen.getByRole('dialog', { name: 'Dosage sheet' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Printed dosage sheet/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes with Escape', async () => {
    const user = userEvent.setup();
    render(<DosageSheetViewer />);

    await user.click(screen.getByRole('button', { name: 'View the dosage sheet' }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('toggles zoom when the sheet is tapped', async () => {
    const user = userEvent.setup();
    render(<DosageSheetViewer />);

    await user.click(screen.getByRole('button', { name: 'View the dosage sheet' }));
    expect(screen.getByText('Tap the sheet to zoom')).toBeInTheDocument();

    await user.click(screen.getByRole('img', { name: /Printed dosage sheet/ }));
    expect(screen.getByText('Tap to fit the screen')).toBeInTheDocument();
  });
});
