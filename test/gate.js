var koa = require('koa');
var Gate = require('..');
var request = require('supertest');

var app = koa();
var gate = new Gate();

app.use(gate.middleware());

var server = app.listen();

describe('gate mount', function() {
  it('auto inject data into controller', function(done) {
    gate.route('get /test/:key', function *(key, k2) {
      key.should.equal('value');
      k2.should.equal('v2');
      done();
    });

    request(server).get('/test/value?k2=v2').end(function() {});
  });

  it('return the error generate by assembler', function(done) {
    request(server).get('/test/value').expect('k2 is required!', done);
  });
});
