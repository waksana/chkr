var Router = require('koa-router');
var util = require('util');

var Gate = module.exports = function() {
  this._checkers = {};
  this.router = new Router();
};

Gate.prototype.check = function(field, checker) {
  this._checkers[field] = checker;
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
    var value = data[field];
    var checker = checkers[field];
    if(checker)
      return checker.call(data, field);
    if(value != undefined && value != null)
      return value;
    throw new Error(field + ' is required');
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
