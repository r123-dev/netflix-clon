var client = require('./lib/client/jwt-generator');
var server = require('./lib/server/validator/jwt-validator');
var middleware = require('./lib/server/http/jwt-auth-middleware');
module.exports = {
    client: client,
    server: server,
    middleware: middleware
};