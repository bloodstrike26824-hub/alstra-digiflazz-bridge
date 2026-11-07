import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

export default async function handler(req, res) {
  // Hanya izinkan method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Pengaman: cegah orang asing nebeng proxy / saldo lu
  const clientSecret = req.headers['x-bridge-secret'];
  const expectedSecret = process.env.BRIDGE_SECRET;
  if (expectedSecret && clientSecret !== expectedSecret) {
    return res.status(401).json({ message: 'Unauthorized bridge request' });
  }

  const { endpoint, body } = req.body || {};
  if (!endpoint) {
    return res.status(400).json({ message: 'Missing endpoint (contoh: transaction, cek-saldo)' });
  }

  // Ambil URL proxy dari env Vercel
  const proxyUrl = process.env.WEBSHARE_PROXY_URL || 'http://ahleziim:tb3qi6151xhj@45.38.107.97:6014';
  const agent = new HttpsProxyAgent(proxyUrl);

  try {
    const targetUrl = `https://api.digiflazz.com/v1/${endpoint.replace(/^\//, '')}`;
    const digiRes = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      agent,
      timeout: 30000,
    });

    const data = await digiRes.json().catch(() => null);
    return res.status(digiRes.status).json({
      ok: digiRes.ok,
      status: digiRes.status,
      data: data?.data ?? data,
    });
  } catch (error) {
    return res.status(502).json({
      ok: false,
      message: `Gagal meneruskan ke Digiflazz lewat proxy: ${error.message}`,
    });
  }
}
