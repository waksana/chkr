'use strict'
var Router = require('koa-router');
var util = require('util');
var path = require('path');
var assemble = require('./assemble');
var methodMap = {
  'create': 'post',
  'query': 'get',
  'update': 'put',
  'read': 'get',
  'remove': 'delete'
};
var methods = Object.keys(methodMap);

var Gate = module.exports = function() {
  this.router = new Router();
};

Gate.check = assemble.command;

Gate.prototype.resource = function(doc, controller) {
  var coll = path.dirname(doc);
  var self = this;
  methods.forEach(function(method) {
    var p = doc;
    if(method == 'query' || method == 'create')
      p = collection;
    var fn = controller[method];
    if('function' == typeof fn)
      self.route(`$(methodMap[method]) $(p)`, fn);
  });
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
      var params = yield assemble(data, args);
      this.body = yield fn.apply(this, params);
    }
    catch(e) {
      this.body = e.message;
      //console.log(e.stack);
    }
  });
};

Gate.prototype.middleware = function() {
  return this.router.routes();
};

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
