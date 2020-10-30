# SplitTime Engine
TypeScript game engine for SoloVid's [Maven](http://www.solovid.com/games/maven)

The engine was named for the idea of how it would handle time. Levels can be subdivided into distinct timelines, and these timelines may advance at differing rates over time. A timeline has events which occur at specified points.

However, the real distinction of this engine is its 2.5D nature. Although graphics are all 2D, the game supports simple 3D physics rather than using the standard 2D layer approach.

## Development Environment
Make sure you have [Nodejs](http://nodejs.org/download/) installed.

Also make sure that [Grunt](https://gruntjs.com/) is installed (``npm install -g grunt-cli``).

From the command line, run the following commands to setup development dependencies:
```sh
npm install
```

### Building

To build the engine:
```sh
grunt build
```

To build a project (after building the engine):
```sh
grunt build:<project-name>
```

_In the previous command, ``<project-name>`` should be replaced with the name of the directory containing the game project as described in the Project Structure section below._

Or to build both:
```sh
grunt build build:<project-name>
```

### Running

The SplitTime engine ships with a development server (available after building the engine):
```sh
grunt serve
```
While the server is running, you may access files in your browser at [localhost:8080](http://localhost:8080).
You'll be able to play-test your game at [localhost:8080/project-name/](http://localhost:8080/project-name/) (where ``project-name`` is the name of the directory of your game project).

### Testing

To run tests in ``src/engine-test/`` (after building the engine):
```sh
grunt test
```

Or to build and run tests:
```sh
grunt build test
```

Alternatively, you can run these tests in the browser at [localhost:8080/test-runner.html](http://localhost:8080/test-runner.html) through the development server after building the engine.

### Cleaning

To get a clean build, delete the ``build`` directory
(in engine or project), and run your desired build.

## Project Structure
Projects are individual games that reside in separate directories within ``projects/``. All of the files specific to your game are to be located within this directory.

The directories within each project should be

- ``src/`` for all TypeScript files which will be compiled into one file with engine code
- ``build/`` for Grunt-generated files
- ``audio/``
    - ``music/`` for music (looping)
    - ``fx/`` for sound effects (non-looping)
- ``collage/`` for collage files
- ``images/`` for image assets
    - ``preloaded/`` for image assets that will be loaded into memory at engine startup
- ``levels/`` for level files

Within the game code, all resources should be referenced relative to their asset type directory as specified in the enumeration above.

The launch point of the game should be some HTML file (probably ``index.html``) in the project home directory. This file should include ``<script src="dist/game.js"></script>`` and later call ``G.launch();`` as defined somewhere in the game's source files.

Note that all TS files in ``src/`` will be included within ``dist/game.js``.
Generally speaking, no ordering of project source files should be assumed.
However, each directory's direct source files will come before source files in subdirectories.
Also, you may use ``defer(() => { ... })`` to ensure that some code gets run after all definitions.
_Why this scheme? It's a combination of bucking against modules/imports and simplicity of implementation._

## Distribution
All files in a project's home ``dist/`` directory should be served in the production environment.

## Editing Collages/Levels
Level files should be saved in a project's ``levels/`` directory, but levels are edited via the SplitTime development server.
After building the project and starting the development server, launch [localhost:8080/editor.html](http://localhost:8080/editor.html) in your browser, and provide the name of your project's directory.

Since this document is not meant to be an authoritative source for the editor's interface, we'll assume you can figure out how to use it from that point.
