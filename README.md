# chkr

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

### Type(t)

t has some basic type. every type is a fuction to judge/transform the input value and returns the transformed value or throw an error if the input value is not the required type.

- `t.Null` null or undefined
- `t.Any` any thing but not `t.Null`
- `t.Num` input a number or a string consist of only digits will output a exact number
- `t.Str` any thing will transfer to string //not good?
- `t.Bool` true or 'true' to true, false or 'false' to false, number, object... throws
- `t.Date` Date or any thing can be transfered into Date by new Date
- `t.Json` Object or Array or a json string which can be parse into an Object or Array
- `t.Obj` an object or a json string
- `t.Arr` an array or a json string
- `t.Fn` function

### Combine(c)

c is some thing you give them some value or type, they will generate a new type for you

- `c.Val` accept a value then generate a type has only one value
- `c.Or` accept some types returns a type which can be all the given types
- `c.Optional` make type optional
- `c.Map` accept two types key type and value type to generate a key value paire object type
- `c.Obj` accept an object indicate an object has some key with some type
- `c.Arr` Array of a type

## Test

```
$ npm test
$ npm run test-cov
```
