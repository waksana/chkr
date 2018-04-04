const c = exports.c = {};
const t = exports.t = {};

const util = require('util');
const id = require('./id');

let assign = Object.assign;

let indent = str => str.replace(/\n/g, '\n  ');

let random = values => values[Math.floor(Math.random() * values.length)];

t.id = id;

t.Null = assign(id.judge(util.isNullOrUndefined, 'is not Null'), {
  show: () => 'Null',
  sample: () => random([null, undefined]),
});

t.Any = assign(id.judge(v => !util.isNullOrUndefined(v), 'is Null'), {
  show: () => 'Any',
  sample: () => random([t.Str, t.Num, t.Bool, t.Date, t.Json]).sample(),
});

c.Or = (...Types) => assign(id.match(value => {
  let ret;
  let errors = [];
  let matchSome = Types.some(Type => {
    try {
      ret = Type(value);
    }
    catch(e) {
      errors.push(e.message);
      return false;
    }
    return true;
  });
  if(matchSome) return ret;
  throw new Error('Or: All' + indent('\n' + errors.join('\n')));
}), {
  show: () => `(${Types.map(Type => Type.show()).join('|')})`,
  sample: () => random(Types).sample(),
});

c.Optional = Type => assign(c.Or(t.Null, Type), {
  show: () => 'Optional ' + Type.show(),
});

c.Default = (Type, defaultValue) => assign(id.match(value => {
  if(util.isNullOrUndefined(value)) return Type(defaultValue);
  return Type(value);
}), {
  show: () => Type.show() + ' Default ' + defaultValue,
  sample: () => random([true, false]) ? defaultValue : Type.sample(),
});

c.Val = value => assign(id.judge(real => real == value, 'is not eq to ' + value), {
  show: () => 'Value ' + value,
  sample: () => value,
});

t.Num = assign(t.Any.judge(v => !isNaN(v) && v !== '', 'is not a Num').match(Number), {
  show: () => 'Num',
  sample: () => random([0, 1, 2, 4, 7, 8, 9, 11.1]),
});

t.Str = assign(t.Any.match(String), {
  show: () => 'Str',
  sample: () => random(['sample string', 'hello world', 'random string']),
});

t.Bool = assign(t.Any.match(value => {
  const boolStr = value.toString();
  if(boolStr === 'true') return true;
  if(boolStr === 'false') return false;
  throw new Error(`\n${value} is not a Bool`);
}), {
  show: () => 'Bool',
  sample: () => random([true, false]),
});

t.Date = assign(t.Any
.match(value => new Date(value))
.judge(v => v.toString() != 'Invalid Date', 'is not a Date'), {
  show: () => 'Date',
  sample: () => new Date(),
});

t.Json = assign(c.Or(
  t.Any.judge(util.isObject, 'is not an Obj'),
  t.Str.match(JSON.parse).judge(v => !util.isNullOrUndefined(v), 'json is null')
), {
  show: () => 'Json',
  sample: () => random([{}, {name: 'wak', age: 18}, [1, 1, 2, 3, 5], []]),
});

t.Obj = assign(t.Json.judge(v => !util.isArray(v), 'is an Arr not an Obj'), {
  show: () => 'Obj',
  sample: () => random([{}, {name: 'object', age: 42}]),
});

t.Arr = assign(t.Json.judge(util.isArray, 'is an Obj not an Arr'), {
  show: () => 'Arr',
  sample: () => random([[1, 1, 2, 3, 5], [], ['a', 'b', 'c']]),
});

c.Map = (ValueType) =>
assign(t.Obj.match(obj => Object.keys(obj).reduce((ret, key) => {
  let newvalue;
  try {
    newvalue = ValueType(obj[key]);
  }
  catch(e) {
    throw new Error(`Map field '${key}'` + indent('\n' + e.message));
  }
  ret[key] = newvalue;
  return ret;
}, {})), {
  show: () => {
    const fields = '  MapKey: ' + indent(ValueType.show());
    return util.format("{\n%s\n}", fields);
  },
  sample: () => ({key: ValueType.sample()}),
});

c.Obj = TypeMap =>
assign(t.Obj.match(obj => Object.keys(TypeMap).reduce((ret, key) => {
  let result;
  try {
    result = TypeMap[key](obj[key]);
    if(!util.isNullOrUndefined(result))
      ret[key] = result;
  }
  catch(e) {
    throw new Error(`Obj field '${key}'` + indent('\n' + e.message));
  }
  return ret;
}, {})), {
  show: () => {
    const fields = Object.keys(TypeMap)
      .map(key => '  ' + key + ': ' + indent(TypeMap[key].show()))
      .join(',\n');
    return util.format("{\n%s\n}", fields);
  },
  sample: () => Object.keys(TypeMap).reduce((ret, key) => {
    ret[key] = TypeMap[key].sample();
    return ret;
  }, {}),
});

c.Arr = Type => assign(t.Arr.match(arr => arr.map((item, i) => {
  let result;
  try {
    result = Type(item);
  }
  catch(e) {
    throw new Error(`Arr field '${i}'` + indent('\n' + e.message));
  }
  return result;
})), {
  show: () => util.format('[%s]', Type.show()),
  sample: () => [Type.sample()]
});
