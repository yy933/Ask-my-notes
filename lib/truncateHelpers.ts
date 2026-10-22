export function truncateFileName(fileName: string, maxLength: number = 28): string {
  if (fileName.length <= maxLength) return fileName;

  const extIndex = fileName.lastIndexOf('.');
  if (extIndex !== -1 && fileName.length - extIndex <= 8) {
    const ext = fileName.slice(extIndex); // .txt, .pdf
    const nameWithoutExt = fileName.slice(0, extIndex);
    return `${nameWithoutExt.slice(0, maxLength - ext.length - 3)}...${ext}`;
  }

  return `${fileName.slice(0, maxLength - 3)}...`;
}

// Truncate content for documents preview
export function truncateContent(content: string = '', length: number) {
  if (!content) return '';
  if (content.length <= length) {
    return content;
  }

  let truncated = content.slice(0, length);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  if (lastSpaceIndex > length - 25 && lastSpaceIndex > 0) {
    truncated = truncated.slice(0, lastSpaceIndex);
  }

  return truncated.trim() + '......';
}
