koa-gate
===

koa-gate helps you to build api quickly

```javascript
var Gate = require('koa-gate');
var gate = new Gate();
gate.check('field', function() {
  if(!('field' in this))
    throw new Error('i need this field');
  if('string' == this.field) {
    return this.field;
  }
  else if(this.field.toString) {
    return this.field.toString();
  }
  throw new Error('i need this field with type string');
});

// you can pass arguments with body query or url
gate.route('get /hello/:field', function *(field, field2, whatever) {
  this.body = 'hehe';
});

app.use(gate.middleware());
```
