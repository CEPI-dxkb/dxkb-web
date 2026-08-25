'use strict';

var express = require('express');
var axios = require('axios');
var config = require('../config');

function parseUsernameFromToken(token) {
  if (!token) return null;
  var parts = token.split('|');
  for (var i = 0; i < parts.length; i++) {
    if (parts[i].indexOf('un=') === 0) {
      return parts[i].slice(3);
    }
  }
  return null;
}

module.exports = function (sessionManager) {
  var router = express.Router();

  router.use(express.json());

  router.post('/start', async function (req, res, next) {
    var token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    var username;
    try {
      var accountURL = config.get('accountURL').replace(/\/+$/, '');
      var response = await axios.get(accountURL + '/authenticate/refresh/', {
        headers: {
          authorization: token,
          accept: 'text/plain'
        }
      });
      username = parseUsernameFromToken(response.data);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    if (!username) {
      return res.status(401).json({ error: 'Could not determine authenticated username' });
    }

    try {
      var result = sessionManager.start(username);
      res.cookie('_querylog', result.filename, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax'
      });
      return res.json({ status: 'started', filename: result.filename });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/stop', function (req, res) {
    res.clearCookie('_querylog', { path: '/' });
    res.json({ status: 'stopped' });
  });

  router.get('/status', function (req, res) {
    var filename = req.cookies && req.cookies._querylog;
    if (!filename || !sessionManager.isActive(filename)) {
      res.clearCookie('_querylog', { path: '/' });
      return res.json({ active: false });
    }

    res.json({ active: true, filename: filename });
  });

  return router;
};
