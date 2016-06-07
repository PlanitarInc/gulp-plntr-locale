# gulp-plntr-locale [![NPM version](https://badge.fury.io/js/gulp-plntr-locale.png)](http://badge.fury.io/js/gulp-plntr-locale) [![Build Status](https://travis-ci.org/PlanitarInc/gulp-plntr-locale.png)](https://travis-ci.org/PlanitarInc/gulp-plntr-locale)

gulp-plntr-locale is a [Gulp](https://github.com/gulpjs/gulp) plugin that
converts YAML localization files to Planitar angular Locale services.
[Gulp is a streaming build system](https://github.com/gulpjs/gulp) utilizing
[node.js](http://nodejs.org/).

## Install

```javascript
npm install --save-dev gulp-plntr-locale
```

## Usage

```js
var plntrLocale = require('gulp-plntr-locale');

gulp.src('./src/**/*.yaml')
  .pipe(plntrLocale())
  .pipe(gulp.dest('./dist/'))
```

## API

### plntrLocale(options)

#### options.moduleName

Type: `String`
Default: `'app.i18n'`

i18n module name.


#### options.extractLanguage

Type: `function|RegExp`
Default: `/[^_]*(?=\.[^.]*$)/` (E.g. extracts `en` from `text_en.yaml`)

A regular expression or a function that returns the processed file's language
according to its file path.
