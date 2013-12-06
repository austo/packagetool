#!/usr/bin/env node

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
    .argv;


(function () {
  if (!argv.d) {
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