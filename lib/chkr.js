'use strict'
var typeChecker = require('./type.js');
var defaultChecker = typeChecker('string!');
var gali = require('gali');

module.exports = gali(function(rule) {
  var _rule = {};
  Object.keys(rule).forEach(key => {
    _rule[key] = toFunction(rule[key]);
    if(!_rule[key])
      throw new Error(`${key} checker is not regular`);
  });
  return _rule;
}, null, function(rule, filter, data) {
  return Promise.all(filter.map(f => {
    const checker = rule[f] || defaultChecker;
    return checker(data, f);
  })).then(ans => {
    var res = {};
    filter.forEach((f, i) => {
      res[f] = ans[i];
    });
    return res;
  });
});

function toFunction(checker) {
  var checkerType = typeof(checker);
  switch(typeof(checker)) {
    case 'function': return checker;
    case 'string': return typeChecker(checker);
    case 'object': if(checker == null) return false;
  }
  var funObj = {};
  var finished = Object.keys(checker).every(function(key) {
    return funObj[key] = toFunction(checker[key]);
  });
  if(!finished) return false;
  return actor(funObj);
}

function actor(funObj) {
  var fields = Object.keys(funObj);
  return function(data) {
    return Promise.all(fields.map(function(field) {
      return funObj[field](data, field)
    })).then(function(values) {
      var result = {};
      values.forEach(function(value, index) {
        result[fields[index]] = value;
      });
      return result;
    });
  };
}
