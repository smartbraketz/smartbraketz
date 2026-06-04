const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { url } = req.body;
  if (!url) { res.status(400).json({ error: 'No URL provided' }); return; }

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SmartBraketz/1.0)' }
    });
    const $ = cheerio.load(response.data);
    const text     = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 6000);
    const images   = [];
    $('img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) { const abs = src.startsWith('http') ? src : new URL(src, url).href; images.push(abs); }
    });
    const meta    = $('meta[name="description"]').attr('content') || '';
    const title   = $('title').text() || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    const ogDesc  = $('meta[property="og:description"]').attr('content') || '';
    if (ogImage) images.unshift(ogImage);
    res.json({ text, images: images.slice(0, 5), meta, title, ogImage, ogDesc });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch URL: ' + err.message });
  }
};
