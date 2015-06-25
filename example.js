var koa = require('koa');
var Gate = require('./');

var app = koa();
var gate = new Gate();

app.use(gate.middleware());
app.listen(3000, function() {
  console.log('example start @port 3000');
});

gate.check('field', function() {
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
