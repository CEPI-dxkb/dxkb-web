/* eslint-env jest */

'use strict';

var EventEmitter = require('events');
var fs = require('fs');
var os = require('os');
var path = require('path');
var queryLogger = require('../queryLogger');

function runMiddleware(sessionId, token) {
  var req = {
    cookies: { _querylog: sessionId },
    headers: { authorization: token },
    method: 'GET',
    originalUrl: '/genome/?eq(id,1)',
    path: '/genome/',
    query: {},
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
    var appendFile = jest.spyOn(fs, 'appendFile').mockImplementation(function () {});

    runMiddleware('forged-session', 'owner-token');

    expect(appendFile).not.toHaveBeenCalled();
  });

  test('does not append to another owner\'s active session', function () {
    var session = queryLogger.sessionManager.start('test-user', 'owner-token');
    var appendFile = jest.spyOn(fs, 'appendFile').mockImplementation(function () {});

    runMiddleware(session.id, 'attacker-token');

    expect(appendFile).not.toHaveBeenCalled();
  });

  test('logs requests for the owner of a session', function () {
    var session = queryLogger.sessionManager.start('test-user', 'owner-token');
    var appendFile = jest.spyOn(fs, 'appendFile').mockImplementation(function () {});

    expect(session.id).toMatch(/^[a-f0-9]{64}$/);
    expect(session.id).not.toContain('test-user');

    runMiddleware(session.id, 'owner-token');

    expect(appendFile).toHaveBeenCalledWith(
      path.join(logDir, session.filename),
      expect.stringContaining('"path":"/genome/"'),
      expect.any(Function)
    );
  });
});
