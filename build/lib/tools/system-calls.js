"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DEFAULT_ADB_EXEC_TIMEOUT = exports.default = void 0;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _path = _interopRequireDefault(require("path"));

var _logger = _interopRequireDefault(require("../logger.js"));

var _bluebird = _interopRequireDefault(require("bluebird"));

var _appiumSupport = require("appium-support");

var _helpers = require("../helpers");

var _teen_process = require("teen_process");

var _asyncbox = require("asyncbox");

var _lodash = _interopRequireDefault(require("lodash"));

var _shellQuote = require("shell-quote");

let systemCallMethods = {};
const DEFAULT_ADB_EXEC_TIMEOUT = 20000;
exports.DEFAULT_ADB_EXEC_TIMEOUT = DEFAULT_ADB_EXEC_TIMEOUT;
const DEFAULT_ADB_REBOOT_RETRIES = 90;
const LINKER_WARNING_REGEXP = /^WARNING: linker.+$/m;
const PROTOCOL_FAULT_ERROR_REGEXP = new RegExp('protocol fault \\(no status\\)', 'i');
const DEVICE_NOT_FOUND_ERROR_REGEXP = new RegExp(`error: device ('.+' )?not found`, 'i');
const DEVICE_CONNECTING_ERROR_REGEXP = new RegExp('error: device still connecting', 'i');
const CERTS_ROOT = '/system/etc/security/cacerts';
const EMU_STOP_TIMEOUT = 2000;
systemCallMethods.getSdkBinaryPath = _lodash.default.memoize(function () {
  var _ref = (0, _asyncToGenerator2.default)(function* (binaryName) {
    _logger.default.info(`Checking whether ${binaryName} is present`);

    if (this.sdkRoot) {
      return yield this.getBinaryFromSdkRoot(binaryName);
    }

    _logger.default.warn(`The ANDROID_HOME environment variable is not set to the Android SDK ` + `root directory path. ANDROID_HOME is required for compatibility ` + `with SDK 23+. Checking along PATH for ${binaryName}.`);

    return yield this.getBinaryFromPath(binaryName);
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}());
systemCallMethods.getCommandForOS = _lodash.default.memoize(function () {
  return _appiumSupport.system.isWindows() ? 'where' : 'which';
});
systemCallMethods.getBinaryNameForOS = _lodash.default.memoize(function (binaryName) {
  if (!_appiumSupport.system.isWindows()) {
    return binaryName;
  }

  if (['android', 'apksigner', 'apkanalyzer'].indexOf(binaryName) >= 0 && !binaryName.toLowerCase().endsWith('.bat')) {
    return `${binaryName}.bat`;
  }

  if (!binaryName.toLowerCase().endsWith('.exe')) {
    return `${binaryName}.exe`;
  }

  return binaryName;
});
systemCallMethods.getBinaryFromSdkRoot = _lodash.default.memoize(function () {
  var _ref2 = (0, _asyncToGenerator2.default)(function* (binaryName) {
    let binaryLoc = null;
    binaryName = this.getBinaryNameForOS(binaryName);
    let binaryLocs = [_path.default.resolve(this.sdkRoot, "platform-tools", binaryName), _path.default.resolve(this.sdkRoot, "emulator", binaryName), _path.default.resolve(this.sdkRoot, "tools", binaryName), _path.default.resolve(this.sdkRoot, "tools", "bin", binaryName)];

    _lodash.default.forEach((yield (0, _helpers.getBuildToolsDirs)(this.sdkRoot)), dir => binaryLocs.push(_path.default.resolve(dir, binaryName)));

    for (var _i = 0; _i < binaryLocs.length; _i++) {
      let loc = binaryLocs[_i];

      if (yield _appiumSupport.fs.exists(loc)) {
        binaryLoc = loc;
        break;
      }
    }

    if (_lodash.default.isNull(binaryLoc)) {
      throw new Error(`Could not find ${binaryName} in ${binaryLocs}. ` + `Do you have the Android SDK installed at '${this.sdkRoot}'?`);
    }

    binaryLoc = binaryLoc.trim();

    _logger.default.info(`Using ${binaryName} from ${binaryLoc}`);

    return binaryLoc;
  });

  return function (_x2) {
    return _ref2.apply(this, arguments);
  };
}());

systemCallMethods.getBinaryFromPath = function () {
  var _ref3 = (0, _asyncToGenerator2.default)(function* (binaryName) {
    let binaryLoc = null;
    let cmd = this.getCommandForOS();

    try {
      let _ref4 = yield (0, _teen_process.exec)(cmd, [binaryName]),
          stdout = _ref4.stdout;

      _logger.default.info(`Using ${binaryName} from ${stdout}`);

      binaryLoc = stdout.trim();
      return binaryLoc;
    } catch (e) {
      throw new Error(`Could not find ${binaryName} Please set the ANDROID_HOME ` + `environment variable with the Android SDK root directory path.`);
    }
  });

  return function (_x3) {
    return _ref3.apply(this, arguments);
  };
}();

systemCallMethods.getConnectedDevices = (0, _asyncToGenerator2.default)(function* () {
  _logger.default.debug("Getting connected devices...");

  try {
    let _ref6 = yield (0, _teen_process.exec)(this.executable.path, this.executable.defaultArgs.concat(['devices'])),
        stdout = _ref6.stdout;

    let startingIndex = stdout.indexOf("List of devices");

    if (startingIndex === -1) {
      throw new Error(`Unexpected output while trying to get devices. output was: ${stdout}`);
    }

    stdout = stdout.slice(startingIndex);
    let devices = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = stdout.split("\n")[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        let line = _step.value;

        if (line.trim() !== "" && line.indexOf("List of devices") === -1 && line.indexOf("adb server") === -1 && line.indexOf("* daemon") === -1 && line.indexOf("offline") === -1) {
          let lineInfo = line.split("\t");
          devices.push({
            udid: lineInfo[0],
            state: lineInfo[1]
          });
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

    _logger.default.debug(`${devices.length} device(s) connected`);

    return devices;
  } catch (e) {
    throw new Error(`Error while getting connected devices. Original error: ${e.message}`);
  }
});

systemCallMethods.getDevicesWithRetry = function () {
  var _ref7 = (0, _asyncToGenerator2.default)(function* (timeoutMs = 20000) {
    var _this = this;

    let start = Date.now();

    _logger.default.debug("Trying to find a connected android device");

    let getDevices = function () {
      var _ref8 = (0, _asyncToGenerator2.default)(function* () {
        if (Date.now() - start > timeoutMs) {
          throw new Error("Could not find a connected Android device.");
        }

        try {
          let devices = yield _this.getConnectedDevices();

          if (devices.length < 1) {
            _logger.default.debug("Could not find devices, restarting adb server...");

            yield _this.restartAdb();
            yield (0, _asyncbox.sleep)(200);
            return yield getDevices();
          }

          return devices;
        } catch (e) {
          _logger.default.debug("Could not find devices, restarting adb server...");

          yield _this.restartAdb();
          yield (0, _asyncbox.sleep)(200);
          return yield getDevices();
        }
      });

      return function getDevices() {
        return _ref8.apply(this, arguments);
      };
    }();

    return yield getDevices();
  });

  return function () {
    return _ref7.apply(this, arguments);
  };
}();

systemCallMethods.restartAdb = (0, _asyncToGenerator2.default)(function* () {
  if (this.suppressKillServer) {
    _logger.default.debug(`Not restarting abd since 'suppressKillServer' is on`);

    return;
  }

  _logger.default.debug('Restarting adb');

  try {
    yield this.killServer();
  } catch (e) {
    _logger.default.error("Error killing ADB server, going to see if it's online anyway");
  }
});
systemCallMethods.killServer = (0, _asyncToGenerator2.default)(function* () {
  _logger.default.debug(`Killing adb server on port ${this.adbPort}`);

  yield (0, _teen_process.exec)(this.executable.path, [...this.executable.defaultArgs, 'kill-server']);
});
systemCallMethods.resetTelnetAuthToken = _lodash.default.memoize((0, _asyncToGenerator2.default)(function* () {
  const homeFolderPath = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];

  if (!homeFolderPath) {
    _logger.default.warn(`Cannot find the path to user home folder. Ignoring resetting of emulator's telnet authentication token`);

    return false;
  }

  const dstPath = _path.default.resolve(homeFolderPath, '.emulator_console_auth_token');

  _logger.default.debug(`Overriding ${dstPath} with an empty string to avoid telnet authentication for emulator commands`);

  try {
    yield _appiumSupport.fs.writeFile(dstPath, '');
  } catch (e) {
    _logger.default.warn(`Error ${e.message} while resetting the content of ${dstPath}. Ignoring resetting of emulator's telnet authentication token`);

    return false;
  }

  return true;
}));

systemCallMethods.adbExecEmu = function () {
  var _ref12 = (0, _asyncToGenerator2.default)(function* (cmd) {
    yield this.verifyEmulatorConnected();
    yield this.resetTelnetAuthToken();
    yield this.adbExec(['emu', ...cmd]);
  });

  return function (_x4) {
    return _ref12.apply(this, arguments);
  };
}();

systemCallMethods.adbExec = function () {
  var _ref13 = (0, _asyncToGenerator2.default)(function* (cmd, opts = {}) {
    var _this2 = this;

    if (!cmd) {
      throw new Error("You need to pass in a command to adbExec()");
    }

    opts.timeout = opts.timeout || this.adbExecTimeout || DEFAULT_ADB_EXEC_TIMEOUT;

    let execFunc = function () {
      var _ref14 = (0, _asyncToGenerator2.default)(function* () {
        try {
          if (!(cmd instanceof Array)) {
            cmd = [cmd];
          }

          let args = _this2.executable.defaultArgs.concat(cmd);

          _logger.default.debug(`Running '${_this2.executable.path} ${(0, _shellQuote.quote)(args)}'`);

          let _ref15 = yield (0, _teen_process.exec)(_this2.executable.path, args, opts),
              stdout = _ref15.stdout;

          stdout = stdout.replace(LINKER_WARNING_REGEXP, '').trim();
          return stdout;
        } catch (e) {
          const errText = `${e.message}, ${e.stdout}, ${e.stderr}`;
          const protocolFaultError = PROTOCOL_FAULT_ERROR_REGEXP.test(errText);
          const deviceNotFoundError = DEVICE_NOT_FOUND_ERROR_REGEXP.test(errText);
          const deviceConnectingError = DEVICE_CONNECTING_ERROR_REGEXP.test(errText);

          if (protocolFaultError || deviceNotFoundError || deviceConnectingError) {
            _logger.default.info(`Error sending command, reconnecting device and retrying: ${cmd}`);

            yield (0, _asyncbox.sleep)(1000);
            yield _this2.getDevicesWithRetry();
          }

          if (e.code === 0 && e.stdout) {
            let stdout = e.stdout;
            stdout = stdout.replace(LINKER_WARNING_REGEXP, '').trim();
            return stdout;
          }

          throw new Error(`Error executing adbExec. Original error: '${e.message}'; ` + `Stderr: '${(e.stderr || '').trim()}'; Code: '${e.code}'`);
        }
      });

      return function execFunc() {
        return _ref14.apply(this, arguments);
      };
    }();

    return yield (0, _asyncbox.retry)(2, execFunc);
  });

  return function (_x5) {
    return _ref13.apply(this, arguments);
  };
}();

systemCallMethods.shell = function () {
  var _ref16 = (0, _asyncToGenerator2.default)(function* (cmd, opts = {}) {
    return yield this.adbExec(_lodash.default.isArray(cmd) ? ['shell', ...cmd] : ['shell', cmd], opts);
  });

  return function (_x6) {
    return _ref16.apply(this, arguments);
  };
}();

systemCallMethods.createSubProcess = function (args = []) {
  args = this.executable.defaultArgs.concat(args);

  _logger.default.debug(`Creating ADB subprocess with args: ${JSON.stringify(args)}`);

  return new _teen_process.SubProcess(this.getAdbPath(), args);
};

systemCallMethods.getAdbServerPort = function () {
  return this.adbPort;
};

systemCallMethods.getEmulatorPort = (0, _asyncToGenerator2.default)(function* () {
  _logger.default.debug("Getting running emulator port");

  if (this.emulatorPort !== null) {
    return this.emulatorPort;
  }

  try {
    let devices = yield this.getConnectedDevices();
    let port = this.getPortFromEmulatorString(devices[0].udid);

    if (port) {
      return port;
    } else {
      throw new Error(`Emulator port not found`);
    }
  } catch (e) {
    throw new Error(`No devices connected. Original error: ${e.message}`);
  }
});

systemCallMethods.getPortFromEmulatorString = function (emStr) {
  let portPattern = /emulator-(\d+)/;

  if (portPattern.test(emStr)) {
    return parseInt(portPattern.exec(emStr)[1], 10);
  }

  return false;
};

systemCallMethods.getConnectedEmulators = (0, _asyncToGenerator2.default)(function* () {
  _logger.default.debug("Getting connected emulators");

  try {
    let devices = yield this.getConnectedDevices();
    let emulators = [];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = devices[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        let device = _step2.value;
        let port = this.getPortFromEmulatorString(device.udid);

        if (port) {
          device.port = port;
          emulators.push(device);
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

    _logger.default.debug(`${emulators.length} emulator(s) connected`);

    return emulators;
  } catch (e) {
    throw new Error(`Error getting emulators. Original error: ${e.message}`);
  }
});

systemCallMethods.setEmulatorPort = function (emPort) {
  this.emulatorPort = emPort;
};

systemCallMethods.setDeviceId = function (deviceId) {
  _logger.default.debug(`Setting device id to ${deviceId}`);

  this.curDeviceId = deviceId;
  let argsHasDevice = this.executable.defaultArgs.indexOf('-s');

  if (argsHasDevice !== -1) {
    this.executable.defaultArgs.splice(argsHasDevice, 2);
  }

  this.executable.defaultArgs.push('-s', deviceId);
};

systemCallMethods.setDevice = function (deviceObj) {
  let deviceId = deviceObj.udid;
  let emPort = this.getPortFromEmulatorString(deviceId);
  this.setEmulatorPort(emPort);
  this.setDeviceId(deviceId);
};

systemCallMethods.getRunningAVD = function () {
  var _ref19 = (0, _asyncToGenerator2.default)(function* (avdName) {
    _logger.default.debug(`Trying to find ${avdName} emulator`);

    try {
      let emulators = yield this.getConnectedEmulators();
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = emulators[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          let emulator = _step3.value;
          this.setEmulatorPort(emulator.port);
          let runningAVDName = yield this.sendTelnetCommand("avd name");

          if (avdName === runningAVDName) {
            _logger.default.debug(`Found emulator ${avdName} in port ${emulator.port}`);

            this.setDeviceId(emulator.udid);
            return emulator;
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

      _logger.default.debug(`Emulator ${avdName} not running`);

      return null;
    } catch (e) {
      throw new Error(`Error getting AVD. Original error: ${e.message}`);
    }
  });

  return function (_x7) {
    return _ref19.apply(this, arguments);
  };
}();

systemCallMethods.getRunningAVDWithRetry = function () {
  var _ref20 = (0, _asyncToGenerator2.default)(function* (avdName, timeoutMs = 20000) {
    var _this3 = this;

    let runningAvd;

    try {
      yield (0, _asyncbox.waitForCondition)((0, _asyncToGenerator2.default)(function* () {
        try {
          runningAvd = yield _this3.getRunningAVD(avdName.replace('@', ''));
          return runningAvd;
        } catch (e) {
          _logger.default.debug(e.message);

          return false;
        }
      }), {
        waitMs: timeoutMs,
        intervalMs: 1000
      });
    } catch (e) {
      throw new Error(`Error getting AVD with retry. Original error: ${e.message}`);
    }

    return runningAvd;
  });

  return function (_x8) {
    return _ref20.apply(this, arguments);
  };
}();

systemCallMethods.killAllEmulators = (0, _asyncToGenerator2.default)(function* () {
  let cmd, args;

  if (_appiumSupport.system.isWindows()) {
    cmd = 'TASKKILL';
    args = ['TASKKILL', '/IM', 'emulator.exe'];
  } else {
    cmd = '/usr/bin/killall';
    args = ['-m', 'emulator*'];
  }

  try {
    yield (0, _teen_process.exec)(cmd, args);
  } catch (e) {
    throw new Error(`Error killing emulators. Original error: ${e.message}`);
  }
});

systemCallMethods.killEmulator = function () {
  var _ref23 = (0, _asyncToGenerator2.default)(function* (avdName = null, timeout = 60000) {
    var _this4 = this;

    if (_appiumSupport.util.hasValue(avdName)) {
      _logger.default.debug(`Killing avd '${avdName}'`);

      const device = yield this.getRunningAVD(avdName);

      if (!device) {
        _logger.default.info(`No avd with name '${avdName}' running. Skipping kill step.`);

        return false;
      }
    } else {
      _logger.default.debug(`Killing avd with id '${this.curDeviceId}'`);

      if (!(yield this.isEmulatorConnected())) {
        _logger.default.debug(`Emulator with id '${this.curDeviceId}' not connected. Skipping kill step`);

        return false;
      }
    }

    yield this.adbExec(['emu', 'kill']);

    _logger.default.debug(`Waiting up to ${timeout}ms until the emulator '${avdName ? avdName : this.curDeviceId}' is killed`);

    try {
      yield (0, _asyncbox.waitForCondition)((0, _asyncToGenerator2.default)(function* () {
        try {
          return _appiumSupport.util.hasValue(avdName) ? !(yield _this4.getRunningAVD(avdName)) : !(yield _this4.isEmulatorConnected());
        } catch (ign) {}

        return false;
      }), {
        waitMs: timeout,
        intervalMs: 2000
      });
    } catch (e) {
      throw new Error(`The emulator '${avdName ? avdName : this.curDeviceId}' is still running after being killed ${timeout}ms ago`);
    }

    _logger.default.info(`Successfully killed the '${avdName ? avdName : this.curDeviceId}' emulator`);

    return true;
  });

  return function () {
    return _ref23.apply(this, arguments);
  };
}();

systemCallMethods.launchAVD = function () {
  var _ref25 = (0, _asyncToGenerator2.default)(function* (avdName, avdArgs, language, country, avdLaunchTimeout = 60000, avdReadyTimeout = 60000, retryTimes = 1) {
    var _this5 = this;

    _logger.default.debug(`Launching Emulator with AVD ${avdName}, launchTimeout ` + `${avdLaunchTimeout}ms and readyTimeout ${avdReadyTimeout}ms`);

    let emulatorBinaryPath = yield this.getSdkBinaryPath("emulator");

    if (avdName[0] === "@") {
      avdName = avdName.substr(1);
    }

    yield this.checkAvdExist(avdName);
    let launchArgs = ["-avd", avdName];

    if (_lodash.default.isString(language)) {
      _logger.default.debug(`Setting Android Device Language to ${language}`);

      launchArgs.push("-prop", `persist.sys.language=${language.toLowerCase()}`);
    }

    if (_lodash.default.isString(country)) {
      _logger.default.debug(`Setting Android Device Country to ${country}`);

      launchArgs.push("-prop", `persist.sys.country=${country.toUpperCase()}`);
    }

    let locale;

    if (_lodash.default.isString(language) && _lodash.default.isString(country)) {
      locale = language.toLowerCase() + "-" + country.toUpperCase();
    } else if (_lodash.default.isString(language)) {
      locale = language.toLowerCase();
    } else if (_lodash.default.isString(country)) {
      locale = country;
    }

    if (_lodash.default.isString(locale)) {
      _logger.default.debug(`Setting Android Device Locale to ${locale}`);

      launchArgs.push("-prop", `persist.sys.locale=${locale}`);
    }

    if (!_lodash.default.isEmpty(avdArgs)) {
      launchArgs.push(...(_lodash.default.isArray(avdArgs) ? avdArgs : avdArgs.split(' ')));
    }

    _logger.default.debug(`Running '${emulatorBinaryPath}' with args: ${JSON.stringify(launchArgs)}`);

    let proc = new _teen_process.SubProcess(emulatorBinaryPath, launchArgs);
    yield proc.start(0);
    proc.on('output', (stdout, stderr) => {
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = (stdout || stderr || '').split('\n').filter(Boolean)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          let line = _step4.value;

          _logger.default.info(`[AVD OUTPUT] ${line}`);
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
    });
    proc.on('die', (code, signal) => {
      _logger.default.warn(`Emulator avd ${avdName} exited with code ${code}${signal ? `, signal ${signal}` : ''}`);
    });
    yield (0, _asyncbox.retry)(retryTimes, (0, _asyncToGenerator2.default)(function* () {
      return yield _this5.getRunningAVDWithRetry(avdName, avdLaunchTimeout);
    }));
    yield this.waitForEmulatorReady(avdReadyTimeout);
    return proc;
  });

  return function (_x9, _x10, _x11, _x12) {
    return _ref25.apply(this, arguments);
  };
}();

systemCallMethods.getAdbVersion = _lodash.default.memoize((0, _asyncToGenerator2.default)(function* () {
  try {
    let adbVersion = (yield this.adbExec('version')).replace(/Android\sDebug\sBridge\sversion\s([\d.]*)[\s\w-]*/, "$1");
    let parts = adbVersion.split('.');
    return {
      versionString: adbVersion,
      versionFloat: parseFloat(adbVersion),
      major: parseInt(parts[0], 10),
      minor: parseInt(parts[1], 10),
      patch: parts[2] ? parseInt(parts[2], 10) : undefined
    };
  } catch (e) {
    throw new Error(`Error getting adb version. Original error: '${e.message}'; ` + `Stderr: '${(e.stderr || '').trim()}'; Code: '${e.code}'`);
  }
}));

systemCallMethods.checkAvdExist = function () {
  var _ref28 = (0, _asyncToGenerator2.default)(function* (avdName) {
    let cmd, result;

    try {
      cmd = yield this.getSdkBinaryPath('emulator');
      result = yield (0, _teen_process.exec)(cmd, ['-list-avds']);
    } catch (e) {
      let unknownOptionError = new RegExp("unknown option: -list-avds", "i").test(e.stderr);

      if (!unknownOptionError) {
        throw new Error(`Error executing checkAvdExist. Original error: '${e.message}'; ` + `Stderr: '${(e.stderr || '').trim()}'; Code: '${e.code}'`);
      }

      const sdkVersion = yield (0, _helpers.getSdkToolsVersion)();
      let binaryName = 'android';

      if (sdkVersion) {
        if (sdkVersion.major >= 25) {
          binaryName = 'avdmanager';
        }
      } else {
        _logger.default.warn(`Defaulting binary name to '${binaryName}', because SDK version cannot be parsed`);
      }

      cmd = yield this.getSdkBinaryPath(binaryName);
      result = yield (0, _teen_process.exec)(cmd, ['list', 'avd', '-c']);
    }

    if (result.stdout.indexOf(avdName) === -1) {
      let existings = `(${result.stdout.trim().replace(/[\n]/g, '), (')})`;
      throw new Error(`Avd '${avdName}' is not available. please select your avd name from one of these: '${existings}'`);
    }
  });

  return function (_x13) {
    return _ref28.apply(this, arguments);
  };
}();

systemCallMethods.waitForEmulatorReady = function () {
  var _ref29 = (0, _asyncToGenerator2.default)(function* (timeoutMs = 20000) {
    var _this6 = this;

    try {
      yield (0, _asyncbox.waitForCondition)((0, _asyncToGenerator2.default)(function* () {
        try {
          if (!(yield _this6.shell(['getprop', 'init.svc.bootanim'])).includes('stopped')) {
            return false;
          }

          return /\d+\[\w+\]/.test((yield _this6.shell(['pm', 'get-install-location'])));
        } catch (err) {
          _logger.default.debug(`Waiting for emulator startup. Intermediate error: ${err.message}`);

          return false;
        }
      }), {
        waitMs: timeoutMs,
        intervalMs: 3000
      });
    } catch (e) {
      throw new Error(`Emulator is not ready within ${timeoutMs}ms`);
    }
  });

  return function () {
    return _ref29.apply(this, arguments);
  };
}();

systemCallMethods.waitForDevice = function () {
  var _ref31 = (0, _asyncToGenerator2.default)(function* (appDeviceReadyTimeout = 30) {
    var _this7 = this;

    this.appDeviceReadyTimeout = appDeviceReadyTimeout;
    const retries = 3;
    const timeout = parseInt(this.appDeviceReadyTimeout, 10) / retries * 1000;
    yield (0, _asyncbox.retry)(retries, (0, _asyncToGenerator2.default)(function* () {
      try {
        yield _this7.adbExec('wait-for-device', {
          timeout
        });
        yield _this7.ping();
      } catch (e) {
        yield _this7.restartAdb();
        yield _this7.getConnectedDevices();
        throw new Error(`Error in waiting for device. Original error: '${e.message}'. ` + `Retrying by restarting ADB`);
      }
    }));
  });

  return function () {
    return _ref31.apply(this, arguments);
  };
}();

systemCallMethods.runPrivilegedShell = function () {
  var _ref33 = (0, _asyncToGenerator2.default)(function* (args) {
    try {
      this.isRoot = false;
      yield this.shell(args);
    } catch (err) {
      if (!err.message.includes('must be root')) {
        throw err;
      }

      _logger.default.debug(`Device requires adb to be running as root in order to run "adb shell ${(0, _shellQuote.quote)(args)}". Restarting daemon`);

      this.isRoot = yield this.root();
      yield this.shell(args);
    }
  });

  return function (_x14) {
    return _ref33.apply(this, arguments);
  };
}();

systemCallMethods.reboot = function () {
  var _ref34 = (0, _asyncToGenerator2.default)(function* (retries = DEFAULT_ADB_REBOOT_RETRIES) {
    var _this8 = this;

    yield this.runPrivilegedShell(['stop']);
    yield _bluebird.default.delay(EMU_STOP_TIMEOUT);
    yield this.setDeviceProperty('sys.boot_completed', 0);
    yield this.runPrivilegedShell(['start']);
    yield (0, _asyncbox.retryInterval)(retries, 1000, (0, _asyncToGenerator2.default)(function* () {
      let booted = yield _this8.getDeviceProperty('sys.boot_completed');

      if (booted === '1') {
        return;
      }

      let msg = 'Waiting for reboot. This takes time';

      _logger.default.debug(msg);

      throw new Error(msg);
    }));

    if (this.isRoot) {
      this.isRoot = !(yield this.unroot());
    }
  });

  return function () {
    return _ref34.apply(this, arguments);
  };
}();

systemCallMethods.root = (0, _asyncToGenerator2.default)(function* () {
  try {
    let _ref37 = yield (0, _teen_process.exec)(this.executable.path, ['root']),
        stdout = _ref37.stdout;

    if (stdout && stdout.indexOf('adbd cannot run as root') !== -1) {
      throw new Error(stdout.trim());
    }

    return true;
  } catch (err) {
    _logger.default.warn(`Unable to root adb daemon: '${err.message}'. Continuing`);

    return false;
  }
});
systemCallMethods.unroot = (0, _asyncToGenerator2.default)(function* () {
  try {
    _logger.default.debug("Removing root privileges. Restarting adb daemon");

    yield (0, _teen_process.exec)(this.executable.path, ['unroot']);
    return true;
  } catch (err) {
    _logger.default.warn(`Unable to unroot adb daemon: '${err.message}'. Continuing`);

    return false;
  }
});

systemCallMethods.fileExists = function () {
  var _ref39 = (0, _asyncToGenerator2.default)(function* (remotePath) {
    let files = yield this.ls(remotePath);
    return files.length > 0;
  });

  return function (_x15) {
    return _ref39.apply(this, arguments);
  };
}();

systemCallMethods.ls = function () {
  var _ref40 = (0, _asyncToGenerator2.default)(function* (remotePath, opts = []) {
    try {
      let args = ['ls', ...opts, remotePath];
      let stdout = yield this.shell(args);
      let lines = stdout.split("\n");
      return lines.map(l => l.trim()).filter(Boolean).filter(l => l.indexOf("No such file") === -1);
    } catch (err) {
      if (err.message.indexOf('No such file or directory') === -1) {
        throw err;
      }

      return [];
    }
  });

  return function (_x16) {
    return _ref40.apply(this, arguments);
  };
}();

systemCallMethods.fileSize = function () {
  var _ref41 = (0, _asyncToGenerator2.default)(function* (remotePath) {
    try {
      const files = yield this.ls(remotePath, ['-la']);

      if (files.length !== 1) {
        throw new Error(`Remote path is not a file`);
      }

      const match = /[rwxsStT\-+]{10}[\s\d]*\s[^\s]+\s+[^\s]+\s+(\d+)/.exec(files[0]);

      if (!match || _lodash.default.isNaN(parseInt(match[1], 10))) {
        throw new Error(`Unable to parse size from list output: '${files[0]}'`);
      }

      return parseInt(match[1], 10);
    } catch (err) {
      throw new Error(`Unable to get file size for '${remotePath}': ${err.message}`);
    }
  });

  return function (_x17) {
    return _ref41.apply(this, arguments);
  };
}();

systemCallMethods.installMitmCertificate = function () {
  var _ref42 = (0, _asyncToGenerator2.default)(function* (cert) {
    var _this9 = this;

    const openSsl = yield (0, _helpers.getOpenSslForOs)();

    if (!_lodash.default.isBuffer(cert)) {
      cert = Buffer.from(cert, 'base64');
    }

    const tmpRoot = yield _appiumSupport.tempDir.openDir();

    try {
      const srcCert = _path.default.resolve(tmpRoot, 'source.cer');

      yield _appiumSupport.fs.writeFile(srcCert, cert);

      let _ref43 = yield (0, _teen_process.exec)(openSsl, ['x509', '-noout', '-hash', '-in', srcCert]),
          stdout = _ref43.stdout;

      const certHash = stdout.trim();

      _logger.default.debug(`Got certificate hash: ${certHash}`);

      _logger.default.debug('Preparing certificate content');

      var _ref44 = yield (0, _teen_process.exec)(openSsl, ['x509', '-in', srcCert], {
        isBuffer: true
      });

      stdout = _ref44.stdout;
      let dstCertContent = stdout;

      var _ref45 = yield (0, _teen_process.exec)(openSsl, ['x509', '-in', srcCert, '-text', '-fingerprint', '-noout'], {
        isBuffer: true
      });

      stdout = _ref45.stdout;
      dstCertContent = Buffer.concat([dstCertContent, stdout]);

      const dstCert = _path.default.resolve(tmpRoot, `${certHash}.0`);

      yield _appiumSupport.fs.writeFile(dstCert, dstCertContent);

      _logger.default.debug('Remounting /system in rw mode');

      yield (0, _asyncbox.retryInterval)(5, 2000, (0, _asyncToGenerator2.default)(function* () {
        return yield _this9.adbExec(['remount']);
      }));

      _logger.default.debug(`Uploading the generated certificate from '${dstCert}' to '${CERTS_ROOT}'`);

      yield this.push(dstCert, CERTS_ROOT);

      _logger.default.debug('Remounting /system to confirm changes');

      yield this.adbExec(['remount']);
    } catch (err) {
      throw new Error(`Cannot inject the custom certificate. ` + `Is the certificate properly encoded into base64-string? ` + `Do you have root permissions on the device? ` + `Original error: ${err.message}`);
    } finally {
      yield _appiumSupport.fs.rimraf(tmpRoot);
    }
  });

  return function (_x18) {
    return _ref42.apply(this, arguments);
  };
}();

systemCallMethods.isMitmCertificateInstalled = function () {
  var _ref47 = (0, _asyncToGenerator2.default)(function* (cert) {
    const openSsl = yield (0, _helpers.getOpenSslForOs)();

    if (!_lodash.default.isBuffer(cert)) {
      cert = Buffer.from(cert, 'base64');
    }

    const tmpRoot = yield _appiumSupport.tempDir.openDir();
    let certHash;

    try {
      const tmpCert = _path.default.resolve(tmpRoot, 'source.cer');

      yield _appiumSupport.fs.writeFile(tmpCert, cert);

      const _ref48 = yield (0, _teen_process.exec)(openSsl, ['x509', '-noout', '-hash', '-in', tmpCert]),
            stdout = _ref48.stdout;

      certHash = stdout.trim();
    } catch (err) {
      throw new Error(`Cannot retrieve the certificate hash. ` + `Is the certificate properly encoded into base64-string? ` + `Original error: ${err.message}`);
    } finally {
      yield _appiumSupport.fs.rimraf(tmpRoot);
    }

    const dstPath = _path.default.posix.resolve(CERTS_ROOT, `${certHash}.0`);

    _logger.default.debug(`Checking if the certificate is already installed at '${dstPath}'`);

    return yield this.fileExists(dstPath);
  });

  return function (_x19) {
    return _ref47.apply(this, arguments);
  };
}();

var _default = systemCallMethods;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi90b29scy9zeXN0ZW0tY2FsbHMuanMiXSwibmFtZXMiOlsic3lzdGVtQ2FsbE1ldGhvZHMiLCJERUZBVUxUX0FEQl9FWEVDX1RJTUVPVVQiLCJERUZBVUxUX0FEQl9SRUJPT1RfUkVUUklFUyIsIkxJTktFUl9XQVJOSU5HX1JFR0VYUCIsIlBST1RPQ09MX0ZBVUxUX0VSUk9SX1JFR0VYUCIsIlJlZ0V4cCIsIkRFVklDRV9OT1RfRk9VTkRfRVJST1JfUkVHRVhQIiwiREVWSUNFX0NPTk5FQ1RJTkdfRVJST1JfUkVHRVhQIiwiQ0VSVFNfUk9PVCIsIkVNVV9TVE9QX1RJTUVPVVQiLCJnZXRTZGtCaW5hcnlQYXRoIiwiXyIsIm1lbW9pemUiLCJiaW5hcnlOYW1lIiwibG9nIiwiaW5mbyIsInNka1Jvb3QiLCJnZXRCaW5hcnlGcm9tU2RrUm9vdCIsIndhcm4iLCJnZXRCaW5hcnlGcm9tUGF0aCIsImdldENvbW1hbmRGb3JPUyIsInN5c3RlbSIsImlzV2luZG93cyIsImdldEJpbmFyeU5hbWVGb3JPUyIsImluZGV4T2YiLCJ0b0xvd2VyQ2FzZSIsImVuZHNXaXRoIiwiYmluYXJ5TG9jIiwiYmluYXJ5TG9jcyIsInBhdGgiLCJyZXNvbHZlIiwiZm9yRWFjaCIsImRpciIsInB1c2giLCJsb2MiLCJmcyIsImV4aXN0cyIsImlzTnVsbCIsIkVycm9yIiwidHJpbSIsImNtZCIsInN0ZG91dCIsImUiLCJnZXRDb25uZWN0ZWREZXZpY2VzIiwiZGVidWciLCJleGVjdXRhYmxlIiwiZGVmYXVsdEFyZ3MiLCJjb25jYXQiLCJzdGFydGluZ0luZGV4Iiwic2xpY2UiLCJkZXZpY2VzIiwic3BsaXQiLCJsaW5lIiwibGluZUluZm8iLCJ1ZGlkIiwic3RhdGUiLCJsZW5ndGgiLCJtZXNzYWdlIiwiZ2V0RGV2aWNlc1dpdGhSZXRyeSIsInRpbWVvdXRNcyIsInN0YXJ0IiwiRGF0ZSIsIm5vdyIsImdldERldmljZXMiLCJyZXN0YXJ0QWRiIiwic3VwcHJlc3NLaWxsU2VydmVyIiwia2lsbFNlcnZlciIsImVycm9yIiwiYWRiUG9ydCIsInJlc2V0VGVsbmV0QXV0aFRva2VuIiwiaG9tZUZvbGRlclBhdGgiLCJwcm9jZXNzIiwiZW52IiwicGxhdGZvcm0iLCJkc3RQYXRoIiwid3JpdGVGaWxlIiwiYWRiRXhlY0VtdSIsInZlcmlmeUVtdWxhdG9yQ29ubmVjdGVkIiwiYWRiRXhlYyIsIm9wdHMiLCJ0aW1lb3V0IiwiYWRiRXhlY1RpbWVvdXQiLCJleGVjRnVuYyIsIkFycmF5IiwiYXJncyIsInJlcGxhY2UiLCJlcnJUZXh0Iiwic3RkZXJyIiwicHJvdG9jb2xGYXVsdEVycm9yIiwidGVzdCIsImRldmljZU5vdEZvdW5kRXJyb3IiLCJkZXZpY2VDb25uZWN0aW5nRXJyb3IiLCJjb2RlIiwic2hlbGwiLCJpc0FycmF5IiwiY3JlYXRlU3ViUHJvY2VzcyIsIkpTT04iLCJzdHJpbmdpZnkiLCJTdWJQcm9jZXNzIiwiZ2V0QWRiUGF0aCIsImdldEFkYlNlcnZlclBvcnQiLCJnZXRFbXVsYXRvclBvcnQiLCJlbXVsYXRvclBvcnQiLCJwb3J0IiwiZ2V0UG9ydEZyb21FbXVsYXRvclN0cmluZyIsImVtU3RyIiwicG9ydFBhdHRlcm4iLCJwYXJzZUludCIsImV4ZWMiLCJnZXRDb25uZWN0ZWRFbXVsYXRvcnMiLCJlbXVsYXRvcnMiLCJkZXZpY2UiLCJzZXRFbXVsYXRvclBvcnQiLCJlbVBvcnQiLCJzZXREZXZpY2VJZCIsImRldmljZUlkIiwiY3VyRGV2aWNlSWQiLCJhcmdzSGFzRGV2aWNlIiwic3BsaWNlIiwic2V0RGV2aWNlIiwiZGV2aWNlT2JqIiwiZ2V0UnVubmluZ0FWRCIsImF2ZE5hbWUiLCJlbXVsYXRvciIsInJ1bm5pbmdBVkROYW1lIiwic2VuZFRlbG5ldENvbW1hbmQiLCJnZXRSdW5uaW5nQVZEV2l0aFJldHJ5IiwicnVubmluZ0F2ZCIsIndhaXRNcyIsImludGVydmFsTXMiLCJraWxsQWxsRW11bGF0b3JzIiwia2lsbEVtdWxhdG9yIiwidXRpbCIsImhhc1ZhbHVlIiwiaXNFbXVsYXRvckNvbm5lY3RlZCIsImlnbiIsImxhdW5jaEFWRCIsImF2ZEFyZ3MiLCJsYW5ndWFnZSIsImNvdW50cnkiLCJhdmRMYXVuY2hUaW1lb3V0IiwiYXZkUmVhZHlUaW1lb3V0IiwicmV0cnlUaW1lcyIsImVtdWxhdG9yQmluYXJ5UGF0aCIsInN1YnN0ciIsImNoZWNrQXZkRXhpc3QiLCJsYXVuY2hBcmdzIiwiaXNTdHJpbmciLCJ0b1VwcGVyQ2FzZSIsImxvY2FsZSIsImlzRW1wdHkiLCJwcm9jIiwib24iLCJmaWx0ZXIiLCJCb29sZWFuIiwic2lnbmFsIiwid2FpdEZvckVtdWxhdG9yUmVhZHkiLCJnZXRBZGJWZXJzaW9uIiwiYWRiVmVyc2lvbiIsInBhcnRzIiwidmVyc2lvblN0cmluZyIsInZlcnNpb25GbG9hdCIsInBhcnNlRmxvYXQiLCJtYWpvciIsIm1pbm9yIiwicGF0Y2giLCJ1bmRlZmluZWQiLCJyZXN1bHQiLCJ1bmtub3duT3B0aW9uRXJyb3IiLCJzZGtWZXJzaW9uIiwiZXhpc3RpbmdzIiwiaW5jbHVkZXMiLCJlcnIiLCJ3YWl0Rm9yRGV2aWNlIiwiYXBwRGV2aWNlUmVhZHlUaW1lb3V0IiwicmV0cmllcyIsInBpbmciLCJydW5Qcml2aWxlZ2VkU2hlbGwiLCJpc1Jvb3QiLCJyb290IiwicmVib290IiwiQiIsImRlbGF5Iiwic2V0RGV2aWNlUHJvcGVydHkiLCJib290ZWQiLCJnZXREZXZpY2VQcm9wZXJ0eSIsIm1zZyIsInVucm9vdCIsImZpbGVFeGlzdHMiLCJyZW1vdGVQYXRoIiwiZmlsZXMiLCJscyIsImxpbmVzIiwibWFwIiwibCIsImZpbGVTaXplIiwibWF0Y2giLCJpc05hTiIsImluc3RhbGxNaXRtQ2VydGlmaWNhdGUiLCJjZXJ0Iiwib3BlblNzbCIsImlzQnVmZmVyIiwiQnVmZmVyIiwiZnJvbSIsInRtcFJvb3QiLCJ0ZW1wRGlyIiwib3BlbkRpciIsInNyY0NlcnQiLCJjZXJ0SGFzaCIsImRzdENlcnRDb250ZW50IiwiZHN0Q2VydCIsInJpbXJhZiIsImlzTWl0bUNl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LEtBVEQsU0FTVTtBQUNSLFlBQU10QixrQkFBR2dMLE1BQUgsQ0FBVVAsT0FBVixDQUFOO0FBQ0Q7O0FBQ0QsVUFBTWxJLE9BQU8sR0FBRzdDLGNBQUt5TCxLQUFMLENBQVd4TCxPQUFYLENBQW1CdEIsVUFBbkIsRUFBZ0MsR0FBRXdNLFFBQVMsSUFBM0MsQ0FBaEI7O0FBQ0FsTSxvQkFBSThCLEtBQUosQ0FBVyx3REFBdUQ4QixPQUFRLEdBQTFFOztBQUNBLGlCQUFhLEtBQUtrSCxVQUFMLENBQWdCbEgsT0FBaEIsQ0FBYjtBQUNELEdBeEJEOztBQUFBO0FBQUE7QUFBQTtBQUFBOztlQTBCZTFFLGlCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgbG9nIGZyb20gJy4uL2xvZ2dlci5qcyc7XG5pbXBvcnQgQiBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBzeXN0ZW0sIGZzLCB1dGlsLCB0ZW1wRGlyIH0gZnJvbSAnYXBwaXVtLXN1cHBvcnQnO1xuaW1wb3J0IHsgZ2V0U2RrVG9vbHNWZXJzaW9uLCBnZXRCdWlsZFRvb2xzRGlycywgZ2V0T3BlblNzbEZvck9zIH0gZnJvbSAnLi4vaGVscGVycyc7XG5pbXBvcnQgeyBleGVjLCBTdWJQcm9jZXNzIH0gZnJvbSAndGVlbl9wcm9jZXNzJztcbmltcG9ydCB7IHNsZWVwLCByZXRyeSwgcmV0cnlJbnRlcnZhbCwgd2FpdEZvckNvbmRpdGlvbiB9IGZyb20gJ2FzeW5jYm94JztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBxdW90ZSB9IGZyb20gJ3NoZWxsLXF1b3RlJztcblxuXG5sZXQgc3lzdGVtQ2FsbE1ldGhvZHMgPSB7fTtcblxuY29uc3QgREVGQVVMVF9BREJfRVhFQ19USU1FT1VUID0gMjAwMDA7IC8vIGluIG1pbGxpc2Vjb25kc1xuY29uc3QgREVGQVVMVF9BREJfUkVCT09UX1JFVFJJRVMgPSA5MDtcblxuY29uc3QgTElOS0VSX1dBUk5JTkdfUkVHRVhQID0gL15XQVJOSU5HOiBsaW5rZXIuKyQvbTtcbmNvbnN0IFBST1RPQ09MX0ZBVUxUX0VSUk9SX1JFR0VYUCA9IG5ldyBSZWdFeHAoJ3Byb3RvY29sIGZhdWx0IFxcXFwobm8gc3RhdHVzXFxcXCknLCAnaScpO1xuY29uc3QgREVWSUNFX05PVF9GT1VORF9FUlJPUl9SRUdFWFAgPSBuZXcgUmVnRXhwKGBlcnJvcjogZGV2aWNlICgnLisnICk/bm90IGZvdW5kYCwgJ2knKTtcbmNvbnN0IERFVklDRV9DT05ORUNUSU5HX0VSUk9SX1JFR0VYUCA9IG5ldyBSZWdFeHAoJ2Vycm9yOiBkZXZpY2Ugc3RpbGwgY29ubmVjdGluZycsICdpJyk7XG5cbmNvbnN0IENFUlRTX1JPT1QgPSAnL3N5c3RlbS9ldGMvc2VjdXJpdHkvY2FjZXJ0cyc7XG5jb25zdCBFTVVfU1RPUF9USU1FT1VUID0gMjAwMDtcblxuLyoqXG4gKiBSZXRyaWV2ZSBmdWxsIHBhdGggdG8gdGhlIGdpdmVuIGJpbmFyeS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gYmluYXJ5TmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBiaW5hcnkuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEZ1bGwgcGF0aCB0byB0aGUgZ2l2ZW4gYmluYXJ5IGluY2x1ZGluZyBjdXJyZW50IFNESyByb290LlxuICovXG5zeXN0ZW1DYWxsTWV0aG9kcy5nZXRTZGtCaW5hcnlQYXRoID0gXy5tZW1vaXplKGFzeW5jIGZ1bmN0aW9uIChiaW5hcnlOYW1lKSB7XG4gIGxvZy5pbmZvKGBDaGVja2luZyB3aGV0aGVyICR7YmluYXJ5TmFtZX0gaXMgcHJlc2VudGApO1xuICBpZiAodGhpcy5zZGtSb290KSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0QmluYXJ5RnJvbVNka1Jvb3QoYmluYXJ5TmFtZSk7XG4gIH1cbiAgbG9nLndhcm4oYFRoZSBBTkRST0lEX0hPTUUgZW52aXJvbm1lbnQgdmFyaWFibGUgaXMgbm90IHNldCB0byB0aGUgQW5kcm9pZCBTREsgYCArXG4gICAgICAgICAgIGByb290IGRpcmVjdG9yeSBwYXRoLiBBTkRST0lEX0hPTUUgaXMgcmVxdWlyZWQgZm9yIGNvbXBhdGliaWxpdHkgYCArXG4gICAgICAgICAgIGB3aXRoIFNESyAyMysuIENoZWNraW5nIGFsb25nIFBBVEggZm9yICR7YmluYXJ5TmFtZX0uYCk7XG4gIHJldHVybiBhd2FpdCB0aGlzLmdldEJpbmFyeUZyb21QYXRoKGJpbmFyeU5hbWUpO1xufSk7XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIG5hbWUgb2YgdGhlIHRvb2wsXG4gKiB3aGljaCBwcmludHMgZnVsbCBwYXRoIHRvIHRoZSBnaXZlbiBjb21tYW5kIHNob3J0Y3V0LlxuICpcbiAqIEByZXR1cm4ge3N0cmluZ30gRGVwZW5kaW5nIG9uIHRoZSBjdXJyZW50IHBsYXRmb3JtIHRoaXMgaXNcbiAqICAgICAgICAgICAgICAgICAgc3VwcG9zZWQgdG8gYmUgZWl0aGVyICd3aGljaCcgb3IgJ3doZXJlJy5cbiAqL1xuc3lzdGVtQ2FsbE1ldGhvZHMuZ2V0Q29tbWFuZEZvck9TID0gXy5tZW1vaXplKGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHN5c3RlbS5pc1dpbmRvd3MoKSA/ICd3aGVyZScgOiAnd2hpY2gnO1xufSk7XG5cbi8qKlxuICogUmV0cmlldmUgZnVsbCBiaW5hcnkgbmFtZSBmb3IgdGhlIGN1cnJlbnQgb3BlcmF0aW5nIHN5c3RlbS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gYmluYXJ5TmFtZSAtIHNpbXBsZSBiaW5hcnkgbmFtZSwgZm9yIGV4YW1wbGUgJ2FuZHJvaWQnLlxuICogQHJldHVybiB7c3RyaW5nfSBGb3JtYXR0ZWQgYmluYXJ5IG5hbWUgZGVwZW5kaW5nIG9uIHRoZSBjdXJyZW50IHBsYXRmb3JtLFxuICogICAgICAgICAgICAgICAgICBmb3IgZXhhbXBsZSwgJ2FuZHJvaWQuYmF0JyBvbiBXaW5kb3dzLlxuICovXG5zeXN0ZW1DYWxsTWV0aG9kcy5nZXRCaW5hcnlOYW1lRm9yT1MgPSBfLm1lbW9pemUoZnVuY3Rpb24gKGJpbmFyeU5hbWUpIHtcbiAgaWYgKCFzeXN0ZW0uaXNXaW5kb3dzKCkpIHtcbiAgICByZXR1cm4gYmluYXJ5TmFtZTtcbiAgfVxuXG4gIGlmIChbJ2FuZHJvaWQnLCAnYXBrc2lnbmVyJywgJ2Fwa2FuYWx5emVyJ10uaW5kZXhPZihiaW5hcnlOYW1lKSA+PSAwICYmXG4gICAgICAhYmluYXJ5TmFtZS50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKCcuYmF0JykpIHtcbiAgICByZXR1cm4gYCR7YmluYXJ5TmFtZX0uYmF0YDtcbiAgfVxuICBpZiAoIWJpbmFyeU5hbWUudG9Mb3dlckNhc2UoKS5lbmRzV2l0aCgnLmV4ZScpKSB7XG4gICAgcmV0dXJuIGAke2JpbmFyeU5hbWV9LmV4ZWA7XG4gIH1cbiAgcmV0dXJuIGJpbmFyeU5hbWU7XG59KTtcblxuLyoqXG4gKiBSZXRyaWV2ZSBmdWxsIHBhdGggdG8gdGhlIGdpdmVuIGJpbmFyeS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gYmluYXJ5TmFtZSAtIFNpbXBsZSBuYW1lIG9mIGEgYmluYXJ5IGZpbGUuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEZ1bGwgcGF0aCB0byB0aGUgZ2l2ZW4gYmluYXJ5LiBUaGUgbWV0aG9kIHRyaWVzXG4gKiAgICAgICAgICAgICAgICAgIHRvIGVudW1lcmF0ZSBhbGwgdGhlIGtub3duIGxvY2F0aW9ucyB3aGVyZSB0aGUgYmluYXJ5XG4gKiAgICAgICAgICAgICAgICAgIG1pZ2h0IGJlIGxvY2F0ZWQgYW5kIHN0b3BzIHRoZSBzZWFyY2ggYXMgc29vbiBhcyB0aGUgZmlyc3RcbiAqICAgICAgICAgICAgICAgICAgbWF0Y2ggaXMgZm91bmQgb24gdGhlIGxvY2FsIGZpbGUgc3lzdGVtLlxuICogQHRocm93cyB7RXJyb3J9IElmIHRoZSBiaW5hcnkgd2l0aCBnaXZlbiBuYW1lIGlzIG5vdCBwcmVzZW50IGF0IGFueVxuICogICAgICAgICAgICAgICAgIG9mIGtub3duIGxvY2F0aW9ucyBvciBBbmRyb2lkIFNESyBpcyBub3QgaW5zdGFsbGVkIG9uIHRoZVxuICogICAgICAgICAgICAgICAgIGxvY2FsIGZpbGUgc3lzdGVtLlxuICovXG5zeXN0ZW1DYWxsTWV0aG9kcy5nZXRCaW5hcnlGcm9tU2RrUm9vdCA9IF8ubWVtb2l6ZShhc3luYyBmdW5jdGlvbiAoYmluYXJ5TmFtZSkge1xuICBsZXQgYmluYXJ5TG9jID0gbnVsbDtcbiAgYmluYXJ5TmFtZSA9IHRoaXMuZ2V0QmluYXJ5TmFtZUZvck9TKGJpbmFyeU5hbWUpO1xuICBsZXQgYmluYXJ5TG9jcyA9IFtcbiAgICBwYXRoLnJlc29sdmUodGhpcy5zZGtSb290LCBcInBsYXRmb3JtLXRvb2xzXCIsIGJpbmFyeU5hbWUpLFxuICAgIHBhdGgucmVzb2x2ZSh0aGlzLnNka1Jvb3QsIFwiZW11bGF0b3JcIiwgYmluYXJ5TmFtZSksXG4gICAgcGF0aC5yZXNvbHZlKHRoaXMuc2RrUm9vdCwgXCJ0b29sc1wiLCBiaW5hcnlOYW1lKSxcbiAgICBwYXRoLnJlc29sdmUodGhpcy5zZGtSb290LCBcInRvb2xzXCIsIFwiYmluXCIsIGJpbmFyeU5hbWUpXG4gIF07XG4gIC8vIGdldCBzdWJwYXRocyBmb3IgY3VycmVudGx5IGluc3RhbGxlZCBidWlsZCB0b29sIGRpcmVjdG9yaWVzXG4gIF8uZm9yRWFjaChhd2FpdCBnZXRCdWlsZFRvb2xzRGlycyh0aGlzLnNka1Jvb3QpLFxuICAgICAgICAgICAgKGRpcikgPT4gYmluYXJ5TG9jcy5wdXNoKHBhdGgucmVzb2x2ZShkaXIsIGJpbmFyeU5hbWUpKSk7XG4gIGZvciAobGV0IGxvYyBvZiBiaW5hcnlMb2NzKSB7XG4gICAgaWYgKGF3YWl0IGZzLmV4aXN0cyhsb2MpKSB7XG4gICAgICBiaW5hcnlMb2MgPSBsb2M7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgaWYgKF8uaXNOdWxsKGJpbmFyeUxvYykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBmaW5kICR7YmluYXJ5TmFtZX0gaW4gJHtiaW5hcnlMb2NzfS4gYCArXG4gICAgICAgICAgICAgICAgICAgIGBEbyB5b3UgaGF2ZSB0aGUgQW5kcm9pZCBTREsgaW5zdGFsbGVkIGF0ICcke3RoaXMuc2RrUm9vdH0nP2ApO1xuICB9XG4gIGJpbmFyeUxvYyA9IGJpbmFyeUxvYy50cmltKCk7XG4gIGxvZy5pbmZvKGBVc2luZyAke2JpbmFyeU5hbWV9IGZyb20gJHtiaW5hcnlMb2N9YCk7XG4gIHJldHVybiBiaW5hcnlMb2M7XG59KTtcblxuLyoqXG4gKiBSZXRyaWV2ZSBmdWxsIHBhdGggdG8gYSBiaW5hcnkgZmlsZSB1c2luZyB0aGUgc3RhbmRhcmQgc3lzdGVtIGxvb2t1cCB0b29sLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBiaW5hcnlOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGJpbmFyeS5cbiAqIEByZXR1cm4ge3N0cmluZ30gRnVsbCBwYXRoIHRvIHRoZSBiaW5hcnkgcmVjZWl2ZWQgZnJvbSAnd2hpY2gnLyd3aGVyZSdcbiAqICAgICAgICAgICAgICAgICAgb3V0cHV0LlxuICogQHRocm93cyB7RXJyb3J9IElmIGxvb2t1cCB0b29sIHJldHVybnMgbm9uLXplcm8gcmV0dXJuIGNvZGUuXG4gKi9cbnN5c3RlbUNhbGxNZXRob2RzLmdldEJpbmFyeUZyb21QYXRoID0gYXN5bmMgZnVuY3Rpb24gKGJpbmFyeU5hbWUpIHtcbiAgbGV0IGJpbmFyeUxvYyA9IG51bGw7XG4gIGxldCBjbWQgPSB0aGlzLmdldENvbW1hbmRGb3JPUygpO1xuICB0cnkge1xuICAgIGxldCB7c3Rkb3V0fSA9IGF3YWl0IGV4ZWMoY21kLCBbYmluYXJ5TmFtZV0pO1xuICAgIGxvZy5pbmZvKGBVc2luZyAke2JpbmFyeU5hbWV9IGZyb20gJHtzdGRvdXR9YCk7XG4gICAgLy8gVE9ETyB3cml0ZSBhIHRlc3QgZm9yIGJpbmFyaWVzIHdpdGggc3BhY2VzLlxuICAgIGJpbmFyeUxvYyA9IHN0ZG91dC50cmltKCk7XG4gICAgcmV0dXJuIGJpbmFyeUxvYztcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGZpbmQgJHtiaW5hcnlOYW1lfSBQbGVhc2Ugc2V0IHRoZSBBTkRST0lEX0hPTUUgYCArXG4gICAgICAgICAgICAgIGBlbnZpcm9ubWVudCB2YXJpYWJsZSB3aXRoIHRoZSBBbmRyb2lkIFNESyByb290IGRpcmVjdG9yeSBwYXRoLmApO1xuICB9XG59O1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IERldmljZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IHVkaWQgLSBUaGUgZGV2aWNlIHVkaWQuXG4gKiBAcHJvcGVydHkge3N0cmluZ30gc3RhdGUgLSBDdXJyZW50IGRldmljZSBzdGF0ZSwgYXMgaXQgaXMgdmlzaWJsZSBpblxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgX2FkYiBkZXZpY2VzIC1sXyBvdXRwdXQuXG4gKi9cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgbGlzdCBvZiBkZXZpY2VzIHZpc2libGUgdG8gYWRiLlxuICpcbiAqIEByZXR1cm4ge0FycmF5LjxEZXZpY2U+fSBUaGUgbGlzdCBvZiBkZXZpY2VzIG9yIGFuIGVtcHR5IGxpc3QgaWZcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICBubyBkZXZpY2VzIGFyZSBjb25uZWN0ZWQuXG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYgdGhlcmUgd2FzIGFuIGVycm9yIHdoaWxlIGxpc3RpbmcgZGV2aWNlcy5cbiAqL1xuc3lzdGVtQ2FsbE1ldGhvZHMuZ2V0Q29ubmVjdGVkRGV2aWNlcyA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgbG9nLmRlYnVnKFwiR2V0dGluZyBjb25uZWN0ZWQgZGV2aWNlcy4uLlwiKTtcbiAgdHJ5IHtcbiAgICBsZXQge3N0ZG91dH0gPSBhd2FpdCBleGVjKHRoaXMuZXhlY3V0YWJsZS5wYXRoLCB0aGlzLmV4ZWN1dGFibGUuZGVmYXVsdEFyZ3MuY29uY2F0KFsnZGV2aWNlcyddKSk7XG4gICAgLy8gZXhwZWN0aW5nIGFkYiBkZXZpY2VzIHRvIHJldHVybiBvdXRwdXQgYXNcbiAgICAvLyBMaXN0IG9mIGRldmljZXMgYXR0YWNoZWRcbiAgICAvLyBlbXVsYXRvci01NTU0XHRkZXZpY2VcbiAgICBsZXQgc3RhcnRpbmdJbmRleCA9IHN0ZG91dC5pbmRleE9mKFwiTGlzdCBvZiBkZXZpY2VzXCIpO1xuICAgIGlmIChzdGFydGluZ0luZGV4ID09PSAtMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmV4cGVjdGVkIG91dHB1dCB3aGlsZSB0cnlpbmcgdG8gZ2V0IGRldmljZXMuIG91dHB1dCB3YXM6ICR7c3Rkb3V0fWApO1xuICAgIH1cbiAgICAvLyBzbGljaW5nIG91cHV0IHdlIGNhcmUgYWJvdXQuXG4gICAgc3Rkb3V0ID0gc3Rkb3V0LnNsaWNlKHN0YXJ0aW5nSW5kZXgpO1xuICAgIGxldCBkZXZpY2VzID0gW107XG4gICAgZm9yIChsZXQgbGluZSBvZiBzdGRvdXQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICAgIGlmIChsaW5lLnRyaW0oKSAhPT0gXCJcIiAmJlxuICAgICAgICAgIGxpbmUuaW5kZXhPZihcIkxpc3Qgb2YgZGV2aWNlc1wiKSA9PT0gLTEgJiZcbiAgICAgICAgICBsaW5lLmluZGV4T2YoXCJhZGIgc2VydmVyXCIpID09PSAtMSAmJlxuICAgICAgICAgIGxpbmUuaW5kZXhPZihcIiogZGFlbW9uXCIpID09PSAtMSAmJlxuICAgICAgICAgIGxpbmUuaW5kZXhPZihcIm9mZmxpbmVcIikgPT09IC0xKSB7XG4gICAgICAgIGxldCBsaW5lSW5mbyA9IGxpbmUuc3BsaXQoXCJcXHRcIik7XG4gICAgICAgIC8vIHN0YXRlIGlzIGVpdGhlciBcImRldmljZVwiIG9yIFwib2ZmbGluZVwiLCBhZmFpY3RcbiAgICAgICAgZGV2aWNlcy5wdXNoKHt1ZGlkOiBsaW5lSW5mb1swXSwgc3RhdGU6IGxpbmVJbmZvWzFdfSk7XG4gICAgICB9XG4gICAgfVxuICAgIGxvZy5kZWJ1ZyhgJHtkZXZpY2VzLmxlbmd0aH0gZGV2aWNlKHMpIGNvbm5lY3RlZGApO1xuICAgIHJldHVybiBkZXZpY2VzO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciB3aGlsZSBnZXR0aW5nIGNvbm5lY3RlZCBkZXZpY2VzLiBPcmlnaW5hbCBlcnJvcjogJHtlLm1lc3NhZ2V9YCk7XG4gIH1cbn07XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIGxpc3Qgb2YgZGV2aWNlcyB2aXNpYmxlIHRvIGFkYiB3aXRoaW4gdGhlIGdpdmVuIHRpbWVvdXQuXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHRpbWVvdXRNcyAtIFRoZSBtYXhpbXVtIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gZ2V0IGF0IGxlYXN0XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25lIGxpc3QgaXRlbS5cbiAqIEByZXR1cm4ge0FycmF5LjxEZXZpY2U+fSBUaGUgbGlzdCBvZiBjb25uZWN0ZWQgZGV2aWNlcy5cbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiBubyBjb25uZWN0ZWQgZGV2aWNlcyBjYW4gYmUgZGV0ZWN0ZWQgd2l0aGluIHRoZSBnaXZlbiB0aW1lb3V0LlxuICovXG5zeXN0ZW1DYWxsTWV0aG9kcy5nZXREZXZpY2VzV2l0aFJldHJ5ID0gYXN5bmMgZnVuY3Rpb24gKHRpbWVvdXRNcyA9IDIwMDAwKSB7XG4gIGxldCBzdGFydCA9IERhdGUubm93KCk7XG4gIGxvZy5kZWJ1ZyhcIlRyeWluZyB0byBmaW5kIGEgY29ubmVjdGVkIGFuZHJvaWQgZGV2aWNlXCIpO1xuICBsZXQgZ2V0RGV2aWNlcyA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoKERhdGUubm93KCkgLSBzdGFydCkgPiB0aW1lb3V0TXMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBmaW5kIGEgY29ubmVjdGVkIEFuZHJvaWQgZGV2aWNlLlwiKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGxldCBkZXZpY2VzID0gYXdhaXQgdGhpcy5nZXRDb25uZWN0ZWREZXZpY2VzKCk7XG4gICAgICBpZiAoZGV2aWNlcy5sZW5ndGggPCAxKSB7XG4gICAgICAgIGxvZy5kZWJ1ZyhcIkNvdWxkIG5vdCBmaW5kIGRldmljZXMsIHJlc3RhcnRpbmcgYWRiIHNlcnZlci4uLlwiKTtcbiAgICAgICAgYXdhaXQgdGhpcy5yZXN0YXJ0QWRiKCk7XG4gICAgICAgIC8vIGNvb2wgZG93blxuICAgICAgICBhd2FpdCBzbGVlcCgyMDApO1xuICAgICAgICByZXR1cm4gYXdhaXQgZ2V0RGV2aWNlcygpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRldmljZXM7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbG9nLmRlYnVnKFwiQ291bGQgbm90IGZpbmQgZGV2aWNlcywgcmVzdGFydGluZyBhZGIgc2VydmVyLi4uXCIpO1xuICAgICAgYXdhaXQgdGhpcy5yZXN0YXJ0QWRiKCk7XG4gICAgICAvLyBjb29sIGRvd25cbiAgICAgIGF3YWl0IHNsZWVwKDIwMCk7XG4gICAgICByZXR1cm4gYXdhaXQgZ2V0RGV2aWNlcygpO1xuICAgIH1cbiAgfTtcbiAgcmV0dXJuIGF3YWl0IGdldERldmljZXMoKTtcbn07XG5cbi8qKlxuICogUmVzdGFydCBhZGIgc2VydmVyIGlmIF90aGlzLnN1cHByZXNzS2lsbFNlcnZlcl8gcHJvcGVydHkgaXMgdHJ1ZS5cbiAqL1xuc3lzdGVtQ2FsbE1ldGhvZHMucmVzdGFydEFkYiA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuc3VwcHJlc3NLaWxsU2VydmVyKSB7XG4gICAgbG9nLmRlYnVnKGBOb3QgcmVzdGFydGluZyBhYmQgc2luY2UgJ3N1cHByZXNzS2lsbFNlcnZlcicgaXMgb25gKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBsb2cuZGVidWcoJ1Jlc3RhcnRpbmcgYWRiJyk7XG4gIHRyeSB7XG4gICAgYXdhaXQgdGhpcy5raWxsU2VydmVyKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsb2cuZXJyb3IoXCJFcnJvciBraWxsaW5nIEFEQiBzZXJ2ZXIsIGdvaW5nIHRvIHNlZSBpZiBpdCdzIG9ubGluZSBhbnl3YXlcIik7XG4gIH1cbn07XG5cbi8qKlxuICogS2lsbCBhZGIgc2VydmVyLlxuICovXG5zeXN0ZW1DYWxsTWV0aG9kcy5raWxsU2VydmVyID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICBsb2cuZGVidWcoYEtpbGxpbmcgYWRiIHNlcnZlciBvbiBwb3J0ICR7dGhpcy5hZGJQb3J0fWApO1xuICBhd2FpdCBleGVjKHRoaXMuZXhlY3V0YWJsZS5wYXRoLCBbLi4udGhpcy5leGVjdXRhYmxlLmRlZmF1bHRBcmdzLCAna2lsbC1zZXJ2ZXInXSk7XG59O1xuXG4vKipcbiAqIFJlc2V0IFRlbG5ldCBhdXRoZW50aWNhdGlvbiB0b2tlbi5cbiAqIEBzZWUge0BsaW5rIGh0dHA6Ly90b29scy5hbmRyb2lkLmNvbS9yZWNlbnQvZW11bGF0b3IyNTE2cmVsZWFzZW5vdGVzfSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIEByZXR1cm5zIHtib29sZWFufSBJZiB0b2tlbiByZXNldCB3YXMgc3VjY2Vzc2Z1bC5cbiAqL1xuc3lzdGVtQ2FsbE1ldGhvZHMucmVzZXRUZWxuZXRBdXRoVG9rZW4gPSBfLm1lbW9pemUoYXN5bmMgZnVuY3Rpb24gKCkge1xuICAvLyBUaGUgbWV0aG9kcyBpcyB1c2VkIHRvIHJlbW92ZSB0ZWxuZXQgYXV0aCB0b2tlblxuICAvL1xuICBjb25zdCBob21lRm9sZGVyUGF0aCA9IHByb2Nlc3MuZW52Wyhwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSA/ICdVU0VSUFJPRklMRScgOiAnSE9NRSddO1xuICBpZiAoIWhvbWVGb2xkZXJQYXRoKSB7XG4gICAgbG9nLndhcm4oYENhbm5vdCBmaW5kIHRoZSBwYXRoIHRvIHVzZXIgaG9tZSBmb2xkZXIuIElnbm9yaW5nIHJlc2V0dGluZyBvZiBlbXVsYXRvcidzIHRlbG5ldCBhdXRoZW50aWNhdGlvbiB0b2tlbmApO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBkc3RQYXRoID0gcGF0aC5yZXNvbHZlKGhvbWVGb2xkZXJQYXRoLCAnLmVtdWxhdG9yX2NvbnNvbGVfYXV0aF90b2tlbicpO1xuICBsb2cuZGVidWcoYE92ZXJyaWRpbmcgJHtkc3RQYXRofSB3aXRoIGFuIGVtcHR5IHN0cmluZyB0byBhdm9pZCB0ZWxuZXQgYXV0aGVudGljYXRpb24gZm9yIGVtdWxhdG9yIGNvbW1hbmRzYCk7XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMud3JpdGVGaWxlKGRzdFBhdGgsICcnKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGxvZy53YXJuKGBFcnJvciAke2UubWVzc2FnZX0gd2hpbGUgcmVzZXR0aW5nIHRoZSBjb250ZW50IG9mICR7ZHN0UGF0aH0uIElnbm9yaW5nIHJlc2V0dGluZyBvZiBlbXVsYXRvcidzIHRlbG5ldCBhdXRoZW50aWNhdGlvbiB0b2tlbmApO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn0pO1xuXG4vKipcbiAqIEV4ZWN1dGUgdGhlIGdpdmVuIGVtdWxhdG9yIGNvbW1hbmQgdXNpbmcgX2FkYiBlbXVfIHRvb2wuXG4gKlxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gY21kIC0gVGhlIGFycmF5IG9mIHJlc3QgY29tbWFuZCBsaW5lIHBhcmFtZXRlcnMuXG4gKi9cbnN5c3RlbUNhbGxNZXRob2RzLmFkYkV4ZWNFbXUgPSBhc3luYyBmdW5jdGlvbiAoY21kKSB7XG4gIGF3YWl0IHRoaXMudmVyaWZ5RW11bGF0b3JDb25uZWN0ZWQoKTtcbiAgYXdhaXQgdGhpcy5yZXNldFRlbG5ldEF1dGhUb2tlbigpO1xuICBhd2FpdCB0aGlzLmFkYkV4ZWMoWydlbXUnLCAuLi5jbWRdKTtcbn07XG5cbi8qKlxuICogRXhlY3V0ZSB0aGUgZ2l2ZW4gYWRiIGNvbW1hbmQuXG4gKlxuICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gY21kIC0gVGhlIGFycmF5IG9mIHJlc3QgY29tbWFuZCBsaW5lIHBhcmFtZXRlcnNcbiAqICAgICAgICAgICAgICAgICAgICAgIG9yIGEgc2luZ2xlIHN0cmluZyBwYXJhbWV0ZXIuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIEFkZGl0aW9uYWwgb3B0aW9ucyBtYXBwaW5nLiBTZWVcbiAqICAgICAgICAgICAgICAgICAgICAgICAge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9hcHBpdW0vbm9kZS10ZWVuX3Byb2Nlc3N9XG4gKiAgICAgICAgICAgICAgICAgICAgICAgIGZvciBtb3JlIGRldGFpbHMuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gQ29tbWFuZCdzIHN0ZG91dC5cbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiB0aGUgY29tbWFuZCByZXR1cm5lZCBub24temVybyBleGl0IGNvZGUuXG4gKi9cbnN5c3RlbUNhbGxNZXRob2RzLmFkYkV4ZWMgPSBhc3luYyBmdW5jdGlvbiAoY21kLCBvcHRzID0ge30pIHtcbiAgaWYgKCFjbWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJZb3UgbmVlZCB0byBwYXNzIGluIGEgY29tbWFuZCB0byBhZGJFeGVjKClcIik7XG4gIH1cbiAgLy8gc2V0dGluZyBkZWZhdWx0IHRpbWVvdXQgZm9yIGVhY2ggY29tbWFuZCB0byBwcmV2ZW50IGluZmluaXRlIHdhaXQuXG4gIG9wdHMudGltZW91dCA9IG9wdHMudGltZW91dCB8fCB0aGlzLmFkYkV4ZWNUaW1lb3V0IHx8IERFRkFVTFRfQURCX0VYRUNfVElNRU9VVDtcblxuICBsZXQgZXhlY0Z1bmMgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghKGNtZCBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICBjbWQgPSBbY21kXTtcbiAgICAgIH1cbiAgICAgIGxldCBhcmdzID0gdGhpcy5leGVjdXRhYmxlLmRlZmF1bHRBcmdzLmNvbmNhdChjbWQpO1xuICAgICAgbG9nLmRlYnVnKGBSdW5uaW5nICcke3RoaXMuZXhlY3V0YWJsZS5wYXRofSAke3F1b3RlKGFyZ3MpfSdgKTtcbiAgICAgIGxldCB7c3Rkb3V0fSA9IGF3YWl0IGV4ZWModGhpcy5leGVjdXRhYmxlLnBhdGgsIGFyZ3MsIG9wdHMpO1xuICAgICAgLy8gc29tZXRpbWVzIEFEQiBwcmludHMgb3V0IHdlaXJkIHN0ZG91dCB3YXJuaW5ncyB0aGF0IHdlIGRvbid0IHdhbnRcbiAgICAgIC8vIHRvIGluY2x1ZGUgaW4gYW55IG9mIHRoZSByZXNwb25zZSBkYXRhLCBzbyBsZXQncyBzdHJpcCBpdCBvdXRcbiAgICAgIHN0ZG91dCA9IHN0ZG91dC5yZXBsYWNlKExJTktFUl9XQVJOSU5HX1JFR0VYUCwgJycpLnRyaW0oKTtcbiAgICAgIHJldHVybiBzdGRvdXQ7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc3QgZXJyVGV4dCA9IGAke2UubWVzc2FnZX0sICR7ZS5zdGRvdXR9LCAke2Uuc3RkZXJyfWA7XG4gICAgICBjb25zdCBwcm90b2NvbEZhdWx0RXJyb3IgPSBQUk9UT0NPTF9GQVVMVF9FUlJPUl9SRUdFWFAudGVzdChlcnJUZXh0KTtcbiAgICAgIGNvbnN0IGRldmljZU5vdEZvdW5kRXJyb3IgPSBERVZJQ0VfTk9UX0ZPVU5EX0VSUk9SX1JFR0VYUC50ZXN0KGVyclRleHQpO1xuICAgICAgY29uc3QgZGV2aWNlQ29ubmVjdGluZ0Vycm9yID0gREVWSUNFX0NPTk5FQ1RJTkdfRVJST1JfUkVHRVhQLnRlc3QoZXJyVGV4dCk7XG4gICAgICBpZiAocHJvdG9jb2xGYXVsdEVycm9yIHx8IGRldmljZU5vdEZvdW5kRXJyb3IgfHwgZGV2aWNlQ29ubmVjdGluZ0Vycm9yKSB7XG4gICAgICAgIGxvZy5pbmZvKGBFcnJvciBzZW5kaW5nIGNvbW1hbmQsIHJlY29ubmVjdGluZyBkZXZpY2UgYW5kIHJldHJ5aW5nOiAke2NtZH1gKTtcbiAgICAgICAgYXdhaXQgc2xlZXAoMTAwMCk7XG4gICAgICAgIGF3YWl0IHRoaXMuZ2V0RGV2aWNlc1dpdGhSZXRyeSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZS5jb2RlID09PSAwICYmIGUuc3Rkb3V0KSB7XG4gICAgICAgIGxldCBzdGRvdXQgPSBlLnN0ZG91dDtcbiAgICAgICAgc3Rkb3V0ID0gc3Rkb3V0LnJlcGxhY2UoTElOS0VSX1dBUk5JTkdfUkVHRVhQLCAnJykudHJpbSgpO1xuICAgICAgICByZXR1cm4gc3Rkb3V0O1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIGV4ZWN1dGluZyBhZGJFeGVjLiBPcmlnaW5hbCBlcnJvcjogJyR7ZS5tZXNzYWdlfSc7IGAgK1xuICAgICAgICAgICAgICAgICAgICAgIGBTdGRlcnI6ICckeyhlLnN0ZGVyciB8fCAnJykudHJpbSgpfSc7IENvZGU6ICcke2UuY29kZX0nYCk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBhd2FpdCByZXRyeSgyLCBleGVjRnVuYyk7XG59O1xuXG4vKipcbiAqIEV4ZWN1dGUgdGhlIGdpdmVuIGNvbW1hbmQgdXNpbmcgX2FkYiBzaGVsbF8gcHJlZml4LlxuICpcbiAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz58c3RyaW5nfSBjbWQgLSBUaGUgYXJyYXkgb2YgcmVzdCBjb21tYW5kIGxpbmUgcGFyYW1ldGVycyBvciBhIHNpbmdsZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZyBwYXJhbWV0ZXIuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIEFkZGl0aW9uYWwgb3B0aW9ucyBtYXBwaW5nLiBTZWVcbiAqICAgICAgICAgICAgICAgICAgICAgICAge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9hcHBpdW0vbm9kZS10ZWVuX3Byb2Nlc3N9XG4gKiAgICAgICAgICAgICAgICAgICAgICAgIGZvciBtb3JlIGRldGFpbHMuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gQ29tbWFuZCdzIHN0ZG91dC5cbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiB0aGUgY29tbWFuZCByZXR1cm5lZCBub24temVybyBleGl0IGNvZGUuXG4gKi9cbnN5c3RlbUNhbGxNZXRob2RzLnNoZWxsID0gYXN5bmMgZnVuY3Rpb24gKGNtZCwgb3B0cyA9IHt9KSB7XG4gIHJldHVybiBhd2FpdCB0aGlzLmFkYkV4ZWMoXy5pc0FycmF5KGNtZCkgPyBbJ3NoZWxsJywgLi4uY21kXSA6IFsnc2hlbGwnLCBjbWRdLCBvcHRzKTtcbn07XG5cbnN5c3RlbUNhbGxNZXRob2RzLmNyZWF0ZVN1YlByb2Nlc3MgPSBmdW5jdGlvbiAoYXJncyA9IFtdKSB7XG4gIC8vIGFkZCB0aGUgZGVmYXVsdCBhcmd1bWVudHNcbiAgYXJncyA9IHRoaXMuZXhlY3V0YWJsZS5kZWZhdWx0QXJncy5jb25jYXQoYXJncyk7XG4gIGxvZy5kZWJ1ZyhgQ3JlYXRpbmcgQURCIHN1YnByb2Nlc3Mgd2l0aCBhcmdzOiAke0pTT04uc3RyaW5naWZ5KGFyZ3MpfWApO1xuICByZXR1cm4gbmV3IFN1YlByb2Nlc3ModGhpcy5nZXRBZGJQYXRoKCksIGFyZ3MpO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgY3VycmVudCBhZGIgcG9ydC5cbiAqIEB0b2RvIGNhbiBwcm9iYWJseSBkZXByZWNhdGUgdGhpcyBub3cgdGhhdCB0aGUgbG9naWMgaXMganVzdCB0byByZWFkIHRoaXMuYWRiUG9ydFxuICogQHJldHVybiB7bnVtYmVyfSBUaGUgY3VycmVudCBhZGIgcG9ydCBudW1iZXIuXG4gKi9cbnN5c3RlbUNhbGxNZXRob2RzLmdldEFkYlNlcnZlclBvcnQgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLmFkYlBvcnQ7XG59O1xuXG4vKipcbiAqIFJldHJpZXZlIHRoZSBjdXJyZW50IGVtdWxhdG9yIHBvcnQgZnJvbSBfYWRiIGRldml2ZXNfIG91dHB1dC5cbiAqXG4gKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBjdXJyZW50IGVtdWxhdG9yIHBvcnQuXG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYgdGhlcmUgYXJlIG5vIGNvbm5lY3RlZCBkZXZpY2VzLlxuICovXG5zeXN0ZW1DYWxsTWV0aG9kcy5nZXRFbXVsYXRvclBvcnQgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gIGxvZy5kZWJ1ZyhcIkdldHRpbmcgcnVubmluZyBlbXVsYXRvciBwb3J0XCIpO1xuICBpZiAodGhpcy5lbXVsYXRvclBvcnQgIT09IG51bGwpIHtcbiAgICByZXR1cm4gdGhpcy5lbXVsYXRvclBvcnQ7XG4gIH1cbiAgdHJ5IHtcbiAgICBsZXQgZGV2aWNlcyA9IGF3YWl0IHRoaXMuZ2V0Q29ubmVjdGVkRGV2aWNlcygpO1xuICAgIGxldCBwb3J0ID0gdGhpcy5nZXRQb3J0RnJvbUVtdWxhdG9yU3RyaW5nKGRldmljZXNbMF0udWRpZCk7XG4gICAgaWYgKHBvcnQpIHtcbiAgICAgIHJldHVybiBwb3J0O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVtdWxhdG9yIHBvcnQgbm90IGZvdW5kYCk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBObyBkZXZpY2VzIGNvbm5lY3RlZC4gT3JpZ2luYWwgZXJyb3I6ICR7ZS5tZXNzYWdlfWApO1xuICB9XG59O1xuXG4vKipcbiAqIFJldHJpZXZlIHRoZSBjdXJyZW50IGVtdWxhdG9yIHBvcnQgYnkgcGFyc2luZyBlbXVsYXRvciBuYW1lIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gZW1TdHIgLSBFbXVsYXRvciBuYW1lIHN0cmluZy5cbiAqIEByZXR1cm4ge251bWJlcnxib29sZWFufSBFaXRoZXIgdGhlIGN1cnJlbnQgZW11bGF0b3IgcG9ydCBvclxuICogICAgICAgICAgICAgICAgICAgICAgICAgIF9mYWxzZV8gaWYgcG9ydCBudW1iZXIgY2Fubm90IGJlIHBhcnNlZC5cbiAqL1xuc3lzdGVtQ2FsbE1ldGhvZHMuZ2V0UG9ydEZyb21FbXVsYXRvclN0cmluZyA9IGZ1bmN0aW9uIChlbVN0cikge1xuICBsZXQgcG9ydFBhdHRlcm4gPSAvZW11bGF0b3ItKFxcZCspLztcbiAgaWYgKHBvcnRQYXR0ZXJuLnRlc3QoZW1TdHIpKSB7XG4gICAgcmV0dXJuIHBhcnNlSW50KHBvcnRQYXR0ZXJuLmV4ZWMoZW1TdHIpWzFdLCAxMCk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgbGlzdCBvZiBjdXJyZW50bHkgY29ubmVjdGVkIGVtdWxhdG9ycy5cbiAqXG4gKiBAcmV0dXJuIHtBcnJheS48RGV2aWNlPn0gVGhlIGxpc3Qgb2YgY29ubmVjdGVkIGRldmljZXMuXG4gKi9cbnN5c3RlbUNhbGxNZXRob2RzLmdldENvbm5lY3RlZEVtdWxhdG9ycyA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgbG9nLmRlYnVnKFwiR2V0dGluZyBjb25uZWN0ZWQgZW11bGF0b3JzXCIpO1xuICB0cnkge1xuICAgIGxldCBkZXZpY2VzID0gYXdhaXQgdGhpcy5nZXRDb25uZWN0ZWREZXZpY2VzKCk7XG4gICAgbGV0IGVtdWxhdG9ycyA9IFtdO1xuICAgIGZvciAobGV0IGRldmljZSBvZiBkZXZpY2VzKSB7XG4gICAgICBsZXQgcG9ydCA9IHRoaXMuZ2V0UG9ydEZyb21FbXVsYXRvclN0cmluZyhkZXZpY2UudWRpZCk7XG4gICAgICBpZiAocG9ydCkge1xuICAgICAgICBkZXZpY2UucG9ydCA9IHBvcnQ7XG4gICAgICAgIGVtdWxhdG9ycy5wdXNoKGRldmljZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGxvZy5kZWJ1ZyhgJHtlbXVsYXRvcnMubGVuZ3RofSBlbXVsYXRvcihzKSBjb25uZWN0ZWRgKTtcbiAgICByZXR1cm4gZW11bGF0b3JzO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciBnZXR0aW5nIGVtdWxhdG9ycy4gT3JpZ2luYWwgZXJyb3I6ICR7ZS5tZXNzYWdlfWApO1xuICB9XG59O1xuXG4vKipcbiAqIFNldCBfZW11bGF0b3JQb3J0XyBwcm9wZXJ0eSBvZiB0aGUgY3VycmVudCBjbGFzcy5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gZW1Qb3J0IC0gVGhlIGVtdWxhdG9yIHBvcnQgdG8gYmUgc2V0LlxuICovXG5zeXN0ZW1DYWxsTWV0aG9kcy5zZXRFbXVsYXRvclBvcnQgPSBmdW5jdGlvbiAoZW1Qb3J0KSB7XG4gIHRoaXMuZW11bGF0b3JQb3J0ID0gZW1Qb3J0O1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIGlkZW50aWZpZXIgb2YgdGhlIGN1cnJlbnQgZGV2aWNlIChfdGhpcy5jdXJEZXZpY2VJZF8pLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSAtIFRoZSBkZXZpY2UgaWRlbnRpZmllci5cbiAqL1xuc3lzdGVtQ2FsbE1ldGhvZHMuc2V0RGV2aWNlSWQgPSBmdW5jdGlvbiAoZGV2aWNlSWQpIHtcbiAgbG9nLmRlYnVnKGBTZXR0aW5nIGRldmljZSBpZCB0byAke2RldmljZUlkfWApO1xuICB0aGlzLmN1ckRldmljZUlkID0gZGV2aWNlSWQ7XG4gIGxldCBhcmdzSGFzRGV2aWNlID0gdGhpcy5leGVjdXRhYmxlLmRlZmF1bHRBcmdzLmluZGV4T2YoJy1zJyk7XG4gIGlmIChhcmdzSGFzRGV2aWNlICE9PSAtMSkge1xuICAgIC8vIHJlbW92ZSB0aGUgb2xkIGRldmljZSBpZCBmcm9tIHRoZSBhcmd1bWVudHNcbiAgICB0aGlzLmV4ZWN1dGFibGUuZGVmYXVsdEFyZ3Muc3BsaWNlKGFyZ3NIYXNEZXZpY2UsIDIpO1xuICB9XG4gIHRoaXMuZXhlY3V0YWJsZS5kZWZhdWx0QXJncy5wdXNoKCctcycsIGRldmljZUlkKTtcbn07XG5cbi8qKlxuICogU2V0IHRoZSB0aGUgY3VycmVudCBkZXZpY2Ugb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7RGV2aWNlfSBkZXZpY2VPYmogLSBUaGUgZGV2aWNlIG9iamVjdCB0byBiZSBzZXQuXG4gKi9cbnN5c3RlbUNhbGxNZXRob2RzLnNldERldmljZSA9IGZ1bmN0aW9uIChkZXZpY2VPYmopIHtcbiAgbGV0IGRldmljZUlkID0gZGV2aWNlT2JqLnVkaWQ7XG4gIGxldCBlbVBvcnQgPSB0aGlzLmdldFBvcnRGcm9tRW11bGF0b3JTdHJpbmcoZGV2aWNlSWQpO1xuICB0aGlzLnNldEVtdWxhdG9yUG9ydChlbVBvcnQpO1xuICB0aGlzLnNldERldmljZUlkKGRldmljZUlkKTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBvYmplY3QgZm9yIHRoZSBjdXJyZW50bHkgcnVubmluZyBlbXVsYXRvci5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gYXZkTmFtZSAtIEVtdWxhdG9yIG5hbWUuXG4gKiBAcmV0dXJuIHs/RGV2aWNlfSBDdXJyZW50bHkgcnVubmluZyBlbXVsYXRvciBvciBfbnVsbF8uXG4gKi9cbnN5c3RlbUNhbGxNZXRob2RzLmdldFJ1bm5pbmdBVkQgPSBhc3luYyBmdW5jdGlvbiAoYXZkTmFtZSkge1xuICBsb2cuZGVidWcoYFRyeWluZyB0byBmaW5kICR7YXZkTmFtZX0gZW11bGF0b3JgKTtcbiAgdHJ5IHtcbiAgICBsZXQgZW11bGF0b3JzID0gYXdhaXQgdGhpcy5nZXRDb25uZWN0ZWRFbXVsYXRvcnMoKTtcbiAgICBmb3IgKGxldCBlbXVsYXRvciBvZiBlbXVsYXRvcnMpIHtcbiAgICAgIHRoaXMuc2V0RW11bGF0b3JQb3J0KGVtdWxhdG9yLnBvcnQpO1xuICAgICAgbGV0IHJ1bm5pbmdBVkROYW1lID0gYXdhaXQgdGhpcy5zZW5kVGVsbmV0Q29tbWFuZChcImF2ZCBuYW1lXCIpO1xuICAgICAgaWYgKGF2ZE5hbWUgPT09IHJ1bm5pbmdBVkROYW1lKSB7XG4gICAgICAgIGxvZy5kZWJ1ZyhgRm91bmQgZW11bGF0b3IgJHthdmROYW1lfSBpbiBwb3J0ICR7ZW11bGF0b3IucG9ydH1gKTtcbiAgICAgICAgdGhpcy5zZXREZXZpY2VJZChlbXVsYXRvci51ZGlkKTtcbiAgICAgICAgcmV0dXJuIGVtdWxhdG9yO1xuICAgICAgfVxuICAgIH1cbiAgICBsb2cuZGVidWcoYEVtdWxhdG9yICR7YXZkTmFtZX0gbm90IHJ1bm5pbmdgKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgZ2V0dGluZyBBVkQuIE9yaWdpbmFsIGVycm9yOiAke2UubWVzc2FnZX1gKTtcbiAgfVxufTtcblxuLyoqXG4gKiBHZXQgdGhlIG9iamVjdCBmb3IgdGhlIGN1cnJlbnRseSBydW5uaW5nIGVtdWxhdG9yLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBhdmROYW1lIC0gRW11bGF0b3IgbmFtZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSB0aW1lb3V0TXMgWzIwMDAwXSAtIFRoZSBtYXhpbXVtIG51bWJlciBvZiBtaWxsaXNlY29uZHNcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvIHdhaXQgdW50aWwgYXQgbGVhc3Qgb25lIHJ1bm5pbmcgQVZEIG9iamVjdFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXMgZGV0ZWN0ZWQuXG4gKiBAcmV0dXJuIHs/RGV2aWNlfSBDdXJyZW50bHkgcnVubmluZyBlbXVsYXRvciBvciBfbnVsbF8uXG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYgbm8gZGV2aWNlIGhhcyBiZWVuIGRldGVjdGVkIHdpdGhpbiB0aGUgdGltZW91dC5cbiAqL1xuc3lzdGVtQ2FsbE1ldGhvZHMuZ2V0UnVubmluZ0FWRFdpdGhSZXRyeSA9IGFzeW5jIGZ1bmN0aW9uIChhdmROYW1lLCB0aW1lb3V0TXMgPSAyMDAwMCkge1xuICBsZXQgcnVubmluZ0F2ZDtcbiAgdHJ5IHtcbiAgICBhd2FpdCB3YWl0Rm9yQ29uZGl0aW9uKGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJ1bm5pbmdBdmQgPSBhd2FpdCB0aGlzLmdldFJ1bm5pbmdBVkQoYXZkTmFtZS5yZXBsYWNlKCdAJywgJycpKTtcbiAgICAgICAgcmV0dXJuIHJ1bm5pbmdBdmQ7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGxvZy5kZWJ1ZyhlLm1lc3NhZ2UpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSwge1xuICAgICAgd2FpdE1zOiB0aW1lb3V0TXMsXG4gICAgICBpbnRlcnZhbE1zOiAxMDAwLFxuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciBnZXR0aW5nIEFWRCB3aXRoIHJldHJ5LiBPcmlnaW5hbCBlcnJvcjogJHtlLm1lc3NhZ2V9YCk7XG4gIH1cbiAgcmV0dXJuIHJ1bm5pbmdBdmQ7XG59O1xuXG4vKipcbiAqIFNodXRkb3duIGFsbCBydW5uaW5nIGVtdWxhdG9ycyBieSBraWxsaW5nIHRoZWlyIHByb2Nlc3Nlcy5cbiAqXG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYga2lsbGluZyB0b29sIHJldHVybmVkIG5vbi16ZXJvIHJldHVybiBjb2RlLlxuICovXG5zeXN0ZW1DYWxsTWV0aG9kcy5raWxsQWxsRW11bGF0b3JzID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICBsZXQgY21kLCBhcmdzO1xuICBpZiAoc3lzdGVtLmlzV2luZG93cygpKSB7XG4gICAgY21kID0gJ1RBU0tLSUxMJztcbiAgICBhcmdzID0gWydUQVNLS0lMTCcsICcvSU0nLCAnZW11bGF0b3IuZXhlJ107XG4gIH0gZWxzZSB7XG4gICAgY21kID0gJy91c3IvYmluL2tpbGxhbGwnO1xuICAgIGFyZ3MgPSBbJy1tJywgJ2VtdWxhdG9yKiddO1xuICB9XG4gIHRyeSB7XG4gICAgYXdhaXQgZXhlYyhjbWQsIGFyZ3MpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciBraWxsaW5nIGVtdWxhdG9ycy4gT3JpZ2luYWwgZXJyb3I6ICR7ZS5tZXNzYWdlfWApO1xuICB9XG59O1xuXG4vKipcbiAqIEtpbGwgZW11bGF0b3Igd2l0aCB0aGUgZ2l2ZW4gbmFtZS4gTm8gZXJyb3JcbiAqIGlzIHRocm93biBpcyBnaXZlbiBhdmQgZG9lcyBub3QgZXhpc3QvaXMgbm90IHJ1bm5pbmcuXG4gKlxuICogQHBhcmFtIHs/c3RyaW5nfSBhdmROYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGVtdWxhdG9yIHRvIGJlIGtpbGxlZC4gSWYgZW1wdHksXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgY3VycmVudCBlbXVsYXRvciB3aWxsIGJlIGtpbGxlZC5cbiAqIEBwYXJhbSB7P251bWJlcn0gdGltZW91dCBbNjAwMDBdIC0gVGhlIGFtb3VudCBvZiB0aW1lIHRvIHdhaXQgYmVmb3JlIHRocm93aW5nXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuIGV4Y2VwdGlvbiBhYm91dCB1bnN1Y2Nlc3NmdWwga2lsbGluZ1xuICogQHJldHVybiB7Ym9vbGVhbn0gLSBUcnVlIGlmIHRoZSBlbXVsYXRvciB3YXMga2lsbGVkLCBmYWxzZSBvdGhlcndpc2UuXG4gKiBAdGhyb3dzIHtFcnJvcn0gaWYgdGhlcmUgd2FzIGEgZmFpbHVyZSBieSBraWxsaW5nIHRoZSBlbXVsYXRvclxuICovXG5zeXN0ZW1DYWxsTWV0aG9kcy5raWxsRW11bGF0b3IgPSBhc3luYyBmdW5jdGlvbiAoYXZkTmFtZSA9IG51bGwsIHRpbWVvdXQgPSA2MDAwMCkge1xuICBpZiAodXRpbC5oYXNWYWx1ZShhdmROYW1lKSkge1xuICAgIGxvZy5kZWJ1ZyhgS2lsbGluZyBhdmQgJyR7YXZkTmFtZX0nYCk7XG4gICAgY29uc3QgZGV2aWNlID0gYXdhaXQgdGhpcy5nZXRSdW5uaW5nQVZEKGF2ZE5hbWUpO1xuICAgIGlmICghZGV2aWNlKSB7XG4gICAgICBsb2cuaW5mbyhgTm8gYXZkIHdpdGggbmFtZSAnJHthdmROYW1lfScgcnVubmluZy4gU2tpcHBpbmcga2lsbCBzdGVwLmApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBraWxsaW5nIHRoZSBjdXJyZW50IGF2ZFxuICAgIGxvZy5kZWJ1ZyhgS2lsbGluZyBhdmQgd2l0aCBpZCAnJHt0aGlzLmN1ckRldmljZUlkfSdgKTtcbiAgICBpZiAoIWF3YWl0IHRoaXMuaXNFbXVsYXRvckNvbm5lY3RlZCgpKSB7XG4gICAgICBsb2cuZGVidWcoYEVtdWxhdG9yIHdpdGggaWQgJyR7dGhpcy5jdXJEZXZpY2VJZH0nIG5vdCBjb25uZWN0ZWQuIFNraXBwaW5nIGtpbGwgc3RlcGApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBhd2FpdCB0aGlzLmFkYkV4ZWMoWydlbXUnLCAna2lsbCddKTtcbiAgbG9nLmRlYnVnKGBXYWl0aW5nIHVwIHRvICR7dGltZW91dH1tcyB1bnRpbCB0aGUgZW11bGF0b3IgJyR7YXZkTmFtZSA/IGF2ZE5hbWUgOiB0aGlzLmN1ckRldmljZUlkfScgaXMga2lsbGVkYCk7XG4gIHRyeSB7XG4gICAgYXdhaXQgd2FpdEZvckNvbmRpdGlvbihhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gdXRpbC5oYXNWYWx1ZShhdmROYW1lKVxuICAgICAgICAgID8gIWF3YWl0IHRoaXMuZ2V0UnVubmluZ0FWRChhdmROYW1lKVxuICAgICAgICAgIDogIWF3YWl0IHRoaXMuaXNFbXVsYXRvckNvbm5lY3RlZCgpO1xuICAgICAgfSBjYXRjaCAoaWduKSB7fVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sIHtcbiAgICAgIHdhaXRNczogdGltZW91dCxcbiAgICAgIGludGVydmFsTXM6IDIwMDAsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFRoZSBlbXVsYXRvciAnJHthdmROYW1lID8gYXZkTmFtZSA6IHRoaXMuY3VyRGV2aWNlSWR9JyBpcyBzdGlsbCBydW5uaW5nIGFmdGVyIGJlaW5nIGtpbGxlZCAke3RpbWVvdXR9bXMgYWdvYCk7XG4gIH1cbiAgbG9nLmluZm8oYFN1Y2Nlc3NmdWxseSBraWxsZWQgdGhlICcke2F2ZE5hbWUgPyBhdmROYW1lIDogdGhpcy5jdXJEZXZpY2VJZH0nIGVtdWxhdG9yYCk7XG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBTdGFydCBhbiBlbXVsYXRvciB3aXRoIGdpdmVuIHBhcmFtZXRlcnMgYW5kIHdhaXQgdW50aWwgaXQgaXMgZnVsbCBzdGFydGVkLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBhdmROYW1lIC0gVGhlIG5hbWUgb2YgYW4gZXhpc3RpbmcgZW11bGF0b3IuXG4gKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fHN0cmluZ30gYXZkQXJncyAtIEFkZGl0aW9uYWwgZW11bGF0b3IgY29tbWFuZCBsaW5lIGFyZ3VtZW50LlxuICogQHBhcmFtIHs/c3RyaW5nfSBsYW5ndWFnZSAtIEVtdWxhdG9yIHN5c3RlbSBsYW5ndWFnZS5cbiAqIEBwYXJhbSB7P2NvdW50cnl9IGNvdW50cnkgLSBFbXVsYXRvciBzeXN0ZW0gY291bnRyeS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBhdmRMYXVuY2hUaW1lb3V0IFs2MDAwMF0gLSBFbXVsYXRvciBzdGFydHVwIHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzLlxuICogQHBhcmFtIHtudW1iZXJ9IHJldHJ5VGltZXMgWzFdIC0gVGhlIG1heGltdW0gbnVtYmVyIG9mIHN0YXJ0dXAgcmV0cmllcy5cbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiB0aGUgZW11bGF0b3IgZmFpbHMgdG8gc3RhcnQgd2l0aGluIHRoZSBnaXZlbiB0aW1lb3V0LlxuICovXG5zeXN0ZW1DYWxsTWV0aG9kcy5sYXVuY2hBVkQgPSBhc3luYyBmdW5jdGlvbiAoYXZkTmFtZSwgYXZkQXJncywgbGFuZ3VhZ2UsIGNvdW50cnksXG4gIGF2ZExhdW5jaFRpbWVvdXQgPSA2MDAwMCwgYXZkUmVhZHlUaW1lb3V0ID0gNjAwMDAsIHJldHJ5VGltZXMgPSAxKSB7XG4gIGxvZy5kZWJ1ZyhgTGF1bmNoaW5nIEVtdWxhdG9yIHdpdGggQVZEICR7YXZkTmFtZX0sIGxhdW5jaFRpbWVvdXQgYCArXG4gICAgICAgICAgICBgJHthdmRMYXVuY2hUaW1lb3V0fW1zIGFuZCByZWFkeVRpbWVvdXQgJHthdmRSZWFkeVRpbWVvdXR9bXNgKTtcbiAgbGV0IGVtdWxhdG9yQmluYXJ5UGF0aCA9IGF3YWl0IHRoaXMuZ2V0U2RrQmluYXJ5UGF0aChcImVtdWxhdG9yXCIpO1xuICBpZiAoYXZkTmFtZVswXSA9PT0gXCJAXCIpIHtcbiAgICBhdmROYW1lID0gYXZkTmFtZS5zdWJzdHIoMSk7XG4gIH1cbiAgYXdhaXQgdGhpcy5jaGVja0F2ZEV4aXN0KGF2ZE5hbWUpO1xuICBsZXQgbGF1bmNoQXJncyA9IFtcIi1hdmRcIiwgYXZkTmFtZV07XG4gIGlmIChfLmlzU3RyaW5nKGxhbmd1YWdlKSkge1xuICAgIGxvZy5kZWJ1ZyhgU2V0dGluZyBBbmRyb2lkIERldmljZSBMYW5ndWFnZSB0byAke2xhbmd1YWdlfWApO1xuICAgIGxhdW5jaEFyZ3MucHVzaChcIi1wcm9wXCIsIGBwZXJzaXN0LnN5cy5sYW5ndWFnZT0ke2xhbmd1YWdlLnRvTG93ZXJDYXNlKCl9YCk7XG4gIH1cbiAgaWYgKF8uaXNTdHJpbmcoY291bnRyeSkpIHtcbiAgICBsb2cuZGVidWcoYFNldHRpbmcgQW5kcm9pZCBEZXZpY2UgQ291bnRyeSB0byAke2NvdW50cnl9YCk7XG4gICAgbGF1bmNoQXJncy5wdXNoKFwiLXByb3BcIiwgYHBlcnNpc3Quc3lzLmNvdW50cnk9JHtjb3VudHJ5LnRvVXBwZXJDYXNlKCl9YCk7XG4gIH1cbiAgbGV0IGxvY2FsZTtcbiAgaWYgKF8uaXNTdHJpbmcobGFuZ3VhZ2UpICYmIF8uaXNTdHJpbmcoY291bnRyeSkpIHtcbiAgICBsb2NhbGUgPSBsYW5ndWFnZS50b0xvd2VyQ2FzZSgpICsgXCItXCIgKyBjb3VudHJ5LnRvVXBwZXJDYXNlKCk7XG4gIH0gZWxzZSBpZiAoXy5pc1N0cmluZyhsYW5ndWFnZSkpIHtcbiAgICBsb2NhbGUgPSBsYW5ndWFnZS50b0xvd2VyQ2FzZSgpO1xuICB9IGVsc2UgaWYgKF8uaXNTdHJpbmcoY291bnRyeSkpIHtcbiAgICBsb2NhbGUgPSBjb3VudHJ5O1xuICB9XG4gIGlmIChfLmlzU3RyaW5nKGxvY2FsZSkpIHtcbiAgICBsb2cuZGVidWcoYFNldHRpbmcgQW5kcm9pZCBEZXZpY2UgTG9jYWxlIHRvICR7bG9jYWxlfWApO1xuICAgIGxhdW5jaEFyZ3MucHVzaChcIi1wcm9wXCIsIGBwZXJzaXN0LnN5cy5sb2NhbGU9JHtsb2NhbGV9YCk7XG4gIH1cbiAgaWYgKCFfLmlzRW1wdHkoYXZkQXJncykpIHtcbiAgICBsYXVuY2hBcmdzLnB1c2goLi4uKF8uaXNBcnJheShhdmRBcmdzKSA/IGF2ZEFyZ3MgOiBhdmRBcmdzLnNwbGl0KCcgJykpKTtcbiAgfVxuICBsb2cuZGVidWcoYFJ1bm5pbmcgJyR7ZW11bGF0b3JCaW5hcnlQYXRofScgd2l0aCBhcmdzOiAke0pTT04uc3RyaW5naWZ5KGxhdW5jaEFyZ3MpfWApO1xuICBsZXQgcHJvYyA9IG5ldyBTdWJQcm9jZXNzKGVtdWxhdG9yQmluYXJ5UGF0aCwgbGF1bmNoQXJncyk7XG4gIGF3YWl0IHByb2Muc3RhcnQoMCk7XG4gIHByb2Mub24oJ291dHB1dCcsIChzdGRvdXQsIHN0ZGVycikgPT4ge1xuICAgIGZvciAobGV0IGxpbmUgb2YgKHN0ZG91dCB8fCBzdGRlcnIgfHwgJycpLnNwbGl0KCdcXG4nKS5maWx0ZXIoQm9vbGVhbikpIHtcbiAgICAgIGxvZy5pbmZvKGBbQVZEIE9VVFBVVF0gJHtsaW5lfWApO1xuICAgIH1cbiAgfSk7XG4gIHByb2Mub24oJ2RpZScsIChjb2RlLCBzaWduYWwpID0+IHtcbiAgICBsb2cud2FybihgRW11bGF0b3IgYXZkICR7YXZkTmFtZX0gZXhpdGVkIHdpdGggY29kZSAke2NvZGV9JHtzaWduYWwgPyBgLCBzaWduYWwgJHtzaWduYWx9YCA6ICcnfWApO1xuICB9KTtcbiAgYXdhaXQgcmV0cnkocmV0cnlUaW1lcywgYXN5bmMgKCkgPT4gYXdhaXQgdGhpcy5nZXRSdW5uaW5nQVZEV2l0aFJldHJ5KGF2ZE5hbWUsIGF2ZExhdW5jaFRpbWVvdXQpKTtcbiAgYXdhaXQgdGhpcy53YWl0Rm9yRW11bGF0b3JSZWFkeShhdmRSZWFkeVRpbWVvdXQpO1xuICByZXR1cm4gcHJvYztcbn07XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gQURCVmVyc2lvblxuICogQHByb3BlcnR5IHtzdHJpbmd9IHZlcnNpb25TdHJpbmcgLSBBREIgdmVyc2lvbiBhcyBhIHN0cmluZy5cbiAqIEBwcm9wZXJ0eSB7ZmxvYXR9IHZlcnNpb25GbG9hdCAtIFZlcnNpb24gbnVtYmVyIGFzIGZsb2F0IHZhbHVlICh1c2VmdWwgZm9yIGNvbXBhcmlzb24pLlxuICogQHByb3BlcnR5IHtudW1iZXJ9IG1ham9yIC0gTWFqb3IgdmVyc2lvbiBudW1iZXIuXG4gKiBAcHJvcGVydHkge251bWJlcn0gbWlub3IgLSBNaW5vciB2ZXJzaW9uIG51bWJlci5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBwYXRjaCAtIFBhdGNoIHZlcnNpb24gbnVtYmVyLlxuICovXG5cbi8qKlxuICogR2V0IHRoZSBhZGIgdmVyc2lvbi4gVGhlIHJlc3VsdCBvZiB0aGlzIG1ldGhvZCBpcyBjYWNoZWQuXG4gKlxuICogQHJldHVybiB7QURCVmVyc2lvbn0gVGhlIGN1cnJlbnQgYWRiIHZlcnNpb24uXG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYgaXQgaXMgbm90IHBvc3NpYmxlIHRvIHBhcnNlIGFkYiB2ZXJzaW9uLlxuICovXG5zeXN0ZW1DYWxsTWV0aG9kcy5nZXRBZGJWZXJzaW9uID0gXy5tZW1vaXplKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgdHJ5IHtcbiAgICBsZXQgYWRiVmVyc2lvbiA9IChhd2FpdCB0aGlzLmFkYkV4ZWMoJ3ZlcnNpb24nKSlcbiAgICAgIC5yZXBsYWNlKC9BbmRyb2lkXFxzRGVidWdcXHNCcmlkZ2VcXHN2ZXJzaW9uXFxzKFtcXGQuXSopW1xcc1xcdy1dKi8sIFwiJDFcIik7XG4gICAgbGV0IHBhcnRzID0gYWRiVmVyc2lvbi5zcGxpdCgnLicpO1xuICAgIHJldHVybiB7XG4gICAgICB2ZXJzaW9uU3RyaW5nOiBhZGJWZXJzaW9uLFxuICAgICAgdmVyc2lvbkZsb2F0OiBwYXJzZUZsb2F0KGFkYlZlcnNpb24pLFxuICAgICAgbWFqb3I6IHBhcnNlSW50KHBhcnRzWzBdLCAxMCksXG4gICAgICBtaW5vcjogcGFyc2VJbnQocGFydHNbMV0sIDEwKSxcbiAgICAgIHBhdGNoOiBwYXJ0c1syXSA/IHBhcnNlSW50KHBhcnRzWzJdLCAxMCkgOiB1bmRlZmluZWQsXG4gICAgfTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgZ2V0dGluZyBhZGIgdmVyc2lvbi4gT3JpZ2luYWwgZXJyb3I6ICcke2UubWVzc2FnZX0nOyBgICtcbiAgICAgICAgICAgICAgICAgICAgICAgIGBTdGRlcnI6ICckeyhlLnN0ZGVyciB8fCAnJykudHJpbSgpfSc7IENvZGU6ICcke2UuY29kZX0nYCk7XG4gIH1cbn0pO1xuXG4vKipcbiAqIENoZWNrIGlmIGdpdmVuIGVtdWxhdG9yIGV4aXN0cyBpbiB0aGUgbGlzdCBvZiBhdmFpbGFibGUgYXZkcy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gYXZkTmFtZSAtIFRoZSBuYW1lIG9mIGVtdWxhdG9yIHRvIHZlcmlmeSBmb3IgZXhpc3RlbmNlLlxuICogQHRocm93cyB7RXJyb3J9IElmIHRoZSBlbXVsYXRvciB3aXRoIGdpdmVuIG5hbWUgZG9lcyBub3QgZXhpc3QuXG4gKi9cbnN5c3RlbUNhbGxNZXRob2RzLmNoZWNrQXZkRXhpc3QgPSBhc3luYyBmdW5jdGlvbiAoYXZkTmFtZSkge1xuICBsZXQgY21kLCByZXN1bHQ7XG4gIHRyeSB7XG4gICAgY21kID0gYXdhaXQgdGhpcy5nZXRTZGtCaW5hcnlQYXRoKCdlbXVsYXRvcicpO1xuICAgIHJlc3VsdCA9IGF3YWl0IGV4ZWMoY21kLCBbJy1saXN0LWF2ZHMnXSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsZXQgdW5rbm93bk9wdGlvbkVycm9yID0gbmV3IFJlZ0V4cChcInVua25vd24gb3B0aW9uOiAtbGlzdC1hdmRzXCIsIFwiaVwiKS50ZXN0KGUuc3RkZXJyKTtcbiAgICBpZiAoIXVua25vd25PcHRpb25FcnJvcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciBleGVjdXRpbmcgY2hlY2tBdmRFeGlzdC4gT3JpZ2luYWwgZXJyb3I6ICcke2UubWVzc2FnZX0nOyBgICtcbiAgICAgICAgICAgICAgICAgICAgICBgU3RkZXJyOiAnJHsoZS5zdGRlcnIgfHwgJycpLnRyaW0oKX0nOyBDb2RlOiAnJHtlLmNvZGV9J2ApO1xuXG4gICAgfVxuICAgIGNvbnN0IHNka1ZlcnNpb24gPSBhd2FpdCBnZXRTZGtUb29sc1ZlcnNpb24oKTtcbiAgICBsZXQgYmluYXJ5TmFtZSA9ICdhbmRyb2lkJztcbiAgICBpZiAoc2RrVmVyc2lvbikge1xuICAgICAgaWYgKHNka1ZlcnNpb24ubWFqb3IgPj0gMjUpIHtcbiAgICAgICAgYmluYXJ5TmFtZSA9ICdhdmRtYW5hZ2VyJztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbG9nLndhcm4oYERlZmF1bHRpbmcgYmluYXJ5IG5hbWUgdG8gJyR7YmluYXJ5TmFtZX0nLCBiZWNhdXNlIFNESyB2ZXJzaW9uIGNhbm5vdCBiZSBwYXJzZWRgKTtcbiAgICB9XG4gICAgLy8gSWYgLWxpc3QtYXZkcyBvcHRpb24gaXMgbm90IGF2YWlsYWJsZSwgdXNlIGFuZHJvaWQgY29tbWFuZCBhcyBhbiBhbHRlcm5hdGl2ZVxuICAgIGNtZCA9IGF3YWl0IHRoaXMuZ2V0U2RrQmluYXJ5UGF0aChiaW5hcnlOYW1lKTtcbiAgICByZXN1bHQgPSBhd2FpdCBleGVjKGNtZCwgWydsaXN0JywgJ2F2ZCcsICctYyddKTtcbiAgfVxuICBpZiAocmVzdWx0LnN0ZG91dC5pbmRleE9mKGF2ZE5hbWUpID09PSAtMSkge1xuICAgIGxldCBleGlzdGluZ3MgPSBgKCR7cmVzdWx0LnN0ZG91dC50cmltKCkucmVwbGFjZSgvW1xcbl0vZywgJyksICgnKX0pYDtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEF2ZCAnJHthdmROYW1lfScgaXMgbm90IGF2YWlsYWJsZS4gcGxlYXNlIHNlbGVjdCB5b3VyIGF2ZCBuYW1lIGZyb20gb25lIG9mIHRoZXNlOiAnJHtleGlzdGluZ3N9J2ApO1xuICB9XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIHRoZSBjdXJyZW50IGVtdWxhdG9yIGlzIHJlYWR5IHRvIGFjY2VwdCBmdXJ0aGVyIGNvbW1hbmRzIChib290aW5nIGNvbXBsZXRlZCkuXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHRpbWVvdXRNcyBbMjAwMDBdIC0gVGhlIG1heGltdW0gbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byB3YWl0LlxuICogQHRocm93cyB7RXJyb3J9IElmIHRoZSBlbXVsYXRvciBpcyBub3QgcmVhZHkgd2l0aGluIHRoZSBnaXZlbiB0aW1lb3V0LlxuICovXG5zeXN0ZW1DYWxsTWV0aG9kcy53YWl0Rm9yRW11bGF0b3JSZWFkeSA9IGFzeW5jIGZ1bmN0aW9uICh0aW1lb3V0TXMgPSAyMDAwMCkge1xuICB0cnkge1xuICAgIGF3YWl0IHdhaXRGb3JDb25kaXRpb24oYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKCEoYXdhaXQgdGhpcy5zaGVsbChbJ2dldHByb3AnLCAnaW5pdC5zdmMuYm9vdGFuaW0nXSkpLmluY2x1ZGVzKCdzdG9wcGVkJykpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8gU29tZXRpbWVzIHRoZSBwYWNrYWdlIG1hbmFnZXIgc2VydmljZSBtaWdodCBzdGlsbCBiZWluZyBpbml0aWFsaXplZFxuICAgICAgICAvLyBvbiBzbG93IHN5c3RlbXMgZXZlbiBhZnRlciBlbXVsYXRvciBib290aW5nIGlzIGNvbXBsZXRlZC5cbiAgICAgICAgLy8gVGhlIHVzdWFsIG91dHB1dCBvZiBgcG0gZ2V0LWluc3RhbGwtbG9jYXRpb25gIGNvbW1hbmQgbG9va3MgbGlrZSBgMFthdXRvXWBcbiAgICAgICAgcmV0dXJuIC9cXGQrXFxbXFx3K1xcXS8udGVzdChhd2FpdCB0aGlzLnNoZWxsKFsncG0nLCAnZ2V0LWluc3RhbGwtbG9jYXRpb24nXSkpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGxvZy5kZWJ1ZyhgV2FpdGluZyBmb3IgZW11bGF0b3Igc3RhcnR1cC4gSW50ZXJtZWRpYXRlIGVycm9yOiAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSwge1xuICAgICAgd2FpdE1zOiB0aW1lb3V0TXMsXG4gICAgICBpbnRlcnZhbE1zOiAzMDAwLFxuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBFbXVsYXRvciBpcyBub3QgcmVhZHkgd2l0aGluICR7dGltZW91dE1zfW1zYCk7XG4gIH1cbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIGN1cnJlbnQgZGV2aWNlIGlzIHJlYWR5IHRvIGFjY2VwdCBmdXJ0aGVyIGNvbW1hbmRzIChib290aW5nIGNvbXBsZXRlZCkuXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IGFwcERldmljZVJlYWR5VGltZW91dCBbMzBdIC0gVGhlIG1heGltdW0gbnVtYmVyIG9mIHNlY29uZHMgdG8gd2FpdC5cbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiB0aGUgZGV2aWNlIGlzIG5vdCByZWFkeSB3aXRoaW4gdGhlIGdpdmVuIHRpbWVvdXQuXG4gKi9cbnN5c3RlbUNhbGxNZXRob2RzLndhaXRGb3JEZXZpY2UgPSBhc3luYyBmdW5jdGlvbiAoYXBwRGV2aWNlUmVhZHlUaW1lb3V0ID0gMzApIHtcbiAgdGhpcy5hcHBEZXZpY2VSZWFkeVRpbWVvdXQgPSBhcHBEZXZpY2VSZWFkeVRpbWVvdXQ7XG4gIGNvbnN0IHJldHJpZXMgPSAzO1xuICBjb25zdCB0aW1lb3V0ID0gcGFyc2VJbnQodGhpcy5hcHBEZXZpY2VSZWFkeVRpbWVvdXQsIDEwKSAvIHJldHJpZXMgKiAxMDAwO1xuICBhd2FpdCByZXRyeShyZXRyaWVzLCBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuYWRiRXhlYygnd2FpdC1mb3ItZGV2aWNlJywge3RpbWVvdXR9KTtcbiAgICAgIGF3YWl0IHRoaXMucGluZygpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGF3YWl0IHRoaXMucmVzdGFydEFkYigpO1xuICAgICAgYXdhaXQgdGhpcy5nZXRDb25uZWN0ZWREZXZpY2VzKCk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIGluIHdhaXRpbmcgZm9yIGRldmljZS4gT3JpZ2luYWwgZXJyb3I6ICcke2UubWVzc2FnZX0nLiBgICtcbiAgICAgICAgICAgICAgICAgICAgICAgICBgUmV0cnlpbmcgYnkgcmVzdGFydGluZyBBREJgKTtcbiAgICB9XG4gIH0pO1xufTtcblxuLyoqXG4gKiBUcmllcyB0byBydW4gcHJpdmlsZWdlZCBzaGVsbCBjb21tYW5kcyB3aXRob3V0IHJvb3QsIG90aGVyd2lzZSBlbGV2YXRlcyBwcml2aWxlZ2VzIGFuZCBydW4gdGhlbSBhZ2FpblxuICpcbiAqIEBwYXJhbSB7YXJnc30gYXJyYXkgLSBTaGVsbCBhcmd1bWVudHMgY29tbWFuZHNcbiAqL1xuc3lzdGVtQ2FsbE1ldGhvZHMucnVuUHJpdmlsZWdlZFNoZWxsID0gYXN5bmMgZnVuY3Rpb24gKGFyZ3MpIHtcbiAgdHJ5IHtcbiAgICB0aGlzLmlzUm9vdCA9IGZhbHNlO1xuICAgIGF3YWl0IHRoaXMuc2hlbGwoYXJncyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmICghZXJyLm1lc3NhZ2UuaW5jbHVkZXMoJ211c3QgYmUgcm9vdCcpKSB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICAgIC8vIHRoaXMgZGV2aWNlIG5lZWRzIGFkYiB0byBiZSBydW5uaW5nIGFzIHJvb3QgdG8gcnVuIHRoZSBzcGVjaWZpYyBjb21tYW5kLlxuICAgIC8vIHNvIHRyeSB0byByZXN0YXJ0IHRoZSBkYWVtb25cbiAgICBsb2cuZGVidWcoYERldmljZSByZXF1aXJlcyBhZGIgdG8gYmUgcnVubmluZyBhcyByb290IGluIG9yZGVyIHRvIHJ1biBcImFkYiBzaGVsbCAke3F1b3RlKGFyZ3MpfVwiLiBSZXN0YXJ0aW5nIGRhZW1vbmApO1xuICAgIHRoaXMuaXNSb290ID0gYXdhaXQgdGhpcy5yb290KCk7XG4gICAgYXdhaXQgdGhpcy5zaGVsbChhcmdzKTtcbiAgfVxufTtcblxuLyoqXG4gKiBSZWJvb3QgdGhlIGN1cnJlbnQgZGV2aWNlIGFuZCB3YWl0IHVudGlsIGl0IGlzIGNvbXBsZXRlZC5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gcmV0cmllcyBbREVGQVVMVF9BREJfUkVCT09UX1JFVFJJRVNdIC0gVGhlIG1heGltdW0gbnVtYmVyIG9mIHJlYm9vdCByZXRyaWVzLlxuICogQHRocm93cyB7RXJyb3J9IElmIHRoZSBkZXZpY2UgZmFpbGVkIHRvIHJlYm9vdCBhbmQgbnVtYmVyIG9mIHJldHJpZXMgaXMgZXhjZWVkZWQuXG4gKi9cbnN5c3RlbUNhbGxNZXRob2RzLnJlYm9vdCA9IGFzeW5jIGZ1bmN0aW9uIChyZXRyaWVzID0gREVGQVVMVF9BREJfUkVCT09UX1JFVFJJRVMpIHtcbiAgYXdhaXQgdGhpcy5ydW5Qcml2aWxlZ2VkU2hlbGwoWydzdG9wJ10pO1xuICBhd2FpdCBCLmRlbGF5KEVNVV9TVE9QX1RJTUVPVVQpOyAvLyBsZXQgdGhlIGVtdSBmaW5pc2ggc3RvcHBpbmc7XG4gIGF3YWl0IHRoaXMuc2V0RGV2aWNlUHJvcGVydHkoJ3N5cy5ib290X2NvbXBsZXRlZCcsIDApO1xuICBhd2FpdCB0aGlzLnJ1blByaXZpbGVnZWRTaGVsbChbJ3N0YXJ0J10pO1xuICBhd2FpdCByZXRyeUludGVydmFsKHJldHJpZXMsIDEwMDAsIGFzeW5jICgpID0+IHtcbiAgICBsZXQgYm9vdGVkID0gYXdhaXQgdGhpcy5nZXREZXZpY2VQcm9wZXJ0eSgnc3lzLmJvb3RfY29tcGxldGVkJyk7XG4gICAgaWYgKGJvb3RlZCA9PT0gJzEnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIHdlIGRvbid0IHdhbnQgdGhlIHN0YWNrIHRyYWNlLCBzbyBubyBsb2cuZXJyb3JBbmRUaHJvd1xuICAgIGxldCBtc2cgPSAnV2FpdGluZyBmb3IgcmVib290LiBUaGlzIHRha2VzIHRpbWUnO1xuICAgIGxvZy5kZWJ1Zyhtc2cpO1xuICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICB9KTtcbiAgaWYgKHRoaXMuaXNSb290KSB7XG4gICAgdGhpcy5pc1Jvb3QgPSAhYXdhaXQgdGhpcy51bnJvb3QoKTtcbiAgfVxufTtcblxuLyoqXG4gKiBTd2l0Y2ggYWRiIHNlcnZlciB0byByb290IG1vZGUuXG4gKlxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBvZiB0aGUgc3dpdGNoIHdhcyBzdWNjZXNzZnVsIG9yIGZhbHNlXG4gKiAgICAgICAgICAgICAgICAgICBpZiB0aGUgc3dpdGNoIGZhaWxlZC5cbiAqL1xuc3lzdGVtQ2FsbE1ldGhvZHMucm9vdCA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgdHJ5IHtcbiAgICBsZXQge3N0ZG91dH0gPSBhd2FpdCBleGVjKHRoaXMuZXhlY3V0YWJsZS5wYXRoLCBbJ3Jvb3QnXSk7XG5cbiAgICAvLyBvbiByZWFsIGRldmljZXMgaW4gc29tZSBzaXR1YXRpb25zIHdlIGdldCBhbiBlcnJvciBpbiB0aGUgc3Rkb3V0XG4gICAgaWYgKHN0ZG91dCAmJiBzdGRvdXQuaW5kZXhPZignYWRiZCBjYW5ub3QgcnVuIGFzIHJvb3QnKSAhPT0gLTEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihzdGRvdXQudHJpbSgpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgbG9nLndhcm4oYFVuYWJsZSB0byByb290IGFkYiBkYWVtb246ICcke2Vyci5tZXNzYWdlfScuIENvbnRpbnVpbmdgKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07XG5cbi8qKlxuICogU3dpdGNoIGFkYiBzZXJ2ZXIgdG8gbm9uLXJvb3QgbW9kZS5cbiAqXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIG9mIHRoZSBzd2l0Y2ggd2FzIHN1Y2Nlc3NmdWwgb3IgZmFsc2VcbiAqICAgICAgICAgICAgICAgICAgIGlmIHRoZSBzd2l0Y2ggZmFpbGVkLlxuICovXG5zeXN0ZW1DYWxsTWV0aG9kcy51bnJvb3QgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG4gIHRyeSB7XG4gICAgbG9nLmRlYnVnKFwiUmVtb3Zpbmcgcm9vdCBwcml2aWxlZ2VzLiBSZXN0YXJ0aW5nIGFkYiBkYWVtb25cIik7XG4gICAgYXdhaXQgZXhlYyh0aGlzLmV4ZWN1dGFibGUucGF0aCwgWyd1bnJvb3QnXSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGxvZy53YXJuKGBVbmFibGUgdG8gdW5yb290IGFkYiBkYWVtb246ICcke2Vyci5tZXNzYWdlfScuIENvbnRpbnVpbmdgKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07XG5cbi8qKlxuICogVmVyaWZ5IHdoZXRoZXIgYSByZW1vdGUgcGF0aCBleGlzdHMgb24gdGhlIGRldmljZSB1bmRlciB0ZXN0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSByZW1vdGVQYXRoIC0gVGhlIHJlbW90ZSBwYXRoIHRvIHZlcmlmeS5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIGdpdmVuIHBhdGggZXhpc3RzIG9uIHRoZSBkZXZpY2UuXG4gKi9cbnN5c3RlbUNhbGxNZXRob2RzLmZpbGVFeGlzdHMgPSBhc3luYyBmdW5jdGlvbiAocmVtb3RlUGF0aCkge1xuICBsZXQgZmlsZXMgPSBhd2FpdCB0aGlzLmxzKHJlbW90ZVBhdGgpO1xuICByZXR1cm4gZmlsZXMubGVuZ3RoID4gMDtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBvdXRwdXQgb2YgX2xzXyBjb21tYW5kIG9uIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVtb3RlUGF0aCAtIFRoZSByZW1vdGUgcGF0aCAodGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZSBfbHNfIGNvbW1hbmQpLlxuICogQHBhcmFtIHtBcnJheS48U3RyaW5nPn0gb3B0cyBbW11dIC0gQWRkaXRpb25hbCBfbHNfIG9wdGlvbnMuXG4gKiBAcmV0dXJuIHtBcnJheS48U3RyaW5nPn0gVGhlIF9sc18gb3V0cHV0IGFzIGFuIGFycmF5IG9mIHNwbGl0IGxpbmVzLlxuICogICAgICAgICAgICAgICAgICAgICAgICAgIEFuIGVtcHR5IGFycmF5IGlzIHJldHVybmVkIG9mIHRoZSBnaXZlbiBfcmVtb3RlUGF0aF9cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICBkb2VzIG5vdCBleGlzdC5cbiAqL1xuc3lzdGVtQ2FsbE1ldGhvZHMubHMgPSBhc3luYyBmdW5jdGlvbiAocmVtb3RlUGF0aCwgb3B0cyA9IFtdKSB7XG4gIHRyeSB7XG4gICAgbGV0IGFyZ3MgPSBbJ2xzJywgLi4ub3B0cywgcmVtb3RlUGF0aF07XG4gICAgbGV0IHN0ZG91dCA9IGF3YWl0IHRoaXMuc2hlbGwoYXJncyk7XG4gICAgbGV0IGxpbmVzID0gc3Rkb3V0LnNwbGl0KFwiXFxuXCIpO1xuICAgIHJldHVybiBsaW5lcy5tYXAoKGwpID0+IGwudHJpbSgpKVxuICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgLmZpbHRlcigobCkgPT4gbC5pbmRleE9mKFwiTm8gc3VjaCBmaWxlXCIpID09PSAtMSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmIChlcnIubWVzc2FnZS5pbmRleE9mKCdObyBzdWNoIGZpbGUgb3IgZGlyZWN0b3J5JykgPT09IC0xKSB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICAgIHJldHVybiBbXTtcbiAgfVxufTtcblxuLyoqXG4gKiBHZXQgdGhlIHNpemUgb2YgdGhlIHBhcnRpY3VsYXIgZmlsZSBsb2NhdGVkIG9uIHRoZSBkZXZpY2UgdW5kZXIgdGVzdC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVtb3RlUGF0aCAtIFRoZSByZW1vdGUgcGF0aCB0byB0aGUgZmlsZS5cbiAqIEByZXR1cm4ge251bWJlcn0gRmlsZSBzaXplIGluIGJ5dGVzLlxuICogQHRocm93cyB7RXJyb3J9IElmIHRoZXJlIHdhcyBhbiBlcnJvciB3aGlsZSBnZXR0aW5nIHRoZSBzaXplIG9mIHRoZSBnaXZlbiBmaWxlLlxuICovXG5zeXN0ZW1DYWxsTWV0aG9kcy5maWxlU2l6ZSA9IGFzeW5jIGZ1bmN0aW9uIChyZW1vdGVQYXRoKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLmxzKHJlbW90ZVBhdGgsIFsnLWxhJ10pO1xuICAgIGlmIChmaWxlcy5sZW5ndGggIT09IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgUmVtb3RlIHBhdGggaXMgbm90IGEgZmlsZWApO1xuICAgIH1cbiAgICAvLyBodHRwczovL3JlZ2V4MTAxLmNvbS9yL2ZPczRQNC84XG4gICAgY29uc3QgbWF0Y2ggPSAvW3J3eHNTdFRcXC0rXXsxMH1bXFxzXFxkXSpcXHNbXlxcc10rXFxzK1teXFxzXStcXHMrKFxcZCspLy5leGVjKGZpbGVzWzBdKTtcbiAgICBpZiAoIW1hdGNoIHx8IF8uaXNOYU4ocGFyc2VJbnQobWF0Y2hbMV0sIDEwKSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIHBhcnNlIHNpemUgZnJvbSBsaXN0IG91dHB1dDogJyR7ZmlsZXNbMF19J2ApO1xuICAgIH1cbiAgICByZXR1cm4gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gZ2V0IGZpbGUgc2l6ZSBmb3IgJyR7cmVtb3RlUGF0aH0nOiAke2Vyci5tZXNzYWdlfWApO1xuICB9XG59O1xuXG4vKipcbiAqIEluc3RhbGxzIHRoZSBnaXZlbiBjZXJ0aWZpY2F0ZSBvbiBhIHJvb3RlZCByZWFsIGRldmljZSBvclxuICogYW4gZW11bGF0b3IuIFRoZSBlbXVsYXRvciBtdXN0IGJlIGV4ZWN1dGVkIHdpdGggYC13cml0YWJsZS1zeXN0ZW1gXG4gKiBjb21tYW5kIGxpbmUgb3B0aW9uIGFuZCBhZGIgZGFlbW9uIHNob3VsZCBiZSBydW5uaW5nIGluIHJvb3RcbiAqIG1vZGUgZm9yIHRoaXMgbWV0aG9kIHRvIHdvcmsgcHJvcGVybHkuIFRoZSBtZXRob2QgYWxzbyByZXF1aXJlc1xuICogb3BlbnNzbCB0b29sIHRvIGJlIGF2YWlsYWJsZSBvbiB0aGUgZGVzdGluYXRpb24gc3lzdGVtLlxuICogUmVhZCBodHRwczovL2dpdGh1Yi5jb20vYXBwaXVtL2FwcGl1bS9pc3N1ZXMvMTA5NjRcbiAqIGZvciBtb3JlIGRldGFpbHMgb24gdGhpcyB0b3BpY1xuICpcbiAqIEBwYXJhbSB7QnVmZmVyfHN0cmluZ30gY2VydCAtIGJhc2U2NC1kZWNvZGVkIGNvbnRlbnQgb2YgdGhlIGFjdHVhbCBjZXJ0aWZpY2F0ZVxuICogcmVwcmVzZW50ZWQgYXMgYSBzdHJpbmcgb3IgYSBidWZmZXJcbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiBvcGVuc3NsIHRvb2wgaXMgbm90IGF2YWlsYWJsZSBvbiB0aGUgZGVzdGluYXRpb24gc3lzdGVtXG4gKiBvciBpZiB0aGVyZSB3YXMgYW4gZXJyb3Igd2hpbGUgaW5zdGFsbGluZyB0aGUgY2VydGlmaWNhdGVcbiAqL1xuc3lzdGVtQ2FsbE1ldGhvZHMuaW5zdGFsbE1pdG1DZXJ0aWZpY2F0ZSA9IGFzeW5jIGZ1bmN0aW9uIChjZXJ0KSB7XG4gIGNvbnN0IG9wZW5Tc2wgPSBhd2FpdCBnZXRPcGVuU3NsRm9yT3MoKTtcblxuICBpZiAoIV8uaXNCdWZmZXIoY2VydCkpIHtcbiAgICBjZXJ0ID0gQnVmZmVyLmZyb20oY2VydCwgJ2Jhc2U2NCcpO1xuICB9XG5cbiAgY29uc3QgdG1wUm9vdCA9IGF3YWl0IHRlbXBEaXIub3BlbkRpcigpO1xuICB0cnkge1xuICAgIGNvbnN0IHNyY0NlcnQgPSBwYXRoLnJlc29sdmUodG1wUm9vdCwgJ3NvdXJjZS5jZXInKTtcbiAgICBhd2FpdCBmcy53cml0ZUZpbGUoc3JjQ2VydCwgY2VydCk7XG4gICAgbGV0IHtzdGRvdXR9ID0gYXdhaXQgZXhlYyhvcGVuU3NsLCBbJ3g1MDknLCAnLW5vb3V0JywgJy1oYXNoJywgJy1pbicsIHNyY0NlcnRdKTtcbiAgICBjb25zdCBjZXJ0SGFzaCA9IHN0ZG91dC50cmltKCk7XG4gICAgbG9nLmRlYnVnKGBHb3QgY2VydGlmaWNhdGUgaGFzaDogJHtjZXJ0SGFzaH1gKTtcbiAgICBsb2cuZGVidWcoJ1ByZXBhcmluZyBjZXJ0aWZpY2F0ZSBjb250ZW50Jyk7XG4gICAgKHtzdGRvdXR9ID0gYXdhaXQgZXhlYyhvcGVuU3NsLCBbJ3g1MDknLCAnLWluJywgc3JjQ2VydF0sIHtpc0J1ZmZlcjogdHJ1ZX0pKTtcbiAgICBsZXQgZHN0Q2VydENvbnRlbnQgPSBzdGRvdXQ7XG4gICAgKHtzdGRvdXR9ID0gYXdhaXQgZXhlYyhvcGVuU3NsLCBbJ3g1MDknLFxuICAgICAgJy1pbicsIHNyY0NlcnQsXG4gICAgICAnLXRleHQnLFxuICAgICAgJy1maW5nZXJwcmludCcsXG4gICAgICAnLW5vb3V0J10sIHtpc0J1ZmZlcjogdHJ1ZX0pKTtcbiAgICBkc3RDZXJ0Q29udGVudCA9IEJ1ZmZlci5jb25jYXQoW2RzdENlcnRDb250ZW50LCBzdGRvdXRdKTtcbiAgICBjb25zdCBkc3RDZXJ0ID0gcGF0aC5yZXNvbHZlKHRtcFJvb3QsIGAke2NlcnRIYXNofS4wYCk7XG4gICAgYXdhaXQgZnMud3JpdGVGaWxlKGRzdENlcnQsIGRzdENlcnRDb250ZW50KTtcbiAgICBsb2cuZGVidWcoJ1JlbW91bnRpbmcgL3N5c3RlbSBpbiBydyBtb2RlJyk7XG4gICAgLy8gU29tZXRpbWVzIGVtdWxhdG9yIHJlYm9vdCBpcyBzdGlsbCBub3QgZnVsbHkgZmluaXNoZWQgb24gdGhpcyBzdGFnZSwgc28gcmV0cnlcbiAgICBhd2FpdCByZXRyeUludGVydmFsKDUsIDIwMDAsIGFzeW5jICgpID0+IGF3YWl0IHRoaXMuYWRiRXhlYyhbJ3JlbW91bnQnXSkpO1xuICAgIGxvZy5kZWJ1ZyhgVXBsb2FkaW5nIHRoZSBnZW5lcmF0ZWQgY2VydGlmaWNhdGUgZnJvbSAnJHtkc3RDZXJ0fScgdG8gJyR7Q0VSVFNfUk9PVH0nYCk7XG4gICAgYXdhaXQgdGhpcy5wdXNoKGRzdENlcnQsIENFUlRTX1JPT1QpO1xuICAgIGxvZy5kZWJ1ZygnUmVtb3VudGluZyAvc3lzdGVtIHRvIGNvbmZpcm0gY2hhbmdlcycpO1xuICAgIGF3YWl0IHRoaXMuYWRiRXhlYyhbJ3JlbW91bnQnXSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGluamVjdCB0aGUgY3VzdG9tIGNlcnRpZmljYXRlLiBgICtcbiAgICAgICAgICAgICAgICAgICAgYElzIHRoZSBjZXJ0aWZpY2F0ZSBwcm9wZXJseSBlbmNvZGVkIGludG8gYmFzZTY0LXN0cmluZz8gYCArXG4gICAgICAgICAgICAgICAgICAgIGBEbyB5b3UgaGF2ZSByb290IHBlcm1pc3Npb25zIG9uIHRoZSBkZXZpY2U/IGAgK1xuICAgICAgICAgICAgICAgICAgICBgT3JpZ2luYWwgZXJyb3I6ICR7ZXJyLm1lc3NhZ2V9YCk7XG4gIH0gZmluYWxseSB7XG4gICAgYXdhaXQgZnMucmltcmFmKHRtcFJvb3QpO1xuICB9XG59O1xuXG4vKipcbiAqIFZlcmlmaWVzIGlmIHRoZSBnaXZlbiByb290IGNlcnRpZmljYXRlIGlzIGFscmVhZHkgaW5zdGFsbGVkIG9uIHRoZSBkZXZpY2UuXG4gKlxuICogQHBhcmFtIHtCdWZmZXJ8c3RyaW5nfSBjZXJ0IC0gYmFzZTY0LWRlY29kZWQgY29udGVudCBvZiB0aGUgYWN0dWFsIGNlcnRpZmljYXRlXG4gKiByZXByZXNlbnRlZCBhcyBhIHN0cmluZyBvciBhIGJ1ZmZlclxuICogQHRocm93cyB7RXJyb3J9IElmIG9wZW5zc2wgdG9vbCBpcyBub3QgYXZhaWxhYmxlIG9uIHRoZSBkZXN0aW5hdGlvbiBzeXN0ZW1cbiAqIG9yIGlmIHRoZXJlIHdhcyBhbiBlcnJvciB3aGlsZSBjaGVja2luZyB0aGUgY2VydGlmaWNhdGVcbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmIHRoZSBnaXZlbiBjZXJ0aWZpY2F0ZSBpcyBhbHJlYWR5IGluc3RhbGxlZFxuICovXG5zeXN0ZW1DYWxsTWV0aG9kcy5pc01pdG1DZXJ0aWZpY2F0ZUluc3RhbGxlZCA9IGFzeW5jIGZ1bmN0aW9uIChjZXJ0KSB7XG4gIGNvbnN0IG9wZW5Tc2wgPSBhd2FpdCBnZXRPcGVuU3NsRm9yT3MoKTtcblxuICBpZiAoIV8uaXNCdWZmZXIoY2VydCkpIHtcbiAgICBjZXJ0ID0gQnVmZmVyLmZyb20oY2VydCwgJ2Jhc2U2NCcpO1xuICB9XG5cbiAgY29uc3QgdG1wUm9vdCA9IGF3YWl0IHRlbXBEaXIub3BlbkRpcigpO1xuICBsZXQgY2VydEhhc2g7XG4gIHRyeSB7XG4gICAgY29uc3QgdG1wQ2VydCA9IHBhdGgucmVzb2x2ZSh0bXBSb290LCAnc291cmNlLmNlcicpO1xuICAgIGF3YWl0IGZzLndyaXRlRmlsZSh0bXBDZXJ0LCBjZXJ0KTtcbiAgICBjb25zdCB7c3Rkb3V0fSA9IGF3YWl0IGV4ZWMob3BlblNzbCwgWyd4NTA5JywgJy1ub291dCcsICctaGFzaCcsICctaW4nLCB0bXBDZXJ0XSk7XG4gICAgY2VydEhhc2ggPSBzdGRvdXQudHJpbSgpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCByZXRyaWV2ZSB0aGUgY2VydGlmaWNhdGUgaGFzaC4gYCArXG4gICAgICAgICAgICAgICAgICAgIGBJcyB0aGUgY2VydGlmaWNhdGUgcHJvcGVybHkgZW5jb2RlZCBpbnRvIGJhc2U2NC1zdHJpbmc/IGAgK1xuICAgICAgICAgICAgICAgICAgICBgT3JpZ2luYWwgZXJyb3I6ICR7ZXJyLm1lc3NhZ2V9YCk7XG4gIH0gZmluYWxseSB7XG4gICAgYXdhaXQgZnMucmltcmFmKHRtcFJvb3QpO1xuICB9XG4gIGNvbnN0IGRzdFBhdGggPSBwYXRoLnBvc2l4LnJlc29sdmUoQ0VSVFNfUk9PVCwgYCR7Y2VydEhhc2h9LjBgKTtcbiAgbG9nLmRlYnVnKGBDaGVja2luZyBpZiB0aGUgY2VydGlmaWNhdGUgaXMgYWxyZWFkeSBpbnN0YWxsZWQgYXQgJyR7ZHN0UGF0aH0nYCk7XG4gIHJldHVybiBhd2FpdCB0aGlzLmZpbGVFeGlzdHMoZHN0UGF0aCk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBzeXN0ZW1DYWxsTWV0aG9kcztcbmV4cG9ydCB7IERFRkFVTFRfQURCX0VYRUNfVElNRU9VVCB9O1xuIl0sImZpbGUiOiJsaWIvdG9vbHMvc3lzdGVtLWNhbGxzLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uIn0=
