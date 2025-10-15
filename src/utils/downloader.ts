import axios from 'axios';
import { logger } from './logger.js';

export async function downloadUrl(url: string, maxBytes = 50 * 1024 * 1024) {
  if (!/^https?:\/\//i.test(url)) throw new Error('invalid_url_scheme');
  const visited = new Set<string>();
  let current = url;
  for (let i = 0; i < 5; i++) {
    if (visited.has(current)) throw new Error('redirect_loop');
    visited.add(current);
    const res = await axios.get(current, {
      responseType: 'arraybuffer',
      maxRedirects: 0,
      validateStatus: (s) => s < 400 || s === 301 || s === 302,
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (connector)' }
    });
    if (res.status === 301 || res.status === 302) {
      const loc = res.headers['location'];
      if (!loc) throw new Error('redirect_without_location');
      current = new URL(loc, current).toString();
      continue;
    }
    const len = Number(res.headers['content-length'] || 0);
    if (len > maxBytes) throw new Error('file_too_large');
    const bytes: Buffer = Buffer.from(res.data);
    if (bytes.byteLength > maxBytes) throw new Error('file_too_large');
    const contentType = res.headers['content-type'];
    return { bytes, contentType };
  }
  logger.warn({ url }, 'too_many_redirects');
  throw new Error('too_many_redirects');
}