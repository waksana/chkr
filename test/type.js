var typeChecker = require('../lib/type');

describe('type prepare', function() {

  it('should generate a optional string checker', function() {
    var stringChecker = typeChecker();
    stringChecker.should.be.a.Function;
  });

  it('should cache checker with same config', function() {
    var checker1 = typeChecker({optional: true, regular: /asdf/});
    var checker2 = typeChecker({regular: /asdf/});
    checker1.should.equal(checker2);
  });

  it('should check default value', function() {
    typeChecker.bind(this, {
      type: 'number',
      max: 10,
      defaultValue: 11
    }).should.throwError(/defaultValue/);
  });

});

describe('type checkers', function() {

  it('should check a string by regular', function() {
    var checker = typeChecker({
      optional: false,
      regular: /^apple$/
    });
    checker.bind(this, {field: 'banana'}, 'field').should.throwError(/regular/);
    checker({field: 'apple'}, 'field').should.equal('apple');
  });

  it('should also check a optional number when field has value', function() {
    var checker = typeChecker({
      type: 'number',
      max: 10,
      min: 5
    });
    checker.bind(this, {field: 11}, 'field').should.throwError(/max/);
    checker.bind(this, {field: 3}, 'field').should.throwError(/min/);
    (checker({}, 'field') == undefined).should.be.ok;
    checker({field: '7'}, 'field').should.be.type('number');
  });

  it('should return default value', function() {
    var checker = typeChecker({
      type: 'boolean',
      defaultValue: true
    });

    checker.bind(this, {
      field: 'not true or false'
    }, 'field').should.throw();
    checker({}, 'field').should.equal(true);
  });

  it('should generate data', function() {
    var checker = typeChecker({type: 'date'});
    checker({field: 2014}, 'field').should.be.an.instanceOf(Date);
  });
});
