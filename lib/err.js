
class Err extends Error {
  constructor(value, reason) {
    super();
    this.value = value;
    this.reason = reason;
    this.path = [];
  }

  get message() {
    let p = this.path.reverse().join('');
    return `input${p}=${this.value} ${this.reason}`;
  }

  inspect() {
    return this.stack;
  }

  key(key) {
    this.path.push(`.${key}`);
    return this;
  }

  index(idx) {
    this.path.push(`[${idx}]`);
    return this;
  }
}

module.exports = Err;
