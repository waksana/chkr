var typeChecker = require('../lib/type');

describe('type prepare', function() {

  it('should generate a optional string checker', function() {
    var stringChecker = typeChecker('string?');
    stringChecker.should.be.a.Function;
  });

  it('should cache checker with same config', function() {
    var checker1 = typeChecker('string:test');
    var checker2 = typeChecker('string:test');
    checker1.should.equal(checker2);

    //for coverage
    var c3 = typeChecker('string:soooooooooooooooooooooooooooooooooooolong');
    var c4 = typeChecker('string:soooooooooooooooooooooooooooooooooooolong');
    c3.should.equal(c4);
  });

  it('should check default value', function() {
    typeChecker.bind(this, 'number:NaN').should.throwError('not a number');
  });

  it('throw an error when type not accepted', function() {
    typeChecker.bind(this, 'notatype!').should.throw();
    typeChecker.bind(this, 'string?no:').should.throw();
    typeChecker.bind(this, 'boolean!:default').should.throw();
    typeChecker.bind(this, 'boolean?:default').should.throw();
    typeChecker.bind(this, 'number?:bbb').should.throw()
  });

  it('generate a short key when default is too long', function() {
  });
});

describe('type checkers', function() {

  it('can be undefined', function() {
    var checker = typeChecker('number?');
    (checker({}, 'notExist') == undefined).should.be.ok;
  });

  it('should return default value', function() {
    var checker = typeChecker('boolean:true');

    checker.bind(this, {
      field: 'not true or false'
    }, 'field').should.throw();
    checker({}, 'field').should.equal(true);
  });

  it('check boolean in true or false', function() {
    var checker = typeChecker('boolean!');
    checker({field: 'false'}, 'field').should.not.ok;
    checker({field: 'true'}, 'field').should.ok;
    checker.bind(this, {field: 'other'}, 'field').should.throw();
  });

  it('should generate data', function() {
    var checker = typeChecker('date!');
    checker({field: 2014}, 'field').should.be.an.instanceOf(Date);
    checker.bind(this, {
      field: 'not date'
    }, 'field').should.throwError('field is not a datetype');
  });
});
