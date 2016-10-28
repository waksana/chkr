var format = require('util').format;

class Err extends Error {
  constructor(value, message) {
    super(message);
    this.value = value;
    this.path = [];
  }

  key(key) {
    this.path.push(format('.%s', key));
    this.message = this.inspect();
    return this;
  }

  index(idx) {
    this.path.push(format('[%s]', idx));
    this.message = this.inspect();
    return this;
  }

  inspect() {
    return format('%s=%s %s', this.path.reverse().join(''), this.value, this.message);
  }
}

module.exports = Err;
