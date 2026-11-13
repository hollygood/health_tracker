import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { mia } from '../../test/fixtures';
import LogPageLayout from './LogPageLayout';

describe('LogPageLayout', () => {
  it('shows the page content when there is a profile', () => {
    render(
      <LogPageLayout title="Medicine" profile={mia} onBack={() => {}} onOpenProfiles={() => {}}>
        <p>Form goes here</p>
      </LogPageLayout>,
    );

    expect(screen.getByRole('heading', { name: 'Medicine' })).toBeInTheDocument();
    expect(screen.getByText('Form goes here')).toBeInTheDocument();
  });

  it('asks for a profile instead of showing the content when there is none', async () => {
    const onOpenProfiles = vi.fn();
    render(
      <LogPageLayout title="Medicine" profile={null} onBack={() => {}} onOpenProfiles={onOpenProfiles}>
        <p>Form goes here</p>
      </LogPageLayout>,
    );

    expect(screen.queryByText('Form goes here')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add profile' }));
    expect(onOpenProfiles).toHaveBeenCalledOnce();
  });

  it('goes back to Home', async () => {
    const onBack = vi.fn();
    render(
      <LogPageLayout title="Medicine" profile={mia} onBack={onBack} onOpenProfiles={() => {}}>
        <p>Form goes here</p>
      </LogPageLayout>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
