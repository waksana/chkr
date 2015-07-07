koa-gate
===

[![npm](https://img.shields.io/npm/v/koa-gate.svg)](https://www.npmjs.com/package/koa-gate) [![Build Status](https://travis-ci.org/waksana/koa-gate.svg)](https://travis-ci.org/waksana/koa-gate) [![Coverage Status](https://coveralls.io/repos/waksana/koa-gate/badge.svg?branch=master)](https://coveralls.io/r/waksana/koa-gate?branch=master)

koa-gate is a middleware for koa

## Installation

```sh
npm install koa-gate
```

## Example

```javascript
var Gate = require('koa-gate');
var gate = new Gate();

gate.check('anything', 'string?');
gate.check('data', 'string!');
gate.check('value', 'number:3');
gate.check('obj', {
  somefield: 'string?',
  otherfield: function(data) {},
  field3: {
    field4: 'number?'
  }
});

gate.route('get /path/to/api/:data', function *(data, anything, value, obj) {
  return 'response ok';
});

app.use(gate.middleware());
```

## API

### gate.route(action, handler);

**action** is a string with an http method and a path

```javascript
'get /path'
'put /path/:var'
```

**handler** is a generator, which handles request, the parameter of the function is parsed by koa-gate

```javascript
function *(param1, param2)
```

### gate.resource(path, controller);

a shortcut of routing an resource which has `create`, `update`, `remove`, `read` and `query` methods. `query` and `create` is routed to collection, other methods is routed to the specified document.

```javascript
var controller = {
  create: function *() {},
  update: function *(documentId) {},
  query: function* () {},
  read: function*(documentId) {}
};
gate.resource('/document/:documentId', controller);

//is the same as

gate.route('post /document', controller.create);
gate.route('put /document/:documentId', controller.update);
gate.route('get /document', controller.update);
gate.route('get /document/:documentId', controller.read);

//remove is not available because there is no remove function in controller
```

### gate.check(field, rule);

koa-gate checks the params of the handler using rule. rule can be:

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

#### function

```javascript
function(data, field)
```

`data` indicates all data passed by request

`field` indicates the field to check

`return` function can return a value and a promise

#### object

every field in the object should be a rule

## Test

```
$ npm test
$ npm run test-cov
```
