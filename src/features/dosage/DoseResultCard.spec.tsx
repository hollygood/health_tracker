import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { calculateDose } from './calculateDose';
import DoseResultCard from './DoseResultCard';

describe('DoseResultCard', () => {
  it('asks for a weight when there is no result', () => {
    render(<DoseResultCard result={null} unit="kg" />);

    expect(screen.getByText('Enter a weight to see the dose.')).toBeInTheDocument();
  });

  it('shows mg and mL for a weight on the sheet', () => {
    render(<DoseResultCard result={calculateDose('advil-concentrated-drops', 14, 'kg')} unit="kg" />);

    expect(screen.getByTestId('dose-mg')).toHaveTextContent('140 mg');
    expect(screen.getByTestId('dose-ml')).toHaveTextContent('3.5 mL');
    expect(screen.getByText('From the dosage sheet.')).toBeInTheDocument();
  });

  it('says when the dose was calculated between sheet rows', () => {
    render(<DoseResultCard result={calculateDose('tylenol-childrens-liquid', 13, 'kg')} unit="kg" />);

    expect(screen.getByTestId('dose-ml')).toHaveTextContent('6.1 mL');
    expect(screen.getByText('Calculated at 15 mg/kg (between sheet rows).')).toBeInTheDocument();
  });

  it('shows mg but no mL when the product is not listed for the weight', () => {
    render(<DoseResultCard result={calculateDose('advil-concentrated-drops', 22, 'kg')} unit="kg" />);

    expect(screen.getByTestId('dose-mg')).toHaveTextContent('220 mg');
    expect(screen.queryByTestId('dose-ml')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('not listed for this weight');
  });

  it('shows no dose at all outside the sheet range', () => {
    render(<DoseResultCard result={calculateDose('advil-childrens-liquid', 45, 'kg')} unit="kg" />);

    expect(screen.queryByTestId('dose-mg')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dose-ml')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('only covers 4-40 kg');
  });
});
