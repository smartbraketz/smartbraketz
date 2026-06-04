const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { url } = req.body;
  if (!url) { res.status(400).json({ error: 'No URL provided' }); return; }

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer', timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SmartBraketz/1.0)' }
    });
    const base64   = Buffer.from(response.data).toString('base64');
    const mimeType = response.headers['content-type'] || 'image/jpeg';
    res.json({ base64, mimeType });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch image: ' + err.message });
  }
};
