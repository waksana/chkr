/* eslint-env mocha */

require('should')

const {Or, Const, withSelf, Time, Bool, Num, Str, Obj, Optional} = require('.')

describe('assemble command', () => {

  it('likes a normal fn', () => {
    var rawData = {key: 'va1ue', key2: 'asdf'}
    var checker = Obj({
      key: Str,
      keyDefault: Optional(Str)
    })
    var result = checker.check(rawData)
    result.should.eql({
      key: 'va1ue',
    })
  })

  it('register a type declear object and cache filter', () => {
    Num.check('12').should.eql(12)
  })

  it('get a boolean type', () => {
    Bool.check('true').should.eql(true)
    Bool.check('false').should.eql(false)
  })

  it('transfer to date', () => {
    const time = new Date('2016-02-24').getTime()
    Time.check('2016-02-24').getTime().should.equal(time)
  })

  it('defines a recursive type', () => {
    const Empty = Symbol('Empty')
    const List = withSelf(Self => ValueType => Or(Const(Empty), Obj({head: ValueType, tail: Self})))
    List(Num).check({
      head: 42,
      tail: {
        head: 1,
        tail: Empty
      }
    }).should.eql({
      head: 42,
      tail: {
        head: 1,
        tail: Empty
      }
    })
  })

})
