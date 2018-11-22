const util = require('util')

const inspect = util.inspect.custom
const chkr = Symbol('chkr')
const chkrFn = Symbol('chkrFn')

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

const func = (Types, fn) => {
  let funcType = Func(...Types)
  if(fn[chkrFn])
    return funcType.check(fn)

  const wrappedFn = (input, ...params) => {
    let checkedInput
    try {
      checkedInput = funcType[chkr].Input.check(input)
    }
    catch(e) {
      let err = new Error(`Input of (${util.inspect(wrappedFn)}) ${e.message}`)
      Error.captureStackTrace(err, wrappedFn)
      throw err
    }
    const res = fn(checkedInput, ...params)
    if(util.isFunction(res)) {
      return func([funcType[chkr].Output], res)
    }
    else if(res instanceof Promise)
      return res.then(funcType[chkr].Output.check).catch(err => {
        Error.captureStackTrace(err, wrappedFn)
        throw err
      })
    else {
      try {
        return funcType[chkr].Output.check(res)
      }
      catch(e) {
        let err = new Error(`Output of (${util.inspect(wrappedFn)}) ${e.message}`)
        Error.captureStackTrace(err, wrappedFn)
        throw err
      }
    }
  }

  wrappedFn[chkrFn] = funcType
  wrappedFn[inspect] = (depth, opts) =>
    opts.stylize(util.inspect(wrappedFn[chkrFn]), 'special')
  wrappedFn.toString = () => fn.toString()
  return wrappedFn
}

/*
 * concrete type
 *   will auto parse string
 */

const Id = {
  id: Symbol('Id'),
  check: v => v,
  sample: () => 42,
  [inspect]: special`Id`,
  [chkr]: true,
}

const Null = {
  id: Symbol('Null'),
  check: judge(util.isNullOrUndefined, 'Is Not Null'),
  sample: () => random([null, undefined]),
  [inspect]: special`Null`,
  [chkr]: true,
}

const Any = {
  id: Symbol('Any'),
  check: judge(v => !util.isNullOrUndefined(v), 'Is Null'),
  sample: () => random([Str, Num, Bool, Time]).sample(),
  [inspect]: special`Any`,
  [chkr]: true,
}

const Num = {
  id: Symbol('Num'),
  check: cl(parse, judge(v => util.isNumber(v) && !isNaN(v), 'Is Not a Num')),
  sample: () => random([0, 1, 2, 4, 7, 8, 9, 11.1]),
  [inspect]: special`Num`,
  [chkr]: true,
}

const Str = {
  id: Symbol('Str'),
  check: judge(util.isString, 'Is Not a Str'),
  sample: () => random(['sample string', 'hello world', 'random string']),
  [inspect]: special`Str`,
  [chkr]: true,
}

const Bool = {
  id: Symbol('Bool'),
  check: cl(parse, judge(util.isBoolean, 'Is Not a Bool')),
  sample: () => random([true, false]),
  [inspect]: special`Bool`,
  [chkr]: true,
}

const Time = {
  id: Symbol('Time'),
  check: cl(judge(v => !util.isNullOrUndefined(v), 'Is Not a Time'), v => new Date(v), judge(v => v.toString() !== 'Invalid Date', 'Is Not a Time')),
  sample: () => new Date,
  [inspect]: special`Time`,
  [chkr]: true,
}

const ObjV = {
  id: Symbol('ObjV'),
  check: cl(parse, judge(util.isObject, 'Is Not an Obj')),
  sample: () => ({}),
  [inspect]: special`Obj`,
  [chkr]: true,
}

const ArrV = {
  id: Symbol('ArrV'),
  check: cl(parse, judge(util.isArray, 'Is Not an Arr')),
  sample: () => ([]),
  [inspect]: special`Arr`,
  [chkr]: true,
}

//1 type
const Const = v => ({
  id: Symbol(String(v)),
  check: judge(r => r === v, `Is Not Eq To ${v.toString()}`),
  sample: () => v,
  [inspect]: (depth, opts) => opts.stylize(`Const(${util.inspect(v, {depth: depth - 1})})`, 'special'),
  [chkr]: true,
})

const Arr = Type => {

  let fold = mapper => reducer => init => value =>
    check(ArrV, value).reduce((ret, v, idx) => {
      try {
        let res = mapper(Type, v, idx, value)
        return reducer(ret, res, idx, value)
      }
      catch(e) {
        throw new Error(`Index ${idx} ${e.message}`)
      }
    }, init)

  let map = mapper => fold(mapper)((arr, item) => arr.concat(item))([])

  return {
    fold,
    id: [ArrV.id, Type.id],
    check: map(check),
    sample: () => [Type.sample()],
    [inspect]: (depth, opts) => opts.stylize(`Arr(${util.inspect(Type, {depth: depth - 1})})`, 'special'),
    [chkr]: true,
  }
}

//Sum Type
const OrSymbol = Symbol('Or')
const Or = (...Types) => {
  let antiFold = mapper => reducer => init => value =>
    Types.reduce((ret, Type, idx) => {
      let res = mapper(Type, value, idx, value)
      return reducer(ret, res, idx, value)
    }, init)

  let antiMap = mapper => antiFold(mapper)((ret, res) => ret.concat(res))([])

  let fold = mapper => reducer => init => {
    return not(antiFold(not(mapper))(reducer)(init))
  }

  return {
    fold,
    id: [OrSymbol, antiMap(Type => Type.id)()],
    check: fold(check)(errors => error => `${errors}\n${error.message}`)('All'),
    sample: (i) => {
      if(util.isNumber(i))
        return Types[i].sample()
      return random(Types).sample()
    },
    [inspect]: (depth, opt) => {
      let content = antiFold(Type => util.inspect(Type, {depth: depth - 1}))(ret => str => `${ret}\n${str}`)('')()
      return opt.stylize(`Obj({${indent(content)}\n})`, 'special')
    },
    [chkr]: true,
  }
}

//product type

const Obj = TypeMap => {
  let fold = mapper => reducer => init => value => {
    let v = check(ObjV, value)
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

  let map = mapper =>
    fold(mapper)((ret, v, key) => {
      if(!util.isNullOrUndefined(v))
        return Object.assign({[key]: v}, ret)
      return ret
    })({})

  return {
    fold,
    id: [ObjV.id, map(Type => Type.id)({})],
    check: map(check),
    sample: () => map(sample)({}),
    [inspect]: (depth, opt) => {
      let content = fold(Type => (_, key) => `${key}: ${util.inspect(Type, {depth: depth - 1})}`)(ret => str => `${ret}\n${str}`)('')({})
      return opt.stylize(`Obj({${indent(content)}\n})`, 'special')
    },
    [chkr]: true,
  }
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
    let v = check(ObjV, value)
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

  let map = mapper =>
    fold(mapper)((ret, v, key) => {
      if(!util.isNullOrUndefined(v))
        return Object.assign({[key]: v}, ret)
      return ret
    })({})

  return {
    fold,
    id: [ObjV.id, ValueType.id],
    check: map(check),
    sample: () => ({key: ValueType.sample()}),
    [inspect]: (depth, opts) => opts.stylize(`Kv(${util.inspect(ValueType, {depth: depth - 1})})`, 'special'),
    [chkr]: true,
  }
}

const ArrTupleSymbol = Symbol('ArrTuple')
const ArrTuple = (...Types) => {

  let fold = mapper => reducer => init => value => {
    let v = check(Arr, value)
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

  let map = mapper => fold(mapper)((ret, res) => ret.concat(res))([])

  return {
    fold,
    id: [ArrTupleSymbol, map(Type => Type.id)([])],
    check: map(check),
    sample: () => map(sample)([]),
    [inspect]: (depth, opts) => {
      let content = fold(Type => util.inspect(Type, {depth: depth - 1}))((ret, str) => `${ret}\n${str}`)('')([])
      return opts.stylize(`ArrTuple(${indent(content)}\n)`, 'special')
    },
    [chkr]: true,
  }
}

const FunSymbol = Symbol('Func')
const Func = (...Types) => {

  if(Types.length == 1) {
    return judge(isType, 'Is Not a ChkrType')(Types[0])
  }

  let Input, Output
  if(Types.length == 2) {
    [Input, Output] = Types
  }
  else {
    let LeftTypes
    [Input, ...LeftTypes] = Types
    Output = Func(...LeftTypes)
  }

  return {
    id: [FunSymbol, Input.id, Output.id],
    check: cl(
      judge(util.isFunction, 'Is Not a Func'),
      judge(v => !!v[chkrFn], 'Is Not a Func'),
      judge(v => isEqualType(v[chkrFn][chkr].Input, Input), `Input Is Not ${util.inspect(Input)}`),
      judge(v => isEqualType(v[chkrFn][chkr].Output, Output), `Output Is Not ${util.inspect(Output)}`)),
    sample: () => func([Input, Output], () => Output.sample()),
    [inspect]: (d, opts) => {
      let depth = d - 1
      let inputStr
      if(isFunc(Input))
        inputStr = `(${util.inspect(Input, {depth})})`
      else
        inputStr = util.inspect(Input, {depth})
      return opts.stylize(`${inputStr} -> ${util.inspect(Output, {depth})}`, 'special')
    },
    [chkr]: {Input, Output},
  }
}

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

const isFunc = Type => Type.id && Type.id[0] === FunSymbol
const isType = Type => !!(Type && Type[chkr])
const isEqualType = (T1, T2) => isType(T1) && isType(T2) && util.isDeepStrictEqual(T1.id, T2.id)

const check = (Type, v) => Type.check(v)
const sample = Type => Type.sample()

module.exports = {Id, Null, Any, Num, Str, Bool, Time, Or, Obj, Const, Optional, Kv, Arr, ArrTuple, Func, func, withSelf, isType, isEqualType, check }
