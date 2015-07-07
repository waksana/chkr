var koa = require('koa');
var Gate = require('./');
var assert = require('assert');

var app = koa();
var gate = new Gate();

app.use(gate.middleware());
app.listen(3000, function() {
  console.log('example start @port 3000');
});

gate.route('get /test/:string', function *(string, number, boolean, date, obj) {
  assert('string' == typeof string);
  assert('number' == typeof number);
  assert('boolean' == typeof boolean);
  assert(date instanceof Date);
  console.log(obj);
  return string;
});

Gate.check('obj', {
  type: 'object',
  field1: {
    optional: false,
    regular: /regularexp/
  },
  command: function(data) {
    //all data
    console.log(data);
    return 'command value';
  },
  cascading: {
    type: 'object',
    field2: {
      optional: false,
      type: 'number'
    },
    command2: function() {
      return new Promise(function(res, rej) {
        res('generate value in promise');
      });
    }
  }
});

Gate.check('string', {
  optional: false,
  regular: /^apple$|^banana$/
});

Gate.check('number', {
  type: 'number',
  defaultValue: 5,
  max: 10,
  min: 0
});

Gate.check('boolean', {
  type: 'boolean',
  optional: false
});

Gate.check('date', {
  type: 'date',
  optional: false
});
