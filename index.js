const util = require('util')

const inspect = util.inspect.custom

const indent = str => '  ' + str.replace(/\n/g, '\n  ')
const random = values => values[Math.floor(Math.random() * values.length)]
const cl = (...fn) => v => fn.reduce((r, f) => f(r), v)

const parse = v => {
  if(!util.isString(v)) return v
  try {
    return JSON.parse(v)
  }
  catch(e) {
    return v
  }
}

const special = str => (depth, opts) => opts.stylize(str[0], 'special')

const judge = (fn, message) => v => {
  if(fn(v)) return v
  throw new Error(message)
}

/*
 * concrete type
 *   will auto parse string
 */

const Id = {
  check: v => v,
  sample: () => 42,
  [inspect]: special`Id`,
}

const Null = {
  check: judge(util.isNullOrUndefined, 'Is Not Null'),
  sample: () => random([null, undefined]),
  [inspect]: special`Null`,
}

const Any = {
  check: judge(v => !util.isNullOrUndefined(v), 'Is Null'),
  sample: () => random([Str, Num, Bool, Time]).sample(),
  [inspect]: special`Any`,
}

const Num = {
  check: cl(parse, judge(v => util.isNumber(v) && !isNaN(v), 'Is Not a Num')),
  sample: () => random([0, 1, 2, 4, 7, 8, 9, 11.1]),
  [inspect]: special`Num`,
}

const Str = {
  check: judge(util.isString, 'Is Not a Str'),
  sample: () => random(['sample string', 'hello world', 'random string']),
  [inspect]: special`Str`,
}

const Bool = {
  check: cl(parse, judge(util.isBoolean, 'Is Not a Bool')),
  sample: () => random([true, false]),
  [inspect]: special`Bool`,
}

const Time = {
  check: cl(v => new Date(v), judge(v => v.toString() !== 'Invalid Date', 'Is Not a Time')),
  sample: () => new Date,
  [inspect]: special`Time`,
}

/*
 * algebra type sys
 */

//1 type
const Const = v => ({
  check: judge(r => r === v, `Is Not Eq To ${v.toString()}`),
  sample: () => v,
  [inspect]: (depth, opts) => opts.stylize(`Const(${util.inspect(v, {depth: depth - 1})})`, 'special'),
})

//Sum Type
const Or = (...Types) => ({
  check: v => {
    let ret
    let errors = []
    let matchSome = Types.some(Type => {
      try {
        ret = Type.check(v)
      }
      catch(e) {
        errors.push(e.message)
        return false
      }
      return true
    })
    if(matchSome) return ret
    throw new Error('All\n' + indent(errors.join('\n')))
  },
  sample: (i) => {
    if(util.isNumber(i))
      return Types[i].sample()
    return random(Types).sample()
  },
  [inspect]: (depth, opts) => {
    let str = `Or(\n${indent(Types.map(Type => util.inspect(Type, {depth: depth - 1})).join(',\n'))}\n)`
    return opts.stylize(str, 'special')
  }
})

//product type
const Obj = TypeMap => ({
  check: cl(parse, judge(util.isObject, 'Is Not an Object'), v => Object.keys(TypeMap).reduce((ret, key) => {
    try {
      let result = TypeMap[key].check(v[key])
      if(!util.isNullOrUndefined(result))
        ret[key] = result
    }
    catch(e) {
      throw new Error(`Field '${key}' ${e.message}`)
    }
    return ret
  }, {})),
  sample: () => Object.keys(TypeMap).reduce((ret, key) => {
    ret[key] = TypeMap[key].sample()
    return ret
  }, {}),
  [inspect]: (depth, opt) => {
    const fields = Object.keys(TypeMap)
      .map(key => `key: ${util.inspect(TypeMap[key], {depth: depth - 1})}`)
      .join(',\n')
    return opt.stylize(`Obj({\n${indent(fields)}\n})`, 'special')
  }
})

/*
 * useful type
 */

const Optional = Type => Object.assign(Or(Null, Type), {
  [inspect]: (depth, opts) => opts.stylize(`Optional(${util.inspect(Type, {depth: depth - 1})})`, 'specal'),
})

/*
 * native higher order types
 */

const Kv = ValueType => ({
  check: cl(parse, judge(util.isObject, 'Is Not an Object'), v => Object.keys(v).reduce((ret, key) => {
    try {
      ret[key] = ValueType.check(v[key])
    }
    catch(e) {
      throw new Error(`Key '${key}' ${e.message}`)
    }
    return ret
  }, {})),
  sample: () => ({key: ValueType.sample()}),
  [inspect]: (depth, opts) => opts.stylize(`Kv(${util.inspect(ValueType, {depth: depth - 1})})`, 'special'),
})

const Arr = Type => ({
  check: cl(parse, judge(util.isArray, 'Is Not an Arr'), v => v.map((item, i) => {
    try {
      return Type.check(item)
    }
    catch(e) {
      throw new Error(`Index ${i} ${e.message}`)
    }
  })),
  sample: () => [Type.sample()],
  [inspect]: (depth, opts) => opts.stylize(`Arr(${util.inspect(Type, {depth: depth - 1})})`, 'special')
})

const ArrTuple = (...Types) => ({
  check: cl(parse, judge(util.isArray, 'Is Not an Arr'), v => Types.map((Type, i) => {
    try {
      return Type.check(v[i])
    }
    catch(e) {
      throw new Error(`Index ${i} ${e.message}`)
    }
  })),
  sample: () => Types.map(Type => Type.sample()),
  [inspect]: (depth, opts) => {
    let str = `ArrTuple(\n${indent(Types.map(Type => util.inspect(Type, {depth: depth - 1})).join(',\n'))}\n)`
    return opts.stylize(str, 'special')
  }
})

//generate recur type
const withSelf = T => (...params) => {
  let Self = {}
  let newType = T(Self)(...params)
  Object.assign(Self, newType, {
    sample: () => newType.sample(0),
    [inspect]: special`Self`,
  })
  return newType
}

module.exports = {Id, Null, Any, Num, Str, Bool, Time, Or, Obj, Const, Optional, Kv, Arr, ArrTuple, withSelf}
