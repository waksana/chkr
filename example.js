var koa = require('koa');
var Gate = require('./');
var check = Gate.check;
var assert = require('assert');

var app = koa();
var gate = new Gate();

app.use(gate.middleware());
app.listen(3000, function() {
  console.log('example start @port 3000');
});


gate.route('get /world/:string', function *(string, number, boolean, date) {
  assert('string' == typeof string);
  assert('number' == typeof number);
  assert('boolean' == typeof boolean);
  assert(date instanceof Date);
  return string;
});

gate.check('string', check({
  optional: false,
  regular: /^apple$|^banana$/
}));

gate.check('number', check({
  type: 'number',
  defaultValue: 5,
  max: 10,
  min: 0
}));

gate.check('boolean', check({
  type: 'boolean',
  optional: false
}));

gate.check('date', check({
  type: 'date',
  optional: false
}));
