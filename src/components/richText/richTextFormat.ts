/**
 * Rich text for notes: a small, safe subset of HTML (bold, italic, underline, lists,
 * line breaks and text colour).
 *
 * Stored values are strings. Older notes are plain text; newer ones are HTML written by
 * the editor. Anything shown as HTML goes through `sanitizeHtml` first, because a value
 * can also arrive from a pasted clipboard or a restored backup file.
 */

/** Elements that are kept. Everything else is unwrapped (its text stays) or dropped. */
const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'BR', 'DIV', 'P', 'SPAN', 'UL', 'OL', 'LI']);
/** Elements removed together with everything inside them. */
const DROPPED_TAGS = new Set([
  'SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'NOSCRIPT', 'TEMPLATE',
  'SVG', 'MATH', 'HEAD', 'TITLE', 'TEXTAREA', 'SELECT', 'BUTTON', 'FORM',
]);
const BLOCK_TAGS = new Set(['DIV', 'P', 'UL', 'OL', 'LI']);
/** The only colour formats accepted: #rgb, #rrggbb, rgb(r, g, b). */
const SAFE_COLOR = /^(#[0-9a-f]{3}|#[0-9a-f]{6}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))$/i;

/** True when the value contains an HTML tag, i.e. it was written by the editor. */
export const looksLikeHtml = (value: string) => /<\/?[a-z][a-z0-9]*(\s[^<>]*)?\/?>/i.test(value);

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Plain text as HTML: characters escaped, line breaks kept. */
export const plainTextToHtml = (text: string) => escapeHtml(text).replace(/\r?\n/g, '<br>');

function safeColor(element: Element): string | null {
  const fromStyle = (element as HTMLElement).style?.color ?? '';
  const color = (fromStyle || element.getAttribute('color') || '').trim();
  return SAFE_COLOR.test(color) ? color : null;
}

/** Rebuilds the allowed parts of `source` inside `target`. Nothing is copied as-is. */
function copySafeNodes(source: Node, target: Node): void {
  source.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      target.appendChild(document.createTextNode(child.textContent ?? ''));
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return; // comments etc.

    const element = child as Element;
    const tag = element.tagName.toUpperCase();
    if (DROPPED_TAGS.has(tag)) return;

    // <font color> is what browsers produce for text colour; store it as a span.
    const keptTag = tag === 'FONT' ? 'SPAN' : tag;
    if (!ALLOWED_TAGS.has(keptTag)) {
      copySafeNodes(element, target); // keep the text, lose the element
      return;
    }

    const clean = document.createElement(keptTag.toLowerCase());
    const color = safeColor(element);
    if (color) clean.style.color = color;
    copySafeNodes(element, clean);
    target.appendChild(clean);
  });
}

/** Returns HTML containing only the allowed elements, with no attributes except a text colour. */
export function sanitizeHtml(html: string): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const container = document.createElement('div');
  copySafeNodes(parsed.body, container);
  return container.innerHTML;
}

/** Any stored value as safe HTML, ready to display or load into the editor. */
export const toRichHtml = (value: string) =>
  looksLikeHtml(value) ? sanitizeHtml(value) : plainTextToHtml(value);

/** Marks the edge of a block (div, p, li...): a line break, unless one is already there. */
const BLOCK_EDGE = '\u0000';

function collectText(node: Node, out: string[]): void {
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out.push(child.textContent ?? '');
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const tag = (child as Element).tagName.toUpperCase();
    if (tag === 'BR') {
      out.push('\n');
      return;
    }
    const block = BLOCK_TAGS.has(tag);
    if (block) out.push(BLOCK_EDGE);
    if (tag === 'LI') out.push('- ');
    collectText(child, out);
    if (block) out.push(BLOCK_EDGE);
  });
}

/** A stored value as plain text, with line breaks, for summaries and exports. */
export function richToPlainText(value: string): string {
  if (!looksLikeHtml(value)) return value.trim();
  const parsed = new DOMParser().parseFromString(sanitizeHtml(value), 'text/html');
  const out: string[] = [];
  collectText(parsed.body, out);
  return out
    .join('')
    .replace(/\u00a0/g, ' ')
    .replace(/\n?\u0000+/g, '\n') // neighbouring block edges make one line break
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** A stored value on one line, for list rows and export lines. */
export const richToOneLine = (value: string) => richToPlainText(value).replace(/\s*\n+\s*/g, ' ');

/** The value to store: sanitised, or an empty string when there is no visible text. */
export function normalizeRich(value: string): string {
  if (richToPlainText(value) === '') return '';
  return looksLikeHtml(value) ? sanitizeHtml(value) : value.trim();
}

/** Adds plain text (e.g. from a photo) below what is already written. */
export function appendPlainText(current: string, text: string): string {
  const addition = plainTextToHtml(text);
  if (richToPlainText(current) === '') return addition;
  return `${toRichHtml(current)}<br><br>${addition}`;
}
