import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PhotoToText from './PhotoToText';

const photo = () => new File(['fake image bytes'], 'visit.jpg', { type: 'image/jpeg' });
const fileInput = () => screen.getByLabelText('Photo to read text from');

function renderPhotoToText(recognize: (file: File, onProgress?: (f: number) => void) => Promise<string>) {
  const onText = vi.fn();
  render(<PhotoToText onText={onText} recognize={recognize} />);
  return { onText, user: userEvent.setup() };
}

describe('PhotoToText', () => {
  it('accepts images only', () => {
    renderPhotoToText(vi.fn());

    expect(fileInput()).toHaveAttribute('accept', 'image/*');
    expect(screen.getByRole('button', { name: 'Add text from a photo' })).toBeEnabled();
  });

  it('passes the recognised text on and confirms it', async () => {
    const recognize = vi.fn().mockResolvedValue('Amoxicillin 250 mg');
    const { user, onText } = renderPhotoToText(recognize);
    const file = photo();

    await user.upload(fileInput(), file);

    expect(recognize).toHaveBeenCalledWith(file, expect.any(Function));
    expect(onText).toHaveBeenCalledWith('Amoxicillin 250 mg');
    expect(await screen.findByRole('status')).toHaveTextContent('Text added to the description');
  });

  it('shows progress and disables the button while reading', async () => {
    let finish: (text: string) => void = () => {};
    const recognize = vi.fn((_file: File, onProgress?: (f: number) => void) => {
      onProgress?.(0.42);
      return new Promise<string>((resolve) => {
        finish = resolve;
      });
    });
    const { user, onText } = renderPhotoToText(recognize);

    await user.upload(fileInput(), photo());

    const button = await screen.findByRole('button', { name: 'Reading text, 42%' });
    expect(button).toBeDisabled();
    expect(onText).not.toHaveBeenCalled();

    finish('Done');
    expect(await screen.findByRole('button', { name: 'Add text from a photo' })).toBeEnabled();
    expect(onText).toHaveBeenCalledWith('Done');
  });

  it('says so when the photo has no readable text', async () => {
    const { user, onText } = renderPhotoToText(vi.fn().mockResolvedValue(''));

    await user.upload(fileInput(), photo());

    expect(await screen.findByRole('alert')).toHaveTextContent('No text was found in that photo');
    expect(onText).not.toHaveBeenCalled();
  });

  it('says so when reading fails', async () => {
    const { user, onText } = renderPhotoToText(vi.fn().mockRejectedValue(new Error('network')));

    await user.upload(fileInput(), photo());

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not read that photo');
    expect(onText).not.toHaveBeenCalled();
  });
});
