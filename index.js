var Router = require('koa-router');
var util = require('util');

var Kao = module.exports = function() {
  this._fields = {};
  this.router = new Router();
};

Kao.prototype.check = function(field, checker) {
  this._fields[field] = checker;
};

Kao.prototype.route = function(cmd, fn) {
  cmd = cmd.split(' ');
  var args = annotate(fn);
  var fields = this._fields;
  this.router[cmd[0]](cmd[1], function *() {
    var data = {};
    util._extend(data, this.request.body);
    util._extend(data, this.query);
    util._extend(data, this.params);
    data._userId = this.token;
    data.method = this.method;
    try{
      var params = args.map(checker(data, fields));
      this.body = yield fn.apply(this, params);
    }
    catch(e) {
      this.body = e.message;
      console.log(e.stack);
    }
  });
};

Kao.prototype.middleware = function() {
  return this.router.middleware();
};

function checker(data, fields) {
  return function(field) {
    var value = data[field];
    if(fields[field])
      return fields[field].call(data);
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
