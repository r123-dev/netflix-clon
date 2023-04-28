var q = require('q');
var MirroredKeyProviderFactory = require('../../../../lib/server/keys/mirrored-key-provider');
var failTest = require('../../support/fail-test');

describe('mirroredKeyProvider', function() {
    var mirroredKeyProvider;
    var mirror1;
    var mirror2;

    beforeEach(function() {
        mirror1 = jasmine.createSpyObj('mirror1', ['getKey']);
        mirror1.getKey.and.callFake(function() {
            return q.delay('Key 1', 1000);
        });
        mirror2 = jasmine.createSpyObj('mirror2', ['getKey']);
        mirror2.getKey.and.callFake(function() {
            return q.resolve('Key 2');
        });

        mirroredKeyProvider = MirroredKeyProviderFactory.create([mirror1, mirror2]);
    });

    it('should throw an error if no providers are passed to the create function', function() {
        expect(function () {MirroredKeyProviderFactory.create();}).toThrow(
            new Error('Mirrored key provider requires at least one provider.'));
    });

    it('should return the key from the fastest mirror url', function(done) {
        mirroredKeyProvider.getKey().then(function(key) {
            expect(mirror1.getKey).toHaveBeenCalled();
            expect(mirror2.getKey).toHaveBeenCalled();
            expect(key).toBe('Key 2');
            done();
        });
    });

    it('should return the key from another mirror, if one fails', function(done) {
        mirror1.getKey.and.callFake(function() {
            return q.delay('Key 1', 10);
        });
        mirror2.getKey.and.callFake(function() {
            return q.reject(new Error('Failed to get the key'));
        });
        mirroredKeyProvider = MirroredKeyProviderFactory.create([mirror1, mirror2]);
        mirroredKeyProvider.getKey().then(function(key) {

            expect(mirror1.getKey).toHaveBeenCalled();
            expect(mirror2.getKey).toHaveBeenCalled();
            expect(key).toBe('Key 1');
            done();
        });
    });

    it('should throw an error, if both mirrors fail', function(done) {
        mirror1.getKey.and.callFake(function() {
            return q.reject(new Error('Failed to get the key'));
        });
        mirror2.getKey.and.callFake(function() {
            return q.reject(new Error('Failed to get the key'));
        });
        mirroredKeyProvider = MirroredKeyProviderFactory.create([mirror1, mirror2]);
        mirroredKeyProvider.getKey()
            .then(failTest(done))
            .fail(function(err) {
                expect(err.message).toBe('Could not retrieve public key from configured URL(s).');
                done();
            });
    });

    it('should not wrap for single mirror', function() {
        mirroredKeyProvider = MirroredKeyProviderFactory.create([mirror1]);
        expect(mirroredKeyProvider).toBe(mirror1);
    });
});
