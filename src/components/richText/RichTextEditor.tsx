import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent, type PointerEvent } from 'react';
import { FaBold, FaEraser, FaGripLines, FaItalic, FaListUl, FaUnderline } from 'react-icons/fa6';
import { plainTextToHtml, richToPlainText, sanitizeHtml, toRichHtml } from './richTextFormat';

interface Props {
  id: string;
  label: string;
  /** Stored note: plain text or editor HTML. */
  value: string;
  /** Called with the editor's HTML, or an empty string when it holds no text. */
  onChange: (html: string) => void;
}

const DEFAULT_HEIGHT = 192;
const MIN_HEIGHT = 96;
const MAX_HEIGHT = 720;
const KEY_STEP = 24;

type Command = 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'removeFormat';

const FORMATS: { command: Command; label: string; Icon: typeof FaBold; toggles: boolean }[] = [
  { command: 'bold', label: 'Bold', Icon: FaBold, toggles: true },
  { command: 'italic', label: 'Italic', Icon: FaItalic, toggles: true },
  { command: 'underline', label: 'Underline', Icon: FaUnderline, toggles: true },
  { command: 'insertUnorderedList', label: 'Bulleted list', Icon: FaListUl, toggles: true },
  { command: 'removeFormat', label: 'Clear formatting', Icon: FaEraser, toggles: false },
];

/** Text colours offered. The first is the normal text colour. */
const COLORS = [
  { name: 'Default', value: '#232446' },
  { name: 'Red', value: '#d43d51' },
  { name: 'Orange', value: '#b25400' },
  { name: 'Green', value: '#17804c' },
  { name: 'Blue', value: '#2e6fd0' },
  { name: 'Purple', value: '#5b54e8' },
] as const;

const TOOL = 'grid size-10 flex-none place-items-center rounded-lg text-muted';

// Editing commands are a browser feature (and absent in the test environment).
const canFormat = () => typeof document.execCommand === 'function';
const run = (command: string, value?: string) => {
  if (canFormat()) document.execCommand(command, false, value);
};

/**
 * A small notes editor: bold, italic, underline, bulleted list, text colour.
 * The box starts twice the height of a plain notes field and can be dragged taller.
 */
export default function RichTextEditor({ id, label, value, onChange }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  /** The last value this editor reported, to tell our own changes from outside ones. */
  const lastEmitted = useRef<string | null>(null);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [active, setActive] = useState<Partial<Record<Command, boolean>>>({});
  const dragStart = useRef<{ y: number; height: number } | null>(null);

  // Load the value on mount, and whenever it is changed from outside (e.g. text from a photo).
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || value === lastEmitted.current) return;
    editor.innerHTML = toRichHtml(value);
    lastEmitted.current = value;
  }, [value]);

  const emit = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const html = richToPlainText(editor.innerHTML) === '' ? '' : editor.innerHTML;
    lastEmitted.current = html;
    onChange(html);
  };

  const refreshActive = () => {
    if (!canFormat() || typeof document.queryCommandState !== 'function') return;
    setActive(
      Object.fromEntries(
        FORMATS.filter((f) => f.toggles).map((f) => [f.command, document.queryCommandState(f.command)]),
      ),
    );
  };

  const apply = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    // Plain <b>/<i>/<u>/<font color> rather than inline styles: simpler to store and check.
    run('styleWithCSS', 'false');
    run(command, commandValue);
    emit();
    refreshActive();
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    if (!canFormat()) return;
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    run('insertHTML', html ? sanitizeHtml(html) : plainTextToHtml(text));
    emit();
  };

  const handleDragStart = (e: PointerEvent<HTMLDivElement>) => {
    dragStart.current = { y: e.clientY, height };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const handleDragMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const next = dragStart.current.height + (e.clientY - dragStart.current.y);
    setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, next)));
  };
  const handleDragEnd = () => {
    dragStart.current = null;
  };
  const handleResizeKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const change = e.key === 'ArrowDown' ? KEY_STEP : -KEY_STEP;
    setHeight((h) => Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, h + change)));
  };

  return (
    <div className="field">
      <span className="field-label" id={`${id}-label`} onClick={() => editorRef.current?.focus()}>
        {label}
      </span>

      <div className="rounded-xl border-[1.5px] border-line bg-surface focus-within:border-accent">
        <div
          className="flex flex-wrap items-center gap-0.5 border-b border-line px-1.5 py-1"
          role="toolbar"
          aria-label={`${label} formatting`}
        >
          {FORMATS.map(({ command, label: name, Icon, toggles }) => (
            <button
              key={command}
              type="button"
              className={`${TOOL} ${active[command] ? 'bg-accent-soft text-accent' : ''}`}
              aria-label={name}
              aria-pressed={toggles ? Boolean(active[command]) : undefined}
              // Keep the text selection: a normal click would move focus to the button first.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => apply(command)}
            >
              <Icon aria-hidden="true" />
            </button>
          ))}
          <span className="mx-1 h-6 w-px flex-none bg-line" aria-hidden="true" />
          {COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              className={TOOL}
              aria-label={`${color.name} text`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => apply('foreColor', color.value)}
            >
              <span
                className="size-5 rounded-full border border-line"
                style={{ backgroundColor: color.value }}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>

        <div
          ref={editorRef}
          id={id}
          className="rich-text overflow-y-auto px-3.5 py-3 text-lg break-words outline-none"
          style={{ height }}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-labelledby={`${id}-label`}
          onInput={emit}
          onPaste={handlePaste}
          onKeyUp={refreshActive}
          onMouseUp={refreshActive}
          onFocus={refreshActive}
        />

        <div
          className="flex h-6 cursor-ns-resize touch-none items-center justify-center border-t border-line text-muted"
          role="separator"
          aria-orientation="horizontal"
          aria-label={`Resize the ${label.toLowerCase()} box`}
          aria-valuenow={height}
          aria-valuemin={MIN_HEIGHT}
          aria-valuemax={MAX_HEIGHT}
          tabIndex={0}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          onKeyDown={handleResizeKey}
        >
          <FaGripLines aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
