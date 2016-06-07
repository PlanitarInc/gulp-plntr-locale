'use strict';

var path = require('path');
var through = require('through2');
var gutil = require('gulp-util');
var extend = require('object-assign');
var yaml = require('js-yaml');
var BufferStreams = require('bufferstreams');
var jb = require('js-beautify').js_beautify;
var toSingleQuotes = require('to-single-quotes-shahata');
var multiline = require('multiline');

var PLUGIN_NAME = 'plntr-locale';

var templateStr = multiline(function () {/*
'use strict';

angular.module('<%= moduleName %>')
  .service('locale.<%= language %>', function () {
    var locale = <%= text %>;
    return locale;
  });
*/
});

module.exports = function (options) {
  var extractLanguage;

  options = extend({
    moduleName: 'app.i18n',
    extractLanguage: /[^_]*(?=\.[^.]*$)/,
  }, options);

  if (typeof(options.extractLanguage) === 'function') {
    extractLanguage = options.extractLanguage;
  } else {
    extractLanguage = function (filepath) {
      return path.basename(filepath).match(options.extractLanguage)[0];
    };
  }

  return through.obj(function(file, enc, cb) {

    if (file.isBuffer()) {
      if (file.contents.length === 0) {
        this.emit('error', new gutil.PluginError(PLUGIN_NAME,
          'File ' + file.path + ' is empty'));
        return cb();
      }

      try {
        file.contents = createLocaleService(file.contents, {
          file: file,
          moduleName: options.moduleName,
          language: extractLanguage(file.path),
        });
        file.path = gutil.replaceExtension(file.path, '.js');
      } catch (error) {
        this.emit('error', new gutil.PluginError(PLUGIN_NAME,
          error, {showStack: true}));
        return cb();
      }

      this.push(file);
      cb();
      return;
    }

    if (file.isStream()) {
      var _this = this;
      var streamer = new BufferStreams(function(err, buf, cb) {
        if (err) {
          _this.emit('error', new gutil.PluginError(PLUGIN_NAME,
            err, {showStack: true}));
          return;
        }

        if (buf.length === 0) {
          _this.emit('error', new gutil.PluginError(PLUGIN_NAME,
            'File ' + file.path + ' is empty'));
          return;
        }

        try {
          var parsed = createLocaleService(buf, {
            file: file,
            moduleName: options.moduleName,
            language: extractLanguage(file.path),
          });
          file.path = gutil.replaceExtension(file.path, '.js');
          cb(null, parsed);
        } catch (error) {
          _this.emit('error', new gutil.PluginError(PLUGIN_NAME,
            error, {showStack: true}));
          return;
        }
      });

      file.contents = file.contents.pipe(streamer);

      this.push(file);
      cb();
      return;
    }

    this.push(file);
    cb();
  });
};

function createLocaleService(buffer, options) {
  var obj = yaml.safeLoad(buffer.toString('utf8'));

  var src = gutil.template(templateStr, extend(options, {
    text: toSingleQuotes(JSON.stringify(obj)),
  }));

  return new Buffer(jb(src, {'indent_size': 2, 'jslint_happy': true}));
}
