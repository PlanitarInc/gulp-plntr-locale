/* jshint node: true */
/* global describe, it, beforeEach */
'use strict';

var plntrLocale = require('../');
var assert = require('assert');
var gutil = require('gulp-util');
var path = require('path');
var es = require('event-stream');
var File = require('vinyl');
var multiline = require('multiline');
var Readable = require('stream').Readable;
require('mocha');

describe('gulp-plntr-locale', function () {

  describe('in buffer mode', function () {

    var _createFile = function (contents, filename) {
      if (typeof contents === 'string') {
        contents = Buffer.from(contents, 'utf8');
      } else if (Array.isArray(contents)) {
        contents = Buffer.from(contents.join('\n'), 'utf8');
      }
      return new File({
        cwd: './',
        base: './test/',
        path: './test/' + (filename || 'mock.yml'),
        contents: contents
      });
    };

    var _fileContents = function (file) {
      return file.contents ? file.contents.toString('utf8') : null;
    };

    it('default settings', function (done) {
      var stream = plntrLocale();

      stream.once('data', function (file) {
        assert.equal(file.extname, '.js');
        assert.equal(_fileContents(file), multiline(function () {/*
'use strict';

angular.module('app.i18n')
  .service('locale.foo', function () {
    var locale = {
      'a': 'b',
      'c': {
        'x': 'd',
        'y': 'e'
      }
    };
    return locale;
  });
*/
        }));
        done();
      });

      stream.write(_createFile([
        'a: b',
        'c:',
        '  x: d',
        '  y: e',
      ], 'messages_foo.js'));
      stream.end();
    });

    it('custom settings', function (done) {
      var stream = plntrLocale({
        moduleName: 'moda',
        extractLanguage: function (filepath) {
          return '__' + path.basename(filepath) + '__';
        },
      });

      stream.once('data', function (file) {
        assert.equal(file.extname, '.js');
        assert.equal(_fileContents(file), multiline(function () {/*
'use strict';

angular.module('moda')
  .service('locale.__messages_foo.js__', function () {
    var locale = {
      'a': 'b',
      'c': {
        'x': 'd',
        'y': 'e'
      }
    };
    return locale;
  });
*/
        }));
        done();
      });

      stream.write(_createFile([
        'a: b',
        'c:',
        '  x: d',
        '  y: e',
      ], 'messages_foo.js'));
      stream.end();
    });

    it('should throw if empty file', function (done) {
      var stream = plntrLocale();

      stream.once('error', function(err) {
        assert.ok(err instanceof gutil.PluginError);
        done();
      });

      stream.write(_createFile(''));
      stream.end();
    });

    it('should throw if not well formatted', function (done) {
      var stream = plntrLocale();

      stream.once('error', function(err) {
        assert.ok(err instanceof gutil.PluginError);
        done();
      });

      stream.write(_createFile([
        '$',
        'missing:',
        '  something?'
      ]));
      stream.end();
    });

    it('should use safe loading by default', function(done) {
      var stream = plntrLocale({safe: true});

      stream.once('error', function(err) {
        assert.ok(err instanceof gutil.PluginError);
        done();
      });

      stream.write(_createFile('"toString": !<tag:yaml.org,2002:js/function> "function (){very_evil_thing();}"'));
      stream.end();
    });

  });

  describe('in stream mode', function() {

    var _createFile = function(callback, filename) {
      if (arguments.length === 1) {
        callback = arguments[0];
        filename = null;
      }
      var stream = new Readable();
      stream._read = function() {
        callback.apply(this, arguments);
        this.push(null);
      };
      return new File({
        cwd: './',
        base: './test/',
        path: './test/' + (filename || 'mock.yml'),
        contents: stream
      });
    };

    it('default settings', function (done) {
      var stream = plntrLocale();

      stream.once('data', function (file) {
        file.contents.pipe(es.wait(function (err, data) {
          assert.equal(file.extname, '.js');
          assert.equal(data.toString('utf8'), multiline(function () {/*
'use strict';

angular.module('app.i18n')
  .service('locale.foo', function () {
    var locale = {
      'a': 'b',
      'c': {
        'x': 'd',
        'y': 'e'
      }
    };
    return locale;
  });
*/
          }));
          done();
        }));
      });

      stream.write(_createFile(function () {
        this.push('a: b\n');
        this.push('c:\n');
        this.push('  x: d\n');
        this.push('  y: e\n');
      }, 'messages_foo.js'));
      stream.end();
    });

    it('custom settings', function (done) {
      var stream = plntrLocale({
        moduleName: 'moda',
        extractLanguage: function (filepath) {
          return '__' + path.basename(filepath) + '__';
        },
      });

      stream.once('data', function (file) {
        file.contents.pipe(es.wait(function (err, data) {
          assert.equal(file.extname, '.js');
          assert.equal(data.toString('utf8'), multiline(function () {/*
'use strict';

angular.module('moda')
  .service('locale.__messages_foo.js__', function () {
    var locale = {
      'a': 'b',
      'c': {
        'x': 'd',
        'y': 'e'
      }
    };
    return locale;
  });
*/
          }));
          done();
        }));
      });

      stream.write(_createFile(function () {
        this.push('a: b\n');
        this.push('c:\n');
        this.push('  x: d\n');
        this.push('  y: e\n');
      }, 'messages_foo.js'));
      stream.end();
    });

    it('should throw if empty file', function (done) {
      var stream = plntrLocale();

      stream.once('error', function (err) {
        assert.ok(err instanceof gutil.PluginError);
        done();
      });

      stream.write(_createFile(function() { }));
      stream.end();
    });

    it('should throw if not well formatted', function (done) {
      var stream = plntrLocale();

      stream.once('error', function (err) {
        assert.ok(err instanceof gutil.PluginError);
        done();
      });

      stream.write(_createFile(function () {
        this.push('$\n');
        this.push('missing:\n');
        this.push('  something?\n');
      }));
      stream.end();
    });

    it('should throw if loading untrusted document with safe option enabled', function (done) {
      var stream = plntrLocale({safe: true});

      stream.once('error', function (err) {
        assert.ok(err instanceof gutil.PluginError);
        done();
      });

      stream.write(_createFile(function () {
        this.push('"toString": !<tag:yaml.org,2002:js/function> "function (){very_evil_thing();}"');
      }));
      stream.end();
    });

    it('should use safe loading by default', function (done) {
      var stream = plntrLocale();

      stream.once('error', function (err) {
        assert.ok(err instanceof gutil.PluginError);
        done();
      });

      stream.write(_createFile(function () {
        this.push('"toString": !<tag:yaml.org,2002:js/function> "function (){very_evil_thing();}"');
      }));
      stream.end();
    });

  });

});
