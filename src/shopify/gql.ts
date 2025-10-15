import axios from 'axios';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

const host = config.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//,'').replace(/\/+$/,'');
const url = `https://${host}/admin/api/2025-07/graphql.json`;

export async function shopifyGraphQL(query: string, variables?: any) {
  try {
    const res = await axios.post(url, { query, variables }, {
      headers: {
        'X-Shopify-Access-Token': config.SHOPIFY_ADMIN_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      maxRedirects: 0,
      validateStatus: (s) => s < 400 || s === 301 || s === 302
    });
    if (res.status === 301 || res.status === 302) {
      const location = res.headers['location'];
      logger.warn({ location }, 'shopify_redirect');
      throw new Error(`shopify_redirect:${location}`);
    }
    if (res.status >= 400) {
      throw new Error(`http_${res.status}`);
    }
    if (res.data.errors) {
      logger.error({ errors: res.data.errors }, 'graphql_errors');
      throw new Error('graphql_errors');
    }
    return res.data.data;
  } catch (err: any) {
    logger.error({ err: err?.message }, 'shopify_graphql_error');
    throw err;
  }
}