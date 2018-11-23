/* eslint-env mocha */

const assert = require('assert')
const util = require('util')

const {isEqualType, Func, func, Id, Arr, Null, Any, ArrTuple, Or, Const, withSelf, Kv, Time, Bool, Num, Str, Obj, Optional, mapulate, genMapulate, check, ArrV, ObjV} = require('.')

const throws = Symbol()

function testType(Type, data) {
  return () => {
    let sample = Type.sample()
    assert.deepStrictEqual(check(Type, sample), sample)
    data.forEach(([input, output], i) => {
      if(output === throws) {
        assert.throws(() => check(Type, input), `${util.inspect(Type)} should thorws for ${String(input)} in case ${i}`)
      }
      else {
        assert.deepStrictEqual(check(Type, input), output)
      }
    })
  }
}

describe('Chkr', () => {

  describe('Concrete Type', () => {

    it('Id', testType(Id, [
      [42, 42],
      ['any thing', 'any thing'],
      [undefined, undefined],
      [null, null],
    ]))

    it('Null', testType(Null, [
      [42, throws],
      [undefined, undefined],
      [null, null],
    ]))

    it('Any', testType(Any, [
      [null, throws],
      [undefined, throws],
      ['42', '42'],
      [{a: 1}, {a: 1}]
    ]))

    it('Num', testType(Num, [
      [null, throws],
      [undefined, throws],
      ['wak', throws],
      [[], throws],
      ['', throws],
      [true, throws],
      ['42', 42],
      [42, 42],
    ]))

    it('Str', testType(Str, [
      [null, throws],
      [undefined, throws],
      [[], throws],
      ['', ''],
      [true, throws],
      [42, throws],
      ['wak', 'wak'],
    ]))

    it('Bool', testType(Bool, [
      [true, true],
      [false, false],
      ['false', false],
      ['true', true],
      [0, throws],
      [1, throws],
      ['0', throws],
      ['1', throws],
      [[], throws],
    ]))

    it('Time', testType(Time, [
      [new Date('2018-08-18'), new Date('2018-08-18')],
      [new Date('test'), throws],
      [undefined, throws],
      [null, throws],
      ['2018-08-24T06:39:04.908Z', new Date('2018-08-24T06:39:04.908Z')],
    ]))

    it('ArrV', testType(ArrV, [
      [null, throws],
      [undefined, throws],
      ['', throws],
      [true, throws],
      [42, throws],
      [{}, throws],
      [[], []],
      [[1, 2, 3], [1, 2, 3]],
    ]))

    it('ObjV', testType(ObjV, [
      [null, throws],
      [undefined, throws],
      ['', throws],
      [true, throws],
      [42, throws],
      [[], throws],
      [[1, 2, 3], throws],
      [{}, {}],
      [{a: 1}, {a: 1}],
    ]))
  })

  describe('Type Combinator', () => {

    it('Const', testType(Const(1), [
      [1, 1],
      [2, throws],
      [true, throws],
    ]))

    it('Or', testType(Or(Num, Bool), [
      [true, true],
      [1, 1],
      ['str', throws],
      [undefined, throws],
    ]))

    it('Obj', testType(Obj({n: Num, s: Optional(Str)}), [
      [{n: 2, s: 'wak'}, {n: 2, s: 'wak'}],
      [{n: 2}, {n: 2}],
      [{n: 2, s: 'wak', extra: 'extra'}, {n: 2, s: 'wak'}],
      [{n: '2', s: 'wak'}, {n: 2, s: 'wak'}],
      [{n: 'a', s: 'wak'}, throws],
      [{n: 2, s: 42}, throws],
    ]))

    it('Optional', testType(Optional(Num), [
      [1, 1],
      [undefined, undefined],
      [null, null],
      ['wak', throws],
    ]))

    it('Kv', testType(Kv(Num), [
      [{a: 1, b: 2}, {a: 1, b: 2}],
      [{a: 1, b: '2'}, {a: 1, b: 2}],
      [{a: 1, b: 'a'}, throws],
      [{}, {}],
    ]))

    it('Arr', testType(Arr(Num), [
      [[], []],
      [{}, throws],
      [[1,2,3], [1,2,3]],
      [[1,2,'3'], [1,2,3]],
      [[1,2,'a'], throws],
    ]))

    it('ArrTuple', testType(ArrTuple(Num, Str), [
      [[42, 'waksana'], [42, 'waksana']],
      [['wak', 42], throws],
    ]))

    it('Func', () => {
      let fn = func([Num, Str], () => 'test')
      testType(Func(Num, Str), [
        [fn, fn],
        [() => 'test', throws],
        [func([Str, Num], () => 42), throws],
      ])()
      let fn2 = func([Obj({a: Num, b: Str}), Optional(Str)], () => undefined)
      let fn3 = func([Obj({a: Num, b: Str}), Str], () => undefined)
      let fn4 = func([Num, Num, Num], a => b => a + b)
      testType(Func(Obj({a: Num, b: Str}), Optional(Str)), [
        [fn2, fn2],
        [fn, throws],
        [fn3, throws],
      ])()
      testType(Func(Num, Num, Num), [
        [fn4, fn4],
      ])()

      let objType = Obj({a: Num, b: Str})
      let outputSample = Func(Num, objType).sample()(1)
      assert.deepStrictEqual(check(objType, outputSample), outputSample)
    })
  })

  describe('Recursive Type Def', () => {
    const Empty = Symbol('Empty')
    const List = withSelf(Self => ValueType => Or(Const(Empty), Obj({head: ValueType, tail: Self})))
    it('Defines a recursive type', () => {
      testType(List(Num), [
        [{
          head: 42,
          tail: {
            head: 1,
            tail: Empty
          }
        },{
          head: 42,
          tail: {
            head: 1,
            tail: Empty
          }
        }],
        [Empty, Empty],
        [{head: 42}, throws]
      ])()
    })
    it('stops at depth 2', () => {
      let length = list => list === Empty ? 0 : 1 + length(list.tail)
      for(let i = 0; i < 10; i++) {
        assert(length(List(Num).sample()) < 2)
      }
    })
  })

  describe('Constructor', () => {

    describe('func', () => {


      const rawFn = a => a.toString()

      const numberToString = func([Num, Str], rawFn)
      const map = func([Func(Num, Num), Arr(Num), Arr(Num)], fn => xs => xs.map(fn))
      const add1 = func([Num, Num], a => a + 1)

      it('runs', () => {
        assert.deepStrictEqual(numberToString(12), '12')
        assert.deepStrictEqual(map(add1)([1,2,3]), [2,3,4])
      })

      it('shows signature in inspect', () => {
        assert.deepStrictEqual(util.inspect(numberToString), 'Num -> Str')
        assert.deepStrictEqual(util.inspect(map), '(Num -> Num) -> Arr(Num) -> Arr(Num)')
        assert.deepStrictEqual(util.inspect(map(add1)), 'Arr(Num) -> Arr(Num)')
        assert.deepStrictEqual(numberToString.toString(), rawFn.toString())
      })

      it('throws when input not correct', () => {
        assert.throws(() => {
          numberToString('abc')
        })
      })

      it('correctly handles async function', async () => {
        let utsAsync = func([Num, Str], async a => a.toString())
        let res = await utsAsync(12)

        assert.deepStrictEqual(res, '12')

        let utbAsync = func([Num, Bool], async a => a.toString())

        assert.rejects(utbAsync('12'))
      })

      it('high order', () => {
        let fn = func([Num, Num, Num], a => b => a + b)
        Func(Num, Num, Num).check(fn)
        Func(Num, Num).check(fn(1))
        Num.check(fn(1)(2))

        let map = func([Func(Num, Num), Arr(Num), Arr(Num)], fn => arr => arr.map(fn))
        let add1 = func([Num, Num], a => a + 1)

        Func(Func(Num, Num), Arr(Num), Arr(Num)).check(map)
        Func(Arr(Num), Arr(Num)).check(map(add1))
        check(Arr(Num), map(add1)([1,2,3]))

        let sum = func([Num, Num, Num, Num], a => b => a + b)
        assert.throws(() => Func(Num, Num).check(sum))
        assert.throws(() => sum(1)(2))

      })

      it('high order manually', () => {
        let f0 = func([Num, Num, Num], a => b => a + b)
        let f1 = func([Num, Func(Num, Num)], a => b => a + b)
        let f2 = func([Num, Num, Num], a => func([Num, Num], b => a + b))
        let f3 = func([Num, Func(Num, Num)], a => func([Num, Num], b => a + b))

        let F1 = Func(Num, Num, Num)
        let F2 = Func(Num, Func(Num, Num))

        assert(isEqualType(F1, F2))

        let FTypes = [F1, F2]
        let values = [f0, f1, f2, f3]

        FTypes.forEach(F => {
          values.forEach(f => {
            F.check(f)
          })
        })

        values.forEach(v => {
          assert.equal(v(1)(2), 3)
        })

      })
    })
  })

  describe('iter', () => {
    describe('mapulate', () => {
      it('mapulate value', () => {
        const Add = genMapulate(Num, {
          calculate: (v, context) => v + context
        })
        const calculate = context => mapulate((Type, v) => {
          if(Type.check)
            v = Type.check(v)
          if(Type.calculate)
            v = Type.calculate(v, context)
          return v
        })
        assert.deepStrictEqual(calculate(1)(Add, 4), 5)
        assert.deepStrictEqual(calculate(3)(Arr(Add), [1,2,3]), [4,5,6])
      })
    })
  })
})
