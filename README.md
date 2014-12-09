kao
===

Koa is Awesome Oh yeah

```javascript
var Kao = require('kao');
var k = new Kao();
k.check('field', function() {
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
k.route('get /hello/:field', function *(field, field2, whatever) {
  this.body = 'hehe';
});

app.use(k.middleware());
```
