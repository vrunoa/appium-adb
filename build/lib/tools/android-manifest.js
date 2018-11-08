"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _teen_process = require("teen_process");

var _logger = _interopRequireDefault(require("../logger.js"));

var _helpers = require("../helpers.js");

var _appiumSupport = require("appium-support");

var _lodash = _interopRequireDefault(require("lodash"));

var _path = _interopRequireDefault(require("path"));

var _xmldom = _interopRequireDefault(require("xmldom"));

var _xpath = _interopRequireDefault(require("xpath"));

var _shellQuote = require("shell-quote");

let manifestMethods = {};

manifestMethods.processFromManifest = function () {
  var _ref = (0, _asyncToGenerator2.default)(function* (localApk) {
    yield this.initAapt();

    _logger.default.info("Retrieving process from manifest");

    let args = ['dump', 'xmltree', localApk, 'AndroidManifest.xml'];

    let _ref2 = yield (0, _teen_process.exec)(this.binaries.aapt, args),
        stdout = _ref2.stdout;

    let result = null;
    let lines = stdout.split("\n");
    let applicationRegex = new RegExp(/\s+E: application \(line=\d+\).*/);
    let applicationFound = false;
    let attributeRegex = new RegExp(/\s+A: .+/);
    let processRegex = new RegExp(/\s+A: android:process\(0x01010011\)="([^"]+).*"/);
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = lines[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        let line = _step.value;

        if (!applicationFound) {
          if (applicationRegex.test(line)) {
            applicationFound = true;
          }
        } else {
          let notAttribute = !attributeRegex.test(line);

          if (notAttribute) {
            break;
          }

          let process = processRegex.exec(line);

          if (process && process.length > 1) {
            result = process[1];

            if (result.length > 15) {
              result = result.substr(result.length - 15);
            }

            break;
          }
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return result;
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();

function extractApkInfoWithApkTools(_x2, _x3, _x4, _x5) {
  return _extractApkInfoWithApkTools.apply(this, arguments);
}

function _extractApkInfoWithApkTools() {
  _extractApkInfoWithApkTools = (0, _asyncToGenerator2.default)(function* (localApk, aaptPath, jarPath, tmpRoot) {
    _logger.default.info("Extracting package and launch activity from manifest");

    let args = ['dump', 'badging', localApk];
    let stdout = (yield (0, _teen_process.exec)(aaptPath, args)).stdout;
    let apkPackage = new RegExp(/package: name='([^']+)'/g).exec(stdout);

    if (!apkPackage || apkPackage.length < 2) {
      throw new Error(`Cannot parse package name from ` + `'${_lodash.default.join([aaptPath, 'dump', 'badging', '"' + localApk + '"'], ' ')}' command  output`);
    }

    apkPackage = apkPackage[1];
    let apkActivity = new RegExp(/launchable-activity: name='([^']+)'/g).exec(stdout);

    if (apkActivity && apkActivity.length >= 2) {
      apkActivity = apkActivity[1];
      return {
        apkPackage,
        apkActivity
      };
    }

    let outputPath = _path.default.resolve(tmpRoot, apkPackage);

    let getLaunchActivity = ['-jar', jarPath, 'printLaunchActivity', localApk, outputPath];
    const output = yield (0, _teen_process.exec)('java', getLaunchActivity);

    if (output.stderr) {
      throw new Error(`Cannot parse launchActivity from manifest: ${output.stderr}`);
    }

    stdout = output.stdout;
    let act = new RegExp(/Launch activity parsed:([^']+)/g).exec(stdout);

    if (act && act.length >= 2) {
      apkActivity = act[1];
      return {
        apkPackage,
        apkActivity
      };
    }

    throw new Error(`Cannot parse main activity name from '${stdout}' command  output`);
  });
  return _extractApkInfoWithApkTools.apply(this, arguments);
}

function extractApkInfoWithApkanalyzer(_x6, _x7) {
  return _extractApkInfoWithApkanalyzer.apply(this, arguments);
}

function _extractApkInfoWithApkanalyzer() {
  _extractApkInfoWithApkanalyzer = (0, _asyncToGenerator2.default)(function* (localApk, apkanalyzerPath) {
    const args = ['-h', 'manifest', 'print', localApk];

    _logger.default.debug(`Starting '${apkanalyzerPath}' with args ${JSON.stringify(args)}`);

    const manifestXml = (yield (0, _teen_process.exec)(apkanalyzerPath, args, {
      shell: true,
      cwd: _path.default.dirname(apkanalyzerPath)
    })).stdout;
    const doc = new _xmldom.default.DOMParser().parseFromString(manifestXml);

    const apkPackageAttribute = _xpath.default.select1('//manifest/@package', doc);

    if (!apkPackageAttribute) {
      throw new Error(`Cannot parse package name from ${manifestXml}`);
    }

    const apkPackage = apkPackageAttribute.value;

    const apkActivityAttribute = _xpath.default.select1("//application/*[starts-with(name(), 'activity') " + "and .//action[@*[local-name()='name' and .='android.intent.action.MAIN']] " + "and .//category[@*[local-name()='name' and .='android.intent.category.LAUNCHER']]]" + "/@*[local-name()='name']", doc);

    if (!apkActivityAttribute) {
      throw new Error(`Cannot parse main activity name from ${manifestXml}`);
    }

    const apkActivity = apkActivityAttribute.value;
    return {
      apkPackage,
      apkActivity
    };
  });
  return _extractApkInfoWithApkanalyzer.apply(this, arguments);
}

manifestMethods.packageAndLaunchActivityFromManifest = function () {
  var _ref3 = (0, _asyncToGenerator2.default)(function* (appPath) {
    var _this = this;

    if (appPath.endsWith(_helpers.APKS_EXTENSION)) {
      appPath = yield this.extractBaseApk(appPath);
    }

    const apkInfoGetters = [(0, _asyncToGenerator2.default)(function* () {
      const apkanalyzerPath = yield (0, _helpers.getApkanalyzerForOs)(_this);
      return yield extractApkInfoWithApkanalyzer(appPath, apkanalyzerPath);
    }), (0, _asyncToGenerator2.default)(function* () {
      yield _this.initAapt();
      return yield extractApkInfoWithApkTools(appPath, _this.binaries.aapt, _this.jars['appium_apk_tools.jar'], _this.tmpDir);
    })];
    let savedError;

    for (var _i = 0; _i < apkInfoGetters.length; _i++) {
      const infoGetter = apkInfoGetters[_i];

      try {
        const _ref6 = yield infoGetter(),
              apkPackage = _ref6.apkPackage,
              apkActivity = _ref6.apkActivity;

        _logger.default.info(`Package name: '${apkPackage}'`);

        _logger.default.info(`Main activity name: '${apkActivity}'`);

        return {
          apkPackage,
          apkActivity
        };
      } catch (e) {
        if (infoGetter !== _lodash.default.last(apkInfoGetters)) {
          _logger.default.info(`Using the alternative activity name detection method because of: ${e.message}`);
        }

        savedError = e;
      }
    }

    throw new Error(`packageAndLaunchActivityFromManifest failed. Original error: ${savedError.message}` + (savedError.stderr ? `; StdErr: ${savedError.stderr}` : ''));
  });

  return function (_x8) {
    return _ref3.apply(this, arguments);
  };
}();

manifestMethods.targetSdkVersionFromManifest = function () {
  var _ref7 = (0, _asyncToGenerator2.default)(function* (appPath) {
    yield this.initAapt();

    if (appPath.endsWith(_helpers.APKS_EXTENSION)) {
      appPath = yield this.extractBaseApk(appPath);
    }

    _logger.default.info("Extracting package and launch activity from manifest");

    let args = ['dump', 'badging', appPath];
    let output;

    try {
      let _ref8 = yield (0, _teen_process.exec)(this.binaries.aapt, args),
          stdout = _ref8.stdout;

      output = stdout;
    } catch (e) {
      throw new Error(`fetching targetSdkVersion from local APK failed. Original error: ${e.message}`);
    }

    let targetSdkVersion = new RegExp(/targetSdkVersion:'([^']+)'/g).exec(output);

    if (!targetSdkVersion) {
      throw new Error(`targetSdkVersion is not specified in the application.`);
    }

    return parseInt(targetSdkVersion[1], 10);
  });

  return function (_x9) {
    return _ref7.apply(this, arguments);
  };
}();

manifestMethods.targetSdkVersionUsingPKG = function () {
  var _ref9 = (0, _asyncToGenerator2.default)(function* (pkg, cmdOutput = null) {
    let stdout = cmdOutput || (yield this.shell(['dumpsys', 'package', pkg]));
    let targetSdkVersion = new RegExp(/targetSdk=([^\s\s]+)/g).exec(stdout);

    if (targetSdkVersion && targetSdkVersion.length >= 2) {
      targetSdkVersion = targetSdkVersion[1];
    } else {
      targetSdkVersion = 0;
    }

    return parseInt(targetSdkVersion, 10);
  });

  return function (_x10) {
    return _ref9.apply(this, arguments);
  };
}();

manifestMethods.compileManifest = function () {
  var _ref10 = (0, _asyncToGenerator2.default)(function* (manifest, manifestPackage, targetPackage) {
    const _ref11 = yield (0, _helpers.getAndroidPlatformAndPath)(),
          platform = _ref11.platform,
          platformPath = _ref11.platformPath;

    if (!platform) {
      throw new Error('Cannot compile the manifest. The required platform does not exist (API level >= 17)');
    }

    const resultPath = `${manifest}.apk`;
    const args = ['package', '-M', manifest, '--rename-manifest-package', manifestPackage, '--rename-instrumentation-target-package', targetPackage, '-I', _path.default.resolve(platformPath, 'android.jar'), '-F', resultPath, '-f'];

    try {
      yield this.initAapt();

      _logger.default.debug(`Compiling the manifest: ${this.binaries.aapt} ${(0, _shellQuote.quote)(args)}`);

      yield (0, _teen_process.exec)(this.binaries.aapt, args);

      _logger.default.debug(`Compiled the manifest at '${resultPath}'`);
    } catch (err) {
      throw new Error(`Cannot compile the manifest. Original error: ${err.message}`);
    }
  });

  return function (_x11, _x12, _x13) {
    return _ref10.apply(this, arguments);
  };
}();

manifestMethods.insertManifest = function () {
  var _ref12 = (0, _asyncToGenerator2.default)(function* (manifest, srcApk, dstApk) {
    _logger.default.debug(`Inserting manifest, src: ${srcApk} dst: ${dstApk}`);

    yield this.initAapt();
    yield (0, _helpers.unzipFile)(`${manifest}.apk`);
    yield _appiumSupport.fs.copyFile(srcApk, dstApk);

    _logger.default.debug("Testing new tmp apk");

    yield _appiumSupport.zip.assertValidZip(dstApk);

    _logger.default.debug("Moving manifest");

    try {
      yield (0, _teen_process.exec)(this.binaries.aapt, ['remove', dstApk, _path.default.basename(manifest)]);
    } catch (ign) {}

    yield (0, _teen_process.exec)(this.binaries.aapt, ['add', dstApk, _path.default.basename(manifest)], {
      cwd: _path.default.dirname(manifest)
    });

    _logger.default.debug("Inserted manifest.");
  });

  return function (_x14, _x15, _x16) {
    return _ref12.apply(this, arguments);
  };
}();

manifestMethods.hasInternetPermissionFromManifest = function () {
  var _ref13 = (0, _asyncToGenerator2.default)(function* (appPath) {
    yield this.initAapt();

    if (appPath.endsWith(_helpers.APKS_EXTENSION)) {
      appPath = yield this.extractBaseApk(appPath);
    }

    _logger.default.debug(`Checking if '${appPath}' requires internet access permission in the manifest`);

    try {
      let _ref14 = yield (0, _teen_process.exec)(this.binaries.aapt, ['dump', 'badging', appPath]),
          stdout = _ref14.stdout;

      return new RegExp(/uses-permission:.*'android.permission.INTERNET'/).test(stdout);
    } catch (e) {
      throw new Error(`Cannot check if '${appPath}' requires internet access permission. ` + `Original error: ${e.message}`);
    }
  });

  return function (_x17) {
    return _ref13.apply(this, arguments);
  };
}();

manifestMethods.printManifestFromApk = function () {
  var _printManifestFromApk = (0, _asyncToGenerator2.default)(function* (appPath, logLevel = 'debug') {
    yield this.initAapt();

    if (appPath.endsWith(_helpers.APKS_EXTENSION)) {
      appPath = yield this.extractBaseApk(appPath);
    }

    _logger.default[logLevel](`Extracting the manifest from '${appPath}'`);

    let out = false;

    const _ref15 = yield (0, _teen_process.exec)(this.binaries.aapt, ['l', '-a', appPath]),
          stdout = _ref15.stdout;

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = stdout.split('\n')[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        const line = _step2.value;

        if (!out && line.includes('Android manifest:')) {
          out = true;
        }

        if (out) {
          _logger.default[logLevel](line);
        }
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }
  });

  return function printManifestFromApk(_x18) {
    return _printManifestFromApk.apply(this, arguments);
  };
}();

var _default = manifestMethods;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi90b29scy9hbmRyb2lkLW1hbmlmZXN0LmpzIl0sIm5hbWVzIjpbIm1hbmlmZXN0TWV0aG9kcyIsInByb2Nlc3NGcm9tTWFuaWZlc3QiLCJsb2NhbEFwayIsImluaXRBYXB0IiwibG9nIiwiaW5mbyIsImFyZ3MiLCJiaW5hcmllcyIsImFhcHQiLCJzdGRvdXQiLCJyZXN1bHQiLCJsaW5lcyIsInNwbGl0IiwiYXBwbGljYXRpb25SZWdleCIsIlJlZ0V4cCIsImFwcGxpY2F0aW9uRm91bmQiLCJhdHRyaWJ1dGVSZWdleCIsInByb2Nlc3NSZWdleCIsImxpbmUiLCJ0ZXN0Iiwibm90QXR0cmlidXRlIiwicHJvY2VzcyIsImV4ZWMiLCJsZW5ndGgiLCJzdWJzdHIiLCJleHRyYWN0QXBrSW5mb1dpdGhBcGtUb29scyIsImFhcHRQYXRoIiwiamFyUGF0aCIsInRtcFJvb3QiLCJhcGtQYWNrYWdlIiwiRXJyb3IiLCJfIiwiam9pbiIsImFwa0FjdGl2aXR5Iiwib3V0cHV0UGF0aCIsInBhdGgiLCJyZXNvbHZlIiwiZ2V0TGF1bmNoQWN0aXZpdHkiLCJvdXRwdXQiLCJzdGRlcnIiLCJhY3QiLCJleHRyYWN0QXBrSW5mb1dpdGhBcGthbmFseXplciIsImFwa2FuYWx5emVyUGF0aCIsImRlYnVnIiwiSlNPTiIsInN0cmluZ2lmeSIsIm1hbmlmZXN0WG1sIiwic2hlbGwiLCJjd2QiLCJkaXJuYW1lIiwiZG9jIiwieG1sZG9tIiwiRE9NUGFyc2VyIiwicGFyc2VGcm9tU3RyaW5nIiwiYXBrUGFja2FnZUF0dHJpYnV0ZSIsInhwYXRoIiwic2VsZWN0MSIsInZhbHVlIiwiYXBrQWN0aXZpdHlBdHRyaWJ1dGUiLCJwYWNrYWdlQW5kTGF1bmNoQWN0aXZpdHlGcm9tTWFuaWZlc3QiLCJhcHBQYXRoIiwiZW5kc1dpdGgiLCJBUEtTX0VYVEVOU0lPTiIsImV4dHJhY3RCYXNlQXBrIiwiYXBrSW5mb0dldHRlcnMiLCJqYXJzIiwidG1wRGlyIiwic2F2ZWRFcnJvciIsImluZm9HZXR0ZXIiLCJlIiwibGFzdCIsIm1lc3NhZ2UiLCJ0YXJnZXRTZGtWZXJzaW9uRnJvbU1hbmlmZXN0IiwidGFyZ2V0U2RrVmVyc2lvbiIsInBhcnNlSW50IiwidGFyZ2V0U2RrVmVyc2lvblVzaW5nUEtHIiwicGtnIiwiY21kT3V0cHV0IiwiY29tcGlsZU1hbmlmZXN0IiwibWFuaWZlc3QiLCJtYW5pZmVzdFBhY2thZ2UiLCJ0YXJnZXRQYWNrYWdlIiwicGxhdGZvcm0iLCJwbGF0Zm9ybVBhdGgiLCJyZXN1bHRQYXRoIiwiZXJyIiwiaW5zZXJ0TWFuaWZlc3QiLCJzcmNBcGsiLCJkc3RBcGsiLCJmcyIsImNvcHlGaWxlIiwiemlwIiwiYXNzZXJ0VmFsaWRaaXAiLCJiYXNlbmFtZSIsImlnbiIsImhhc0ludGVybmV0UGVybWlzc2lvbkZyb21NYW5pZmVzdCIsInByaW50TWFuaWZlc3RGcm9tQXBrIiwibG9nTGV2ZWwiLCJvdXQiLCJpbmNsdWRlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFHQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQSxJQUFJQSxlQUFlLEdBQUcsRUFBdEI7O0FBTUFBLGVBQWUsQ0FBQ0MsbUJBQWhCO0FBQUEsNkNBQXNDLFdBQWdCQyxRQUFoQixFQUEwQjtBQUM5RCxVQUFNLEtBQUtDLFFBQUwsRUFBTjs7QUFDQUMsb0JBQUlDLElBQUosQ0FBUyxrQ0FBVDs7QUFDQSxRQUFJQyxJQUFJLEdBQUcsQ0FBQyxNQUFELEVBQVMsU0FBVCxFQUFvQkosUUFBcEIsRUFBOEIscUJBQTlCLENBQVg7O0FBSDhELHNCQUl6Qyx3QkFBSyxLQUFLSyxRQUFMLENBQWNDLElBQW5CLEVBQXlCRixJQUF6QixDQUp5QztBQUFBLFFBSXpERyxNQUp5RCxTQUl6REEsTUFKeUQ7O0FBSzlELFFBQUlDLE1BQU0sR0FBRyxJQUFiO0FBQ0EsUUFBSUMsS0FBSyxHQUFHRixNQUFNLENBQUNHLEtBQVAsQ0FBYSxJQUFiLENBQVo7QUFDQSxRQUFJQyxnQkFB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UUFBUixDQUFpQkMsdUJBQWpCLENBQUosRUFBc0M7QUFDcENGLE1BQUFBLE9BQU8sU0FBUyxLQUFLRyxjQUFMLENBQW9CSCxPQUFwQixDQUFoQjtBQUNEOztBQUVEeEQsb0JBQUk2RixRQUFKLEVBQWUsaUNBQWdDckMsT0FBUSxHQUF2RDs7QUFDQSxRQUFJc0MsR0FBRyxHQUFHLEtBQVY7O0FBUnVHLHlCQVNoRix3QkFBSyxLQUFLM0YsUUFBTCxDQUFjQyxJQUFuQixFQUF5QixDQUFDLEdBQUQsRUFBTSxJQUFOLEVBQVlvRCxPQUFaLENBQXpCLENBVGdGO0FBQUEsVUFTaEduRCxNQVRnRyxVQVNoR0EsTUFUZ0c7O0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBVXZHLDRCQUFtQkEsTUFBTSxDQUFDRyxLQUFQLENBQWEsSUFBYixDQUFuQixtSUFBdUM7QUFBQSxjQUE1Qk0sSUFBNEI7O0FBQ3JDLFlBQUksQ0FBQ2dGLEdBQUQsSUFBUWhGLElBQUksQ0FBQ2lGLFFBQUwsQ0FBYyxtQkFBZCxDQUFaLEVBQWdEO0FBQzlDRCxVQUFBQSxHQUFHLEdBQUcsSUFBTjtBQUNEOztBQUNELFlBQUlBLEdBQUosRUFBUztBQUNQOUYsMEJBQUk2RixRQUFKLEVBQWMvRSxJQUFkO0FBQ0Q7QUFDRjtBQWpCc0c7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQWtCeEcsR0FsQkQ7O0FBQUEsa0JBQXNEOEUsb0JBQXREO0FBQUE7QUFBQTtBQUFBOztlQXFCZWhHLGUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBleGVjIH0gZnJvbSAndGVlbl9wcm9jZXNzJztcbmltcG9ydCBsb2cgZnJvbSAnLi4vbG9nZ2VyLmpzJztcbmltcG9ydCB7XG4gIGdldEFuZHJvaWRQbGF0Zm9ybUFuZFBhdGgsIHVuemlwRmlsZSxcbiAgZ2V0QXBrYW5hbHl6ZXJGb3JPcywgQVBLU19FWFRFTlNJT04gfSBmcm9tICcuLi9oZWxwZXJzLmpzJztcbmltcG9ydCB7IGZzLCB6aXAgfSBmcm9tICdhcHBpdW0tc3VwcG9ydCc7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeG1sZG9tIGZyb20gJ3htbGRvbSc7XG5pbXBvcnQgeHBhdGggZnJvbSAneHBhdGgnO1xuaW1wb3J0IHsgcXVvdGUgfSBmcm9tICdzaGVsbC1xdW90ZSc7XG5cbmxldCBtYW5pZmVzdE1ldGhvZHMgPSB7fTtcblxuLy8gYW5kcm9pZDpwcm9jZXNzPSBtYXkgYmUgZGVmaW5lZCBpbiBBbmRyb2lkTWFuaWZlc3QueG1sXG4vLyBodHRwOi8vZGV2ZWxvcGVyLmFuZHJvaWQuY29tL3JlZmVyZW5jZS9hbmRyb2lkL1IuYXR0ci5odG1sI3Byb2Nlc3Ncbi8vIG5vdGUgdGhhdCB0aGUgcHJvY2VzcyBuYW1lIHdoZW4gdXNlZCB3aXRoIHBzIG11c3QgYmUgdHJ1bmNhdGVkIHRvIHRoZSBsYXN0IDE1IGNoYXJzXG4vLyBwcyAtYyBjb20uZXhhbXBsZS5hbmRyb2lkLmFwaXMgYmVjb21lcyBwcyAtYyBsZS5hbmRyb2lkLmFwaXNcbm1hbmlmZXN0TWV0aG9kcy5wcm9jZXNzRnJvbU1hbmlmZXN0ID0gYXN5bmMgZnVuY3Rpb24gKGxvY2FsQXBrKSB7XG4gIGF3YWl0IHRoaXMuaW5pdEFhcHQoKTtcbiAgbG9nLmluZm8oXCJSZXRyaWV2aW5nIHByb2Nlc3MgZnJvbSBtYW5pZmVzdFwiKTtcbiAgbGV0IGFyZ3MgPSBbJ2R1bXAnLCAneG1sdHJlZScsIGxvY2FsQXBrLCAnQW5kcm9pZE1hbmlmZXN0LnhtbCddO1xuICBsZXQge3N0ZG91dH0gPSBhd2FpdCBleGVjKHRoaXMuYmluYXJpZXMuYWFwdCwgYXJncyk7XG4gIGxldCByZXN1bHQgPSBudWxsO1xuICBsZXQgbGluZXMgPSBzdGRvdXQuc3BsaXQoXCJcXG5cIik7XG4gIGxldCBhcHBsaWNhdGlvblJlZ2V4ID0gbmV3IFJlZ0V4cCgvXFxzK0U6IGFwcGxpY2F0aW9uIFxcKGxpbmU9XFxkK1xcKS4qLyk7XG4gIGxldCBhcHBsaWNhdGlvbkZvdW5kID0gZmFsc2U7XG4gIGxldCBhdHRyaWJ1dGVSZWdleCA9IG5ldyBSZWdFeHAoL1xccytBOiAuKy8pO1xuICBsZXQgcHJvY2Vzc1JlZ2V4ID0gbmV3IFJlZ0V4cCgvXFxzK0E6IGFuZHJvaWQ6cHJvY2Vzc1xcKDB4MDEwMTAwMTFcXCk9XCIoW15cIl0rKS4qXCIvKTtcbiAgZm9yIChsZXQgbGluZSBvZiBsaW5lcykge1xuICAgIGlmICghYXBwbGljYXRpb25Gb3VuZCkge1xuICAgICAgaWYgKGFwcGxpY2F0aW9uUmVnZXgudGVzdChsaW5lKSkge1xuICAgICAgICBhcHBsaWNhdGlvbkZvdW5kID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IG5vdEF0dHJpYnV0ZSA9ICFhdHRyaWJ1dGVSZWdleC50ZXN0KGxpbmUpO1xuICAgICAgLy8gcHJvY2VzcyBtdXN0IGJlIGFuIGF0dHJpYnV0ZSBhZnRlciBhcHBsaWNhdGlvbi5cbiAgICAgIGlmIChub3RBdHRyaWJ1dGUpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBsZXQgcHJvY2VzcyA9IHByb2Nlc3NSZWdleC5leGVjKGxpbmUpO1xuICAgICAgLy8gdGhpcyBpcyBhbiBhcHBsaWNhdGlvbiBhdHRyaWJ1dGUgcHJvY2Vzcy5cbiAgICAgIGlmIChwcm9jZXNzICYmIHByb2Nlc3MubGVuZ3RoID4gMSkge1xuICAgICAgICByZXN1bHQgPSBwcm9jZXNzWzFdO1xuICAgICAgICAvLyBtdXN0IHRyaW0gdG8gbGFzdCAxNSBmb3IgYW5kcm9pZCdzIHBzIGJpbmFyeVxuICAgICAgICBpZiAocmVzdWx0Lmxlbmd0aCA+IDE1KSB7XG4gICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnN1YnN0cihyZXN1bHQubGVuZ3RoIC0gMTUpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBBUEtJbmZvXG4gKiBAcHJvcGVydHkge3N0cmluZ30gYXBrUGFja2FnZSAtIFRoZSBuYW1lIG9mIGFwcGxpY2F0aW9uIHBhY2thZ2UsIGZvciBleGFtcGxlICdjb20uYWNtZS5hcHAnLlxuICogQHByb3BlcnR5IHtzdHJpbmd9IGFwa0FjdGl2aXR5IC0gVGhlIG5hbWUgb2YgbWFpbiBhcHBsaWNhdGlvbiBhY3Rpdml0eS5cbiAqL1xuXG4vKipcbiAqIEV4dHJhY3QgcGFja2FnZSBhbmQgbWFpbiBhY3Rpdml0eSBuYW1lIGZyb20gYXBwbGljYXRpb24gbWFuaWZlc3QgdXNpbmdcbiAqIHRoZSBjdXN0b20gYXBrIHRvb2xzLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBsb2NhbEFwayAtIFRoZSBmdWxsIHBhdGggdG8gYXBwbGljYXRpb24gcGFja2FnZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBhYXB0UGF0aCAtIFRoZSBmdWxsIHBhdGggdG8gYXBwdCBiaW5hcnkuXG4gKiBAcGFyYW0ge3N0cmluZ30gamFyUGF0aCAtIFRoZSBmdWxsIHBhdGggdG8gYXBwaXVtX2Fwa190b29scy5qYXIgdXRpbGl0eVxuICogQHBhcmFtIHtzdHJpbmd9IHRtcFJvb3QgLSBUaGUgZnVsbCBwYXRoIHRvIHRoZSBjbGFzcy13aWRlIHRlbXBvcmFyeSBmb2xkZXIuXG4gKiBAcmV0dXJuIHtBUEtJbmZvfSBUaGUgcGFyc2VkIGFwcGxpY2F0aW9uIGluZm8uXG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYgdGhlcmUgd2FzIGFuIGVycm9yIHdoaWxlIGdldHRpbmcgdGhlIGRhdGEgZnJvbSB0aGUgZ2l2ZW5cbiAqICAgICAgICAgICAgICAgICBhcHBsaWNhdGlvbiBwYWNrYWdlLlxuICovXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0QXBrSW5mb1dpdGhBcGtUb29scyAobG9jYWxBcGssIGFhcHRQYXRoLCBqYXJQYXRoLCB0bXBSb290KSB7XG4gIGxvZy5pbmZvKFwiRXh0cmFjdGluZyBwYWNrYWdlIGFuZCBsYXVuY2ggYWN0aXZpdHkgZnJvbSBtYW5pZmVzdFwiKTtcbiAgbGV0IGFyZ3MgPSBbJ2R1bXAnLCAnYmFkZ2luZycsIGxvY2FsQXBrXTtcbiAgbGV0IHN0ZG91dCA9IChhd2FpdCBleGVjKGFhcHRQYXRoLCBhcmdzKSkuc3Rkb3V0O1xuICBsZXQgYXBrUGFja2FnZSA9IG5ldyBSZWdFeHAoL3BhY2thZ2U6IG5hbWU9JyhbXiddKyknL2cpLmV4ZWMoc3Rkb3V0KTtcbiAgaWYgKCFhcGtQYWNrYWdlIHx8IGFwa1BhY2thZ2UubGVuZ3RoIDwgMikge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IHBhcnNlIHBhY2thZ2UgbmFtZSBmcm9tIGAgK1xuICAgICAgYCcke18uam9pbihbYWFwdFBhdGgsICdkdW1wJywgJ2JhZGdpbmcnLCAnXCInICsgbG9jYWxBcGsgKyAnXCInXSwgJyAnKX0nIGNvbW1hbmQgIG91dHB1dGApO1xuICB9XG4gIGFwa1BhY2thZ2UgPSBhcGtQYWNrYWdlWzFdO1xuICBsZXQgYXBrQWN0aXZpdHkgPSBuZXcgUmVnRXhwKC9sYXVuY2hhYmxlLWFjdGl2aXR5OiBuYW1lPScoW14nXSspJy9nKS5leGVjKHN0ZG91dCk7XG4gIGlmIChhcGtBY3Rpdml0eSAmJiBhcGtBY3Rpdml0eS5sZW5ndGggPj0gMikge1xuICAgIGFwa0FjdGl2aXR5ID0gYXBrQWN0aXZpdHlbMV07XG4gICAgcmV0dXJuIHthcGtQYWNrYWdlLCBhcGtBY3Rpdml0eX07XG4gIH1cblxuICBsZXQgb3V0cHV0UGF0aCA9IHBhdGgucmVzb2x2ZSh0bXBSb290LCBhcGtQYWNrYWdlKTtcbiAgbGV0IGdldExhdW5jaEFjdGl2aXR5ID0gW1xuICAgICctamFyJywgamFyUGF0aCxcbiAgICAncHJpbnRMYXVuY2hBY3Rpdml0eScsIGxvY2FsQXBrLFxuICAgIG91dHB1dFBhdGhcbiAgXTtcbiAgY29uc3Qgb3V0cHV0ID0gYXdhaXQgZXhlYygnamF2YScsIGdldExhdW5jaEFjdGl2aXR5KTtcbiAgaWYgKG91dHB1dC5zdGRlcnIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBwYXJzZSBsYXVuY2hBY3Rpdml0eSBmcm9tIG1hbmlmZXN0OiAke291dHB1dC5zdGRlcnJ9YCk7XG4gIH1cbiAgc3Rkb3V0ID0gb3V0cHV0LnN0ZG91dDtcbiAgbGV0IGFjdCA9IG5ldyBSZWdFeHAoL0xhdW5jaCBhY3Rpdml0eSBwYXJzZWQ6KFteJ10rKS9nKS5leGVjKHN0ZG91dCk7XG4gIGlmIChhY3QgJiYgYWN0Lmxlbmd0aCA+PSAyKSB7XG4gICAgYXBrQWN0aXZpdHkgPSBhY3RbMV07XG4gICAgcmV0dXJuIHthcGtQYWNrYWdlLCBhcGtBY3Rpdml0eX07XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgcGFyc2UgbWFpbiBhY3Rpdml0eSBuYW1lIGZyb20gJyR7c3Rkb3V0fScgY29tbWFuZCAgb3V0cHV0YCk7XG59XG5cbi8qKlxuICogRXh0cmFjdCBwYWNrYWdlIGFuZCBtYWluIGFjdGl2aXR5IG5hbWUgZnJvbSBhcHBsaWNhdGlvbiBtYW5pZmVzdCB1c2luZ1xuICogYXBrYW5hbHl6ZXIgdG9vbC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbG9jYWxBcGsgLSBUaGUgZnVsbCBwYXRoIHRvIGFwcGxpY2F0aW9uIHBhY2thZ2UuXG4gKiBAcGFyYW0ge3N0cmluZ30gYXBrYW5hbHl6ZXJQYXRoIC0gVGhlIGZ1bGwgcGF0aCB0byBhcGthbmFseXplciB0b29sLlxuICogQHJldHVybiB7QVBLSW5mb30gVGhlIHBhcnNlZCBhcHBsaWNhdGlvbiBpbmZvLlxuICogQHRocm93cyB7RXJyb3J9IElmIHRoZXJlIHdhcyBhbiBlcnJvciB3aGlsZSBnZXR0aW5nIHRoZSBkYXRhIGZyb20gdGhlIGdpdmVuXG4gKiAgICAgICAgICAgICAgICAgYXBwbGljYXRpb24gcGFja2FnZSBvciBpZiB0aGUgdG9vbCBpdHNlbGZcbiAqICAgICAgICAgICAgICAgICBpcyBub3QgcHJlc2VudCBvbiB0aGUgbG9jYWwgZmlsZSBzeXN0ZW0uXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RBcGtJbmZvV2l0aEFwa2FuYWx5emVyIChsb2NhbEFwaywgYXBrYW5hbHl6ZXJQYXRoKSB7XG4gIGNvbnN0IGFyZ3MgPSBbJy1oJywgJ21hbmlmZXN0JywgJ3ByaW50JywgbG9jYWxBcGtdO1xuICBsb2cuZGVidWcoYFN0YXJ0aW5nICcke2Fwa2FuYWx5emVyUGF0aH0nIHdpdGggYXJncyAke0pTT04uc3RyaW5naWZ5KGFyZ3MpfWApO1xuICBjb25zdCBtYW5pZmVzdFhtbCA9IChhd2FpdCBleGVjKGFwa2FuYWx5emVyUGF0aCwgYXJncywge1xuICAgIHNoZWxsOiB0cnVlLFxuICAgIGN3ZDogcGF0aC5kaXJuYW1lKGFwa2FuYWx5emVyUGF0aClcbiAgfSkpLnN0ZG91dDtcbiAgY29uc3QgZG9jID0gbmV3IHhtbGRvbS5ET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcobWFuaWZlc3RYbWwpO1xuICBjb25zdCBhcGtQYWNrYWdlQXR0cmlidXRlID0geHBhdGguc2VsZWN0MSgnLy9tYW5pZmVzdC9AcGFja2FnZScsIGRvYyk7XG4gIGlmICghYXBrUGFja2FnZUF0dHJpYnV0ZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IHBhcnNlIHBhY2thZ2UgbmFtZSBmcm9tICR7bWFuaWZlc3RYbWx9YCk7XG4gIH1cbiAgY29uc3QgYXBrUGFja2FnZSA9IGFwa1BhY2thZ2VBdHRyaWJ1dGUudmFsdWU7XG4gIC8vIExvb2sgZm9yIGFjdGl2aXR5IG9yIGFjdGl2aXR5LWFsaWFzIHdpdGhcbiAgLy8gYWN0aW9uID09IGFuZHJvaWQuaW50ZW50LmFjdGlvbi5NQUlOIGFuZFxuICAvLyBjYXRlZ29yeSA9PSBhbmRyb2lkLmludGVudC5jYXRlZ29yeS5MQVVOQ0hFUlxuICAvLyBkZXNjZW5kYW50c1xuICBjb25zdCBhcGtBY3Rpdml0eUF0dHJpYnV0ZSA9IHhwYXRoLnNlbGVjdDEoXG4gICAgXCIvL2FwcGxpY2F0aW9uLypbc3RhcnRzLXdpdGgobmFtZSgpLCAnYWN0aXZpdHknKSBcIiArXG4gICAgXCJhbmQgLi8vYWN0aW9uW0AqW2xvY2FsLW5hbWUoKT0nbmFtZScgYW5kIC49J2FuZHJvaWQuaW50ZW50LmFjdGlvbi5NQUlOJ11dIFwiICtcbiAgICBcImFuZCAuLy9jYXRlZ29yeVtAKltsb2NhbC1uYW1lKCk9J25hbWUnIGFuZCAuPSdhbmRyb2lkLmludGVudC5jYXRlZ29yeS5MQVVOQ0hFUiddXV1cIiArXG4gICAgXCIvQCpbbG9jYWwtbmFtZSgpPSduYW1lJ11cIiwgZG9jKTtcbiAgaWYgKCFhcGtBY3Rpdml0eUF0dHJpYnV0ZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IHBhcnNlIG1haW4gYWN0aXZpdHkgbmFtZSBmcm9tICR7bWFuaWZlc3RYbWx9YCk7XG4gIH1cbiAgY29uc3QgYXBrQWN0aXZpdHkgPSBhcGtBY3Rpdml0eUF0dHJpYnV0ZS52YWx1ZTtcbiAgcmV0dXJuIHthcGtQYWNrYWdlLCBhcGtBY3Rpdml0eX07XG59XG5cbi8qKlxuICogRXh0cmFjdCBwYWNrYWdlIGFuZCBtYWluIGFjdGl2aXR5IG5hbWUgZnJvbSBhcHBsaWNhdGlvbiBtYW5pZmVzdC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gYXBwUGF0aCAtIFRoZSBmdWxsIHBhdGggdG8gYXBwbGljYXRpb24gLmFwayhzKSBwYWNrYWdlXG4gKiBAcmV0dXJuIHtBUEtJbmZvfSBUaGUgcGFyc2VkIGFwcGxpY2F0aW9uIGluZm8uXG4gKiBAdGhyb3dzIHtlcnJvcn0gSWYgdGhlcmUgd2FzIGFuIGVycm9yIHdoaWxlIGdldHRpbmcgdGhlIGRhdGEgZnJvbSB0aGUgZ2l2ZW5cbiAqICAgICAgICAgICAgICAgICBhcHBsaWNhdGlvbiBwYWNrYWdlLlxuICovXG5tYW5pZmVzdE1ldGhvZHMucGFja2FnZUFuZExhdW5jaEFjdGl2aXR5RnJvbU1hbmlmZXN0ID0gYXN5bmMgZnVuY3Rpb24gKGFwcFBhdGgpIHtcbiAgaWYgKGFwcFBhdGguZW5kc1dpdGgoQVBLU19FWFRFTlNJT04pKSB7XG4gICAgYXBwUGF0aCA9IGF3YWl0IHRoaXMuZXh0cmFjdEJhc2VBcGsoYXBwUGF0aCk7XG4gIH1cblxuICBjb25zdCBhcGtJbmZvR2V0dGVycyA9IFtcbiAgICBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBhcGthbmFseXplclBhdGggPSBhd2FpdCBnZXRBcGthbmFseXplckZvck9zKHRoaXMpO1xuICAgICAgcmV0dXJuIGF3YWl0IGV4dHJhY3RBcGtJbmZvV2l0aEFwa2FuYWx5emVyKGFwcFBhdGgsIGFwa2FuYWx5emVyUGF0aCk7XG4gICAgfSxcbiAgICBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCB0aGlzLmluaXRBYXB0KCk7XG4gICAgICByZXR1cm4gYXdhaXQgZXh0cmFjdEFwa0luZm9XaXRoQXBrVG9vbHMoYXBwUGF0aCxcbiAgICAgICAgdGhpcy5iaW5hcmllcy5hYXB0LCB0aGlzLmphcnNbJ2FwcGl1bV9hcGtfdG9vbHMuamFyJ10sIHRoaXMudG1wRGlyKTtcbiAgICB9LFxuICBdO1xuXG4gIGxldCBzYXZlZEVycm9yO1xuICBmb3IgKGNvbnN0IGluZm9HZXR0ZXIgb2YgYXBrSW5mb0dldHRlcnMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qge2Fwa1BhY2thZ2UsIGFwa0FjdGl2aXR5fSA9IGF3YWl0IGluZm9HZXR0ZXIoKTtcbiAgICAgIGxvZy5pbmZvKGBQYWNrYWdlIG5hbWU6ICcke2Fwa1BhY2thZ2V9J2ApO1xuICAgICAgbG9nLmluZm8oYE1haW4gYWN0aXZpdHkgbmFtZTogJyR7YXBrQWN0aXZpdHl9J2ApO1xuICAgICAgcmV0dXJuIHthcGtQYWNrYWdlLCBhcGtBY3Rpdml0eX07XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGluZm9HZXR0ZXIgIT09IF8ubGFzdChhcGtJbmZvR2V0dGVycykpIHtcbiAgICAgICAgbG9nLmluZm8oYFVzaW5nIHRoZSBhbHRlcm5hdGl2ZSBhY3Rpdml0eSBuYW1lIGRldGVjdGlvbiBtZXRob2QgYmVjYXVzZSBvZjogJHtlLm1lc3NhZ2V9YCk7XG4gICAgICB9XG4gICAgICBzYXZlZEVycm9yID0gZTtcbiAgICB9XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGBwYWNrYWdlQW5kTGF1bmNoQWN0aXZpdHlGcm9tTWFuaWZlc3QgZmFpbGVkLiBPcmlnaW5hbCBlcnJvcjogJHtzYXZlZEVycm9yLm1lc3NhZ2V9YCArXG4gICAgICAgICAgICAgICAgICAoc2F2ZWRFcnJvci5zdGRlcnIgPyBgOyBTdGRFcnI6ICR7c2F2ZWRFcnJvci5zdGRlcnJ9YCA6ICcnKSk7XG59O1xuXG4vKipcbiAqIEV4dHJhY3QgdGFyZ2V0IFNESyB2ZXJzaW9uIGZyb20gYXBwbGljYXRpb24gbWFuaWZlc3QuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGFwcFBhdGggLSBUaGUgZnVsbCBwYXRoIHRvIC5hcGsocykgcGFja2FnZS5cbiAqIEByZXR1cm4ge251bWJlcn0gVGhlIHZlcnNpb24gb2YgdGhlIHRhcmdldCBTREsuXG4gKiBAdGhyb3dzIHtlcnJvcn0gSWYgdGhlcmUgd2FzIGFuIGVycm9yIHdoaWxlIGdldHRpbmcgdGhlIGRhdGEgZnJvbSB0aGUgZ2l2ZW5cbiAqICAgICAgICAgICAgICAgICBhcHBsaWNhdGlvbiBwYWNrYWdlLlxuICovXG5tYW5pZmVzdE1ldGhvZHMudGFyZ2V0U2RrVmVyc2lvbkZyb21NYW5pZmVzdCA9IGFzeW5jIGZ1bmN0aW9uIChhcHBQYXRoKSB7XG4gIGF3YWl0IHRoaXMuaW5pdEFhcHQoKTtcblxuICBpZiAoYXBwUGF0aC5lbmRzV2l0aChBUEtTX0VYVEVOU0lPTikpIHtcbiAgICBhcHBQYXRoID0gYXdhaXQgdGhpcy5leHRyYWN0QmFzZUFwayhhcHBQYXRoKTtcbiAgfVxuXG4gIGxvZy5pbmZvKFwiRXh0cmFjdGluZyBwYWNrYWdlIGFuZCBsYXVuY2ggYWN0aXZpdHkgZnJvbSBtYW5pZmVzdFwiKTtcbiAgbGV0IGFyZ3MgPSBbJ2R1bXAnLCAnYmFkZ2luZycsIGFwcFBhdGhdO1xuICBsZXQgb3V0cHV0O1xuICB0cnkge1xuICAgIGxldCB7c3Rkb3V0fSA9IGF3YWl0IGV4ZWModGhpcy5iaW5hcmllcy5hYXB0LCBhcmdzKTtcbiAgICBvdXRwdXQgPSBzdGRvdXQ7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGZldGNoaW5nIHRhcmdldFNka1ZlcnNpb24gZnJvbSBsb2NhbCBBUEsgZmFpbGVkLiBPcmlnaW5hbCBlcnJvcjogJHtlLm1lc3NhZ2V9YCk7XG4gIH1cbiAgbGV0IHRhcmdldFNka1ZlcnNpb24gPSBuZXcgUmVnRXhwKC90YXJnZXRTZGtWZXJzaW9uOicoW14nXSspJy9nKS5leGVjKG91dHB1dCk7XG4gIGlmICghdGFyZ2V0U2RrVmVyc2lvbikge1xuICAgIHRocm93IG5ldyBFcnJvcihgdGFyZ2V0U2RrVmVyc2lvbiBpcyBub3Qgc3BlY2lmaWVkIGluIHRoZSBhcHBsaWNhdGlvbi5gKTtcbiAgfVxuICByZXR1cm4gcGFyc2VJbnQodGFyZ2V0U2RrVmVyc2lvblsxXSwgMTApO1xufTtcblxuLyoqXG4gKiBFeHRyYWN0IHRhcmdldCBTREsgdmVyc2lvbiBmcm9tIHBhY2thZ2UgaW5mb3JtYXRpb24uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHBrZyAtIFRoZSBjbGFzcyBuYW1lIG9mIHRoZSBwYWNrYWdlIGluc3RhbGxlZCBvbiB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKiBAcGFyYW0gez9zdHJpbmd9IGNtZE91dHB1dCAtIE9wdGlvbmFsIHBhcmFtZXRlciBjb250YWluaW5nIHRoZSBvdXRwdXQgb2ZcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX2R1bXBzeXMgcGFja2FnZV8gY29tbWFuZC4gSXQgbWF5IHNwZWVkIHVwIHRoZSBtZXRob2QgZXhlY3V0aW9uLlxuICogQHJldHVybiB7bnVtYmVyfSBUaGUgdmVyc2lvbiBvZiB0aGUgdGFyZ2V0IFNESy5cbiAqL1xubWFuaWZlc3RNZXRob2RzLnRhcmdldFNka1ZlcnNpb25Vc2luZ1BLRyA9IGFzeW5jIGZ1bmN0aW9uIChwa2csIGNtZE91dHB1dCA9IG51bGwpIHtcbiAgbGV0IHN0ZG91dCA9IGNtZE91dHB1dCB8fCBhd2FpdCB0aGlzLnNoZWxsKFsnZHVtcHN5cycsICdwYWNrYWdlJywgcGtnXSk7XG4gIGxldCB0YXJnZXRTZGtWZXJzaW9uID0gbmV3IFJlZ0V4cCgvdGFyZ2V0U2RrPShbXlxcc1xcc10rKS9nKS5leGVjKHN0ZG91dCk7XG4gIGlmICh0YXJnZXRTZGtWZXJzaW9uICYmIHRhcmdldFNka1ZlcnNpb24ubGVuZ3RoID49IDIpIHtcbiAgICB0YXJnZXRTZGtWZXJzaW9uID0gdGFyZ2V0U2RrVmVyc2lvblsxXTtcbiAgfSBlbHNlIHtcbiAgICAvLyB0YXJnZXRTZGsgbm90IGZvdW5kIGluIHRoZSBkdW1wLCBhc3NpZ25pbmcgMCB0byB0YXJnZXRTZGtWZXJzaW9uXG4gICAgdGFyZ2V0U2RrVmVyc2lvbiA9IDA7XG4gIH1cbiAgcmV0dXJuIHBhcnNlSW50KHRhcmdldFNka1ZlcnNpb24sIDEwKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlIGJpbmFyeSByZXByZXNlbnRhdGlvbiBvZiBwYWNrYWdlIG1hbmlmZXN0ICh1c3VhbGx5IEFuZHJvaWRNYW5pZmVzdC54bWwpLlxuICogYCR7bWFuaWZlc3R9LmFwa2AgZmlsZSB3aWxsIGJlIGNyZWF0ZWQgYXMgdGhlIHJlc3VsdCBvZiB0aGlzIG1ldGhvZFxuICogY29udGFpbmluZyB0aGUgY29tcGlsZWQgbWFuaWZlc3QuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG1hbmlmZXN0IC0gRnVsbCBwYXRoIHRvIHRoZSBpbml0aWFsIG1hbmlmZXN0IHRlbXBsYXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gbWFuaWZlc3RQYWNrYWdlIC0gVGhlIG5hbWUgb2YgdGhlIG1hbmlmZXN0IHBhY2thZ2VcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YXJnZXRQYWNrYWdlIC0gVGhlIG5hbWUgb2YgdGhlIGRlc3RpbmF0aW9uIHBhY2thZ2VcbiAqL1xubWFuaWZlc3RNZXRob2RzLmNvbXBpbGVNYW5pZmVzdCA9IGFzeW5jIGZ1bmN0aW9uIChtYW5pZmVzdCwgbWFuaWZlc3RQYWNrYWdlLCB0YXJnZXRQYWNrYWdlKSB7XG4gIGNvbnN0IHtwbGF0Zm9ybSwgcGxhdGZvcm1QYXRofSA9IGF3YWl0IGdldEFuZHJvaWRQbGF0Zm9ybUFuZFBhdGgoKTtcbiAgaWYgKCFwbGF0Zm9ybSkge1xuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNvbXBpbGUgdGhlIG1hbmlmZXN0LiBUaGUgcmVxdWlyZWQgcGxhdGZvcm0gZG9lcyBub3QgZXhpc3QgKEFQSSBsZXZlbCA+PSAxNyknKTtcbiAgfVxuICBjb25zdCByZXN1bHRQYXRoID0gYCR7bWFuaWZlc3R9LmFwa2A7XG4gIGNvbnN0IGFyZ3MgPSBbXG4gICAgJ3BhY2thZ2UnLFxuICAgICctTScsIG1hbmlmZXN0LFxuICAgICctLXJlbmFtZS1tYW5pZmVzdC1wYWNrYWdlJywgbWFuaWZlc3RQYWNrYWdlLFxuICAgICctLXJlbmFtZS1pbnN0cnVtZW50YXRpb24tdGFyZ2V0LXBhY2thZ2UnLCB0YXJnZXRQYWNrYWdlLFxuICAgICctSScsIHBhdGgucmVzb2x2ZShwbGF0Zm9ybVBhdGgsICdhbmRyb2lkLmphcicpLFxuICAgICctRicsIHJlc3VsdFBhdGgsXG4gICAgJy1mJyxcbiAgXTtcbiAgdHJ5IHtcbiAgICBhd2FpdCB0aGlzLmluaXRBYXB0KCk7XG4gICAgbG9nLmRlYnVnKGBDb21waWxpbmcgdGhlIG1hbmlmZXN0OiAke3RoaXMuYmluYXJpZXMuYWFwdH0gJHtxdW90ZShhcmdzKX1gKTtcbiAgICBhd2FpdCBleGVjKHRoaXMuYmluYXJpZXMuYWFwdCwgYXJncyk7XG4gICAgbG9nLmRlYnVnKGBDb21waWxlZCB0aGUgbWFuaWZlc3QgYXQgJyR7cmVzdWx0UGF0aH0nYCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGNvbXBpbGUgdGhlIG1hbmlmZXN0LiBPcmlnaW5hbCBlcnJvcjogJHtlcnIubWVzc2FnZX1gKTtcbiAgfVxufTtcblxuLyoqXG4gKiBSZXBsYWNlL2luc2VydCB0aGUgc3BlY2lhbGx5IHByZWNvbXBpbGVkIG1hbmlmZXN0IGZpbGUgaW50byB0aGVcbiAqIHBhcnRpY3VsYXIgcGFja2FnZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbWFuaWZlc3QgLSBGdWxsIHBhdGggdG8gdGhlIHByZWNvbXBpbGVkIG1hbmlmZXN0XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVkIGJ5IGBjb21waWxlTWFuaWZlc3RgIG1ldGhvZCBjYWxsXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aXRob3V0IC5hcGsgZXh0ZW5zaW9uXG4gKiBAcGFyYW0ge3N0cmluZ30gc3JjQXBrIC0gRnVsbCBwYXRoIHRvIHRoZSBleGlzdGluZyB2YWxpZCBhcHBsaWNhdGlvbiBwYWNrYWdlLCB3aGVyZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMgbWFuaWZlc3QgaGFzIHRvIGJlIGluc2V0cmVkIHRvLiBUaGlzIHBhY2thZ2VcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICB3aWxsIE5PVCBiZSBtb2RpZmllZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBkc3RBcGsgLSBGdWxsIHBhdGggdG8gdGhlIHJlc3VsdGluZyBwYWNrYWdlLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBmaWxlIHdpbGwgYmUgb3ZlcnJpZGVuIGlmIGl0IGFscmVhZHkgZXhpc3RzLlxuICovXG5tYW5pZmVzdE1ldGhvZHMuaW5zZXJ0TWFuaWZlc3QgPSBhc3luYyBmdW5jdGlvbiAobWFuaWZlc3QsIHNyY0FwaywgZHN0QXBrKSB7XG4gIGxvZy5kZWJ1ZyhgSW5zZXJ0aW5nIG1hbmlmZXN0LCBzcmM6ICR7c3JjQXBrfSBkc3Q6ICR7ZHN0QXBrfWApO1xuICBhd2FpdCB0aGlzLmluaXRBYXB0KCk7XG4gIGF3YWl0IHVuemlwRmlsZShgJHttYW5pZmVzdH0uYXBrYCk7XG4gIGF3YWl0IGZzLmNvcHlGaWxlKHNyY0FwaywgZHN0QXBrKTtcbiAgbG9nLmRlYnVnKFwiVGVzdGluZyBuZXcgdG1wIGFwa1wiKTtcbiAgYXdhaXQgemlwLmFzc2VydFZhbGlkWmlwKGRzdEFwayk7XG4gIGxvZy5kZWJ1ZyhcIk1vdmluZyBtYW5pZmVzdFwiKTtcbiAgdHJ5IHtcbiAgICBhd2FpdCBleGVjKHRoaXMuYmluYXJpZXMuYWFwdCwgW1xuICAgICAgJ3JlbW92ZScsIGRzdEFwaywgcGF0aC5iYXNlbmFtZShtYW5pZmVzdClcbiAgICBdKTtcbiAgfSBjYXRjaCAoaWduKSB7fVxuICBhd2FpdCBleGVjKHRoaXMuYmluYXJpZXMuYWFwdCwgW1xuICAgICdhZGQnLCBkc3RBcGssIHBhdGguYmFzZW5hbWUobWFuaWZlc3QpXG4gIF0sIHtjd2Q6IHBhdGguZGlybmFtZShtYW5pZmVzdCl9KTtcbiAgbG9nLmRlYnVnKFwiSW5zZXJ0ZWQgbWFuaWZlc3QuXCIpO1xufTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHBhY2thZ2UgbWFuaWZlc3QgY29udGFpbnMgSW50ZXJuZXQgcGVybWlzc2lvbnMuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGFwcFBhdGggLSBUaGUgZnVsbCBwYXRoIHRvIC5hcGsocykgcGFja2FnZS5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIG1hbmlmZXN0IHJlcXVpcmVzIEludGVybmV0IGFjY2VzcyBwZXJtaXNzaW9uLlxuICovXG5tYW5pZmVzdE1ldGhvZHMuaGFzSW50ZXJuZXRQZXJtaXNzaW9uRnJvbU1hbmlmZXN0ID0gYXN5bmMgZnVuY3Rpb24gKGFwcFBhdGgpIHtcbiAgYXdhaXQgdGhpcy5pbml0QWFwdCgpO1xuXG4gIGlmIChhcHBQYXRoLmVuZHNXaXRoKEFQS1NfRVhURU5TSU9OKSkge1xuICAgIGFwcFBhdGggPSBhd2FpdCB0aGlzLmV4dHJhY3RCYXNlQXBrKGFwcFBhdGgpO1xuICB9XG5cbiAgbG9nLmRlYnVnKGBDaGVja2luZyBpZiAnJHthcHBQYXRofScgcmVxdWlyZXMgaW50ZXJuZXQgYWNjZXNzIHBlcm1pc3Npb24gaW4gdGhlIG1hbmlmZXN0YCk7XG4gIHRyeSB7XG4gICAgbGV0IHtzdGRvdXR9ID0gYXdhaXQgZXhlYyh0aGlzLmJpbmFyaWVzLmFhcHQsIFsnZHVtcCcsICdiYWRnaW5nJywgYXBwUGF0aF0pO1xuICAgIHJldHVybiBuZXcgUmVnRXhwKC91c2VzLXBlcm1pc3Npb246LionYW5kcm9pZC5wZXJtaXNzaW9uLklOVEVSTkVUJy8pLnRlc3Qoc3Rkb3V0KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGNoZWNrIGlmICcke2FwcFBhdGh9JyByZXF1aXJlcyBpbnRlcm5ldCBhY2Nlc3MgcGVybWlzc2lvbi4gYCArXG4gICAgICAgICAgICAgICAgICAgIGBPcmlnaW5hbCBlcnJvcjogJHtlLm1lc3NhZ2V9YCk7XG4gIH1cbn07XG5cbi8qKlxuICogUHJpbnRzIG91dCB0aGUgbWFuaWZlc3QgZXh0cmFjdGVkIGZyb20gdGhlIGFwa1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBhcHBQYXRoIC0gVGhlIGZ1bGwgcGF0aCB0byBhcHBsaWNhdGlvbiBwYWNrYWdlLlxuICogQHBhcmFtIHs/c3RyaW5nfSBsb2dMZXZlbCAtIFRoZSBsZXZlbCBhdCB3aGljaCB0byBsb2cuIEUuZy4sICdkZWJ1ZydcbiAqL1xubWFuaWZlc3RNZXRob2RzLnByaW50TWFuaWZlc3RGcm9tQXBrID0gYXN5bmMgZnVuY3Rpb24gcHJpbnRNYW5pZmVzdEZyb21BcGsgKGFwcFBhdGgsIGxvZ0xldmVsID0gJ2RlYnVnJykge1xuICBhd2FpdCB0aGlzLmluaXRBYXB0KCk7XG5cbiAgaWYgKGFwcFBhdGguZW5kc1dpdGgoQVBLU19FWFRFTlNJT04pKSB7XG4gICAgYXBwUGF0aCA9IGF3YWl0IHRoaXMuZXh0cmFjdEJhc2VBcGsoYXBwUGF0aCk7XG4gIH1cblxuICBsb2dbbG9nTGV2ZWxdKGBFeHRyYWN0aW5nIHRoZSBtYW5pZmVzdCBmcm9tICcke2FwcFBhdGh9J2ApO1xuICBsZXQgb3V0ID0gZmFsc2U7XG4gIGNvbnN0IHtzdGRvdXR9ID0gYXdhaXQgZXhlYyh0aGlzLmJpbmFyaWVzLmFhcHQsIFsnbCcsICctYScsIGFwcFBhdGhdKTtcbiAgZm9yIChjb25zdCBsaW5lIG9mIHN0ZG91dC5zcGxpdCgnXFxuJykpIHtcbiAgICBpZiAoIW91dCAmJiBsaW5lLmluY2x1ZGVzKCdBbmRyb2lkIG1hbmlmZXN0OicpKSB7XG4gICAgICBvdXQgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAob3V0KSB7XG4gICAgICBsb2dbbG9nTGV2ZWxdKGxpbmUpO1xuICAgIH1cbiAgfVxufTtcblxuXG5leHBvcnQgZGVmYXVsdCBtYW5pZmVzdE1ldGhvZHM7XG4iXSwiZmlsZSI6ImxpYi90b29scy9hbmRyb2lkLW1hbmlmZXN0LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uIn0=
