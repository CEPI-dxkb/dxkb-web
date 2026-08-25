'use strict';

var EventEmitter = require('events');
var fs = require('fs');
var os = require('os');
var path = require('path');
var queryLogger = require('../queryLogger');

function runMiddleware(filename) {
  var req = {
    cookies: { _querylog: filename },
    headers: {},
    method: 'GET',
    originalUrl: '/genome/?eq(id,1)',
    path: '/genome/',
    url: '/genome/?eq(id,1)'
  };
  var res = new EventEmitter();
  res.statusCode = 200;
  res.getHeader = function () { return undefined; };
  res.write = function () {};
  res.end = function () {};

  queryLogger.middleware()(req, res, function () {});
  res.emit('finish');
}

describe('queryLogger middleware', function () {
  var logDir;

  beforeEach(function () {
    logDir = fs.mkdtempSync(path.join(os.tmpdir(), 'query-logger-'));
    queryLogger.sessionManager.init(logDir);
  });

  afterEach(function () {
    jest.restoreAllMocks();
    fs.rmSync(logDir, { recursive: true, force: true });
  });

  test('does not create a log file from a client-controlled cookie', function () {
    var filename = 'forged-session.jsonl';
    var appendFile = jest.spyOn(fs, 'appendFile').mockImplementation(function () {});

    runMiddleware(filename);

    expect(appendFile).not.toHaveBeenCalled();
  });

  test('logs requests for a session created by the session manager', function () {
    var session = queryLogger.sessionManager.start('test-user');
    var appendFile = jest.spyOn(fs, 'appendFile').mockImplementation(function () {});

    runMiddleware(session.filename);

    expect(appendFile).toHaveBeenCalledWith(
      path.join(logDir, session.filename),
      expect.stringContaining('"path":"/genome/"'),
      expect.any(Function)
    );
  });
});
