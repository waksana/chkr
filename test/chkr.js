var chkr = require('..');

describe('add type error', () => {
  it('throw an error when type not ok', () => {
    chkr.type.bind(this, 'not a type').should.throw(/wrong param/);
    chkr.type.bind(this, {'aa-ff': () => 1}).should.throw(/type name/);
    chkr.type.bind(this, {name: 'waksana'}).should.throw(/should be a fn/);
  });
});

describe('assemble command', () => {

  it('likes a normal fn', done => {
    var rawData = {key: 'va1ue', key2: 'asdf'};
    var checker = {
      key: 'string!',
      keyDefault: 'string:ok'
    };
    chkr(checker, rawData).then(result => {
      result.should.eql({
        key: 'va1ue',
        keyDefault: 'ok'
      });
      done();
    }).catch(done);
  });

  it('register a function returns a promise', done => {
    var rawData = {field1: 'value', key: 'va1ue', key2: 'asdf'};

    chkr.type('fun', (value, key, data) => {
      value.should.be.equal('value');
      data.should.be.equal(rawData);
      key.should.be.equal('field1');
      return Promise.resolve('value1');
    });
    chkr.type('passby', value => value);

    const filter = chkr({
        field1: 'fun!',
        key2: 'passby?',
        key3: 'passby?'
    });

    filter(rawData).then(result => {
      result.should.eql({field1: 'value1', key2: 'asdf'});
      done();
    }).catch(done);
  });

  it('register a type declear object and cache filter', done => {
    const filter = chkr({type: 'number!'});
    const check1 = filter({type: "12"}).then(result => {
      result.should.eql({type: 12});
    });
    const check2 = filter({type: "123"}).then(result => {
      result.should.eql({type: 123});
    });
    Promise.all([check1, check2]).then(() => done()).catch(done);
  });

  /*
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
  */
});

describe('assemble error', function() {

  it('thorw an error in type check', function() {
    const filter = chkr({type: 'number!'});
    filter.bind(this, {}).should.throwError(/required/);
  });
  it('throw an error in fun', function() {
    chkr.type('err', () => {throw new Error('test error')});
    const filter = chkr({ errFun: 'err!' });
    filter.bind(this, {errFun: 1}).should.throwError('test error');
  });

  it('can not generate the assemble fun', function() {
    chkr.bind(this, {cmd: null}).should.throwError(/not a regular/);
  });

  it('throw an error when type not accepted', function() {
    chkr.bind(this, {n: 'number:NaN'}).should.throwError('not a number');
    chkr.bind(this, 'number:1').should.throw(/not null object/);
    chkr.bind(this, {n: 'notatype!'}).should.throw();
    chkr.bind(this, {n: 'string?no:'}).should.throw();
    chkr.bind(this, {n: 'boolean!:default'}).should.throw();
    chkr.bind(this, {n: 'boolean?:default'}).should.throw();
    chkr.bind(this, {n: 'number?:bbb'}).should.throw()
  });
});
