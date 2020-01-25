var fs = require("fs");
var path = require("path");
var childProcess = require("child_process");
var Concat = require("concat-with-sourcemaps");
var convertSourceMap = require("convert-source-map");

module.exports = function(grunt) {

    var LEVEL_DIRECTORY = "levels/";
    var PRELOADED_IMAGE_DIRECTORY = "images/preloaded/";
    var AUDIO_DIRECTORY = "audio/";
    var MUSIC_DIRECTORY = AUDIO_DIRECTORY + "music/";
    var SOUND_EFFECT_DIRECTORY = AUDIO_DIRECTORY + "fx/";
    var TASK_DATA_GEN = 'generate-data-js';
    var TASK_DECL_GEN = 'generate-index-d-ts';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        sync: {
            project: {
                files: [{
                    cwd: '<%= grunt.config("projectPath") %>',
                    src: [
                        'images/**',
                        'audio/**'
                    ],
                    dest: '<%= grunt.config("projectPath") %>dist'
                }],
                ignoreInDest: 'game.js*',
                updateAndDelete: true,
                verbose: true // Display log messages when copying files
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n;var SplitTime = (function() {\n',
                footer: '\nreturn SplitTime;\n} ());'
            },
            project: {
                files: {
                    '<%= grunt.config("projectPath") %>dist/game.min.js': ['<%= grunt.config("projectPath") %>dist/game.js']
                }
            }
        },
        jshint: {
            options: {
                // options here to override JSHint defaults
                // '-W061': true, //ignore "eval can be harmful"
                // '-W054': true, //ignore "the Function constructor is a form of eval"
                // '-W069': true, //ignore dot operator preference over brackets
                globals: {
                    jQuery: true,
                    console: true,
                    document: true,
                    SLVD: true,
                    SplitTime: true
                },
                reporterOutput: ""
            },
            default: ['Gruntfile.js', 'src/editor/**/*.js'],
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-sync');

    grunt.registerTask('build', 'Build game project or just engine', function(projectName) {
        if(!projectName) {
            grunt.task.run(['tsc', TASK_DECL_GEN, 'concat-mapped']);
        }
        else {
            grunt.config("project", projectName);
            grunt.config("projectPath", "projects/" + projectName + "/");
            grunt.task.run(['tsc:' + projectName, TASK_DATA_GEN + ":" + projectName, 'concat-mapped:' + projectName, 'sync:project']);
            if(grunt.option('min')) {
                grunt.task.run('uglify:project');
            }
        }
    });

    function join() {
        var args = [];
        for(var i = 0; i < arguments.length; i++) {
            args.push(arguments[i] || "");
        }
        return path.join.apply(path, args).replace(/\\/, "/");
    }

    grunt.registerTask('tsc', function(projectName) {
        var done = this.async();
        var tscPath = getPathInNodeModules(path.join("typescript", "bin", "tsc"));
        grunt.verbose.writeln("Found tsc: " + tscPath);
        var tsconfigRoot = projectName ? "projects/" + projectName : ".";
        grunt.verbose.writeln("Running in " + tsconfigRoot);
        var process = childProcess.fork(tscPath, [], {
            cwd: tsconfigRoot
        });
        process.on('error', function(err) {
            done(false);
        });
        process.on('exit', function(code) {
            if(code === 0) {
                done();
            }
        });
    });

    grunt.registerTask('concat-mapped', function(projectName) {
        var files;
        if(projectName) {
            var projectRoot = "projects/" + projectName;
            files = [
                'build/engine.js',
                projectRoot + '/build/tsjs/**/*.js',
                projectRoot + '/build/generated/**/*.js',
                'build/tsjs/defer.run.js'
            ];
            concatFilesWithSourceMaps(files, projectRoot + '/dist/game.js');
        } else {
            files = [
                'node_modules/es6-promise/dist/es6-promise.auto.min.js',
                'node_modules/howler/dist/howler.min.js',
                'build/tsjs/defer.def.js',
                'build/tsjs/engine/**/*.js',
                'build/tsjs/defer.run.js'
            ];
            concatFilesWithSourceMaps(files, 'build/engine.js');
        }
    });

    grunt.registerTask(TASK_DATA_GEN, 'Construct JS of assets', function(projectName) {
        grunt.log.writeln("Generating JSON for " + projectName);
        var projectRoot = "projects/" + projectName + "/";
        var gameData = {
            levels: [],
            preloadedImageFiles: [],
            musicFiles: [],
            soundEffectFiles: []
        };
        grunt.file.recurse(join(projectRoot, LEVEL_DIRECTORY), function(absPath, rootDir, subDir, fileName) {
            if(/\.json$/.test(fileName)) {
                grunt.verbose.writeln("Reading " + fileName);
                var fileData = grunt.file.readJSON(absPath);
                fileData.fileName = join(subDir, fileName);
                gameData.levels.push(fileData);
            } else {
                grunt.warn("Non-JSON file found in levels directory: " + fileName);
            }
        });
        grunt.file.recurse(path.join(projectRoot, PRELOADED_IMAGE_DIRECTORY), function(absPath, rootDir, subDir, fileName) {
            gameData.preloadedImageFiles.push(join(subDir, fileName));
        });
        grunt.file.recurse(path.join(projectRoot, MUSIC_DIRECTORY), function(absPath, rootDir, subDir, fileName) {
            gameData.musicFiles.push(join(subDir, fileName));
        });
        grunt.file.recurse(path.join(projectRoot, SOUND_EFFECT_DIRECTORY), function(absPath, rootDir, subDir, fileName) {
            gameData.soundEffectFiles.push(join(subDir, fileName));
        });

        var dataFileContents = "G._GAME_DATA = " + JSON.stringify(gameData) + ";";
        grunt.verbose.writeln("Writing data JS file");
        grunt.file.write(path.join(projectRoot, "build/generated/data.js"), dataFileContents);
    });

    grunt.registerTask(TASK_DECL_GEN, 'Create index.d.ts for SplitTime .d.ts files', function() {
        grunt.log.writeln("Generating index.d.ts for SplitTime");
        var declRefs = [];
        grunt.file.recurse("build/@types/SplitTime/", function(absPath, rootDir, subDir, fileName) {
            if(/index\.d\.ts$/.test(fileName)) {
                // Skip index.d.ts
            } else if(/\.d\.ts$/.test(fileName)) {
                grunt.verbose.writeln("Detected " + fileName);
                var filePath = join(subDir, fileName).replace("\\", "/");
                declRefs.push('/// <reference path="./' + filePath + '" />');
            } else {
                // Skip non-definition files
            }
        });

        var indexFileContents = declRefs.join("\n");
        grunt.verbose.writeln("Writing index.d.ts file");
        grunt.file.write("build/@types/SplitTime/index.d.ts", indexFileContents);
    });

    function getPathInNodeModules(pathPart) {
        var ownRoot = path.resolve(path.dirname((module).filename), '.');
        var userRoot = path.resolve(ownRoot, '..', '..');
        var binSub = path.join('node_modules', pathPart);
    
        if (fs.existsSync(path.join(userRoot, binSub))) {
            // Using project override
            return path.join(userRoot, binSub);
        }
        return path.join(ownRoot, binSub);
    }

    function transposeRelativePath(originalRelativePath, originalReferenceFile, targetReferenceFile) {
        var absoluteFilePath = path.resolve(path.dirname(originalReferenceFile), originalRelativePath);
        var targetDir = path.resolve(path.dirname(targetReferenceFile));
        return path.relative(targetDir, absoluteFilePath).replace(/\\\\?/g, "/");
    }

    function concatFilesWithSourceMaps(filePatterns, outputFilePath) {
        var outputFileDir = path.dirname(outputFilePath);
        var outputFileName = path.basename(outputFilePath);
        var files = grunt.file.expand(filePatterns);
        var concat = new Concat(true, outputFileName, '\n\n;\n\n');
        files.forEach(function(file) {
            var fileInfo = readFileWithSourceMap(file);
            var sourceMap;
            if(fileInfo.sourceMap) {
                var jsonSourceMap = convertSourceMap.fromJSON(fileInfo.sourceMap).toObject();
                for(var i = 0; i < jsonSourceMap.sources.length; i++) {
                    jsonSourceMap.sources[i] = transposeRelativePath(jsonSourceMap.sources[i], file, outputFilePath);
                }
                sourceMap = convertSourceMap.fromObject(jsonSourceMap).toJSON();
            }
            concat.add(file, fileInfo.content, sourceMap);
        });
        var sourceMapFileName = outputFileName + ".map";
        concat.add(null, "//# sourceMappingURL=" + sourceMapFileName);
        var sourceMapPath = path.join(outputFileDir, sourceMapFileName);
        grunt.file.write(outputFilePath, concat.content);
        grunt.file.write(sourceMapPath, concat.sourceMap);
    }

    function readFileWithSourceMap(filePath) {
        var fileContents = grunt.file.read(filePath);
        var fileLines = fileContents.split("\n");
        var fileLinesWithoutSourceMaps = [];
        var sourceMap;
        fileLines.forEach(function(line) {
            var matches = line.match(/\/\/# sourceMappingURL=(.+\.js\.map)/);
            if(matches) {
                var relSourceMapPath = matches[1];
                var absSourceMapPath = path.join(path.resolve(path.dirname(filePath)), relSourceMapPath);
                sourceMap = grunt.file.read(absSourceMapPath);
                fileLinesWithoutSourceMaps.push(line.replace(/./g, "/"));
            } else {
                fileLinesWithoutSourceMaps.push(line);
            }
        });
        return {
            content: fileLinesWithoutSourceMaps.join("\n"),
            sourceMap: sourceMap
        };
    }
};
