import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Disclaimer from './Disclaimer';

describe('Disclaimer', () => {
  it('says the app is not medical advice and is used at the user\'s own risk', () => {
    render(<Disclaimer />);

    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent('not medical advice');
    expect(footer).toHaveTextContent('at your own risk');
    expect(footer).toHaveTextContent('accepts no responsibility or liability');
  });
});
