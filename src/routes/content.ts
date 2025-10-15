import { Router } from 'express';
import { z } from 'zod';
import FormData from 'form-data';
import axios from 'axios';
import { shopifyGraphQL } from '../shopify/gql.js';
import { downloadUrl } from '../utils/downloader.js';
import { logger } from '../utils/logger.js';

const router = Router();

const FileReq = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(3),
  url: z.string().url().optional(),
  base64: z.string().optional()
}).refine((data) => !!(data.url || data.base64), { message: 'url_or_base64_required' });

router.post('/file', async (req, res) => {
  try {
    const body = FileReq.parse(req.body);

    // get bytes
    let bytes: Buffer;
    if (body.url) {
      const dl = await downloadUrl(body.url);
      bytes = dl.bytes;
    } else {
      bytes = Buffer.from(body.base64!, 'base64');
    }

    // 1) stagedUploadsCreate
    const STAGED = `
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets { url resourceUrl parameters { name value } }
          userErrors { field message }
        }
      }`;
    const input = [{
      resource: "FILE",
      filename: body.filename,
      mimeType: body.mimeType,
      httpMethod: "POST"
    }];
    const staged = await shopifyGraphQL(STAGED, { input });
    const target = staged.stagedUploadsCreate.stagedTargets?.[0];
    const uerr = staged.stagedUploadsCreate.userErrors;
    if (!target || (uerr && uerr.length)) {
      return res.status(400).json({ error: 'staged_upload_failed', detail: uerr });
    }

    // 2) multipart upload to target.url with target.parameters
    const form = new FormData();
    for (const { name, value } of target.parameters) form.append(name, value);
    form.append('file', bytes, { filename: body.filename, contentType: body.mimeType });
    const uploadRes = await axios.post(target.url, form, { headers: form.getHeaders(), maxBodyLength: Infinity });
    if (uploadRes.status >= 400) {
      logger.error({ status: uploadRes.status }, 'staged_upload_http_error');
      return res.status(502).json({ error: 'staged_upload_http_error' });
    }

    // 3) fileCreate to finalize
    const FILE_CREATE = `
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files { id url }
          userErrors { field message }
        }
      }`;
    const filesInput = [{
      contentType: body.mimeType.startsWith('image/') ? 'IMAGE' : 'FILE',
      originalSource: target.resourceUrl,
      filename: body.filename
    }];
    const created = await shopifyGraphQL(FILE_CREATE, { files: filesInput });
    const cerr = created.fileCreate.userErrors;
    const file = created.fileCreate.files?.[0];
    if (!file || (cerr && cerr.length)) {
      return res.status(400).json({ error: 'file_create_failed', detail: cerr });
    }
    return res.json({ fileId: file.id, url: file.url });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'bad_request' });
  }
});

export default router;