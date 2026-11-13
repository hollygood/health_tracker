import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { leo, mia } from '../../test/fixtures';
import type { Profile } from './profileStorage';
import ProfileSheet from './ProfileSheet';

function renderSheet(profiles: Profile[] = [], activeId: string | null = null) {
  const handlers = { onSelect: vi.fn(), onSave: vi.fn(), onDelete: vi.fn(), onClose: vi.fn() };
  render(<ProfileSheet profiles={profiles} activeId={activeId} {...handlers} />);
  return { ...handlers, user: userEvent.setup() };
}

describe('ProfileSheet', () => {
  it('opens on the new-profile form when there are no profiles', () => {
    renderSheet();

    expect(screen.getByRole('heading', { name: 'New profile' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Birthday')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Sex' })).toBeInTheDocument();
  });

  it('creates a profile with name, birthday and sex', async () => {
    const { user, onSave, onClose } = renderSheet();

    await user.type(screen.getByLabelText('Name'), '  Mia ');
    await user.type(screen.getByLabelText('Birthday'), '2022-05-04');
    await user.click(screen.getByRole('button', { name: 'Male' }));
    await user.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Mia', birthday: '2022-05-04', sex: 'male', id: expect.any(String) }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('does not save without a name', async () => {
    const { user, onSave } = renderSheet();

    await user.type(screen.getByLabelText('Birthday'), '2022-05-04');
    await user.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(onSave).not.toHaveBeenCalled();
  });

  it('lists profiles and switches between them', async () => {
    const { user, onSelect, onClose } = renderSheet([mia, leo], mia.id);

    expect(screen.getByRole('heading', { name: 'Profiles' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Leo/ }));

    expect(onSelect).toHaveBeenCalledWith(leo.id);
    expect(onClose).toHaveBeenCalled();
  });

  it('edits a profile and keeps its saved weight', async () => {
    const { user, onSave } = renderSheet([leo], leo.id);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const name = screen.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Leonardo');
    await user.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(onSave).toHaveBeenCalledWith({ ...leo, name: 'Leonardo' });
  });

  it('asks for confirmation before deleting', async () => {
    const { user, onDelete } = renderSheet([leo], leo.id);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Delete profile' }));
    expect(onDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete Leo and all their data?' }));
    expect(onDelete).toHaveBeenCalledWith(leo.id);
  });

  it('closes from the close button', async () => {
    const { user, onClose } = renderSheet([mia], mia.id);

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
  });
});
