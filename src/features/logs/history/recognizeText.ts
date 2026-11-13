/**
 * Photo to text, done on the device with Tesseract.js (v7). The photo is not uploaded.
 * The library is imported only when first used, so it stays out of the main bundle.
 */

/** Tidies recognised text: trims each line, drops stray blank runs and edge whitespace. */
export function cleanRecognizedText(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Reads the English text in an image.
 * @param onProgress called with 0 to 1 while the text is being recognised
 */
export async function recognizeText(
  image: File,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, {
    logger: (message) => {
      if (message.status === 'recognizing text') onProgress?.(message.progress);
    },
  });
  try {
    const { data } = await worker.recognize(image);
    return cleanRecognizedText(data.text);
  } finally {
    await worker.terminate();
  }
}
