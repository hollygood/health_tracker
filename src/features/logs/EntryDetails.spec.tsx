import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { sampleEntries } from '../../test/fixtures';
import EntryDetails from './EntryDetails';
import type { Entry, EntryType } from './entryTypes';

const byType = (type: EntryType) => sampleEntries.find((e) => e.type === type) as Entry;

describe('EntryDetails', () => {
  it('shows the short description, then the notes', () => {
    render(<EntryDetails entry={byType('medicine')} />);

    expect(screen.getByText("Advil Children's Liquid, 6 mL")).toBeInTheDocument();
    expect(screen.getByText('After lunch')).toBeInTheDocument();
  });

  it('shows notes with their formatting', () => {
    const entry = { ...byType('medicine'), notes: 'Give <b>with food</b>' } as Entry;
    const { container } = render(<EntryDetails entry={entry} />);

    expect(container.querySelector('.rich-text b')).toHaveTextContent('with food');
  });

  it('shows no notes block when there are none', () => {
    const { container } = render(<EntryDetails entry={byType('temperature')} />);

    expect(screen.getByText('38.5 °C (101.3 °F)')).toBeInTheDocument();
    expect(container.querySelector('.rich-text')).toBeNull();
  });

  it('lists growth measurements as label and value rows', () => {
    render(<EntryDetails entry={byType('growth')} />);

    const terms = screen.getAllByRole('term').map((t) => t.textContent);
    const values = screen.getAllByRole('definition').map((d) => d.textContent);
    expect(terms).toEqual(['Height', 'Weight', 'Head']);
    expect(values).toEqual(['88.5 cm', '12 kg', '48 cm']);
  });

  it('leaves out growth measurements that were not taken', () => {
    render(<EntryDetails entry={{ ...byType('growth'), headCm: null } as Entry} />);

    expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual(['Height', 'Weight']);
  });
});
