const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Route: scrape a URL and return page text + any image URLs
app.post('/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SmartBraketz/1.0)' }
    });

    const $ = cheerio.load(response.data);

    // Pull page text
    const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 6000);

    // Pull images
    const images = [];
    $('img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) {
        const abs = src.startsWith('http') ? src : new URL(src, url).href;
        images.push(abs);
      }
    });

    // Pull meta description
    const meta = $('meta[name="description"]').attr('content') || '';
    const title = $('title').text() || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    const ogDesc = $('meta[property="og:description"]').attr('content') || '';

    if (ogImage) images.unshift(ogImage);

    res.json({ text, images: images.slice(0, 5), meta, title, ogImage, ogDesc });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch URL: ' + err.message });
  }
});

// Route: fetch an image and return it as base64
app.post('/fetch-image', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SmartBraketz/1.0)' }
    });
    const base64 = Buffer.from(response.data).toString('base64');
    const mimeType = response.headers['content-type'] || 'image/jpeg';
    res.json({ base64, mimeType });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch image: ' + err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Smart Braketz server running at http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT}/index.html in your browser`);
});
