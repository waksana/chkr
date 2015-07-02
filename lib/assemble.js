var _commands = {};
var typeChecker = require('./type.js');
var defaultChecker = typeChecker({optional: false});

var assemble = module.exports = function(data, commands) {
  return Pormise.all(commands.map(function(cmd) {
    var checker = _commands[cmd] || defaultChecker;
    return checker(data, cmd);
  }))
};
assemble.command = function(cmd, checker) {
  checker = toFunction(checker);
  if(!checker)
    throw new Error(cmd + '\'s checker is not regular');
  _commands[cmd] = checker;
};

function toFunction(checker) {
  if('function' == typeof checker)
    return checker;
  if('object' != typeof(checker) || checker == null)
    return false;
  if(checker.type != 'object')
    return typeChecker(checker);
  delete(checker.type);
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
