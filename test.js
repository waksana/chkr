/* eslint-env mocha */

const assert = require('assert')
const util = require('util')

const {Id, Arr, Null, Any, ArrTuple, Or, Const, withSelf, Kv, Time, Bool, Num, Str, Obj, Optional, ArrV, ObjV} = require('.')

const throws = Symbol()

function testType(Type, data) {
  return () => {
    let sample = Type.sample()
    assert.deepStrictEqual(Type(sample), sample)
    data.forEach(([input, output], i) => {
      if(output === throws) {
        assert.throws(() => Type(input), `${util.inspect(Type)} should thorws for ${String(input)} in case ${i}`)
      }
      else {
        assert.deepStrictEqual(Type(input), output)
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

  })

  describe('Recursive Type Def', () => {
    const Empty = Symbol('Empty')
    const List = ValueType => withSelf(Self => Or(Const(Empty), Obj({head: ValueType, tail: Self})))
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

})
