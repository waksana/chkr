'use strict'
var _commands = {};
var typeChecker = require('./type.js');
var defaultChecker = typeChecker('string!');

var assemble = module.exports = function(data, commands) {
  return Promise.all(commands.map(function(cmd) {
    var checker = _commands[cmd] || defaultChecker;
    return checker(data, cmd);
  }))
};
assemble.command = function(cmd, checker) {
  if('string' != typeof cmd)
    throw new Error('command field is not a string');
  checker = toFunction(checker);
  if(!checker)
    throw new Error(`${cmd}'s checker is not regular`);
  _commands[cmd] = checker;
};

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
