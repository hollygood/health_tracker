import { toRichHtml } from './richTextFormat';

interface Props {
  /** A stored note: plain text or editor HTML. */
  value: string;
  className?: string;
}

/** Shows a note with its formatting (bold, colour, lists, line breaks). */
export default function RichText({ value, className = '' }: Props) {
  return (
    <div
      className={`rich-text break-words ${className}`}
      // Safe: toRichHtml escapes plain text and rebuilds HTML from an allow-list.
      dangerouslySetInnerHTML={{ __html: toRichHtml(value) }}
    />
  );
}
