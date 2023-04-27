var jwtAuthenticationMiddleware = require('./lib/server/http/jwt-auth-middleware');
var jwtAuthenticationServer = require('./index').server;

module.exports = function(grunt) {

    // Long stack traces for q
    process.env.Q_DEBUG = 1;

    // Polyfill so we can run without ES6 promises
    if (!global.Promise) {
        global.Promise = require('q').Promise;
    }

    var addJWTMiddleware = function(middlewares, validator, validIssuers, basePath) {
        var jwtMiddleware = jwtAuthenticationMiddleware.create(validator, validIssuers);
        middlewares.unshift(function(req, res, next) {
            if (req.url !== basePath) return next();
            jwtMiddleware(req, res, next);
        });

        middlewares.push(function(req, res, next) {
            if (req.url === basePath) {
                res.end('Ok');
            }
            next();
        });
    };

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jasmine_nodejs: {
            options: {
                specNameSuffix: 'spec.js', // also accepts an array
                stopOnFailure: false,
                reporters: {
                    console: {
                        colors: true,
                        cleanStack: 1,       // (0|false)|(1|true)|2|3
                        verbosity: 4,        // (0|false)|1|2|3|(4|true)
                        listStyle: 'indent', // 'flat'|'indent'
                        activity: false
                    }
                }
            },
            unit: {
                specs: ['test/unit/**/*']
            },
            integration: {
                specs: ['test/integration/**/*']
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            source: {
                files: {
                    src: ['lib/**/*.js', 'test/**/*.js']
                }
            }
        },
        connect: {
            server: {
                options: {
                    base: 'test/integration/key-server',
                    middleware: function(connect, options, middlewares) {
                        var validator = jwtAuthenticationServer.create({
                            resourceServerAudience: 'an-audience',
                            publicKeyBaseUrl: 'http://localhost:8000/'
                        });
                        addJWTMiddleware(middlewares, validator, ['an-issuer'], '/needs/auth');
                        addJWTMiddleware(middlewares, validator, ['different-issuer'], '/different/issuer');
                        return middlewares;
                    }
                }
            }
        },
        'grunt-contrib-watch': {
            options: {
                atBegin: true
            },
            unit: {
                files: ['lib/**/*', 'test/unit/**/*'],
                tasks: ['unitTest']
            },
            integration: {
                files: ['lib/**/*', 'test/integration/**/*'],
                tasks: ['integrationTest']
            }
        },
        changelog: {
            options: {
                commitLink: function(commitHash) {
                    var shortCommitHash = commitHash.substring(0, 8);
                    var commitUrl = grunt.config.get('pkg.repository.url') + '/commits/' + commitHash;
                    return '[' + shortCommitHash + '](' + commitUrl + ')';
                },
                issueLink: function(issueId) {
                    var issueUrl = grunt.config.get('pkg.repository.url') + '/issue/' + issueId;
                    return '[' + issueId + '](' + issueUrl + ')';
                },
                file: 'docs/CHANGELOG.md'
            }
        },
        bump: {
            options: {
                commit: true,
                commitMessage: 'chore: Release v%VERSION%',
                commitFiles: ['package.json', 'docs/CHANGELOG.md', 'docs/API.md'],
                pushTo: 'origin',
                updateConfigs: ['pkg'],
                tagName: '%VERSION%'
            }
        },
        jsdoc2md: {
            api: {
                src: "lib/**/*.js",
                dest: "docs/API.md"
            }
        }
    });

    grunt.loadNpmTasks('grunt-jasmine-nodejs');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-conventional-changelog');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-npm');
    grunt.loadNpmTasks("grunt-jsdoc-to-markdown");

    grunt.renameTask('watch', 'grunt-contrib-watch');

    grunt.registerTask('unitTest', ['jasmine_nodejs:unit']);
    grunt.registerTask('integrationTest', ['connect:server', 'jasmine_nodejs:integration']);
    grunt.registerTask('buildAndTest', ['jshint:source', 'unitTest', 'integrationTest']);
    grunt.registerTask('docs', ['changelog', 'jsdoc2md']);
    grunt.registerTask('release', function(type) {
        if (!type) {
            grunt.fail.fatal('No release type specified. You must specify patch, minor or major. For example "grunt release:patch".');
        }
        grunt.task.run(['buildAndTest', 'bump-only:' + type, 'docs', 'bump-commit', 'npm-publish']);
    });

    grunt.registerTask('default', ['buildAndTest']);
    grunt.registerTask('watch', ['grunt-contrib-watch:unit']);
    grunt.registerTask('watchIntegrationTest', ['grunt-contrib-watch:integration']);
};
