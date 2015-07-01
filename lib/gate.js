var Router = require('koa-router');
var util = require('util');
var defaultCheckers = require('./check');
var defaultChecker = defaultCheckers({optional: false});

var Gate = module.exports = function() {
  this._checkers = {};
  this.router = new Router();
};

Gate.prototype.check = function(field, checker) {
  checker = getChecker(checker || {});
  if(checker) this._checkers[field] = checker;
  else throw new Error(field + '\'s checker is not regular');
};

function getChecker(checker) {
  if('function' == typeof checker)
    return checker;
  if('object' != typeof(checker) || checker != null)
    return false;
  if(checker.type != 'object') {
    if(!('field' in checker))
      return false
    return defaultCheckers(checker);
  }
  delete(checker.type);
  var funObj = {};
  var finished = Object.keys(checker).every(function(key) {
    return funObj[key] = getChecker(checker[key]);
  });
  if(!finished) return false;
  return actor(funObj);
};

function actor(funObj) {
  var fields = Object.keys(funObj);
  return function(data) {
    return Promise.all(fields.map(function(field) {
      return funObj[field](data)
    })).then(function(values) {
      var result = {};
      values.forEach(function(value, index) {
        result[fields[index]] = value;
      });
      return result;
    });
  };
};

Gate.prototype.route = function(cmd, fn) {
  cmd = cmd.split(' ');
  var args = annotate(fn);
  var checkers = this._checkers;
  this.router[cmd[0]](cmd[1], function *() {
    var data = {};
    util._extend(data, this.request.body);
    util._extend(data, this.query);
    util._extend(data, this.params);
    data.method = this.method;
    try{
      var params = yield Promise.all(args.map(check(data, checkers)));
      this.body = yield fn.apply(this, params);
    }
    catch(e) {
      this.body = e.message;
      console.log(e.stack);
    }
  });
};

Gate.prototype.middleware = function() {
  return this.router.routes();
};

function check(data, checkers) {
  return function(field) {
    var checker = checkers[field] || defaultChecker;
    return checker(data);
  };
}

function annotate(fn) {
  var part = fn.toString().split(')')[0];
  var args = part
  .substr(part.indexOf('(') + 1)
  .split(',')
  .map(function(p) {return p.trim();});
  if(args.length == 1 && args[0] == '') {
    args = [];
  }
  return args;
}
