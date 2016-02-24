chkr
===

[![npm](https://img.shields.io/npm/v/chkr.svg)](https://www.npmjs.com/package/chkr) [![Build Status](https://travis-ci.org/waksana/chkr.svg)](https://travis-ci.org/waksana/chkr) [![Coverage Status](https://coveralls.io/repos/waksana/chkr/badge.svg?branch=master)](https://coveralls.io/r/waksana/chkr?branch=master)

chkr is a field checker

## Installation

```sh
npm install chkr
```

## Example

```javascript
var chkr = require('chkr');

const rule = {
  string: 'string!',
  number: 'number:5',
  bool: 'boolean!',
  date: 'date?'
};

const data = {
  string: 'hello world',
  number: '123',
  bool: 'true'
};

chkr(urle, data).then(res => {
  //res is an object contain only the fields listed above
});
```

## API

### chkr(rule, data);

also `chkr(rule)(data)`

chkr checks object fields using rule object. rule can be:

#### string

a type string consists 3 parts

1. **type** should be one of `string`, `number`, `date` and `boolean`
2. **optional** `!` indicate the field is required, `?` indicate the field is optional, and `:` indicate the field is required and has a default value
3. default value

here is some legal example

```
'string!'
'number?'
'date:2015/07/07'
'boolean:false'
```

## Test

```
$ npm test
$ npm run test-cov
```
