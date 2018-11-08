"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _logger = _interopRequireDefault(require("../logger.js"));

var _helpers = require("../helpers.js");

var _path = _interopRequireDefault(require("path"));

var _lodash = _interopRequireDefault(require("lodash"));

var _appiumSupport = require("appium-support");

var _net = _interopRequireDefault(require("net"));

var _logcat = _interopRequireDefault(require("../logcat"));

var _asyncbox = require("asyncbox");

var _teen_process = require("teen_process");

var _bluebird = _interopRequireDefault(require("bluebird"));

var _shellQuote = require("shell-quote");

const SETTINGS_HELPER_ID = 'io.appium.settings';
const WIFI_CONNECTION_SETTING_RECEIVER = `${SETTINGS_HELPER_ID}/.receivers.WiFiConnectionSettingReceiver`;
const WIFI_CONNECTION_SETTING_ACTION = `${SETTINGS_HELPER_ID}.wifi`;
const DATA_CONNECTION_SETTING_RECEIVER = `${SETTINGS_HELPER_ID}/.receivers.DataConnectionSettingReceiver`;
const DATA_CONNECTION_SETTING_ACTION = `${SETTINGS_HELPER_ID}.data_connection`;
const ANIMATION_SETTING_RECEIVER = `${SETTINGS_HELPER_ID}/.receivers.AnimationSettingReceiver`;
const ANIMATION_SETTING_ACTION = `${SETTINGS_HELPER_ID}.animation`;
const LOCALE_SETTING_RECEIVER = `${SETTINGS_HELPER_ID}/.receivers.LocaleSettingReceiver`;
const LOCALE_SETTING_ACTION = `${SETTINGS_HELPER_ID}.locale`;
const LOCATION_SERVICE = `${SETTINGS_HELPER_ID}/.LocationService`;
const LOCATION_RECEIVER = `${SETTINGS_HELPER_ID}/.receivers.LocationInfoReceiver`;
const LOCATION_RETRIEVAL_ACTION = `${SETTINGS_HELPER_ID}.location`;
const APPIUM_IME = `${SETTINGS_HELPER_ID}/.AppiumIME`;
const MAX_SHELL_BUFFER_LENGTH = 1000;
let methods = {};
methods.getAdbWithCorrectAdbPath = (0, _asyncToGenerator2.default)(function* () {
  this.executable.path = yield this.getSdkBinaryPath("adb");
  this.binaries.adb = this.executable.path;
  return this.adb;
});
methods.initAapt = (0, _asyncToGenerator2.default)(function* () {
  this.binaries.aapt = yield this.getSdkBinaryPath("aapt");
});
methods.initZipAlign = (0, _asyncToGenerator2.default)(function* () {
  this.binaries.zipalign = yield this.getSdkBinaryPath("zipalign");
});
methods.initBundletool = (0, _asyncToGenerator2.default)(function* () {
  try {
    this.binaries.bundletool = yield _appiumSupport.fs.which('bundletool.jar');
  } catch (err) {
    throw new Error('bundletool.jar binary is expected to be present in PATH. ' + 'Visit https://github.com/google/bundletool for more details.');
  }
});
methods.getApiLevel = (0, _asyncToGenerator2.default)(function* () {
  if (!_lodash.default.isInteger(this._apiLevel)) {
    try {
      const strOutput = yield this.getDeviceProperty('ro.build.version.sdk');
      this._apiLevel = parseInt(strOutput.trim(), 10);

      if (isNaN(this._apiLevel)) {
        throw new Error(`The actual output "${strOutput}" cannot be converted to an integer`);
      }
    } catch (e) {
      throw new Error(`Error getting device API level. Original error: ${e.message}`);
    }
  }

  _logger.default.debug(`Device API level: ${this._apiLevel}`);

  return this._apiLevel;
});
methods.getPlatformVersion = (0, _asyncToGenerator2.default)(function* () {
  _logger.default.info("Getting device platform version");

  try {
    return yield this.getDeviceProperty('ro.build.version.release');
  } catch (e) {
    throw new Error(`Error getting device platform version. Original error: ${e.message}`);
  }
});
methods.isDeviceConnected = (0, _asyncToGenerator2.default)(function* () {
  let devices = yield this.getConnectedDevices();
  return devices.length > 0;
});

methods.mkdir = function () {
  var _ref8 = (0, _asyncToGenerator2.default)(function* (remotePath) {
    return yield this.shell(['mkdir', '-p', remotePath]);
  });

  return function (_x) {
    return _ref8.apply(this, arguments);
  };
}();

methods.isValidClass = function (classString) {
  return new RegExp(/^[a-zA-Z0-9./_]+$/).exec(classString);
};

methods.forceStop = function () {
  var _ref9 = (0, _asyncToGenerator2.default)(function* (pkg) {
    return yield this.shell(['am', 'force-stop', pkg]);
  });

  return function (_x2) {
    return _ref9.apply(this, arguments);
  };
}();

methods.killPackage = function () {
  var _killPackage = (0, _asyncToGenerator2.default)(function* (pkg) {
    return yield this.shell(['am', 'kill', pkg]);
  });

  return function killPackage(_x3) {
    return _killPackage.apply(this, arguments);
  };
}();

methods.clear = function () {
  var _ref10 = (0, _asyncToGenerator2.default)(function* (pkg) {
    return yield this.shell(['pm', 'clear', pkg]);
  });

  return function (_x4) {
    return _ref10.apply(this, arguments);
  };
}();

methods.grantAllPermissions = function () {
  var _ref11 = (0, _asyncToGenerator2.default)(function* (pkg, apk) {
    let apiLevel = yield this.getApiLevel();
    let targetSdk = 0;
    let dumpsysOutput = null;

    try {
      if (!apk) {
        dumpsysOutput = yield this.shell(['dumpsys', 'package', pkg]);
        targetSdk = yield this.targetSdkVersionUsingPKG(pkg, dumpsysOutput);
      } else {
        targetSdk = yield this.targetSdkVersionFromManifest(apk);
      }
    } catch (e) {
      _logger.default.warn(`Ran into problem getting target SDK version; ignoring...`);
    }

    if (apiLevel >= 23 && targetSdk >= 23) {
      dumpsysOutput = dumpsysOutput || (yield this.shell(['dumpsys', 'package', pkg]));
      const requestedPermissions = yield this.getReqPermissions(pkg, dumpsysOutput);
      const grantedPermissions = yield this.getGrantedPermissions(pkg, dumpsysOutput);

      const permissionsToGrant = _lodash.default.difference(requestedPermissions, grantedPermissions);

      if (_lodash.default.isEmpty(permissionsToGrant)) {
        _logger.default.info(`${pkg} contains no permissions available for granting`);

        return true;
      }

      let cmds = [];
      let cmdChunk = [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = permissionsToGrant[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          let permission = _step.value;
          const nextCmd = ['pm', 'grant', pkg, permission, ';'];

          if (nextCmd.join(' ').length + cmdChunk.join(' ').length >= MAX_SHELL_BUFFER_LENGTH) {
            cmds.push(cmdChunk);
            cmdChunk = [];
          }

          cmdChunk = cmdChunk.concat(nextCmd);
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

      if (cmdChunk.length) {
        cmds.push(cmdChunk);
      }

      _logger.default.debug(`Got the following command chunks to execute: ${cmds}`);

      let result = true;
      let lastError = null;

      for (var _i = 0; _i < cmds.length; _i++) {
        let cmd = cmds[_i];

        try {
          result = (yield this.shell(cmd)) && result;
        } catch (e) {
          lastError = e;
          result = false;
        }
      }

      if (lastError) {
        throw lastError;
      }

      return result;
    }
  });

  return function (_x5, _x6) {
    return _ref11.apply(this, arguments);
  };
}();

methods.grantPermission = function () {
  var _ref12 = (0, _asyncToGenerator2.default)(function* (pkg, permission) {
    try {
      yield this.shell(['pm', 'grant', pkg, permission]);
    } catch (error) {
      if (!error.message.includes("not a changeable permission type")) {
        throw error;
      }
    }
  });

  return function (_x7, _x8) {
    return _ref12.apply(this, arguments);
  };
}();

methods.revokePermission = function () {
  var _ref13 = (0, _asyncToGenerator2.default)(function* (pkg, permission) {
    try {
      yield this.shell(['pm', 'revoke', pkg, permission]);
    } catch (error) {
      if (!error.message.includes("not a changeable permission type")) {
        throw error;
      }
    }
  });

  return function (_x9, _x10) {
    return _ref13.apply(this, arguments);
  };
}();

methods.getGrantedPermissions = function () {
  var _ref14 = (0, _asyncToGenerator2.default)(function* (pkg, cmdOutput = null) {
    _logger.default.debug('Retrieving granted permissions');

    const stdout = cmdOutput || (yield this.shell(['dumpsys', 'package', pkg]));
    return (0, _helpers.extractMatchingPermissions)(stdout, ['install', 'runtime'], true);
  });

  return function (_x11) {
    return _ref14.apply(this, arguments);
  };
}();

methods.getDeniedPermissions = function () {
  var _ref15 = (0, _asyncToGenerator2.default)(function* (pkg, cmdOutput = null) {
    _logger.default.debug('Retrieving denied permissions');

    const stdout = cmdOutput || (yield this.shell(['dumpsys', 'package', pkg]));
    return (0, _helpers.extractMatchingPermissions)(stdout, ['install', 'runtime'], false);
  });

  return function (_x12) {
    return _ref15.apply(this, arguments);
  };
}();

methods.getReqPermissions = function () {
  var _ref16 = (0, _asyncToGenerator2.default)(function* (pkg, cmdOutput = null) {
    _logger.default.debug('Retrieving requested permissions');

    const stdout = cmdOutput || (yield this.shell(['dumpsys', 'package', pkg]));
    return (0, _helpers.extractMatchingPermissions)(stdout, ['requested']);
  });

  return function (_x13) {
    return _ref16.apply(this, arguments);
  };
}();

methods.getLocationProviders = (0, _asyncToGenerator2.default)(function* () {
  let stdout = yield this.getSetting('secure', 'location_providers_allowed');
  return stdout.trim().split(',').map(p => p.trim()).filter(Boolean);
});

methods.toggleGPSLocationProvider = function () {
  var _ref18 = (0, _asyncToGenerator2.default)(function* (enabled) {
    yield this.setSetting('secure', 'location_providers_allowed', `${enabled ? "+" : "-"}gps`);
  });

  return function (_x14) {
    return _ref18.apply(this, arguments);
  };
}();

methods.setHiddenApiPolicy = function () {
  var _ref19 = (0, _asyncToGenerator2.default)(function* (value) {
    yield this.setSetting('global', 'hidden_api_policy_pre_p_apps', value);
    yield this.setSetting('global', 'hidden_api_policy_p_apps', value);
  });

  return function (_x15) {
    return _ref19.apply(this, arguments);
  };
}();

methods.setDefaultHiddenApiPolicy = (0, _asyncToGenerator2.default)(function* () {
  yield this.shell(['settings', 'delete', 'global', 'hidden_api_policy_pre_p_apps']);
  yield this.shell(['settings', 'delete', 'global', 'hidden_api_policy_p_apps']);
});

methods.stopAndClear = function () {
  var _ref21 = (0, _asyncToGenerator2.default)(function* (pkg) {
    try {
      yield this.forceStop(pkg);
      yield this.clear(pkg);
    } catch (e) {
      throw new Error(`Cannot stop and clear ${pkg}. Original error: ${e.message}`);
    }
  });

  return function (_x16) {
    return _ref21.apply(this, arguments);
  };
}();

methods.availableIMEs = (0, _asyncToGenerator2.default)(function* () {
  try {
    return (0, _helpers.getIMEListFromOutput)((yield this.shell(['ime', 'list', '-a'])));
  } catch (e) {
    throw new Error(`Error getting available IME's. Original error: ${e.message}`);
  }
});
methods.enabledIMEs = (0, _asyncToGenerator2.default)(function* () {
  try {
    return (0, _helpers.getIMEListFromOutput)((yield this.shell(['ime', 'list'])));
  } catch (e) {
    throw new Error(`Error getting enabled IME's. Original error: ${e.message}`);
  }
});

methods.enableIME = function () {
  var _ref24 = (0, _asyncToGenerator2.default)(function* (imeId) {
    yield this.shell(['ime', 'enable', imeId]);
  });

  return function (_x17) {
    return _ref24.apply(this, arguments);
  };
}();

methods.disableIME = function () {
  var _ref25 = (0, _asyncToGenerator2.default)(function* (imeId) {
    yield this.shell(['ime', 'disable', imeId]);
  });

  return function (_x18) {
    return _ref25.apply(this, arguments);
  };
}();

methods.setIME = function () {
  var _ref26 = (0, _asyncToGenerator2.default)(function* (imeId) {
    yield this.shell(['ime', 'set', imeId]);
  });

  return function (_x19) {
    return _ref26.apply(this, arguments);
  };
}();

methods.defaultIME = (0, _asyncToGenerator2.default)(function* () {
  try {
    let engine = yield this.getSetting('secure', 'default_input_method');
    return engine.trim();
  } catch (e) {
    throw new Error(`Error getting default IME. Original error: ${e.message}`);
  }
});

methods.keyevent = function () {
  var _ref28 = (0, _asyncToGenerator2.default)(function* (keycode) {
    let code = parseInt(keycode, 10);
    yield this.shell(['input', 'keyevent', code]);
  });

  return function (_x20) {
    return _ref28.apply(this, arguments);
  };
}();

methods.inputText = function () {
  var _ref29 = (0, _asyncToGenerator2.default)(function* (text) {
    text = text.replace(/\\/g, '\\\\').replace(/\(/g, '\(').replace(/\)/g, '\)').replace(/</g, '\<').replace(/>/g, '\>').replace(/\|/g, '\|').replace(/;/g, '\;').replace(/&/g, '\&').replace(/\*/g, '\*').replace(/~/g, '\~').replace(/"/g, '\"').replace(/'/g, "\'").replace(/ /g, '%s');
    yield this.shell(['input', 'text', text]);
  });

  return function (_x21) {
    return _ref29.apply(this, arguments);
  };
}();

methods.clearTextField = function () {
  var _ref30 = (0, _asyncToGenerator2.default)(function* (length = 100) {
    _logger.default.debug(`Clearing up to ${length} characters`);

    if (length === 0) {
      return;
    }

    let args = ['input', 'keyevent'];

    for (let i = 0; i < length; i++) {
      args.push('67', '112');
    }

    yield this.shell(args);
  });

  return function () {
    return _ref30.apply(this, arguments);
  };
}();

methods.lock = (0, _asyncToGenerator2.default)(function* () {
  var _this = this;

  if (yield this.isScreenLocked()) {
    _logger.default.debug("Screen is already locked. Doing nothing.");

    return;
  }

  _logger.default.debug("Pressing the KEYCODE_POWER button to lock screen");

  yield this.keyevent(26);
  const timeoutMs = 5000;

  try {
    yield (0, _asyncbox.waitForCondition)((0, _asyncToGenerator2.default)(function* () {
      return yield _this.isScreenLocked();
    }), {
      waitMs: timeoutMs,
      intervalMs: 500
    });
  } catch (e) {
    throw new Error(`The device screen is still locked after ${timeoutMs}ms timeout`);
  }
});
methods.back = (0, _asyncToGenerator2.default)(function* () {
  _logger.default.debug("Pressing the BACK button");

  yield this.keyevent(4);
});
methods.goToHome = (0, _asyncToGenerator2.default)(function* () {
  _logger.default.debug("Pressing the HOME button");

  yield this.keyevent(3);
});

methods.getAdbPath = function () {
  return this.executable.path;
};

methods.getScreenOrientation = (0, _asyncToGenerator2.default)(function* () {
  let stdout = yield this.shell(['dumpsys', 'input']);
  return (0, _helpers.getSurfaceOrientation)(stdout);
});
methods.isScreenLocked = (0, _asyncToGenerator2.default)(function* () {
  let stdout = yield this.shell(['dumpsys', 'window']);

  if (process.env.APPIUM_LOG_DUMPSYS) {
    let dumpsysFile = _path.default.resolve(process.cwd(), "dumpsys.log");

    _logger.default.debug(`Writing dumpsys output to ${dumpsysFile}`);

    yield _appiumSupport.fs.writeFile(dumpsysFile, stdout);
  }

  return (0, _helpers.isShowingLockscreen)(stdout) || (0, _helpers.isCurrentFocusOnKeyguard)(stdout) || !(0, _helpers.isScreenOnFully)(stdout);
});
methods.isSoftKeyboardPresent = (0, _asyncToGenerator2.default)(function* () {
  try {
    let stdout = yield this.shell(['dumpsys', 'input_method']);
    let isKeyboardShown = false,
        canCloseKeyboard = false,
        inputShownMatch = /mInputShown=\w+/gi.exec(stdout);

    if (inputShownMatch && inputShownMatch[0]) {
      isKeyboardShown = inputShownMatch[0].split('=')[1] === 'true';
      let isInputViewShownMatch = /mIsInputViewShown=\w+/gi.exec(stdout);

      if (isInputViewShownMatch && isInputViewShownMatch[0]) {
        canCloseKeyboard = isInputViewShownMatch[0].split('=')[1] === 'true';
      }
    }

    return {
      isKeyboardShown,
      canCloseKeyboard
    };
  } catch (e) {
    throw new Error(`Error finding softkeyboard. Original error: ${e.message}`);
  }
});

methods.sendTelnetCommand = function () {
  var _ref38 = (0, _asyncToGenerator2.default)(function* (command) {
    _logger.default.debug(`Sending telnet command to device: ${command}`);

    let port = yield this.getEmulatorPort();
    return yield new _bluebird.default((resolve, reject) => {
      let conn = _net.default.createConnection(port, 'localhost'),
          connected = false,
          readyRegex = /^OK$/m,
          dataStream = "",
          res = null;

      conn.on('connect', () => {
        _logger.default.debug("Socket connection to device created");
      });
      conn.on('data', data => {
        data = data.toString('utf8');

        if (!connected) {
          if (readyRegex.test(data)) {
            connected = true;

            _logger.default.debug("Socket connection to device ready");

            conn.write(`${command}\n`);
          }
        } else {
          dataStream += data;

          if (readyRegex.test(data)) {
            res = dataStream.replace(readyRegex, "").trim();
            res = _lodash.default.last(res.trim().split('\n'));

            _logger.default.debug(`Telnet command got response: ${res}`);

            conn.write("quit\n");
          }
        }
      });
      conn.on('error', err => {
        _logger.default.debug(`Telnet command error: ${err.message}`);

        reject(err);
      });
      conn.on('close', () => {
        if (res === null) {
          reject(new Error("Never got a response from command"));
        } else {
          resolve(res);
        }
      });
    });
  });

  return function (_x22) {
    return _ref38.apply(this, arguments);
  };
}();

methods.isAirplaneModeOn = (0, _asyncToGenerator2.default)(function* () {
  let stdout = yield this.getSetting('global', 'airplane_mode_on');
  return parseInt(stdout, 10) !== 0;
});

methods.setAirplaneMode = function () {
  var _ref40 = (0, _asyncToGenerator2.default)(function* (on) {
    yield this.setSetting('global', 'airplane_mode_on', on ? 1 : 0);
  });

  return function (_x23) {
    return _ref40.apply(this, arguments);
  };
}();

methods.broadcastAirplaneMode = function () {
  var _ref41 = (0, _asyncToGenerator2.default)(function* (on) {
    yield this.shell(['am', 'broadcast', '-a', 'android.intent.action.AIRPLANE_MODE', '--ez', 'state', on ? 'true' : 'false']);
  });

  return function (_x24) {
    return _ref41.apply(this, arguments);
  };
}();

methods.isWifiOn = (0, _asyncToGenerator2.default)(function* () {
  let stdout = yield this.getSetting('global', 'wifi_on');
  return parseInt(stdout, 10) !== 0;
});

methods.setWifiState = function () {
  var _ref43 = (0, _asyncToGenerator2.default)(function* (on, isEmulator = false) {
    if (isEmulator) {
      const isRoot = yield this.root();

      try {
        yield this.shell(['svc', 'wifi', on ? 'enable' : 'disable']);
      } finally {
        if (isRoot) {
          yield this.unroot();
        }
      }
    } else {
      yield this.shell(['am', 'broadcast', '-a', WIFI_CONNECTION_SETTING_ACTION, '-n', WIFI_CONNECTION_SETTING_RECEIVER, '--es', 'setstatus', on ? 'enable' : 'disable']);
    }
  });

  return function (_x25) {
    return _ref43.apply(this, arguments);
  };
}();

methods.isDataOn = (0, _asyncToGenerator2.default)(function* () {
  let stdout = yield this.getSetting('global', 'mobile_data');
  return parseInt(stdout, 10) !== 0;
});

methods.setDataState = function () {
  var _ref45 = (0, _asyncToGenerator2.default)(function* (on, isEmulator = false) {
    if (isEmulator) {
      const isRoot = yield this.root();

      try {
        yield this.shell(['svc', 'data', on ? 'enable' : 'disable']);
      } finally {
        if (isRoot) {
          yield this.unroot();
        }
      }
    } else {
      yield this.shell(['am', 'broadcast', '-a', DATA_CONNECTION_SETTING_ACTION, '-n', DATA_CONNECTION_SETTING_RECEIVER, '--es', 'setstatus', on ? 'enable' : 'disable']);
    }
  });

  return function (_x26) {
    return _ref45.apply(this, arguments);
  };
}();

methods.setWifiAndData = function () {
  var _ref46 = (0, _asyncToGenerator2.default)(function* ({
    wifi,
    data
  }, isEmulator = false) {
    if (_appiumSupport.util.hasValue(wifi)) {
      yield this.setWifiState(wifi, isEmulator);
    }

    if (_appiumSupport.util.hasValue(data)) {
      yield this.setDataState(data, isEmulator);
    }
  });

  return function (_x27) {
    return _ref46.apply(this, arguments);
  };
}();

methods.setAnimationState = function () {
  var _ref47 = (0, _asyncToGenerator2.default)(function* (on) {
    yield this.shell(['am', 'broadcast', '-a', ANIMATION_SETTING_ACTION, '-n', ANIMATION_SETTING_RECEIVER, '--es', 'setstatus', on ? 'enable' : 'disable']);
  });

  return function (_x28) {
    return _ref47.apply(this, arguments);
  };
}();

methods.isAnimationOn = (0, _asyncToGenerator2.default)(function* () {
  let animator_duration_scale = yield this.getSetting('global', 'animator_duration_scale');
  let transition_animation_scale = yield this.getSetting('global', 'transition_animation_scale');
  let window_animation_scale = yield this.getSetting('global', 'window_animation_scale');
  return _lodash.default.some([animator_duration_scale, transition_animation_scale, window_animation_scale], setting => setting !== '0.0');
});

methods.setDeviceSysLocaleViaSettingApp = function () {
  var _ref49 = (0, _asyncToGenerator2.default)(function* (language, country, script = null) {
    const params = ['am', 'broadcast', '-a', LOCALE_SETTING_ACTION, '-n', LOCALE_SETTING_RECEIVER, '--es', 'lang', language.toLowerCase(), '--es', 'country', country.toUpperCase()];

    if (script) {
      params.push('--es', 'script', script);
    }

    yield this.shell(params);
  });

  return function (_x29, _x30) {
    return _ref49.apply(this, arguments);
  };
}();

methods.setGeoLocation = function () {
  var _ref50 = (0, _asyncToGenerator2.default)(function* (location, isEmulator = false) {
    let longitude = parseFloat(location.longitude);

    if (isNaN(longitude)) {
      throw new Error(`location.longitude is expected to be a valid float number. '${location.longitude}' is given instead`);
    }

    longitude = `${_lodash.default.ceil(longitude, 5)}`;
    let latitude = parseFloat(location.latitude);

    if (isNaN(latitude)) {
      throw new Error(`location.latitude is expected to be a valid float number. '${location.latitude}' is given instead`);
    }

    latitude = `${_lodash.default.ceil(latitude, 5)}`;

    if (isEmulator) {
      yield this.resetTelnetAuthToken();
      yield this.adbExec(['emu', 'geo', 'fix', longitude, latitude]);
      yield this.adbExec(['emu', 'geo', 'fix', longitude.replace('.', ','), latitude.replace('.', ',')]);
    } else {
      return yield this.shell(['am', 'startservice', '-e', 'longitude', longitude, '-e', 'latitude', latitude, LOCATION_SERVICE]);
    }
  });

  return function (_x31) {
    return _ref50.apply(this, arguments);
  };
}();

methods.getGeoLocation = (0, _asyncToGenerator2.default)(function* () {
  let output;

  try {
    output = yield this.shell(['am', 'broadcast', '-n', LOCATION_RECEIVER, '-a', LOCATION_RETRIEVAL_ACTION]);
  } catch (err) {
    throw new Error(`Cannot retrieve the current geo coordinates from the device. ` + `Make sure the Appium Settings application is up to date and has location permissions. Also the location ` + `services must be enabled on the device. Original error: ${err.message}`);
  }

  const match = /data="(-?[\d\.]+)\s+(-?[\d\.]+)\s+(-?[\d\.]+)"/.exec(output);

  if (!match) {
    throw new Error(`Cannot parse the actual location values from the command output: ${output}`);
  }

  const location = {
    latitude: match[1],
    longitude: match[2],
    altitude: match[3]
  };

  _logger.default.debug(`Got geo coordinates: ${JSON.stringify(location)}`);

  return location;
});

methods.rimraf = function () {
  var _ref52 = (0, _asyncToGenerator2.default)(function* (path) {
    yield this.shell(['rm', '-rf', path]);
  });

  return function (_x32) {
    return _ref52.apply(this, arguments);
  };
}();

methods.push = function () {
  var _ref53 = (0, _asyncToGenerator2.default)(function* (localPath, remotePath, opts) {
    yield this.adbExec(['push', localPath, remotePath], opts);
  });

  return function (_x33, _x34, _x35) {
    return _ref53.apply(this, arguments);
  };
}();

methods.pull = function () {
  var _ref54 = (0, _asyncToGenerator2.default)(function* (remotePath, localPath) {
    yield this.adbExec(['pull', remotePath, localPath], {
      timeout: 60000
    });
  });

  return function (_x36, _x37) {
    return _ref54.apply(this, arguments);
  };
}();

methods.processExists = function () {
  var _ref55 = (0, _asyncToGenerator2.default)(function* (processName) {
    try {
      if (!this.isValidClass(processName)) {
        throw new Error(`Invalid process name: ${processName}`);
      }

      let stdout = yield this.shell("ps");
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = stdout.split(/\r?\n/)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          let line = _step2.value;
          line = line.trim().split(/\s+/);
          let pkgColumn = line[line.length - 1];

          if (pkgColumn && pkgColumn.indexOf(processName) !== -1) {
            return true;
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

      return false;
    } catch (e) {
      throw new Error(`Error finding if process exists. Original error: ${e.message}`);
    }
  });

  return function (_x38) {
    return _ref55.apply(this, arguments);
  };
}();

methods.getForwardList = (0, _asyncToGenerator2.default)(function* () {
  _logger.default.debug(`List forwarding ports`);

  let connections = yield this.adbExec(['forward', '--list']);
  return connections.split('\n');
});

methods.forwardPort = function () {
  var _ref57 = (0, _asyncToGenerator2.default)(function* (systemPort, devicePort) {
    _logger.default.debug(`Forwarding system: ${systemPort} to device: ${devicePort}`);

    yield this.adbExec(['forward', `tcp:${systemPort}`, `tcp:${devicePort}`]);
  });

  return function (_x39, _x40) {
    return _ref57.apply(this, arguments);
  };
}();

methods.removePortForward = function () {
  var _ref58 = (0, _asyncToGenerator2.default)(function* (systemPort) {
    _logger.default.debug(`Removing forwarded port socket connection: ${systemPort} `);

    yield this.adbExec(['forward', `--remove`, `tcp:${systemPort}`]);
  });

  return function (_x41) {
    return _ref58.apply(this, arguments);
  };
}();

methods.forwardAbstractPort = function () {
  var _ref59 = (0, _asyncToGenerator2.default)(function* (systemPort, devicePort) {
    _logger.default.debug(`Forwarding system: ${systemPort} to abstract device: ${devicePort}`);

    yield this.adbExec(['forward', `tcp:${systemPort}`, `localabstract:${devicePort}`]);
  });

  return function (_x42, _x43) {
    return _ref59.apply(this, arguments);
  };
}();

methods.ping = (0, _asyncToGenerator2.default)(function* () {
  let stdout = yield this.shell(["echo", "ping"]);

  if (stdout.indexOf("ping") === 0) {
    return true;
  }

  throw new Error(`ADB ping failed, returned ${stdout}`);
});
methods.restart = (0, _asyncToGenerator2.default)(function* () {
  try {
    yield this.stopLogcat();
    yield this.restartAdb();
    yield this.waitForDevice(60);
    yield this.startLogcat();
  } catch (e) {
    throw new Error(`Restart failed. Orginial error: ${e.message}`);
  }
});
methods.startLogcat = (0, _asyncToGenerator2.default)(function* () {
  if (!_lodash.default.isEmpty(this.logcat)) {
    throw new Error("Trying to start logcat capture but it's already started!");
  }

  this.logcat = new _logcat.default({
    adb: this.executable,
    debug: false,
    debugTrace: false,
    clearDeviceLogsOnStart: !!this.clearDeviceLogsOnStart
  });
  yield this.logcat.startCapture();
});
methods.stopLogcat = (0, _asyncToGenerator2.default)(function* () {
  if (_lodash.default.isEmpty(this.logcat)) {
    return;
  }

  try {
    yield this.logcat.stopCapture();
  } finally {
    this.logcat = null;
  }
});

methods.getLogcatLogs = function () {
  if (_lodash.default.isEmpty(this.logcat)) {
    throw new Error("Can't get logcat logs since logcat hasn't started");
  }

  return this.logcat.getLogs();
};

methods.setLogcatListener = function (listener) {
  if (_lodash.default.isEmpty(this.logcat)) {
    throw new Error("Logcat process hasn't been started");
  }

  this.logcat.on('output', listener);
};

methods.removeLogcatListener = function (listener) {
  if (_lodash.default.isEmpty(this.logcat)) {
    throw new Error("Logcat process hasn't been started");
  }

  this.logcat.removeListener('output', listener);
};

methods.getPIDsByName = function () {
  var _ref64 = (0, _asyncToGenerator2.default)(function* (name) {
    _logger.default.debug(`Getting all processes with ${name}`);

    try {
      if (name.length > 15) {
        name = name.substr(name.length - 15);
      }

      let stdout = (yield this.shell(["ps"])).trim();
      let pids = [];
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = stdout.split("\n")[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          let line = _step3.value;

          if (line.indexOf(name) !== -1) {
            let match = /[^\t ]+[\t ]+([0-9]+)/.exec(line);

            if (match) {
              pids.push(parseInt(match[1], 10));
            } else {
              throw new Error(`Could not extract PID from ps output: ${line}`);
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

      return pids;
    } catch (e) {
      throw new Error(`Unable to get pids for ${name}. Orginial error: ${e.message}`);
    }
  });

  return function (_x44) {
    return _ref64.apply(this, arguments);
  };
}();

methods.killProcessesByName = function () {
  var _ref65 = (0, _asyncToGenerator2.default)(function* (name) {
    try {
      _logger.default.debug(`Attempting to kill all ${name} processes`);

      let pids = yield this.getPIDsByName(name);

      if (_lodash.default.isEmpty(pids)) {
        _logger.default.info(`No '${name}' process has been found`);

        return;
      }

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = pids[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          let pid = _step4.value;
          yield this.killProcessByPID(pid);
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
    } catch (e) {
      throw new Error(`Unable to kill ${name} processes. Original error: ${e.message}`);
    }
  });

  return function (_x45) {
    return _ref65.apply(this, arguments);
  };
}();

methods.killProcessByPID = function () {
  var _ref66 = (0, _asyncToGenerator2.default)(function* (pid) {
    var _this2 = this;

    _logger.default.debug(`Attempting to kill process ${pid}`);

    let wasRoot = false;
    let becameRoot = false;

    try {
      try {
        yield this.shell(['kill', '-0', pid]);
      } catch (e) {
        if (!e.message.includes('Operation not permitted')) {
          throw e;
        }

        try {
          wasRoot = (yield this.shell(['whoami'])) === 'root';
        } catch (ign) {}

        if (wasRoot) {
          throw e;
        }

        _logger.default.info(`Cannot kill PID ${pid} due to insufficient permissions. Retrying as root`);

        try {
          becameRoot = yield this.root();
        } catch (ign) {}

        yield this.shell(['kill', '-0', pid]);
      }

      const timeoutMs = 1000;
      let stdout;

      try {
        yield (0, _asyncbox.waitForCondition)((0, _asyncToGenerator2.default)(function* () {
          try {
            stdout = yield _this2.shell(['kill', pid]);
            return false;
          } catch (e) {
            return true;
          }
        }), {
          waitMs: timeoutMs,
          intervalMs: 300
        });
      } catch (err) {
        _logger.default.warn(`Cannot kill process ${pid} in ${timeoutMs} ms. Trying to force kill...`);

        stdout = yield this.shell(['kill', '-9', pid]);
      }

      return stdout;
    } finally {
      if (becameRoot) {
        yield this.unroot();
      }
    }
  });

  return function (_x46) {
    return _ref66.apply(this, arguments);
  };
}();

methods.broadcastProcessEnd = function () {
  var _ref68 = (0, _asyncToGenerator2.default)(function* (intent, processName) {
    this.broadcast(intent);
    let start = Date.now();
    let timeoutMs = 40000;

    try {
      while (Date.now() - start < timeoutMs) {
        if (yield this.processExists(processName)) {
          yield (0, _asyncbox.sleep)(400);
          continue;
        }

        return;
      }

      throw new Error(`Process never died within ${timeoutMs} ms`);
    } catch (e) {
      throw new Error(`Unable to broadcast process end. Original error: ${e.message}`);
    }
  });

  return function (_x47, _x48) {
    return _ref68.apply(this, arguments);
  };
}();

methods.broadcast = function () {
  var _ref69 = (0, _asyncToGenerator2.default)(function* (intent) {
    if (!this.isValidClass(intent)) {
      throw new Error(`Invalid intent ${intent}`);
    }

    _logger.default.debug(`Broadcasting: ${intent}`);

    yield this.shell(['am', 'broadcast', '-a', intent]);
  });

  return function (_x49) {
    return _ref69.apply(this, arguments);
  };
}();

methods.endAndroidCoverage = (0, _asyncToGenerator2.default)(function* () {
  if (this.instrumentProc && this.instrumentProc.isRunning) {
    yield this.instrumentProc.stop();
  }
});

methods.instrument = function () {
  var _ref71 = (0, _asyncToGenerator2.default)(function* (pkg, activity, instrumentWith) {
    if (activity[0] !== ".") {
      pkg = "";
    }

    let pkgActivity = (pkg + activity).replace(/\.+/g, '.');
    let stdout = yield this.shell(['am', 'instrument', '-e', 'main_activity', pkgActivity, instrumentWith]);

    if (stdout.indexOf("Exception") !== -1) {
      throw new Error(`Unknown exception during instrumentation. Original error ${stdout.split("\n")[0]}`);
    }
  });

  return function (_x50, _x51, _x52) {
    return _ref71.apply(this, arguments);
  };
}();

methods.androidCoverage = function () {
  var _ref72 = (0, _asyncToGenerator2.default)(function* (instrumentClass, waitPkg, waitActivity) {
    var _this3 = this;

    if (!this.isValidClass(instrumentClass)) {
      throw new Error(`Invalid class ${instrumentClass}`);
    }

    return yield new _bluebird.default(function () {
      var _ref73 = (0, _asyncToGenerator2.default)(function* (resolve, reject) {
        let args = _this3.executable.defaultArgs.concat(['shell', 'am', 'instrument', '-e', 'coverage', 'true', '-w']).concat([instrumentClass]);

        _logger.default.debug(`Collecting coverage data with: ${[_this3.executable.path].concat(args).join(' ')}`);

        try {
          _this3.instrumentProc = new _teen_process.SubProcess(_this3.executable.path, args);
          yield _this3.instrumentProc.start(0);

          _this3.instrumentProc.on('output', (stdout, stderr) => {
            if (stderr) {
              reject(new Error(`Failed to run instrumentation. Original error: ${stderr}`));
            }
          });

          yield _this3.waitForActivity(waitPkg, waitActivity);
          resolve();
        } catch (e) {
          reject(new Error(`Android coverage failed. Original error: ${e.message}`));
        }
      });

      return function (_x56, _x57) {
        return _ref73.apply(this, arguments);
      };
    }());
  });

  return function (_x53, _x54, _x55) {
    return _ref72.apply(this, arguments);
  };
}();

methods.getDeviceProperty = function () {
  var _ref74 = (0, _asyncToGenerator2.default)(function* (property) {
    let stdout = yield this.shell(['getprop', property]);
    let val = stdout.trim();

    _logger.default.debug(`Current device property '${property}': ${val}`);

    return val;
  });

  return function (_x58) {
    return _ref74.apply(this, arguments);
  };
}();

methods.setDeviceProperty = function () {
  var _ref75 = (0, _asyncToGenerator2.default)(function* (prop, val) {
    let apiLevel = yield this.getApiLevel();

    if (apiLevel >= 26) {
      _logger.default.debug(`Running adb root, Android O needs adb to be rooted to setDeviceProperty`);

      yield this.root();
    }

    _logger.default.debug(`Setting device property '${prop}' to '${val}'`);

    let err;

    try {
      yield this.shell(['setprop', prop, val]);
    } catch (e) {
      err = e;
    }

    if (apiLevel >= 26) {
      _logger.default.debug(`Removing adb root for setDeviceProperty`);

      yield this.unroot();
    }

    if (err) throw err;
  });

  return function (_x59, _x60) {
    return _ref75.apply(this, arguments);
  };
}();

methods.getDeviceSysLanguage = (0, _asyncToGenerator2.default)(function* () {
  return yield this.getDeviceProperty("persist.sys.language");
});

methods.setDeviceSysLanguage = function () {
  var _ref77 = (0, _asyncToGenerator2.default)(function* (language) {
    return yield this.setDeviceProperty("persist.sys.language", language.toLowerCase());
  });

  return function (_x61) {
    return _ref77.apply(this, arguments);
  };
}();

methods.getDeviceSysCountry = (0, _asyncToGenerator2.default)(function* () {
  return yield this.getDeviceProperty("persist.sys.country");
});

methods.setDeviceSysCountry = function () {
  var _ref79 = (0, _asyncToGenerator2.default)(function* (country) {
    return yield this.setDeviceProperty("persist.sys.country", country.toUpperCase());
  });

  return function (_x62) {
    return _ref79.apply(this, arguments);
  };
}();

methods.getDeviceSysLocale = (0, _asyncToGenerator2.default)(function* () {
  return yield this.getDeviceProperty("persist.sys.locale");
});

methods.setDeviceSysLocale = function () {
  var _ref81 = (0, _asyncToGenerator2.default)(function* (locale) {
    return yield this.setDeviceProperty("persist.sys.locale", locale);
  });

  return function (_x63) {
    return _ref81.apply(this, arguments);
  };
}();

methods.getDeviceProductLanguage = (0, _asyncToGenerator2.default)(function* () {
  return yield this.getDeviceProperty("ro.product.locale.language");
});
methods.getDeviceProductCountry = (0, _asyncToGenerator2.default)(function* () {
  return yield this.getDeviceProperty("ro.product.locale.region");
});
methods.getDeviceProductLocale = (0, _asyncToGenerator2.default)(function* () {
  return yield this.getDeviceProperty("ro.product.locale");
});
methods.getModel = (0, _asyncToGenerator2.default)(function* () {
  return yield this.getDeviceProperty("ro.product.model");
});
methods.getManufacturer = (0, _asyncToGenerator2.default)(function* () {
  return yield this.getDeviceProperty("ro.product.manufacturer");
});
methods.getScreenSize = (0, _asyncToGenerator2.default)(function* () {
  let stdout = yield this.shell(['wm', 'size']);
  let size = new RegExp(/Physical size: ([^\r?\n]+)*/g).exec(stdout);

  if (size && size.length >= 2) {
    return size[1].trim();
  }

  return null;
});
methods.getScreenDensity = (0, _asyncToGenerator2.default)(function* () {
  let stdout = yield this.shell(['wm', 'density']);
  let density = new RegExp(/Physical density: ([^\r?\n]+)*/g).exec(stdout);

  if (density && density.length >= 2) {
    let densityNumber = parseInt(density[1].trim(), 10);
    return isNaN(densityNumber) ? null : densityNumber;
  }

  return null;
});

methods.setHttpProxy = function () {
  var _ref89 = (0, _asyncToGenerator2.default)(function* (proxyHost, proxyPort) {
    let proxy = `${proxyHost}:${proxyPort}`;

    if (_lodash.default.isUndefined(proxyHost)) {
      throw new Error(`Call to setHttpProxy method with undefined proxy_host: ${proxy}`);
    }

    if (_lodash.default.isUndefined(proxyPort)) {
      throw new Error(`Call to setHttpProxy method with undefined proxy_port ${proxy}`);
    }

    yield this.setSetting('global', 'http_proxy', proxy);
    yield this.setSetting('secure', 'http_proxy', proxy);
    yield this.setSetting('system', 'http_proxy', proxy);
    yield this.setSetting('system', 'global_http_proxy_host', proxyHost);
    yield this.setSetting('system', 'global_http_proxy_port', proxyPort);
  });

  return function (_x64, _x65) {
    return _ref89.apply(this, arguments);
  };
}();

methods.setSetting = function () {
  var _ref90 = (0, _asyncToGenerator2.default)(function* (namespace, setting, value) {
    return yield this.shell(['settings', 'put', namespace, setting, value]);
  });

  return function (_x66, _x67, _x68) {
    return _ref90.apply(this, arguments);
  };
}();

methods.getSetting = function () {
  var _ref91 = (0, _asyncToGenerator2.default)(function* (namespace, setting) {
    return yield this.shell(['settings', 'get', namespace, setting]);
  });

  return function (_x69, _x70) {
    return _ref91.apply(this, arguments);
  };
}();

methods.bugreport = function () {
  var _ref92 = (0, _asyncToGenerator2.default)(function* (timeout = 120000) {
    return yield this.adbExec(['bugreport'], {
      timeout
    });
  });

  return function () {
    return _ref92.apply(this, arguments);
  };
}();

methods.screenrecord = function (destination, options = {}) {
  const cmd = ['screenrecord'];
  const videoSize = options.videoSize,
        bitRate = options.bitRate,
        timeLimit = options.timeLimit,
        bugReport = options.bugReport;

  if (_appiumSupport.util.hasValue(videoSize)) {
    cmd.push('--size', videoSize);
  }

  if (_appiumSupport.util.hasValue(timeLimit)) {
    cmd.push('--time-limit', timeLimit);
  }

  if (_appiumSupport.util.hasValue(bitRate)) {
    cmd.push('--bit-rate', bitRate);
  }

  if (bugReport) {
    cmd.push('--bugreport');
  }

  cmd.push(destination);
  const fullCmd = [...this.executable.defaultArgs, 'shell', ...cmd];

  _logger.default.debug(`Building screenrecord process with the command line: adb ${(0, _shellQuote.quote)(fullCmd)}`);

  return new _teen_process.SubProcess(this.executable.path, fullCmd);
};

methods.performEditorAction = function () {
  var _ref93 = (0, _asyncToGenerator2.default)(function* (action) {
    _logger.default.debug(`Performing editor action: ${action}`);

    const defaultIME = yield this.defaultIME();
    yield this.enableIME(APPIUM_IME);

    try {
      yield this.setIME(APPIUM_IME);
      yield this.shell(['input', 'text', `/${action}/`]);
    } finally {
      yield this.setIME(defaultIME);
    }
  });

  return function (_x71) {
    return _ref93.apply(this, arguments);
  };
}();

var _default = methods;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi90b29scy9hZGItY29tbWFuZHMuanMiXSwibmFtZXMiOlsiU0VUVElOR1NfSEVMUEVSX0lEIiwiV0lGSV9DT05ORUNUSU9OX1NFVFRJTkdfUkVDRUlWRVIiLCJXSUZJX0NPTk5FQ1RJT05fU0VUVElOR19BQ1RJT04iLCJEQVRBX0NPTk5FQ1RJT05fU0VUVElOR19SRUNFSVZFUiIsIkRBVEFfQ09OTkVDVElPTl9TRVRUSU5HX0FDVElPTiIsIkFOSU1BVElPTl9TRVRUSU5HX1JFQ0VJVkVSIiwiQU5JTUFUSU9OX1NFVFRJTkdfQUNUSU9OIiwiTE9DQUxFX1NFVFRJTkdfUkVDRUlWRVIiLCJMT0NBTEVfU0VUVElOR19BQ1RJT04iLCJMT0NBVElPTl9TRVJWSUNFIiwiTE9DQVRJT05fUkVDRUlWRVIiLCJMT0NBVElPTl9SRVRSSUVWQUxfQUNUSU9OIiwiQVBQSVVNX0lNRSIsIk1BWF9TSEVMTF9CVUZGRVJfTEVOR1RIIiwibWV0aG9kcyIsImdldEFkYldpdGhDb3JyZWN0QWRiUGF0aCIsImV4ZWN1dGFibGUiLCJwYXRoIiwiZ2V0U2RrQmluYXJ5UGF0aCIsImJpbmFyaWVzIiwiYWRiIiwiaW5pdEFhcHQiLCJhYXB0IiwiaW5pdFppcEFsaWduIiwiemlwYWxpZ24iLCJpbml0QnVuZGxldG9vbCIsImJ1bmRsZXRvb2wiLCJmcyIsIndoaWNoIiwiZXJyIiwiRXJyb3IiLCJnZXRBcGlMZXZlbCIsIl8iLCJpc0ludGVnZXIiLCJfYXBpTGV2ZWwiLCJzdHJPdXRwdXQiLCJnZXREZXZpY2VQcm9wZXJ0eSIsInBhcnNlSW50IiwidHJpbSIsImlzTmFOIiwiZSIsIm1lc3NhZ2UiLCJsb2ciLCJkZWJ1ZyIsImdldFBsYXRmb3JtVmVyc2lvbiIsImluZm8iLCJpc0RldmljZUNvbm5lY3RlZCIsImRldmljZXMiLCJnZXRDb25uZWN0ZWREZXZpY2VzIiwibGVuZ3RoIiwibWtkaXIiLCJyZW1vdGVQYXRoIiwic2hlbGwiLCJpc1ZhbGlkQ2xhc3MiLCJjbGFzc1N0cmluZyIsIlJlZ0V4cCIsImV4ZWMiLCJmb3JjZVN0b3AiLCJwa2ciLCJraWxsUGFja2FnZSIsImNsZWFyIiwiZ3JhbnRBbGxQZXJtaXNzaW9ucyIsImFwayIsImFwaUxldmVsIiwidGFyZ2V0U2RrIiwiZHVtcHN5c091dHB1dCIsInRhcmdldFNka1ZlcnNpb25Vc2luZ1BLRyIsInRhcmdldFNka1ZlcnNpb25Gcm9tTWFuaWZlc3QiLCJ3YXJuIiwicmVxdWVzdGVkUGVybWlzc2lvbnMiLCJnZXRSZXFQZXJtaXNzaW9ucyIsImdyYW50ZWRQZXJtaXNzaW9ucyIsImdldEdyYW50ZWRQZXJtaXNzaW9ucyIsInBlcm1pc3Npb25zVG9HcmFudCIsImRpZmZlcmVuY2UiLCJpc0VtcHR5IiwiY21kcyIsImNtZENodW5rIiwicGVybWlzc2lvbiIsIm5leHRDbWQiLCJqb2luIiwicHVzaCIsImNvbmNhdCIsInJlc3VsdCIsImxhc3RFcnJvciIsImNtZCIsImdyYW50UGVybWlzc2lvbiIsImVycm9yIiwiaW5jbHVkZXMiLCJyZXZva2VQZXJtaXNzaW9uIiwiY21kT3V0cHV0Iiwic3Rkb3V0IiwiZ2V0RGVuaWVkUGVybWlzc2lvbnMiLCJnZXRMb2NhdGlvblByb3ZpZGVycyIsImdldFNldHRpbmciLCJzcGxpdCIsIm1hcCIsInAiLCJmaWx0ZXIiLCJCb29sZWFuIiwidG9nZ2xlR1BTTG9jYXRpb25Qcm92aWRlciIsImVuYWJsZWQiLCJzZXRTZXR0aW5nIiwic2V0SGlkZGVuQXBpUG9saWN5IiwidmFsdWUiLCJzZXREZWZhdWx0SGlkZGVuQXBpUG9saWN5Iiwic3RvcEFuZENsZWFyIiwiYXZhaWxhYmxlSU1FcyIsImVuYWJsZWRJTUVzIiwiZW5hYmxlSU1FIiwiaW1lSWQiLCJkaXNhYmxlSU1FIiwic2V0SU1FIiwiZGVmYXVsdElNRSIsImVuZ2luZSIsImtleWV2ZW50Iiwia2V5Y29kZSIsImNvZGUiLCJpbnB1dFRleHQiLCJ0ZXh0IiwicmVwbGFjZSIsImNsZWFyVGV4dEZpZWxkIiwiYXJncyIsImkiLCJsb2NrIiwiaXNTY3JlZW5Mb2NrZWQiLCJ0aW1lb3V0TXMiLCJ3YWl0TXMiLCJpbnRlcnZhbE1zIiwiYmFjayIsImdvVG9Ib21lIiwiZ2V0QWRiUGF0aCIsImdldFNjcmVlbk9yaWVudGF0aW9uIiwicHJvY2VzcyIsImVudiIsIkFQUElVTV9MT0dfRFVNUFNZUyIsImR1bXBzeXNGaWxlIiwicmVzb2x2ZSIsImN3ZCIsIndyaXRlRmlsZSIsImlzU29mdEtleWJvYXJkUHJlc2VudCIsImlzS2V5Ym9hcmRTaG93biIsImNhbkNsb3NlS2V5Ym9hcmQiLCJpbnB1dFNob3duTWF0Y2giLCJpc0lucHV0Vmlld1Nob3duTWF0Y2giLCJzZW5kVGVsbmV0Q29tbWFuZCIsImNvbW1hbmQiLCJwb3J0IiwiZ2V0RW11bGF0b3JQb3J0IiwiQiIsInJlamVjdCIsImNvbm4iLCJuZXQiLCJjcmVhdGVDb25uZWN0aW9uIiwiY29ubmVjdGVkIiwicmVhZHlSZWdleCIsImRhdGFTdHJlYW0iLCJyZXMiLCJvbiIsImRhdGEiLCJ0b1N0cmluZyIsInRlc3QiLCJ3cml0ZSIsImxhc3QiLCJpc0FpcnBsYW5lTW9kZU9uIiwic2V0QWlycGxhbmVNb2RlIiwiYnJvYWRjYXN0QWlycGxhbmVNb2RlIiwiaXNXaWZpT24iLCJzZXRXaWZpU3RhdGUiLCJpc0VtdWxhdG9yIiwiaXNSb290Iiwicm9vdCIsInVucm9vdCIsImlzRGF0YU9uIiwic2V0RGF0YVN0YXRlIiwic2V0V2lmaUFuZERhdGEiLCJ3aWZpIiwidXRpbCIsImhhc1ZhbHVlIiwic2V0QW5pbWF0aW9uU3RhdGUiLCJpc0FuaW1hdGlvbk9uIiwiYW5pbWF0b3JfZHVyYXRpb25fc2NhbGUiLCJ0cmFuc2l0aW9uX2FuaW1hdGlvbl9zY2FsZSIsIndpbmRvd19hbmltYXRpb25fc2NhbGUiLCJzb21lIiwic2V0dGluZyIsInNldERldmljZVN5c0xvY2FsZVZpYVNldHRpbmdBcHAiLCJsYW5ndWFnZSIsImNvdW50cnkiLCJzY3JpcHQiLCJwYXJhbXMiLCJ0b0xvd2VyQ2FzZSIsInRvVXBwZXJDYXNlIiwic2V0R2VvTG9jYXRpb24iLCJsb2NhdGlvbiIsImxvbmdpdHVkZSIsInBhcnNlRmxvYXQiLCJjZWlsIiwibGF0aXR1ZGUiLCJyZXNldFRlbG5ldEF1dGhUb2tlbiIsImFkYkV4ZWMiLCJnZXRHZW9Mb2NhdGlvbiIsIm91dHB1dCIsIm1hdGNoIiwiYWx0aXR1ZGUiLCJKU09OIiwic3RyaW5naWZ5IiwicmltcmFmIiwibG9jYWxQYXRoIiwib3B0cyIsInB1bGwiLCJ0aW1lb3V0IiwicHJvY2Vzc0V4aXN0cyIsInByb2Nlc3NOYW1lIiwibGluZSIsInBrZ0NvbHVtbiIsImluZGV4T2YiLCJnZXRGb3J3YXJkTGlzdCIsImNvbm5lY3Rpb25zIiwiZm9yd2FyZFBvcnQiLCJzeXN0ZW1Qb3J0IiwiZGV2aWNlUG9ydCIsInJlbW92ZVBvcnRGb3J3YXJkIiwiZm9yd2FyZEFic3RyYWN0UG9ydCIsInBpbmciLCJyZXN0YXJ0Iiwic3RvcExvZ2NhdCIsInJlc3RhcnRBZGIiLCJ3YWl0Rm9yRGV2aWNlIiwic3RhcnRMb2djYXQiLCJsb2djYXQiLCJMb2djYXQiLCJkZWJ1Z1RyYWNlIiwiY2xlYXJEZXZpY2VMb2dzT25TdGFydCIsInN0YXJ0Q2FwdHVyZSIsInN0b3BDYXB0dXJlIiwiZ2V0TG9nY2F0TG9ncyIsImdldExvZ3MiLCJzZXRMb2djYXRMaXN0ZW5lciIsImxpc3RlbmVyIiwicmVtb3ZlTG9nY2F0TGlzdGVuZXIiLCJyZW1vdmVMaXN0ZW5lciIsImdldFBJRHNCeU5hbWUiLCJuYW1lIiwic3Vic3RyIiwicGlkcyIsImtpbGxQcm9jZXNzZXNCeU5hbWUiLCJwaWQiLCJraWxsUHJvY2Vzc0J5UElEIiwid2FzUm9vdCIsImJlY2FtZVJvb3QiLCJpZ24iLCJicm9hZGNhc3RQcm9jZXNzRW5kIiwiaW50ZW50IiwiYnJvYWRjYXN0Iiwic3RhcnQiLCJEYXRlIiwibm93IiwiZW5kQW5kcm9pZENvdmVyYWdlIiwiaW5zdHJ1bWVudFByb2MiLCJpc1J1bm5pbmciLCJzdG9wIiwiaW5zdHJ1bWVudCIsImFjdGl2aXR5IiwiaW5zdHJ1bWVudFdpdGgiLCJwa2dBY3Rpdml0eSIsImFuZHJvaWRDb3ZlcmFnZSIsImluc3RydW1lbnRDbGFzcyIsIndhaXRQa2ciLCJ3YWl0QWN0aXZpdHkiLCJkZWZhdWx0QXJncyIsIlN1YlByb2Nlc3MiLCJzdGRlcnIiLCJ3YWl0Rm9yQWN0aXZpdHkiLCJwcm9wZXJ0eSIsInZhbCIsInNldERldmljZVByb3BlcnR5IiwicHJvcCIsImdldERldmljZVN5c0xhbmd1YWdlIiwic2V0RGV2aWNlU3lzTGFuZ3VhZ2UiLCJnZXREZXZpY2VTeXNDb3VudHJ5Iiwic2V0RGV2aWNlU3lzQ291bnRyeSIsImdldERldmljZVN5c0xvY2FsZSIsInNldERldmljZVN5c0xvY2FsZSIsImxvY2FsZSIsImdldERldmljZVByb2R1Y3RMYW5ndWFnZSIsImdldERldmljZVByb2R1Y3RDb3VudHJ5IiwiZ2V0RGV2aWNlUHJvZHVjdExvY2FsZSIsImdldE1vZGVsIiwiZ2V0TWFudWZhY3R1cmVyIiwiZ2V0U2NyZWVuU2l6ZSIsInNpemUiLCJnZXRTY3JlZW5EZW5zaXR5IiwiZGVuc2l0eSIsImRlbnNpdHlOdW1iZXIiLCJzZXRIdHRwUHJveHkiLCJwcm94eUhvc3QiLCJwcm94eVBvcnQiLCJwcm94eSIsImlzVW5kZWZpbmVkIiwibmFtZXNwYWNlIiwiYnVncmVwb3J0Iiwic2NyZWVucmVjb3JkIiwiZGVzdGluYXRpb24iLCJvcHRpb25zIiwidmlkZW9TaXplIiwiYml0UmF0ZSIsInRpbWVMaW1pdCIsImJ1Z1JlcG9ydCIsImZ1bGxDbWQiLCJwZXJmb3JtRWRpdG9yQWN0aW9uIiwiYWN0aW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUdBLE1BQU1BLGtCQUFrQixHQUFHLG9CQUEzQjtBQUNBLE1BQU1DLGdDQUFnQyxHQUFJLEdBQUVELGtCQUFtQiwyQ0FBL0Q7QUFDQSxNQUFNRSw4QkFBOEIsR0FBSSxH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QUFKLENBQVM4TixXQUFUO0FBRUEsUUFBTU0sT0FBTyxHQUFHLENBQ2QsR0FBRyxLQUFLclMsVUFBTCxDQUFnQjhQLFdBREwsRUFFZCxPQUZjLEVBR2QsR0FBR3pMLEdBSFcsQ0FBaEI7O0FBS0EzQyxrQkFBSUMsS0FBSixDQUFXLDREQUEyRCx1QkFBTTBRLE9BQU4sQ0FBZSxFQUFyRjs7QUFDQSxTQUFPLElBQUl0Qyx3QkFBSixDQUFlLEtBQUsvUCxVQUFMLENBQWdCQyxJQUEvQixFQUFxQ29TLE9BQXJDLENBQVA7QUFDRCxDQTdCRDs7QUF5Q0F2UyxPQUFPLENBQUN3UyxtQkFBUjtBQUFBLCtDQUE4QixXQUFnQkMsTUFBaEIsRUFBd0I7QUFDcEQ3USxvQkFBSUMsS0FBSixDQUFXLDZCQUE0QjRRLE1BQU8sRUFBOUM7O0FBQ0EsVUFBTXRNLFVBQVUsU0FBUyxLQUFLQSxVQUFMLEVBQXpCO0FBQ0EsVUFBTSxLQUFLSixTQUFMLENBQWVqRyxVQUFmLENBQU47O0FBQ0EsUUFBSTtBQUNGLFlBQU0sS0FBS29HLE1BQUwsQ0FBWXBHLFVBQVosQ0FBTjtBQUNBLFlBQU0sS0FBS3dDLEtBQUwsQ0FBVyxDQUFDLE9BQUQsRUFBVSxNQUFWLEVBQW1CLElBQUdtUSxNQUFPLEdBQTdCLENBQVgsQ0FBTjtBQUNELEtBSEQsU0FHVTtBQUNSLFlBQU0sS0FBS3ZNLE1BQUwsQ0FBWUMsVUFBWixDQUFOO0FBQ0Q7QUFDRixHQVZEOztBQUFBO0FBQUE7QUFBQTtBQUFBOztlQVllbkcsTyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBsb2cgZnJvbSAnLi4vbG9nZ2VyLmpzJztcbmltcG9ydCB7IGdldElNRUxpc3RGcm9tT3V0cHV0LCBpc1Nob3dpbmdMb2Nrc2NyZWVuLCBpc0N1cnJlbnRGb2N1c09uS2V5Z3VhcmQsXG4gICAgICAgICBnZXRTdXJmYWNlT3JpZW50YXRpb24sIGlzU2NyZWVuT25GdWxseSwgZXh0cmFjdE1hdGNoaW5nUGVybWlzc2lvbnMgfSBmcm9tICcuLi9oZWxwZXJzLmpzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IGZzLCB1dGlsIH0gZnJvbSAnYXBwaXVtLXN1cHBvcnQnO1xuaW1wb3J0IG5ldCBmcm9tICduZXQnO1xuaW1wb3J0IExvZ2NhdCBmcm9tICcuLi9sb2djYXQnO1xuaW1wb3J0IHsgc2xlZXAsIHdhaXRGb3JDb25kaXRpb24gfSBmcm9tICdhc3luY2JveCc7XG5pbXBvcnQgeyBTdWJQcm9jZXNzIH0gZnJvbSAndGVlbl9wcm9jZXNzJztcbmltcG9ydCBCIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IHF1b3RlIH0gZnJvbSAnc2hlbGwtcXVvdGUnO1xuXG5cbmNvbnN0IFNFVFRJTkdTX0hFTFBFUl9JRCA9ICdpby5hcHBpdW0uc2V0dGluZ3MnO1xuY29uc3QgV0lGSV9DT05ORUNUSU9OX1NFVFRJTkdfUkVDRUlWRVIgPSBgJHtTRVRUSU5HU19IRUxQRVJfSUR9Ly5yZWNlaXZlcnMuV2lGaUNvbm5lY3Rpb25TZXR0aW5nUmVjZWl2ZXJgO1xuY29uc3QgV0lGSV9DT05ORUNUSU9OX1NFVFRJTkdfQUNUSU9OID0gYCR7U0VUVElOR1NfSEVMUEVSX0lEfS53aWZpYDtcbmNvbnN0IERBVEFfQ09OTkVDVElPTl9TRVRUSU5HX1JFQ0VJVkVSID0gYCR7U0VUVElOR1NfSEVMUEVSX0lEfS8ucmVjZWl2ZXJzLkRhdGFDb25uZWN0aW9uU2V0dGluZ1JlY2VpdmVyYDtcbmNvbnN0IERBVEFfQ09OTkVDVElPTl9TRVRUSU5HX0FDVElPTiA9IGAke1NFVFRJTkdTX0hFTFBFUl9JRH0uZGF0YV9jb25uZWN0aW9uYDtcbmNvbnN0IEFOSU1BVElPTl9TRVRUSU5HX1JFQ0VJVkVSID0gYCR7U0VUVElOR1NfSEVMUEVSX0lEfS8ucmVjZWl2ZXJzLkFuaW1hdGlvblNldHRpbmdSZWNlaXZlcmA7XG5jb25zdCBBTklNQVRJT05fU0VUVElOR19BQ1RJT04gPSBgJHtTRVRUSU5HU19IRUxQRVJfSUR9LmFuaW1hdGlvbmA7XG5jb25zdCBMT0NBTEVfU0VUVElOR19SRUNFSVZFUiA9IGAke1NFVFRJTkdTX0hFTFBFUl9JRH0vLnJlY2VpdmVycy5Mb2NhbGVTZXR0aW5nUmVjZWl2ZXJgO1xuY29uc3QgTE9DQUxFX1NFVFRJTkdfQUNUSU9OID0gYCR7U0VUVElOR1NfSEVMUEVSX0lEfS5sb2NhbGVgO1xuY29uc3QgTE9DQVRJT05fU0VSVklDRSA9IGAke1NFVFRJTkdTX0hFTFBFUl9JRH0vLkxvY2F0aW9uU2VydmljZWA7XG5jb25zdCBMT0NBVElPTl9SRUNFSVZFUiA9IGAke1NFVFRJTkdTX0hFTFBFUl9JRH0vLnJlY2VpdmVycy5Mb2NhdGlvbkluZm9SZWNlaXZlcmA7XG5jb25zdCBMT0NBVElPTl9SRVRSSUVWQUxfQUNUSU9OID0gYCR7U0VUVElOR1NfSEVMUEVSX0lEfS5sb2NhdGlvbmA7XG5jb25zdCBBUFBJVU1fSU1FID0gYCR7U0VUVElOR1NfSEVMUEVSX0lEfS8uQXBwaXVtSU1FYDtcbmNvbnN0IE1BWF9TSEVMTF9CVUZGRVJfTEVOR1RIID0gMTAwMDtcblxubGV0IG1ldGhvZHMgPSB7fTtcblxuLyoqXG4gKiBHZXQgdGhlIHBhdGggdG8gYWRiIGV4ZWN1dGFibGUgYW1kIGFzc2lnbiBpdFxuICogdG8gdGhpcy5leGVjdXRhYmxlLnBhdGggYW5kIHRoaXMuYmluYXJpZXMuYWRiIHByb3BlcnRpZXMuXG4gKlxuICogQHJldHVybiB7c3RyaW5nfSBGdWxsIHBhdGggdG8gYWRiIGV4ZWN1dGFibGUuXG4gKi9cbm1ldGhvZHMuZ2V0QWRiV2l0aENvcnJlY3RBZGJQYXRoID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICB0aGlzLmV4ZWN1dGFibGUucGF0aCA9IGF3YWl0IHRoaXMuZ2V0U2RrQmluYXJ5UGF0aChcImFkYlwiKTtcbiAgdGhpcy5iaW5hcmllcy5hZGIgPSB0aGlzLmV4ZWN1dGFibGUucGF0aDtcbiAgcmV0dXJuIHRoaXMuYWRiO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGZ1bGwgcGF0aCB0byBhYXB0IHRvb2wgYW5kIGFzc2lnbiBpdCB0b1xuICogdGhpcy5iaW5hcmllcy5hYXB0IHByb3BlcnR5XG4gKi9cbm1ldGhvZHMuaW5pdEFhcHQgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuYmluYXJpZXMuYWFwdCA9IGF3YWl0IHRoaXMuZ2V0U2RrQmluYXJ5UGF0aChcImFhcHRcIik7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgZnVsbCBwYXRoIHRvIHppcGFsaWduIHRvb2wgYW5kIGFzc2lnbiBpdCB0b1xuICogdGhpcy5iaW5hcmllcy56aXBhbGlnbiBwcm9wZXJ0eVxuICovXG5tZXRob2RzLmluaXRaaXBBbGlnbiA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5iaW5hcmllcy56aXBhbGlnbiA9IGF3YWl0IHRoaXMuZ2V0U2RrQmluYXJ5UGF0aChcInppcGFsaWduXCIpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGZ1bGwgcGF0aCB0byBidW5kbGV0b29sIGJpbmFyeSBhbmQgYXNzaWduIGl0IHRvXG4gKiB0aGlzLmJpbmFyaWVzLmJ1bmRsZXRvb2wgcHJvcGVydHlcbiAqL1xubWV0aG9kcy5pbml0QnVuZGxldG9vbCA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgdHJ5IHtcbiAgICB0aGlzLmJpbmFyaWVzLmJ1bmRsZXRvb2wgPSBhd2FpdCBmcy53aGljaCgnYnVuZGxldG9vbC5qYXInKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdidW5kbGV0b29sLmphciBiaW5hcnkgaXMgZXhwZWN0ZWQgdG8gYmUgcHJlc2VudCBpbiBQQVRILiAnICtcbiAgICAgICdWaXNpdCBodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xlL2J1bmRsZXRvb2wgZm9yIG1vcmUgZGV0YWlscy4nKTtcbiAgfVxufTtcblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgQVBJIGxldmVsIG9mIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBBUEkgbGV2ZWwgYXMgaW50ZWdlciBudW1iZXIsIGZvciBleGFtcGxlIDIxIGZvclxuICogICAgICAgICAgICAgICAgICBBbmRyb2lkIExvbGxpcG9wLiBUaGUgcmVzdWx0IG9mIHRoaXMgbWV0aG9kIGlzIGNhY2hlZCwgc28gYWxsIHRoZSBmdXJ0aGVyXG4gKiBjYWxscyByZXR1cm4gdGhlIHNhbWUgdmFsdWUgYXMgdGhlIGZpcnN0IG9uZS5cbiAqL1xubWV0aG9kcy5nZXRBcGlMZXZlbCA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgaWYgKCFfLmlzSW50ZWdlcih0aGlzLl9hcGlMZXZlbCkpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc3RyT3V0cHV0ID0gYXdhaXQgdGhpcy5nZXREZXZpY2VQcm9wZXJ0eSgncm8uYnVpbGQudmVyc2lvbi5zZGsnKTtcbiAgICAgIHRoaXMuX2FwaUxldmVsID0gcGFyc2VJbnQoc3RyT3V0cHV0LnRyaW0oKSwgMTApO1xuICAgICAgaWYgKGlzTmFOKHRoaXMuX2FwaUxldmVsKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFRoZSBhY3R1YWwgb3V0cHV0IFwiJHtzdHJPdXRwdXR9XCIgY2Fubm90IGJlIGNvbnZlcnRlZCB0byBhbiBpbnRlZ2VyYCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciBnZXR0aW5nIGRldmljZSBBUEkgbGV2ZWwuIE9yaWdpbmFsIGVycm9yOiAke2UubWVzc2FnZX1gKTtcbiAgICB9XG4gIH1cbiAgbG9nLmRlYnVnKGBEZXZpY2UgQVBJIGxldmVsOiAke3RoaXMuX2FwaUxldmVsfWApO1xuICByZXR1cm4gdGhpcy5fYXBpTGV2ZWw7XG59O1xuXG4vKipcbiAqIFJldHJpZXZlIHRoZSBwbGF0Zm9ybSB2ZXJzaW9uIG9mIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBwbGF0Zm9ybSB2ZXJzaW9uIGFzIGEgc3RyaW5nLCBmb3IgZXhhbXBsZSAnNS4wJyBmb3JcbiAqIEFuZHJvaWQgTG9sbGlwb3AuXG4gKi9cbm1ldGhvZHMuZ2V0UGxhdGZvcm1WZXJzaW9uID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICBsb2cuaW5mbyhcIkdldHRpbmcgZGV2aWNlIHBsYXRmb3JtIHZlcnNpb25cIik7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0RGV2aWNlUHJvcGVydHkoJ3JvLmJ1aWxkLnZlcnNpb24ucmVsZWFzZScpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciBnZXR0aW5nIGRldmljZSBwbGF0Zm9ybSB2ZXJzaW9uLiBPcmlnaW5hbCBlcnJvcjogJHtlLm1lc3NhZ2V9YCk7XG4gIH1cbn07XG5cbi8qKlxuICogVmVyaWZ5IHdoZXRoZXIgYSBkZXZpY2UgaXMgY29ubmVjdGVkLlxuICpcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgYXQgbGVhc3Qgb25lIGRldmljZSBpcyB2aXNpYmxlIHRvIGFkYi5cbiAqL1xubWV0aG9kcy5pc0RldmljZUNvbm5lY3RlZCA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgbGV0IGRldmljZXMgPSBhd2FpdCB0aGlzLmdldENvbm5lY3RlZERldmljZXMoKTtcbiAgcmV0dXJuIGRldmljZXMubGVuZ3RoID4gMDtcbn07XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgY3JlYXRlIGEgbmV3IGZvbGRlciBvbiB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHJlbW90ZVBhdGggLSBUaGUgbmV3IHBhdGggdG8gYmUgY3JlYXRlZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gbWtkaXIgY29tbWFuZCBvdXRwdXQuXG4gKi9cbm1ldGhvZHMubWtkaXIgPSBhc3luYyBmdW5jdGlvbiAocmVtb3RlUGF0aCkge1xuICByZXR1cm4gYXdhaXQgdGhpcy5zaGVsbChbJ21rZGlyJywgJy1wJywgcmVtb3RlUGF0aF0pO1xufTtcblxuLyoqXG4gKiBWZXJpZnkgd2hldGhlciB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYVxuICogdmFsaWQgY2xhc3MgbmFtZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NTdHJpbmcgLSBUaGUgYWN0dWFsIGNsYXNzIG5hbWUgdG8gYmUgdmVyaWZpZWQuXG4gKiBAcmV0dXJuIHs/QXJyYXkuPE1hdGNoPn0gVGhlIHJlc3VsdCBvZiBSZWdleHAuZXhlYyBvcGVyYXRpb25cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICBvciBfbnVsbF8gaWYgbm8gbWF0Y2hlcyBhcmUgZm91bmQuXG4gKi9cbm1ldGhvZHMuaXNWYWxpZENsYXNzID0gZnVuY3Rpb24gKGNsYXNzU3RyaW5nKSB7XG4gIC8vIHNvbWUucGFja2FnZS9zb21lLnBhY2thZ2UuQWN0aXZpdHlcbiAgcmV0dXJuIG5ldyBSZWdFeHAoL15bYS16QS1aMC05Li9fXSskLykuZXhlYyhjbGFzc1N0cmluZyk7XG59O1xuXG4vKipcbiAqIEZvcmNlIGFwcGxpY2F0aW9uIHRvIHN0b3Agb24gdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwa2cgLSBUaGUgcGFja2FnZSBuYW1lIHRvIGJlIHN0b3BwZWQuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBvdXRwdXQgb2YgdGhlIGNvcnJlc3BvbmRpbmcgYWRiIGNvbW1hbmQuXG4gKi9cbm1ldGhvZHMuZm9yY2VTdG9wID0gYXN5bmMgZnVuY3Rpb24gKHBrZykge1xuICByZXR1cm4gYXdhaXQgdGhpcy5zaGVsbChbJ2FtJywgJ2ZvcmNlLXN0b3AnLCBwa2ddKTtcbn07XG5cbi8qXG4gKiBLaWxsIGFwcGxpY2F0aW9uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHBrZyAtIFRoZSBwYWNrYWdlIG5hbWUgdG8gYmUgc3RvcHBlZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gVGhlIG91dHB1dCBvZiB0aGUgY29ycmVzcG9uZGluZyBhZGIgY29tbWFuZC5cbiAqL1xubWV0aG9kcy5raWxsUGFja2FnZSA9IGFzeW5jIGZ1bmN0aW9uIGtpbGxQYWNrYWdlIChwa2cpIHtcbiAgcmV0dXJuIGF3YWl0IHRoaXMuc2hlbGwoWydhbScsICdraWxsJywgcGtnXSk7XG59O1xuXG4vKipcbiAqIENsZWFyIHRoZSB1c2VyIGRhdGEgb2YgdGhlIHBhcnRpY3VsYXIgYXBwbGljYXRpb24gb24gdGhlIGRldmljZVxuICogdW5kZXIgdGVzdC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGtnIC0gVGhlIHBhY2thZ2UgbmFtZSB0byBiZSBjbGVhcmVkLlxuICogQHJldHVybiB7c3RyaW5nfSBUaGUgb3V0cHV0IG9mIHRoZSBjb3JyZXNwb25kaW5nIGFkYiBjb21tYW5kLlxuICovXG5tZXRob2RzLmNsZWFyID0gYXN5bmMgZnVuY3Rpb24gKHBrZykge1xuICByZXR1cm4gYXdhaXQgdGhpcy5zaGVsbChbJ3BtJywgJ2NsZWFyJywgcGtnXSk7XG59O1xuXG4vKipcbiAqIEdyYW50IGFsbCBwZXJtaXNzaW9ucyByZXF1ZXN0ZWQgYnkgdGhlIHBhcnRpY3VsYXIgcGFja2FnZS5cbiAqIFRoaXMgbWV0aG9kIGlzIG9ubHkgdXNlZnVsIG9uIEFuZHJvaWQgNi4wKyBhbmQgZm9yIGFwcGxpY2F0aW9uc1xuICogdGhhdCBzdXBwb3J0IGNvbXBvbmVudHMtYmFzZWQgcGVybWlzc2lvbnMgc2V0dGluZy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGtnIC0gVGhlIHBhY2thZ2UgbmFtZSB0byBiZSBwcm9jZXNzZWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gYXBrIC0gVGhlIHBhdGggdG8gdGhlIGFjdHVhbCBhcGsgZmlsZS5cbiAqIEByZXR1cm4ge3N0cmluZ3xib29sZWFufSBUaGUgb3V0cHV0IG9mIHRoZSBjb3JyZXNwb25kaW5nIGFkYiBjb21tYW5kXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgb3IgX2ZhbHNlXyBpZiB0aGVyZSB3YXMgYW4gZXJyb3IgZHVyaW5nIGNvbW1hbmQgZXhlY3V0aW9uLlxuICovXG5tZXRob2RzLmdyYW50QWxsUGVybWlzc2lvbnMgPSBhc3luYyBmdW5jdGlvbiAocGtnLCBhcGspIHtcbiAgbGV0IGFwaUxldmVsID0gYXdhaXQgdGhpcy5nZXRBcGlMZXZlbCgpO1xuICBsZXQgdGFyZ2V0U2RrID0gMDtcbiAgbGV0IGR1bXBzeXNPdXRwdXQgPSBudWxsO1xuICB0cnkge1xuICAgIGlmICghYXBrKSB7XG4gICAgICAvKipcbiAgICAgICAqIElmIGFwayBub3QgcHJvdmlkZWQsIGNvbnNpZGVyaW5nIGFwayBhbHJlYWR5IGluc3RhbGxlZCBvbiB0aGUgZGV2aWNlXG4gICAgICAgKiBhbmQgZmV0Y2hpbmcgdGFyZ2V0U2RrIHVzaW5nIHBhY2thZ2UgbmFtZS5cbiAgICAgICAqL1xuICAgICAgZHVtcHN5c091dHB1dCA9IGF3YWl0IHRoaXMuc2hlbGwoWydkdW1wc3lzJywgJ3BhY2thZ2UnLCBwa2ddKTtcbiAgICAgIHRhcmdldFNkayA9IGF3YWl0IHRoaXMudGFyZ2V0U2RrVmVyc2lvblVzaW5nUEtHKHBrZywgZHVtcHN5c091dHB1dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRhcmdldFNkayA9IGF3YWl0IHRoaXMudGFyZ2V0U2RrVmVyc2lvbkZyb21NYW5pZmVzdChhcGspO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vYXZvaWRpbmcgbG9nZ2luZyBlcnJvciBzdGFjaywgYXMgY2FsbGluZyBsaWJyYXJ5IGZ1bmN0aW9uIHdvdWxkIGhhdmUgbG9nZ2VkXG4gICAgbG9nLndhcm4oYFJhbiBpbnRvIHByb2JsZW0gZ2V0dGluZyB0YXJnZXQgU0RLIHZlcnNpb247IGlnbm9yaW5nLi4uYCk7XG4gIH1cbiAgaWYgKGFwaUxldmVsID49IDIzICYmIHRhcmdldFNkayA+PSAyMykge1xuICAgIC8qKlxuICAgICAqIElmIHRoZSBkZXZpY2UgaXMgcnVubmluZyBBbmRyb2lkIDYuMChBUEkgMjMpIG9yIGhpZ2hlciwgYW5kIHlvdXIgYXBwJ3MgdGFyZ2V0IFNESyBpcyAyMyBvciBoaWdoZXI6XG4gICAgICogVGhlIGFwcCBoYXMgdG8gbGlzdCB0aGUgcGVybWlzc2lvbnMgaW4gdGhlIG1hbmlmZXN0LlxuICAgICAqIHJlZmVyOiBodHRwczovL2RldmVsb3Blci5hbmRyb2lkLmNvbS90cmFpbmluZy9wZXJtaXNzaW9ucy9yZXF1ZXN0aW5nLmh0bWxcbiAgICAgKi9cbiAgICBkdW1wc3lzT3V0cHV0ID0gZHVtcHN5c091dHB1dCB8fCBhd2FpdCB0aGlzLnNoZWxsKFsnZHVtcHN5cycsICdwYWNrYWdlJywgcGtnXSk7XG4gICAgY29uc3QgcmVxdWVzdGVkUGVybWlzc2lvbnMgPSBhd2FpdCB0aGlzLmdldFJlcVBlcm1pc3Npb25zKHBrZywgZHVtcHN5c091dHB1dCk7XG4gICAgY29uc3QgZ3JhbnRlZFBlcm1pc3Npb25zID0gYXdhaXQgdGhpcy5nZXRHcmFudGVkUGVybWlzc2lvbnMocGtnLCBkdW1wc3lzT3V0cHV0KTtcbiAgICBjb25zdCBwZXJtaXNzaW9uc1RvR3JhbnQgPSBfLmRpZmZlcmVuY2UocmVxdWVzdGVkUGVybWlzc2lvbnMsIGdyYW50ZWRQZXJtaXNzaW9ucyk7XG4gICAgaWYgKF8uaXNFbXB0eShwZXJtaXNzaW9uc1RvR3JhbnQpKSB7XG4gICAgICBsb2cuaW5mbyhgJHtwa2d9IGNvbnRhaW5zIG5vIHBlcm1pc3Npb25zIGF2YWlsYWJsZSBmb3IgZ3JhbnRpbmdgKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvLyBBcyBpdCBjb25zdW1lcyBtb3JlIHRpbWUgZm9yIGdyYW50aW5nIGVhY2ggcGVybWlzc2lvbixcbiAgICAvLyB0cnlpbmcgdG8gZ3JhbnQgYWxsIHBlcm1pc3Npb24gYnkgZm9ybWluZyBlcXVpdmFsZW50IGNvbW1hbmQuXG4gICAgLy8gQWxzbywgaXQgaXMgbmVjZXNzYXJ5IHRvIHNwbGl0IGxvbmcgY29tbWFuZHMgaW50byBjaHVua3MsIHNpbmNlIHRoZSBtYXhpbXVtIGxlbmd0aCBvZlxuICAgIC8vIGFkYiBzaGVsbCBidWZmZXIgaXMgbGltaXRlZFxuICAgIGxldCBjbWRzID0gW107XG4gICAgbGV0IGNtZENodW5rID0gW107XG4gICAgZm9yIChsZXQgcGVybWlzc2lvbiBvZiBwZXJtaXNzaW9uc1RvR3JhbnQpIHtcbiAgICAgIGNvbnN0IG5leHRDbWQgPSBbJ3BtJywgJ2dyYW50JywgcGtnLCBwZXJtaXNzaW9uLCAnOyddO1xuICAgICAgaWYgKG5leHRDbWQuam9pbignICcpLmxlbmd0aCArIGNtZENodW5rLmpvaW4oJyAnKS5sZW5ndGggPj0gTUFYX1NIRUxMX0JVRkZFUl9MRU5HVEgpIHtcbiAgICAgICAgY21kcy5wdXNoKGNtZENodW5rKTtcbiAgICAgICAgY21kQ2h1bmsgPSBbXTtcbiAgICAgIH1cbiAgICAgIGNtZENodW5rID0gY21kQ2h1bmsuY29uY2F0KG5leHRDbWQpO1xuICAgIH1cbiAgICBpZiAoY21kQ2h1bmsubGVuZ3RoKSB7XG4gICAgICBjbWRzLnB1c2goY21kQ2h1bmspO1xuICAgIH1cbiAgICBsb2cuZGVidWcoYEdvdCB0aGUgZm9sbG93aW5nIGNvbW1hbmQgY2h1bmtzIHRvIGV4ZWN1dGU6ICR7Y21kc31gKTtcbiAgICBsZXQgcmVzdWx0ID0gdHJ1ZTtcbiAgICBsZXQgbGFzdEVycm9yID0gbnVsbDtcbiAgICBmb3IgKGxldCBjbWQgb2YgY21kcykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5zaGVsbChjbWQpICYmIHJlc3VsdDtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gdGhpcyBpcyB0byBnaXZlIHRoZSBtZXRob2QgYSBjaGFuY2UgdG8gYXNzaWduIGFsbCB0aGUgcmVxdWVzdGVkIHBlcm1pc3Npb25zXG4gICAgICAgIC8vIGJlZm9yZSB0byBxdWl0IGluIGNhc2Ugd2UnZCBsaWtlIHRvIGlnbm9yZSB0aGUgZXJyb3Igb24gdGhlIGhpZ2hlciBsZXZlbFxuICAgICAgICBsYXN0RXJyb3IgPSBlO1xuICAgICAgICByZXN1bHQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGxhc3RFcnJvcikge1xuICAgICAgdGhyb3cgbGFzdEVycm9yO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59O1xuXG4vKipcbiAqIEdyYW50IHNpbmdsZSBwZXJtaXNzaW9uIGZvciB0aGUgcGFydGljdWxhciBwYWNrYWdlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwa2cgLSBUaGUgcGFja2FnZSBuYW1lIHRvIGJlIHByb2Nlc3NlZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBwZXJtaXNzaW9uIC0gVGhlIGZ1bGwgbmFtZSBvZiB0aGUgcGVybWlzc2lvbiB0byBiZSBncmFudGVkLlxuICogQHRocm93cyB7RXJyb3J9IElmIHRoZXJlIHdhcyBhbiBlcnJvciB3aGlsZSBjaGFuZ2luZyBwZXJtaXNzaW9ucy5cbiAqL1xubWV0aG9kcy5ncmFudFBlcm1pc3Npb24gPSBhc3luYyBmdW5jdGlvbiAocGtnLCBwZXJtaXNzaW9uKSB7XG4gIHRyeSB7XG4gICAgYXdhaXQgdGhpcy5zaGVsbChbJ3BtJywgJ2dyYW50JywgcGtnLCBwZXJtaXNzaW9uXSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKCFlcnJvci5tZXNzYWdlLmluY2x1ZGVzKFwibm90IGEgY2hhbmdlYWJsZSBwZXJtaXNzaW9uIHR5cGVcIikpIHtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBSZXZva2Ugc2luZ2xlIHBlcm1pc3Npb24gZnJvbSB0aGUgcGFydGljdWxhciBwYWNrYWdlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwa2cgLSBUaGUgcGFja2FnZSBuYW1lIHRvIGJlIHByb2Nlc3NlZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBwZXJtaXNzaW9uIC0gVGhlIGZ1bGwgbmFtZSBvZiB0aGUgcGVybWlzc2lvbiB0byBiZSByZXZva2VkLlxuICogQHRocm93cyB7RXJyb3J9IElmIHRoZXJlIHdhcyBhbiBlcnJvciB3aGlsZSBjaGFuZ2luZyBwZXJtaXNzaW9ucy5cbiAqL1xubWV0aG9kcy5yZXZva2VQZXJtaXNzaW9uID0gYXN5bmMgZnVuY3Rpb24gKHBrZywgcGVybWlzc2lvbikge1xuICB0cnkge1xuICAgIGF3YWl0IHRoaXMuc2hlbGwoWydwbScsICdyZXZva2UnLCBwa2csIHBlcm1pc3Npb25dKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBpZiAoIWVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoXCJub3QgYSBjaGFuZ2VhYmxlIHBlcm1pc3Npb24gdHlwZVwiKSkge1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIFJldHJpZXZlIHRoZSBsaXN0IG9mIGdyYW50ZWQgcGVybWlzc2lvbnMgZm9yIHRoZSBwYXJ0aWN1bGFyIHBhY2thZ2UuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHBrZyAtIFRoZSBwYWNrYWdlIG5hbWUgdG8gYmUgcHJvY2Vzc2VkLlxuICogQHBhcmFtIHtzdHJpbmd9IGNtZE91dHB1dCBbbnVsbF0gLSBPcHRpb25hbCBwYXJhbWV0ZXIgY29udGFpbmluZyBjb21tYW5kIG91dHB1dCBvZlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZHVtcHN5cyBwYWNrYWdlXyBjb21tYW5kLiBJdCBtYXkgc3BlZWQgdXAgdGhlIG1ldGhvZCBleGVjdXRpb24uXG4gKiBAcmV0dXJuIHtBcnJheTxTdHJpbmc+fSBUaGUgbGlzdCBvZiBncmFudGVkIHBlcm1pc3Npb25zIG9yIGFuIGVtcHR5IGxpc3QuXG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYgdGhlcmUgd2FzIGFuIGVycm9yIHdoaWxlIGNoYW5naW5nIHBlcm1pc3Npb25zLlxuICovXG5tZXRob2RzLmdldEdyYW50ZWRQZXJtaXNzaW9ucyA9IGFzeW5jIGZ1bmN0aW9uIChwa2csIGNtZE91dHB1dCA9IG51bGwpIHtcbiAgbG9nLmRlYnVnKCdSZXRyaWV2aW5nIGdyYW50ZWQgcGVybWlzc2lvbnMnKTtcbiAgY29uc3Qgc3Rkb3V0ID0gY21kT3V0cHV0IHx8IGF3YWl0IHRoaXMuc2hlbGwoWydkdW1wc3lzJywgJ3BhY2thZ2UnLCBwa2ddKTtcbiAgcmV0dXJuIGV4dHJhY3RNYXRjaGluZ1Blcm1pc3Npb25zKHN0ZG91dCwgWydpbnN0YWxsJywgJ3J1bnRpbWUnXSwgdHJ1ZSk7XG59O1xuXG4vKipcbiAqIFJldHJpZXZlIHRoZSBsaXN0IG9mIGRlbmllZCBwZXJtaXNzaW9ucyBmb3IgdGhlIHBhcnRpY3VsYXIgcGFja2FnZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGtnIC0gVGhlIHBhY2thZ2UgbmFtZSB0byBiZSBwcm9jZXNzZWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gY21kT3V0cHV0IFtudWxsXSAtIE9wdGlvbmFsIHBhcmFtZXRlciBjb250YWluaW5nIGNvbW1hbmQgb3V0cHV0IG9mXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9kdW1wc3lzIHBhY2thZ2VfIGNvbW1hbmQuIEl0IG1heSBzcGVlZCB1cCB0aGUgbWV0aG9kIGV4ZWN1dGlvbi5cbiAqIEByZXR1cm4ge0FycmF5PFN0cmluZz59IFRoZSBsaXN0IG9mIGRlbmllZCBwZXJtaXNzaW9ucyBvciBhbiBlbXB0eSBsaXN0LlxuICovXG5tZXRob2RzLmdldERlbmllZFBlcm1pc3Npb25zID0gYXN5bmMgZnVuY3Rpb24gKHBrZywgY21kT3V0cHV0ID0gbnVsbCkge1xuICBsb2cuZGVidWcoJ1JldHJpZXZpbmcgZGVuaWVkIHBlcm1pc3Npb25zJyk7XG4gIGNvbnN0IHN0ZG91dCA9IGNtZE91dHB1dCB8fCBhd2FpdCB0aGlzLnNoZWxsKFsnZHVtcHN5cycsICdwYWNrYWdlJywgcGtnXSk7XG4gIHJldHVybiBleHRyYWN0TWF0Y2hpbmdQZXJtaXNzaW9ucyhzdGRvdXQsIFsnaW5zdGFsbCcsICdydW50aW1lJ10sIGZhbHNlKTtcbn07XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIGxpc3Qgb2YgcmVxdWVzdGVkIHBlcm1pc3Npb25zIGZvciB0aGUgcGFydGljdWxhciBwYWNrYWdlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwa2cgLSBUaGUgcGFja2FnZSBuYW1lIHRvIGJlIHByb2Nlc3NlZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBjbWRPdXRwdXQgW251bGxdIC0gT3B0aW9uYWwgcGFyYW1ldGVyIGNvbnRhaW5pbmcgY29tbWFuZCBvdXRwdXQgb2ZcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX2R1bXBzeXMgcGFja2FnZV8gY29tbWFuZC4gSXQgbWF5IHNwZWVkIHVwIHRoZSBtZXRob2QgZXhlY3V0aW9uLlxuICogQHJldHVybiB7QXJyYXk8U3RyaW5nPn0gVGhlIGxpc3Qgb2YgcmVxdWVzdGVkIHBlcm1pc3Npb25zIG9yIGFuIGVtcHR5IGxpc3QuXG4gKi9cbm1ldGhvZHMuZ2V0UmVxUGVybWlzc2lvbnMgPSBhc3luYyBmdW5jdGlvbiAocGtnLCBjbWRPdXRwdXQgPSBudWxsKSB7XG4gIGxvZy5kZWJ1ZygnUmV0cmlldmluZyByZXF1ZXN0ZWQgcGVybWlzc2lvbnMnKTtcbiAgY29uc3Qgc3Rkb3V0ID0gY21kT3V0cHV0IHx8IGF3YWl0IHRoaXMuc2hlbGwoWydkdW1wc3lzJywgJ3BhY2thZ2UnLCBwa2ddKTtcbiAgcmV0dXJuIGV4dHJhY3RNYXRjaGluZ1Blcm1pc3Npb25zKHN0ZG91dCwgWydyZXF1ZXN0ZWQnXSk7XG59O1xuXG4vKipcbiAqIFJldHJpZXZlIHRoZSBsaXN0IG9mIGxvY2F0aW9uIHByb3ZpZGVycyBmb3IgdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEByZXR1cm4ge0FycmF5LjxTdHJpbmc+fSBUaGUgbGlzdCBvZiBhdmFpbGFibGUgbG9jYXRpb24gcHJvdmlkZXJzIG9yIGFuIGVtcHR5IGxpc3QuXG4gKi9cbm1ldGhvZHMuZ2V0TG9jYXRpb25Qcm92aWRlcnMgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gIGxldCBzdGRvdXQgPSBhd2FpdCB0aGlzLmdldFNldHRpbmcoJ3NlY3VyZScsICdsb2NhdGlvbl9wcm92aWRlcnNfYWxsb3dlZCcpO1xuICByZXR1cm4gc3Rkb3V0LnRyaW0oKS5zcGxpdCgnLCcpXG4gICAgLm1hcCgocCkgPT4gcC50cmltKCkpXG4gICAgLmZpbHRlcihCb29sZWFuKTtcbn07XG5cbi8qKlxuICogVG9nZ2xlIHRoZSBzdGF0ZSBvZiBHUFMgbG9jYXRpb24gcHJvdmlkZXIuXG4gKlxuICogQHBhcmFtIHtib29sZWFufSBlbmFibGVkIC0gV2hldGhlciB0byBlbmFibGUgKHRydWUpIG9yIGRpc2FibGUgKGZhbHNlKSB0aGUgR1BTIHByb3ZpZGVyLlxuICovXG5tZXRob2RzLnRvZ2dsZUdQU0xvY2F0aW9uUHJvdmlkZXIgPSBhc3luYyBmdW5jdGlvbiAoZW5hYmxlZCkge1xuICBhd2FpdCB0aGlzLnNldFNldHRpbmcoJ3NlY3VyZScsICdsb2NhdGlvbl9wcm92aWRlcnNfYWxsb3dlZCcsIGAke2VuYWJsZWQgPyBcIitcIiA6IFwiLVwifWdwc2ApO1xufTtcblxuLyoqXG4gKiBTZXQgaGlkZGVuIGFwaSBwb2xpY3kgdG8gbWFuYWdlIGFjY2VzcyB0byBub24tU0RLIEFQSXMuXG4gKiBodHRwczovL2RldmVsb3Blci5hbmRyb2lkLmNvbS9wcmV2aWV3L3Jlc3RyaWN0aW9ucy1ub24tc2RrLWludGVyZmFjZXNcbiAqXG4gKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IHZhbHVlIC0gVGhlIEFQSSBlbmZvcmNlbWVudCBwb2xpY3kuXG4gKiAgICAgMDogRGlzYWJsZSBub24tU0RLIEFQSSB1c2FnZSBkZXRlY3Rpb24uIFRoaXMgd2lsbCBhbHNvIGRpc2FibGUgbG9nZ2luZywgYW5kIGFsc28gYnJlYWsgdGhlIHN0cmljdCBtb2RlIEFQSSxcbiAqICAgICAgICBkZXRlY3ROb25TZGtBcGlVc2FnZSgpLiBOb3QgcmVjb21tZW5kZWQuXG4gKiAgICAgMTogXCJKdXN0IHdhcm5cIiAtIHBlcm1pdCBhY2Nlc3MgdG8gYWxsIG5vbi1TREsgQVBJcywgYnV0IGtlZXAgd2FybmluZ3MgaW4gdGhlIGxvZy5cbiAqICAgICAgICBUaGUgc3RyaWN0IG1vZGUgQVBJIHdpbGwga2VlcCB3b3JraW5nLlxuICogICAgIDI6IERpc2FsbG93IHVzYWdlIG9mIGRhcmsgZ3JleSBhbmQgYmxhY2sgbGlzdGVkIEFQSXMuXG4gKiAgICAgMzogRGlzYWxsb3cgdXNhZ2Ugb2YgYmxhY2tsaXN0ZWQgQVBJcywgYnV0IGFsbG93IHVzYWdlIG9mIGRhcmsgZ3JleSBsaXN0ZWQgQVBJcy5cbiAqL1xubWV0aG9kcy5zZXRIaWRkZW5BcGlQb2xpY3kgPSBhc3luYyBmdW5jdGlvbiAodmFsdWUpIHtcbiAgYXdhaXQgdGhpcy5zZXRTZXR0aW5nKCdnbG9iYWwnLCAnaGlkZGVuX2FwaV9wb2xpY3lfcHJlX3BfYXBwcycsIHZhbHVlKTtcbiAgYXdhaXQgdGhpcy5zZXRTZXR0aW5nKCdnbG9iYWwnLCAnaGlkZGVuX2FwaV9wb2xpY3lfcF9hcHBzJywgdmFsdWUpO1xufTtcblxuLyoqXG4gKiBSZXNldCBhY2Nlc3MgdG8gbm9uLVNESyBBUElzIHRvIGl0cyBkZWZhdWx0IHNldHRpbmcuXG4gKiBodHRwczovL2RldmVsb3Blci5hbmRyb2lkLmNvbS9wcmV2aWV3L3Jlc3RyaWN0aW9ucy1ub24tc2RrLWludGVyZmFjZXNcbiAqL1xubWV0aG9kcy5zZXREZWZhdWx0SGlkZGVuQXBpUG9saWN5ID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICBhd2FpdCB0aGlzLnNoZWxsKFsnc2V0dGluZ3MnLCAnZGVsZXRlJywgJ2dsb2JhbCcsICdoaWRkZW5fYXBpX3BvbGljeV9wcmVfcF9hcHBzJ10pO1xuICBhd2FpdCB0aGlzLnNoZWxsKFsnc2V0dGluZ3MnLCAnZGVsZXRlJywgJ2dsb2JhbCcsICdoaWRkZW5fYXBpX3BvbGljeV9wX2FwcHMnXSk7XG59O1xuXG4vKipcbiAqIFN0b3AgdGhlIHBhcnRpY3VsYXIgcGFja2FnZSBpZiBpdCBpcyBydW5uaW5nIGFuZCBjbGVhcnMgaXRzIGFwcGxpY2F0aW9uIGRhdGEuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHBrZyAtIFRoZSBwYWNrYWdlIG5hbWUgdG8gYmUgcHJvY2Vzc2VkLlxuICovXG5tZXRob2RzLnN0b3BBbmRDbGVhciA9IGFzeW5jIGZ1bmN0aW9uIChwa2cpIHtcbiAgdHJ5IHtcbiAgICBhd2FpdCB0aGlzLmZvcmNlU3RvcChwa2cpO1xuICAgIGF3YWl0IHRoaXMuY2xlYXIocGtnKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IHN0b3AgYW5kIGNsZWFyICR7cGtnfS4gT3JpZ2luYWwgZXJyb3I6ICR7ZS5tZXNzYWdlfWApO1xuICB9XG59O1xuXG4vKipcbiAqIFJldHJpZXZlIHRoZSBsaXN0IG9mIGF2YWlsYWJsZSBpbnB1dCBtZXRob2RzIChJTUVzKSBmb3IgdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEByZXR1cm4ge0FycmF5LjxTdHJpbmc+fSBUaGUgbGlzdCBvZiBJTUUgbmFtZXMgb3IgYW4gZW1wdHkgbGlzdC5cbiAqL1xubWV0aG9kcy5hdmFpbGFibGVJTUVzID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICB0cnkge1xuICAgIHJldHVybiBnZXRJTUVMaXN0RnJvbU91dHB1dChhd2FpdCB0aGlzLnNoZWxsKFsnaW1lJywgJ2xpc3QnLCAnLWEnXSkpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciBnZXR0aW5nIGF2YWlsYWJsZSBJTUUncy4gT3JpZ2luYWwgZXJyb3I6ICR7ZS5tZXNzYWdlfWApO1xuICB9XG59O1xuXG4vKipcbiAqIFJldHJpZXZlIHRoZSBsaXN0IG9mIGVuYWJsZWQgaW5wdXQgbWV0aG9kcyAoSU1FcykgZm9yIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcmV0dXJuIHtBcnJheS48U3RyaW5nPn0gVGhlIGxpc3Qgb2YgZW5hYmxlZCBJTUUgbmFtZXMgb3IgYW4gZW1wdHkgbGlzdC5cbiAqL1xubWV0aG9kcy5lbmFibGVkSU1FcyA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZ2V0SU1FTGlzdEZyb21PdXRwdXQoYXdhaXQgdGhpcy5zaGVsbChbJ2ltZScsICdsaXN0J10pKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgZ2V0dGluZyBlbmFibGVkIElNRSdzLiBPcmlnaW5hbCBlcnJvcjogJHtlLm1lc3NhZ2V9YCk7XG4gIH1cbn07XG5cbi8qKlxuICogRW5hYmxlIHRoZSBwYXJ0aWN1bGFyIGlucHV0IG1ldGhvZCBvbiB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGltZUlkIC0gT25lIG9mIGV4aXN0aW5nIElNRSBpZHMuXG4gKi9cbm1ldGhvZHMuZW5hYmxlSU1FID0gYXN5bmMgZnVuY3Rpb24gKGltZUlkKSB7XG4gIGF3YWl0IHRoaXMuc2hlbGwoWydpbWUnLCAnZW5hYmxlJywgaW1lSWRdKTtcbn07XG5cbi8qKlxuICogRGlzYWJsZSB0aGUgcGFydGljdWxhciBpbnB1dCBtZXRob2Qgb24gdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBpbWVJZCAtIE9uZSBvZiBleGlzdGluZyBJTUUgaWRzLlxuICovXG5tZXRob2RzLmRpc2FibGVJTUUgPSBhc3luYyBmdW5jdGlvbiAoaW1lSWQpIHtcbiAgYXdhaXQgdGhpcy5zaGVsbChbJ2ltZScsICdkaXNhYmxlJywgaW1lSWRdKTtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBwYXJ0aWN1bGFyIGlucHV0IG1ldGhvZCBvbiB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGltZUlkIC0gT25lIG9mIGV4aXN0aW5nIElNRSBpZHMuXG4gKi9cbm1ldGhvZHMuc2V0SU1FID0gYXN5bmMgZnVuY3Rpb24gKGltZUlkKSB7XG4gIGF3YWl0IHRoaXMuc2hlbGwoWydpbWUnLCAnc2V0JywgaW1lSWRdKTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBkZWZhdWx0IGlucHV0IG1ldGhvZCBvbiB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKlxuICogQHJldHVybiB7c3RyaW5nfSBUaGUgbmFtZSBvZiB0aGUgZGVmYXVsdCBpbnB1dCBtZXRob2QuXG4gKi9cbm1ldGhvZHMuZGVmYXVsdElNRSA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgdHJ5IHtcbiAgICBsZXQgZW5naW5lID0gYXdhaXQgdGhpcy5nZXRTZXR0aW5nKCdzZWN1cmUnLCAnZGVmYXVsdF9pbnB1dF9tZXRob2QnKTtcbiAgICByZXR1cm4gZW5naW5lLnRyaW0oKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgZ2V0dGluZyBkZWZhdWx0IElNRS4gT3JpZ2luYWwgZXJyb3I6ICR7ZS5tZXNzYWdlfWApO1xuICB9XG59O1xuXG4vKipcbiAqIFNlbmQgdGhlIHBhcnRpY3VsYXIga2V5Y29kZSB0byB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBrZXljb2RlIC0gVGhlIGFjdHVhbCBrZXkgY29kZSB0byBiZSBzZW50LlxuICovXG5tZXRob2RzLmtleWV2ZW50ID0gYXN5bmMgZnVuY3Rpb24gKGtleWNvZGUpIHtcbiAgLy8ga2V5Y29kZSBtdXN0IGJlIGFuIGludC5cbiAgbGV0IGNvZGUgPSBwYXJzZUludChrZXljb2RlLCAxMCk7XG4gIGF3YWl0IHRoaXMuc2hlbGwoWydpbnB1dCcsICdrZXlldmVudCcsIGNvZGVdKTtcbn07XG5cbi8qKlxuICogU2VuZCB0aGUgcGFydGljdWxhciB0ZXh0IHRvIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIFRoZSBhY3R1YWwgdGV4dCB0byBiZSBzZW50LlxuICovXG5tZXRob2RzLmlucHV0VGV4dCA9IGFzeW5jIGZ1bmN0aW9uICh0ZXh0KSB7XG4gIC8qIGVzbGludC1kaXNhYmxlIG5vLXVzZWxlc3MtZXNjYXBlICovXG4gIC8vIG5lZWQgdG8gZXNjYXBlIHdoaXRlc3BhY2UgYW5kICggKSA8ID4gfCA7ICYgKiBcXCB+IFwiICdcbiAgdGV4dCA9IHRleHRcbiAgICAgICAgICAucmVwbGFjZSgvXFxcXC9nLCAnXFxcXFxcXFwnKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXCgvZywgJ1xcKCcpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcKS9nLCAnXFwpJylcbiAgICAgICAgICAucmVwbGFjZSgvPC9nLCAnXFw8JylcbiAgICAgICAgICAucmVwbGFjZSgvPi9nLCAnXFw+JylcbiAgICAgICAgICAucmVwbGFjZSgvXFx8L2csICdcXHwnKVxuICAgICAgICAgIC5yZXBsYWNlKC87L2csICdcXDsnKVxuICAgICAgICAgIC5yZXBsYWNlKC8mL2csICdcXCYnKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXCovZywgJ1xcKicpXG4gICAgICAgICAgLnJlcGxhY2UoL34vZywgJ1xcficpXG4gICAgICAgICAgLnJlcGxhY2UoL1wiL2csICdcXFwiJylcbiAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcJ1wiKVxuICAgICAgICAgIC5yZXBsYWNlKC8gL2csICclcycpO1xuICAvKiBlc2xpbnQtZGlzYWJsZSBuby11c2VsZXNzLWVzY2FwZSAqL1xuICBhd2FpdCB0aGlzLnNoZWxsKFsnaW5wdXQnLCAndGV4dCcsIHRleHRdKTtcbn07XG5cbi8qKlxuICogQ2xlYXIgdGhlIGFjdGl2ZSB0ZXh0IGZpZWxkIG9uIHRoZSBkZXZpY2UgdW5kZXIgdGVzdCBieSBzZW5kaW5nXG4gKiBzcGVjaWFsIGtleWV2ZW50cyB0byBpdC5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gbGVuZ3RoIFsxMDBdIC0gVGhlIG1heGltdW0gbGVuZ3RoIG9mIHRoZSB0ZXh0IGluIHRoZSBmaWVsZCB0byBiZSBjbGVhcmVkLlxuICovXG5tZXRob2RzLmNsZWFyVGV4dEZpZWxkID0gYXN5bmMgZnVuY3Rpb24gKGxlbmd0aCA9IDEwMCkge1xuICAvLyBhc3N1bWVzIHRoYXQgdGhlIEVkaXRUZXh0IGZpZWxkIGFscmVhZHkgaGFzIGZvY3VzXG4gIGxvZy5kZWJ1ZyhgQ2xlYXJpbmcgdXAgdG8gJHtsZW5ndGh9IGNoYXJhY3RlcnNgKTtcbiAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuICBsZXQgYXJncyA9IFsnaW5wdXQnLCAna2V5ZXZlbnQnXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIC8vIHdlIGNhbm5vdCBrbm93IHdoZXJlIHRoZSBjdXJzb3IgaXMgaW4gdGhlIHRleHQgZmllbGQsIHNvIGRlbGV0ZSBib3RoIGJlZm9yZVxuICAgIC8vIGFuZCBhZnRlciBzbyB0aGF0IHdlIGdldCByaWQgb2YgZXZlcnl0aGluZ1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLmFuZHJvaWQuY29tL3JlZmVyZW5jZS9hbmRyb2lkL3ZpZXcvS2V5RXZlbnQuaHRtbCNLRVlDT0RFX0RFTFxuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLmFuZHJvaWQuY29tL3JlZmVyZW5jZS9hbmRyb2lkL3ZpZXcvS2V5RXZlbnQuaHRtbCNLRVlDT0RFX0ZPUldBUkRfREVMXG4gICAgYXJncy5wdXNoKCc2NycsICcxMTInKTtcbiAgfVxuICBhd2FpdCB0aGlzLnNoZWxsKGFyZ3MpO1xufTtcblxuLyoqXG4gKiBTZW5kIHRoZSBzcGVjaWFsIGtleWNvZGUgdG8gdGhlIGRldmljZSB1bmRlciB0ZXN0IGluIG9yZGVyIHRvIGxvY2sgaXQuXG4gKi9cbm1ldGhvZHMubG9jayA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgaWYgKGF3YWl0IHRoaXMuaXNTY3JlZW5Mb2NrZWQoKSkge1xuICAgIGxvZy5kZWJ1ZyhcIlNjcmVlbiBpcyBhbHJlYWR5IGxvY2tlZC4gRG9pbmcgbm90aGluZy5cIik7XG4gICAgcmV0dXJuO1xuICB9XG4gIGxvZy5kZWJ1ZyhcIlByZXNzaW5nIHRoZSBLRVlDT0RFX1BPV0VSIGJ1dHRvbiB0byBsb2NrIHNjcmVlblwiKTtcbiAgYXdhaXQgdGhpcy5rZXlldmVudCgyNik7XG5cbiAgY29uc3QgdGltZW91dE1zID0gNTAwMDtcbiAgdHJ5IHtcbiAgICBhd2FpdCB3YWl0Rm9yQ29uZGl0aW9uKGFzeW5jICgpID0+IGF3YWl0IHRoaXMuaXNTY3JlZW5Mb2NrZWQoKSwge1xuICAgICAgd2FpdE1zOiB0aW1lb3V0TXMsXG4gICAgICBpbnRlcnZhbE1zOiA1MDAsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFRoZSBkZXZpY2Ugc2NyZWVuIGlzIHN0aWxsIGxvY2tlZCBhZnRlciAke3RpbWVvdXRNc31tcyB0aW1lb3V0YCk7XG4gIH1cbn07XG5cbi8qKlxuICogU2VuZCB0aGUgc3BlY2lhbCBrZXljb2RlIHRvIHRoZSBkZXZpY2UgdW5kZXIgdGVzdCBpbiBvcmRlciB0byBlbXVsYXRlXG4gKiBCYWNrIGJ1dHRvbiB0YXAuXG4gKi9cbm1ldGhvZHMuYmFjayA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgbG9nLmRlYnVnKFwiUHJlc3NpbmcgdGhlIEJBQ0sgYnV0dG9uXCIpO1xuICBhd2FpdCB0aGlzLmtleWV2ZW50KDQpO1xufTtcblxuLyoqXG4gKiBTZW5kIHRoZSBzcGVjaWFsIGtleWNvZGUgdG8gdGhlIGRldmljZSB1bmRlciB0ZXN0IGluIG9yZGVyIHRvIGVtdWxhdGVcbiAqIEhvbWUgYnV0dG9uIHRhcC5cbiAqL1xubWV0aG9kcy5nb1RvSG9tZSA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgbG9nLmRlYnVnKFwiUHJlc3NpbmcgdGhlIEhPTUUgYnV0dG9uXCIpO1xuICBhd2FpdCB0aGlzLmtleWV2ZW50KDMpO1xufTtcblxuLyoqXG4gKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSBhY3R1YWwgcGF0aCB0byBhZGIgZXhlY3V0YWJsZS5cbiAqL1xubWV0aG9kcy5nZXRBZGJQYXRoID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5leGVjdXRhYmxlLnBhdGg7XG59O1xuXG4vKipcbiAqIFJldHJpZXZlIGN1cnJlbnQgc2NyZWVuIG9yaWVudGF0aW9uIG9mIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBjdXJyZW50IG9yaWVudGF0aW9uIGVuY29kZWQgYXMgYW4gaW50ZWdlciBudW1iZXIuXG4gKi9cbm1ldGhvZHMuZ2V0U2NyZWVuT3JpZW50YXRpb24gPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gIGxldCBzdGRvdXQgPSBhd2FpdCB0aGlzLnNoZWxsKFsnZHVtcHN5cycsICdpbnB1dCddKTtcbiAgcmV0dXJuIGdldFN1cmZhY2VPcmllbnRhdGlvbihzdGRvdXQpO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgc2NyZWVuIGxvY2sgc3RhdGUgb2YgdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIGRldmljZSBpcyBsb2NrZWQuXG4gKi9cbm1ldGhvZHMuaXNTY3JlZW5Mb2NrZWQgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gIGxldCBzdGRvdXQgPSBhd2FpdCB0aGlzLnNoZWxsKFsnZHVtcHN5cycsICd3aW5kb3cnXSk7XG4gIGlmIChwcm9jZXNzLmVudi5BUFBJVU1fTE9HX0RVTVBTWVMpIHtcbiAgICAvLyBvcHRpb25hbCBkZWJ1Z2dpbmdcbiAgICAvLyBpZiB0aGUgbWV0aG9kIGlzIG5vdCB3b3JraW5nLCB0dXJuIGl0IG9uIGFuZCBzZW5kIHVzIHRoZSBvdXRwdXRcbiAgICBsZXQgZHVtcHN5c0ZpbGUgPSBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgXCJkdW1wc3lzLmxvZ1wiKTtcbiAgICBsb2cuZGVidWcoYFdyaXRpbmcgZHVtcHN5cyBvdXRwdXQgdG8gJHtkdW1wc3lzRmlsZX1gKTtcbiAgICBhd2FpdCBmcy53cml0ZUZpbGUoZHVtcHN5c0ZpbGUsIHN0ZG91dCk7XG4gIH1cbiAgcmV0dXJuIChpc1Nob3dpbmdMb2Nrc2NyZWVuKHN0ZG91dCkgfHwgaXNDdXJyZW50Rm9jdXNPbktleWd1YXJkKHN0ZG91dCkgfHxcbiAgICAgICAgICAhaXNTY3JlZW5PbkZ1bGx5KHN0ZG91dCkpO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgc3RhdGUgb2YgdGhlIHNvZnR3YXJlIGtleWJvYXJkIG9uIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSBzb2Z0d2FyZSBrZXlib2FyZCBpcyBwcmVzZW50LlxuICovXG5tZXRob2RzLmlzU29mdEtleWJvYXJkUHJlc2VudCA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgdHJ5IHtcbiAgICBsZXQgc3Rkb3V0ID0gYXdhaXQgdGhpcy5zaGVsbChbJ2R1bXBzeXMnLCAnaW5wdXRfbWV0aG9kJ10pO1xuICAgIGxldCBpc0tleWJvYXJkU2hvd24gPSBmYWxzZSxcbiAgICAgICAgY2FuQ2xvc2VLZXlib2FyZCA9IGZhbHNlLFxuICAgICAgICBpbnB1dFNob3duTWF0Y2ggPSAvbUlucHV0U2hvd249XFx3Ky9naS5leGVjKHN0ZG91dCk7XG4gICAgaWYgKGlucHV0U2hvd25NYXRjaCAmJiBpbnB1dFNob3duTWF0Y2hbMF0pIHtcbiAgICAgIGlzS2V5Ym9hcmRTaG93biA9IGlucHV0U2hvd25NYXRjaFswXS5zcGxpdCgnPScpWzFdID09PSAndHJ1ZSc7XG4gICAgICBsZXQgaXNJbnB1dFZpZXdTaG93bk1hdGNoID0gL21Jc0lucHV0Vmlld1Nob3duPVxcdysvZ2kuZXhlYyhzdGRvdXQpO1xuICAgICAgaWYgKGlzSW5wdXRWaWV3U2hvd25NYXRjaCAmJiBpc0lucHV0Vmlld1Nob3duTWF0Y2hbMF0pIHtcbiAgICAgICAgY2FuQ2xvc2VLZXlib2FyZCA9IGlzSW5wdXRWaWV3U2hvd25NYXRjaFswXS5zcGxpdCgnPScpWzFdID09PSAndHJ1ZSc7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7aXNLZXlib2FyZFNob3duLCBjYW5DbG9zZUtleWJvYXJkfTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgZmluZGluZyBzb2Z0a2V5Ym9hcmQuIE9yaWdpbmFsIGVycm9yOiAke2UubWVzc2FnZX1gKTtcbiAgfVxufTtcblxuLyoqXG4gKiBTZW5kIGFuIGFyYml0cmFyeSBUZWxuZXQgY29tbWFuZCB0byB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGNvbW1hbmQgLSBUaGUgY29tbWFuZCB0byBiZSBzZW50LlxuICpcbiAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGFjdHVhbCBvdXRwdXQgb2YgdGhlIGdpdmVuIGNvbW1hbmQuXG4gKi9cbm1ldGhvZHMuc2VuZFRlbG5ldENvbW1hbmQgPSBhc3luYyBmdW5jdGlvbiAoY29tbWFuZCkge1xuICBsb2cuZGVidWcoYFNlbmRpbmcgdGVsbmV0IGNvbW1hbmQgdG8gZGV2aWNlOiAke2NvbW1hbmR9YCk7XG4gIGxldCBwb3J0ID0gYXdhaXQgdGhpcy5nZXRFbXVsYXRvclBvcnQoKTtcbiAgcmV0dXJuIGF3YWl0IG5ldyBCKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBsZXQgY29ubiA9IG5ldC5jcmVhdGVDb25uZWN0aW9uKHBvcnQsICdsb2NhbGhvc3QnKSxcbiAgICAgICAgY29ubmVjdGVkID0gZmFsc2UsXG4gICAgICAgIHJlYWR5UmVnZXggPSAvXk9LJC9tLFxuICAgICAgICBkYXRhU3RyZWFtID0gXCJcIixcbiAgICAgICAgcmVzID0gbnVsbDtcbiAgICBjb25uLm9uKCdjb25uZWN0JywgKCkgPT4ge1xuICAgICAgbG9nLmRlYnVnKFwiU29ja2V0IGNvbm5lY3Rpb24gdG8gZGV2aWNlIGNyZWF0ZWRcIik7XG4gICAgfSk7XG4gICAgY29ubi5vbignZGF0YScsIChkYXRhKSA9PiB7XG4gICAgICBkYXRhID0gZGF0YS50b1N0cmluZygndXRmOCcpO1xuICAgICAgaWYgKCFjb25uZWN0ZWQpIHtcbiAgICAgICAgaWYgKHJlYWR5UmVnZXgudGVzdChkYXRhKSkge1xuICAgICAgICAgIGNvbm5lY3RlZCA9IHRydWU7XG4gICAgICAgICAgbG9nLmRlYnVnKFwiU29ja2V0IGNvbm5lY3Rpb24gdG8gZGV2aWNlIHJlYWR5XCIpO1xuICAgICAgICAgIGNvbm4ud3JpdGUoYCR7Y29tbWFuZH1cXG5gKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGF0YVN0cmVhbSArPSBkYXRhO1xuICAgICAgICBpZiAocmVhZHlSZWdleC50ZXN0KGRhdGEpKSB7XG4gICAgICAgICAgcmVzID0gZGF0YVN0cmVhbS5yZXBsYWNlKHJlYWR5UmVnZXgsIFwiXCIpLnRyaW0oKTtcbiAgICAgICAgICByZXMgPSBfLmxhc3QocmVzLnRyaW0oKS5zcGxpdCgnXFxuJykpO1xuICAgICAgICAgIGxvZy5kZWJ1ZyhgVGVsbmV0IGNvbW1hbmQgZ290IHJlc3BvbnNlOiAke3Jlc31gKTtcbiAgICAgICAgICBjb25uLndyaXRlKFwicXVpdFxcblwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIGNvbm4ub24oJ2Vycm9yJywgKGVycikgPT4geyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHByb21pc2UvcHJlZmVyLWF3YWl0LXRvLWNhbGxiYWNrc1xuICAgICAgbG9nLmRlYnVnKGBUZWxuZXQgY29tbWFuZCBlcnJvcjogJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgIHJlamVjdChlcnIpO1xuICAgIH0pO1xuICAgIGNvbm4ub24oJ2Nsb3NlJywgKCkgPT4ge1xuICAgICAgaWYgKHJlcyA9PT0gbnVsbCkge1xuICAgICAgICByZWplY3QobmV3IEVycm9yKFwiTmV2ZXIgZ290IGEgcmVzcG9uc2UgZnJvbSBjb21tYW5kXCIpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc29sdmUocmVzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIENoZWNrIHRoZSBzdGF0ZSBvZiBBaXJwbGFuZSBtb2RlIG9uIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIEFpcnBsYW5lIG1vZGUgaXMgZW5hYmxlZC5cbiAqL1xubWV0aG9kcy5pc0FpcnBsYW5lTW9kZU9uID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICBsZXQgc3Rkb3V0ID0gYXdhaXQgdGhpcy5nZXRTZXR0aW5nKCdnbG9iYWwnLCAnYWlycGxhbmVfbW9kZV9vbicpO1xuICByZXR1cm4gcGFyc2VJbnQoc3Rkb3V0LCAxMCkgIT09IDA7XG59O1xuXG4vKipcbiAqIENoYW5nZSB0aGUgc3RhdGUgb2YgQWlycGxhbmUgbW9kZSBpbiBTZXR0aW5ncyBvbiB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKlxuICogQHBhcmFtIHtib29sZWFufSBvbiAtIFRydWUgdG8gZW5hYmxlIHRoZSBBaXJwbGFuZSBtb2RlIGluIFNldHRpbmdzIGFuZCBmYWxzZSB0byBkaXNhYmxlIGl0LlxuICovXG5tZXRob2RzLnNldEFpcnBsYW5lTW9kZSA9IGFzeW5jIGZ1bmN0aW9uIChvbikge1xuICBhd2FpdCB0aGlzLnNldFNldHRpbmcoJ2dsb2JhbCcsICdhaXJwbGFuZV9tb2RlX29uJywgb24gPyAxIDogMCk7XG59O1xuXG4vKipcbiAqIEJyb2FkY2FzdCB0aGUgc3RhdGUgb2YgQWlycGxhbmUgbW9kZSBvbiB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgY2FsbGVkIGFmdGVyIHtAbGluayAjc2V0QWlycGxhbmVNb2RlfSwgb3RoZXJ3aXNlXG4gKiB0aGUgbW9kZSBjaGFuZ2UgaXMgbm90IGdvaW5nIHRvIGJlIGFwcGxpZWQgZm9yIHRoZSBkZXZpY2UuXG4gKlxuICogQHBhcmFtIHtib29sZWFufSBvbiAtIFRydWUgdG8gYnJvYWRjYXN0IGVuYWJsZSBhbmQgZmFsc2UgdG8gYnJvYWRjYXN0IGRpc2FibGUuXG4gKi9cbm1ldGhvZHMuYnJvYWRjYXN0QWlycGxhbmVNb2RlID0gYXN5bmMgZnVuY3Rpb24gKG9uKSB7XG4gIGF3YWl0IHRoaXMuc2hlbGwoW1xuICAgICdhbScsICdicm9hZGNhc3QnLFxuICAgICctYScsICdhbmRyb2lkLmludGVudC5hY3Rpb24uQUlSUExBTkVfTU9ERScsXG4gICAgJy0tZXonLCAnc3RhdGUnLCBvbiA/ICd0cnVlJyA6ICdmYWxzZSdcbiAgXSk7XG59O1xuXG4vKipcbiAqIENoZWNrIHRoZSBzdGF0ZSBvZiBXaUZpIG9uIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIFdpRmkgaXMgZW5hYmxlZC5cbiAqL1xubWV0aG9kcy5pc1dpZmlPbiA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgbGV0IHN0ZG91dCA9IGF3YWl0IHRoaXMuZ2V0U2V0dGluZygnZ2xvYmFsJywgJ3dpZmlfb24nKTtcbiAgcmV0dXJuIChwYXJzZUludChzdGRvdXQsIDEwKSAhPT0gMCk7XG59O1xuXG4vKipcbiAqIENoYW5nZSB0aGUgc3RhdGUgb2YgV2lGaSBvbiB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKlxuICogQHBhcmFtIHtib29sZWFufSBvbiAtIFRydWUgdG8gZW5hYmxlIGFuZCBmYWxzZSB0byBkaXNhYmxlIGl0LlxuICogQHBhcmFtIHtib29sZWFufSBpc0VtdWxhdG9yIFtmYWxzZV0gLSBTZXQgaXQgdG8gdHJ1ZSBpZiB0aGUgZGV2aWNlIHVuZGVyIHRlc3RcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXMgYW4gZW11bGF0b3IgcmF0aGVyIHRoYW4gYSByZWFsIGRldmljZS5cbiAqL1xubWV0aG9kcy5zZXRXaWZpU3RhdGUgPSBhc3luYyBmdW5jdGlvbiAob24sIGlzRW11bGF0b3IgPSBmYWxzZSkge1xuICBpZiAoaXNFbXVsYXRvcikge1xuICAgIGNvbnN0IGlzUm9vdCA9IGF3YWl0IHRoaXMucm9vdCgpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnNoZWxsKFsnc3ZjJywgJ3dpZmknLCBvbiA/ICdlbmFibGUnIDogJ2Rpc2FibGUnXSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGlmIChpc1Jvb3QpIHtcbiAgICAgICAgYXdhaXQgdGhpcy51bnJvb3QoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgYXdhaXQgdGhpcy5zaGVsbChbXG4gICAgICAnYW0nLCAnYnJvYWRjYXN0JyxcbiAgICAgICctYScsIFdJRklfQ09OTkVDVElPTl9TRVRUSU5HX0FDVElPTixcbiAgICAgICctbicsIFdJRklfQ09OTkVDVElPTl9TRVRUSU5HX1JFQ0VJVkVSLFxuICAgICAgJy0tZXMnLCAnc2V0c3RhdHVzJywgb24gPyAnZW5hYmxlJyA6ICdkaXNhYmxlJ1xuICAgIF0pO1xuICB9XG59O1xuXG4vKipcbiAqIENoZWNrIHRoZSBzdGF0ZSBvZiBEYXRhIHRyYW5zZmVyIG9uIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIERhdGEgdHJhbnNmZXIgaXMgZW5hYmxlZC5cbiAqL1xubWV0aG9kcy5pc0RhdGFPbiA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgbGV0IHN0ZG91dCA9IGF3YWl0IHRoaXMuZ2V0U2V0dGluZygnZ2xvYmFsJywgJ21vYmlsZV9kYXRhJyk7XG4gIHJldHVybiAocGFyc2VJbnQoc3Rkb3V0LCAxMCkgIT09IDApO1xufTtcblxuLyoqXG4gKiBDaGFuZ2UgdGhlIHN0YXRlIG9mIERhdGEgdHJhbnNmZXIgb24gdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb24gLSBUcnVlIHRvIGVuYWJsZSBhbmQgZmFsc2UgdG8gZGlzYWJsZSBpdC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNFbXVsYXRvciBbZmFsc2VdIC0gU2V0IGl0IHRvIHRydWUgaWYgdGhlIGRldmljZSB1bmRlciB0ZXN0XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzIGFuIGVtdWxhdG9yIHJhdGhlciB0aGFuIGEgcmVhbCBkZXZpY2UuXG4gKi9cbm1ldGhvZHMuc2V0RGF0YVN0YXRlID0gYXN5bmMgZnVuY3Rpb24gKG9uLCBpc0VtdWxhdG9yID0gZmFsc2UpIHtcbiAgaWYgKGlzRW11bGF0b3IpIHtcbiAgICBjb25zdCBpc1Jvb3QgPSBhd2FpdCB0aGlzLnJvb3QoKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5zaGVsbChbJ3N2YycsICdkYXRhJywgb24gPyAnZW5hYmxlJyA6ICdkaXNhYmxlJ10pO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBpZiAoaXNSb290KSB7XG4gICAgICAgIGF3YWl0IHRoaXMudW5yb290KCk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGF3YWl0IHRoaXMuc2hlbGwoW1xuICAgICAgJ2FtJywgJ2Jyb2FkY2FzdCcsXG4gICAgICAnLWEnLCBEQVRBX0NPTk5FQ1RJT05fU0VUVElOR19BQ1RJT04sXG4gICAgICAnLW4nLCBEQVRBX0NPTk5FQ1RJT05fU0VUVElOR19SRUNFSVZFUixcbiAgICAgICctLWVzJywgJ3NldHN0YXR1cycsIG9uID8gJ2VuYWJsZScgOiAnZGlzYWJsZSdcbiAgICBdKTtcbiAgfVxufTtcblxuLyoqXG4gKiBDaGFuZ2UgdGhlIHN0YXRlIG9mIFdpRmkgYW5kL29yIERhdGEgdHJhbnNmZXIgb24gdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gd2lmaSAtIFRydWUgdG8gZW5hYmxlIGFuZCBmYWxzZSB0byBkaXNhYmxlIFdpRmkuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGRhdGEgLSBUcnVlIHRvIGVuYWJsZSBhbmQgZmFsc2UgdG8gZGlzYWJsZSBEYXRhIHRyYW5zZmVyLlxuICogQHBhcmFtIHtib29sZWFufSBpc0VtdWxhdG9yIFtmYWxzZV0gLSBTZXQgaXQgdG8gdHJ1ZSBpZiB0aGUgZGV2aWNlIHVuZGVyIHRlc3RcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXMgYW4gZW11bGF0b3IgcmF0aGVyIHRoYW4gYSByZWFsIGRldmljZS5cbiAqL1xubWV0aG9kcy5zZXRXaWZpQW5kRGF0YSA9IGFzeW5jIGZ1bmN0aW9uICh7d2lmaSwgZGF0YX0sIGlzRW11bGF0b3IgPSBmYWxzZSkge1xuICBpZiAodXRpbC5oYXNWYWx1ZSh3aWZpKSkge1xuICAgIGF3YWl0IHRoaXMuc2V0V2lmaVN0YXRlKHdpZmksIGlzRW11bGF0b3IpO1xuICB9XG4gIGlmICh1dGlsLmhhc1ZhbHVlKGRhdGEpKSB7XG4gICAgYXdhaXQgdGhpcy5zZXREYXRhU3RhdGUoZGF0YSwgaXNFbXVsYXRvcik7XG4gIH1cbn07XG5cbi8qKlxuICogQ2hhbmdlIHRoZSBzdGF0ZSBvZiBhbmltYXRpb24gb24gdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICogQW5pbWF0aW9uIG9uIHRoZSBkZXZpY2UgaXMgY29udHJvbGxlZCBieSB0aGUgZm9sbG93aW5nIGdsb2JhbCBwcm9wZXJ0aWVzOlxuICogW0FOSU1BVE9SX0RVUkFUSU9OX1NDQUxFXXtAbGluayBodHRwczovL2RldmVsb3Blci5hbmRyb2lkLmNvbS9yZWZlcmVuY2UvYW5kcm9pZC9wcm92aWRlci9TZXR0aW5ncy5HbG9iYWwuaHRtbCNBTklNQVRPUl9EVVJBVElPTl9TQ0FMRX0sXG4gKiBbVFJBTlNJVElPTl9BTklNQVRJT05fU0NBTEVde0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLmFuZHJvaWQuY29tL3JlZmVyZW5jZS9hbmRyb2lkL3Byb3ZpZGVyL1NldHRpbmdzLkdsb2JhbC5odG1sI1RSQU5TSVRJT05fQU5JTUFUSU9OX1NDQUxFfSxcbiAqIFtXSU5ET1dfQU5JTUFUSU9OX1NDQUxFXXtAbGluayBodHRwczovL2RldmVsb3Blci5hbmRyb2lkLmNvbS9yZWZlcmVuY2UvYW5kcm9pZC9wcm92aWRlci9TZXR0aW5ncy5HbG9iYWwuaHRtbCNXSU5ET1dfQU5JTUFUSU9OX1NDQUxFfS5cbiAqIFRoaXMgbWV0aG9kIHNldHMgYWxsIHRoaXMgcHJvcGVydGllcyB0byAwLjAgdG8gZGlzYWJsZSAoMS4wIHRvIGVuYWJsZSkgYW5pbWF0aW9uLlxuICpcbiAqIFR1cm5pbmcgb2ZmIGFuaW1hdGlvbiBtaWdodCBiZSB1c2VmdWwgdG8gaW1wcm92ZSBzdGFiaWxpdHlcbiAqIGFuZCByZWR1Y2UgdGVzdHMgZXhlY3V0aW9uIHRpbWUuXG4gKlxuICogQHBhcmFtIHtib29sZWFufSBvbiAtIFRydWUgdG8gZW5hYmxlIGFuZCBmYWxzZSB0byBkaXNhYmxlIGl0LlxuICovXG5tZXRob2RzLnNldEFuaW1hdGlvblN0YXRlID0gYXN5bmMgZnVuY3Rpb24gKG9uKSB7XG4gIGF3YWl0IHRoaXMuc2hlbGwoW1xuICAgICdhbScsICdicm9hZGNhc3QnLFxuICAgICctYScsIEFOSU1BVElPTl9TRVRUSU5HX0FDVElPTixcbiAgICAnLW4nLCBBTklNQVRJT05fU0VUVElOR19SRUNFSVZFUixcbiAgICAnLS1lcycsICdzZXRzdGF0dXMnLCBvbiA/ICdlbmFibGUnIDogJ2Rpc2FibGUnXG4gIF0pO1xufTtcblxuLyoqXG4gKiBDaGVjayB0aGUgc3RhdGUgb2YgYW5pbWF0aW9uIG9uIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIGF0IGxlYXN0IG9uZSBvZiBhbmltYXRpb24gc2NhbGUgc2V0dGluZ3NcbiAqICAgICAgICAgICAgICAgICAgIGlzIG5vdCBlcXVhbCB0byAnMC4wJy5cbiAqL1xubWV0aG9kcy5pc0FuaW1hdGlvbk9uID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICBsZXQgYW5pbWF0b3JfZHVyYXRpb25fc2NhbGUgPSBhd2FpdCB0aGlzLmdldFNldHRpbmcoJ2dsb2JhbCcsICdhbmltYXRvcl9kdXJhdGlvbl9zY2FsZScpO1xuICBsZXQgdHJhbnNpdGlvbl9hbmltYXRpb25fc2NhbGUgPSBhd2FpdCB0aGlzLmdldFNldHRpbmcoJ2dsb2JhbCcsICd0cmFuc2l0aW9uX2FuaW1hdGlvbl9zY2FsZScpO1xuICBsZXQgd2luZG93X2FuaW1hdGlvbl9zY2FsZSA9IGF3YWl0IHRoaXMuZ2V0U2V0dGluZygnZ2xvYmFsJywgJ3dpbmRvd19hbmltYXRpb25fc2NhbGUnKTtcbiAgcmV0dXJuIF8uc29tZShbYW5pbWF0b3JfZHVyYXRpb25fc2NhbGUsIHRyYW5zaXRpb25fYW5pbWF0aW9uX3NjYWxlLCB3aW5kb3dfYW5pbWF0aW9uX3NjYWxlXSxcbiAgICAgICAgICAgICAgICAoc2V0dGluZykgPT4gc2V0dGluZyAhPT0gJzAuMCcpO1xufTtcblxuLyoqXG4gKiBDaGFuZ2UgdGhlIGxvY2FsZSBvbiB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuIERvbid0IG5lZWQgdG8gcmVib290IHRoZSBkZXZpY2UgYWZ0ZXIgY2hhbmdpbmcgdGhlIGxvY2FsZS5cbiAqIFRoaXMgbWV0aG9kIHNldHMgYW4gYXJiaXRyYXJ5IGxvY2FsZSBmb2xsb3dpbmc6XG4gKiAgIGh0dHBzOi8vZGV2ZWxvcGVyLmFuZHJvaWQuY29tL3JlZmVyZW5jZS9qYXZhL3V0aWwvTG9jYWxlLmh0bWxcbiAqICAgaHR0cHM6Ly9kZXZlbG9wZXIuYW5kcm9pZC5jb20vcmVmZXJlbmNlL2phdmEvdXRpbC9Mb2NhbGUuaHRtbCNMb2NhbGUoamF2YS5sYW5nLlN0cmluZywlMjBqYXZhLmxhbmcuU3RyaW5nKVxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZSAtIExhbmd1YWdlLiBlLmcuIGVuLCBqYVxuICogQHBhcmFtIHtzdHJpbmd9IGNvdW50cnkgLSBDb3VudHJ5LiBlLmcuIFVTLCBKUFxuICogQHBhcmFtIHs/c3RyaW5nfSBzY3JpcHQgLSBTY3JpcHQuIGUuZy4gSGFucyBpbiBgemgtSGFucy1DTmBcbiAqL1xubWV0aG9kcy5zZXREZXZpY2VTeXNMb2NhbGVWaWFTZXR0aW5nQXBwID0gYXN5bmMgZnVuY3Rpb24gKGxhbmd1YWdlLCBjb3VudHJ5LCBzY3JpcHQgPSBudWxsKSB7XG4gIGNvbnN0IHBhcmFtcyA9IFtcbiAgICAnYW0nLCAnYnJvYWRjYXN0JyxcbiAgICAnLWEnLCBMT0NBTEVfU0VUVElOR19BQ1RJT04sXG4gICAgJy1uJywgTE9DQUxFX1NFVFRJTkdfUkVDRUlWRVIsXG4gICAgJy0tZXMnLCAnbGFuZycsIGxhbmd1YWdlLnRvTG93ZXJDYXNlKCksXG4gICAgJy0tZXMnLCAnY291bnRyeScsIGNvdW50cnkudG9VcHBlckNhc2UoKVxuICBdO1xuXG4gIGlmIChzY3JpcHQpIHtcbiAgICBwYXJhbXMucHVzaCgnLS1lcycsICdzY3JpcHQnLCBzY3JpcHQpO1xuICB9XG5cbiAgYXdhaXQgdGhpcy5zaGVsbChwYXJhbXMpO1xufTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBMb2NhdGlvblxuICogQHByb3BlcnR5IHtudW1iZXJ8c3RyaW5nfSBsb25naXR1ZGUgLSBWYWxpZCBsb25naXR1ZGUgdmFsdWUuXG4gKiBAcHJvcGVydHkge251bWJlcnxzdHJpbmd9IGxhdGl0dWRlIC0gVmFsaWQgbGF0aXR1ZGUgdmFsdWUuXG4gKiBAcHJvcGVydHkgez9udW1iZXJ8c3RyaW5nfSBhbHRpdHVkZSAtIFZhbGlkIGFsdGl0dWRlIHZhbHVlLlxuICovXG5cbi8qKlxuICogRW11bGF0ZSBnZW9sb2NhdGlvbiBjb29yZGluYXRlcyBvbiB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKlxuICogQHBhcmFtIHtMb2NhdGlvbn0gbG9jYXRpb24gLSBMb2NhdGlvbiBvYmplY3QuIFRoZSBgYWx0aXR1ZGVgIHZhbHVlIGlzIGlnbm9yZWRcbiAqIHdoaWxlIG1vY2tpbmcgdGhlIHBvc2l0aW9uLlxuICogQHBhcmFtIHtib29sZWFufSBpc0VtdWxhdG9yIFtmYWxzZV0gLSBTZXQgaXQgdG8gdHJ1ZSBpZiB0aGUgZGV2aWNlIHVuZGVyIHRlc3RcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXMgYW4gZW11bGF0b3IgcmF0aGVyIHRoYW4gYSByZWFsIGRldmljZS5cbiAqL1xubWV0aG9kcy5zZXRHZW9Mb2NhdGlvbiA9IGFzeW5jIGZ1bmN0aW9uIChsb2NhdGlvbiwgaXNFbXVsYXRvciA9IGZhbHNlKSB7XG4gIGxldCBsb25naXR1ZGUgPSBwYXJzZUZsb2F0KGxvY2F0aW9uLmxvbmdpdHVkZSk7XG4gIGlmIChpc05hTihsb25naXR1ZGUpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBsb2NhdGlvbi5sb25naXR1ZGUgaXMgZXhwZWN0ZWQgdG8gYmUgYSB2YWxpZCBmbG9hdCBudW1iZXIuICcke2xvY2F0aW9uLmxvbmdpdHVkZX0nIGlzIGdpdmVuIGluc3RlYWRgKTtcbiAgfVxuICBsb25naXR1ZGUgPSBgJHtfLmNlaWwobG9uZ2l0dWRlLCA1KX1gO1xuICBsZXQgbGF0aXR1ZGUgPSBwYXJzZUZsb2F0KGxvY2F0aW9uLmxhdGl0dWRlKTtcbiAgaWYgKGlzTmFOKGxhdGl0dWRlKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgbG9jYXRpb24ubGF0aXR1ZGUgaXMgZXhwZWN0ZWQgdG8gYmUgYSB2YWxpZCBmbG9hdCBudW1iZXIuICcke2xvY2F0aW9uLmxhdGl0dWRlfScgaXMgZ2l2ZW4gaW5zdGVhZGApO1xuICB9XG4gIGxhdGl0dWRlID0gYCR7Xy5jZWlsKGxhdGl0dWRlLCA1KX1gO1xuICBpZiAoaXNFbXVsYXRvcikge1xuICAgIGF3YWl0IHRoaXMucmVzZXRUZWxuZXRBdXRoVG9rZW4oKTtcbiAgICBhd2FpdCB0aGlzLmFkYkV4ZWMoWydlbXUnLCAnZ2VvJywgJ2ZpeCcsIGxvbmdpdHVkZSwgbGF0aXR1ZGVdKTtcbiAgICAvLyBBIHdvcmthcm91bmQgZm9yIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvYW5kcm9pZC9pc3N1ZXMvZGV0YWlsP2lkPTIwNjE4MFxuICAgIGF3YWl0IHRoaXMuYWRiRXhlYyhbJ2VtdScsICdnZW8nLCAnZml4JywgbG9uZ2l0dWRlLnJlcGxhY2UoJy4nLCAnLCcpLCBsYXRpdHVkZS5yZXBsYWNlKCcuJywgJywnKV0pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnNoZWxsKFtcbiAgICAgICdhbScsICdzdGFydHNlcnZpY2UnLFxuICAgICAgJy1lJywgJ2xvbmdpdHVkZScsIGxvbmdpdHVkZSxcbiAgICAgICctZScsICdsYXRpdHVkZScsIGxhdGl0dWRlLFxuICAgICAgTE9DQVRJT05fU0VSVklDRSxcbiAgICBdKTtcbiAgfVxufTtcblxuLyoqXG4gKiBHZXQgdGhlIGN1cnJlbnQgZ2VvIGxvY2F0aW9uIGZyb20gdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEByZXR1cm5zIHtMb2NhdGlvbn0gVGhlIGN1cnJlbnQgbG9jYXRpb25cbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiB0aGUgY3VycmVudCBsb2NhdGlvbiBjYW5ub3QgYmUgcmV0cmlldmVkXG4gKi9cbm1ldGhvZHMuZ2V0R2VvTG9jYXRpb24gPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gIGxldCBvdXRwdXQ7XG4gIHRyeSB7XG4gICAgb3V0cHV0ID0gYXdhaXQgdGhpcy5zaGVsbChbXG4gICAgICAnYW0nLCAnYnJvYWRjYXN0JyxcbiAgICAgICctbicsIExPQ0FUSU9OX1JFQ0VJVkVSLFxuICAgICAgJy1hJywgTE9DQVRJT05fUkVUUklFVkFMX0FDVElPTixcbiAgICBdKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgcmV0cmlldmUgdGhlIGN1cnJlbnQgZ2VvIGNvb3JkaW5hdGVzIGZyb20gdGhlIGRldmljZS4gYCArXG4gICAgICBgTWFrZSBzdXJlIHRoZSBBcHBpdW0gU2V0dGluZ3MgYXBwbGljYXRpb24gaXMgdXAgdG8gZGF0ZSBhbmQgaGFzIGxvY2F0aW9uIHBlcm1pc3Npb25zLiBBbHNvIHRoZSBsb2NhdGlvbiBgICtcbiAgICAgIGBzZXJ2aWNlcyBtdXN0IGJlIGVuYWJsZWQgb24gdGhlIGRldmljZS4gT3JpZ2luYWwgZXJyb3I6ICR7ZXJyLm1lc3NhZ2V9YCk7XG4gIH1cblxuICBjb25zdCBtYXRjaCA9IC9kYXRhPVwiKC0/W1xcZFxcLl0rKVxccysoLT9bXFxkXFwuXSspXFxzKygtP1tcXGRcXC5dKylcIi8uZXhlYyhvdXRwdXQpO1xuICBpZiAoIW1hdGNoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgcGFyc2UgdGhlIGFjdHVhbCBsb2NhdGlvbiB2YWx1ZXMgZnJvbSB0aGUgY29tbWFuZCBvdXRwdXQ6ICR7b3V0cHV0fWApO1xuICB9XG4gIGNvbnN0IGxvY2F0aW9uID0ge1xuICAgIGxhdGl0dWRlOiBtYXRjaFsxXSxcbiAgICBsb25naXR1ZGU6IG1hdGNoWzJdLFxuICAgIGFsdGl0dWRlOiBtYXRjaFszXSxcbiAgfTtcbiAgbG9nLmRlYnVnKGBHb3QgZ2VvIGNvb3JkaW5hdGVzOiAke0pTT04uc3RyaW5naWZ5KGxvY2F0aW9uKX1gKTtcbiAgcmV0dXJuIGxvY2F0aW9uO1xufTtcblxuLyoqXG4gKiBGb3JjZWZ1bGx5IHJlY3Vyc2l2ZWx5IHJlbW92ZSBhIHBhdGggb24gdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICogQmUgY2FyZWZ1bCB3aGlsZSBjYWxsaW5nIHRoaXMgbWV0aG9kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gVGhlIHBhdGggdG8gYmUgcmVtb3ZlZCByZWN1cnNpdmVseS5cbiAqL1xubWV0aG9kcy5yaW1yYWYgPSBhc3luYyBmdW5jdGlvbiAocGF0aCkge1xuICBhd2FpdCB0aGlzLnNoZWxsKFsncm0nLCAnLXJmJywgcGF0aF0pO1xufTtcblxuLyoqXG4gKiBTZW5kIGEgZmlsZSB0byB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGxvY2FsUGF0aCAtIFRoZSBwYXRoIHRvIHRoZSBmaWxlIG9uIHRoZSBsb2NhbCBmaWxlIHN5c3RlbS5cbiAqIEBwYXJhbSB7c3RyaW5nfSByZW1vdGVQYXRoIC0gVGhlIGRlc3RpbmF0aW9uIHBhdGggb24gdGhlIHJlbW90ZSBkZXZpY2UuXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0cyAtIEFkZGl0aW9uYWwgb3B0aW9ucyBtYXBwaW5nLiBTZWVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgaHR0cHM6Ly9naXRodWIuY29tL2FwcGl1bS9ub2RlLXRlZW5fcHJvY2VzcyxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgX2V4ZWNfIG1ldGhvZCBvcHRpb25zLCBmb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCBhdmFpbGFibGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5cbiAqL1xubWV0aG9kcy5wdXNoID0gYXN5bmMgZnVuY3Rpb24gKGxvY2FsUGF0aCwgcmVtb3RlUGF0aCwgb3B0cykge1xuICBhd2FpdCB0aGlzLmFkYkV4ZWMoWydwdXNoJywgbG9jYWxQYXRoLCByZW1vdGVQYXRoXSwgb3B0cyk7XG59O1xuXG4vKipcbiAqIFJlY2VpdmUgYSBmaWxlIGZyb20gdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSByZW1vdGVQYXRoIC0gVGhlIHNvdXJjZSBwYXRoIG9uIHRoZSByZW1vdGUgZGV2aWNlLlxuICogQHBhcmFtIHtzdHJpbmd9IGxvY2FsUGF0aCAtIFRoZSBkZXN0aW5hdGlvbiBwYXRoIHRvIHRoZSBmaWxlIG9uIHRoZSBsb2NhbCBmaWxlIHN5c3RlbS5cbiAqL1xubWV0aG9kcy5wdWxsID0gYXN5bmMgZnVuY3Rpb24gKHJlbW90ZVBhdGgsIGxvY2FsUGF0aCkge1xuICAvLyBwdWxsIGZvbGRlciBjYW4gdGFrZSBtb3JlIHRpbWUsIGluY3JlYXNpbmcgdGltZSBvdXQgdG8gNjAgc2Vjc1xuICBhd2FpdCB0aGlzLmFkYkV4ZWMoWydwdWxsJywgcmVtb3RlUGF0aCwgbG9jYWxQYXRoXSwge3RpbWVvdXQ6IDYwMDAwfSk7XG59O1xuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIHByb2Nlc3Mgd2l0aCB0aGUgcGFydGljdWxhciBuYW1lIGlzIHJ1bm5pbmcgb24gdGhlIGRldmljZVxuICogdW5kZXIgdGVzdC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJvY2Vzc05hbWUgLSBUaGUgbmFtZSBvZiB0aGUgcHJvY2VzcyB0byBiZSBjaGVja2VkLlxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgZ2l2ZW4gcHJvY2VzcyBpcyBydW5uaW5nLlxuICogQHRocm93cyB7ZXJyb3J9IElmIHRoZSBnaXZlbiBwcm9jZXNzIG5hbWUgaXMgbm90IGEgdmFsaWQgY2xhc3MgbmFtZS5cbiAqL1xubWV0aG9kcy5wcm9jZXNzRXhpc3RzID0gYXN5bmMgZnVuY3Rpb24gKHByb2Nlc3NOYW1lKSB7XG4gIHRyeSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWRDbGFzcyhwcm9jZXNzTmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBwcm9jZXNzIG5hbWU6ICR7cHJvY2Vzc05hbWV9YCk7XG4gICAgfVxuICAgIGxldCBzdGRvdXQgPSBhd2FpdCB0aGlzLnNoZWxsKFwicHNcIik7XG4gICAgZm9yIChsZXQgbGluZSBvZiBzdGRvdXQuc3BsaXQoL1xccj9cXG4vKSkge1xuICAgICAgbGluZSA9IGxpbmUudHJpbSgpLnNwbGl0KC9cXHMrLyk7XG4gICAgICBsZXQgcGtnQ29sdW1uID0gbGluZVtsaW5lLmxlbmd0aCAtIDFdO1xuICAgICAgaWYgKHBrZ0NvbHVtbiAmJiBwa2dDb2x1bW4uaW5kZXhPZihwcm9jZXNzTmFtZSkgIT09IC0xKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIGZpbmRpbmcgaWYgcHJvY2VzcyBleGlzdHMuIE9yaWdpbmFsIGVycm9yOiAke2UubWVzc2FnZX1gKTtcbiAgfVxufTtcblxuLyoqXG4gKiBHZXQgVENQIHBvcnQgZm9yd2FyZGluZyB3aXRoIGFkYiBvbiB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKiBAcmV0dXJuIHtBcnJheS48U3RyaW5nPn0gVGhlIG91dHB1dCBvZiB0aGUgY29ycmVzcG9uZGluZyBhZGIgY29tbWFuZC4gQW4gYXJyYXkgY29udGFpbnMgZWFjaCBmb3J3YXJkaW5nIGxpbmUgb2Ygb3V0cHV0XG4gKi9cbm1ldGhvZHMuZ2V0Rm9yd2FyZExpc3QgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gIGxvZy5kZWJ1ZyhgTGlzdCBmb3J3YXJkaW5nIHBvcnRzYCk7XG4gIGxldCBjb25uZWN0aW9ucyA9IGF3YWl0IHRoaXMuYWRiRXhlYyhbJ2ZvcndhcmQnLCAnLS1saXN0J10pO1xuICByZXR1cm4gY29ubmVjdGlvbnMuc3BsaXQoJ1xcbicpO1xufTtcblxuLyoqXG4gKiBTZXR1cCBUQ1AgcG9ydCBmb3J3YXJkaW5nIHdpdGggYWRiIG9uIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IHN5c3RlbVBvcnQgLSBUaGUgbnVtYmVyIG9mIHRoZSBsb2NhbCBzeXN0ZW0gcG9ydC5cbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gZGV2aWNlUG9ydCAtIFRoZSBudW1iZXIgb2YgdGhlIHJlbW90ZSBkZXZpY2UgcG9ydC5cbiAqL1xubWV0aG9kcy5mb3J3YXJkUG9ydCA9IGFzeW5jIGZ1bmN0aW9uIChzeXN0ZW1Qb3J0LCBkZXZpY2VQb3J0KSB7XG4gIGxvZy5kZWJ1ZyhgRm9yd2FyZGluZyBzeXN0ZW06ICR7c3lzdGVtUG9ydH0gdG8gZGV2aWNlOiAke2RldmljZVBvcnR9YCk7XG4gIGF3YWl0IHRoaXMuYWRiRXhlYyhbJ2ZvcndhcmQnLCBgdGNwOiR7c3lzdGVtUG9ydH1gLCBgdGNwOiR7ZGV2aWNlUG9ydH1gXSk7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBUQ1AgcG9ydCBmb3J3YXJkaW5nIHdpdGggYWRiIG9uIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC4gVGhlIGZvcndhcmRpbmdcbiAqIGZvciB0aGUgZ2l2ZW4gcG9ydCBzaG91bGQgYmUgc2V0dXAgd2l0aCB7QGxpbmsgI2ZvcndhcmRQb3J0fSBmaXJzdC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IHN5c3RlbVBvcnQgLSBUaGUgbnVtYmVyIG9mIHRoZSBsb2NhbCBzeXN0ZW0gcG9ydFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG8gcmVtb3ZlIGZvcndhcmRpbmcgb24uXG4gKi9cbm1ldGhvZHMucmVtb3ZlUG9ydEZvcndhcmQgPSBhc3luYyBmdW5jdGlvbiAoc3lzdGVtUG9ydCkge1xuICBsb2cuZGVidWcoYFJlbW92aW5nIGZvcndhcmRlZCBwb3J0IHNvY2tldCBjb25uZWN0aW9uOiAke3N5c3RlbVBvcnR9IGApO1xuICBhd2FpdCB0aGlzLmFkYkV4ZWMoWydmb3J3YXJkJywgYC0tcmVtb3ZlYCwgYHRjcDoke3N5c3RlbVBvcnR9YF0pO1xufTtcblxuLyoqXG4gKiBTZXR1cCBUQ1AgcG9ydCBmb3J3YXJkaW5nIHdpdGggYWRiIG9uIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC4gVGhlIGRpZmZlcmVuY2VcbiAqIGJldHdlZW4ge0BsaW5rICNmb3J3YXJkUG9ydH0gaXMgdGhhdCB0aGlzIG1ldGhvZCBkb2VzIHNldHVwIGZvciBhbiBhYnN0cmFjdFxuICogbG9jYWwgcG9ydC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IHN5c3RlbVBvcnQgLSBUaGUgbnVtYmVyIG9mIHRoZSBsb2NhbCBzeXN0ZW0gcG9ydC5cbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gZGV2aWNlUG9ydCAtIFRoZSBudW1iZXIgb2YgdGhlIHJlbW90ZSBkZXZpY2UgcG9ydC5cbiAqL1xubWV0aG9kcy5mb3J3YXJkQWJzdHJhY3RQb3J0ID0gYXN5bmMgZnVuY3Rpb24gKHN5c3RlbVBvcnQsIGRldmljZVBvcnQpIHtcbiAgbG9nLmRlYnVnKGBGb3J3YXJkaW5nIHN5c3RlbTogJHtzeXN0ZW1Qb3J0fSB0byBhYnN0cmFjdCBkZXZpY2U6ICR7ZGV2aWNlUG9ydH1gKTtcbiAgYXdhaXQgdGhpcy5hZGJFeGVjKFsnZm9yd2FyZCcsIGB0Y3A6JHtzeXN0ZW1Qb3J0fWAsIGBsb2NhbGFic3RyYWN0OiR7ZGV2aWNlUG9ydH1gXSk7XG59O1xuXG4vKipcbiAqIEV4ZWN1dGUgcGluZyBzaGVsbCBjb21tYW5kIG9uIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSBjb21tYW5kIG91dHB1dCBjb250YWlucyAncGluZycgc3Vic3RyaW5nLlxuICogQHRocm93cyB7ZXJyb3J9IElmIHRoZXJlIHdhcyBhbiBlcnJvciB3aGlsZSBleGVjdXRpbmcgJ3BpbmcnIGNvbW1hbmQgb24gdGhlXG4gKiAgICAgICAgICAgICAgICAgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKi9cbm1ldGhvZHMucGluZyA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgbGV0IHN0ZG91dCA9IGF3YWl0IHRoaXMuc2hlbGwoW1wiZWNob1wiLCBcInBpbmdcIl0pO1xuICBpZiAoc3Rkb3V0LmluZGV4T2YoXCJwaW5nXCIpID09PSAwKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGBBREIgcGluZyBmYWlsZWQsIHJldHVybmVkICR7c3Rkb3V0fWApO1xufTtcblxuLyoqXG4gKiBSZXN0YXJ0IHRoZSBkZXZpY2UgdW5kZXIgdGVzdCB1c2luZyBhZGIgY29tbWFuZHMuXG4gKlxuICogQHRocm93cyB7ZXJyb3J9IElmIHN0YXJ0IGZhaWxzLlxuICovXG5tZXRob2RzLnJlc3RhcnQgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gIHRyeSB7XG4gICAgYXdhaXQgdGhpcy5zdG9wTG9nY2F0KCk7XG4gICAgYXdhaXQgdGhpcy5yZXN0YXJ0QWRiKCk7XG4gICAgYXdhaXQgdGhpcy53YWl0Rm9yRGV2aWNlKDYwKTtcbiAgICBhd2FpdCB0aGlzLnN0YXJ0TG9nY2F0KCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFJlc3RhcnQgZmFpbGVkLiBPcmdpbmlhbCBlcnJvcjogJHtlLm1lc3NhZ2V9YCk7XG4gIH1cbn07XG5cbi8qKlxuICogU3RhcnQgdGhlIGxvZ2NhdCBwcm9jZXNzIHRvIGdhdGhlciBsb2dzLlxuICpcbiAqIEB0aHJvd3Mge2Vycm9yfSBJZiByZXN0YXJ0IGZhaWxzLlxuICovXG5tZXRob2RzLnN0YXJ0TG9nY2F0ID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICBpZiAoIV8uaXNFbXB0eSh0aGlzLmxvZ2NhdCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJUcnlpbmcgdG8gc3RhcnQgbG9nY2F0IGNhcHR1cmUgYnV0IGl0J3MgYWxyZWFkeSBzdGFydGVkIVwiKTtcbiAgfVxuICB0aGlzLmxvZ2NhdCA9IG5ldyBMb2djYXQoe1xuICAgIGFkYjogdGhpcy5leGVjdXRhYmxlLFxuICAgIGRlYnVnOiBmYWxzZSxcbiAgICBkZWJ1Z1RyYWNlOiBmYWxzZSxcbiAgICBjbGVhckRldmljZUxvZ3NPblN0YXJ0OiAhIXRoaXMuY2xlYXJEZXZpY2VMb2dzT25TdGFydCxcbiAgfSk7XG4gIGF3YWl0IHRoaXMubG9nY2F0LnN0YXJ0Q2FwdHVyZSgpO1xufTtcblxuLyoqXG4gKiBTdG9wIHRoZSBhY3RpdmUgbG9nY2F0IHByb2Nlc3Mgd2hpY2ggZ2F0aGVycyBsb2dzLlxuICogVGhlIGNhbGwgd2lsbCBiZSBpZ25vcmVkIGlmIG5vIGxvZ2NhdCBwcm9jZXNzIGlzIHJ1bm5pbmcuXG4gKi9cbm1ldGhvZHMuc3RvcExvZ2NhdCA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgaWYgKF8uaXNFbXB0eSh0aGlzLmxvZ2NhdCkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdHJ5IHtcbiAgICBhd2FpdCB0aGlzLmxvZ2NhdC5zdG9wQ2FwdHVyZSgpO1xuICB9IGZpbmFsbHkge1xuICAgIHRoaXMubG9nY2F0ID0gbnVsbDtcbiAgfVxufTtcblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgb3V0cHV0IGZyb20gdGhlIGN1cnJlbnRseSBydW5uaW5nIGxvZ2NhdCBwcm9jZXNzLlxuICogVGhlIGxvZ2NhdCBwcm9jZXNzIHNob3VsZCBiZSBleGVjdXRlZCBieSB7MmxpbmsgI3N0YXJ0TG9nY2F0fSBtZXRob2QuXG4gKlxuICogQHJldHVybiB7c3RyaW5nfSBUaGUgY29sbGVjdGVkIGxvZ2NhdCBvdXRwdXQuXG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYgbG9nY2F0IHByb2Nlc3MgaXMgbm90IHJ1bm5pbmcuXG4gKi9cbm1ldGhvZHMuZ2V0TG9nY2F0TG9ncyA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKF8uaXNFbXB0eSh0aGlzLmxvZ2NhdCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBnZXQgbG9nY2F0IGxvZ3Mgc2luY2UgbG9nY2F0IGhhc24ndCBzdGFydGVkXCIpO1xuICB9XG4gIHJldHVybiB0aGlzLmxvZ2NhdC5nZXRMb2dzKCk7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgY2FsbGJhY2sgZm9yIHRoZSBsb2djYXQgb3V0cHV0IGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIC0gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uLCB3aGljaCBhY2NlcHRzIG9uZSBhcmd1bWVudC4gVGhlIGFyZ3VtZW50IGlzXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGEgbG9nIHJlY29yZCBvYmplY3Qgd2l0aCBgdGltZXN0YW1wYCwgYGxldmVsYCBhbmQgYG1lc3NhZ2VgIHByb3BlcnRpZXMuXG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYgbG9nY2F0IHByb2Nlc3MgaXMgbm90IHJ1bm5pbmcuXG4gKi9cbm1ldGhvZHMuc2V0TG9nY2F0TGlzdGVuZXIgPSBmdW5jdGlvbiAobGlzdGVuZXIpIHtcbiAgaWYgKF8uaXNFbXB0eSh0aGlzLmxvZ2NhdCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJMb2djYXQgcHJvY2VzcyBoYXNuJ3QgYmVlbiBzdGFydGVkXCIpO1xuICB9XG4gIHRoaXMubG9nY2F0Lm9uKCdvdXRwdXQnLCBsaXN0ZW5lcik7XG59O1xuXG4vKipcbiAqIFJlbW92ZXMgdGhlIHByZXZpb3VzbHkgc2V0IGNhbGxiYWNrIGZvciB0aGUgbG9nY2F0IG91dHB1dCBldmVudC5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciAtIFRoZSBsaXN0ZW5lciBmdW5jdGlvbiwgd2hpY2ggaGFzIGJlZW4gcHJldmlvdXNseVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgdG8gYHNldExvZ2NhdExpc3RlbmVyYFxuICogQHRocm93cyB7RXJyb3J9IElmIGxvZ2NhdCBwcm9jZXNzIGlzIG5vdCBydW5uaW5nLlxuICovXG5tZXRob2RzLnJlbW92ZUxvZ2NhdExpc3RlbmVyID0gZnVuY3Rpb24gKGxpc3RlbmVyKSB7XG4gIGlmIChfLmlzRW1wdHkodGhpcy5sb2djYXQpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTG9nY2F0IHByb2Nlc3MgaGFzbid0IGJlZW4gc3RhcnRlZFwiKTtcbiAgfVxuICB0aGlzLmxvZ2NhdC5yZW1vdmVMaXN0ZW5lcignb3V0cHV0JywgbGlzdGVuZXIpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGxpc3Qgb2YgcHJvY2VzcyBpZHMgZm9yIHRoZSBwYXJ0aWN1bGFyIHByb2Nlc3Mgb24gdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gVGhlIHBhcnQgb2YgcHJvY2VzcyBuYW1lLlxuICogQHJldHVybiB7QXJyYXkuPG51bWJlcj59IFRoZSBsaXN0IG9mIG1hdGNoZWQgcHJvY2VzcyBJRHMgb3IgYW4gZW1wdHkgbGlzdC5cbiAqL1xubWV0aG9kcy5nZXRQSURzQnlOYW1lID0gYXN5bmMgZnVuY3Rpb24gKG5hbWUpIHtcbiAgbG9nLmRlYnVnKGBHZXR0aW5nIGFsbCBwcm9jZXNzZXMgd2l0aCAke25hbWV9YCk7XG4gIHRyeSB7XG4gICAgLy8gcHMgPGNvbW0+IHdoZXJlIGNvbW0gaXMgbGFzdCAxNSBjaGFyYWN0ZXJzIG9mIHBhY2thZ2UgbmFtZVxuICAgIGlmIChuYW1lLmxlbmd0aCA+IDE1KSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIobmFtZS5sZW5ndGggLSAxNSk7XG4gICAgfVxuICAgIGxldCBzdGRvdXQgPSAoYXdhaXQgdGhpcy5zaGVsbChbXCJwc1wiXSkpLnRyaW0oKTtcbiAgICBsZXQgcGlkcyA9IFtdO1xuICAgIGZvciAobGV0IGxpbmUgb2Ygc3Rkb3V0LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgICBpZiAobGluZS5pbmRleE9mKG5hbWUpICE9PSAtMSkge1xuICAgICAgICBsZXQgbWF0Y2ggPSAvW15cXHQgXStbXFx0IF0rKFswLTldKykvLmV4ZWMobGluZSk7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgIHBpZHMucHVzaChwYXJzZUludChtYXRjaFsxXSwgMTApKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBleHRyYWN0IFBJRCBmcm9tIHBzIG91dHB1dDogJHtsaW5lfWApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwaWRzO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gZ2V0IHBpZHMgZm9yICR7bmFtZX0uIE9yZ2luaWFsIGVycm9yOiAke2UubWVzc2FnZX1gKTtcbiAgfVxufTtcblxuLyoqXG4gKiBHZXQgdGhlIGxpc3Qgb2YgcHJvY2VzcyBpZHMgZm9yIHRoZSBwYXJ0aWN1bGFyIHByb2Nlc3Mgb24gdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gVGhlIHBhcnQgb2YgcHJvY2VzcyBuYW1lLlxuICogQHJldHVybiB7QXJyYXkuPG51bWJlcj59IFRoZSBsaXN0IG9mIG1hdGNoZWQgcHJvY2VzcyBJRHMgb3IgYW4gZW1wdHkgbGlzdC5cbiAqL1xubWV0aG9kcy5raWxsUHJvY2Vzc2VzQnlOYW1lID0gYXN5bmMgZnVuY3Rpb24gKG5hbWUpIHtcbiAgdHJ5IHtcbiAgICBsb2cuZGVidWcoYEF0dGVtcHRpbmcgdG8ga2lsbCBhbGwgJHtuYW1lfSBwcm9jZXNzZXNgKTtcbiAgICBsZXQgcGlkcyA9IGF3YWl0IHRoaXMuZ2V0UElEc0J5TmFtZShuYW1lKTtcbiAgICBpZiAoXy5pc0VtcHR5KHBpZHMpKSB7XG4gICAgICBsb2cuaW5mbyhgTm8gJyR7bmFtZX0nIHByb2Nlc3MgaGFzIGJlZW4gZm91bmRgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZm9yIChsZXQgcGlkIG9mIHBpZHMpIHtcbiAgICAgIGF3YWl0IHRoaXMua2lsbFByb2Nlc3NCeVBJRChwaWQpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIGtpbGwgJHtuYW1lfSBwcm9jZXNzZXMuIE9yaWdpbmFsIGVycm9yOiAke2UubWVzc2FnZX1gKTtcbiAgfVxufTtcblxuLyoqXG4gKiBLaWxsIHRoZSBwYXJ0aWN1bGFyIHByb2Nlc3Mgb24gdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICogVGhlIGN1cnJlbnQgdXNlciBpcyBhdXRvbWF0aWNhbGx5IHN3aXRjaGVkIHRvIHJvb3QgaWYgbmVjZXNzYXJ5IGluIG9yZGVyXG4gKiB0byBwcm9wZXJseSBraWxsIHRoZSBwcm9jZXNzLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gcGlkIC0gVGhlIElEIG9mIHRoZSBwcm9jZXNzIHRvIGJlIGtpbGxlZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gS2lsbCBjb21tYW5kIHN0ZG91dC5cbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiB0aGUgcHJvY2VzcyB3aXRoIGdpdmVuIElEIGlzIG5vdCBwcmVzZW50IG9yIGNhbm5vdCBiZSBraWxsZWQuXG4gKi9cbm1ldGhvZHMua2lsbFByb2Nlc3NCeVBJRCA9IGFzeW5jIGZ1bmN0aW9uIChwaWQpIHtcbiAgbG9nLmRlYnVnKGBBdHRlbXB0aW5nIHRvIGtpbGwgcHJvY2VzcyAke3BpZH1gKTtcbiAgbGV0IHdhc1Jvb3QgPSBmYWxzZTtcbiAgbGV0IGJlY2FtZVJvb3QgPSBmYWxzZTtcbiAgdHJ5IHtcbiAgICB0cnkge1xuICAgICAgLy8gQ2hlY2sgaWYgdGhlIHByb2Nlc3MgZXhpc3RzIGFuZCB0aHJvdyBhbiBleGNlcHRpb24gb3RoZXJ3aXNlXG4gICAgICBhd2FpdCB0aGlzLnNoZWxsKFsna2lsbCcsICctMCcsIHBpZF0pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmICghZS5tZXNzYWdlLmluY2x1ZGVzKCdPcGVyYXRpb24gbm90IHBlcm1pdHRlZCcpKSB7XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICB3YXNSb290ID0gKGF3YWl0IHRoaXMuc2hlbGwoWyd3aG9hbWknXSkpID09PSAncm9vdCc7XG4gICAgICB9IGNhdGNoIChpZ24pIHt9XG4gICAgICBpZiAod2FzUm9vdCkge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgICAgbG9nLmluZm8oYENhbm5vdCBraWxsIFBJRCAke3BpZH0gZHVlIHRvIGluc3VmZmljaWVudCBwZXJtaXNzaW9ucy4gUmV0cnlpbmcgYXMgcm9vdGApO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYmVjYW1lUm9vdCA9IGF3YWl0IHRoaXMucm9vdCgpO1xuICAgICAgfSBjYXRjaCAoaWduKSB7fVxuICAgICAgYXdhaXQgdGhpcy5zaGVsbChbJ2tpbGwnLCAnLTAnLCBwaWRdKTtcbiAgICB9XG4gICAgY29uc3QgdGltZW91dE1zID0gMTAwMDtcbiAgICBsZXQgc3Rkb3V0O1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB3YWl0Rm9yQ29uZGl0aW9uKGFzeW5jICgpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBzdGRvdXQgPSBhd2FpdCB0aGlzLnNoZWxsKFsna2lsbCcsIHBpZF0pO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIC8vIGtpbGwgcmV0dXJucyBub24temVybyBjb2RlIGlmIHRoZSBwcm9jZXNzIGlzIGFscmVhZHkga2lsbGVkXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0sIHt3YWl0TXM6IHRpbWVvdXRNcywgaW50ZXJ2YWxNczogMzAwfSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBsb2cud2FybihgQ2Fubm90IGtpbGwgcHJvY2VzcyAke3BpZH0gaW4gJHt0aW1lb3V0TXN9IG1zLiBUcnlpbmcgdG8gZm9yY2Uga2lsbC4uLmApO1xuICAgICAgc3Rkb3V0ID0gYXdhaXQgdGhpcy5zaGVsbChbJ2tpbGwnLCAnLTknLCBwaWRdKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0ZG91dDtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoYmVjYW1lUm9vdCkge1xuICAgICAgYXdhaXQgdGhpcy51bnJvb3QoKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQnJvYWRjYXN0IHByb2Nlc3Mga2lsbGluZyBvbiB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGludGVudCAtIFRoZSBuYW1lIG9mIHRoZSBpbnRlbnQgdG8gYnJvYWRjYXN0IHRvLlxuICogQHBhcmFtIHtzdHJpbmd9IHByb2Nlc3NOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGtpbGxlZCBwcm9jZXNzLlxuICogQHRocm93cyB7ZXJyb3J9IElmIHRoZSBwcm9jZXNzIHdhcyBub3Qga2lsbGVkLlxuICovXG5tZXRob2RzLmJyb2FkY2FzdFByb2Nlc3NFbmQgPSBhc3luYyBmdW5jdGlvbiAoaW50ZW50LCBwcm9jZXNzTmFtZSkge1xuICAvLyBzdGFydCB0aGUgYnJvYWRjYXN0IHdpdGhvdXQgd2FpdGluZyBmb3IgaXQgdG8gZmluaXNoLlxuICB0aGlzLmJyb2FkY2FzdChpbnRlbnQpO1xuICAvLyB3YWl0IGZvciB0aGUgcHJvY2VzcyB0byBlbmRcbiAgbGV0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgbGV0IHRpbWVvdXRNcyA9IDQwMDAwO1xuICB0cnkge1xuICAgIHdoaWxlICgoRGF0ZS5ub3coKSAtIHN0YXJ0KSA8IHRpbWVvdXRNcykge1xuICAgICAgaWYgKGF3YWl0IHRoaXMucHJvY2Vzc0V4aXN0cyhwcm9jZXNzTmFtZSkpIHtcbiAgICAgICAgLy8gY29vbCBkb3duXG4gICAgICAgIGF3YWl0IHNsZWVwKDQwMCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoYFByb2Nlc3MgbmV2ZXIgZGllZCB3aXRoaW4gJHt0aW1lb3V0TXN9IG1zYCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byBicm9hZGNhc3QgcHJvY2VzcyBlbmQuIE9yaWdpbmFsIGVycm9yOiAke2UubWVzc2FnZX1gKTtcbiAgfVxufTtcblxuLyoqXG4gKiBCcm9hZGNhc3QgYSBtZXNzYWdlIHRvIHRoZSBnaXZlbiBpbnRlbnQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGludGVudCAtIFRoZSBuYW1lIG9mIHRoZSBpbnRlbnQgdG8gYnJvYWRjYXN0IHRvLlxuICogQHRocm93cyB7ZXJyb3J9IElmIGludGVudCBuYW1lIGlzIG5vdCBhIHZhbGlkIGNsYXNzIG5hbWUuXG4gKi9cbm1ldGhvZHMuYnJvYWRjYXN0ID0gYXN5bmMgZnVuY3Rpb24gKGludGVudCkge1xuICBpZiAoIXRoaXMuaXNWYWxpZENsYXNzKGludGVudCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgaW50ZW50ICR7aW50ZW50fWApO1xuICB9XG4gIGxvZy5kZWJ1ZyhgQnJvYWRjYXN0aW5nOiAke2ludGVudH1gKTtcbiAgYXdhaXQgdGhpcy5zaGVsbChbJ2FtJywgJ2Jyb2FkY2FzdCcsICctYScsIGludGVudF0pO1xufTtcblxuLyoqXG4gKiBLaWxsIEFuZHJvaWQgaW5zdHJ1bWVudHMgaWYgdGhleSBhcmUgY3VycmVudGx5IHJ1bm5pbmcuXG4gKi9cbm1ldGhvZHMuZW5kQW5kcm9pZENvdmVyYWdlID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5pbnN0cnVtZW50UHJvYyAmJiB0aGlzLmluc3RydW1lbnRQcm9jLmlzUnVubmluZykge1xuICAgIGF3YWl0IHRoaXMuaW5zdHJ1bWVudFByb2Muc3RvcCgpO1xuICB9XG59O1xuXG4vKipcbiAqIEluc3RydW1lbnQgdGhlIHBhcnRpY3VsYXIgYWN0aXZpdHkuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHBrZyAtIFRoZSBuYW1lIG9mIHRoZSBwYWNrYWdlIHRvIGJlIGluc3RydW1lbnRlZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBhY3Rpdml0eSAtIFRoZSBuYW1lIG9mIHRoZSBtYWluIGFjdGl2aXR5IGluIHRoaXMgcGFja2FnZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpbnN0cnVtZW50V2l0aCAtIFRoZSBuYW1lIG9mIHRoZSBwYWNrYWdlIHRvIGluc3RydW1lbnRcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBhY3Rpdml0eSB3aXRoLlxuICogQHRocm93cyB7ZXJyb3J9IElmIGFueSBleGNlcHRpb24gaXMgcmVwb3J0ZWQgYnkgYWRiIHNoZWxsLlxuICovXG5tZXRob2RzLmluc3RydW1lbnQgPSBhc3luYyBmdW5jdGlvbiAocGtnLCBhY3Rpdml0eSwgaW5zdHJ1bWVudFdpdGgpIHtcbiAgaWYgKGFjdGl2aXR5WzBdICE9PSBcIi5cIikge1xuICAgIHBrZyA9IFwiXCI7XG4gIH1cbiAgbGV0IHBrZ0FjdGl2aXR5ID0gKHBrZyArIGFjdGl2aXR5KS5yZXBsYWNlKC9cXC4rL2csICcuJyk7IC8vIEZpeCBwa2cuLmFjdGl2aXR5IGVycm9yXG4gIGxldCBzdGRvdXQgPSBhd2FpdCB0aGlzLnNoZWxsKFtcbiAgICAnYW0nLCAnaW5zdHJ1bWVudCcsXG4gICAgJy1lJywgJ21haW5fYWN0aXZpdHknLFxuICAgIHBrZ0FjdGl2aXR5LFxuICAgIGluc3RydW1lbnRXaXRoLFxuICBdKTtcbiAgaWYgKHN0ZG91dC5pbmRleE9mKFwiRXhjZXB0aW9uXCIpICE9PSAtMSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBleGNlcHRpb24gZHVyaW5nIGluc3RydW1lbnRhdGlvbi4gT3JpZ2luYWwgZXJyb3IgJHtzdGRvdXQuc3BsaXQoXCJcXG5cIilbMF19YCk7XG4gIH1cbn07XG5cbi8qKlxuICogQ29sbGVjdCBBbmRyb2lkIGNvdmVyYWdlIGJ5IGluc3RydW1lbnRpbmcgdGhlIHBhcnRpY3VsYXIgYWN0aXZpdHkuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGluc3RydW1lbnRDbGFzcyAtIFRoZSBuYW1lIG9mIHRoZSBpbnN0cnVtZW50YXRpb24gY2xhc3MuXG4gKiBAcGFyYW0ge3N0cmluZ30gd2FpdFBrZyAtIFRoZSBuYW1lIG9mIHRoZSBwYWNrYWdlIHRvIGJlIGluc3RydW1lbnRlZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSB3YWl0QWN0aXZpdHkgLSBUaGUgbmFtZSBvZiB0aGUgbWFpbiBhY3Rpdml0eSBpbiB0aGlzIHBhY2thZ2UuXG4gKlxuICogQHJldHVybiB7cHJvbWlzZX0gVGhlIHByb21pc2UgaXMgc3VjY2Vzc2Z1bGx5IHJlc29sdmVkIGlmIHRoZSBpbnN0cnVtZW50YXRpb24gc3RhcnRzXG4gKiAgICAgICAgICAgICAgICAgICB3aXRob3V0IGVycm9ycy5cbiAqL1xubWV0aG9kcy5hbmRyb2lkQ292ZXJhZ2UgPSBhc3luYyBmdW5jdGlvbiAoaW5zdHJ1bWVudENsYXNzLCB3YWl0UGtnLCB3YWl0QWN0aXZpdHkpIHtcbiAgaWYgKCF0aGlzLmlzVmFsaWRDbGFzcyhpbnN0cnVtZW50Q2xhc3MpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGNsYXNzICR7aW5zdHJ1bWVudENsYXNzfWApO1xuICB9XG4gIHJldHVybiBhd2FpdCBuZXcgQihhc3luYyAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgbGV0IGFyZ3MgPSB0aGlzLmV4ZWN1dGFibGUuZGVmYXVsdEFyZ3NcbiAgICAgIC5jb25jYXQoWydzaGVsbCcsICdhbScsICdpbnN0cnVtZW50JywgJy1lJywgJ2NvdmVyYWdlJywgJ3RydWUnLCAnLXcnXSlcbiAgICAgIC5jb25jYXQoW2luc3RydW1lbnRDbGFzc10pO1xuICAgIGxvZy5kZWJ1ZyhgQ29sbGVjdGluZyBjb3ZlcmFnZSBkYXRhIHdpdGg6ICR7W3RoaXMuZXhlY3V0YWJsZS5wYXRoXS5jb25jYXQoYXJncykuam9pbignICcpfWApO1xuICAgIHRyeSB7XG4gICAgICAvLyBhbSBpbnN0cnVtZW50IHJ1bnMgZm9yIHRoZSBsaWZlIG9mIHRoZSBhcHAgcHJvY2Vzcy5cbiAgICAgIHRoaXMuaW5zdHJ1bWVudFByb2MgPSBuZXcgU3ViUHJvY2Vzcyh0aGlzLmV4ZWN1dGFibGUucGF0aCwgYXJncyk7XG4gICAgICBhd2FpdCB0aGlzLmluc3RydW1lbnRQcm9jLnN0YXJ0KDApO1xuICAgICAgdGhpcy5pbnN0cnVtZW50UHJvYy5vbignb3V0cHV0JywgKHN0ZG91dCwgc3RkZXJyKSA9PiB7XG4gICAgICAgIGlmIChzdGRlcnIpIHtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKGBGYWlsZWQgdG8gcnVuIGluc3RydW1lbnRhdGlvbi4gT3JpZ2luYWwgZXJyb3I6ICR7c3RkZXJyfWApKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBhd2FpdCB0aGlzLndhaXRGb3JBY3Rpdml0eSh3YWl0UGtnLCB3YWl0QWN0aXZpdHkpO1xuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoYEFuZHJvaWQgY292ZXJhZ2UgZmFpbGVkLiBPcmlnaW5hbCBlcnJvcjogJHtlLm1lc3NhZ2V9YCkpO1xuICAgIH1cbiAgfSk7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgcGFydGljdWxhciBwcm9wZXJ0eSBvZiB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5IC0gVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5LiBUaGlzIG5hbWUgc2hvdWxkXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZSBrbm93biB0byBfYWRiIHNoZWxsIGdldHByb3BfIHRvb2wuXG4gKlxuICogQHJldHVybiB7c3RyaW5nfSBUaGUgdmFsdWUgb2YgdGhlIGdpdmVuIHByb3BlcnR5LlxuICovXG5tZXRob2RzLmdldERldmljZVByb3BlcnR5ID0gYXN5bmMgZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gIGxldCBzdGRvdXQgPSBhd2FpdCB0aGlzLnNoZWxsKFsnZ2V0cHJvcCcsIHByb3BlcnR5XSk7XG4gIGxldCB2YWwgPSBzdGRvdXQudHJpbSgpO1xuICBsb2cuZGVidWcoYEN1cnJlbnQgZGV2aWNlIHByb3BlcnR5ICcke3Byb3BlcnR5fSc6ICR7dmFsfWApO1xuICByZXR1cm4gdmFsO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIHBhcnRpY3VsYXIgcHJvcGVydHkgb2YgdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eSAtIFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eS4gVGhpcyBuYW1lIHNob3VsZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgYmUga25vd24gdG8gX2FkYiBzaGVsbCBzZXRwcm9wXyB0b29sLlxuICogQHBhcmFtIHtzdHJpbmd9IHZhbCAtIFRoZSBuZXcgcHJvcGVydHkgdmFsdWUuXG4gKlxuICogQHRocm93cyB7ZXJyb3J9IElmIF9zZXRwcm9wXyB1dGlsaXR5IGZhaWxzIHRvIGNoYW5nZSBwcm9wZXJ0eSB2YWx1ZS5cbiAqL1xubWV0aG9kcy5zZXREZXZpY2VQcm9wZXJ0eSA9IGFzeW5jIGZ1bmN0aW9uIChwcm9wLCB2YWwpIHtcbiAgbGV0IGFwaUxldmVsID0gYXdhaXQgdGhpcy5nZXRBcGlMZXZlbCgpO1xuICBpZiAoYXBpTGV2ZWwgPj0gMjYpIHtcbiAgICBsb2cuZGVidWcoYFJ1bm5pbmcgYWRiIHJvb3QsIEFuZHJvaWQgTyBuZWVkcyBhZGIgdG8gYmUgcm9vdGVkIHRvIHNldERldmljZVByb3BlcnR5YCk7XG4gICAgYXdhaXQgdGhpcy5yb290KCk7XG4gIH1cbiAgbG9nLmRlYnVnKGBTZXR0aW5nIGRldmljZSBwcm9wZXJ0eSAnJHtwcm9wfScgdG8gJyR7dmFsfSdgKTtcbiAgbGV0IGVycjtcbiAgdHJ5IHtcbiAgICBhd2FpdCB0aGlzLnNoZWxsKFsnc2V0cHJvcCcsIHByb3AsIHZhbF0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgZXJyID0gZTtcbiAgfVxuICBpZiAoYXBpTGV2ZWwgPj0gMjYpIHtcbiAgICBsb2cuZGVidWcoYFJlbW92aW5nIGFkYiByb290IGZvciBzZXREZXZpY2VQcm9wZXJ0eWApO1xuICAgIGF3YWl0IHRoaXMudW5yb290KCk7XG4gIH1cbiAgaWYgKGVycikgdGhyb3cgZXJyOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGN1cmx5XG59O1xuXG4vKipcbiAqIEByZXR1cm4ge3N0cmluZ30gQ3VycmVudCBzeXN0ZW0gbGFuZ3VhZ2Ugb24gdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICovXG5tZXRob2RzLmdldERldmljZVN5c0xhbmd1YWdlID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICByZXR1cm4gYXdhaXQgdGhpcy5nZXREZXZpY2VQcm9wZXJ0eShcInBlcnNpc3Quc3lzLmxhbmd1YWdlXCIpO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIG5ldyBzeXN0ZW0gbGFuZ3VhZ2Ugb24gdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZSAtIFRoZSBuZXcgbGFuZ3VhZ2UgdmFsdWUuXG4gKi9cbm1ldGhvZHMuc2V0RGV2aWNlU3lzTGFuZ3VhZ2UgPSBhc3luYyBmdW5jdGlvbiAobGFuZ3VhZ2UpIHtcbiAgcmV0dXJuIGF3YWl0IHRoaXMuc2V0RGV2aWNlUHJvcGVydHkoXCJwZXJzaXN0LnN5cy5sYW5ndWFnZVwiLCBsYW5ndWFnZS50b0xvd2VyQ2FzZSgpKTtcbn07XG5cbi8qKlxuICogQHJldHVybiB7c3RyaW5nfSBDdXJyZW50IGNvdW50cnkgbmFtZSBvbiB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKi9cbm1ldGhvZHMuZ2V0RGV2aWNlU3lzQ291bnRyeSA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0RGV2aWNlUHJvcGVydHkoXCJwZXJzaXN0LnN5cy5jb3VudHJ5XCIpO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIG5ldyBzeXN0ZW0gY291bnRyeSBvbiB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGNvdW50cnkgLSBUaGUgbmV3IGNvdW50cnkgdmFsdWUuXG4gKi9cbm1ldGhvZHMuc2V0RGV2aWNlU3lzQ291bnRyeSA9IGFzeW5jIGZ1bmN0aW9uIChjb3VudHJ5KSB7XG4gIHJldHVybiBhd2FpdCB0aGlzLnNldERldmljZVByb3BlcnR5KFwicGVyc2lzdC5zeXMuY291bnRyeVwiLCBjb3VudHJ5LnRvVXBwZXJDYXNlKCkpO1xufTtcblxuLyoqXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEN1cnJlbnQgc3lzdGVtIGxvY2FsZSBuYW1lIG9uIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqL1xubWV0aG9kcy5nZXREZXZpY2VTeXNMb2NhbGUgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBhd2FpdCB0aGlzLmdldERldmljZVByb3BlcnR5KFwicGVyc2lzdC5zeXMubG9jYWxlXCIpO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIG5ldyBzeXN0ZW0gbG9jYWxlIG9uIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbG9jYWxlIC0gVGhlIG5ldyBsb2NhbGUgdmFsdWUuXG4gKi9cbm1ldGhvZHMuc2V0RGV2aWNlU3lzTG9jYWxlID0gYXN5bmMgZnVuY3Rpb24gKGxvY2FsZSkge1xuICByZXR1cm4gYXdhaXQgdGhpcy5zZXREZXZpY2VQcm9wZXJ0eShcInBlcnNpc3Quc3lzLmxvY2FsZVwiLCBsb2NhbGUpO1xufTtcblxuLyoqXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEN1cnJlbnQgcHJvZHVjdCBsYW5ndWFnZSBuYW1lIG9uIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqL1xubWV0aG9kcy5nZXREZXZpY2VQcm9kdWN0TGFuZ3VhZ2UgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBhd2FpdCB0aGlzLmdldERldmljZVByb3BlcnR5KFwicm8ucHJvZHVjdC5sb2NhbGUubGFuZ3VhZ2VcIik7XG59O1xuXG4vKipcbiAqIEByZXR1cm4ge3N0cmluZ30gQ3VycmVudCBwcm9kdWN0IGNvdW50cnkgbmFtZSBvbiB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKi9cbm1ldGhvZHMuZ2V0RGV2aWNlUHJvZHVjdENvdW50cnkgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBhd2FpdCB0aGlzLmdldERldmljZVByb3BlcnR5KFwicm8ucHJvZHVjdC5sb2NhbGUucmVnaW9uXCIpO1xufTtcblxuLyoqXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEN1cnJlbnQgcHJvZHVjdCBsb2NhbGUgbmFtZSBvbiB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKi9cbm1ldGhvZHMuZ2V0RGV2aWNlUHJvZHVjdExvY2FsZSA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0RGV2aWNlUHJvcGVydHkoXCJyby5wcm9kdWN0LmxvY2FsZVwiKTtcbn07XG5cbi8qKlxuICogQHJldHVybiB7c3RyaW5nfSBUaGUgbW9kZWwgbmFtZSBvZiB0aGUgZGV2aWNlIHVuZGVyIHRlc3QuXG4gKi9cbm1ldGhvZHMuZ2V0TW9kZWwgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBhd2FpdCB0aGlzLmdldERldmljZVByb3BlcnR5KFwicm8ucHJvZHVjdC5tb2RlbFwiKTtcbn07XG5cbi8qKlxuICogQHJldHVybiB7c3RyaW5nfSBUaGUgbWFudWZhY3R1cmVyIG5hbWUgb2YgdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICovXG5tZXRob2RzLmdldE1hbnVmYWN0dXJlciA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0RGV2aWNlUHJvcGVydHkoXCJyby5wcm9kdWN0Lm1hbnVmYWN0dXJlclwiKTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBjdXJyZW50IHNjcmVlbiBzaXplLlxuICpcbiAqIEByZXR1cm4ge3N0cmluZ30gRGV2aWNlIHNjcmVlbiBzaXplIGFzIHN0cmluZyBpbiBmb3JtYXQgJ1d4SCcgb3JcbiAqICAgICAgICAgICAgICAgICAgX251bGxfIGlmIGl0IGNhbm5vdCBiZSBkZXRlcm1pbmVkLlxuICovXG5tZXRob2RzLmdldFNjcmVlblNpemUgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gIGxldCBzdGRvdXQgPSBhd2FpdCB0aGlzLnNoZWxsKFsnd20nLCAnc2l6ZSddKTtcbiAgbGV0IHNpemUgPSBuZXcgUmVnRXhwKC9QaHlzaWNhbCBzaXplOiAoW15cXHI/XFxuXSspKi9nKS5leGVjKHN0ZG91dCk7XG4gIGlmIChzaXplICYmIHNpemUubGVuZ3RoID49IDIpIHtcbiAgICByZXR1cm4gc2l6ZVsxXS50cmltKCk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgY3VycmVudCBzY3JlZW4gZGVuc2l0eSBpbiBkcGlcbiAqXG4gKiBAcmV0dXJuIHs/bnVtYmVyfSBEZXZpY2Ugc2NyZWVuIGRlbnNpdHkgYXMgYSBudW1iZXIgb3IgX251bGxfIGlmIGl0XG4gKiAgICAgICAgICAgICAgICAgIGNhbm5vdCBiZSBkZXRlcm1pbmVkXG4gKi9cbm1ldGhvZHMuZ2V0U2NyZWVuRGVuc2l0eSA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgbGV0IHN0ZG91dCA9IGF3YWl0IHRoaXMuc2hlbGwoWyd3bScsICdkZW5zaXR5J10pO1xuICBsZXQgZGVuc2l0eSA9IG5ldyBSZWdFeHAoL1BoeXNpY2FsIGRlbnNpdHk6IChbXlxccj9cXG5dKykqL2cpLmV4ZWMoc3Rkb3V0KTtcbiAgaWYgKGRlbnNpdHkgJiYgZGVuc2l0eS5sZW5ndGggPj0gMikge1xuICAgIGxldCBkZW5zaXR5TnVtYmVyID0gcGFyc2VJbnQoZGVuc2l0eVsxXS50cmltKCksIDEwKTtcbiAgICByZXR1cm4gaXNOYU4oZGVuc2l0eU51bWJlcikgPyBudWxsIDogZGVuc2l0eU51bWJlcjtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn07XG5cbi8qKlxuICogU2V0dXAgSFRUUCBwcm94eSBpbiBkZXZpY2Ugc2V0dGluZ3MuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHByb3h5SG9zdCAtIFRoZSBob3N0IG5hbWUgb2YgdGhlIHByb3h5LlxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBwcm94eVBvcnQgLSBUaGUgcG9ydCBudW1iZXIgdG8gYmUgc2V0LlxuICovXG5tZXRob2RzLnNldEh0dHBQcm94eSA9IGFzeW5jIGZ1bmN0aW9uIChwcm94eUhvc3QsIHByb3h5UG9ydCkge1xuICBsZXQgcHJveHkgPSBgJHtwcm94eUhvc3R9OiR7cHJveHlQb3J0fWA7XG4gIGlmIChfLmlzVW5kZWZpbmVkKHByb3h5SG9zdCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbGwgdG8gc2V0SHR0cFByb3h5IG1ldGhvZCB3aXRoIHVuZGVmaW5lZCBwcm94eV9ob3N0OiAke3Byb3h5fWApO1xuICB9XG4gIGlmIChfLmlzVW5kZWZpbmVkKHByb3h5UG9ydCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbGwgdG8gc2V0SHR0cFByb3h5IG1ldGhvZCB3aXRoIHVuZGVmaW5lZCBwcm94eV9wb3J0ICR7cHJveHl9YCk7XG4gIH1cbiAgYXdhaXQgdGhpcy5zZXRTZXR0aW5nKCdnbG9iYWwnLCAnaHR0cF9wcm94eScsIHByb3h5KTtcbiAgYXdhaXQgdGhpcy5zZXRTZXR0aW5nKCdzZWN1cmUnLCAnaHR0cF9wcm94eScsIHByb3h5KTtcbiAgYXdhaXQgdGhpcy5zZXRTZXR0aW5nKCdzeXN0ZW0nLCAnaHR0cF9wcm94eScsIHByb3h5KTtcbiAgYXdhaXQgdGhpcy5zZXRTZXR0aW5nKCdzeXN0ZW0nLCAnZ2xvYmFsX2h0dHBfcHJveHlfaG9zdCcsIHByb3h5SG9zdCk7XG4gIGF3YWl0IHRoaXMuc2V0U2V0dGluZygnc3lzdGVtJywgJ2dsb2JhbF9odHRwX3Byb3h5X3BvcnQnLCBwcm94eVBvcnQpO1xufTtcblxuLyoqXG4gKiBTZXQgZGV2aWNlIHByb3BlcnR5LlxuICogW2FuZHJvaWQucHJvdmlkZXIuU2V0dGluZ3Nde0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLmFuZHJvaWQuY29tL3JlZmVyZW5jZS9hbmRyb2lkL3Byb3ZpZGVyL1NldHRpbmdzLmh0bWx9XG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVzcGFjZSAtIG9uZSBvZiB7c3lzdGVtLCBzZWN1cmUsIGdsb2JhbH0sIGNhc2UtaW5zZW5zaXRpdmUuXG4gKiBAcGFyYW0ge3N0cmluZ30gc2V0dGluZyAtIHByb3BlcnR5IG5hbWUuXG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IHZhbHVlIC0gcHJvcGVydHkgdmFsdWUuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IGNvbW1hbmQgb3V0cHV0LlxuICovXG5tZXRob2RzLnNldFNldHRpbmcgPSBhc3luYyBmdW5jdGlvbiAobmFtZXNwYWNlLCBzZXR0aW5nLCB2YWx1ZSkge1xuICByZXR1cm4gYXdhaXQgdGhpcy5zaGVsbChbJ3NldHRpbmdzJywgJ3B1dCcsIG5hbWVzcGFjZSwgc2V0dGluZywgdmFsdWVdKTtcbn07XG5cbi8qKlxuICogR2V0IGRldmljZSBwcm9wZXJ0eS5cbiAqIFthbmRyb2lkLnByb3ZpZGVyLlNldHRpbmdzXXtAbGluayBodHRwczovL2RldmVsb3Blci5hbmRyb2lkLmNvbS9yZWZlcmVuY2UvYW5kcm9pZC9wcm92aWRlci9TZXR0aW5ncy5odG1sfVxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lc3BhY2UgLSBvbmUgb2Yge3N5c3RlbSwgc2VjdXJlLCBnbG9iYWx9LCBjYXNlLWluc2Vuc2l0aXZlLlxuICogQHBhcmFtIHtzdHJpbmd9IHNldHRpbmcgLSBwcm9wZXJ0eSBuYW1lLlxuICogQHJldHVybiB7c3RyaW5nfSBwcm9wZXJ0eSB2YWx1ZS5cbiAqL1xubWV0aG9kcy5nZXRTZXR0aW5nID0gYXN5bmMgZnVuY3Rpb24gKG5hbWVzcGFjZSwgc2V0dGluZykge1xuICByZXR1cm4gYXdhaXQgdGhpcy5zaGVsbChbJ3NldHRpbmdzJywgJ2dldCcsIG5hbWVzcGFjZSwgc2V0dGluZ10pO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgYGFkYiBidWdyZXBvcnRgIGNvbW1hbmQgb3V0cHV0LiBUaGlzXG4gKiBvcGVyYXRpb24gbWF5IHRha2UgdXAgdG8gc2V2ZXJhbCBtaW51dGVzLlxuICpcbiAqIEBwYXJhbSB7P251bWJlcn0gdGltZW91dCBbMTIwMDAwXSAtIENvbW1hbmQgdGltZW91dCBpbiBtaWxsaXNlY29uZHNcbiAqIEByZXR1cm5zIHtzdHJpbmd9IENvbW1hbmQgc3Rkb3V0XG4gKi9cbm1ldGhvZHMuYnVncmVwb3J0ID0gYXN5bmMgZnVuY3Rpb24gKHRpbWVvdXQgPSAxMjAwMDApIHtcbiAgcmV0dXJuIGF3YWl0IHRoaXMuYWRiRXhlYyhbJ2J1Z3JlcG9ydCddLCB7dGltZW91dH0pO1xufTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBTY3JlZW5yZWNvcmRPcHRpb25zXG4gKiBAcHJvcGVydHkgez9zdHJpbmd9IHZpZGVvU2l6ZSAtIFRoZSBmb3JtYXQgaXMgd2lkdGh4aGVpZ2h0LlxuICogICAgICAgICAgICAgICAgICBUaGUgZGVmYXVsdCB2YWx1ZSBpcyB0aGUgZGV2aWNlJ3MgbmF0aXZlIGRpc3BsYXkgcmVzb2x1dGlvbiAoaWYgc3VwcG9ydGVkKSxcbiAqICAgICAgICAgICAgICAgICAgMTI4MHg3MjAgaWYgbm90LiBGb3IgYmVzdCByZXN1bHRzLFxuICogICAgICAgICAgICAgICAgICB1c2UgYSBzaXplIHN1cHBvcnRlZCBieSB5b3VyIGRldmljZSdzIEFkdmFuY2VkIFZpZGVvIENvZGluZyAoQVZDKSBlbmNvZGVyLlxuICogICAgICAgICAgICAgICAgICBGb3IgZXhhbXBsZSwgXCIxMjgweDcyMFwiXG4gKiBAcHJvcGVydHkgez9ib29sZWFufSBidWdSZXBvcnQgLSBTZXQgaXQgdG8gYHRydWVgIGluIG9yZGVyIHRvIGRpc3BsYXkgYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBvbiB0aGUgdmlkZW8gb3ZlcmxheSxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2ggYXMgYSB0aW1lc3RhbXAsIHRoYXQgaXMgaGVscGZ1bCBpbiB2aWRlb3MgY2FwdHVyZWQgdG8gaWxsdXN0cmF0ZSBidWdzLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVGhpcyBvcHRpb24gaXMgb25seSBzdXBwb3J0ZWQgc2luY2UgQVBJIGxldmVsIDI3IChBbmRyb2lkIFApLlxuICogQHByb3BlcnR5IHs/c3RyaW5nfG51bWJlcn0gdGltZUxpbWl0IC0gVGhlIG1heGltdW0gcmVjb3JkaW5nIHRpbWUsIGluIHNlY29uZHMuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUaGUgZGVmYXVsdCAoYW5kIG1heGltdW0pIHZhbHVlIGlzIDE4MCAoMyBtaW51dGVzKS5cbiAqIEBwcm9wZXJ0eSB7P3N0cmluZ3xudW1iZXJ9IGJpdFJhdGUgLSBUaGUgdmlkZW8gYml0IHJhdGUgZm9yIHRoZSB2aWRlbywgaW4gbWVnYWJpdHMgcGVyIHNlY29uZC5cbiAqICAgICAgICAgICAgICAgIFRoZSBkZWZhdWx0IHZhbHVlIGlzIDQuIFlvdSBjYW4gaW5jcmVhc2UgdGhlIGJpdCByYXRlIHRvIGltcHJvdmUgdmlkZW8gcXVhbGl0eSxcbiAqICAgICAgICAgICAgICAgIGJ1dCBkb2luZyBzbyByZXN1bHRzIGluIGxhcmdlciBtb3ZpZSBmaWxlcy5cbiAqL1xuXG4vKipcbiAqIEluaXRpYXRlIHNjcmVlbnJlY29yZCB1dGlsaXR5IG9uIHRoZSBkZXZpY2VcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gZGVzdGluYXRpb24gLSBGdWxsIHBhdGggdG8gdGhlIHdyaXRhYmxlIG1lZGlhIGZpbGUgZGVzdGluYXRpb25cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uIHRoZSBkZXZpY2UgZmlsZSBzeXN0ZW0uXG4gKiBAcGFyYW0gez9TY3JlZW5yZWNvcmRPcHRpb25zfSBvcHRpb25zIFt7fV1cbiAqIEByZXR1cm5zIHtTdWJQcm9jZXNzfSBzY3JlZW5yZWNvcmQgcHJvY2Vzcywgd2hpY2ggY2FuIGJlIHRoZW4gY29udHJvbGxlZCBieSB0aGUgY2xpZW50IGNvZGVcbiAqL1xubWV0aG9kcy5zY3JlZW5yZWNvcmQgPSBmdW5jdGlvbiAoZGVzdGluYXRpb24sIG9wdGlvbnMgPSB7fSkge1xuICBjb25zdCBjbWQgPSBbJ3NjcmVlbnJlY29yZCddO1xuICBjb25zdCB7XG4gICAgdmlkZW9TaXplLFxuICAgIGJpdFJhdGUsXG4gICAgdGltZUxpbWl0LFxuICAgIGJ1Z1JlcG9ydCxcbiAgfSA9IG9wdGlvbnM7XG4gIGlmICh1dGlsLmhhc1ZhbHVlKHZpZGVvU2l6ZSkpIHtcbiAgICBjbWQucHVzaCgnLS1zaXplJywgdmlkZW9TaXplKTtcbiAgfVxuICBpZiAodXRpbC5oYXNWYWx1ZSh0aW1lTGltaXQpKSB7XG4gICAgY21kLnB1c2goJy0tdGltZS1saW1pdCcsIHRpbWVMaW1pdCk7XG4gIH1cbiAgaWYgKHV0aWwuaGFzVmFsdWUoYml0UmF0ZSkpIHtcbiAgICBjbWQucHVzaCgnLS1iaXQtcmF0ZScsIGJpdFJhdGUpO1xuICB9XG4gIGlmIChidWdSZXBvcnQpIHtcbiAgICBjbWQucHVzaCgnLS1idWdyZXBvcnQnKTtcbiAgfVxuICBjbWQucHVzaChkZXN0aW5hdGlvbik7XG5cbiAgY29uc3QgZnVsbENtZCA9IFtcbiAgICAuLi50aGlzLmV4ZWN1dGFibGUuZGVmYXVsdEFyZ3MsXG4gICAgJ3NoZWxsJyxcbiAgICAuLi5jbWRcbiAgXTtcbiAgbG9nLmRlYnVnKGBCdWlsZGluZyBzY3JlZW5yZWNvcmQgcHJvY2VzcyB3aXRoIHRoZSBjb21tYW5kIGxpbmU6IGFkYiAke3F1b3RlKGZ1bGxDbWQpfWApO1xuICByZXR1cm4gbmV3IFN1YlByb2Nlc3ModGhpcy5leGVjdXRhYmxlLnBhdGgsIGZ1bGxDbWQpO1xufTtcblxuLyoqXG4gKiBQZXJmb3JtcyB0aGUgZ2l2ZW4gZWRpdG9yIGFjdGlvbiBvbiB0aGUgZm9jdXNlZCBpbnB1dCBmaWVsZC5cbiAqIFRoaXMgbWV0aG9kIHJlcXVpcmVzIEFwcGl1bSBTZXR0aW5ncyBoZWxwZXIgdG8gYmUgaW5zdGFsbGVkIG9uIHRoZSBkZXZpY2UuXG4gKiBObyBleGNlcHRpb24gaXMgdGhyb3duIGlmIHRoZXJlIHdhcyBhIGZhaWx1cmUgd2hpbGUgcGVyZm9ybWluZyB0aGUgYWN0aW9uLlxuICogWW91IG11c3QgaW52ZXN0aWdhdGUgdGhlIGxvZ2NhdCBvdXRwdXQgaWYgc29tZXRoaW5nIGRpZCBub3Qgd29yayBhcyBleHBlY3RlZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IGFjdGlvbiAtIEVpdGhlciBhY3Rpb24gY29kZSBvciBuYW1lLiBUaGUgZm9sbG93aW5nIGFjdGlvblxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lcyBhcmUgc3VwcG9ydGVkOiBgbm9ybWFsLCB1bnNwZWNpZmllZCwgbm9uZSxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ28sIHNlYXJjaCwgc2VuZCwgbmV4dCwgZG9uZSwgcHJldmlvdXNgXG4gKi9cbm1ldGhvZHMucGVyZm9ybUVkaXRvckFjdGlvbiA9IGFzeW5jIGZ1bmN0aW9uIChhY3Rpb24pIHtcbiAgbG9nLmRlYnVnKGBQZXJmb3JtaW5nIGVkaXRvciBhY3Rpb246ICR7YWN0aW9ufWApO1xuICBjb25zdCBkZWZhdWx0SU1FID0gYXdhaXQgdGhpcy5kZWZhdWx0SU1FKCk7XG4gIGF3YWl0IHRoaXMuZW5hYmxlSU1FKEFQUElVTV9JTUUpO1xuICB0cnkge1xuICAgIGF3YWl0IHRoaXMuc2V0SU1FKEFQUElVTV9JTUUpO1xuICAgIGF3YWl0IHRoaXMuc2hlbGwoWydpbnB1dCcsICd0ZXh0JywgYC8ke2FjdGlvbn0vYF0pO1xuICB9IGZpbmFsbHkge1xuICAgIGF3YWl0IHRoaXMuc2V0SU1FKGRlZmF1bHRJTUUpO1xuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBtZXRob2RzO1xuIl0sImZpbGUiOiJsaWIvdG9vbHMvYWRiLWNvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uIn0=
