import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import RichTextEditor from './RichTextEditor';

function renderEditor(value = '') {
  const onChange = vi.fn();
  const view = render(<RichTextEditor id="notes" label="Notes" value={value} onChange={onChange} />);
  return { onChange, user: userEvent.setup(), ...view };
}

const editor = () => screen.getByRole('textbox', { name: 'Notes' });
const resizeHandle = () => screen.getByRole('separator', { name: 'Resize the notes box' });

describe('RichTextEditor', () => {
  it('is a labelled, multi-line text box', () => {
    renderEditor();

    expect(screen.getByLabelText('Notes')).toBe(editor());
    expect(editor()).toHaveAttribute('aria-multiline', 'true');
    expect(editor()).toHaveAttribute('contenteditable', 'true');
  });

  it('offers bold, italic, underline, a list, colours and clear formatting', () => {
    renderEditor();

    const toolbar = screen.getByRole('toolbar', { name: 'Notes formatting' });
    for (const name of ['Bold', 'Italic', 'Underline', 'Bulleted list', 'Clear formatting', 'Red text', 'Default text']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
    expect(toolbar).toContainElement(screen.getByRole('button', { name: 'Bold' }));
  });

  it('loads a formatted note', () => {
    renderEditor('Give <b>with food</b>');

    expect(editor().innerHTML).toBe('Give <b>with food</b>');
  });

  it('loads an older plain-text note with its line breaks', () => {
    renderEditor('Line one\nLine two');

    expect(editor().innerHTML).toBe('Line one<br>Line two');
  });

  it('cleans unsafe markup out of a loaded note', () => {
    renderEditor('<b>Bold</b><script>alert(1)</script><img src=x onerror="alert(2)">');

    expect(editor().innerHTML).toBe('<b>Bold</b>');
  });

  it('reports what is typed', async () => {
    const { user, onChange } = renderEditor();

    await user.type(editor(), 'After lunch');

    expect(onChange).toHaveBeenLastCalledWith('After lunch');
  });

  it('reports an empty string once everything is deleted', async () => {
    const { user, onChange } = renderEditor('Old note');

    await user.clear(editor());

    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('shows text that is set from outside, such as text read from a photo', async () => {
    function Harness() {
      const [value, setValue] = useState('Typed first');
      return (
        <>
          <RichTextEditor id="notes" label="Notes" value={value} onChange={setValue} />
          <button onClick={() => setValue('Typed first<br><br>From the photo')}>Add</button>
        </>
      );
    }
    render(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(editor().innerHTML).toBe('Typed first<br><br>From the photo');
  });

  it('starts at double height and can be resized from the keyboard', async () => {
    const { user } = renderEditor();

    expect(editor()).toHaveStyle({ height: '192px' });
    expect(resizeHandle()).toHaveAttribute('aria-valuenow', '192');

    resizeHandle().focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(editor()).toHaveStyle({ height: '240px' });

    await user.keyboard('{ArrowUp}');
    expect(editor()).toHaveStyle({ height: '216px' });
  });

  it('does not shrink below its minimum height', async () => {
    const { user } = renderEditor();

    resizeHandle().focus();
    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}');

    expect(editor()).toHaveStyle({ height: '96px' });
  });
});
