var chkr = require('../lib/chkr');

describe('assemble command', () => {

  it('register a function returns a promise, and apply default', done => {
    var rawData = {key: 'va1ue', key2: 'asdf'};
    const filter = chkr({
      fun: (data, field) => {
        field.should.be.equal('fun');
        data.should.be.equal(rawData);
        return Promise.resolve('value1');
      }
    });
    filter(['fun', 'key2'], rawData).then(result => {
      result.should.eql({fun: 'value1', key2: 'asdf'});
      done();
    });
  });

  it('register a type declear object and cache filter', done => {
    const filter = chkr({type: 'number!'});
    const cur = filter(['type']);
    const check1 = cur({type: "12"}).then(result => {
      result.should.eql({type: 12});
    });
    const check2 = cur({type: "123"}).then(result => {
      result.should.eql({type: 123});
    });
    Promise.all([check1, check2]).then(() => done());
  });

  it('register a collection of all type', function(done) {
    const rawData = {typeField: '1234'};
    const filter = chkr({
      ever: {
        funField: function(data, field) {
          data.should.be.equal(rawData);
          field.should.equal('funField');
          return 'rawFunValue';
        },
        typeField: 'number!',
        objField: {
          typeField2: 'boolean:true',
          funField2: function(data, field) {
            data.should.be.equal(rawData);
            field.should.equal('funField2');
            return Promise.resolve('funValue2');
          }
        }
      }
    });
    filter(['ever'], rawData).then(result => {
      result.should.eql({
        ever: {
          funField: 'rawFunValue',
          typeField: 1234,
          objField: {
            typeField2: true,
            funField2: 'funValue2'
          }
        }
      });
      done();
    });
  });
});

describe('assemble error', function() {
  it('thorw an error in type check', function() {
    const filter = chkr({type: 'number!'});
    filter.bind(this, ['type'], {}).should.throwError(/required/);
  });
  it('throw an error in fun', function() {
    const filter = chkr({
      errFun: function() {
        throw new Error('test error');
      }
    });
    filter.bind(this, ['errFun'], {}).should.throwError('test error');
  });
  it('throw an error in deep', function() {
    const filter = chkr({
      errObj: {
        errGen: function() {
          throw new Error('test deep error');
        }
      }
    });
    filter.bind(this, ['errObj'], {}).should.throwError('test deep error');
  });

  it('can not generate the assemble fun', function() {
    chkr.bind(this, {cmd: null}).should.throwError(/not regular/);
    chkr.bind(this, {cmd: {nullField: null}}).should.throwError(/not regular/);
  });
});
