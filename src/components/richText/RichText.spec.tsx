import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RichText from './RichText';

const html = (value: string) => render(<RichText value={value} />).container.querySelector('.rich-text')!.innerHTML;

describe('RichText', () => {
  it('shows editor formatting: bold, colour, lists and line breaks', () => {
    const value = 'Give <b>with food</b><br><span style="color: rgb(212, 61, 81);">Watch</span><ul><li>One</li></ul>';

    expect(html(value)).toBe(value);
  });

  it('shows an older plain-text note with its line breaks, escaped', () => {
    expect(html('Temp < 38\nSecond line')).toBe('Temp &lt; 38<br>Second line');
  });

  it('never renders scripts, event handlers or other unsafe markup', () => {
    const { container } = render(
      <RichText value={'<b onclick="alert(1)">Bold</b><img src=x onerror="alert(2)"><script>alert(3)</script>'} />,
    );

    expect(container.querySelector('.rich-text')!.innerHTML).toBe('<b>Bold</b>');
    expect(container.querySelector('script, img, [onclick]')).toBeNull();
  });
});
