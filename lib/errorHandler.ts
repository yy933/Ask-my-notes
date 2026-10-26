export function getFriendlyErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An unknown system error occured. Please try again later.';
  }

  const msg = error.message;

  // 1. Common error mapping
  const errorMappings = [
    {
      keywords: ['RESOURCE_EXHAUSTED', 'quota', '429'],
      friendly: 'Current quota exceeded. Please try again later.',
    },
    {
      keywords: ['API_KEY', 'unauthenticated', '401', '403'],
      friendly: 'Access denied. Please contact admin.',
    },
    {
      keywords: ['File size exceeds', 'payload too large', '413'],
      friendly: 'File size exceeds.  Please reduce file size and try again.',
    },
    {
      keywords: ['Unsupported file format', 'Invalid PDF'],
      friendly: 'Unsupported format. Currently only PDF and txt files are supported.',
    },
    {
      keywords: ['fetch failed', 'network', 'timeout'],
      friendly: 'Network error. Please try again.',
    },
  ];

  // 2. Mapping the keywords
  for (const mapping of errorMappings) {
    if (mapping.keywords.some((kw) => msg.includes(kw))) {
      return mapping.friendly;
    }
  }

  // 3. If no keywords matched, return a general error message.

  if (msg.length < 100 && !msg.includes('{') && !msg.includes('at ')) {
    return msg;
  }

  return 'Unexpected error occured. Please try again later.';
}
