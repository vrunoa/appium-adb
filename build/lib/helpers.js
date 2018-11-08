"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAndroidPlatformAndPath = getAndroidPlatformAndPath;
exports.unzipFile = unzipFile;
exports.getIMEListFromOutput = getIMEListFromOutput;
exports.isShowingLockscreen = isShowingLockscreen;
exports.isCurrentFocusOnKeyguard = isCurrentFocusOnKeyguard;
exports.getSurfaceOrientation = getSurfaceOrientation;
exports.isScreenOnFully = isScreenOnFully;
exports.buildStartCmd = buildStartCmd;
exports.getJavaHome = getJavaHome;
exports.getApksignerForOs = getApksignerForOs;
exports.getApkanalyzerForOs = getApkanalyzerForOs;
exports.buildInstallArgs = buildInstallArgs;
exports.APK_EXTENSION = exports.APKS_INSTALL_TIMEOUT = exports.APK_INSTALL_TIMEOUT = exports.APKS_EXTENSION = exports.extractMatchingPermissions = exports.getOpenSslForOs = exports.getBuildToolsDirs = exports.getSdkToolsVersion = exports.rootDir = exports.getJavaForOs = void 0;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _path = _interopRequireDefault(require("path"));

var _appiumSupport = require("appium-support");

var _logger = _interopRequireDefault(require("./logger.js"));

var _lodash = _interopRequireDefault(require("lodash"));

var _bluebird = _interopRequireDefault(require("bluebird"));

var _semver = _interopRequireDefault(require("semver"));

const rootDir = _path.default.resolve(__dirname, process.env.NO_PRECOMPILE ? '..' : '../..');

exports.rootDir = rootDir;
const APKS_EXTENSION = '.apks';
exports.APKS_EXTENSION = APKS_EXTENSION;
const APK_EXTENSION = '.apk';
exports.APK_EXTENSION = APK_EXTENSION;
const APK_INSTALL_TIMEOUT = 60000;
exports.APK_INSTALL_TIMEOUT = APK_INSTALL_TIMEOUT;
const APKS_INSTALL_TIMEOUT = APK_INSTALL_TIMEOUT * 2;
exports.APKS_INSTALL_TIMEOUT = APKS_INSTALL_TIMEOUT;

function getAndroidPlatformAndPath() {
  return _getAndroidPlatformAndPath.apply(this, arguments);
}

function _getAndroidPlatformAndPath() {
  _getAndroidPlatformAndPath = (0, _asyncToGenerator2.default)(function* () {
    const androidHome = process.env.ANDROID_HOME;

    if (!_lodash.default.isString(androidHome)) {
      throw new Error("ANDROID_HOME environment variable was not exported");
    }

    let propsPaths = yield _appiumSupport.fs.glob(_path.default.resolve(androidHome, 'platforms', '*', 'build.prop'), {
      absolute: true
    });
    const platformsMapping = {};
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = propsPaths[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        const propsPath = _step5.value;
        const propsContent = yield _appiumSupport.fs.readFile(propsPath, 'utf-8');

        const platformPath = _path.default.dirname(propsPath);

        const platform = _path.default.basename(platformPath);

        const match = /ro\.build\.version\.sdk=(\d+)/.exec(propsContent);

        if (!match) {
          _logger.default.warn(`Cannot read the SDK version from '${propsPath}'. Skipping '${platform}'`);

          continue;
        }

        platformsMapping[parseInt(match[1], 10)] = {
          platform,
          platformPath
        };
      }
    } catch (err) {
      _didIteratorError5 = true;
      _iteratorError5 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion5 && _iterator5.return != null) {
          _iterator5.return();
        }
      } finally {
        if (_didIteratorError5) {
          throw _iteratorError5;
        }
      }
    }

    if (_lodash.default.isEmpty(platformsMapping)) {
      _logger.default.warn(`Found zero platform folders at '${_path.default.resolve(androidHome, 'platforms')}'. ` + `Do you have any Android SDKs installed?`);

      return {
        platform: null,
        platformPath: null
      };
    }

    const recentSdkVersion = _lodash.default.keys(platformsMapping).sort().reverse()[0];

    const result = platformsMapping[recentSdkVersion];

    _logger.default.debug(`Found the most recent Android platform: ${JSON.stringify(result)}`);

    return result;
  });
  return _getAndroidPlatformAndPath.apply(this, arguments);
}

function unzipFile(_x) {
  return _unzipFile.apply(this, arguments);
}

function _unzipFile() {
  _unzipFile = (0, _asyncToGenerator2.default)(function* (zipPath, dstRoot = _path.default.dirname(zipPath)) {
    _logger.default.debug(`Unzipping '${zipPath}' to '${dstRoot}'`);

    yield _appiumSupport.zip.assertValidZip(zipPath);
    yield _appiumSupport.zip.extractAllTo(zipPath, dstRoot);

    _logger.default.debug("Unzip successful");
  });
  return _unzipFile.apply(this, arguments);
}

function getIMEListFromOutput(stdout) {
  let engines = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = stdout.split('\n')[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      let line = _step.value;

      if (line.length > 0 && line[0] !== ' ') {
        engines.push(line.trim().replace(/:$/, ''));
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

  return engines;
}

const getJavaForOs = _lodash.default.memoize(() => {
  return _path.default.resolve(getJavaHome(), 'bin', `java${_appiumSupport.system.isWindows() ? '.exe' : ''}`);
});

exports.getJavaForOs = getJavaForOs;

const getOpenSslForOs = function () {
  var _ref = (0, _asyncToGenerator2.default)(function* () {
    const binaryName = `openssl${_appiumSupport.system.isWindows() ? '.exe' : ''}`;

    try {
      return yield _appiumSupport.fs.which(binaryName);
    } catch (err) {
      throw new Error('The openssl tool must be installed on the system and available on the path');
    }
  });

  return function getOpenSslForOs() {
    return _ref.apply(this, arguments);
  };
}();

exports.getOpenSslForOs = getOpenSslForOs;

function getJavaHome() {
  if (process.env.JAVA_HOME) {
    return process.env.JAVA_HOME;
  }

  throw new Error("JAVA_HOME is not set currently. Please set JAVA_HOME.");
}

function getApksignerForOs(_x2) {
  return _getApksignerForOs.apply(this, arguments);
}

function _getApksignerForOs() {
  _getApksignerForOs = (0, _asyncToGenerator2.default)(function* (sysHelpers) {
    return yield sysHelpers.getBinaryFromSdkRoot('apksigner');
  });
  return _getApksignerForOs.apply(this, arguments);
}

function getApkanalyzerForOs(_x3) {
  return _getApkanalyzerForOs.apply(this, arguments);
}

function _getApkanalyzerForOs() {
  _getApkanalyzerForOs = (0, _asyncToGenerator2.default)(function* (sysHelpers) {
    return yield sysHelpers.getBinaryFromSdkRoot('apkanalyzer');
  });
  return _getApkanalyzerForOs.apply(this, arguments);
}

function isShowingLockscreen(dumpsys) {
  return /(mShowingLockscreen=true|mDreamingLockscreen=true)/gi.test(dumpsys);
}

function isCurrentFocusOnKeyguard(dumpsys) {
  let m = /mCurrentFocus.+Keyguard/gi.exec(dumpsys);
  return m && m.length && m[0] ? true : false;
}

function getSurfaceOrientation(dumpsys) {
  let m = /SurfaceOrientation: \d/gi.exec(dumpsys);
  return m && parseInt(m[0].split(':')[1], 10);
}

function isScreenOnFully(dumpsys) {
  let m = /mScreenOnFully=\w+/gi.exec(dumpsys);
  return !m || m && m.length > 0 && m[0].split('=')[1] === 'true' || false;
}

function buildStartCmd(startAppOptions, apiLevel) {
  let cmd = ['am', 'start'];

  if (_appiumSupport.util.hasValue(startAppOptions.user)) {
    cmd.push('--user', startAppOptions.user);
  }

  cmd.push('-W', '-n', `${startAppOptions.pkg}/${startAppOptions.activity}`);

  if (startAppOptions.stopApp && apiLevel >= 15) {
    cmd.push('-S');
  }

  if (startAppOptions.action) {
    cmd.push('-a', startAppOptions.action);
  }

  if (startAppOptions.category) {
    cmd.push('-c', startAppOptions.category);
  }

  if (startAppOptions.flags) {
    cmd.push('-f', startAppOptions.flags);
  }

  if (startAppOptions.optionalIntentArguments) {
    let parseKeyValue = function parseKeyValue(str) {
      str = str.trim();
      let space = str.indexOf(' ');

      if (space === -1) {
        return str.length ? [str] : [];
      } else {
        return [str.substring(0, space).trim(), str.substring(space + 1).trim()];
      }
    };

    let optionalIntentArguments = ` ${startAppOptions.optionalIntentArguments}`;
    let re = / (-[^\s]+) (.+)/;

    while (true) {
      let args = re.exec(optionalIntentArguments);

      if (!args) {
        if (optionalIntentArguments.length) {
          cmd.push.apply(cmd, parseKeyValue(optionalIntentArguments));
        }

        break;
      }

      let flag = args[1];
      let flagPos = optionalIntentArguments.indexOf(flag);

      if (flagPos !== 0) {
        let prevArgs = optionalIntentArguments.substring(0, flagPos);
        cmd.push.apply(cmd, parseKeyValue(prevArgs));
      }

      cmd.push(flag);
      optionalIntentArguments = args[2];
    }
  }

  return cmd;
}

const getSdkToolsVersion = _lodash.default.memoize(function () {
  var _getSdkToolsVersion = (0, _asyncToGenerator2.default)(function* () {
    const androidHome = process.env.ANDROID_HOME;

    if (!androidHome) {
      throw new Error('ANDROID_HOME environment variable is expected to be set');
    }

    const propertiesPath = _path.default.resolve(androidHome, 'tools', 'source.properties');

    if (!(yield _appiumSupport.fs.exists(propertiesPath))) {
      _logger.default.warn(`Cannot find ${propertiesPath} file to read SDK version from`);

      return;
    }

    const propertiesContent = yield _appiumSupport.fs.readFile(propertiesPath, 'utf8');
    const versionMatcher = new RegExp(/Pkg\.Revision=(\d+)\.?(\d+)?\.?(\d+)?/);
    const match = versionMatcher.exec(propertiesContent);

    if (match) {
      return {
        major: parseInt(match[1], 10),
        minor: match[2] ? parseInt(match[2], 10) : 0,
        build: match[3] ? parseInt(match[3], 10) : 0
      };
    }

    _logger.default.warn(`Cannot parse "Pkg.Revision" value from ${propertiesPath}`);
  });

  return function getSdkToolsVersion() {
    return _getSdkToolsVersion.apply(this, arguments);
  };
}());

exports.getSdkToolsVersion = getSdkToolsVersion;

const getBuildToolsDirs = _lodash.default.memoize(function () {
  var _getBuildToolsDirs = (0, _asyncToGenerator2.default)(function* (sdkRoot) {
    let buildToolsDirs = yield _appiumSupport.fs.glob(_path.default.resolve(sdkRoot, 'build-tools', '*'), {
      absolute: true
    });

    try {
      buildToolsDirs = buildToolsDirs.map(dir => [_path.default.basename(dir), dir]).sort((a, b) => _semver.default.rcompare(a[0], b[0])).map(pair => pair[1]);
    } catch (err) {
      _logger.default.warn(`Cannot sort build-tools folders ${JSON.stringify(buildToolsDirs.map(dir => _path.default.basename(dir)))} ` + `by semantic version names.`);

      _logger.default.warn(`Falling back to sorting by modification date. Original error: ${err.message}`);

      const pairs = yield _bluebird.default.map(buildToolsDirs, function () {
        var _ref2 = (0, _asyncToGenerator2.default)(function* (dir) {
          return [(yield _appiumSupport.fs.stat(dir)).mtime.valueOf(), dir];
        });

        return function (_x5) {
          return _ref2.apply(this, arguments);
        };
      }());
      buildToolsDirs = pairs.sort((a, b) => a[0] < b[0]).map(pair => pair[1]);
    }

    _logger.default.info(`Found ${buildToolsDirs.length} 'build-tools' folders under '${sdkRoot}' (newest first):`);

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = buildToolsDirs[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        let dir = _step2.value;

        _logger.default.info(`    ${dir}`);
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

    return buildToolsDirs;
  });

  return function getBuildToolsDirs(_x4) {
    return _getBuildToolsDirs.apply(this, arguments);
  };
}());

exports.getBuildToolsDirs = getBuildToolsDirs;

const extractMatchingPermissions = function extractMatchingPermissions(dumpsysOutput, groupNames, grantedState = null) {
  const groupPatternByName = groupName => new RegExp(`^(\\s*${_lodash.default.escapeRegExp(groupName)} permissions:[\\s\\S]+)`, 'm');

  const indentPattern = /\S|$/;
  const permissionNamePattern = /android\.permission\.\w+/;
  const grantedStatePattern = /\bgranted=(\w+)/;
  const result = [];
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = groupNames[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      const groupName = _step3.value;
      const groupMatch = groupPatternByName(groupName).exec(dumpsysOutput);

      if (!groupMatch) {
        continue;
      }

      const lines = groupMatch[1].split('\n');

      if (lines.length < 2) {
        continue;
      }

      const titleIndent = lines[0].search(indentPattern);
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = lines.slice(1)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          const line = _step4.value;
          const currentIndent = line.search(indentPattern);

          if (currentIndent <= titleIndent) {
            break;
          }

          const permissionNameMatch = permissionNamePattern.exec(line);

          if (!permissionNameMatch) {
            continue;
          }

          const item = {
            permission: permissionNameMatch[0]
          };
          const grantedStateMatch = grantedStatePattern.exec(line);

          if (grantedStateMatch) {
            item.granted = grantedStateMatch[1] === 'true';
          }

          result.push(item);
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  const filteredResult = result.filter(item => !_lodash.default.isBoolean(grantedState) || item.granted === grantedState).map(item => item.permission);

  _logger.default.debug(`Retrieved ${filteredResult.length} permission(s) from ${JSON.stringify(groupNames)} group(s)`);

  return filteredResult;
};

exports.extractMatchingPermissions = extractMatchingPermissions;

function buildInstallArgs(apiLevel, options = {}) {
  const result = [];

  if (!_appiumSupport.util.hasValue(options.replace) || options.replace) {
    result.push('-r');
  }

  if (options.allowTestPackages) {
    result.push('-t');
  }

  if (options.useSdcard) {
    result.push('-s');
  }

  if (options.grantPermissions) {
    if (apiLevel < 23) {
      _logger.default.debug(`Skipping permissions grant option, since ` + `the current API level ${apiLevel} does not support applications ` + `permissions customization`);
    } else {
      result.push('-g');
    }
  }

  return result;
}require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9oZWxwZXJzLmpzIl0sIm5hbWVzIjpbInJvb3REaXIiLCJwYXRoIiwicmVzb2x2ZSIsIl9fZGlybmFtZSIsInByb2Nlc3MiLCJlbnYiLCJOT19QUkVDT01QSUxFIiwiQVBLU19FWFRFTlNJT04iLCJBUEtfRVhURU5TSU9OIiwiQVBLX0lOU1RBTExfVElNRU9VVCIsIkFQS1NfSU5TVEFMTF9USU1FT1VUIiwiZ2V0QW5kcm9pZFBsYXRmb3JtQW5kUGF0aCIsImFuZHJvaWRIb21lIiwiQU5EUk9JRF9IT01FIiwiXyIsImlzU3RyaW5nIiwiRXJyb3IiLCJwcm9wc1BhdGhzIiwiZnMiLCJnbG9iIiwiYWJzb2x1dGUiLCJwbGF0Zm9ybXNNYXBwaW5nIiwicHJvcHNQYXRoIiwicHJvcHNDb250ZW50IiwicmVhZEZpbGUiLCJwbGF0Zm9ybVBhdGgiLCJkaXJuYW1lIiwicGxhdGZvcm0iLCJiYXNlbmFtZSIsIm1hdGNoIiwiZXhlYyIsImxvZyIsIndhcm4iLCJwYXJzZUludCIsImlzRW1wdHkiLCJyZWNlbnRTZGtWZXJzaW9uIiwia2V5cyIsInNvcnQiLCJyZXZlcnNlIiwicmVzdWx0IiwiZGVidWciLCJKU09OIiwic3RyaW5naWZ5IiwidW56aXBGaWxlIiwiemlwUGF0aCIsImRzdFJvb3QiLCJ6aXAiLCJhc3NlcnRWYWxpZFppcCIsImV4dHJhY3RBbGxUbyIsImdldElNRUxpc3RGcm9tT3V0cHV0Iiwic3Rkb3V0IiwiZW5naW5lcyIsInNwbGl0IiwibGluZSIsImxlbmd0aCIsInB1c2giLCJ0cmltIiwicmVwbGFjZSIsImdldEphdmFGb3JPcyIsIm1lbW9pemUiLCJnZXRKYXZhSG9tZSIsInN5c3RlbSIsImlzV2luZG93cyIsImdldE9wZW5Tc2xGb3JPcyIsImJpbmFyeU5hbWUiLCJ3aGljaCIsImVyciIsIkpBVkFfSE9NRSIsImdldEFwa3NpZ25lckZvck9zIiwic3lzSGVscGVycyIsImdldEJpbmFyeUZyb21TZGtSb290IiwiZ2V0QXBrYW5hbHl6ZXJGb3JPcyIsImlzU2hvd2luZ0xvY2tzY3JlZW4iLCJkdW1wc3lzIiwidGVzdCIsImlzQ3VycmVudEZvY3VzT25LZXlndWFyZCIsIm0iLCJnZXRTdXJmYWNlT3JpZW50YXRpb24iLCJpc1NjcmVlbk9uRnVsbHkiLCJidWlsZFN0YXJ0Q21kIiwic3RhcnRBcHBPcHRpb25zIiwiYXBpTGV2ZWwiLCJjbWQiLCJ1dGlsIiwiaGFzVmFsdWUiLCJ1c2VyIiwicGtnIiwiYWN0aXZpdHkiLCJzdG9wQXBwIiwiYWN0aW9uIiwiY2F0ZWdvcnkiLCJmbGFncyIsIm9wdGlvbmFsSW50ZW50QXJndW1lbnRzIiwicGFyc2VLZXlWYWx1ZSIsInN0ciIsInNwYWNlIiwiaW5kZXhPZiIsInN1YnN0cmluZyIsInJlIiwiYXJncyIsImFwcGx5IiwiZmxhZyIsImZsYWdQb3MiLCJwcmV2QXJncyIsImdldFNka1Rvb2xzVmVyc2lvbiIsInByb3BlcnRpZXNQYXRoIiwiZXhpc3RzIiwicHJvcGVydGllc0NvbnRlbnQiLCJ2ZXJzaW9uTWF0Y2hlciIsIlJlZ0V4cCIsIm1ham9yIiwibWlub3IiLCJidWlsZCIsImdldEJ1aWxkVG9vbHNEaXJzIiwic2RrUm9vdCIsImJ1aWxkVG9vbHNEaXJzIiwibWFwIiwiZGlyIiwiYSIsImIiLCJzZW12ZXIiLCJyY29tcGFyZSIsInBhaXIiLCJtZXNzYWdlIiwicGFpcnMiLCJCIiwic3RhdCIsIm10aW1lIiwidmFsdWVPZiIsImluZm8iLCJleHRyYWN0TWF0Y2hpbmdQZXJtaXNzaW9ucyIsImR1bXBzeXNPdXRwdXQiLCJncm91cE5hbWVzIiwiZ3JhbnRlZFN0YXRlIiwiZ3JvdXBQYXR0ZXJuQnlOYW1lIiwiZ3JvdXBOYW1lIiwiZXNjYXBlUmVnRXhwIiwiaW5kZW50UGF0dGVybiIsInBlcm1pc3Npb25OYW1lUGF0dGVybiIsImdyYW50ZWRTdGF0ZVBhdHRlcm4iLCJncm91cE1hdGNoIiwibGluZXMiLCJ0aXRsZUluZGVudCIsInNlYXJjaCIsInNsaWNlIiwiY3VycmVudEluZGVudCIsInBlcm1pc3Npb25OYW1lTWF0Y2giLCJpdGVtIiwicGVybWlzc2lvbiIsImdyYW50ZWRTdGF0ZU1hdGNoIiwiZ3JhbnRlZCIsImZpbHRlcmVkUmVzdWx0IiwiZmlsdGVyIiwiaXNCb29sZWFuIiwiYnVpbGRJbnN0YWxsQXJncyIsIm9wdGlvbnMiLCJhbGxvd1Rlc3RQYWNrYWdlcyIsInVzZVNkY2FyZCIsImdyYW50UGVybWlzc2lvbnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBR0EsTUFBTUEsT0FBTyxHQUFHQyxjQUFLQyxPQUFMLENBQWFDLFNBQWIsRUFBd0JDLE9BQU8sQ0FBQ0MsR0FBUixDQUFZQyxhQUFaLEdBQTRCLElBQTVCLEdBQW1DLE9BQTNELENBQWhCOzs7QUFDQSxNQUFNQyxjQUFjLEdBQUcsT0FBdkI7O0FBQ0EsTUFBTUMsYUFBYSxHQUFHLE1BQXRCOztBQUNBLE1BQU1DLG1CQUFtQixHQUFHLEtBQTVCOztBQUNBLE1BQU1DLG9CQUFvQixHQUFHRCxtQkFBbUIsR0FBRyxDQUFuRDs7O1NBZWVFLHlCOzs7OzsrREFBZixhQUE0QztBQUMxQyxVQUFNQyxXQUFXLEdBQUdSLE9BQU8sQ0FBQ0MsR0FBUixDQUFZUSxZQUFoQzs7QUFDQSxRQUFJLENBQUNDLGdCQUFFQyxRQUFGLENBQVdILFdBQVgsQ0FBTCxFQUE4QjtBQUM1QixZQUFNLElBQUlJLEtBQUosQ0FBVSxvREFBVixDQUFOO0FBQ0Q7O0FBRUQsUUFBSUMsVUFBVSxTQUFTQyxrQkFBR0MsSUFBSCxDQUFRbEIsY0FBS0MsT0FBTCxDQUFhVSxXQUFiLEVBQTBCLFdBQTFCLEVBQXVDLEdBQXZDLEVBQTRDLFlBQTVDLENBQVIsRUFBbUU7QUFDeEZRLE1BQUFBLFFBQVEsRUFBRTtBQUQ4RSxLQUFuRSxDQUF2QjtBQUdBLFVBQU1DLGdCQUFnQixHQUFHLEVBQXpCO0FBVDBDO0FBQUE7QUFBQTs7QUFBQTtBQVUxQyw0QkFBd0JKLFVBQXhCLG1JQUFvQztBQUFBLGNBQXpC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LEtBQUosQ0FBVywyQ0FBRCxHQUNDLHlCQUF3QnlDLFFBQVMsaUNBRGxDLEdBRUMsMkJBRlg7QUFHRCxLQUpELE1BSU87QUFDTDFDLE1BQUFBLE1BQU0sQ0FBQ2dCLElBQVAsQ0FBWSxJQUFaO0FBQ0Q7QUFDRjs7QUFFRCxTQUFPaEIsTUFBUDtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBzeXN0ZW0sIGZzLCB6aXAsIHV0aWwgfSBmcm9tICdhcHBpdW0tc3VwcG9ydCc7XG5pbXBvcnQgbG9nIGZyb20gJy4vbG9nZ2VyLmpzJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgQiBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5cblxuY29uc3Qgcm9vdERpciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIHByb2Nlc3MuZW52Lk5PX1BSRUNPTVBJTEUgPyAnLi4nIDogJy4uLy4uJyk7XG5jb25zdCBBUEtTX0VYVEVOU0lPTiA9ICcuYXBrcyc7XG5jb25zdCBBUEtfRVhURU5TSU9OID0gJy5hcGsnO1xuY29uc3QgQVBLX0lOU1RBTExfVElNRU9VVCA9IDYwMDAwO1xuY29uc3QgQVBLU19JTlNUQUxMX1RJTUVPVVQgPSBBUEtfSU5TVEFMTF9USU1FT1VUICogMjtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBQbGF0Zm9ybUluZm9cbiAqIEBwcm9wZXJ0eSB7P3N0cmluZ30gcGxhdGZvcm0gLSBUaGUgcGxhdGZvcm0gbmFtZSwgZm9yIGV4YW1wbGUgYGFuZHJvaWQtMjRgXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3IgYG51bGxgIGlmIGl0IGNhbm5vdCBiZSBmb3VuZFxuICogQHByb3BlcnR5IHs/c3RyaW5nfSBwbGF0Zm9ybVBhdGggLSBGdWxsIHBhdGggdG8gdGhlIHBsYXRmb3JtIFNESyBmb2xkZXJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3IgYG51bGxgIGlmIGl0IGNhbm5vdCBiZSBmb3VuZFxuICovXG5cbi8qKlxuICogUmV0cmlldmUgdGhlIHBhdGggdG8gdGhlIHJlY2VudCBpbnN0YWxsZWQgQW5kcm9pZCBwbGF0Zm9ybS5cbiAqXG4gKiBAcmV0dXJuIHtQbGF0Zm9ybUluZm99IFRoZSByZXN1bHRpbmcgcGF0aCB0byB0aGUgbmV3ZXN0IGluc3RhbGxlZCBwbGF0Zm9ybS5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gZ2V0QW5kcm9pZFBsYXRmb3JtQW5kUGF0aCAoKSB7XG4gIGNvbnN0IGFuZHJvaWRIb21lID0gcHJvY2Vzcy5lbnYuQU5EUk9JRF9IT01FO1xuICBpZiAoIV8uaXNTdHJpbmcoYW5kcm9pZEhvbWUpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQU5EUk9JRF9IT01FIGVudmlyb25tZW50IHZhcmlhYmxlIHdhcyBub3QgZXhwb3J0ZWRcIik7XG4gIH1cblxuICBsZXQgcHJvcHNQYXRocyA9IGF3YWl0IGZzLmdsb2IocGF0aC5yZXNvbHZlKGFuZHJvaWRIb21lLCAncGxhdGZvcm1zJywgJyonLCAnYnVpbGQucHJvcCcpLCB7XG4gICAgYWJzb2x1dGU6IHRydWVcbiAgfSk7XG4gIGNvbnN0IHBsYXRmb3Jtc01hcHBpbmcgPSB7fTtcbiAgZm9yIChjb25zdCBwcm9wc1BhdGggb2YgcHJvcHNQYXRocykge1xuICAgIGNvbnN0IHByb3BzQ29udGVudCA9IGF3YWl0IGZzLnJlYWRGaWxlKHByb3BzUGF0aCwgJ3V0Zi04Jyk7XG4gICAgY29uc3QgcGxhdGZvcm1QYXRoID0gcGF0aC5kaXJuYW1lKHByb3BzUGF0aCk7XG4gICAgY29uc3QgcGxhdGZvcm0gPSBwYXRoLmJhc2VuYW1lKHBsYXRmb3JtUGF0aCk7XG4gICAgY29uc3QgbWF0Y2ggPSAvcm9cXC5idWlsZFxcLnZlcnNpb25cXC5zZGs9KFxcZCspLy5leGVjKHByb3BzQ29udGVudCk7XG4gICAgaWYgKCFtYXRjaCkge1xuICAgICAgbG9nLndhcm4oYENhbm5vdCByZWFkIHRoZSBTREsgdmVyc2lvbiBmcm9tICcke3Byb3BzUGF0aH0nLiBTa2lwcGluZyAnJHtwbGF0Zm9ybX0nYCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgcGxhdGZvcm1zTWFwcGluZ1twYXJzZUludChtYXRjaFsxXSwgMTApXSA9IHtcbiAgICAgIHBsYXRmb3JtLFxuICAgICAgcGxhdGZvcm1QYXRoLFxuICAgIH07XG4gIH1cbiAgaWYgKF8uaXNFbXB0eShwbGF0Zm9ybXNNYXBwaW5nKSkge1xuICAgIGxvZy53YXJuKGBGb3VuZCB6ZXJvIHBsYXRmb3JtIGZvbGRlcnMgYXQgJyR7cGF0aC5yZXNvbHZlKGFuZHJvaWRIb21lLCAncGxhdGZvcm1zJyl9Jy4gYCArXG4gICAgICBgRG8geW91IGhhdmUgYW55IEFuZHJvaWQgU0RLcyBpbnN0YWxsZWQ/YCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBsYXRmb3JtOiBudWxsLFxuICAgICAgcGxhdGZvcm1QYXRoOiBudWxsLFxuICAgIH07XG4gIH1cblxuICBjb25zdCByZWNlbnRTZGtWZXJzaW9uID0gXy5rZXlzKHBsYXRmb3Jtc01hcHBpbmcpLnNvcnQoKS5yZXZlcnNlKClbMF07XG4gIGNvbnN0IHJlc3VsdCA9IHBsYXRmb3Jtc01hcHBpbmdbcmVjZW50U2RrVmVyc2lvbl07XG4gIGxvZy5kZWJ1ZyhgRm91bmQgdGhlIG1vc3QgcmVjZW50IEFuZHJvaWQgcGxhdGZvcm06ICR7SlNPTi5zdHJpbmdpZnkocmVzdWx0KX1gKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gdW56aXBGaWxlICh6aXBQYXRoLCBkc3RSb290ID0gcGF0aC5kaXJuYW1lKHppcFBhdGgpKSB7XG4gIGxvZy5kZWJ1ZyhgVW56aXBwaW5nICcke3ppcFBhdGh9JyB0byAnJHtkc3RSb290fSdgKTtcbiAgYXdhaXQgemlwLmFzc2VydFZhbGlkWmlwKHppcFBhdGgpO1xuICBhd2FpdCB6aXAuZXh0cmFjdEFsbFRvKHppcFBhdGgsIGRzdFJvb3QpO1xuICBsb2cuZGVidWcoXCJVbnppcCBzdWNjZXNzZnVsXCIpO1xufVxuXG5mdW5jdGlvbiBnZXRJTUVMaXN0RnJvbU91dHB1dCAoc3Rkb3V0KSB7XG4gIGxldCBlbmdpbmVzID0gW107XG4gIGZvciAobGV0IGxpbmUgb2Ygc3Rkb3V0LnNwbGl0KCdcXG4nKSkge1xuICAgIGlmIChsaW5lLmxlbmd0aCA+IDAgJiYgbGluZVswXSAhPT0gJyAnKSB7XG4gICAgICAvLyByZW1vdmUgbmV3bGluZSBhbmQgdHJhaWxpbmcgY29sb24sIGFuZCBhZGQgdG8gdGhlIGxpc3RcbiAgICAgIGVuZ2luZXMucHVzaChsaW5lLnRyaW0oKS5yZXBsYWNlKC86JC8sICcnKSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBlbmdpbmVzO1xufVxuXG5jb25zdCBnZXRKYXZhRm9yT3MgPSBfLm1lbW9pemUoKCkgPT4ge1xuICByZXR1cm4gcGF0aC5yZXNvbHZlKGdldEphdmFIb21lKCksICdiaW4nLCBgamF2YSR7c3lzdGVtLmlzV2luZG93cygpID8gJy5leGUnIDogJyd9YCk7XG59KTtcblxuY29uc3QgZ2V0T3BlblNzbEZvck9zID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICBjb25zdCBiaW5hcnlOYW1lID0gYG9wZW5zc2wke3N5c3RlbS5pc1dpbmRvd3MoKSA/ICcuZXhlJyA6ICcnfWA7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGF3YWl0IGZzLndoaWNoKGJpbmFyeU5hbWUpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBvcGVuc3NsIHRvb2wgbXVzdCBiZSBpbnN0YWxsZWQgb24gdGhlIHN5c3RlbSBhbmQgYXZhaWxhYmxlIG9uIHRoZSBwYXRoJyk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGdldEphdmFIb21lICgpIHtcbiAgaWYgKHByb2Nlc3MuZW52LkpBVkFfSE9NRSkge1xuICAgIHJldHVybiBwcm9jZXNzLmVudi5KQVZBX0hPTUU7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiSkFWQV9IT01FIGlzIG5vdCBzZXQgY3VycmVudGx5LiBQbGVhc2Ugc2V0IEpBVkFfSE9NRS5cIik7XG59XG5cbi8qKlxuICogR2V0IHRoZSBhYnNvbHV0ZSBwYXRoIHRvIGFwa3NpZ25lciB0b29sXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHN5c0hlbHBlcnMgLSBBbiBpbnN0YW5jZSBjb250YWluaW5nIHN5c3RlbUNhbGxNZXRob2RzIGhlbHBlciBtZXRob2RzXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBBbiBhYnNvbHV0ZSBwYXRoIHRvIGFwa3NpZ25lciB0b29sLlxuICogQHRocm93cyB7RXJyb3J9IElmIHRoZSB0b29sIGlzIG5vdCBwcmVzZW50IG9uIHRoZSBsb2NhbCBmaWxlIHN5c3RlbS5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gZ2V0QXBrc2lnbmVyRm9yT3MgKHN5c0hlbHBlcnMpIHtcbiAgcmV0dXJuIGF3YWl0IHN5c0hlbHBlcnMuZ2V0QmluYXJ5RnJvbVNka1Jvb3QoJ2Fwa3NpZ25lcicpO1xufVxuXG4vKipcbiAqIEdldCB0aGUgYWJzb2x1dGUgcGF0aCB0byBhcGthbmFseXplciB0b29sLlxuICogaHR0cHM6Ly9kZXZlbG9wZXIuYW5kcm9pZC5jb20vc3R1ZGlvL2NvbW1hbmQtbGluZS9hcGthbmFseXplci5odG1sXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHN5c0hlbHBlcnMgLSBBbiBpbnN0YW5jZSBjb250YWluaW5nIHN5c3RlbUNhbGxNZXRob2RzIGhlbHBlciBtZXRob2RzXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBBbiBhYnNvbHV0ZSBwYXRoIHRvIGFwa2FuYWx5emVyIHRvb2wuXG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYgdGhlIHRvb2wgaXMgbm90IHByZXNlbnQgb24gdGhlIGxvY2FsIGZpbGUgc3lzdGVtLlxuICovXG5hc3luYyBmdW5jdGlvbiBnZXRBcGthbmFseXplckZvck9zIChzeXNIZWxwZXJzKSB7XG4gIHJldHVybiBhd2FpdCBzeXNIZWxwZXJzLmdldEJpbmFyeUZyb21TZGtSb290KCdhcGthbmFseXplcicpO1xufVxuXG4vKipcbiAqIENoZWNrcyBtU2hvd2luZ0xvY2tzY3JlZW4gb3IgbURyZWFtaW5nTG9ja3NjcmVlbiBpbiBkdW1wc3lzIG91dHB1dCB0byBkZXRlcm1pbmVcbiAqIGlmIGxvY2sgc2NyZWVuIGlzIHNob3dpbmdcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gZHVtcHN5cyAtIFRoZSBvdXRwdXQgb2YgZHVtcHN5cyB3aW5kb3cgY29tbWFuZC5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgbG9jayBzY3JlZW4gaXMgc2hvd2luZy5cbiAqL1xuZnVuY3Rpb24gaXNTaG93aW5nTG9ja3NjcmVlbiAoZHVtcHN5cykge1xuICByZXR1cm4gLyhtU2hvd2luZ0xvY2tzY3JlZW49dHJ1ZXxtRHJlYW1pbmdMb2Nrc2NyZWVuPXRydWUpL2dpLnRlc3QoZHVtcHN5cyk7XG59XG5cbi8qXG4gKiBDaGVja3MgbUN1cnJlbnRGb2N1cyBpbiBkdW1wc3lzIG91dHB1dCB0byBkZXRlcm1pbmUgaWYgS2V5Z3VhcmQgaXMgYWN0aXZhdGVkXG4gKi9cbmZ1bmN0aW9uIGlzQ3VycmVudEZvY3VzT25LZXlndWFyZCAoZHVtcHN5cykge1xuICBsZXQgbSA9IC9tQ3VycmVudEZvY3VzLitLZXlndWFyZC9naS5leGVjKGR1bXBzeXMpO1xuICByZXR1cm4gKG0gJiYgbS5sZW5ndGggJiYgbVswXSkgPyB0cnVlIDogZmFsc2U7XG59XG5cbi8qXG4gKiBSZWFkcyBTdXJmYWNlT3JpZW50YXRpb24gaW4gZHVtcHN5cyBvdXRwdXRcbiAqL1xuZnVuY3Rpb24gZ2V0U3VyZmFjZU9yaWVudGF0aW9uIChkdW1wc3lzKSB7XG4gIGxldCBtID0gL1N1cmZhY2VPcmllbnRhdGlvbjogXFxkL2dpLmV4ZWMoZHVtcHN5cyk7XG4gIHJldHVybiBtICYmIHBhcnNlSW50KG1bMF0uc3BsaXQoJzonKVsxXSwgMTApO1xufVxuXG4vKlxuICogQ2hlY2tzIG1TY3JlZW5PbkZ1bGx5IGluIGR1bXBzeXMgb3V0cHV0IHRvIGRldGVybWluZSBpZiBzY3JlZW4gaXMgc2hvd2luZ1xuICogRGVmYXVsdCBpcyB0cnVlXG4gKi9cbmZ1bmN0aW9uIGlzU2NyZWVuT25GdWxseSAoZHVtcHN5cykge1xuICBsZXQgbSA9IC9tU2NyZWVuT25GdWxseT1cXHcrL2dpLmV4ZWMoZHVtcHN5cyk7XG4gIHJldHVybiAhbSB8fCAvLyBpZiBpbmZvcm1hdGlvbiBpcyBtaXNzaW5nIHdlIGFzc3VtZSBzY3JlZW4gaXMgZnVsbHkgb25cbiAgICAgICAgIChtICYmIG0ubGVuZ3RoID4gMCAmJiBtWzBdLnNwbGl0KCc9JylbMV0gPT09ICd0cnVlJykgfHwgZmFsc2U7XG59XG5cbi8qKlxuICogQnVpbGRzIGNvbW1hbmQgbGluZSByZXByZXNlbnRhdGlvbiBmb3IgdGhlIGdpdmVuXG4gKiBhcHBsaWNhdGlvbiBzdGFydHVwIG9wdGlvbnNcbiAqXG4gKiBAcGFyYW0ge1N0YXJ0QXBwT3B0aW9uc30gc3RhcnRBcHBPcHRpb25zIC0gQXBwbGljYXRpb24gb3B0aW9ucyBtYXBwaW5nXG4gKiBAcGFyYW0ge251bWJlcn0gYXBpTGV2ZWwgLSBUaGUgYWN0dWFsIE9TIEFQSSBsZXZlbFxuICogQHJldHVybnMge0FycmF5PFN0cmluZz59IFRoZSBhY3R1YWwgY29tbWFuZCBsaW5lIGFycmF5XG4gKi9cbmZ1bmN0aW9uIGJ1aWxkU3RhcnRDbWQgKHN0YXJ0QXBwT3B0aW9ucywgYXBpTGV2ZWwpIHtcbiAgbGV0IGNtZCA9IFsnYW0nLCAnc3RhcnQnXTtcbiAgaWYgKHV0aWwuaGFzVmFsdWUoc3RhcnRBcHBPcHRpb25zLnVzZXIpKSB7XG4gICAgY21kLnB1c2goJy0tdXNlcicsIHN0YXJ0QXBwT3B0aW9ucy51c2VyKTtcbiAgfVxuICBjbWQucHVzaCgnLVcnLCAnLW4nLCBgJHtzdGFydEFwcE9wdGlvbnMucGtnfS8ke3N0YXJ0QXBwT3B0aW9ucy5hY3Rpdml0eX1gKTtcbiAgaWYgKHN0YXJ0QXBwT3B0aW9ucy5zdG9wQXBwICYmIGFwaUxldmVsID49IDE1KSB7XG4gICAgY21kLnB1c2goJy1TJyk7XG4gIH1cbiAgaWYgKHN0YXJ0QXBwT3B0aW9ucy5hY3Rpb24pIHtcbiAgICBjbWQucHVzaCgnLWEnLCBzdGFydEFwcE9wdGlvbnMuYWN0aW9uKTtcbiAgfVxuICBpZiAoc3RhcnRBcHBPcHRpb25zLmNhdGVnb3J5KSB7XG4gICAgY21kLnB1c2goJy1jJywgc3RhcnRBcHBPcHRpb25zLmNhdGVnb3J5KTtcbiAgfVxuICBpZiAoc3RhcnRBcHBPcHRpb25zLmZsYWdzKSB7XG4gICAgY21kLnB1c2goJy1mJywgc3RhcnRBcHBPcHRpb25zLmZsYWdzKTtcbiAgfVxuICBpZiAoc3RhcnRBcHBPcHRpb25zLm9wdGlvbmFsSW50ZW50QXJndW1lbnRzKSB7XG4gICAgLy8gZXhwZWN0IG9wdGlvbmFsSW50ZW50QXJndW1lbnRzIHRvIGJlIGEgc2luZ2xlIHN0cmluZyBvZiB0aGUgZm9ybTpcbiAgICAvLyAgICAgXCItZmxhZyBrZXlcIlxuICAgIC8vICAgICBcIi1mbGFnIGtleSB2YWx1ZVwiXG4gICAgLy8gb3IgYSBjb21iaW5hdGlvbiBvZiB0aGVzZSAoZS5nLiwgXCItZmxhZzEga2V5MSAtZmxhZzIga2V5MiB2YWx1ZTJcIilcblxuICAgIC8vIHRha2UgYSBzdHJpbmcgYW5kIHBhcnNlIG91dCB0aGUgcGFydCBiZWZvcmUgYW55IHNwYWNlcywgYW5kIGFueXRoaW5nIGFmdGVyXG4gICAgLy8gdGhlIGZpcnN0IHNwYWNlXG4gICAgbGV0IHBhcnNlS2V5VmFsdWUgPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICBzdHIgPSBzdHIudHJpbSgpO1xuICAgICAgbGV0IHNwYWNlID0gc3RyLmluZGV4T2YoJyAnKTtcbiAgICAgIGlmIChzcGFjZSA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIHN0ci5sZW5ndGggPyBbc3RyXSA6IFtdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFtzdHIuc3Vic3RyaW5nKDAsIHNwYWNlKS50cmltKCksIHN0ci5zdWJzdHJpbmcoc3BhY2UgKyAxKS50cmltKCldO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBjeWNsZSB0aHJvdWdoIHRoZSBvcHRpb25hbEludGVudEFyZ3VtZW50cyBhbmQgcHVsbCBvdXQgdGhlIGFyZ3VtZW50c1xuICAgIC8vIGFkZCBhIHNwYWNlIGluaXRpYWxseSBzbyBmbGFncyBjYW4gYmUgZGlzdGluZ3Vpc2hlZCBmcm9tIGFyZ3VtZW50cyB0aGF0XG4gICAgLy8gaGF2ZSBpbnRlcm5hbCBoeXBoZW5zXG4gICAgbGV0IG9wdGlvbmFsSW50ZW50QXJndW1lbnRzID0gYCAke3N0YXJ0QXBwT3B0aW9ucy5vcHRpb25hbEludGVudEFyZ3VtZW50c31gO1xuICAgIGxldCByZSA9IC8gKC1bXlxcc10rKSAoLispLztcbiAgICB3aGlsZSAodHJ1ZSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnN0YW50LWNvbmRpdGlvblxuICAgICAgbGV0IGFyZ3MgPSByZS5leGVjKG9wdGlvbmFsSW50ZW50QXJndW1lbnRzKTtcbiAgICAgIGlmICghYXJncykge1xuICAgICAgICBpZiAob3B0aW9uYWxJbnRlbnRBcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgLy8gbm8gbW9yZSBmbGFncywgc28gdGhlIHJlbWFpbmRlciBjYW4gYmUgdHJlYXRlZCBhcyAna2V5JyBvciAna2V5IHZhbHVlJ1xuICAgICAgICAgIGNtZC5wdXNoLmFwcGx5KGNtZCwgcGFyc2VLZXlWYWx1ZShvcHRpb25hbEludGVudEFyZ3VtZW50cykpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHdlIGFyZSBkb25lXG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyB0YWtlIHRoZSBmbGFnIGFuZCBzZWUgaWYgaXQgaXMgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgc3RyaW5nXG4gICAgICAvLyBpZiBpdCBpcyBub3QsIHRoZW4gaXQgbWVhbnMgd2UgaGF2ZSBiZWVuIHRocm91Z2ggYWxyZWFkeSwgYW5kXG4gICAgICAvLyB3aGF0IGlzIGJlZm9yZSB0aGUgZmxhZyBpcyB0aGUgYXJndW1lbnQgZm9yIHRoZSBwcmV2aW91cyBmbGFnXG4gICAgICBsZXQgZmxhZyA9IGFyZ3NbMV07XG4gICAgICBsZXQgZmxhZ1BvcyA9IG9wdGlvbmFsSW50ZW50QXJndW1lbnRzLmluZGV4T2YoZmxhZyk7XG4gICAgICBpZiAoZmxhZ1BvcyAhPT0gMCkge1xuICAgICAgICBsZXQgcHJldkFyZ3MgPSBvcHRpb25hbEludGVudEFyZ3VtZW50cy5zdWJzdHJpbmcoMCwgZmxhZ1Bvcyk7XG4gICAgICAgIGNtZC5wdXNoLmFwcGx5KGNtZCwgcGFyc2VLZXlWYWx1ZShwcmV2QXJncykpO1xuICAgICAgfVxuXG4gICAgICAvLyBhZGQgdGhlIGZsYWcsIGFzIHRoZXJlIGFyZSBubyBtb3JlIGVhcmxpZXIgYXJndW1lbnRzXG4gICAgICBjbWQucHVzaChmbGFnKTtcblxuICAgICAgLy8gbWFrZSBvcHRpb25hbEludGVudEFyZ3VtZW50cyBob2xkIHRoZSByZW1haW5kZXJcbiAgICAgIG9wdGlvbmFsSW50ZW50QXJndW1lbnRzID0gYXJnc1syXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNtZDtcbn1cblxuY29uc3QgZ2V0U2RrVG9vbHNWZXJzaW9uID0gXy5tZW1vaXplKGFzeW5jIGZ1bmN0aW9uIGdldFNka1Rvb2xzVmVyc2lvbiAoKSB7XG4gIGNvbnN0IGFuZHJvaWRIb21lID0gcHJvY2Vzcy5lbnYuQU5EUk9JRF9IT01FO1xuICBpZiAoIWFuZHJvaWRIb21lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdBTkRST0lEX0hPTUUgZW52aXJvbm1lbnQgdmFyaWFibGUgaXMgZXhwZWN0ZWQgdG8gYmUgc2V0Jyk7XG4gIH1cbiAgY29uc3QgcHJvcGVydGllc1BhdGggPSBwYXRoLnJlc29sdmUoYW5kcm9pZEhvbWUsICd0b29scycsICdzb3VyY2UucHJvcGVydGllcycpO1xuICBpZiAoIWF3YWl0IGZzLmV4aXN0cyhwcm9wZXJ0aWVzUGF0aCkpIHtcbiAgICBsb2cud2FybihgQ2Fubm90IGZpbmQgJHtwcm9wZXJ0aWVzUGF0aH0gZmlsZSB0byByZWFkIFNESyB2ZXJzaW9uIGZyb21gKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgcHJvcGVydGllc0NvbnRlbnQgPSBhd2FpdCBmcy5yZWFkRmlsZShwcm9wZXJ0aWVzUGF0aCwgJ3V0ZjgnKTtcbiAgY29uc3QgdmVyc2lvbk1hdGNoZXIgPSBuZXcgUmVnRXhwKC9Qa2dcXC5SZXZpc2lvbj0oXFxkKylcXC4/KFxcZCspP1xcLj8oXFxkKyk/Lyk7XG4gIGNvbnN0IG1hdGNoID0gdmVyc2lvbk1hdGNoZXIuZXhlYyhwcm9wZXJ0aWVzQ29udGVudCk7XG4gIGlmIChtYXRjaCkge1xuICAgIHJldHVybiB7XG4gICAgICBtYWpvcjogcGFyc2VJbnQobWF0Y2hbMV0sIDEwKSxcbiAgICAgIG1pbm9yOiBtYXRjaFsyXSA/IHBhcnNlSW50KG1hdGNoWzJdLCAxMCkgOiAwLFxuICAgICAgYnVpbGQ6IG1hdGNoWzNdID8gcGFyc2VJbnQobWF0Y2hbM10sIDEwKSA6IDBcbiAgICB9O1xuICB9XG4gIGxvZy53YXJuKGBDYW5ub3QgcGFyc2UgXCJQa2cuUmV2aXNpb25cIiB2YWx1ZSBmcm9tICR7cHJvcGVydGllc1BhdGh9YCk7XG59KTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgZnVsbCBwYXRocyB0byBhbGwgJ2J1aWxkLXRvb2xzJyBzdWJmb2xkZXJzIHVuZGVyIHRoZSBwYXJ0aWN1bGFyXG4gKiBTREsgcm9vdCBmb2xkZXJcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc2RrUm9vdCAtIFRoZSBmdWxsIHBhdGggdG8gdGhlIEFuZHJvaWQgU0RLIHJvb3QgZm9sZGVyXG4gKiBAcmV0dXJucyB7QXJyYXk8c3RyaW5nPn0gVGhlIGZ1bGwgcGF0aHMgdG8gdGhlIHJlc3VsdGluZyBmb2xkZXJzIHNvcnRlZCBieVxuICogbW9kaWZpY2F0aW9uIGRhdGUgKHRoZSBuZXdlc3QgY29tZXMgZmlyc3QpIG9yIGFuIGVtcHR5IGxpc3QgaWYgbm8gbWFjdGhlcyB3ZXJlIGZvdW5kXG4gKi9cbmNvbnN0IGdldEJ1aWxkVG9vbHNEaXJzID0gXy5tZW1vaXplKGFzeW5jIGZ1bmN0aW9uIGdldEJ1aWxkVG9vbHNEaXJzIChzZGtSb290KSB7XG4gIGxldCBidWlsZFRvb2xzRGlycyA9IGF3YWl0IGZzLmdsb2IocGF0aC5yZXNvbHZlKHNka1Jvb3QsICdidWlsZC10b29scycsICcqJyksIHthYnNvbHV0ZTogdHJ1ZX0pO1xuICB0cnkge1xuICAgIGJ1aWxkVG9vbHNEaXJzID0gYnVpbGRUb29sc0RpcnNcbiAgICAgIC5tYXAoKGRpcikgPT4gW3BhdGguYmFzZW5hbWUoZGlyKSwgZGlyXSlcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBzZW12ZXIucmNvbXBhcmUoYVswXSwgYlswXSkpXG4gICAgICAubWFwKChwYWlyKSA9PiBwYWlyWzFdKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgbG9nLndhcm4oYENhbm5vdCBzb3J0IGJ1aWxkLXRvb2xzIGZvbGRlcnMgJHtKU09OLnN0cmluZ2lmeShidWlsZFRvb2xzRGlycy5tYXAoKGRpcikgPT4gcGF0aC5iYXNlbmFtZShkaXIpKSl9IGAgK1xuICAgICAgYGJ5IHNlbWFudGljIHZlcnNpb24gbmFtZXMuYCk7XG4gICAgbG9nLndhcm4oYEZhbGxpbmcgYmFjayB0byBzb3J0aW5nIGJ5IG1vZGlmaWNhdGlvbiBkYXRlLiBPcmlnaW5hbCBlcnJvcjogJHtlcnIubWVzc2FnZX1gKTtcbiAgICBjb25zdCBwYWlycyA9IGF3YWl0IEIubWFwKGJ1aWxkVG9vbHNEaXJzLCBhc3luYyAoZGlyKSA9PiBbKGF3YWl0IGZzLnN0YXQoZGlyKSkubXRpbWUudmFsdWVPZigpLCBkaXJdKTtcbiAgICBidWlsZFRvb2xzRGlycyA9IHBhaXJzXG4gICAgICAuc29ydCgoYSwgYikgPT4gYVswXSA8IGJbMF0pXG4gICAgICAubWFwKChwYWlyKSA9PiBwYWlyWzFdKTtcbiAgfVxuICBsb2cuaW5mbyhgRm91bmQgJHtidWlsZFRvb2xzRGlycy5sZW5ndGh9ICdidWlsZC10b29scycgZm9sZGVycyB1bmRlciAnJHtzZGtSb290fScgKG5ld2VzdCBmaXJzdCk6YCk7XG4gIGZvciAobGV0IGRpciBvZiBidWlsZFRvb2xzRGlycykge1xuICAgIGxvZy5pbmZvKGAgICAgJHtkaXJ9YCk7XG4gIH1cbiAgcmV0dXJuIGJ1aWxkVG9vbHNEaXJzO1xufSk7XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBsaXN0IG9mIHBlcm1pc3Npb24gbmFtZXMgZW5jb2RlZCBpbiBgZHVtcHN5cyBwYWNrYWdlYCBjb21tYW5kIG91dHB1dC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gZHVtcHN5c091dHB1dCAtIFRoZSBhY3R1YWwgY29tbWFuZCBvdXRwdXQuXG4gKiBAcGFyYW0ge0FycmF5PHN0cmluZz59IGdyb3VwTmFtZXMgLSBUaGUgbGlzdCBvZiBncm91cCBuYW1lcyB0byBsaXN0IHBlcm1pc3Npb25zIGZvci5cbiAqIEBwYXJhbSB7P2Jvb2xlYW59IGdyYW50ZWRTdGF0ZSAtIFRoZSBleHBlY3RlZCBzdGF0ZSBvZiBgZ3JhbnRlZGAgYXR0cmlidXRlIHRvIGZpbHRlciB3aXRoLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTm8gZmlsdGVyaW5nIGlzIGRvbmUgaWYgdGhlIHBhcmFtZXRlciBpcyBub3Qgc2V0LlxuICogQHJldHVybnMge0FycmF5PHN0cmluZz59IFRoZSBsaXN0IG9mIG1hdGNoZWQgcGVybWlzc2lvbiBuYW1lcyBvciBhbiBlbXB0eSBsaXN0IGlmIG5vIG1hdGNoZXMgd2VyZSBmb3VuZC5cbiAqL1xuY29uc3QgZXh0cmFjdE1hdGNoaW5nUGVybWlzc2lvbnMgPSBmdW5jdGlvbiAoZHVtcHN5c091dHB1dCwgZ3JvdXBOYW1lcywgZ3JhbnRlZFN0YXRlID0gbnVsbCkge1xuICBjb25zdCBncm91cFBhdHRlcm5CeU5hbWUgPSAoZ3JvdXBOYW1lKSA9PiBuZXcgUmVnRXhwKGBeKFxcXFxzKiR7Xy5lc2NhcGVSZWdFeHAoZ3JvdXBOYW1lKX0gcGVybWlzc2lvbnM6W1xcXFxzXFxcXFNdKylgLCAnbScpO1xuICBjb25zdCBpbmRlbnRQYXR0ZXJuID0gL1xcU3wkLztcbiAgY29uc3QgcGVybWlzc2lvbk5hbWVQYXR0ZXJuID0gL2FuZHJvaWRcXC5wZXJtaXNzaW9uXFwuXFx3Ky87XG4gIGNvbnN0IGdyYW50ZWRTdGF0ZVBhdHRlcm4gPSAvXFxiZ3JhbnRlZD0oXFx3KykvO1xuICBjb25zdCByZXN1bHQgPSBbXTtcbiAgZm9yIChjb25zdCBncm91cE5hbWUgb2YgZ3JvdXBOYW1lcykge1xuICAgIGNvbnN0IGdyb3VwTWF0Y2ggPSBncm91cFBhdHRlcm5CeU5hbWUoZ3JvdXBOYW1lKS5leGVjKGR1bXBzeXNPdXRwdXQpO1xuICAgIGlmICghZ3JvdXBNYXRjaCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgbGluZXMgPSBncm91cE1hdGNoWzFdLnNwbGl0KCdcXG4nKTtcbiAgICBpZiAobGluZXMubGVuZ3RoIDwgMikge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdGl0bGVJbmRlbnQgPSBsaW5lc1swXS5zZWFyY2goaW5kZW50UGF0dGVybik7XG4gICAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzLnNsaWNlKDEpKSB7XG4gICAgICBjb25zdCBjdXJyZW50SW5kZW50ID0gbGluZS5zZWFyY2goaW5kZW50UGF0dGVybik7XG4gICAgICBpZiAoY3VycmVudEluZGVudCA8PSB0aXRsZUluZGVudCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY29uc3QgcGVybWlzc2lvbk5hbWVNYXRjaCA9IHBlcm1pc3Npb25OYW1lUGF0dGVybi5leGVjKGxpbmUpO1xuICAgICAgaWYgKCFwZXJtaXNzaW9uTmFtZU1hdGNoKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgaXRlbSA9IHtcbiAgICAgICAgcGVybWlzc2lvbjogcGVybWlzc2lvbk5hbWVNYXRjaFswXSxcbiAgICAgIH07XG4gICAgICBjb25zdCBncmFudGVkU3RhdGVNYXRjaCA9IGdyYW50ZWRTdGF0ZVBhdHRlcm4uZXhlYyhsaW5lKTtcbiAgICAgIGlmIChncmFudGVkU3RhdGVNYXRjaCkge1xuICAgICAgICBpdGVtLmdyYW50ZWQgPSBncmFudGVkU3RhdGVNYXRjaFsxXSA9PT0gJ3RydWUnO1xuICAgICAgfVxuICAgICAgcmVzdWx0LnB1c2goaXRlbSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgZmlsdGVyZWRSZXN1bHQgPSByZXN1bHRcbiAgICAuZmlsdGVyKChpdGVtKSA9PiAhXy5pc0Jvb2xlYW4oZ3JhbnRlZFN0YXRlKSB8fCBpdGVtLmdyYW50ZWQgPT09IGdyYW50ZWRTdGF0ZSlcbiAgICAubWFwKChpdGVtKSA9PiBpdGVtLnBlcm1pc3Npb24pO1xuICBsb2cuZGVidWcoYFJldHJpZXZlZCAke2ZpbHRlcmVkUmVzdWx0Lmxlbmd0aH0gcGVybWlzc2lvbihzKSBmcm9tICR7SlNPTi5zdHJpbmdpZnkoZ3JvdXBOYW1lcyl9IGdyb3VwKHMpYCk7XG4gIHJldHVybiBmaWx0ZXJlZFJlc3VsdDtcbn07XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gSW5zdGFsbE9wdGlvbnNcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gYWxsb3dUZXN0UGFja2FnZXMgW2ZhbHNlXSAtIFNldCB0byB0cnVlIGluIG9yZGVyIHRvIGFsbG93IHRlc3RcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhY2thZ2VzIGluc3RhbGxhdGlvbi5cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gdXNlU2RjYXJkIFtmYWxzZV0gLSBTZXQgdG8gdHJ1ZSB0byBpbnN0YWxsIHRoZSBhcHAgb24gc2RjYXJkXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGVhZCBvZiB0aGUgZGV2aWNlIG1lbW9yeS5cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gZ3JhbnRQZXJtaXNzaW9ucyBbZmFsc2VdIC0gU2V0IHRvIHRydWUgaW4gb3JkZXIgdG8gZ3JhbnQgYWxsIHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZXJtaXNzaW9ucyByZXF1ZXN0ZWQgaW4gdGhlIGFwcGxpY2F0aW9uJ3MgbWFuaWZlc3RcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0b21hdGljYWxseSBhZnRlciB0aGUgaW5zdGFsbGF0aW9uIGlzIGNvbXBsZXRlZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlciBBbmRyb2lkIDYrLlxuICogQHByb3BlcnR5IHtib29sZWFufSByZXBsYWNlIFt0cnVlXSAtIFNldCBpdCB0byBmYWxzZSBpZiB5b3UgZG9uJ3Qgd2FudFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBhcHBsaWNhdGlvbiB0byBiZSB1cGdyYWRlZC9yZWluc3RhbGxlZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIGl0IGlzIGFscmVhZHkgcHJlc2VudCBvbiB0aGUgZGV2aWNlLlxuICovXG5cbi8qKlxuICogVHJhbnNmb3JtcyBnaXZlbiBvcHRpb25zIGludG8gdGhlIGxpc3Qgb2YgYGFkYiBpbnN0YWxsLmluc3RhbGwtbXVsdGlwbGVgIGNvbW1hbmQgYXJndW1lbnRzXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IGFwaUxldmVsIC0gVGhlIGN1cnJlbnQgQVBJIGxldmVsXG4gKiBAcGFyYW0gez9JbnN0YWxsT3B0aW9uc30gb3B0aW9ucyAtIFRoZSBvcHRpb25zIG1hcHBpbmcgdG8gdHJhbnNmb3JtXG4gKiBAcmV0dXJucyB7QXJyYXk8U3RyaW5nPn0gVGhlIGFycmF5IG9mIGFyZ3VtZW50c1xuICovXG5mdW5jdGlvbiBidWlsZEluc3RhbGxBcmdzIChhcGlMZXZlbCwgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xuXG4gIGlmICghdXRpbC5oYXNWYWx1ZShvcHRpb25zLnJlcGxhY2UpIHx8IG9wdGlvbnMucmVwbGFjZSkge1xuICAgIHJlc3VsdC5wdXNoKCctcicpO1xuICB9XG4gIGlmIChvcHRpb25zLmFsbG93VGVzdFBhY2thZ2VzKSB7XG4gICAgcmVzdWx0LnB1c2goJy10Jyk7XG4gIH1cbiAgaWYgKG9wdGlvbnMudXNlU2RjYXJkKSB7XG4gICAgcmVzdWx0LnB1c2goJy1zJyk7XG4gIH1cbiAgaWYgKG9wdGlvbnMuZ3JhbnRQZXJtaXNzaW9ucykge1xuICAgIGlmIChhcGlMZXZlbCA8IDIzKSB7XG4gICAgICBsb2cuZGVidWcoYFNraXBwaW5nIHBlcm1pc3Npb25zIGdyYW50IG9wdGlvbiwgc2luY2UgYCArXG4gICAgICAgICAgICAgICAgYHRoZSBjdXJyZW50IEFQSSBsZXZlbCAke2FwaUxldmVsfSBkb2VzIG5vdCBzdXBwb3J0IGFwcGxpY2F0aW9ucyBgICtcbiAgICAgICAgICAgICAgICBgcGVybWlzc2lvbnMgY3VzdG9taXphdGlvbmApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQucHVzaCgnLWcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQge1xuICBnZXRBbmRyb2lkUGxhdGZvcm1BbmRQYXRoLCB1bnppcEZpbGUsXG4gIGdldElNRUxpc3RGcm9tT3V0cHV0LCBnZXRKYXZhRm9yT3MsIGlzU2hvd2luZ0xvY2tzY3JlZW4sIGlzQ3VycmVudEZvY3VzT25LZXlndWFyZCxcbiAgZ2V0U3VyZmFjZU9yaWVudGF0aW9uLCBpc1NjcmVlbk9uRnVsbHksIGJ1aWxkU3RhcnRDbWQsIGdldEphdmFIb21lLFxuICByb290RGlyLCBnZXRTZGtUb29sc1ZlcnNpb24sIGdldEFwa3NpZ25lckZvck9zLCBnZXRCdWlsZFRvb2xzRGlycyxcbiAgZ2V0QXBrYW5hbHl6ZXJGb3JPcywgZ2V0T3BlblNzbEZvck9zLCBleHRyYWN0TWF0Y2hpbmdQZXJtaXNzaW9ucywgQVBLU19FWFRFTlNJT04sXG4gIEFQS19JTlNUQUxMX1RJTUVPVVQsIEFQS1NfSU5TVEFMTF9USU1FT1VULCBidWlsZEluc3RhbGxBcmdzLCBBUEtfRVhURU5TSU9OLFxufTtcbiJdLCJmaWxlIjoibGliL2hlbHBlcnMuanMiLCJzb3VyY2VSb290IjoiLi4vLi4ifQ==
