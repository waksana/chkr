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

gate.check('field', function(field) {
  if(!('field' in this))
    throw new Error('i need this field');
  if('string' == typeof this.field) {
    if('promise_test' == this.field) {
      var field2 = this.field2;
      return new Promise(function(res, rej) {
        if(field2) {
          res('promise ok');
        }
        else {
          rej(new Error('field not ok'));
        }
      });
    }
    return this.field;
  }
  else if(this.field.toString) {
    return this.field.toString();
  }
  throw new Error('i need this field with type string');
});

gate.route('get /hello/:field', function *(field) {
  return field;
});

gate.route('get /world/:string', function *(string, number, boolean, date) {
  assert('string' == typeof string);
  assert('number' == typeof number);
  assert('boolean' == typeof boolean);
  assert(date instanceof Date);
  return string;
});

gate.check('string', check.string({
  optional: false,
  regular: /^apple$|^banana$/
}));

gate.check('number', check.number({
  defaultValue: 5,
  max: 10,
  min: 0
}));

gate.check('boolean', check.boolean({ optional: false }));

gate.check('date', check.date({optional: false}));
