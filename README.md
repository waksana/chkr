# chkr

[![npm](https://img.shields.io/npm/v/chkr.svg)](https://www.npmjs.com/package/chkr) [![Build Status](https://travis-ci.org/waksana/chkr.svg)](https://travis-ci.org/waksana/chkr) [![Coverage Status](https://coveralls.io/repos/github/waksana/chkr/badge.svg?branch=master)](https://coveralls.io/github/waksana/chkr?branch=master)

chkr is a field checker

## Installation

```sh
npm install chkr
```

## Example

```javascript
const {func, Num, Optional, Arr, Str, Bool} = require('chkr');

//function with signature
const add1 = func([Num, Num], n => n + 1)

//curry
const add = func([Num, Num, Num], a => b => a + b)

//simple type check
Num.check(1) //==> 1
Num.check('1') //throws error
Num.check('a') //throws error

//type combination
Optional(Num).check() //===> undefined
Arr(Num).check([1,2,3]) //===> [1,2,3]

console.log(Obj({
  user: Str,
  age: Num,
  isAdmin: Bool,
  pages: Arr(Str)
}).sample())
```

## API

### Type

a type is a js object with `check` and `sample` as it's method. it's `inspect` symbol is customized to show the infomation of itself.

#### `.check`

the `check` method checks and parse the input value and returns then transformed value or throw an error if the input value is not the required type

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
- `Func` a Function with input and output signature

### Recursive Type Def

recursive type is supported using a fn `withSelf`. you can use this to define an `List`

```javascript
const List = withSelf(Self => ValueType => Or(Const(Empty), Obj({head: ValueType, tail: Self})))
const NumList = List(Num)
```

### Constructor

`func` is a function with signature, when using func you can check function with `Func`

```javascript
let fn = func([Num, Str], () => 'res')
let NumToStr = Func(Num, Str)
NumToStr.check(fn) //checked!

/* high order */
let sum = func([Num, Num, Num], a => b => a + b)
sum(1)(2) === 3
```

## Test

```
$ npm test
$ npm run test-cov
```

## Lab

### Context

`Type.check` with `context` as second parameter. It provids a runtime context

### Transform

transform a Type
