import { resolveMediaUrl } from '../services/api';

/**
 * Downloads a media file (photo, video, audio track) directly to the user's device.
 * Uses authenticated fetch with Bearer token, streams to a local Blob, and initiates
 * native browser save dialog. This avoids cross-origin download restrictions and 401 Unauthorized errors.
 */
export async function downloadMediaFile(media: {
  id?: string;
  downloadUrl?: string;
  streamUrl?: string;
  originalName?: string;
  title?: string;
  mimeType?: string;
}): Promise<void> {
  const filename = media.originalName || media.title || 'download';
  const token = typeof window !== 'undefined' ? localStorage.getItem('memopix_token') : null;

  // Determine candidate URLs
  const rawUrl = media.downloadUrl || media.streamUrl || '';
  if (!rawUrl) {
    console.error('No download or stream URL available for media', media);
    return;
  }

  const resolved = resolveMediaUrl(rawUrl);

  // If already a local blob or base64 data URI, trigger immediate download
  if (resolved.startsWith('blob:') || resolved.startsWith('data:')) {
    const a = document.createElement('a');
    a.href = resolved;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Build authenticated fetch URL with query token as secondary security layer
  let fetchUrl = resolved;
  if (token && !fetchUrl.includes('token=')) {
    const sep = fetchUrl.includes('?') ? '&' : '?';
    fetchUrl = `${fetchUrl}${sep}token=${encodeURIComponent(token)}`;
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      // If primary download endpoint returned error, attempt fallback to signed streamUrl
      if (media.streamUrl && media.downloadUrl && rawUrl !== media.streamUrl) {
        let streamUrl = resolveMediaUrl(media.streamUrl);
        if (token && !streamUrl.includes('token=')) {
          const sep = streamUrl.includes('?') ? '&' : '?';
          streamUrl = `${streamUrl}${sep}token=${encodeURIComponent(token)}`;
        }
        const streamResp = await fetch(streamUrl, { method: 'GET', headers });
        if (streamResp.ok) {
          const blob = await streamResp.blob();
          triggerBlobSave(blob, filename);
          return;
        }
      }
      throw new Error(`Download response status: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    triggerBlobSave(blob, filename);
  } catch (err) {
    console.warn('Direct blob download failed, falling back to window navigation:', err);
    // Fallback: create temporary <a> tag with target="_blank"
    const fallbackLink = document.createElement('a');
    fallbackLink.href = fetchUrl;
    fallbackLink.download = filename;
    fallbackLink.target = '_blank';
    fallbackLink.rel = 'noopener noreferrer';
    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    document.body.removeChild(fallbackLink);
  }
}

function triggerBlobSave(blob: Blob, filename: string) {
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 20000);
}
