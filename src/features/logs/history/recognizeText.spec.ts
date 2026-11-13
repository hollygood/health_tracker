import { describe, expect, it } from 'vitest';
import { cleanRecognizedText } from './recognizeText';

describe('cleanRecognizedText', () => {
  it('trims each line and the whole text', () => {
    expect(cleanRecognizedText('  \n  Amoxicillin 250 mg  \n Take twice daily \n\n')).toBe(
      'Amoxicillin 250 mg\nTake twice daily',
    );
  });

  it('collapses repeated spaces inside a line', () => {
    expect(cleanRecognizedText('Dr.   Smith     Clinic')).toBe('Dr. Smith Clinic');
  });

  it('keeps a single blank line between paragraphs but no more', () => {
    expect(cleanRecognizedText('Visit summary\n\n\n\n\nFollow up in 2 weeks')).toBe(
      'Visit summary\n\nFollow up in 2 weeks',
    );
  });

  it('handles Windows line endings', () => {
    expect(cleanRecognizedText('Line one\r\nLine two\r\n')).toBe('Line one\nLine two');
  });

  it('returns an empty string when nothing was recognised', () => {
    expect(cleanRecognizedText(' \n \n')).toBe('');
  });
});
