/**
 * Charon API for embedded Auspice/Nextstrain viewer.
 * Serves dataset list and dataset JSON from ./datasets so no separate Auspice server is needed.
 */
const express = require('express');
const compression = require('compression');
const router = express.Router();

// compress all responses from the auspice router, including dataset JSONs
router.use(compression());

const path = require('path');

// Fall back to a bundled default when NEXTSTRAIN_DATASET_DIR is unset (e.g. `node ./bin/p3-web`).
const datasetsPath = process.env.NEXTSTRAIN_DATASET_DIR ||
  path.join(__dirname, '..', 'lib', 'auspice-datasets');

const getDatasetAuspice = require('auspice/cli/server/getDataset').setUpGetDatasetHandler({
  datasetsPath
});

// Normalize prefixes that accidentally include the viewer path.
// Example: prefix="nextstrain-viewer/zika" -> "zika" (getDatasetHelpers reads req.url, so we must rewrite it)
router.get('/getDataset', (req, res, next) => {
  const rawPrefix = req.query && typeof req.query.prefix === 'string' ? req.query.prefix : '';
  if (rawPrefix) {
    // Trim leading/trailing slashes without a backtracking regex (avoids ReDoS)
    let s = 0;
    let e = rawPrefix.length;
    while (s < e && rawPrefix.charCodeAt(s) === 47) s++;
    while (e > s && rawPrefix.charCodeAt(e - 1) === 47) e--;
    let p = rawPrefix.slice(s, e);
    const viewerPrefix = 'nextstrain-viewer/';
    if (p.startsWith(viewerPrefix)) {
      p = p.slice(viewerPrefix.length);
    }
    if (p.split('/').some((seg) => seg === '..')) {
      return res.status(400).type('text/plain').send('Invalid prefix');
    }
    // Rewrite req.url so interpretRequest() sees the correct prefix (it parses req.url, not req.query)
    const q = req.url.indexOf('?') >= 0 ? req.url.slice(req.url.indexOf('?') + 1) : '';
    // Match prefix=... at start of query or after & (query string has no leading ?)
    const newQuery = q.replace(/(^|&)prefix=[^&]*/i, '$1prefix=' + encodeURIComponent(p));
    if (newQuery !== q) {
      req.url = req.url.split('?')[0] + '?' + newQuery;
    }
  }
  return getDatasetAuspice(req, res, next);
});
// Return empty dataset list to hide other options for now
router.get('/getAvailable', (req, res) => {
  res.json({ datasets: [], narratives: [] });
});

router.get('*', (req, res) => {
  // Do not echo req.originalUrl back (reflected XSS); log it, send a static message
  console.error('Auspice charon query unhandled:', req.originalUrl);
  res.status(500).type('text/plain').send('Query unhandled');
});

module.exports = router;
