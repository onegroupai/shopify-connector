import 'dotenv/config';
import { z } from 'zod';

const Env = z.object({
  PORT: z.coerce.number().default(8080),
  CONNECTOR_API_KEY: z.string().min(8, 'CONNECTOR_API_KEY missing'),
  SHOPIFY_STORE_DOMAIN: z.string().regex(/^[a-z0-9-]+\.myshopify\.com$/i, 'Use your myshopify.com domain'),
  SHOPIFY_ADMIN_TOKEN: z.string().startsWith('shpat_', 'SHOPIFY_ADMIN_TOKEN must start with shpat_'),
});

export const config = Env.parse(process.env);