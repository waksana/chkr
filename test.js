require('should');

const {c, t} = require('./lib');

describe('assemble command', () => {

  it('likes a normal fn', () => {
    var rawData = {key: 'va1ue', key2: 'asdf'};
    var checker = c.Obj({
      key: t.Str,
      keyDefault: c.Default(t.Str, 'ok')
    });
    var result = checker(rawData);
    result.should.eql({
      key: 'va1ue',
      keyDefault: 'ok'
    });
  });

  it('register a type declear object and cache filter', () => {
    t.Num.should.throw();
    t.Num('12').should.eql(12);
  });

  it('get a boolean type', () => {
    t.Bool('true').should.eql(true);
    t.Bool('false').should.eql(false);
  });

  it('transfer to date', () => {
    const time = new Date('2016-02-24').getTime();
    t.Date('2016-02-24').getTime().should.equal(time);
  });

});
