const util = require('util')

const inspect = util.inspect.custom

const wrapError = fn => function checker(...p) {
  try {
    return fn(...p)
  }
  catch(e) {
    Error.captureStackTrace(e, checker)
    throw e
  }
}

const indent = str => '  ' + str.replace(/\n/g, '\n  ')
const random = values => values[Math.floor(Math.random() * values.length)]
const cl = (...fn) => wrapError(v => fn.reduce((r, f) => f(r), v))
const check = (Type, value) => Type(value)
const sample = Type => Type.sample()

const not = (fn) => (...p) => {
  let res
  try {
    res = fn(...p)
  }
  catch(e) {
    return e
  }
  throw res
}

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

const judge = (fn, message) => wrapError(v => {
  if(fn(v)) return v
  throw new Error(message)
})

let objReducer = (ret, v, key) => {
  if(!util.isNullOrUndefined(v))
    return Object.assign({[key]: v}, ret)
  return ret
}

let arrReducer = (ret, v) => ret.concat([v])

let strReducer = (ret, v) => `${ret}\n${v}`

/*
 * concrete type
 *   will auto parse string
 */

const Id = Object.assign(v => v, {
  sample: () => 42,
  [inspect]: special`Id`,
})

const Null = Object.assign(judge(util.isNullOrUndefined, 'Is Not Null'), {
  sample: () => random([null, undefined]),
  [inspect]: special`Null`,
})

const Any = Object.assign(judge(v => !util.isNullOrUndefined(v), 'Is Null'), {
  sample: () => random([Str, Num, Bool, Time]).sample(),
  [inspect]: special`Any`,
})

const Num = Object.assign(cl(parse, judge(v => util.isNumber(v) && !isNaN(v), 'Is Not a Num')), {
  sample: () => random([0, 1, 2, 4, 7, 8, 9, 11.1]),
  [inspect]: special`Num`,
})

const Str = Object.assign(judge(util.isString, 'Is Not a Str'), {
  sample: () => random(['sample string', 'hello world', 'random string']),
  [inspect]: special`Str`,
})

const Bool = Object.assign(cl(parse, judge(util.isBoolean, 'Is Not a Bool')), {
  sample: () => random([true, false]),
  [inspect]: special`Bool`,
})

const Time = Object.assign(
  cl(
    judge(v => !util.isNullOrUndefined(v), 'Is Not a Time'),
    v => new Date(v),
    judge(v => v.toString() !== 'Invalid Date', 'Is Not a Time'))
  , {
    sample: () => new Date,
    [inspect]: special`Time`,
  })

const ObjV = Object.assign(
  cl(
    parse,
    judge(util.isObject, 'Is Not an Obj'),
    judge(v => !util.isArray(v), 'Is Not an Obj'))
  , {

    sample: () => ({}),
    [inspect]: special`Obj`,
  })

const ArrV = Object.assign(cl(parse, judge(util.isArray, 'Is Not an Arr')), {
  sample: () => ([]),
  [inspect]: special`Arr`,
})

//1 type
const Const = v => Object.assign(judge(r => r === v, `Is Not Eq To ${v.toString()}`), {
  sample: () => v,
  [inspect]: (depth, opts) => opts.stylize(`Const(${util.inspect(v, {depth: depth - 1})})`, 'special'),
})

const Arr = Type => {

  let fold = mapper => reducer => init => value =>
    ArrV(value).reduce((ret, v, idx) => {
      try {
        let res = mapper(Type, v, idx, value)
        return reducer(ret, res, idx, value)
      }
      catch(e) {
        throw new Error(`Index ${idx} ${e.message}`)
      }
    }, init)

  let map = mapper => fold(mapper)(arrReducer)([])

  return Object.assign(map(check), {
    sample: () => [Type.sample()],
    [inspect]: (depth, opts) => opts.stylize(`Arr(${util.inspect(Type, {depth: depth - 1})})`, 'special'),
  })
}

//Sum Type
const Or = (...Types) => {
  let antiFold = mapper => reducer => init => value =>
    Types.reduce((ret, Type, idx) => {
      let res = mapper(Type, value, idx, value)
      return reducer(ret, res, idx, value)
    }, init)

  let fold = mapper => reducer => init => {
    return not(antiFold(not(mapper))(reducer)(init))
  }

  let map = mapper => fold(mapper)((totalErr, err) => {
    totalErr.message += `\n${indent(err.message)}`
    return totalErr
  })(new Error('All'))

  return Object.assign(map(check), {
    sample: (i) => {
      if(util.isNumber(i))
        return Types[i].sample()
      return random(Types).sample()
    },
    [inspect]: (depth, opt) => {
      let content = antiFold(Type => util.inspect(Type, {depth: depth - 1}))(strReducer)('')()
      return opt.stylize(`Or(${indent(content)})`, 'special')
    },
  })
}

//product type

const Obj = TypeMap => {

  let fold = mapper => reducer => init => value => {
    let v = ObjV(value)
    return Object.keys(TypeMap).reduce((ret, key) => {
      try {
        let res = mapper(TypeMap[key], v[key], key, v)
        return reducer(ret, res, key, v)
      }
      catch(e) {
        throw new Error(`Field '${key}' ${e.message}`)
      }
    }, init)
  }

  let map = mapper => fold(mapper)(objReducer)({})

  return Object.assign(map(check), {
    sample: () => map(sample)({}),
    [inspect]: (depth, opt) => {
      let content = fold((Type, _, key) => `${key}: ${util.inspect(Type, {depth: depth - 1})}`)((ret, str) => `${ret}\n${str}`)('')({})
      return opt.stylize(`Obj({${indent(content)}\n})`, 'special')
    },
  })
}

/*
 * useful type
 */

const Optional = Type => Object.assign(Or(Null, Type), {
  [inspect]: (depth, opts) => opts.stylize(`Optional(${util.inspect(Type, {depth: depth - 1})})`, 'special'),
})

/*
 * native higher order types
 */

const Kv = ValueType => {

  let fold = mapper => reducer => init => value => {
    let v = ObjV(value)
    return Object.keys(v).reduce((ret, key) => {
      try {
        let res = mapper(ValueType, v[key], key, v)
        return reducer(ret, res, key, v)
      }
      catch(e) {
        throw new Error(`Key '${key}' ${e.message}`)
      }
    }, init)
  }

  let map = mapper => fold(mapper)(objReducer)({})

  return Object.assign(map(check), {
    sample: () => ({key: ValueType.sample()}),
    [inspect]: (depth, opts) => opts.stylize(`Kv(${util.inspect(ValueType, {depth: depth - 1})})`, 'special'),
  })
}

const ArrTuple = (...Types) => {

  let fold = mapper => reducer => init => value => {
    let v = ArrV(value)
    return Types.reduce((ret, Type, idx) => {
      try {
        let res = mapper(Type, v[idx], idx, v)
        return reducer(ret, res, idx, v)
      }
      catch(e) {
        throw new Error(`Index ${idx} ${e.message}`)
      }
    }, init)
  }

  let map = mapper => fold(mapper)(arrReducer)([])

  return Object.assign(map(check), {
    sample: () => map(sample)([]),
    [inspect]: (depth, opts) => {
      let content = fold(Type => util.inspect(Type, {depth: depth - 1}))((ret, str) => `${ret}\n${str}`)('')([])
      return opts.stylize(`ArrTuple(${indent(content)}\n)`, 'special')
    },
  })
}

const withSelf = g => (f => f(f))(n => {
  const s = (...p) => n(n)(...p)
  const newType = g(s)
  Object.assign(s, {
    sample: () => newType.sample(0),
    [inspect]: special`Self`
  })
  return newType
})

module.exports = {ObjV, ArrV, Id, Null, Any, Num, Str, Bool, Time, Or, Obj, Const, Optional, Kv, Arr, ArrTuple, withSelf}
