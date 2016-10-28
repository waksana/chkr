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
const {t, c} = require('chkr');
t.Num(1) //==> 1
t.Num('1') //===> 1
t.Num('a') //throws error
c.Optional(t.Num)() //===> undefined
c.Arr(t.Num)([1,2,3]) //===> [1,2,3]
```

## API

## Test

```
$ npm test
$ npm run test-cov
```
