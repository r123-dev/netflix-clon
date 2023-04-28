var path = require('path');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

module.exports = {
    failTest: function (doneCallback) {
        return function () {
            var args = JSON.stringify(arguments);
            doneCallback('The promise failed or succeeded when the opposite was expected. Arguments: ' + args);
        };
    },
    requireWithMocks: function (pathRelativeToLib, mocks) {
        var pathRelativeToThisFile = path.normalize('../../../lib/' + pathRelativeToLib);
        return proxyquire(pathRelativeToThisFile, mocks || {});
    }
};