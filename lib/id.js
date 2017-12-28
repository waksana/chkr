
function match(fn) {
  return extend(value => fn(this(value)));
}

function judge(fn, message) {
  return this.match(value => {
    if(fn(value)) return value;
    throw new Error(message);
  });
}

const extend = type => Object.assign(type, {match, judge});

module.exports = extend(v => v);
