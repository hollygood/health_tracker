import { describe, expect, it } from 'vitest';
import {
  appendPlainText,
  looksLikeHtml,
  normalizeRich,
  plainTextToHtml,
  richToOneLine,
  richToPlainText,
  sanitizeHtml,
  toRichHtml,
} from './richTextFormat';

describe('looksLikeHtml', () => {
  it('recognises editor output', () => {
    expect(looksLikeHtml('Given <b>with food</b>')).toBe(true);
    expect(looksLikeHtml('Line one<br>Line two')).toBe(true);
    expect(looksLikeHtml('<div>Paragraph</div>')).toBe(true);
  });

  it('treats ordinary notes as plain text, even with a less-than sign', () => {
    expect(looksLikeHtml('After lunch')).toBe(false);
    expect(looksLikeHtml('Temp < 38 and weight > 10')).toBe(false);
    expect(looksLikeHtml('')).toBe(false);
  });
});

describe('plainTextToHtml', () => {
  it('escapes characters and keeps line breaks', () => {
    expect(plainTextToHtml('Temp < 38 & "fine"\nSecond line')).toBe(
      'Temp &lt; 38 &amp; &quot;fine&quot;<br>Second line',
    );
  });
});

describe('sanitizeHtml', () => {
  it('keeps bold, italic, underline, lists and line breaks', () => {
    const html = '<div><b>Bold</b> <i>italic</i> <u>under</u></div><ul><li>One</li><li>Two</li></ul>Line<br>break';

    expect(sanitizeHtml(html)).toBe(html);
  });

  it('keeps a safe text colour and stores <font color> as a span', () => {
    expect(sanitizeHtml('<span style="color: rgb(212, 61, 81);">Red</span>')).toBe(
      '<span style="color: rgb(212, 61, 81);">Red</span>',
    );
    expect(sanitizeHtml('<font color="#d43d51">Red</font>')).toMatch(
      /^<span style="color: (#d43d51|rgb\(212, 61, 81\));">Red<\/span>$/,
    );
  });

  it('removes scripts and their contents', () => {
    expect(sanitizeHtml('Hello<script>alert(1)</script> there')).toBe('Hello there');
    expect(sanitizeHtml('<style>body{display:none}</style>Text')).toBe('Text');
  });

  it('removes event handlers and every other attribute', () => {
    expect(sanitizeHtml('<b onclick="alert(1)" class="x" id="y">Bold</b>')).toBe('<b>Bold</b>');
    expect(sanitizeHtml('<div style="position:fixed;background:url(javascript:alert(1))">Text</div>')).toBe(
      '<div>Text</div>',
    );
  });

  it('unwraps elements that are not allowed but keeps their text', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">link</a> and <img src=x onerror="alert(1)"><h1>Title</h1>')).toBe(
      'link and Title',
    );
    expect(sanitizeHtml('<iframe src="https://example.com"></iframe>after')).toBe('after');
  });

  it('rejects a colour that is not a plain colour value', () => {
    expect(sanitizeHtml('<span style="color: expression(alert(1))">x</span>')).toBe('<span>x</span>');
    expect(sanitizeHtml('<font color="url(javascript:alert(1))">x</font>')).toBe('<span>x</span>');
  });
});

describe('toRichHtml', () => {
  it('escapes plain text and sanitises HTML', () => {
    expect(toRichHtml('5 < 6\nnext')).toBe('5 &lt; 6<br>next');
    expect(toRichHtml('<b>Bold</b><script>alert(1)</script>')).toBe('<b>Bold</b>');
  });
});

describe('richToPlainText', () => {
  it('returns plain text unchanged', () => {
    expect(richToPlainText('  After lunch\nwith water ')).toBe('After lunch\nwith water');
  });

  it('turns blocks and line breaks into new lines', () => {
    expect(richToPlainText('<div>First</div><div>Second</div>Third<br>Fourth')).toBe(
      'First\nSecond\nThird\nFourth',
    );
  });

  it('keeps a deliberate blank line', () => {
    expect(richToPlainText('<div>First</div><div><br></div><div>Third</div>')).toBe('First\n\nThird');
  });

  it('marks list items', () => {
    expect(richToPlainText('Bring:<ul><li>Health card</li><li><b>Vaccine</b> record</li></ul>')).toBe(
      'Bring:\n- Health card\n- Vaccine record',
    );
  });

  it('drops formatting but keeps the words', () => {
    expect(richToPlainText('Give <b>with</b> <span style="color: rgb(212, 61, 81);">food</span>')).toBe(
      'Give with food',
    );
  });

  it('flattens to one line for list rows and exports', () => {
    expect(richToOneLine('<div>First</div><div>Second</div>')).toBe('First Second');
    expect(richToOneLine('One\n\nTwo')).toBe('One Two');
  });
});

describe('normalizeRich', () => {
  it('stores nothing when there is no visible text', () => {
    expect(normalizeRich('')).toBe('');
    expect(normalizeRich('   ')).toBe('');
    expect(normalizeRich('<div><br></div>')).toBe('');
    expect(normalizeRich('<b></b>')).toBe('');
  });

  it('trims plain text and sanitises HTML', () => {
    expect(normalizeRich('  After lunch ')).toBe('After lunch');
    expect(normalizeRich('<b onclick="x()">Bold</b>')).toBe('<b>Bold</b>');
  });
});

describe('appendPlainText', () => {
  it('uses the text alone when nothing was written yet', () => {
    expect(appendPlainText('', 'Line one\nLine two')).toBe('Line one<br>Line two');
    expect(appendPlainText('<div><br></div>', 'Text')).toBe('Text');
  });

  it('adds the text below what is already there, keeping its formatting', () => {
    expect(appendPlainText('Seen for <b>ear pain</b>.', 'Follow up in 2 weeks')).toBe(
      'Seen for <b>ear pain</b>.<br><br>Follow up in 2 weeks',
    );
    expect(appendPlainText('Typed first', 'A < B')).toBe('Typed first<br><br>A &lt; B');
  });
});
