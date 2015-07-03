var assemble = require('../lib/assemble');

describe('assemble command', function() {

  it('register a function returns a promise', function(done) {
    var rawData = {key: 'va1ue'};
    assemble.command('fun', function(data, field) {
      field.should.be.equal('fun');
      data.should.be.equal(rawData);
      return Promise.resolve('value1');
    });
    assemble(rawData, ['fun']).then(function(result) {
      result.should.eql(['value1']);
      done();
    });
  });

  it('register a type declear object', function(done) {
    assemble.command('type', {
      type: 'number',
      min: 10,
      max: 20,
      optional: false
    });
    assemble({type: "12"}, ['type']).then(function(result) {
      result.should.eql([12]);
      done();
    });
  });

  it('register a collection of all type', function(done) {
    var rawData = {
      typeField: '1234'
    };
    assemble.command('ever', {
      type: 'object',
      funField: function(data, field) {
        data.should.be.equal(rawData);
        field.should.equal('funField');
        return 'rawFunValue';
      },
      typeField: {
        type: 'number',
        optional: false
      },
      objField: {
        type: 'object',
        typeField2: {
          type: 'boolean',
          defaultValue: true
        },
        funField2: function(data, field) {
          data.should.be.equal(rawData);
          field.should.equal('funField2');
          return Promise.resolve('funValue2');
        }
      }
    });
    assemble(rawData, ['ever']).then(function(result) {
      result.should.eql([{
        funField: 'rawFunValue',
        typeField: 1234,
        objField: {
          typeField2: true,
          funField2: 'funValue2'
        }
      }]);
      done();
    });
  });

});

describe('assemble error', function() {
  it('thorw an error in type check', function() {
    assemble.bind(this, {type: 9}, ['type']).should.throwError(/min/);
  });
  it('throw an error in fun', function() {
    assemble.command('errFun', function() {
      throw new Error('test error');
    });
    assemble.bind(this, {}, ['errFun']).should.throwError('test error');
  });
  it('throw an error in deep', function() {
    assemble.command('errObj', {
      type: 'object',
      errGen: function() {
        throw new Error('test deep error');
      }
    });
    assemble.bind(this, {}, ['errObj']).should.throwError('test deep error');
  });
});
