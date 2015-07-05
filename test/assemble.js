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
    assemble.command('type', 'number!');
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
      funField: function(data, field) {
        data.should.be.equal(rawData);
        field.should.equal('funField');
        return 'rawFunValue';
      },
      typeField: 'number!',
      objField: {
        typeField2: 'boolean!:true',
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
    assemble.bind(this, {}, ['type']).should.throwError(/required/);
  });
  it('throw an error in fun', function() {
    assemble.command('errFun', function() {
      throw new Error('test error');
    });
    assemble.bind(this, {}, ['errFun']).should.throwError('test error');
  });
  it('throw an error in deep', function() {
    assemble.command('errObj', {
      errGen: function() {
        throw new Error('test deep error');
      }
    });
    assemble.bind(this, {}, ['errObj']).should.throwError('test deep error');
  });

  it('can not generate the assemble fun', function() {
    assemble.command.bind(this, {}, 'string!').should.throwError(/command/);
    assemble.command.bind(this, 'cmd', null).should.throwError(/not regular/);
    assemble.command.bind(this, 'cmd2', {
      nullField: null
    }).should.throwError(/not regular/);
  });
});
