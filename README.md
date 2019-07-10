# chkr

[![npm](https://img.shields.io/npm/v/chkr.svg)](https://www.npmjs.com/package/chkr) [![Build Status](https://travis-ci.org/waksana/chkr.svg)](https://travis-ci.org/waksana/chkr) [![Coverage Status](https://coveralls.io/repos/github/waksana/chkr/badge.svg?branch=master)](https://coveralls.io/github/waksana/chkr?branch=master)

js type check

## Installation

```sh
npm install chkr
```

## Example

```javascript
const {Num, Optional, Arr, Str, Bool} = require('chkr');

//simple type check
Num(1) //==> 1
Num('1') //throws error
Num('a') //throws error

//type combination
Optional(Num)(undefined) //===> undefined
Arr(Num)([1,2,3]) //===> [1,2,3]

console.log(Obj({
  user: Str,
  age: Num,
  isAdmin: Bool,
  pages: Arr(Str)
}).sample())
```

## API

### Type

a type is a js function with `sample` as it's method. it's `inspect` symbol is customized to show the infomation of itself.

#### `Type()`

type function checks and parse the input value and returns then transformed value or throw an error if the input value is not the required type

#### `.sample`

`sample` method returns a sample data of a type

### Concrete Type

- `Id` any type
- `Null` null or undefined
- `Any` any thing but not `Null`
- `Num` input a number or a string consist of only digits will output a exact number
- `Str` any thing will transfer to string
- `Bool` true or 'true' to true, false or 'false' to false, number, object... throws
- `Time` Date or any thing can be transfered into Date by `new Date`

### Type Combinator

- `Const` a type with only one value (1)
- `Or` accept some types returns a type which can be all the given types (+)
- `Obj` accept an object indicate an object has some key with some type (\*)
- `Optional` make type optional (Null + Type)
- `Kv` accept a type called value type to generate a key value paire object type
- `Arr` Array of a type

### Recursive Type Def

recursive type is supported using a fn `withSelf`. you can use this to define an `List`

```javascript
const List = ValueType => withSelf(Self => Or(Const(Empty), Obj({head: ValueType, tail: Self})))
const NumList = List(Num)
```

## Test

```
$ npm test
$ npm run test-cov
```
