#!/usr/bin/env node

'use strict';

var pkg = require('./package');

var exec = require('child_process').exec,
  argv = require('optimist').options('d', {
    alias: 'dir',
    default: process.cwd(),
  })
    .options('m', {
      alias: 'mdir',
      default: 'node_modules'
    })
    .options('t', {
      alias: 'target',
      default: 'package.json'
    })
    .options('p', {
      alias: 'prop',
      default: 'version'
    })
    .options('f', {
      alias: 'file',
      default: 'package.json'
    })
    .options('c', {
      alias: 'console',
      default: false
    })
    .options('v', {
      alias: 'version'
    })
    .options('h', {
      alias: 'help'
    })
    .argv;


(function () {
  if (!argv.d) {
    return;
  }
  if (argv.v) {
    console.log('%s version %s', pkg.name, pkg.version);
    return;
  }
  if (argv.h) {
    console.log('Usage: %s [options]', pkg.name);
    console.log('\nOptions:');
    console.log('\t-m --mdir: node_modules directory ' +
      '(default = $PWD/node_modules)');
    console.log('\t-t --target: target directory (default = $PWD)');
    console.log('\t-p --prop: target property (default = "version")');
    console.log('\t-f --file: target filename (default = "package.json")');
    console.log('\t-c --console: output to console instead of saving');
    console.log('\t-v --version: print version info and exit');
    console.log('\t-h --help: print this help and exit');
    return;
  }
  var cmd = 'find ' + argv.d + ' -name ' + argv.t;
  exec(cmd, function (err, stdout, stderr) {
    if (err) {
      console.log('exec error: ' + err);
      return;
    }
    if (!stdout) {
      return;
    }

    // NOTE: currently capturing package
    // subdirectory under mdir (not being used).
    var re = new RegExp('^' + argv.d.replace(/\//g, '\\\/') +
      '\\\/' + argv.m + '\\\/(\\w[\\w-]*\\w+)\\/' +
      argv.t.replace('.', '\\.') + '$');

    var fnames = stdout.split('\n'),
      writeHeader = true,
      retval = {
        dependencies: {}
      };

    for (var i = 0, l = fnames.length; i < l; ++i) {
      var fname = fnames[i];
      if (re.test(fname)) {
        if (argv.c && writeHeader) {
          console.log('package version');
          writeHeader = false;
        }
        var pkg = require(fname);
        if (argv.c) {
          console.log('%s %s', pkg.name, pkg[argv.p]);
        }
        else {
          retval.dependencies[pkg.name] = pkg[argv.p];
        }
      }
    }

    if (stderr) {
      console.log('stderr: ' + stderr);
    }
    if (!argv.c) {
      var fs = require('fs'),
        filePath = require('path').join(argv.d, argv.f);

      fs.exists(filePath, function (exists) {
        if (exists) {
          // update dependencies with retval
          var oldPackageJson = require(filePath);
          oldPackageJson.dependencies = retval.dependencies;
          retval = oldPackageJson;
        }
        fs.writeFile(filePath, JSON.stringify(retval), function (err) {
          if (err) {
            throw err;
          }
          console.log('%s saved to %s', argv.f, filePath);
        });
      });
    }
  });
}());