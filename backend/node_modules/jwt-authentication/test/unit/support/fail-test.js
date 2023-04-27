var q = require('q');

module.exports = function (doneCallback) {
    return function (value) {
        expect('The promise').toBe('in the opposite state');
        expect(JSON.stringify(arguments)).toBeFalsy();
        if (value) {
            expect(value.message).toBeFalsy('value.message');
            expect(value.stack).toBeFalsy('value.stack');
        }

        doneCallback();
        return q.reject();
    };
};