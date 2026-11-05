import { getDownloadUrl } from '@/app/actions/download';
export const handleDownload = async (fileUrl: string, fileName: string) => {
  try {
    // Get temporary download url from server
    const result = await getDownloadUrl(fileUrl);
    if (!result.success || !result.signedUrl) {
      throw new Error(result.message);
    }

    // Get signed url and download
    const response = await fetch(result.signedUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download failed:', error);
    alert('Failed to download file securely.');
  }
};
