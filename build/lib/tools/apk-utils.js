"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _helpers = require("../helpers.js");

var _teen_process = require("teen_process");

var _logger = _interopRequireDefault(require("../logger.js"));

var _path = _interopRequireDefault(require("path"));

var _lodash = _interopRequireDefault(require("lodash"));

var _asyncbox = require("asyncbox");

var _appiumSupport = require("appium-support");

var _semver = _interopRequireDefault(require("semver"));

var _os = _interopRequireDefault(require("os"));

let apkUtilsMethods = {};
const ACTIVITIES_TROUBLESHOOTING_LINK = 'https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/android/activity-startup.md';

apkUtilsMethods.isAppInstalled = function () {
  var _ref = (0, _asyncToGenerator2.default)(function* (pkg) {
    _logger.default.debug(`Getting install status for ${pkg}`);

    const installedPattern = new RegExp(`^\\s*Package\\s+\\[${_lodash.default.escapeRegExp(pkg)}\\][^:]+:$`, 'm');

    try {
      const stdout = yield this.shell(['dumpsys', 'package', pkg]);
      const isInstalled = installedPattern.test(stdout);

      _logger.default.debug(`'${pkg}' is${!isInstalled ? ' not' : ''} installed`);

      return isInstalled;
    } catch (e) {
      throw new Error(`Error finding if '${pkg}' is installed. Original error: ${e.message}`);
    }
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();

apkUtilsMethods.startUri = function () {
  var _ref2 = (0, _asyncToGenerator2.default)(function* (uri, pkg) {
    if (!uri || !pkg) {
      throw new Error("URI and package arguments are required");
    }

    const args = ["am", "start", "-W", "-a", "android.intent.action.VIEW", "-d", uri.replace(/&/g, '\\&'), pkg];

    try {
      const res = yield this.shell(args);

      if (res.toLowerCase().includes('unable to resolve intent')) {
        throw new Error(res);
      }
    } catch (e) {
      throw new Error(`Error attempting to start URI. Original error: ${e}`);
    }
  });

  return function (_x2, _x3) {
    return _ref2.apply(this, arguments);
  };
}();

apkUtilsMethods.startApp = function () {
  var _ref3 = (0, _asyncToGenerator2.default)(function* (startAppOptions = {}) {
    if (!startAppOptions.activity || !startAppOptions.pkg) {
      throw new Error("activity and pkg are required to start an application");
    }

    startAppOptions = _lodash.default.clone(startAppOptions);
    startAppOptions.activity = startAppOptions.activity.replace('$', '\\$');

    _lodash.default.defaults(startAppOptions, {
      waitPkg: startAppOptions.pkg,
      waitActivity: false,
      retry: true,
      stopApp: true
    });

    startAppOptions.waitPkg = startAppOptions.waitPkg || startAppOptions.pkg;
    const apiLevel = yield this.getApiLevel();
    const cmd = (0, _helpers.buildStartCmd)(startAppOptions, apiLevel);

    try {
      const shellOpts = {};

      if (_lodash.default.isInteger(startAppOptions.waitDuration) && startAppOptions.waitDuration > 20000) {
        shellOpts.timeout = startAppOptions.waitDuration;
      }

      const stdout = yield this.shell(cmd, shellOpts);

      if (stdout.includes("Error: Activity class") && stdout.includes("does not exist")) {
        if (startAppOptions.retry && !startAppOptions.activity.startsWith(".")) {
          _logger.default.debug(`We tried to start an activity that doesn't exist, ` + `retrying with '.${startAppOptions.activity}' activity name`);

          startAppOptions.activity = `.${startAppOptions.activity}`;
          startAppOptions.retry = false;
          return yield this.startApp(startAppOptions);
        }

        throw new Error(`Activity name '${startAppOptions.activity}' used to start the app doesn't ` + `exist or cannot be launched! Make sure it exists and is a launchable activity`);
      } else if (stdout.includes("java.lang.SecurityException")) {
        throw new Error(`The permission to start '${startAppOptions.activity}' activity has been denied.` + `Make sure the activity/package names are correct.`);
      }

      if (startAppOptions.waitActivity) {
        yield this.waitForActivity(startAppOptions.waitPkg, startAppOptions.waitActivity, startAppOptions.waitDuration);
      }

      return stdout;
    } catch (e) {
      throw new Error(`Cannot start the '${startAppOptions.pkg}' application. ` + `Visit ${ACTIVITIES_TROUBLESHOOTING_LINK} for troubleshooting. ` + `Original error: ${e.message}`);
    }
  });

  return function () {
    return _ref3.apply(this, arguments);
  };
}();

apkUtilsMethods.getFocusedPackageAndActivity = (0, _asyncToGenerator2.default)(function* () {
  _logger.default.debug("Getting focused package and activity");

  const cmd = ['dumpsys', 'window', 'windows'];
  const nullFocusedAppRe = new RegExp(/^\s*mFocusedApp=null/, 'm');
  const focusedAppRe = new RegExp('^\\s*mFocusedApp.+Record\\{.*\\s([^\\s\\/\\}]+)' + '\\/([^\\s\\/\\}\\,]+)\\,?(\\s[^\\s\\/\\}]+)*\\}', 'm');
  const nullCurrentFocusRe = new RegExp(/^\s*mCurrentFocus=null/, 'm');
  const currentFocusAppRe = new RegExp('^\\s*mCurrentFocus.+\\{.+\\s([^\\s\\/]+)\\/([^\\s]+)\\b', 'm');

  try {
    const stdout = yield this.shell(cmd);
    var _arr = [focusedAppRe, currentFocusAppRe];

    for (var _i = 0; _i < _arr.length; _i++) {
      const pattern = _arr[_i];
      const match = pattern.exec(stdout);

      if (match) {
        return {
          appPackage: match[1].trim(),
          appActivity: match[2].trim()
        };
      }
    }

    var _arr2 = [nullFocusedAppRe, nullCurrentFocusRe];

    for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
      const pattern = _arr2[_i2];

      if (pattern.exec(stdout)) {
        return {
          appPackage: null,
          appActivity: null
        };
      }
    }

    throw new Error("Could not parse activity from dumpsys");
  } catch (e) {
    throw new Error(`Could not get focusPackageAndActivity. Original error: ${e.message}`);
  }
});

apkUtilsMethods.waitForActivityOrNot = function () {
  var _ref5 = (0, _asyncToGenerator2.default)(function* (pkg, activity, waitForStop, waitMs = 20000) {
    var _this = this;

    if (!pkg || !activity) {
      throw new Error('Package and activity required.');
    }

    _logger.default.debug(`Waiting up to ${waitMs}ms for activity matching pkg: '${pkg}' and ` + `activity: '${activity}' to${waitForStop ? ' not' : ''} be focused`);

    const splitNames = names => names.split(',').map(name => name.trim());

    const allPackages = splitNames(pkg);
    const allActivities = splitNames(activity);
    let possibleActivityNames = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = allActivities[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        let oneActivity = _step.value;

        if (oneActivity.startsWith('.')) {
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = allPackages[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              let currentPkg = _step2.value;
              possibleActivityNames.push(`${currentPkg}${oneActivity}`.replace(/\.+/g, '.'));
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
        } else {
          possibleActivityNames.push(oneActivity);
          possibleActivityNames.push(`${pkg}.${oneActivity}`);
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

    _logger.default.debug(`Possible activities, to be checked: ${possibleActivityNames.map(name => `'${name}'`).join(', ')}`);

    let possibleActivityPatterns = possibleActivityNames.map(possibleActivityName => new RegExp(`^${possibleActivityName.replace(/\./g, '\\.').replace(/\*/g, '.*?').replace(/\$/g, '\\$')}$`));
    let retries = parseInt(waitMs / 750, 10) || 1;
    retries = isNaN(retries) ? 30 : retries;
    yield (0, _asyncbox.retryInterval)(retries, 750, (0, _asyncToGenerator2.default)(function* () {
      let _ref7 = yield _this.getFocusedPackageAndActivity(),
          appPackage = _ref7.appPackage,
          appActivity = _ref7.appActivity;

      if (appActivity && appPackage) {
        let fullyQualifiedActivity = appActivity.startsWith('.') ? `${appPackage}${appActivity}` : appActivity;

        _logger.default.debug(`Found package: '${appPackage}' and fully qualified activity name : '${fullyQualifiedActivity}'`);

        let foundAct = _lodash.default.includes(allPackages, appPackage) && _lodash.default.findIndex(possibleActivityPatterns, possiblePattern => possiblePattern.test(fullyQualifiedActivity)) !== -1;

        if (!waitForStop && foundAct || waitForStop && !foundAct) {
          return;
        }
      }

      _logger.default.debug('Incorrect package and activity. Retrying.');

      throw new Error(`${possibleActivityNames.map(name => `'${name}'`).join(' or ')} never ${waitForStop ? 'stopped' : 'started'}. ` + `Visit ${ACTIVITIES_TROUBLESHOOTING_LINK} for troubleshooting`);
    }));
  });

  return function (_x4, _x5, _x6) {
    return _ref5.apply(this, arguments);
  };
}();

apkUtilsMethods.waitForActivity = function () {
  var _ref8 = (0, _asyncToGenerator2.default)(function* (pkg, act, waitMs = 20000) {
    yield this.waitForActivityOrNot(pkg, act, false, waitMs);
  });

  return function (_x7, _x8) {
    return _ref8.apply(this, arguments);
  };
}();

apkUtilsMethods.waitForNotActivity = function () {
  var _ref9 = (0, _asyncToGenerator2.default)(function* (pkg, act, waitMs = 20000) {
    yield this.waitForActivityOrNot(pkg, act, true, waitMs);
  });

  return function (_x9, _x10) {
    return _ref9.apply(this, arguments);
  };
}();

const APK_UNINSTALL_TIMEOUT = 20000;

apkUtilsMethods.uninstallApk = function () {
  var _ref10 = (0, _asyncToGenerator2.default)(function* (pkg, options = {}) {
    options = Object.assign({
      timeout: APK_UNINSTALL_TIMEOUT
    }, options);

    _logger.default.debug(`Uninstalling ${pkg}`);

    if (!(yield this.isAppInstalled(pkg))) {
      _logger.default.info(`${pkg} was not uninstalled, because it was not present on the device`);

      return false;
    }

    const cmd = ['uninstall'];

    if (options.keepData) {
      cmd.push('-k');
    }

    cmd.push(pkg);
    let stdout;

    try {
      yield this.forceStop(pkg);
      stdout = (yield this.adbExec(cmd, {
        timeout: options.timeout
      })).trim();
    } catch (e) {
      throw new Error(`Unable to uninstall APK. Original error: ${e.message}`);
    }

    _logger.default.debug(`'adb ${cmd.join(' ')}' command output: ${stdout}`);

    if (stdout.includes("Success")) {
      _logger.default.info(`${pkg} was successfully uninstalled`);

      return true;
    }

    _logger.default.info(`${pkg} was not uninstalled`);

    return false;
  });

  return function (_x11) {
    return _ref10.apply(this, arguments);
  };
}();

apkUtilsMethods.installFromDevicePath = function () {
  var _ref11 = (0, _asyncToGenerator2.default)(function* (apkPathOnDevice, opts = {}) {
    let stdout = yield this.shell(['pm', 'install', '-r', apkPathOnDevice], opts);

    if (stdout.indexOf("Failure") !== -1) {
      throw new Error(`Remote install failed: ${stdout}`);
    }
  });

  return function (_x12) {
    return _ref11.apply(this, arguments);
  };
}();

apkUtilsMethods.install = function () {
  var _ref12 = (0, _asyncToGenerator2.default)(function* (appPath, options = {}) {
    if (appPath.endsWith(_helpers.APKS_EXTENSION)) {
      return yield this.installApks(appPath, options);
    }

    options = Object.assign({
      replace: true,
      timeout: _helpers.APK_INSTALL_TIMEOUT
    }, options);
    const installArgs = (0, _helpers.buildInstallArgs)((yield this.getApiLevel()), options);

    try {
      const output = yield this.adbExec(['install', ...installArgs, appPath], {
        timeout: options.timeout
      });
      const truncatedOutput = !_lodash.default.isString(output) || output.length <= 300 ? output : `${output.substr(0, 150)}...${output.substr(output.length - 150)}`;

      _logger.default.debug(`Install command stdout: ${truncatedOutput}`);

      if (_lodash.default.includes(output, 'INSTALL_FAILED')) {
        throw new Error(output);
      }
    } catch (err) {
      if (!err.message.includes('INSTALL_FAILED_ALREADY_EXISTS')) {
        throw err;
      }

      _logger.default.debug(`Application '${appPath}' already installed. Continuing.`);
    }
  });

  return function (_x13) {
    return _ref12.apply(this, arguments);
  };
}();

apkUtilsMethods.installOrUpgrade = function () {
  var _ref13 = (0, _asyncToGenerator2.default)(function* (appPath, pkg = null, options = {}) {
    if (!_appiumSupport.util.hasValue(options.timeout)) {
      options.timeout = _helpers.APK_INSTALL_TIMEOUT;
    }

    let apkInfo = null;

    if (!pkg) {
      apkInfo = yield this.getApkInfo(appPath);
      pkg = apkInfo.name;
    }

    if (!pkg) {
      _logger.default.warn(`Cannot read the package name of ${appPath}. Assuming correct app version is already installed`);

      return;
    }

    if (!(yield this.isAppInstalled(pkg))) {
      _logger.default.debug(`App '${appPath}' not installed. Installing`);

      yield this.install(appPath, Object.assign({}, options, {
        replace: false
      }));
      return;
    }

    const _ref14 = yield this.getPackageInfo(pkg),
          pkgVersionCode = _ref14.versionCode,
          pkgVersionNameStr = _ref14.versionName;

    const pkgVersionName = _semver.default.valid(_semver.default.coerce(pkgVersionNameStr));

    if (!apkInfo) {
      apkInfo = yield this.getApkInfo(appPath);
    }

    const _apkInfo = apkInfo,
          apkVersionCode = _apkInfo.versionCode,
          apkVersionNameStr = _apkInfo.versionName;

    const apkVersionName = _semver.default.valid(_semver.default.coerce(apkVersionNameStr));

    if (!_lodash.default.isInteger(apkVersionCode) || !_lodash.default.isInteger(pkgVersionCode)) {
      _logger.default.warn(`Cannot read version codes of '${appPath}' and/or '${pkg}'`);

      if (!_lodash.default.isString(apkVersionName) || !_lodash.default.isString(pkgVersionName)) {
        _logger.default.warn(`Cannot read version names of '${appPath}' and/or '${pkg}'. Assuming correct app version is already installed`);

        return;
      }
    }

    if (_lodash.default.isInteger(apkVersionCode) && _lodash.default.isInteger(pkgVersionCode)) {
      if (pkgVersionCode > apkVersionCode) {
        _logger.default.debug(`The installed '${pkg}' package does not require upgrade (${pkgVersionCode} > ${apkVersionCode})`);

        return;
      }

      if (pkgVersionCode === apkVersionCode) {
        if (_lodash.default.isString(apkVersionName) && _lodash.default.isString(pkgVersionName) && _semver.default.satisfies(pkgVersionName, `>=${apkVersionName}`)) {
          _logger.default.debug(`The installed '${pkg}' package does not require upgrade ('${pkgVersionName}' >= '${apkVersionName}')`);

          return;
        }

        if (!_lodash.default.isString(apkVersionName) || !_lodash.default.isString(pkgVersionName)) {
          _logger.default.debug(`The installed '${pkg}' package does not require upgrade (${pkgVersionCode} === ${apkVersionCode})`);

          return;
        }
      }
    } else if (_lodash.default.isString(apkVersionName) && _lodash.default.isString(pkgVersionName) && _semver.default.satisfies(pkgVersionName, `>=${apkVersionName}`)) {
      _logger.default.debug(`The installed '${pkg}' package does not require upgrade ('${pkgVersionName}' >= '${apkVersionName}')`);

      return;
    }

    _logger.default.debug(`The installed '${pkg}' package is older than '${appPath}' ` + `(${pkgVersionCode} < ${apkVersionCode} or '${pkgVersionName}' < '${apkVersionName}')'. ` + `Executing upgrade`);

    try {
      yield this.install(appPath, Object.assign({}, options, {
        replace: true
      }));
    } catch (err) {
      _logger.default.warn(`Cannot upgrade '${pkg}' because of '${err.message}'. Trying full reinstall`);

      if (!(yield this.uninstallApk(pkg))) {
        throw new Error(`'${pkg}' package cannot be uninstalled`);
      }

      yield this.install(appPath, Object.assign({}, options, {
        replace: false
      }));
    }
  });

  return function (_x14) {
    return _ref13.apply(this, arguments);
  };
}();

apkUtilsMethods.extractStringsFromApk = function () {
  var _ref15 = (0, _asyncToGenerator2.default)(function* (appPath, language, out) {
    _logger.default.debug(`Extracting strings from for language: ${language || 'default'}`);

    if (appPath.endsWith(_helpers.APKS_EXTENSION)) {
      appPath = yield this.extractLanguageApk(appPath, language);
    }

    yield this.initAapt();
    let rawAaptOutput;

    try {
      const _ref16 = yield (0, _teen_process.exec)(this.binaries.aapt, ['d', '--values', 'resources', appPath]),
            stdout = _ref16.stdout;

      rawAaptOutput = stdout;
    } catch (e) {
      throw new Error(`Cannot extract resources from '${appPath}'. Original error: ${e.message}`);
    }

    const defaultConfigMarker = '(default)';
    let configMarker = language || defaultConfigMarker;

    if (configMarker.includes('-') && !configMarker.includes('-r')) {
      configMarker = configMarker.replace('-', '-r');
    }

    if (configMarker.toLowerCase().startsWith('en')) {
      const _ref17 = yield (0, _teen_process.exec)(this.binaries.aapt, ['d', 'configurations', appPath]),
            stdout = _ref17.stdout;

      const configs = stdout.split(_os.default.EOL);

      if (!configs.includes(configMarker)) {
        _logger.default.debug(`There is no '${configMarker}' configuration. ` + `Replacing it with '${defaultConfigMarker}'`);

        configMarker = defaultConfigMarker;
      }
    }

    const apkStrings = {};
    let isInConfig = false;
    let currentResourceId = null;
    let isInPluralGroup = false;

    const startsWithAny = (s, arr) => arr.reduce((acc, x) => acc || s.startsWith(x), false);

    const normalizeStringMatch = s => s.replace(/"$/, '').replace(/^"/, '').replace(/\\"/g, '"');

    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = rawAaptOutput.split(_os.default.EOL)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        const line = _step3.value;
        const trimmedLine = line.trim();

        if (_lodash.default.isEmpty(trimmedLine)) {
          continue;
        }

        if (startsWithAny(trimmedLine, ['config', 'type', 'spec', 'Package'])) {
          isInConfig = trimmedLine.startsWith(`config ${configMarker}:`);
          currentResourceId = null;
          isInPluralGroup = false;
          continue;
        }

        if (!isInConfig) {
          continue;
        }

        if (trimmedLine.startsWith('resource')) {
          isInPluralGroup = false;
          currentResourceId = null;

          if (trimmedLine.includes(':string/')) {
            const match = /:string\/(\S+):/.exec(trimmedLine);

            if (match) {
              currentResourceId = match[1];
            }
          } else if (trimmedLine.includes(':plurals/')) {
            const match = /:plurals\/(\S+):/.exec(trimmedLine);

            if (match) {
              currentResourceId = match[1];
              isInPluralGroup = true;
            }
          }

          continue;
        }

        if (currentResourceId && trimmedLine.startsWith('(string')) {
          const match = /"[^"\\]*(?:\\.[^"\\]*)*"/.exec(trimmedLine);

          if (match) {
            apkStrings[currentResourceId] = normalizeStringMatch(match[0]);
          }

          currentResourceId = null;
          continue;
        }

        if (currentResourceId && isInPluralGroup && trimmedLine.includes(': (string')) {
          const match = /"[^"\\]*(?:\\.[^"\\]*)*"/.exec(trimmedLine);

          if (match) {
            apkStrings[currentResourceId] = [...(apkStrings[currentResourceId] || []), normalizeStringMatch(match[0])];
          }

          continue;
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

    if (_lodash.default.isEmpty(apkStrings)) {
      _logger.default.warn(`No strings have been found in '${appPath}' resources ` + `for '${configMarker}' configuration`);
    } else {
      _logger.default.info(`Successfully extracted ${_lodash.default.keys(apkStrings).length} strings from '${appPath}' resources ` + `for '${configMarker}' configuration`);
    }

    const localPath = _path.default.resolve(out, 'strings.json');

    yield (0, _appiumSupport.mkdirp)(out);
    yield _appiumSupport.fs.writeFile(localPath, JSON.stringify(apkStrings, null, 2), 'utf-8');
    return {
      apkStrings,
      localPath
    };
  });

  return function (_x15, _x16, _x17) {
    return _ref15.apply(this, arguments);
  };
}();

apkUtilsMethods.getDeviceLanguage = (0, _asyncToGenerator2.default)(function* () {
  let language;

  if ((yield this.getApiLevel()) < 23) {
    language = yield this.getDeviceSysLanguage();

    if (!language) {
      language = yield this.getDeviceProductLanguage();
    }
  } else {
    language = (yield this.getDeviceLocale()).split("-")[0];
  }

  return language;
});

apkUtilsMethods.setDeviceLanguage = function () {
  var _ref19 = (0, _asyncToGenerator2.default)(function* (language) {
    yield this.setDeviceSysLanguage(language);
  });

  return function (_x18) {
    return _ref19.apply(this, arguments);
  };
}();

apkUtilsMethods.getDeviceCountry = (0, _asyncToGenerator2.default)(function* () {
  let country = yield this.getDeviceSysCountry();

  if (!country) {
    country = yield this.getDeviceProductCountry();
  }

  return country;
});

apkUtilsMethods.setDeviceCountry = function () {
  var _ref21 = (0, _asyncToGenerator2.default)(function* (country) {
    yield this.setDeviceSysCountry(country);
  });

  return function (_x19) {
    return _ref21.apply(this, arguments);
  };
}();

apkUtilsMethods.getDeviceLocale = (0, _asyncToGenerator2.default)(function* () {
  let locale = yield this.getDeviceSysLocale();

  if (!locale) {
    locale = yield this.getDeviceProductLocale();
  }

  return locale;
});

apkUtilsMethods.setDeviceLocale = function () {
  var _ref23 = (0, _asyncToGenerator2.default)(function* (locale) {
    const validateLocale = new RegExp(/[a-zA-Z]+-[a-zA-Z0-9]+/);

    if (!validateLocale.test(locale)) {
      _logger.default.warn(`setDeviceLocale requires the following format: en-US or ja-JP`);

      return;
    }

    let split_locale = locale.split("-");
    yield this.setDeviceLanguageCountry(split_locale[0], split_locale[1]);
  });

  return function (_x20) {
    return _ref23.apply(this, arguments);
  };
}();

apkUtilsMethods.ensureCurrentLocale = function () {
  var _ref24 = (0, _asyncToGenerator2.default)(function* (language, country, script = null) {
    var _this2 = this;

    const hasLanguage = _lodash.default.isString(language);

    const hasCountry = _lodash.default.isString(country);

    if (!hasLanguage && !hasCountry) {
      _logger.default.warn('ensureCurrentLocale requires language or country');

      return false;
    }

    language = (language || '').toLowerCase();
    country = (country || '').toLowerCase();
    const apiLevel = yield this.getApiLevel();
    return yield (0, _asyncbox.retryInterval)(5, 1000, (0, _asyncToGenerator2.default)(function* () {
      try {
        if (apiLevel < 23) {
          let curLanguage, curCountry;

          if (hasLanguage) {
            curLanguage = (yield _this2.getDeviceLanguage()).toLowerCase();

            if (!hasCountry && language === curLanguage) {
              return true;
            }
          }

          if (hasCountry) {
            curCountry = (yield _this2.getDeviceCountry()).toLowerCase();

            if (!hasLanguage && country === curCountry) {
              return true;
            }
          }

          if (language === curLanguage && country === curCountry) {
            return true;
          }
        } else {
          const curLocale = (yield _this2.getDeviceLocale()).toLowerCase();
          const localeCode = script ? `${language}-${script.toLowerCase()}-${country}` : `${language}-${country}`;

          if (localeCode === curLocale) {
            _logger.default.debug(`Requested locale is equal to current locale: '${curLocale}'`);

            return true;
          }
        }

        return false;
      } catch (err) {
        _logger.default.error(`Unable to check device localization: ${err.message}`);

        _logger.default.debug('Restarting ADB and retrying...');

        yield _this2.restartAdb();
        throw err;
      }
    }));
  });

  return function (_x21, _x22) {
    return _ref24.apply(this, arguments);
  };
}();

apkUtilsMethods.setDeviceLanguageCountry = function () {
  var _ref26 = (0, _asyncToGenerator2.default)(function* (language, country, script = null) {
    let hasLanguage = language && _lodash.default.isString(language);

    let hasCountry = country && _lodash.default.isString(country);

    if (!hasLanguage && !hasCountry) {
      _logger.default.warn(`setDeviceLanguageCountry requires language or country.`);

      _logger.default.warn(`Got language: '${language}' and country: '${country}'`);

      return;
    }

    let wasSettingChanged = false;
    let apiLevel = yield this.getApiLevel();
    language = (language || '').toLowerCase();
    country = (country || '').toUpperCase();

    if (apiLevel < 23) {
      let curLanguage = (yield this.getDeviceLanguage()).toLowerCase();
      let curCountry = (yield this.getDeviceCountry()).toUpperCase();

      if (hasLanguage && language !== curLanguage) {
        yield this.setDeviceLanguage(language);
        wasSettingChanged = true;
      }

      if (hasCountry && country !== curCountry) {
        yield this.setDeviceCountry(country);
        wasSettingChanged = true;
      }
    } else {
      let curLocale = yield this.getDeviceLocale();

      if (apiLevel === 23) {
        let locale;

        if (!hasCountry) {
          locale = language;
        } else if (!hasLanguage) {
          locale = country;
        } else {
          locale = `${language}-${country}`;
        }

        _logger.default.debug(`Current locale: '${curLocale}'; requested locale: '${locale}'`);

        if (locale.toLowerCase() !== curLocale.toLowerCase()) {
          yield this.setDeviceSysLocale(locale);
          wasSettingChanged = true;
        }
      } else {
        if (!hasCountry || !hasLanguage) {
          _logger.default.warn(`setDeviceLanguageCountry requires both language and country to be set for API 24+`);

          _logger.default.warn(`Got language: '${language}' and country: '${country}'`);

          return;
        }

        const localeCode = script ? `${language}-${script}-${country}` : `${language}-${country}`;

        _logger.default.debug(`Current locale: '${curLocale}'; requested locale: '${localeCode}'`);

        if (localeCode.toLowerCase() !== curLocale.toLowerCase()) {
          yield this.setDeviceSysLocaleViaSettingApp(language, country, script);
        }
      }
    }

    if (wasSettingChanged) {
      _logger.default.info("Rebooting the device in order to apply new locale via 'setting persist.sys.locale' command.");

      yield this.reboot();
    }
  });

  return function (_x23, _x24) {
    return _ref26.apply(this, arguments);
  };
}();

apkUtilsMethods.getApkInfo = function () {
  var _ref27 = (0, _asyncToGenerator2.default)(function* (appPath) {
    if (!(yield _appiumSupport.fs.exists(appPath))) {
      throw new Error(`The file at path ${appPath} does not exist or is not accessible`);
    }

    if (appPath.endsWith(_helpers.APKS_EXTENSION)) {
      appPath = yield this.extractBaseApk(appPath);
    }

    yield this.initAapt();

    try {
      const _ref28 = yield (0, _teen_process.exec)(this.binaries.aapt, ['d', 'badging', appPath]),
            stdout = _ref28.stdout;

      const matches = new RegExp(/package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'/).exec(stdout);

      if (matches) {
        return {
          name: matches[1],
          versionCode: parseInt(matches[2], 10),
          versionName: matches[3]
        };
      }
    } catch (err) {
      _logger.default.warn(`Error "${err.message}" while getting badging info`);
    }

    return {};
  });

  return function (_x25) {
    return _ref27.apply(this, arguments);
  };
}();

apkUtilsMethods.getPackageInfo = function () {
  var _ref29 = (0, _asyncToGenerator2.default)(function* (pkg) {
    _logger.default.debug(`Getting package info for '${pkg}'`);

    let result = {
      name: pkg
    };

    try {
      const stdout = yield this.shell(['dumpsys', 'package', pkg]);
      const versionNameMatch = new RegExp(/versionName=([\d+.]+)/).exec(stdout);

      if (versionNameMatch) {
        result.versionName = versionNameMatch[1];
      }

      const versionCodeMatch = new RegExp(/versionCode=(\d+)/).exec(stdout);

      if (versionCodeMatch) {
        result.versionCode = parseInt(versionCodeMatch[1], 10);
      }

      return result;
    } catch (err) {
      _logger.default.warn(`Error '${err.message}' while dumping package info`);
    }

    return result;
  });

  return function (_x26) {
    return _ref29.apply(this, arguments);
  };
}();

apkUtilsMethods.pullApk = function () {
  var _pullApk = (0, _asyncToGenerator2.default)(function* (pkg, tmpDir) {
    const pkgPath = (yield this.adbExec(['shell', 'pm', 'path', pkg])).replace('package:', '');

    const tmpApp = _path.default.resolve(tmpDir, `${pkg}.apk`);

    yield this.pull(pkgPath, tmpApp);

    _logger.default.debug(`Pulled app for package '${pkg}' to '${tmpApp}'`);

    return tmpApp;
  });

  return function pullApk(_x27, _x28) {
    return _pullApk.apply(this, arguments);
  };
}();

var _default = apkUtilsMethods;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi90b29scy9hcGstdXRpbHMuanMiXSwibmFtZXMiOlsiYXBrVXRpbHNNZXRob2RzIiwiQUNUSVZJVElFU19UUk9VQkxFU0hPT1RJTkdfTElOSyIsImlzQXBwSW5zdGFsbGVkIiwicGtnIiwibG9nIiwiZGVidWciLCJpbnN0YWxsZWRQYXR0ZXJuIiwiUmVnRXhwIiwiXyIsImVzY2FwZVJlZ0V4cCIsInN0ZG91dCIsInNoZWxsIiwiaXNJbnN0YWxsZWQiLCJ0ZXN0IiwiZSIsIkVycm9yIiwibWVzc2FnZSIsInN0YXJ0VXJpIiwidXJpIiwiYXJncyIsInJlcGxhY2UiLCJyZXMiLCJ0b0xvd2VyQ2FzZSIsImluY2x1ZGVzIiwic3RhcnRBcHAiLCJzdGFydEFwcE9wdGlvbnMiLCJhY3Rpdml0eSIsImNsb25lIiwiZGVmYXVsdHMiLCJ3YWl0UGtnIiwid2FpdEFjdGl2aXR5IiwicmV0cnkiLCJzdG9wQXBwIiwiYXBpTGV2ZWwiLCJnZXRBcGlMZXZlbCIsImNtZCIsInNoZWxsT3B0cyIsImlzSW50ZWdlciIsIndhaXREdXJhdGlvbiIsInRpbWVvdXQiLCJzdGFydHNXaXRoIiwid2FpdEZvckFjdGl2aXR5IiwiZ2V0Rm9jdXNlZFBhY2thZ2VBbmRBY3Rpdml0eSIsIm51bGxGb2N1c2VkQXBwUmUiLCJmb2N1c2VkQXBwUmUiLCJudWxsQ3VycmVudEZvY3VzUmUiLCJjdXJyZW50Rm9jdXNBcHBSZSIsInBhdHRlcm4iLCJtYXRjaCIsImV4ZWMiLCJhcHBQYWNrYWdlIiwidHJpbSIsImFwcEFjdGl2aXR5Iiwid2FpdEZvckFjdGl2aXR5T3JOb3QiLCJ3YWl0Rm9yU3RvcCIsIndhaXRNcyIsInNwbGl0TmFtZXMiLCJuYW1lcyIsInNwbGl0IiwibWFwIiwibmFtZSIsImFsbFBhY2thZ2VzIiwiYWxsQWN0aXZpdGllcyIsInBvc3NpYmxlQWN0aXZpdHlOYW1lcyIsIm9uZUFjdGl2aXR5IiwiY3VycmVudFBrZyIsInB1c2giLCJqb2luIiwicG9zc2libGVBY3Rpdml0eVBhdHRlcm5zIiwicG9zc2libGVBY3Rpdml0eU5hbWUiLCJyZXRyaWVzIiwicGFyc2VJbnQiLCJpc05hTiIsImZ1bGx5UXVhbGlmaWVkQWN0aXZpdHkiLCJmb3VuZEFjdCIsImZpbmRJbmRleCIsInBvc3NpYmxlUGF0dGVybiIsImFjdCIsIndhaXRGb3JOb3RBY3Rpdml0eSIsIkFQS19VTklOU1RBTExfVElNRU9VVCIsInVuaW5zdGFsbEFwayIsIm9wdGlvbnMiLCJPYmplY3QiLCJhc3NpZ24iLCJpbmZvIiwia2VlcERhdGEiLCJmb3JjZVN0b3AiLCJhZGJFeGVjIiwiaW5zdGFsbEZyb21EZXZpY2VQYXRoIiwiYXBrUGF0aE9uRGV2aWNlIiwib3B0cyIsImluZGV4T2YiLCJpbnN0YWxsIiwiYXBwUGF0aCIsImVuZHNXaXRoIiwiQVBLU19FWFRFTlNJT04iLCJpbnN0YWxsQXBrcyIsIkFQS19JTlNUQUxMX1RJTUVPVVQiLCJpbnN0YWxsQXJncyIsIm91dHB1dCIsInRydW5jYXRlZE91dHB1dCIsImlzU3RyaW5nIiwibGVuZ3RoIiwic3Vic3RyIiwiZXJyIiwiaW5zdGFsbE9yVXBncmFkZSIsInV0aWwiLCJoYXNWYWx1ZSIsImFwa0luZm8iLCJnZXRBcGtJbmZvIiwid2FybiIsImdldFBhY2thZ2VJbmZvIiwicGtnVmVyc2lvbkNvZGUiLCJ2ZXJzaW9uQ29kZSIsInBrZ1ZlcnNpb25OYW1lU3RyIiwidmVyc2lvbk5hbWUiLCJwa2dWZXJzaW9uTmFtZSIsInNlbXZlciIsInZhbGlkIiwiY29lcmNlIiwiYXBrVmVyc2lvbkNvZGUiLCJhcGtWZXJzaW9uTmFtZVN0ciIsImFwa1ZlcnNpb25OYW1lIiwic2F0aXNmaWVzIiwiZXh0cmFjdFN0cmluZ3NGcm9tQXBrIiwibGFuZ3VhZ2UiLCJvdXQiLCJleHRyYWN0TGFuZ3VhZ2VBcGsiLCJpbml0QWFwdCIsInJhd0FhcHRPdXRwdXQiLCJiaW5hcmllcyIsImFhcHQiLCJkZWZhdWx0Q29uZmlnTWFya2VyIiwiY29uZmlnTWFya2VyIiwiY29uZmlncyIsIm9zIiwiRU9MIiwiYXBrU3RyaW5ncyIsImlzSW5Db25maWciLCJjdXJyZW50UmVzb3VyY2VJZCIsImlzSW5QbHVyYWxHcm91cCIsInN0YXJ0c1dpdGhBbnkiLCJzIiwiYXJyIiwicmVkdWNlIiwiYWNjIiwieCIsIm5vcm1hbGl6ZVN0cmluZ01hdGNoIiwibGluZSIsInRyaW1tZWRMaW5lIiwiaXNFbXB0eSIsImtleXMiLCJsb2NhbFBhdGgiLCJwYXRoIiwicmVzb2x2ZSIsImZzIiwid3JpdGVGaWxlIiwiSlNPTiIsInN0cmluZ2lmeSIsImdldERldmljZUxhbmd1YWdlIiwiZ2V0RGV2aWNlU3lzTGFuZ3VhZ2UiLCJnZXREZXZpY2VQcm9kdWN0TGFuZ3VhZ2UiLCJnZXREZXZpY2VMb2NhbGUiLCJzZXREZXZpY2VMYW5ndWFnZSIsInNldERldmljZVN5c0xhbmd1YWdlIiwiZ2V0RGV2aWNlQ291bnRyeSIsImNvdW50cnkiLCJnZXREZXZpY2VTeXNDb3VudHJ5IiwiZ2V0RGV2aWNlUHJvZHVjdENvdW50cnkiLCJzZXREZXZpY2VDb3VudHJ5Iiwic2V0RGV2aWNlU3lzQ291bnRyeSIsImxvY2FsZSIsImdldERldmljZVN5c0xvY2FsZSIsImdldERldmljZVByb2R1Y3RMb2NhbGUiLCJzZXREZXZpY2VMb2NhbGUiLCJ2YWxpZGF0ZUxvY2FsZSIsInNwbGl0X2xvY2FsZSIsInNldERldmljZUxhbmd1YWdlQ291bnRyeSIsImVuc3VyZUN1cnJlbnRMb2NhbGUiLCJzY3JpcHQiLCJoYXNMYW5ndWFnZSIsImhhc0NvdW50cnkiLCJjdXJMYW5ndWFnZSIsImN1ckNvdW50cnkiLCJjdXJMb2NhbGUiLCJsb2NhbGVDb2RlIiwiZXJyb3IiLCJyZXN0YXJ0QWRiIiwid2FzU2V0dGluZ0NoYW5nZWQiLCJ0b1VwcGVyQ2FzZSIsInNldERldmljZVN5c0xvY2FsZSIsInNldERldmljZVN5c0xvY2FsZVZpYVNldHRpbmdBcHAiLCJyZWJvb3QiLCJleGlzdHMiLCJleHRyYWN0QmFzZUFwayIsIm1hdGNoZXMiLCJyZXN1bHQiLCJ2ZXJzaW9uTmFtZU1hdGNoIiwidmVyc2lvbkNvZGVNYXRjaCIsInB1bGxBcGsiLCJ0bXBEaXIiLCJwa2dQYXRoIiwidG1wQXBwIiwicHVsbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQSxJQUFJQSxlQUFlLEdBQUcsRUFBdEI7QUFFQSxNQUFNQywrQkFBK0IsR0FDbkMseUdBREY7O0FBVUFELGVBQWUsQ0FBQ0UsY0FBaEI7QUFBQSw2Q0FBaUMsV0FBZ0JDLEdBQWhCLEVBQXFCO0FBQ3BEQyxvQkFBSUMsS0FBSixDQUFXLDhCQUE2QkYsR0FBSSxFQUE1Qzs7QUFDQSxVQUFNRyxnQkFBZ0IsR0FBRyxJQUFJQyxNQUFKLENBQVksc0JBQXFCQyxnQkFBRUMsWUFBRixDQUFlTixHQUFmLENBQW9CLFlBQXJELEVBQWtFLEdBQWxFLENBQXpCOztBQUNBLFFBQUk7QUFDRixZQUFNTyxNQUFNLFNBQVMsS0FBS0MsS0FBTCxDQUFXLENBQUMsU0FBRCxFQUFZLFNBQVosRUFBdUJSLEdBQXZCLENBQVgsQ0FBckI7QUFDQSxZQUFNUyxXQUFXLEdBQUdOLGdCQUFnQixDQUFDTyxJQUFqQixDQUFzQkgsTUFBdEIsQ0FBcEI7O0FBQ0FOLHNCQUFJQyxLQUFKLENBQVcsSUFBR0YsR0FBSSxPQUFNLENBQUNTLFdBQUQsR0FBZSxNQUFmLEdBQXdCLEVBQUcsWUFBbkQ7O0FBQ0EsYUFBT0EsV0FBUDtBQUNELEtBTEQsQ0FLRSxPQUFPRSxDQUFQLEVBQVU7QUFDVixZQUFNLElBQUlDLEtBQUosQ0FBVyxxQkFBb0JaLEdBQUksbUNBQWtDVyxDQUFDLENBQUNFLE9BQVEsRUFBL0UsQ0FBTjtBQUNEO0FBQ0YsR0FYRDs7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFtQkFoQixlQUFlLENBQUNpQixRQUFoQjtBQUFBLDhDQUEyQixXQUFnQkMsR0FBaEIsRUFBcUJmLEdBQXJCLEVBQTBCO0FBQ25ELFFBQUksQ0FBQ2UsR0FBRCxJQUFRLENBQUNm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QUFqQixFQUFzQixFQUF0QixDQUE3QjtBQUNEOztBQUNELGFBQU9GLE1BQVA7QUFDRCxLQVhELENBV0UsT0FBTzVGLEdBQVAsRUFBWTtBQUNacEcsc0JBQUkwRyxJQUFKLENBQVUsVUFBU04sR0FBRyxDQUFDeEYsT0FBUSw4QkFBL0I7QUFDRDs7QUFDRCxXQUFPb0wsTUFBUDtBQUNELEdBbEJEOztBQUFBO0FBQUE7QUFBQTtBQUFBOztBQW9CQXBNLGVBQWUsQ0FBQ3VNLE9BQWhCO0FBQUEsaURBQTBCLFdBQXdCcE0sR0FBeEIsRUFBNkJxTSxNQUE3QixFQUFxQztBQUM3RCxVQUFNQyxPQUFPLEdBQUcsT0FBTyxLQUFLbEgsT0FBTCxDQUFhLENBQUMsT0FBRCxFQUFVLElBQVYsRUFBZ0IsTUFBaEIsRUFBd0JwRixHQUF4QixDQUFiLENBQVAsRUFBbURpQixPQUFuRCxDQUEyRCxVQUEzRCxFQUF1RSxFQUF2RSxDQUFoQjs7QUFDQSxVQUFNc0wsTUFBTSxHQUFHakQsY0FBS0MsT0FBTCxDQUFhOEMsTUFBYixFQUFzQixHQUFFck0sR0FBSSxNQUE1QixDQUFmOztBQUNBLFVBQU0sS0FBS3dNLElBQUwsQ0FBVUYsT0FBVixFQUFtQkMsTUFBbkIsQ0FBTjs7QUFDQXRNLG9CQUFJQyxLQUFKLENBQVcsMkJBQTBCRixHQUFJLFNBQVF1TSxNQUFPLEdBQXhEOztBQUNBLFdBQU9BLE1BQVA7QUFDRCxHQU5EOztBQUFBLGtCQUF5Q0gsT0FBekM7QUFBQTtBQUFBO0FBQUE7O2VBUWV2TSxlIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYnVpbGRTdGFydENtZCwgQVBLU19FWFRFTlNJT04sIGJ1aWxkSW5zdGFsbEFyZ3MsIEFQS19JTlNUQUxMX1RJTUVPVVQgfSBmcm9tICcuLi9oZWxwZXJzLmpzJztcbmltcG9ydCB7IGV4ZWMgfSBmcm9tICd0ZWVuX3Byb2Nlc3MnO1xuaW1wb3J0IGxvZyBmcm9tICcuLi9sb2dnZXIuanMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgcmV0cnlJbnRlcnZhbCB9IGZyb20gJ2FzeW5jYm94JztcbmltcG9ydCB7IGZzLCB1dGlsLCBta2RpcnAgfSBmcm9tICdhcHBpdW0tc3VwcG9ydCc7XG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgb3MgZnJvbSAnb3MnO1xuXG5sZXQgYXBrVXRpbHNNZXRob2RzID0ge307XG5cbmNvbnN0IEFDVElWSVRJRVNfVFJPVUJMRVNIT09USU5HX0xJTksgPVxuICAnaHR0cHM6Ly9naXRodWIuY29tL2FwcGl1bS9hcHBpdW0vYmxvYi9tYXN0ZXIvZG9jcy9lbi93cml0aW5nLXJ1bm5pbmctYXBwaXVtL2FuZHJvaWQvYWN0aXZpdHktc3RhcnR1cC5tZCc7XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgcGFydGljdWxhciBwYWNrYWdlIGlzIHByZXNlbnQgb24gdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwa2cgLSBUaGUgbmFtZSBvZiB0aGUgcGFja2FnZSB0byBjaGVjay5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIHBhY2thZ2UgaXMgaW5zdGFsbGVkLlxuICogQHRocm93cyB7RXJyb3J9IElmIHRoZXJlIHdhcyBhbiBlcnJvciB3aGlsZSBkZXRlY3RpbmcgYXBwbGljYXRpb24gc3RhdGVcbiAqL1xuYXBrVXRpbHNNZXRob2RzLmlzQXBwSW5zdGFsbGVkID0gYXN5bmMgZnVuY3Rpb24gKHBrZykge1xuICBsb2cuZGVidWcoYEdldHRpbmcgaW5zdGFsbCBzdGF0dXMgZm9yICR7cGtnfWApO1xuICBjb25zdCBpbnN0YWxsZWRQYXR0ZXJuID0gbmV3IFJlZ0V4cChgXlxcXFxzKlBhY2thZ2VcXFxccytcXFxcWyR7Xy5lc2NhcGVSZWdFeHAocGtnKX1cXFxcXVteOl0rOiRgLCAnbScpO1xuICB0cnkge1xuICAgIGNvbnN0IHN0ZG91dCA9IGF3YWl0IHRoaXMuc2hlbGwoWydkdW1wc3lzJywgJ3BhY2thZ2UnLCBwa2ddKTtcbiAgICBjb25zdCBpc0luc3RhbGxlZCA9IGluc3RhbGxlZFBhdHRlcm4udGVzdChzdGRvdXQpO1xuICAgIGxvZy5kZWJ1ZyhgJyR7cGtnfScgaXMkeyFpc0luc3RhbGxlZCA/ICcgbm90JyA6ICcnfSBpbnN0YWxsZWRgKTtcbiAgICByZXR1cm4gaXNJbnN0YWxsZWQ7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIGZpbmRpbmcgaWYgJyR7cGtnfScgaXMgaW5zdGFsbGVkLiBPcmlnaW5hbCBlcnJvcjogJHtlLm1lc3NhZ2V9YCk7XG4gIH1cbn07XG5cbi8qKlxuICogU3RhcnQgdGhlIHBhcnRpY3VsYXIgVVJJIG9uIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJpIC0gVGhlIG5hbWUgb2YgVVJJIHRvIHN0YXJ0LlxuICogQHBhcmFtIHtzdHJpbmd9IHBrZyAtIFRoZSBuYW1lIG9mIHRoZSBwYWNrYWdlIHRvIHN0YXJ0IHRoZSBVUkkgd2l0aC5cbiAqL1xuYXBrVXRpbHNNZXRob2RzLnN0YXJ0VXJpID0gYXN5bmMgZnVuY3Rpb24gKHVyaSwgcGtnKSB7XG4gIGlmICghdXJpIHx8ICFwa2cpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJVUkkgYW5kIHBhY2thZ2UgYXJndW1lbnRzIGFyZSByZXF1aXJlZFwiKTtcbiAgfVxuXG4gIGNvbnN0IGFyZ3MgPSBbXG4gICAgXCJhbVwiLCBcInN0YXJ0XCIsXG4gICAgXCItV1wiLFxuICAgIFwiLWFcIiwgXCJhbmRyb2lkLmludGVudC5hY3Rpb24uVklFV1wiLFxuICAgIFwiLWRcIiwgdXJpLnJlcGxhY2UoLyYvZywgJ1xcXFwmJyksXG4gICAgcGtnLFxuICBdO1xuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuc2hlbGwoYXJncyk7XG4gICAgaWYgKHJlcy50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCd1bmFibGUgdG8gcmVzb2x2ZSBpbnRlbnQnKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKHJlcyk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciBhdHRlbXB0aW5nIHRvIHN0YXJ0IFVSSS4gT3JpZ2luYWwgZXJyb3I6ICR7ZX1gKTtcbiAgfVxufTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBTdGFydEFwcE9wdGlvbnNcbiAqIEBwcm9wZXJ0eSB7IXN0cmluZ30gYWN0aXZpdHkgLSBUaGUgbmFtZSBvZiB0aGUgbWFpbiBhcHBsaWNhdGlvbiBhY3Rpdml0eVxuICogQHByb3BlcnR5IHshc3RyaW5nfSBwa2cgLSBUaGUgbmFtZSBvZiB0aGUgYXBwbGljYXRpb24gcGFja2FnZVxuICogQHByb3BlcnR5IHs/Ym9vbGVhbn0gcmV0cnkgW3RydWVdIC0gSWYgdGhpcyBwcm9wZXJ0eSBpcyBzZXQgdG8gYHRydWVgXG4gKiBhbmQgdGhlIGFjdGl2aXR5IG5hbWUgZG9lcyBub3Qgc3RhcnQgd2l0aCAnLicgdGhlbiB0aGUgbWV0aG9kXG4gKiB3aWxsIHRyeSB0byBhZGQgdGhlIG1pc3NpbmcgZG90IGFuZCBzdGFydCB0aGUgYWN0aXZpdHkgb25jZSBtb3JlXG4gKiBpZiB0aGUgZmlyc3Qgc3RhcnR1cCB0cnkgZmFpbHMuXG4gKiBAcHJvcGVydHkgez9ib29sZWFufSBzdG9wQXBwIFt0cnVlXSAtIFNldCBpdCB0byBgdHJ1ZWAgaW4gb3JkZXIgdG8gZm9yY2VmdWxseVxuICogc3RvcCB0aGUgYWN0aXZpdHkgaWYgaXQgaXMgYWxyZWFkeSBydW5uaW5nLlxuICogQHByb3BlcnR5IHs/c3RyaW5nfSB3YWl0UGtnIC0gVGhlIG5hbWUgb2YgdGhlIHBhY2thZ2UgdG8gd2FpdCB0byBvblxuICogc3RhcnR1cCAodGhpcyBvbmx5IG1ha2VzIHNlbnNlIGlmIHRoaXMgbmFtZSBpcyBkaWZmZXJlbnQgZnJvbSB0aGUgb25lLCB3aGljaCBpcyBzZXQgYXMgYHBrZ2ApXG4gKiBAcHJvcGVydHkgez9zdHJpbmd9IHdhaXRBY3Rpdml0eSAtIFRoZSBuYW1lIG9mIHRoZSBhY3Rpdml0eSB0byB3YWl0IHRvIG9uXG4gKiBzdGFydHVwICh0aGlzIG9ubHkgbWFrZXMgc2Vuc2UgaWYgdGhpcyBuYW1lIGlzIGRpZmZlcmVudCBmcm9tIHRoZSBvbmUsIHdoaWNoIGlzIHNldCBhcyBgYWN0aXZpdHlgKVxuICogQHByb3BlcnR5IHs/bnVtYmVyfSB3YWl0RHVyYXRpb24gLSBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0IHVudGlsIHRoZVxuICogYHdhaXRBY3Rpdml0eWAgaXMgZm9jdXNlZFxuICogQHByb3BlcnR5IHs/c3RyaW5nfG51bWJlcn0gdXNlciAtIFRoZSBudW1iZXIgb2YgdGhlIHVzZXIgcHJvZmlsZSB0byBzdGFydFxuICogdGhlIGdpdmVuIGFjdGl2aXR5IHdpdGguIFRoZSBkZWZhdWx0IE9TIHVzZXIgcHJvZmlsZSAodXN1YWxseSB6ZXJvKSBpcyB1c2VkXG4gKiB3aGVuIHRoaXMgcHJvcGVydHkgaXMgdW5zZXRcbiAqL1xuXG4vKipcbiAqIFN0YXJ0IHRoZSBwYXJ0aWN1bGFyIHBhY2thZ2UvYWN0aXZpdHkgb24gdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEBwYXJhbSB7U3RhcnRBcHBPcHRpb25zfSBzdGFydEFwcE9wdGlvbnMgW3t9XSAtIFN0YXJ0dXAgb3B0aW9ucyBtYXBwaW5nLlxuICogQHJldHVybiB7c3RyaW5nfSBUaGUgb3V0cHV0IG9mIHRoZSBjb3JyZXNwb25kaW5nIGFkYiBjb21tYW5kLlxuICogQHRocm93cyB7RXJyb3J9IElmIHRoZXJlIGlzIGFuIGVycm9yIHdoaWxlIGV4ZWN1dGluZyB0aGUgYWN0aXZpdHlcbiAqL1xuYXBrVXRpbHNNZXRob2RzLnN0YXJ0QXBwID0gYXN5bmMgZnVuY3Rpb24gKHN0YXJ0QXBwT3B0aW9ucyA9IHt9KSB7XG4gIGlmICghc3RhcnRBcHBPcHRpb25zLmFjdGl2aXR5IHx8ICFzdGFydEFwcE9wdGlvbnMucGtnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiYWN0aXZpdHkgYW5kIHBrZyBhcmUgcmVxdWlyZWQgdG8gc3RhcnQgYW4gYXBwbGljYXRpb25cIik7XG4gIH1cblxuICBzdGFydEFwcE9wdGlvbnMgPSBfLmNsb25lKHN0YXJ0QXBwT3B0aW9ucyk7XG4gIHN0YXJ0QXBwT3B0aW9ucy5hY3Rpdml0eSA9IHN0YXJ0QXBwT3B0aW9ucy5hY3Rpdml0eS5yZXBsYWNlKCckJywgJ1xcXFwkJyk7XG4gIC8vIGluaXRpYWxpemluZyBkZWZhdWx0c1xuICBfLmRlZmF1bHRzKHN0YXJ0QXBwT3B0aW9ucywge1xuICAgIHdhaXRQa2c6IHN0YXJ0QXBwT3B0aW9ucy5wa2csXG4gICAgd2FpdEFjdGl2aXR5OiBmYWxzZSxcbiAgICByZXRyeTogdHJ1ZSxcbiAgICBzdG9wQXBwOiB0cnVlXG4gIH0pO1xuICAvLyBwcmV2ZW50aW5nIG51bGwgd2FpdHBrZ1xuICBzdGFydEFwcE9wdGlvbnMud2FpdFBrZyA9IHN0YXJ0QXBwT3B0aW9ucy53YWl0UGtnIHx8IHN0YXJ0QXBwT3B0aW9ucy5wa2c7XG5cbiAgY29uc3QgYXBpTGV2ZWwgPSBhd2FpdCB0aGlzLmdldEFwaUxldmVsKCk7XG4gIGNvbnN0IGNtZCA9IGJ1aWxkU3RhcnRDbWQoc3RhcnRBcHBPcHRpb25zLCBhcGlMZXZlbCk7XG4gIHRyeSB7XG4gICAgY29uc3Qgc2hlbGxPcHRzID0ge307XG4gICAgaWYgKF8uaXNJbnRlZ2VyKHN0YXJ0QXBwT3B0aW9ucy53YWl0RHVyYXRpb24pICYmIHN0YXJ0QXBwT3B0aW9ucy53YWl0RHVyYXRpb24gPiAyMDAwMCkge1xuICAgICAgc2hlbGxPcHRzLnRpbWVvdXQgPSBzdGFydEFwcE9wdGlvbnMud2FpdER1cmF0aW9uO1xuICAgIH1cbiAgICBjb25zdCBzdGRvdXQgPSBhd2FpdCB0aGlzLnNoZWxsKGNtZCwgc2hlbGxPcHRzKTtcbiAgICBpZiAoc3Rkb3V0LmluY2x1ZGVzKFwiRXJyb3I6IEFjdGl2aXR5IGNsYXNzXCIpICYmIHN0ZG91dC5pbmNsdWRlcyhcImRvZXMgbm90IGV4aXN0XCIpKSB7XG4gICAgICBpZiAoc3RhcnRBcHBPcHRpb25zLnJldHJ5ICYmICFzdGFydEFwcE9wdGlvbnMuYWN0aXZpdHkuc3RhcnRzV2l0aChcIi5cIikpIHtcbiAgICAgICAgbG9nLmRlYnVnKGBXZSB0cmllZCB0byBzdGFydCBhbiBhY3Rpdml0eSB0aGF0IGRvZXNuJ3QgZXhpc3QsIGAgK1xuICAgICAgICAgICAgICAgICAgYHJldHJ5aW5nIHdpdGggJy4ke3N0YXJ0QXBwT3B0aW9ucy5hY3Rpdml0eX0nIGFjdGl2aXR5IG5hbWVgKTtcbiAgICAgICAgc3RhcnRBcHBPcHRpb25zLmFjdGl2aXR5ID0gYC4ke3N0YXJ0QXBwT3B0aW9ucy5hY3Rpdml0eX1gO1xuICAgICAgICBzdGFydEFwcE9wdGlvbnMucmV0cnkgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuc3RhcnRBcHAoc3RhcnRBcHBPcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIHRocm93IG5ldyBFcnJvcihgQWN0aXZpdHkgbmFtZSAnJHtzdGFydEFwcE9wdGlvbnMuYWN0aXZpdHl9JyB1c2VkIHRvIHN0YXJ0IHRoZSBhcHAgZG9lc24ndCBgICtcbiAgICAgICAgICAgICAgICAgICAgICBgZXhpc3Qgb3IgY2Fubm90IGJlIGxhdW5jaGVkISBNYWtlIHN1cmUgaXQgZXhpc3RzIGFuZCBpcyBhIGxhdW5jaGFibGUgYWN0aXZpdHlgKTtcbiAgICB9IGVsc2UgaWYgKHN0ZG91dC5pbmNsdWRlcyhcImphdmEubGFuZy5TZWN1cml0eUV4Y2VwdGlvblwiKSkge1xuICAgICAgLy8gaWYgdGhlIGFwcCBpcyBkaXNhYmxlZCBvbiBhIHJlYWwgZGV2aWNlIGl0IHdpbGwgdGhyb3cgYSBzZWN1cml0eSBleGNlcHRpb25cbiAgICAgIHRocm93IG5ldyBFcnJvcihgVGhlIHBlcm1pc3Npb24gdG8gc3RhcnQgJyR7c3RhcnRBcHBPcHRpb25zLmFjdGl2aXR5fScgYWN0aXZpdHkgaGFzIGJlZW4gZGVuaWVkLmAgK1xuICAgICAgICAgICAgICAgICAgICAgIGBNYWtlIHN1cmUgdGhlIGFjdGl2aXR5L3BhY2thZ2UgbmFtZXMgYXJlIGNvcnJlY3QuYCk7XG4gICAgfVxuICAgIGlmIChzdGFydEFwcE9wdGlvbnMud2FpdEFjdGl2aXR5KSB7XG4gICAgICBhd2FpdCB0aGlzLndhaXRGb3JBY3Rpdml0eShzdGFydEFwcE9wdGlvbnMud2FpdFBrZywgc3RhcnRBcHBPcHRpb25zLndhaXRBY3Rpdml0eSwgc3RhcnRBcHBPcHRpb25zLndhaXREdXJhdGlvbik7XG4gICAgfVxuICAgIHJldHVybiBzdGRvdXQ7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBzdGFydCB0aGUgJyR7c3RhcnRBcHBPcHRpb25zLnBrZ30nIGFwcGxpY2F0aW9uLiBgICtcbiAgICAgIGBWaXNpdCAke0FDVElWSVRJRVNfVFJPVUJMRVNIT09USU5HX0xJTkt9IGZvciB0cm91Ymxlc2hvb3RpbmcuIGAgK1xuICAgICAgYE9yaWdpbmFsIGVycm9yOiAke2UubWVzc2FnZX1gKTtcbiAgfVxufTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBQYWNrYWdlQWN0aXZpdHlJbmZvXG4gKiBAcHJvcGVydHkgez9zdHJpbmd9IGFwcFBhY2thZ2UgLSBUaGUgbmFtZSBvZiBhcHBsaWNhdGlvbiBwYWNrYWdlLFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIGV4YW1wbGUgJ2NvbS5hY21lLmFwcCcuXG4gKiBAcHJvcGVydHkgez9zdHJpbmd9IGFwcEFjdGl2aXR5IC0gVGhlIG5hbWUgb2YgbWFpbiBhcHBsaWNhdGlvbiBhY3Rpdml0eS5cbiAqL1xuXG4vKipcbiAqIEdldCB0aGUgbmFtZSBvZiBjdXJyZW50bHkgZm9jdXNlZCBwYWNrYWdlIGFuZCBhY3Rpdml0eS5cbiAqXG4gKiBAcmV0dXJuIHtQYWNrYWdlQWN0aXZpdHlJbmZvfSBUaGUgbWFwcGluZywgd2hlcmUgcHJvcGVydHkgbmFtZXMgYXJlICdhcHBQYWNrYWdlJyBhbmQgJ2FwcEFjdGl2aXR5Jy5cbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiB0aGVyZSBpcyBhbiBlcnJvciB3aGlsZSBwYXJzaW5nIHRoZSBkYXRhLlxuICovXG5hcGtVdGlsc01ldGhvZHMuZ2V0Rm9jdXNlZFBhY2thZ2VBbmRBY3Rpdml0eSA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgbG9nLmRlYnVnKFwiR2V0dGluZyBmb2N1c2VkIHBhY2thZ2UgYW5kIGFjdGl2aXR5XCIpO1xuICBjb25zdCBjbWQgPSBbJ2R1bXBzeXMnLCAnd2luZG93JywgJ3dpbmRvd3MnXTtcbiAgY29uc3QgbnVsbEZvY3VzZWRBcHBSZSA9IG5ldyBSZWdFeHAoL15cXHMqbUZvY3VzZWRBcHA9bnVsbC8sICdtJyk7XG4gIC8vIGh0dHBzOi8vcmVnZXgxMDEuY29tL3IveFo4dkY3LzFcbiAgY29uc3QgZm9jdXNlZEFwcFJlID0gbmV3IFJlZ0V4cCgnXlxcXFxzKm1Gb2N1c2VkQXBwLitSZWNvcmRcXFxcey4qXFxcXHMoW15cXFxcc1xcXFwvXFxcXH1dKyknICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnXFxcXC8oW15cXFxcc1xcXFwvXFxcXH1cXFxcLF0rKVxcXFwsPyhcXFxcc1teXFxcXHNcXFxcL1xcXFx9XSspKlxcXFx9JywgJ20nKTtcbiAgY29uc3QgbnVsbEN1cnJlbnRGb2N1c1JlID0gbmV3IFJlZ0V4cCgvXlxccyptQ3VycmVudEZvY3VzPW51bGwvLCAnbScpO1xuICBjb25zdCBjdXJyZW50Rm9jdXNBcHBSZSA9IG5ldyBSZWdFeHAoJ15cXFxccyptQ3VycmVudEZvY3VzLitcXFxcey4rXFxcXHMoW15cXFxcc1xcXFwvXSspXFxcXC8oW15cXFxcc10rKVxcXFxiJywgJ20nKTtcblxuICB0cnkge1xuICAgIGNvbnN0IHN0ZG91dCA9IGF3YWl0IHRoaXMuc2hlbGwoY21kKTtcbiAgICAvLyBUaGUgb3JkZXIgbWF0dGVycyBoZXJlXG4gICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIFtmb2N1c2VkQXBwUmUsIGN1cnJlbnRGb2N1c0FwcFJlXSkge1xuICAgICAgY29uc3QgbWF0Y2ggPSBwYXR0ZXJuLmV4ZWMoc3Rkb3V0KTtcbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGFwcFBhY2thZ2U6IG1hdGNoWzFdLnRyaW0oKSxcbiAgICAgICAgICBhcHBBY3Rpdml0eTogbWF0Y2hbMl0udHJpbSgpXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIFtudWxsRm9jdXNlZEFwcFJlLCBudWxsQ3VycmVudEZvY3VzUmVdKSB7XG4gICAgICBpZiAocGF0dGVybi5leGVjKHN0ZG91dCkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBhcHBQYWNrYWdlOiBudWxsLFxuICAgICAgICAgIGFwcEFjdGl2aXR5OiBudWxsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IHBhcnNlIGFjdGl2aXR5IGZyb20gZHVtcHN5c1wiKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGdldCBmb2N1c1BhY2thZ2VBbmRBY3Rpdml0eS4gT3JpZ2luYWwgZXJyb3I6ICR7ZS5tZXNzYWdlfWApO1xuICB9XG59O1xuXG4vKipcbiAqIFdhaXQgZm9yIHRoZSBnaXZlbiBhY3Rpdml0eSB0byBiZSBmb2N1c2VkL25vbi1mb2N1c2VkLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwa2cgLSBUaGUgbmFtZSBvZiB0aGUgcGFja2FnZSB0byB3YWl0IGZvci5cbiAqIEBwYXJhbSB7c3RyaW5nfSBhY3Rpdml0eSAtIFRoZSBuYW1lIG9mIHRoZSBhY3Rpdml0eSwgYmVsb25naW5nIHRvIHRoYXQgcGFja2FnZSxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvIHdhaXQgZm9yLlxuICogQHBhcmFtIHtib29sZWFufSB3YWl0Rm9yU3RvcCAtIFdoZXRoZXIgdG8gd2FpdCB1bnRpbCB0aGUgYWN0aXZpdHkgaXMgZm9jdXNlZCAodHJ1ZSlcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvciBpcyBub3QgZm9jdXNlZCAoZmFsc2UpLlxuICogQHBhcmFtIHtudW1iZXJ9IHdhaXRNcyBbMjAwMDBdIC0gTnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0IGJlZm9yZSB0aW1lb3V0IG9jY3Vycy5cbiAqIEB0aHJvd3Mge2Vycm9yfSBJZiB0aW1lb3V0IGhhcHBlbnMuXG4gKi9cbmFwa1V0aWxzTWV0aG9kcy53YWl0Rm9yQWN0aXZpdHlPck5vdCA9IGFzeW5jIGZ1bmN0aW9uIChwa2csIGFjdGl2aXR5LCB3YWl0Rm9yU3RvcCwgd2FpdE1zID0gMjAwMDApIHtcbiAgaWYgKCFwa2cgfHwgIWFjdGl2aXR5KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdQYWNrYWdlIGFuZCBhY3Rpdml0eSByZXF1aXJlZC4nKTtcbiAgfVxuICBsb2cuZGVidWcoYFdhaXRpbmcgdXAgdG8gJHt3YWl0TXN9bXMgZm9yIGFjdGl2aXR5IG1hdGNoaW5nIHBrZzogJyR7cGtnfScgYW5kIGAgK1xuICAgICAgICAgICAgYGFjdGl2aXR5OiAnJHthY3Rpdml0eX0nIHRvJHt3YWl0Rm9yU3RvcCA/ICcgbm90JyA6ICcnfSBiZSBmb2N1c2VkYCk7XG5cbiAgY29uc3Qgc3BsaXROYW1lcyA9IChuYW1lcykgPT4gbmFtZXMuc3BsaXQoJywnKS5tYXAoKG5hbWUpID0+IG5hbWUudHJpbSgpKTtcblxuICBjb25zdCBhbGxQYWNrYWdlcyA9IHNwbGl0TmFtZXMocGtnKTtcbiAgY29uc3QgYWxsQWN0aXZpdGllcyA9IHNwbGl0TmFtZXMoYWN0aXZpdHkpO1xuXG4gIGxldCBwb3NzaWJsZUFjdGl2aXR5TmFtZXMgPSBbXTtcbiAgZm9yIChsZXQgb25lQWN0aXZpdHkgb2YgYWxsQWN0aXZpdGllcykge1xuICAgIGlmIChvbmVBY3Rpdml0eS5zdGFydHNXaXRoKCcuJykpIHtcbiAgICAgIC8vIGFkZCB0aGUgcGFja2FnZSBuYW1lIGlmIGFjdGl2aXR5IGlzIG5vdCBmdWxsIHF1YWxpZmllZFxuICAgICAgZm9yIChsZXQgY3VycmVudFBrZyBvZiBhbGxQYWNrYWdlcykge1xuICAgICAgICBwb3NzaWJsZUFjdGl2aXR5TmFtZXMucHVzaChgJHtjdXJyZW50UGtnfSR7b25lQWN0aXZpdHl9YC5yZXBsYWNlKC9cXC4rL2csICcuJykpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBhY2NlcHQgZnVsbHkgcXVhbGlmaWVkIGFjdGl2aXR5IG5hbWUuXG4gICAgICBwb3NzaWJsZUFjdGl2aXR5TmFtZXMucHVzaChvbmVBY3Rpdml0eSk7XG4gICAgICBwb3NzaWJsZUFjdGl2aXR5TmFtZXMucHVzaChgJHtwa2d9LiR7b25lQWN0aXZpdHl9YCk7XG4gICAgfVxuICB9XG4gIGxvZy5kZWJ1ZyhgUG9zc2libGUgYWN0aXZpdGllcywgdG8gYmUgY2hlY2tlZDogJHtwb3NzaWJsZUFjdGl2aXR5TmFtZXMubWFwKChuYW1lKSA9PiBgJyR7bmFtZX0nYCkuam9pbignLCAnKX1gKTtcblxuICBsZXQgcG9zc2libGVBY3Rpdml0eVBhdHRlcm5zID0gcG9zc2libGVBY3Rpdml0eU5hbWVzLm1hcCgocG9zc2libGVBY3Rpdml0eU5hbWUpID0+XG4gICAgbmV3IFJlZ0V4cChgXiR7cG9zc2libGVBY3Rpdml0eU5hbWUucmVwbGFjZSgvXFwuL2csICdcXFxcLicpLnJlcGxhY2UoL1xcKi9nLCAnLio/JykucmVwbGFjZSgvXFwkL2csICdcXFxcJCcpfSRgKVxuICApO1xuXG4gIC8vIGZpZ3VyZSBvdXQgdGhlIG51bWJlciBvZiByZXRyaWVzLiBUcnkgb25jZSBpZiB3YWl0TXMgaXMgbGVzcyB0aGF0IDc1MFxuICAvLyAzMCB0aW1lcyBpZiBwYXJzaW5nIGlzIG5vdCBwb3NzaWJsZVxuICBsZXQgcmV0cmllcyA9IHBhcnNlSW50KHdhaXRNcyAvIDc1MCwgMTApIHx8IDE7XG4gIHJldHJpZXMgPSBpc05hTihyZXRyaWVzKSA/IDMwIDogcmV0cmllcztcbiAgYXdhaXQgcmV0cnlJbnRlcnZhbChyZXRyaWVzLCA3NTAsIGFzeW5jICgpID0+IHtcbiAgICBsZXQge2FwcFBhY2thZ2UsIGFwcEFjdGl2aXR5fSA9IGF3YWl0IHRoaXMuZ2V0Rm9jdXNlZFBhY2thZ2VBbmRBY3Rpdml0eSgpO1xuICAgIGlmIChhcHBBY3Rpdml0eSAmJiBhcHBQYWNrYWdlKSB7XG4gICAgICBsZXQgZnVsbHlRdWFsaWZpZWRBY3Rpdml0eSA9IGFwcEFjdGl2aXR5LnN0YXJ0c1dpdGgoJy4nKSA/IGAke2FwcFBhY2thZ2V9JHthcHBBY3Rpdml0eX1gIDogYXBwQWN0aXZpdHk7XG4gICAgICBsb2cuZGVidWcoYEZvdW5kIHBhY2thZ2U6ICcke2FwcFBhY2thZ2V9JyBhbmQgZnVsbHkgcXVhbGlmaWVkIGFjdGl2aXR5IG5hbWUgOiAnJHtmdWxseVF1YWxpZmllZEFjdGl2aXR5fSdgKTtcbiAgICAgIGxldCBmb3VuZEFjdCA9IChfLmluY2x1ZGVzKGFsbFBhY2thZ2VzLCBhcHBQYWNrYWdlKSAmJlxuICAgICAgICAgICAgICAgICAgICAgIF8uZmluZEluZGV4KHBvc3NpYmxlQWN0aXZpdHlQYXR0ZXJucywgKHBvc3NpYmxlUGF0dGVybikgPT4gcG9zc2libGVQYXR0ZXJuLnRlc3QoZnVsbHlRdWFsaWZpZWRBY3Rpdml0eSkpICE9PSAtMSk7XG4gICAgICBpZiAoKCF3YWl0Rm9yU3RvcCAmJiBmb3VuZEFjdCkgfHwgKHdhaXRGb3JTdG9wICYmICFmb3VuZEFjdCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICBsb2cuZGVidWcoJ0luY29ycmVjdCBwYWNrYWdlIGFuZCBhY3Rpdml0eS4gUmV0cnlpbmcuJyk7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke3Bvc3NpYmxlQWN0aXZpdHlOYW1lcy5tYXAoKG5hbWUpID0+IGAnJHtuYW1lfSdgKS5qb2luKCcgb3IgJyl9IG5ldmVyICR7d2FpdEZvclN0b3AgPyAnc3RvcHBlZCcgOiAnc3RhcnRlZCd9LiBgICtcbiAgICAgIGBWaXNpdCAke0FDVElWSVRJRVNfVFJPVUJMRVNIT09USU5HX0xJTkt9IGZvciB0cm91Ymxlc2hvb3RpbmdgKTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIFdhaXQgZm9yIHRoZSBnaXZlbiBhY3Rpdml0eSB0byBiZSBmb2N1c2VkXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHBrZyAtIFRoZSBuYW1lIG9mIHRoZSBwYWNrYWdlIHRvIHdhaXQgZm9yLlxuICogQHBhcmFtIHtzdHJpbmd9IGFjdGl2aXR5IC0gVGhlIG5hbWUgb2YgdGhlIGFjdGl2aXR5LCBiZWxvbmdpbmcgdG8gdGhhdCBwYWNrYWdlLFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgdG8gd2FpdCBmb3IuXG4gKiBAcGFyYW0ge251bWJlcn0gd2FpdE1zIFsyMDAwMF0gLSBOdW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIHdhaXQgYmVmb3JlIHRpbWVvdXQgb2NjdXJzLlxuICogQHRocm93cyB7ZXJyb3J9IElmIHRpbWVvdXQgaGFwcGVucy5cbiAqL1xuYXBrVXRpbHNNZXRob2RzLndhaXRGb3JBY3Rpdml0eSA9IGFzeW5jIGZ1bmN0aW9uIChwa2csIGFjdCwgd2FpdE1zID0gMjAwMDApIHtcbiAgYXdhaXQgdGhpcy53YWl0Rm9yQWN0aXZpdHlPck5vdChwa2csIGFjdCwgZmFsc2UsIHdhaXRNcyk7XG59O1xuXG4vKipcbiAqIFdhaXQgZm9yIHRoZSBnaXZlbiBhY3Rpdml0eSB0byBiZSBub24tZm9jdXNlZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGtnIC0gVGhlIG5hbWUgb2YgdGhlIHBhY2thZ2UgdG8gd2FpdCBmb3IuXG4gKiBAcGFyYW0ge3N0cmluZ30gYWN0aXZpdHkgLSBUaGUgbmFtZSBvZiB0aGUgYWN0aXZpdHksIGJlbG9uZ2luZyB0byB0aGF0IHBhY2thZ2UsXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0byB3YWl0IGZvci5cbiAqIEBwYXJhbSB7bnVtYmVyfSB3YWl0TXMgWzIwMDAwXSAtIE51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gd2FpdCBiZWZvcmUgdGltZW91dCBvY2N1cnMuXG4gKiBAdGhyb3dzIHtlcnJvcn0gSWYgdGltZW91dCBoYXBwZW5zLlxuICovXG5hcGtVdGlsc01ldGhvZHMud2FpdEZvck5vdEFjdGl2aXR5ID0gYXN5bmMgZnVuY3Rpb24gKHBrZywgYWN0LCB3YWl0TXMgPSAyMDAwMCkge1xuICBhd2FpdCB0aGlzLndhaXRGb3JBY3Rpdml0eU9yTm90KHBrZywgYWN0LCB0cnVlLCB3YWl0TXMpO1xufTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBVbmluc3RhbGxPcHRpb25zXG4gKiBAcHJvcGVydHkge251bWJlcn0gdGltZW91dCBbMjAwMDBdIC0gVGhlIGNvdW50IG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0IHVudGlsIHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcCBpcyB1bmluc3RhbGxlZC5cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0ga2VlcERhdGEgW2ZhbHNlXSAtIFNldCB0byB0cnVlIGluIG9yZGVyIHRvIGtlZXAgdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBsaWNhdGlvbiBkYXRhIGFuZCBjYWNoZSBmb2xkZXJzIGFmdGVyIHVuaW5zdGFsbC5cbiAqL1xuXG5jb25zdCBBUEtfVU5JTlNUQUxMX1RJTUVPVVQgPSAyMDAwMDtcblxuLyoqXG4gKiBVbmluc3RhbGwgdGhlIGdpdmVuIHBhY2thZ2UgZnJvbSB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHBrZyAtIFRoZSBuYW1lIG9mIHRoZSBwYWNrYWdlIHRvIGJlIHVuaW5zdGFsbGVkLlxuICogQHBhcmFtIHs/VW5pbnN0YWxsT3B0aW9uc30gb3B0aW9ucyAtIFRoZSBzZXQgb2YgdW5pbnN0YWxsYXRpb24gb3B0aW9ucy5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIHBhY2thZ2Ugd2FzIGZvdW5kIG9uIHRoZSBkZXZpY2UgYW5kXG4gKiAgICAgICAgICAgICAgICAgICBzdWNjZXNzZnVsbHkgdW5pbnN0YWxsZWQuXG4gKi9cbmFwa1V0aWxzTWV0aG9kcy51bmluc3RhbGxBcGsgPSBhc3luYyBmdW5jdGlvbiAocGtnLCBvcHRpb25zID0ge30pIHtcbiAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgIHRpbWVvdXQ6IEFQS19VTklOU1RBTExfVElNRU9VVFxuICB9LCBvcHRpb25zKTtcbiAgbG9nLmRlYnVnKGBVbmluc3RhbGxpbmcgJHtwa2d9YCk7XG4gIGlmICghYXdhaXQgdGhpcy5pc0FwcEluc3RhbGxlZChwa2cpKSB7XG4gICAgbG9nLmluZm8oYCR7cGtnfSB3YXMgbm90IHVuaW5zdGFsbGVkLCBiZWNhdXNlIGl0IHdhcyBub3QgcHJlc2VudCBvbiB0aGUgZGV2aWNlYCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3QgY21kID0gWyd1bmluc3RhbGwnXTtcbiAgaWYgKG9wdGlvbnMua2VlcERhdGEpIHtcbiAgICBjbWQucHVzaCgnLWsnKTtcbiAgfVxuICBjbWQucHVzaChwa2cpO1xuXG4gIGxldCBzdGRvdXQ7XG4gIHRyeSB7XG4gICAgYXdhaXQgdGhpcy5mb3JjZVN0b3AocGtnKTtcbiAgICBzdGRvdXQgPSAoYXdhaXQgdGhpcy5hZGJFeGVjKGNtZCwge3RpbWVvdXQ6IG9wdGlvbnMudGltZW91dH0pKS50cmltKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byB1bmluc3RhbGwgQVBLLiBPcmlnaW5hbCBlcnJvcjogJHtlLm1lc3NhZ2V9YCk7XG4gIH1cbiAgbG9nLmRlYnVnKGAnYWRiICR7Y21kLmpvaW4oJyAnKX0nIGNvbW1hbmQgb3V0cHV0OiAke3N0ZG91dH1gKTtcbiAgaWYgKHN0ZG91dC5pbmNsdWRlcyhcIlN1Y2Nlc3NcIikpIHtcbiAgICBsb2cuaW5mbyhgJHtwa2d9IHdhcyBzdWNjZXNzZnVsbHkgdW5pbnN0YWxsZWRgKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBsb2cuaW5mbyhgJHtwa2d9IHdhcyBub3QgdW5pbnN0YWxsZWRgKTtcbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBJbnN0YWxsIHRoZSBwYWNrYWdlIGFmdGVyIGl0IHdhcyBwdXNoZWQgdG8gdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBhcGtQYXRoT25EZXZpY2UgLSBUaGUgZnVsbCBwYXRoIHRvIHRoZSBwYWNrYWdlIG9uIHRoZSBkZXZpY2UgZmlsZSBzeXN0ZW0uXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0cyBbe31dIC0gQWRkaXRpb25hbCBleGVjIG9wdGlvbnMuIFNlZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2FwcGl1bS9ub2RlLXRlZW5fcHJvY2Vzc31cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgbW9yZSBkZXRhaWxzIG9uIHRoaXMgcGFyYW1ldGVyLlxuICogQHRocm93cyB7ZXJyb3J9IElmIHRoZXJlIHdhcyBhIGZhaWx1cmUgZHVyaW5nIGFwcGxpY2F0aW9uIGluc3RhbGwuXG4gKi9cbmFwa1V0aWxzTWV0aG9kcy5pbnN0YWxsRnJvbURldmljZVBhdGggPSBhc3luYyBmdW5jdGlvbiAoYXBrUGF0aE9uRGV2aWNlLCBvcHRzID0ge30pIHtcbiAgbGV0IHN0ZG91dCA9IGF3YWl0IHRoaXMuc2hlbGwoWydwbScsICdpbnN0YWxsJywgJy1yJywgYXBrUGF0aE9uRGV2aWNlXSwgb3B0cyk7XG4gIGlmIChzdGRvdXQuaW5kZXhPZihcIkZhaWx1cmVcIikgIT09IC0xKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBSZW1vdGUgaW5zdGFsbCBmYWlsZWQ6ICR7c3Rkb3V0fWApO1xuICB9XG59O1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEluc3RhbGxPcHRpb25zXG4gKiBAcHJvcGVydHkge251bWJlcn0gdGltZW91dCBbNjAwMDBdIC0gVGhlIGNvdW50IG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0IHVudGlsIHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcCBpcyBpbnN0YWxsZWQuXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IGFsbG93VGVzdFBhY2thZ2VzIFtmYWxzZV0gLSBTZXQgdG8gdHJ1ZSBpbiBvcmRlciB0byBhbGxvdyB0ZXN0XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWNrYWdlcyBpbnN0YWxsYXRpb24uXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IHVzZVNkY2FyZCBbZmFsc2VdIC0gU2V0IHRvIHRydWUgdG8gaW5zdGFsbCB0aGUgYXBwIG9uIHNkY2FyZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc3RlYWQgb2YgdGhlIGRldmljZSBtZW1vcnkuXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IGdyYW50UGVybWlzc2lvbnMgW2ZhbHNlXSAtIFNldCB0byB0cnVlIGluIG9yZGVyIHRvIGdyYW50IGFsbCB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVybWlzc2lvbnMgcmVxdWVzdGVkIGluIHRoZSBhcHBsaWNhdGlvbidzIG1hbmlmZXN0XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9tYXRpY2FsbHkgYWZ0ZXIgdGhlIGluc3RhbGxhdGlvbiBpcyBjb21wbGV0ZWRcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5kZXIgQW5kcm9pZCA2Ky5cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gcmVwbGFjZSBbdHJ1ZV0gLSBTZXQgaXQgdG8gZmFsc2UgaWYgeW91IGRvbid0IHdhbnRcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgYXBwbGljYXRpb24gdG8gYmUgdXBncmFkZWQvcmVpbnN0YWxsZWRcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBpdCBpcyBhbHJlYWR5IHByZXNlbnQgb24gdGhlIGRldmljZS5cbiAqL1xuXG4vKipcbiAqIEluc3RhbGwgdGhlIHBhY2thZ2UgZnJvbSB0aGUgbG9jYWwgZmlsZSBzeXN0ZW0uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGFwcFBhdGggLSBUaGUgZnVsbCBwYXRoIHRvIHRoZSBsb2NhbCBwYWNrYWdlLlxuICogQHBhcmFtIHs/SW5zdGFsbE9wdGlvbnN9IG9wdGlvbnMgLSBUaGUgc2V0IG9mIGluc3RhbGxhdGlvbiBvcHRpb25zLlxuICogQHRocm93cyB7RXJyb3J9IElmIGFuIHVuZXhwZWN0ZWQgZXJyb3IgaGFwcGVucyBkdXJpbmcgaW5zdGFsbC5cbiAqL1xuYXBrVXRpbHNNZXRob2RzLmluc3RhbGwgPSBhc3luYyBmdW5jdGlvbiAoYXBwUGF0aCwgb3B0aW9ucyA9IHt9KSB7XG4gIGlmIChhcHBQYXRoLmVuZHNXaXRoKEFQS1NfRVhURU5TSU9OKSkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmluc3RhbGxBcGtzKGFwcFBhdGgsIG9wdGlvbnMpO1xuICB9XG5cbiAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgIHJlcGxhY2U6IHRydWUsXG4gICAgdGltZW91dDogQVBLX0lOU1RBTExfVElNRU9VVCxcbiAgfSwgb3B0aW9ucyk7XG5cbiAgY29uc3QgaW5zdGFsbEFyZ3MgPSBidWlsZEluc3RhbGxBcmdzKGF3YWl0IHRoaXMuZ2V0QXBpTGV2ZWwoKSwgb3B0aW9ucyk7XG4gIHRyeSB7XG4gICAgY29uc3Qgb3V0cHV0ID0gYXdhaXQgdGhpcy5hZGJFeGVjKFsnaW5zdGFsbCcsIC4uLmluc3RhbGxBcmdzLCBhcHBQYXRoXSwge1xuICAgICAgdGltZW91dDogb3B0aW9ucy50aW1lb3V0LFxuICAgIH0pO1xuICAgIGNvbnN0IHRydW5jYXRlZE91dHB1dCA9ICghXy5pc1N0cmluZyhvdXRwdXQpIHx8IG91dHB1dC5sZW5ndGggPD0gMzAwKSA/XG4gICAgICBvdXRwdXQgOiBgJHtvdXRwdXQuc3Vic3RyKDAsIDE1MCl9Li4uJHtvdXRwdXQuc3Vic3RyKG91dHB1dC5sZW5ndGggLSAxNTApfWA7XG4gICAgbG9nLmRlYnVnKGBJbnN0YWxsIGNvbW1hbmQgc3Rkb3V0OiAke3RydW5jYXRlZE91dHB1dH1gKTtcbiAgICBpZiAoXy5pbmNsdWRlcyhvdXRwdXQsICdJTlNUQUxMX0ZBSUxFRCcpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3Iob3V0cHV0KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIC8vIG9uIHNvbWUgc3lzdGVtcyB0aGlzIHdpbGwgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIGFwcCBhbHJlYWR5XG4gICAgLy8gZXhpc3RzXG4gICAgaWYgKCFlcnIubWVzc2FnZS5pbmNsdWRlcygnSU5TVEFMTF9GQUlMRURfQUxSRUFEWV9FWElTVFMnKSkge1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgICBsb2cuZGVidWcoYEFwcGxpY2F0aW9uICcke2FwcFBhdGh9JyBhbHJlYWR5IGluc3RhbGxlZC4gQ29udGludWluZy5gKTtcbiAgfVxufTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBJbnN0YWxsT3JVcGdyYWRlT3B0aW9uc1xuICogQHByb3BlcnR5IHtudW1iZXJ9IHRpbWVvdXQgWzYwMDAwXSAtIFRoZSBjb3VudCBvZiBtaWxsaXNlY29uZHMgdG8gd2FpdCB1bnRpbCB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHAgaXMgaW5zdGFsbGVkLlxuICogQHByb3BlcnR5IHtib29sZWFufSBhbGxvd1Rlc3RQYWNrYWdlcyBbZmFsc2VdIC0gU2V0IHRvIHRydWUgaW4gb3JkZXIgdG8gYWxsb3cgdGVzdFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFja2FnZXMgaW5zdGFsbGF0aW9uLlxuICogQHByb3BlcnR5IHtib29sZWFufSB1c2VTZGNhcmQgW2ZhbHNlXSAtIFNldCB0byB0cnVlIHRvIGluc3RhbGwgdGhlIGFwcCBvbiBzZGNhcmRcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnN0ZWFkIG9mIHRoZSBkZXZpY2UgbWVtb3J5LlxuICogQHByb3BlcnR5IHtib29sZWFufSBncmFudFBlcm1pc3Npb25zIFtmYWxzZV0gLSBTZXQgdG8gdHJ1ZSBpbiBvcmRlciB0byBncmFudCBhbGwgdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlcm1pc3Npb25zIHJlcXVlc3RlZCBpbiB0aGUgYXBwbGljYXRpb24ncyBtYW5pZmVzdFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvbWF0aWNhbGx5IGFmdGVyIHRoZSBpbnN0YWxsYXRpb24gaXMgY29tcGxldGVkXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVyIEFuZHJvaWQgNisuXG4gKi9cblxuLyoqXG4gKiBJbnN0YWxsIHRoZSBwYWNrYWdlIGZyb20gdGhlIGxvY2FsIGZpbGUgc3lzdGVtIG9mIHVwZ3JhZGUgaXQgaWYgYW4gb2xkZXJcbiAqIHZlcnNpb24gb2YgdGhlIHNhbWUgcGFja2FnZSBpcyBhbHJlYWR5IGluc3RhbGxlZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gYXBwUGF0aCAtIFRoZSBmdWxsIHBhdGggdG8gdGhlIGxvY2FsIHBhY2thZ2UuXG4gKiBAcGFyYW0gez9zdHJpbmd9IHBrZyAtIFRoZSBuYW1lIG9mIHRoZSBpbnN0YWxsZWQgcGFja2FnZS4gVGhlIG1ldGhvZCB3aWxsXG4gKiAgICAgICAgICAgICAgICAgICAgICAgIHBlcmZvcm0gZmFzdGVyIGlmIGl0IGlzIHNldC5cbiAqIEBwYXJhbSB7P0luc3RhbGxPclVwZ3JhZGVPcHRpb25zfSBvcHRpb25zIC0gU2V0IG9mIGluc3RhbGwgb3B0aW9ucy5cbiAqIEB0aHJvd3Mge2Vycm9yfSBJZiBhbiB1bmV4cGVjdGVkIGVycm9yIGhhcHBlbnMgZHVyaW5nIGluc3RhbGwuXG4gKi9cbmFwa1V0aWxzTWV0aG9kcy5pbnN0YWxsT3JVcGdyYWRlID0gYXN5bmMgZnVuY3Rpb24gKGFwcFBhdGgsIHBrZyA9IG51bGwsIG9wdGlvbnMgPSB7fSkge1xuICBpZiAoIXV0aWwuaGFzVmFsdWUob3B0aW9ucy50aW1lb3V0KSkge1xuICAgIG9wdGlvbnMudGltZW91dCA9IEFQS19JTlNUQUxMX1RJTUVPVVQ7XG4gIH1cblxuICBsZXQgYXBrSW5mbyA9IG51bGw7XG4gIGlmICghcGtnKSB7XG4gICAgYXBrSW5mbyA9IGF3YWl0IHRoaXMuZ2V0QXBrSW5mbyhhcHBQYXRoKTtcbiAgICBwa2cgPSBhcGtJbmZvLm5hbWU7XG4gIH1cbiAgaWYgKCFwa2cpIHtcbiAgICBsb2cud2FybihgQ2Fubm90IHJlYWQgdGhlIHBhY2thZ2UgbmFtZSBvZiAke2FwcFBhdGh9LiBBc3N1bWluZyBjb3JyZWN0IGFwcCB2ZXJzaW9uIGlzIGFscmVhZHkgaW5zdGFsbGVkYCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKCFhd2FpdCB0aGlzLmlzQXBwSW5zdGFsbGVkKHBrZykpIHtcbiAgICBsb2cuZGVidWcoYEFwcCAnJHthcHBQYXRofScgbm90IGluc3RhbGxlZC4gSW5zdGFsbGluZ2ApO1xuICAgIGF3YWl0IHRoaXMuaW5zdGFsbChhcHBQYXRoLCBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7cmVwbGFjZTogZmFsc2V9KSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qge3ZlcnNpb25Db2RlOiBwa2dWZXJzaW9uQ29kZSwgdmVyc2lvbk5hbWU6IHBrZ1ZlcnNpb25OYW1lU3RyfSA9IGF3YWl0IHRoaXMuZ2V0UGFja2FnZUluZm8ocGtnKTtcbiAgY29uc3QgcGtnVmVyc2lvbk5hbWUgPSBzZW12ZXIudmFsaWQoc2VtdmVyLmNvZXJjZShwa2dWZXJzaW9uTmFtZVN0cikpO1xuICBpZiAoIWFwa0luZm8pIHtcbiAgICBhcGtJbmZvID0gYXdhaXQgdGhpcy5nZXRBcGtJbmZvKGFwcFBhdGgpO1xuICB9XG4gIGNvbnN0IHt2ZXJzaW9uQ29kZTogYXBrVmVyc2lvbkNvZGUsIHZlcnNpb25OYW1lOiBhcGtWZXJzaW9uTmFtZVN0cn0gPSBhcGtJbmZvO1xuICBjb25zdCBhcGtWZXJzaW9uTmFtZSA9IHNlbXZlci52YWxpZChzZW12ZXIuY29lcmNlKGFwa1ZlcnNpb25OYW1lU3RyKSk7XG5cbiAgaWYgKCFfLmlzSW50ZWdlcihhcGtWZXJzaW9uQ29kZSkgfHwgIV8uaXNJbnRlZ2VyKHBrZ1ZlcnNpb25Db2RlKSkge1xuICAgIGxvZy53YXJuKGBDYW5ub3QgcmVhZCB2ZXJzaW9uIGNvZGVzIG9mICcke2FwcFBhdGh9JyBhbmQvb3IgJyR7cGtnfSdgKTtcbiAgICBpZiAoIV8uaXNTdHJpbmcoYXBrVmVyc2lvbk5hbWUpIHx8ICFfLmlzU3RyaW5nKHBrZ1ZlcnNpb25OYW1lKSkge1xuICAgICAgbG9nLndhcm4oYENhbm5vdCByZWFkIHZlcnNpb24gbmFtZXMgb2YgJyR7YXBwUGF0aH0nIGFuZC9vciAnJHtwa2d9Jy4gQXNzdW1pbmcgY29ycmVjdCBhcHAgdmVyc2lvbiBpcyBhbHJlYWR5IGluc3RhbGxlZGApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuICBpZiAoXy5pc0ludGVnZXIoYXBrVmVyc2lvbkNvZGUpICYmIF8uaXNJbnRlZ2VyKHBrZ1ZlcnNpb25Db2RlKSkge1xuICAgIGlmIChwa2dWZXJzaW9uQ29kZSA+IGFwa1ZlcnNpb25Db2RlKSB7XG4gICAgICBsb2cuZGVidWcoYFRoZSBpbnN0YWxsZWQgJyR7cGtnfScgcGFja2FnZSBkb2VzIG5vdCByZXF1aXJlIHVwZ3JhZGUgKCR7cGtnVmVyc2lvbkNvZGV9ID4gJHthcGtWZXJzaW9uQ29kZX0pYCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIFZlcnNpb24gY29kZXMgbWlnaHQgbm90IGJlIG1haW50YWluZWQuIENoZWNrIHZlcnNpb24gbmFtZXMuXG4gICAgaWYgKHBrZ1ZlcnNpb25Db2RlID09PSBhcGtWZXJzaW9uQ29kZSkge1xuICAgICAgaWYgKF8uaXNTdHJpbmcoYXBrVmVyc2lvbk5hbWUpICYmIF8uaXNTdHJpbmcocGtnVmVyc2lvbk5hbWUpICYmIHNlbXZlci5zYXRpc2ZpZXMocGtnVmVyc2lvbk5hbWUsIGA+PSR7YXBrVmVyc2lvbk5hbWV9YCkpIHtcbiAgICAgICAgbG9nLmRlYnVnKGBUaGUgaW5zdGFsbGVkICcke3BrZ30nIHBhY2thZ2UgZG9lcyBub3QgcmVxdWlyZSB1cGdyYWRlICgnJHtwa2dWZXJzaW9uTmFtZX0nID49ICcke2Fwa1ZlcnNpb25OYW1lfScpYCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICghXy5pc1N0cmluZyhhcGtWZXJzaW9uTmFtZSkgfHwgIV8uaXNTdHJpbmcocGtnVmVyc2lvbk5hbWUpKSB7XG4gICAgICAgIGxvZy5kZWJ1ZyhgVGhlIGluc3RhbGxlZCAnJHtwa2d9JyBwYWNrYWdlIGRvZXMgbm90IHJlcXVpcmUgdXBncmFkZSAoJHtwa2dWZXJzaW9uQ29kZX0gPT09ICR7YXBrVmVyc2lvbkNvZGV9KWApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKF8uaXNTdHJpbmcoYXBrVmVyc2lvbk5hbWUpICYmIF8uaXNTdHJpbmcocGtnVmVyc2lvbk5hbWUpICYmIHNlbXZlci5zYXRpc2ZpZXMocGtnVmVyc2lvbk5hbWUsIGA+PSR7YXBrVmVyc2lvbk5hbWV9YCkpIHtcbiAgICBsb2cuZGVidWcoYFRoZSBpbnN0YWxsZWQgJyR7cGtnfScgcGFja2FnZSBkb2VzIG5vdCByZXF1aXJlIHVwZ3JhZGUgKCcke3BrZ1ZlcnNpb25OYW1lfScgPj0gJyR7YXBrVmVyc2lvbk5hbWV9JylgKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBsb2cuZGVidWcoYFRoZSBpbnN0YWxsZWQgJyR7cGtnfScgcGFja2FnZSBpcyBvbGRlciB0aGFuICcke2FwcFBhdGh9JyBgICtcbiAgICAgICAgICAgIGAoJHtwa2dWZXJzaW9uQ29kZX0gPCAke2Fwa1ZlcnNpb25Db2RlfSBvciAnJHtwa2dWZXJzaW9uTmFtZX0nIDwgJyR7YXBrVmVyc2lvbk5hbWV9JyknLiBgICtcbiAgICAgICAgICAgIGBFeGVjdXRpbmcgdXBncmFkZWApO1xuICB0cnkge1xuICAgIGF3YWl0IHRoaXMuaW5zdGFsbChhcHBQYXRoLCBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7cmVwbGFjZTogdHJ1ZX0pKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgbG9nLndhcm4oYENhbm5vdCB1cGdyYWRlICcke3BrZ30nIGJlY2F1c2Ugb2YgJyR7ZXJyLm1lc3NhZ2V9Jy4gVHJ5aW5nIGZ1bGwgcmVpbnN0YWxsYCk7XG4gICAgaWYgKCFhd2FpdCB0aGlzLnVuaW5zdGFsbEFwayhwa2cpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCcke3BrZ30nIHBhY2thZ2UgY2Fubm90IGJlIHVuaW5zdGFsbGVkYCk7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuaW5zdGFsbChhcHBQYXRoLCBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7cmVwbGFjZTogZmFsc2V9KSk7XG4gIH1cbn07XG5cbi8qKlxuICogRXh0cmFjdCBzdHJpbmcgcmVzb3VyY2VzIGZyb20gdGhlIGdpdmVuIHBhY2thZ2Ugb24gbG9jYWwgZmlsZSBzeXN0ZW0uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGFwcFBhdGggLSBUaGUgZnVsbCBwYXRoIHRvIHRoZSAuYXBrKHMpIHBhY2thZ2UuXG4gKiBAcGFyYW0gez9zdHJpbmd9IGxhbmd1YWdlIC0gVGhlIG5hbWUgb2YgdGhlIGxhbmd1YWdlIHRvIGV4dHJhY3QgdGhlIHJlc291cmNlcyBmb3IuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVGhlIGRlZmF1bHQgbGFuZ3VhZ2UgaXMgdXNlZCBpZiB0aGlzIGVxdWFscyB0byBgbnVsbGAvYHVuZGVmaW5lZGBcbiAqIEBwYXJhbSB7c3RyaW5nfSBvdXQgLSBUaGUgbmFtZSBvZiB0aGUgZGVzdGluYXRpb24gZm9sZGVyIG9uIHRoZSBsb2NhbCBmaWxlIHN5c3RlbSB0b1xuICogICAgICAgICAgICAgICAgICAgICAgIHN0b3JlIHRoZSBleHRyYWN0ZWQgZmlsZSB0by5cbiAqIEByZXR1cm4ge09iamVjdH0gQSBtYXBwaW5nIG9iamVjdCwgd2hlcmUgcHJvcGVydGllcyBhcmU6ICdhcGtTdHJpbmdzJywgY29udGFpbmluZ1xuICogICAgICAgICAgICAgICAgICBwYXJzZWQgcmVzb3VyY2UgZmlsZSByZXByZXNlbnRlZCBhcyBKU09OIG9iamVjdCwgYW5kICdsb2NhbFBhdGgnLFxuICogICAgICAgICAgICAgICAgICBjb250YWluaW5nIHRoZSBwYXRoIHRvIHRoZSBleHRyYWN0ZWQgZmlsZSBvbiB0aGUgbG9jYWwgZmlsZSBzeXN0ZW0uXG4gKi9cbmFwa1V0aWxzTWV0aG9kcy5leHRyYWN0U3RyaW5nc0Zyb21BcGsgPSBhc3luYyBmdW5jdGlvbiAoYXBwUGF0aCwgbGFuZ3VhZ2UsIG91dCkge1xuICBsb2cuZGVidWcoYEV4dHJhY3Rpbmcgc3RyaW5ncyBmcm9tIGZvciBsYW5ndWFnZTogJHtsYW5ndWFnZSB8fCAnZGVmYXVsdCd9YCk7XG4gIGlmIChhcHBQYXRoLmVuZHNXaXRoKEFQS1NfRVhURU5TSU9OKSkge1xuICAgIGFwcFBhdGggPSBhd2FpdCB0aGlzLmV4dHJhY3RMYW5ndWFnZUFwayhhcHBQYXRoLCBsYW5ndWFnZSk7XG4gIH1cbiAgYXdhaXQgdGhpcy5pbml0QWFwdCgpO1xuICBsZXQgcmF3QWFwdE91dHB1dDtcbiAgdHJ5IHtcbiAgICBjb25zdCB7c3Rkb3V0fSA9IGF3YWl0IGV4ZWModGhpcy5iaW5hcmllcy5hYXB0LCBbXG4gICAgICAnZCcsXG4gICAgICAnLS12YWx1ZXMnLFxuICAgICAgJ3Jlc291cmNlcycsXG4gICAgICBhcHBQYXRoLFxuICAgIF0pO1xuICAgIHJhd0FhcHRPdXRwdXQgPSBzdGRvdXQ7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBleHRyYWN0IHJlc291cmNlcyBmcm9tICcke2FwcFBhdGh9Jy4gT3JpZ2luYWwgZXJyb3I6ICR7ZS5tZXNzYWdlfWApO1xuICB9XG5cbiAgY29uc3QgZGVmYXVsdENvbmZpZ01hcmtlciA9ICcoZGVmYXVsdCknO1xuICBsZXQgY29uZmlnTWFya2VyID0gbGFuZ3VhZ2UgfHwgZGVmYXVsdENvbmZpZ01hcmtlcjtcbiAgaWYgKGNvbmZpZ01hcmtlci5pbmNsdWRlcygnLScpICYmICFjb25maWdNYXJrZXIuaW5jbHVkZXMoJy1yJykpIHtcbiAgICBjb25maWdNYXJrZXIgPSBjb25maWdNYXJrZXIucmVwbGFjZSgnLScsICctcicpO1xuICB9XG4gIGlmIChjb25maWdNYXJrZXIudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdlbicpKSB7XG4gICAgLy8gQXNzdW1lIHRoZSAnZW4nIGNvbmZpZ3VyYXRpb24gaXMgdGhlIGRlZmF1bHQgb25lXG4gICAgY29uc3Qge3N0ZG91dH0gPSBhd2FpdCBleGVjKHRoaXMuYmluYXJpZXMuYWFwdCwgW1xuICAgICAgJ2QnLFxuICAgICAgJ2NvbmZpZ3VyYXRpb25zJyxcbiAgICAgIGFwcFBhdGgsXG4gICAgXSk7XG4gICAgY29uc3QgY29uZmlncyA9IHN0ZG91dC5zcGxpdChvcy5FT0wpO1xuICAgIGlmICghY29uZmlncy5pbmNsdWRlcyhjb25maWdNYXJrZXIpKSB7XG4gICAgICBsb2cuZGVidWcoYFRoZXJlIGlzIG5vICcke2NvbmZpZ01hcmtlcn0nIGNvbmZpZ3VyYXRpb24uIGAgK1xuICAgICAgICAgICAgICAgIGBSZXBsYWNpbmcgaXQgd2l0aCAnJHtkZWZhdWx0Q29uZmlnTWFya2VyfSdgKTtcbiAgICAgIGNvbmZpZ01hcmtlciA9IGRlZmF1bHRDb25maWdNYXJrZXI7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgYXBrU3RyaW5ncyA9IHt9O1xuICBsZXQgaXNJbkNvbmZpZyA9IGZhbHNlO1xuICBsZXQgY3VycmVudFJlc291cmNlSWQgPSBudWxsO1xuICBsZXQgaXNJblBsdXJhbEdyb3VwID0gZmFsc2U7XG4gIGNvbnN0IHN0YXJ0c1dpdGhBbnkgPSAocywgYXJyKSA9PiBhcnIucmVkdWNlKChhY2MsIHgpID0+IGFjYyB8fCBzLnN0YXJ0c1dpdGgoeCksIGZhbHNlKTtcbiAgY29uc3Qgbm9ybWFsaXplU3RyaW5nTWF0Y2ggPSAocykgPT4gcy5yZXBsYWNlKC9cIiQvLCAnJykucmVwbGFjZSgvXlwiLywgJycpLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKTtcbiAgZm9yIChjb25zdCBsaW5lIG9mIHJhd0FhcHRPdXRwdXQuc3BsaXQob3MuRU9MKSkge1xuICAgIGNvbnN0IHRyaW1tZWRMaW5lID0gbGluZS50cmltKCk7XG4gICAgaWYgKF8uaXNFbXB0eSh0cmltbWVkTGluZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChzdGFydHNXaXRoQW55KHRyaW1tZWRMaW5lLCBbJ2NvbmZpZycsICd0eXBlJywgJ3NwZWMnLCAnUGFja2FnZSddKSkge1xuICAgICAgaXNJbkNvbmZpZyA9IHRyaW1tZWRMaW5lLnN0YXJ0c1dpdGgoYGNvbmZpZyAke2NvbmZpZ01hcmtlcn06YCk7XG4gICAgICBjdXJyZW50UmVzb3VyY2VJZCA9IG51bGw7XG4gICAgICBpc0luUGx1cmFsR3JvdXAgPSBmYWxzZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICghaXNJbkNvbmZpZykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKHRyaW1tZWRMaW5lLnN0YXJ0c1dpdGgoJ3Jlc291cmNlJykpIHtcbiAgICAgIGlzSW5QbHVyYWxHcm91cCA9IGZhbHNlO1xuICAgICAgY3VycmVudFJlc291cmNlSWQgPSBudWxsO1xuXG4gICAgICBpZiAodHJpbW1lZExpbmUuaW5jbHVkZXMoJzpzdHJpbmcvJykpIHtcbiAgICAgICAgY29uc3QgbWF0Y2ggPSAvOnN0cmluZ1xcLyhcXFMrKTovLmV4ZWModHJpbW1lZExpbmUpO1xuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICBjdXJyZW50UmVzb3VyY2VJZCA9IG1hdGNoWzFdO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRyaW1tZWRMaW5lLmluY2x1ZGVzKCc6cGx1cmFscy8nKSkge1xuICAgICAgICBjb25zdCBtYXRjaCA9IC86cGx1cmFsc1xcLyhcXFMrKTovLmV4ZWModHJpbW1lZExpbmUpO1xuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICBjdXJyZW50UmVzb3VyY2VJZCA9IG1hdGNoWzFdO1xuICAgICAgICAgIGlzSW5QbHVyYWxHcm91cCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50UmVzb3VyY2VJZCAmJiB0cmltbWVkTGluZS5zdGFydHNXaXRoKCcoc3RyaW5nJykpIHtcbiAgICAgIGNvbnN0IG1hdGNoID0gL1wiW15cIlxcXFxdKig/OlxcXFwuW15cIlxcXFxdKikqXCIvLmV4ZWModHJpbW1lZExpbmUpO1xuICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIGFwa1N0cmluZ3NbY3VycmVudFJlc291cmNlSWRdID0gbm9ybWFsaXplU3RyaW5nTWF0Y2gobWF0Y2hbMF0pO1xuICAgICAgfVxuICAgICAgY3VycmVudFJlc291cmNlSWQgPSBudWxsO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRSZXNvdXJjZUlkICYmIGlzSW5QbHVyYWxHcm91cCAmJiB0cmltbWVkTGluZS5pbmNsdWRlcygnOiAoc3RyaW5nJykpIHtcbiAgICAgIGNvbnN0IG1hdGNoID0gL1wiW15cIlxcXFxdKig/OlxcXFwuW15cIlxcXFxdKikqXCIvLmV4ZWModHJpbW1lZExpbmUpO1xuICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIGFwa1N0cmluZ3NbY3VycmVudFJlc291cmNlSWRdID0gW1xuICAgICAgICAgIC4uLihhcGtTdHJpbmdzW2N1cnJlbnRSZXNvdXJjZUlkXSB8fCBbXSksXG4gICAgICAgICAgbm9ybWFsaXplU3RyaW5nTWF0Y2gobWF0Y2hbMF0pLFxuICAgICAgICBdO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKF8uaXNFbXB0eShhcGtTdHJpbmdzKSkge1xuICAgIGxvZy53YXJuKGBObyBzdHJpbmdzIGhhdmUgYmVlbiBmb3VuZCBpbiAnJHthcHBQYXRofScgcmVzb3VyY2VzIGAgK1xuICAgICAgICAgICAgIGBmb3IgJyR7Y29uZmlnTWFya2VyfScgY29uZmlndXJhdGlvbmApO1xuICB9IGVsc2Uge1xuICAgIGxvZy5pbmZvKGBTdWNjZXNzZnVsbHkgZXh0cmFjdGVkICR7Xy5rZXlzKGFwa1N0cmluZ3MpLmxlbmd0aH0gc3RyaW5ncyBmcm9tICcke2FwcFBhdGh9JyByZXNvdXJjZXMgYCArXG4gICAgICAgICAgICAgYGZvciAnJHtjb25maWdNYXJrZXJ9JyBjb25maWd1cmF0aW9uYCk7XG4gIH1cblxuICBjb25zdCBsb2NhbFBhdGggPSBwYXRoLnJlc29sdmUob3V0LCAnc3RyaW5ncy5qc29uJyk7XG4gIGF3YWl0IG1rZGlycChvdXQpO1xuICBhd2FpdCBmcy53cml0ZUZpbGUobG9jYWxQYXRoLCBKU09OLnN0cmluZ2lmeShhcGtTdHJpbmdzLCBudWxsLCAyKSwgJ3V0Zi04Jyk7XG4gIHJldHVybiB7YXBrU3RyaW5ncywgbG9jYWxQYXRofTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBsYW5ndWFnZSBuYW1lIG9mIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBuYW1lIG9mIGRldmljZSBsYW5ndWFnZS5cbiAqL1xuYXBrVXRpbHNNZXRob2RzLmdldERldmljZUxhbmd1YWdlID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICBsZXQgbGFuZ3VhZ2U7XG4gIGlmIChhd2FpdCB0aGlzLmdldEFwaUxldmVsKCkgPCAyMykge1xuICAgIGxhbmd1YWdlID0gYXdhaXQgdGhpcy5nZXREZXZpY2VTeXNMYW5ndWFnZSgpO1xuICAgIGlmICghbGFuZ3VhZ2UpIHtcbiAgICAgIGxhbmd1YWdlID0gYXdhaXQgdGhpcy5nZXREZXZpY2VQcm9kdWN0TGFuZ3VhZ2UoKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbGFuZ3VhZ2UgPSAoYXdhaXQgdGhpcy5nZXREZXZpY2VMb2NhbGUoKSkuc3BsaXQoXCItXCIpWzBdO1xuICB9XG4gIHJldHVybiBsYW5ndWFnZTtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBsYW5ndWFnZSBuYW1lIG9mIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2UgLSBUaGUgbmFtZSBvZiB0aGUgbmV3IGRldmljZSBsYW5ndWFnZS5cbiAqL1xuYXBrVXRpbHNNZXRob2RzLnNldERldmljZUxhbmd1YWdlID0gYXN5bmMgZnVuY3Rpb24gKGxhbmd1YWdlKSB7XG4gIC8vIHRoaXMgbWV0aG9kIGlzIG9ubHkgdXNlZCBpbiBBUEkgPCAyM1xuICBhd2FpdCB0aGlzLnNldERldmljZVN5c0xhbmd1YWdlKGxhbmd1YWdlKTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBjb3VudHJ5IG5hbWUgb2YgdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEByZXR1cm4ge3N0cmluZ30gVGhlIG5hbWUgb2YgZGV2aWNlIGNvdW50cnkuXG4gKi9cbmFwa1V0aWxzTWV0aG9kcy5nZXREZXZpY2VDb3VudHJ5ID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICAvLyB0aGlzIG1ldGhvZCBpcyBvbmx5IHVzZWQgaW4gQVBJIDwgMjNcbiAgbGV0IGNvdW50cnkgPSBhd2FpdCB0aGlzLmdldERldmljZVN5c0NvdW50cnkoKTtcbiAgaWYgKCFjb3VudHJ5KSB7XG4gICAgY291bnRyeSA9IGF3YWl0IHRoaXMuZ2V0RGV2aWNlUHJvZHVjdENvdW50cnkoKTtcbiAgfVxuICByZXR1cm4gY291bnRyeTtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBjb3VudHJ5IG5hbWUgb2YgdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBjb3VudHJ5IC0gVGhlIG5hbWUgb2YgdGhlIG5ldyBkZXZpY2UgY291bnRyeS5cbiAqL1xuYXBrVXRpbHNNZXRob2RzLnNldERldmljZUNvdW50cnkgPSBhc3luYyBmdW5jdGlvbiAoY291bnRyeSkge1xuICAvLyB0aGlzIG1ldGhvZCBpcyBvbmx5IHVzZWQgaW4gQVBJIDwgMjNcbiAgYXdhaXQgdGhpcy5zZXREZXZpY2VTeXNDb3VudHJ5KGNvdW50cnkpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGxvY2FsZSBuYW1lIG9mIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBuYW1lIG9mIGRldmljZSBsb2NhbGUuXG4gKi9cbmFwa1V0aWxzTWV0aG9kcy5nZXREZXZpY2VMb2NhbGUgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gIC8vIHRoaXMgbWV0aG9kIGlzIG9ubHkgdXNlZCBpbiBBUEkgPj0gMjNcbiAgbGV0IGxvY2FsZSA9IGF3YWl0IHRoaXMuZ2V0RGV2aWNlU3lzTG9jYWxlKCk7XG4gIGlmICghbG9jYWxlKSB7XG4gICAgbG9jYWxlID0gYXdhaXQgdGhpcy5nZXREZXZpY2VQcm9kdWN0TG9jYWxlKCk7XG4gIH1cbiAgcmV0dXJuIGxvY2FsZTtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBsb2NhbGUgbmFtZSBvZiB0aGUgZGV2aWNlIHVuZGVyIHRlc3QgYW5kIHRoZSBmb3JtYXQgb2YgdGhlIGxvY2FsZSBpcyBlbi1VUywgZm9yIGV4YW1wbGUuXG4gKiBUaGlzIG1ldGhvZCBjYWxsIHNldERldmljZUxhbmd1YWdlQ291bnRyeSwgc28sIHBsZWFzZSB1c2Ugc2V0RGV2aWNlTGFuZ3VhZ2VDb3VudHJ5IGFzIHBvc3NpYmxlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBsb2NhbGUgLSBOYW1lcyBvZiB0aGUgZGV2aWNlIGxhbmd1YWdlIGFuZCB0aGUgY291bnRyeSBjb25uZWN0ZWQgd2l0aCBgLWAuIGUuZy4gZW4tVVMuXG4gKi9cbmFwa1V0aWxzTWV0aG9kcy5zZXREZXZpY2VMb2NhbGUgPSBhc3luYyBmdW5jdGlvbiAobG9jYWxlKSB7XG4gIGNvbnN0IHZhbGlkYXRlTG9jYWxlID0gbmV3IFJlZ0V4cCgvW2EtekEtWl0rLVthLXpBLVowLTldKy8pO1xuICBpZiAoIXZhbGlkYXRlTG9jYWxlLnRlc3QobG9jYWxlKSkge1xuICAgIGxvZy53YXJuKGBzZXREZXZpY2VMb2NhbGUgcmVxdWlyZXMgdGhlIGZvbGxvd2luZyBmb3JtYXQ6IGVuLVVTIG9yIGphLUpQYCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgbGV0IHNwbGl0X2xvY2FsZSA9IGxvY2FsZS5zcGxpdChcIi1cIik7XG4gIGF3YWl0IHRoaXMuc2V0RGV2aWNlTGFuZ3VhZ2VDb3VudHJ5KHNwbGl0X2xvY2FsZVswXSwgc3BsaXRfbG9jYWxlWzFdKTtcbn07XG5cbi8qKlxuICogTWFrZSBzdXJlIGN1cnJlbnQgZGV2aWNlIGxvY2FsZSBpcyBleHBlY3RlZCBvciBub3QuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGxhbmd1YWdlIC0gTGFuZ3VhZ2UuIFRoZSBsYW5ndWFnZSBmaWVsZCBpcyBjYXNlIGluc2Vuc2l0aXZlLCBidXQgTG9jYWxlIGFsd2F5cyBjYW5vbmljYWxpemVzIHRvIGxvd2VyIGNhc2UuXG4gKiBAcGFyYW0ge3N0cmluZ30gY291bnRyeSAtIENvdW50cnkuIFRoZSBsYW5ndWFnZSBmaWVsZCBpcyBjYXNlIGluc2Vuc2l0aXZlLCBidXQgTG9jYWxlIGFsd2F5cyBjYW5vbmljYWxpemVzIHRvIGxvd2VyIGNhc2UuXG4gKiBAcGFyYW0gez9zdHJpbmd9IHNjcmlwdCAtIFNjcmlwdC4gVGhlIHNjcmlwdCBmaWVsZCBpcyBjYXNlIGluc2Vuc2l0aXZlIGJ1dCBMb2NhbGUgYWx3YXlzIGNhbm9uaWNhbGl6ZXMgdG8gdGl0bGUgY2FzZS5cbiAqXG4gKiBAcmV0dXJuIHtib29sZWFufSBJZiBjdXJyZW50IGxvY2FsZSBpcyBsYW5ndWFnZSBhbmQgY291bnRyeSBhcyBhcmd1bWVudHMsIHJldHVybiB0cnVlLlxuICovXG5hcGtVdGlsc01ldGhvZHMuZW5zdXJlQ3VycmVudExvY2FsZSA9IGFzeW5jIGZ1bmN0aW9uIChsYW5ndWFnZSwgY291bnRyeSwgc2NyaXB0ID0gbnVsbCkge1xuICBjb25zdCBoYXNMYW5ndWFnZSA9IF8uaXNTdHJpbmcobGFuZ3VhZ2UpO1xuICBjb25zdCBoYXNDb3VudHJ5ID0gXy5pc1N0cmluZyhjb3VudHJ5KTtcblxuICBpZiAoIWhhc0xhbmd1YWdlICYmICFoYXNDb3VudHJ5KSB7XG4gICAgbG9nLndhcm4oJ2Vuc3VyZUN1cnJlbnRMb2NhbGUgcmVxdWlyZXMgbGFuZ3VhZ2Ugb3IgY291bnRyeScpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIGdldCBsb3dlciBjYXNlIHZlcnNpb25zIG9mIHRoZSBzdHJpbmdzXG4gIGxhbmd1YWdlID0gKGxhbmd1YWdlIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xuICBjb3VudHJ5ID0gKGNvdW50cnkgfHwgJycpLnRvTG93ZXJDYXNlKCk7XG5cbiAgY29uc3QgYXBpTGV2ZWwgPSBhd2FpdCB0aGlzLmdldEFwaUxldmVsKCk7XG5cbiAgcmV0dXJuIGF3YWl0IHJldHJ5SW50ZXJ2YWwoNSwgMTAwMCwgYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAoYXBpTGV2ZWwgPCAyMykge1xuICAgICAgICBsZXQgY3VyTGFuZ3VhZ2UsIGN1ckNvdW50cnk7XG4gICAgICAgIGlmIChoYXNMYW5ndWFnZSkge1xuICAgICAgICAgIGN1ckxhbmd1YWdlID0gKGF3YWl0IHRoaXMuZ2V0RGV2aWNlTGFuZ3VhZ2UoKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICBpZiAoIWhhc0NvdW50cnkgJiYgbGFuZ3VhZ2UgPT09IGN1ckxhbmd1YWdlKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhhc0NvdW50cnkpIHtcbiAgICAgICAgICBjdXJDb3VudHJ5ID0gKGF3YWl0IHRoaXMuZ2V0RGV2aWNlQ291bnRyeSgpKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgIGlmICghaGFzTGFuZ3VhZ2UgJiYgY291bnRyeSA9PT0gY3VyQ291bnRyeSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChsYW5ndWFnZSA9PT0gY3VyTGFuZ3VhZ2UgJiYgY291bnRyeSA9PT0gY3VyQ291bnRyeSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjdXJMb2NhbGUgPSAoYXdhaXQgdGhpcy5nZXREZXZpY2VMb2NhbGUoKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgLy8gemgtaGFucy1jbiA6IHpoLWNuXG4gICAgICAgIGNvbnN0IGxvY2FsZUNvZGUgPSBzY3JpcHQgPyBgJHtsYW5ndWFnZX0tJHtzY3JpcHQudG9Mb3dlckNhc2UoKX0tJHtjb3VudHJ5fWAgOiBgJHtsYW5ndWFnZX0tJHtjb3VudHJ5fWA7XG5cbiAgICAgICAgaWYgKGxvY2FsZUNvZGUgPT09IGN1ckxvY2FsZSkge1xuICAgICAgICAgIGxvZy5kZWJ1ZyhgUmVxdWVzdGVkIGxvY2FsZSBpcyBlcXVhbCB0byBjdXJyZW50IGxvY2FsZTogJyR7Y3VyTG9jYWxlfSdgKTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgLy8gaWYgdGhlcmUgaGFzIGJlZW4gYW4gZXJyb3IsIHJlc3RhcnQgYWRiIGFuZCByZXRyeVxuICAgICAgbG9nLmVycm9yKGBVbmFibGUgdG8gY2hlY2sgZGV2aWNlIGxvY2FsaXphdGlvbjogJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgIGxvZy5kZWJ1ZygnUmVzdGFydGluZyBBREIgYW5kIHJldHJ5aW5nLi4uJyk7XG4gICAgICBhd2FpdCB0aGlzLnJlc3RhcnRBZGIoKTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH0pO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIGxvY2FsZSBuYW1lIG9mIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2UgLSBMYW5ndWFnZS4gVGhlIGxhbmd1YWdlIGZpZWxkIGlzIGNhc2UgaW5zZW5zaXRpdmUsIGJ1dCBMb2NhbGUgYWx3YXlzIGNhbm9uaWNhbGl6ZXMgdG8gbG93ZXIgY2FzZS5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdDogW2EtekEtWl17Miw4fS4gZS5nLiBlbiwgamEgOiBodHRwczovL2RldmVsb3Blci5hbmRyb2lkLmNvbS9yZWZlcmVuY2UvamF2YS91dGlsL0xvY2FsZS5odG1sXG4gKiBAcGFyYW0ge3N0cmluZ30gY291bnRyeSAtIENvdW50cnkuIFRoZSBjb3VudHJ5IChyZWdpb24pIGZpZWxkIGlzIGNhc2UgaW5zZW5zaXRpdmUsIGJ1dCBMb2NhbGUgYWx3YXlzIGNhbm9uaWNhbGl6ZXMgdG8gdXBwZXIgY2FzZS5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdDogW2EtekEtWl17Mn0gfCBbMC05XXszfS4gZS5nLiBVUywgSlAgOiBodHRwczovL2RldmVsb3Blci5hbmRyb2lkLmNvbS9yZWZlcmVuY2UvamF2YS91dGlsL0xvY2FsZS5odG1sXG4gKiBAcGFyYW0gez9zdHJpbmd9IHNjcmlwdCAtIFNjcmlwdC4gVGhlIHNjcmlwdCBmaWVsZCBpcyBjYXNlIGluc2Vuc2l0aXZlIGJ1dCBMb2NhbGUgYWx3YXlzIGNhbm9uaWNhbGl6ZXMgdG8gdGl0bGUgY2FzZS5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdDogW2EtekEtWl17NH0uIGUuZy4gSGFucyBpbiB6aC1IYW5zLUNOIDogaHR0cHM6Ly9kZXZlbG9wZXIuYW5kcm9pZC5jb20vcmVmZXJlbmNlL2phdmEvdXRpbC9Mb2NhbGUuaHRtbFxuICovXG5hcGtVdGlsc01ldGhvZHMuc2V0RGV2aWNlTGFuZ3VhZ2VDb3VudHJ5ID0gYXN5bmMgZnVuY3Rpb24gKGxhbmd1YWdlLCBjb3VudHJ5LCBzY3JpcHQgPSBudWxsKSB7XG4gIGxldCBoYXNMYW5ndWFnZSA9IGxhbmd1YWdlICYmIF8uaXNTdHJpbmcobGFuZ3VhZ2UpO1xuICBsZXQgaGFzQ291bnRyeSA9IGNvdW50cnkgJiYgXy5pc1N0cmluZyhjb3VudHJ5KTtcbiAgaWYgKCFoYXNMYW5ndWFnZSAmJiAhaGFzQ291bnRyeSkge1xuICAgIGxvZy53YXJuKGBzZXREZXZpY2VMYW5ndWFnZUNvdW50cnkgcmVxdWlyZXMgbGFuZ3VhZ2Ugb3IgY291bnRyeS5gKTtcbiAgICBsb2cud2FybihgR290IGxhbmd1YWdlOiAnJHtsYW5ndWFnZX0nIGFuZCBjb3VudHJ5OiAnJHtjb3VudHJ5fSdgKTtcbiAgICByZXR1cm47XG4gIH1cbiAgbGV0IHdhc1NldHRpbmdDaGFuZ2VkID0gZmFsc2U7XG4gIGxldCBhcGlMZXZlbCA9IGF3YWl0IHRoaXMuZ2V0QXBpTGV2ZWwoKTtcblxuICBsYW5ndWFnZSA9IChsYW5ndWFnZSB8fCAnJykudG9Mb3dlckNhc2UoKTtcbiAgY291bnRyeSA9IChjb3VudHJ5IHx8ICcnKS50b1VwcGVyQ2FzZSgpO1xuXG4gIGlmIChhcGlMZXZlbCA8IDIzKSB7XG4gICAgbGV0IGN1ckxhbmd1YWdlID0gKGF3YWl0IHRoaXMuZ2V0RGV2aWNlTGFuZ3VhZ2UoKSkudG9Mb3dlckNhc2UoKTtcbiAgICBsZXQgY3VyQ291bnRyeSA9IChhd2FpdCB0aGlzLmdldERldmljZUNvdW50cnkoKSkudG9VcHBlckNhc2UoKTtcbiAgICBpZiAoaGFzTGFuZ3VhZ2UgJiYgbGFuZ3VhZ2UgIT09IGN1ckxhbmd1YWdlKSB7XG4gICAgICBhd2FpdCB0aGlzLnNldERldmljZUxhbmd1YWdlKGxhbmd1YWdlKTtcbiAgICAgIHdhc1NldHRpbmdDaGFuZ2VkID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGhhc0NvdW50cnkgJiYgY291bnRyeSAhPT0gY3VyQ291bnRyeSkge1xuICAgICAgYXdhaXQgdGhpcy5zZXREZXZpY2VDb3VudHJ5KGNvdW50cnkpO1xuICAgICAgd2FzU2V0dGluZ0NoYW5nZWQgPSB0cnVlO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBsZXQgY3VyTG9jYWxlID0gYXdhaXQgdGhpcy5nZXREZXZpY2VMb2NhbGUoKTtcblxuICAgIGlmIChhcGlMZXZlbCA9PT0gMjMpIHtcbiAgICAgIGxldCBsb2NhbGU7XG4gICAgICBpZiAoIWhhc0NvdW50cnkpIHtcbiAgICAgICAgbG9jYWxlID0gbGFuZ3VhZ2U7XG4gICAgICB9IGVsc2UgaWYgKCFoYXNMYW5ndWFnZSkge1xuICAgICAgICBsb2NhbGUgPSBjb3VudHJ5O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbG9jYWxlID0gYCR7bGFuZ3VhZ2V9LSR7Y291bnRyeX1gO1xuICAgICAgfVxuXG4gICAgICBsb2cuZGVidWcoYEN1cnJlbnQgbG9jYWxlOiAnJHtjdXJMb2NhbGV9JzsgcmVxdWVzdGVkIGxvY2FsZTogJyR7bG9jYWxlfSdgKTtcbiAgICAgIGlmIChsb2NhbGUudG9Mb3dlckNhc2UoKSAhPT0gY3VyTG9jYWxlLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5zZXREZXZpY2VTeXNMb2NhbGUobG9jYWxlKTtcbiAgICAgICAgd2FzU2V0dGluZ0NoYW5nZWQgPSB0cnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7IC8vIEFQSSA+PSAyNFxuICAgICAgaWYgKCFoYXNDb3VudHJ5IHx8ICFoYXNMYW5ndWFnZSkge1xuICAgICAgICBsb2cud2Fybihgc2V0RGV2aWNlTGFuZ3VhZ2VDb3VudHJ5IHJlcXVpcmVzIGJvdGggbGFuZ3VhZ2UgYW5kIGNvdW50cnkgdG8gYmUgc2V0IGZvciBBUEkgMjQrYCk7XG4gICAgICAgIGxvZy53YXJuKGBHb3QgbGFuZ3VhZ2U6ICcke2xhbmd1YWdlfScgYW5kIGNvdW50cnk6ICcke2NvdW50cnl9J2ApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIHpoLUhhbnMtQ04gOiB6aC1DTlxuICAgICAgY29uc3QgbG9jYWxlQ29kZSA9IHNjcmlwdCA/IGAke2xhbmd1YWdlfS0ke3NjcmlwdH0tJHtjb3VudHJ5fWAgOiBgJHtsYW5ndWFnZX0tJHtjb3VudHJ5fWA7XG4gICAgICBsb2cuZGVidWcoYEN1cnJlbnQgbG9jYWxlOiAnJHtjdXJMb2NhbGV9JzsgcmVxdWVzdGVkIGxvY2FsZTogJyR7bG9jYWxlQ29kZX0nYCk7XG4gICAgICBpZiAobG9jYWxlQ29kZS50b0xvd2VyQ2FzZSgpICE9PSBjdXJMb2NhbGUudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICBhd2FpdCB0aGlzLnNldERldmljZVN5c0xvY2FsZVZpYVNldHRpbmdBcHAobGFuZ3VhZ2UsIGNvdW50cnksIHNjcmlwdCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKHdhc1NldHRpbmdDaGFuZ2VkKSB7XG4gICAgbG9nLmluZm8oXCJSZWJvb3RpbmcgdGhlIGRldmljZSBpbiBvcmRlciB0byBhcHBseSBuZXcgbG9jYWxlIHZpYSAnc2V0dGluZyBwZXJzaXN0LnN5cy5sb2NhbGUnIGNvbW1hbmQuXCIpO1xuICAgIGF3YWl0IHRoaXMucmVib290KCk7XG4gIH1cbn07XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gQXBwSW5mb1xuICogQHByb3BlcnR5IHtzdHJpbmd9IG5hbWUgLSBQYWNrYWdlIG5hbWUsIGZvciBleGFtcGxlICdjb20uYWNtZS5hcHAnLlxuICogQHByb3BlcnR5IHtudW1iZXJ9IHZlcnNpb25Db2RlIC0gVmVyc2lvbiBjb2RlLlxuICogQHByb3BlcnR5IHtzdHJpbmd9IHZlcnNpb25OYW1lIC0gVmVyc2lvbiBuYW1lLCBmb3IgZXhhbXBsZSAnMS4wJy5cbiAqL1xuXG4vKipcbiAqIEdldCB0aGUgcGFja2FnZSBpbmZvIGZyb20gbG9jYWwgYXBrIGZpbGUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGFwcFBhdGggLSBUaGUgZnVsbCBwYXRoIHRvIGV4aXN0aW5nIC5hcGsocykgcGFja2FnZSBvbiB0aGUgbG9jYWxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZSBzeXN0ZW0uXG4gKiBAcmV0dXJuIHs/QXBwSW5mb30gVGhlIHBhcnNlZCBhcHBsaWNhdGlvbiBpbmZvcm1hdGlvbi5cbiAqL1xuYXBrVXRpbHNNZXRob2RzLmdldEFwa0luZm8gPSBhc3luYyBmdW5jdGlvbiAoYXBwUGF0aCkge1xuICBpZiAoIWF3YWl0IGZzLmV4aXN0cyhhcHBQYXRoKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgVGhlIGZpbGUgYXQgcGF0aCAke2FwcFBhdGh9IGRvZXMgbm90IGV4aXN0IG9yIGlzIG5vdCBhY2Nlc3NpYmxlYCk7XG4gIH1cblxuICBpZiAoYXBwUGF0aC5lbmRzV2l0aChBUEtTX0VYVEVOU0lPTikpIHtcbiAgICBhcHBQYXRoID0gYXdhaXQgdGhpcy5leHRyYWN0QmFzZUFwayhhcHBQYXRoKTtcbiAgfVxuXG4gIGF3YWl0IHRoaXMuaW5pdEFhcHQoKTtcbiAgdHJ5IHtcbiAgICBjb25zdCB7c3Rkb3V0fSA9IGF3YWl0IGV4ZWModGhpcy5iaW5hcmllcy5hYXB0LCBbJ2QnLCAnYmFkZ2luZycsIGFwcFBhdGhdKTtcbiAgICBjb25zdCBtYXRjaGVzID0gbmV3IFJlZ0V4cCgvcGFja2FnZTogbmFtZT0nKFteJ10rKScgdmVyc2lvbkNvZGU9JyhcXGQrKScgdmVyc2lvbk5hbWU9JyhbXiddKyknLykuZXhlYyhzdGRvdXQpO1xuICAgIGlmIChtYXRjaGVzKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBuYW1lOiBtYXRjaGVzWzFdLFxuICAgICAgICB2ZXJzaW9uQ29kZTogcGFyc2VJbnQobWF0Y2hlc1syXSwgMTApLFxuICAgICAgICB2ZXJzaW9uTmFtZTogbWF0Y2hlc1szXVxuICAgICAgfTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGxvZy53YXJuKGBFcnJvciBcIiR7ZXJyLm1lc3NhZ2V9XCIgd2hpbGUgZ2V0dGluZyBiYWRnaW5nIGluZm9gKTtcbiAgfVxuICByZXR1cm4ge307XG59O1xuXG4vKipcbiAqIEdldCB0aGUgcGFja2FnZSBpbmZvIGZyb20gdGhlIGluc3RhbGxlZCBhcHBsaWNhdGlvbi5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGtnIC0gVGhlIG5hbWUgb2YgdGhlIGluc3RhbGxlZCBwYWNrYWdlLlxuICogQHJldHVybiB7P0FwcEluZm99IFRoZSBwYXJzZWQgYXBwbGljYXRpb24gaW5mb3JtYXRpb24uXG4gKi9cbmFwa1V0aWxzTWV0aG9kcy5nZXRQYWNrYWdlSW5mbyA9IGFzeW5jIGZ1bmN0aW9uIChwa2cpIHtcbiAgbG9nLmRlYnVnKGBHZXR0aW5nIHBhY2thZ2UgaW5mbyBmb3IgJyR7cGtnfSdgKTtcbiAgbGV0IHJlc3VsdCA9IHtuYW1lOiBwa2d9O1xuICB0cnkge1xuICAgIGNvbnN0IHN0ZG91dCA9IGF3YWl0IHRoaXMuc2hlbGwoWydkdW1wc3lzJywgJ3BhY2thZ2UnLCBwa2ddKTtcbiAgICBjb25zdCB2ZXJzaW9uTmFtZU1hdGNoID0gbmV3IFJlZ0V4cCgvdmVyc2lvbk5hbWU9KFtcXGQrLl0rKS8pLmV4ZWMoc3Rkb3V0KTtcbiAgICBpZiAodmVyc2lvbk5hbWVNYXRjaCkge1xuICAgICAgcmVzdWx0LnZlcnNpb25OYW1lID0gdmVyc2lvbk5hbWVNYXRjaFsxXTtcbiAgICB9XG4gICAgY29uc3QgdmVyc2lvbkNvZGVNYXRjaCA9IG5ldyBSZWdFeHAoL3ZlcnNpb25Db2RlPShcXGQrKS8pLmV4ZWMoc3Rkb3V0KTtcbiAgICBpZiAodmVyc2lvbkNvZGVNYXRjaCkge1xuICAgICAgcmVzdWx0LnZlcnNpb25Db2RlID0gcGFyc2VJbnQodmVyc2lvbkNvZGVNYXRjaFsxXSwgMTApO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBsb2cud2FybihgRXJyb3IgJyR7ZXJyLm1lc3NhZ2V9JyB3aGlsZSBkdW1waW5nIHBhY2thZ2UgaW5mb2ApO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5hcGtVdGlsc01ldGhvZHMucHVsbEFwayA9IGFzeW5jIGZ1bmN0aW9uIHB1bGxBcGsgKHBrZywgdG1wRGlyKSB7XG4gIGNvbnN0IHBrZ1BhdGggPSAoYXdhaXQgdGhpcy5hZGJFeGVjKFsnc2hlbGwnLCAncG0nLCAncGF0aCcsIHBrZ10pKS5yZXBsYWNlKCdwYWNrYWdlOicsICcnKTtcbiAgY29uc3QgdG1wQXBwID0gcGF0aC5yZXNvbHZlKHRtcERpciwgYCR7cGtnfS5hcGtgKTtcbiAgYXdhaXQgdGhpcy5wdWxsKHBrZ1BhdGgsIHRtcEFwcCk7XG4gIGxvZy5kZWJ1ZyhgUHVsbGVkIGFwcCBmb3IgcGFja2FnZSAnJHtwa2d9JyB0byAnJHt0bXBBcHB9J2ApO1xuICByZXR1cm4gdG1wQXBwO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgYXBrVXRpbHNNZXRob2RzO1xuIl0sImZpbGUiOiJsaWIvdG9vbHMvYXBrLXV0aWxzLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uIn0=
