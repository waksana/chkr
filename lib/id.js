var Err = require('./err');

function match(fn) {
  return extend(value => {
    try {
      var res = fn(this(value))
      return res;
    }
    catch(e) {
      if(e instanceof Err)
        throw e;
      else
        throw new Err(value, e.message);
    }
  });
}

function judge(fn, message) {
  return this.match(value => {
    if(fn(value)) return value;
    throw new Err(value, message);
  });
}

function called(fn) {
  if('string' == typeof fn)
    this.show = () => fn;
  else
    this.show = fn;
  return this;
}

function extend(type) {
  type.match = match;
  type.judge = judge;
  type.called = called;
  return type;
}

module.exports = extend(v => v);
