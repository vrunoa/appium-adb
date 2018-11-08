"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _lodash = _interopRequireDefault(require("lodash"));

var _teen_process = require("teen_process");

var _path = _interopRequireDefault(require("path"));

var _logger = _interopRequireDefault(require("../logger.js"));

var _appiumSupport = require("appium-support");

var _helpers = require("../helpers.js");

const DEFAULT_PRIVATE_KEY = _path.default.resolve(_helpers.rootDir, 'keys', 'testkey.pk8');

const DEFAULT_CERTIFICATE = _path.default.resolve(_helpers.rootDir, 'keys', 'testkey.x509.pem');

const DEFAULT_CERT_DIGEST = 'a40da80a59d170caa950cf15c18c454d47a39b26989d8b640ecd745ba71bf5dc';
const BUNDLETOOL_TUTORIAL = 'https://developer.android.com/studio/command-line/bundletool';
const APKSIGNER_VERIFY_FAIL = 'DOES NOT VERIFY';
let apkSigningMethods = {};

function patchApksigner(_x) {
  return _patchApksigner.apply(this, arguments);
}

function _patchApksigner() {
  _patchApksigner = (0, _asyncToGenerator2.default)(function* (originalPath) {
    const originalContent = yield _appiumSupport.fs.readFile(originalPath, 'ascii');
    const patchedContent = originalContent.replace('-Djava.ext.dirs="%frameworkdir%"', '-cp "%frameworkdir%\\*"');

    if (patchedContent === originalContent) {
      return originalPath;
    }

    _logger.default.debug(`Patching '${originalPath}...`);

    const patchedPath = yield _appiumSupport.tempDir.path({
      prefix: 'apksigner',
      suffix: '.bat'
    });
    yield (0, _appiumSupport.mkdirp)(_path.default.dirname(patchedPath));
    yield _appiumSupport.fs.writeFile(patchedPath, patchedContent, 'ascii');
    return patchedPath;
  });
  return _patchApksigner.apply(this, arguments);
}

apkSigningMethods.executeApksigner = function () {
  var _ref = (0, _asyncToGenerator2.default)(function* (args = []) {
    const apkSigner = yield (0, _helpers.getApksignerForOs)(this);

    const originalFolder = _path.default.dirname(apkSigner);

    const getApksignerOutput = function () {
      var _ref2 = (0, _asyncToGenerator2.default)(function* (apksignerPath) {
        const _ref3 = yield (0, _teen_process.exec)(apksignerPath, args, {
          cwd: originalFolder
        }),
              stdout = _ref3.stdout,
              stderr = _ref3.stderr;

        var _arr = [['stdout', stdout], ['stderr', stderr]];

        for (var _i = 0; _i < _arr.length; _i++) {
          let _arr$_i = (0, _slicedToArray2.default)(_arr[_i], 2),
              name = _arr$_i[0],
              stream = _arr$_i[1];

          if (!stream) {
            continue;
          }

          if (name === 'stdout') {
            stream = stream.split('\n').filter(line => !line.includes('WARNING:')).join('\n');
          }

          _logger.default.debug(`apksigner ${name}: ${stream}`);
        }

        return stdout;
      });

      return function getApksignerOutput(_x2) {
        return _ref2.apply(this, arguments);
      };
    }();

    _logger.default.debug(`Starting '${apkSigner}' with args '${JSON.stringify(args)}'`);

    try {
      return yield getApksignerOutput(apkSigner);
    } catch (err) {
      _logger.default.warn(`Got an error during apksigner execution: ${err.message}`);

      var _arr2 = [['stdout', err.stdout], ['stderr', err.stderr]];

      for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
        const _arr2$_i = (0, _slicedToArray2.default)(_arr2[_i2], 2),
              name = _arr2$_i[0],
              stream = _arr2$_i[1];

        if (stream) {
          _logger.default.warn(`apksigner ${name}: ${stream}`);
        }
      }

      if (_appiumSupport.system.isWindows()) {
        const patchedApksigner = yield patchApksigner(apkSigner);

        if (patchedApksigner !== apkSigner) {
          try {
            return yield getApksignerOutput(patchedApksigner);
          } finally {
            yield _appiumSupport.fs.unlink(patchedApksigner);
          }
        }
      }

      throw err;
    }
  });

  return function () {
    return _ref.apply(this, arguments);
  };
}();

apkSigningMethods.signWithDefaultCert = function () {
  var _ref4 = (0, _asyncToGenerator2.default)(function* (apk) {
    _logger.default.debug(`Signing '${apk}' with default cert`);

    if (!(yield _appiumSupport.fs.exists(apk))) {
      throw new Error(`${apk} file doesn't exist.`);
    }

    try {
      const args = ['sign', '--key', DEFAULT_PRIVATE_KEY, '--cert', DEFAULT_CERTIFICATE, apk];
      yield this.executeApksigner(args);
    } catch (err) {
      _logger.default.warn(`Cannot use apksigner tool for signing. Defaulting to sign.jar. ` + `Original error: ${err.message}` + (err.stderr ? `; StdErr: ${err.stderr}` : ''));

      const java = (0, _helpers.getJavaForOs)();

      const signPath = _path.default.resolve(this.helperJarPath, 'sign.jar');

      _logger.default.debug("Resigning apk.");

      try {
        yield (0, _teen_process.exec)(java, ['-jar', signPath, apk, '--override']);
      } catch (e) {
        throw new Error(`Could not sign with default certificate. Original error ${e.message}`);
      }
    }
  });

  return function (_x3) {
    return _ref4.apply(this, arguments);
  };
}();

apkSigningMethods.signWithCustomCert = function () {
  var _ref5 = (0, _asyncToGenerator2.default)(function* (apk) {
    _logger.default.debug(`Signing '${apk}' with custom cert`);

    if (!(yield _appiumSupport.fs.exists(this.keystorePath))) {
      throw new Error(`Keystore: ${this.keystorePath} doesn't exist.`);
    }

    if (!(yield _appiumSupport.fs.exists(apk))) {
      throw new Error(`'${apk}' doesn't exist.`);
    }

    try {
      const args = ['sign', '--ks', this.keystorePath, '--ks-key-alias', this.keyAlias, '--ks-pass', `pass:${this.keystorePassword}`, '--key-pass', `pass:${this.keyPassword}`, apk];
      yield this.executeApksigner(args);
    } catch (err) {
      _logger.default.warn(`Cannot use apksigner tool for signing. Defaulting to jarsigner. ` + `Original error: ${err.message}`);

      try {
        _logger.default.debug("Unsigning apk.");

        yield (0, _teen_process.exec)((0, _helpers.getJavaForOs)(), ['-jar', _path.default.resolve(this.helperJarPath, 'unsign.jar'), apk]);

        _logger.default.debug("Signing apk.");

        const jarsigner = _path.default.resolve((0, _helpers.getJavaHome)(), 'bin', `jarsigner${_appiumSupport.system.isWindows() ? '.exe' : ''}`);

        yield (0, _teen_process.exec)(jarsigner, ['-sigalg', 'MD5withRSA', '-digestalg', 'SHA1', '-keystore', this.keystorePath, '-storepass', this.keystorePassword, '-keypass', this.keyPassword, apk, this.keyAlias]);
      } catch (e) {
        throw new Error(`Could not sign with custom certificate. Original error ${e.message}`);
      }
    }
  });

  return function (_x4) {
    return _ref5.apply(this, arguments);
  };
}();

apkSigningMethods.sign = function () {
  var _ref6 = (0, _asyncToGenerator2.default)(function* (appPath) {
    if (appPath.endsWith(_helpers.APKS_EXTENSION)) {
      let message = 'Signing of .apks-files is not supported. ';

      if (this.useKeystore) {
        message += 'Consider manual application bundle signing with the custom keystore ' + `like it is described at ${BUNDLETOOL_TUTORIAL}`;
      } else {
        message += `Consider manual application bundle signing with the key at '${DEFAULT_PRIVATE_KEY}' ` + `and the certificate at '${DEFAULT_CERTIFICATE}'. Read ${BUNDLETOOL_TUTORIAL} for more details.`;
      }

      _logger.default.warn(message);

      return;
    }

    let apksignerFound = true;

    try {
      yield (0, _helpers.getApksignerForOs)(this);
    } catch (err) {
      apksignerFound = false;
    }

    if (apksignerFound) {
      yield this.zipAlignApk(appPath);
    }

    if (this.useKeystore) {
      yield this.signWithCustomCert(appPath);
    } else {
      yield this.signWithDefaultCert(appPath);
    }

    if (!apksignerFound) {
      yield this.zipAlignApk(appPath);
    }
  });

  return function (_x5) {
    return _ref6.apply(this, arguments);
  };
}();

apkSigningMethods.zipAlignApk = function () {
  var _ref7 = (0, _asyncToGenerator2.default)(function* (apk) {
    yield this.initZipAlign();

    try {
      yield (0, _teen_process.exec)(this.binaries.zipalign, ['-c', '4', apk]);

      _logger.default.debug(`${apk}' is already zip-aligned. Doing nothing`);

      return false;
    } catch (e) {
      _logger.default.debug(`'${apk}' is not zip-aligned. Aligning`);
    }

    const alignedApk = yield _appiumSupport.tempDir.path({
      prefix: 'appium',
      suffix: '.tmp'
    });
    yield (0, _appiumSupport.mkdirp)(_path.default.dirname(alignedApk));

    try {
      yield (0, _teen_process.exec)(this.binaries.zipalign, ['-f', '4', apk, alignedApk]);
      yield _appiumSupport.fs.mv(alignedApk, apk, {
        mkdirp: true
      });
      return true;
    } catch (e) {
      if (yield _appiumSupport.fs.exists(alignedApk)) {
        yield _appiumSupport.fs.unlink(alignedApk);
      }

      throw new Error(`zipAlignApk failed. Original error: ${e.message}. Stdout: '${e.stdout}'; Stderr: '${e.stderr}'`);
    }
  });

  return function (_x6) {
    return _ref7.apply(this, arguments);
  };
}();

apkSigningMethods.checkApkCert = function () {
  var _ref8 = (0, _asyncToGenerator2.default)(function* (appPath, pkg) {
    _logger.default.debug(`Checking app cert for ${appPath}`);

    if (!(yield _appiumSupport.fs.exists(appPath))) {
      _logger.default.debug(`'${appPath}' does not exist`);

      return false;
    }

    if (this.useKeystore) {
      return yield this.checkCustomApkCert(appPath, pkg);
    }

    if (_path.default.extname(appPath) === _helpers.APKS_EXTENSION) {
      appPath = yield this.extractBaseApk(appPath);
    }

    try {
      yield (0, _helpers.getApksignerForOs)(this);
      const output = yield this.executeApksigner(['verify', '--print-certs', appPath]);

      if (!_lodash.default.includes(output, DEFAULT_CERT_DIGEST)) {
        _logger.default.debug(`'${appPath}' is signed with non-default certificate`);

        return false;
      }

      _logger.default.debug(`'${appPath}' is already signed.`);

      return true;
    } catch (err) {
      if (err.stderr && err.stderr.includes(APKSIGNER_VERIFY_FAIL)) {
        _logger.default.debug(`'${appPath}' is not signed with debug cert`);

        return false;
      }

      _logger.default.warn(`Cannot use apksigner tool for signature verification. ` + `Original error: ${err.message}`);
    }

    try {
      _logger.default.debug(`Defaulting to verify.jar`);

      yield (0, _teen_process.exec)((0, _helpers.getJavaForOs)(), ['-jar', _path.default.resolve(this.helperJarPath, 'verify.jar'), appPath]);

      _logger.default.debug(`'${appPath}' is already signed.`);

      return true;
    } catch (err) {
      _logger.default.debug(`'${appPath}' is not signed with debug cert${err.stderr ? `: ${err.stderr}` : ''}`);

      return false;
    }
  });

  return function (_x7, _x8) {
    return _ref8.apply(this, arguments);
  };
}();

apkSigningMethods.checkCustomApkCert = function () {
  var _ref9 = (0, _asyncToGenerator2.default)(function* (appPath, pkg) {
    _logger.default.debug(`Checking custom app cert for ${appPath}`);

    if (_path.default.extname(appPath) === _helpers.APKS_EXTENSION) {
      appPath = yield this.extractBaseApk(appPath);
    }

    let h = "a-fA-F0-9";
    let md5Str = [`.*MD5.*((?:[${h}]{2}:){15}[${h}]{2})`];
    let md5 = new RegExp(md5Str, 'mi');

    let keytool = _path.default.resolve((0, _helpers.getJavaHome)(), 'bin', `keytool${_appiumSupport.system.isWindows() ? '.exe' : ''}`);

    let keystoreHash = yield this.getKeystoreMd5(keytool, md5);
    return yield this.checkApkKeystoreMatch(keytool, md5, keystoreHash, pkg, appPath);
  });

  return function (_x9, _x10) {
    return _ref9.apply(this, arguments);
  };
}();

apkSigningMethods.getKeystoreMd5 = function () {
  var _ref10 = (0, _asyncToGenerator2.default)(function* (keytool, md5re) {
    _logger.default.debug("Printing keystore md5.");

    try {
      let _ref11 = yield (0, _teen_process.exec)(keytool, ['-v', '-list', '-alias', this.keyAlias, '-keystore', this.keystorePath, '-storepass', this.keystorePassword]),
          stdout = _ref11.stdout;

      let keystoreHash = md5re.exec(stdout);
      keystoreHash = keystoreHash ? keystoreHash[1] : null;

      _logger.default.debug(`Keystore MD5: ${keystoreHash}`);

      return keystoreHash;
    } catch (e) {
      throw new Error(`getKeystoreMd5 failed. Original error: ${e.message}`);
    }
  });

  return function (_x11, _x12) {
    return _ref10.apply(this, arguments);
  };
}();

apkSigningMethods.checkApkKeystoreMatch = function () {
  var _ref12 = (0, _asyncToGenerator2.default)(function* (keytool, md5re, keystoreHash, pkg, apk) {
    var _this = this;

    let entryHash = null;
    let rsa = /^META-INF\/.*\.[rR][sS][aA]$/;
    let foundKeystoreMatch = false;
    yield _appiumSupport.zip.readEntries(apk, function () {
      var _ref13 = (0, _asyncToGenerator2.default)(function* ({
        entry,
        extractEntryTo
      }) {
        entry = entry.fileName;

        if (!rsa.test(entry)) {
          return;
        }

        _logger.default.debug(`Entry: ${entry}`);

        let entryPath = _path.default.join(_this.tmpDir, pkg, 'cert');

        _logger.default.debug(`entryPath: ${entryPath}`);

        let entryFile = _path.default.join(entryPath, entry);

        _logger.default.debug(`entryFile: ${entryFile}`);

        yield _appiumSupport.fs.rimraf(entryPath);
        yield extractEntryTo(entryPath);

        _logger.default.debug("extracted!");

        _logger.default.debug("Printing apk md5.");

        let _ref14 = yield (0, _teen_process.exec)(keytool, ['-v', '-printcert', '-file', entryFile]),
            stdout = _ref14.stdout;

        entryHash = md5re.exec(stdout);
        entryHash = entryHash ? entryHash[1] : null;

        _logger.default.debug(`entryHash MD5: ${entryHash}`);

        _logger.default.debug(`keystore MD5: ${keystoreHash}`);

        let matchesKeystore = entryHash && entryHash === keystoreHash;

        _logger.default.debug(`Matches keystore? ${matchesKeystore}`);

        if (matchesKeystore) {
          foundKeystoreMatch = true;
          return false;
        }
      });

      return function (_x18) {
        return _ref13.apply(this, arguments);
      };
    }());
    return foundKeystoreMatch;
  });

  return function (_x13, _x14, _x15, _x16, _x17) {
    return _ref12.apply(this, arguments);
  };
}();

var _default = apkSigningMethods;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi90b29scy9hcGstc2lnbmluZy5qcyJdLCJuYW1lcyI6WyJERUZBVUxUX1BSSVZBVEVfS0VZIiwicGF0aCIsInJlc29sdmUiLCJyb290RGlyIiwiREVGQVVMVF9DRVJUSUZJQ0FURSIsIkRFRkFVTFRfQ0VSVF9ESUdFU1QiLCJCVU5ETEVUT09MX1RVVE9SSUFMIiwiQVBLU0lHTkVSX1ZFUklGWV9GQUlMIiwiYXBrU2lnbmluZ01ldGhvZHMiLCJwYXRjaEFwa3NpZ25lciIsIm9yaWdpbmFsUGF0aCIsIm9yaWdpbmFsQ29udGVudCIsImZzIiwicmVhZEZpbGUiLCJwYXRjaGVkQ29udGVudCIsInJlcGxhY2UiLCJsb2ciLCJkZWJ1ZyIsInBhdGNoZWRQYXRoIiwidGVtcERpciIsInByZWZpeCIsInN1ZmZpeCIsImRpcm5hbWUiLCJ3cml0ZUZpbGUiLCJleGVjdXRlQXBrc2lnbmVyIiwiYXJncyIsImFwa1NpZ25lciIsIm9yaWdpbmFsRm9sZGVyIiwiZ2V0QXBrc2lnbmVyT3V0cHV0IiwiYXBrc2lnbmVyUGF0aCIsImN3ZCIsInN0ZG91dCIsInN0ZGVyciIsIm5hbWUiLCJzdHJlYW0iLCJzcGxpdCIsImZpbHRlciIsImxpbmUiLCJpbmNsdWRlcyIsImpvaW4iLCJKU09OIiwic3RyaW5naWZ5IiwiZXJyIiwid2FybiIsIm1lc3NhZ2UiLCJzeXN0ZW0iLCJpc1dpbmRvd3MiLCJwYXRjaGVkQXBrc2lnbmVyIiwidW5saW5rIiwic2lnbldpdGhEZWZhdWx0Q2VydCIsImFwayIsImV4aXN0cyIsIkVycm9yIiwiamF2YSIsInNpZ25QYXRoIiwiaGVscGVySmFyUGF0aCIsImUiLCJzaWduV2l0aEN1c3RvbUNlcnQiLCJrZXlzdG9yZVBhdGgiLCJrZXlBbGlhcyIsImtleXN0b3JlUGFzc3dvcmQiLCJrZXlQYXNzd29yZCIsImphcnNpZ25lciIsInNpZ24iLCJhcHBQYXRoIiwiZW5kc1dpdGgiLCJBUEtTX0VYVEVOU0lPTiIsInVzZUtleXN0b3JlIiwiYXBrc2lnbmVyRm91bmQiLCJ6aXBBbGlnbkFwayIsImluaXRaaXBBbGlnbiIsImJpbmFyaWVzIiwiemlwYWxpZ24iLCJhbGlnbmVkQXBrIiwibXYiLCJta2RpcnAiLCJjaGVja0Fwa0NlcnQiLCJwa2ciLCJjaGVja0N1c3RvbUFwa0NlcnQiLCJleHRuYW1lIiwiZXh0cmFjdEJhc2VBcGsiLCJvdXRwdXQiLCJfIiwiaCIsIm1kNVN0ciIsIm1kNSIsIlJlZ0V4cCIsImtleXRvb2wiLCJrZXlzdG9yZUhhc2giLCJnZXRLZXlzdG9yZU1kNSIsImNoZWNrQXBrS2V5c3RvcmVNYXRjaCIsIm1kNXJlIiwiZXhlYyIsImVudHJ5SGFzaCIsInJzYSIsImZvdW5kS2V5c3RvcmVNYXRjaCIsInppcCIsInJlYWRFbnRyaWVzIiwiZW50cnkiLCJleHRyYWN0RW50cnlUbyIsImZpbGVOYW1lIiwidGVzdCIsImVudHJ5UGF0aCIsInRtcERpciIsImVudHJ5RmlsZSIsInJpbXJhZiIsIm1hdGNoZXNLZXlzdG9yZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBLE1BQU1BLG1CQUFtQixHQUFHQyxjQUFLQyxPQUFMLENBQWFDLGdCQUFiLEVBQXNCLE1BQXRCLEVBQThCLGFBQTlCLENBQTVCOztBQUNBLE1BQU1DLG1CQUFtQixHQUFHSCxjQUFLQyxPQUFMLENBQWFDLGdCQUFiLEVBQXNCLE1BQXRCLEVBQThCLGtCQUE5QixDQUE1Qjs7QUFDQSxNQUFNRSxtQkFBbUIsR0FBRyxrRUFBNUI7QUFDQSxNQUFNQyxtQkFBbUIsR0FBRyw4REFBNUI7QUFDQSxNQUFNQyxxQkFBcUIsR0FBRyxpQkFBOUI7QUFFQSxJQUFJQyxpQkFBaUIsR0FBRyxFQUF4Qjs7U0FVZUMsYzs7Ozs7b0RBQWYsV0FBK0JDLFlBQS9CLEVBQTZDO0FBQzNDLFVBQU1DLGVBQWUsU0FBU0Msa0JBQUdDLFFBQUgsQ0FBWUgsWUFBWixFQUEwQixPQUExQixDQUE5QjtBQUNBLFVBQU1JLGNBQWMsR0FBR0gs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eEM7O0FBQ0EsWUFBSWtCLGVBQWUsR0FBR2IsU0FBUyxJQUFJQSxTQUFTLEtBQUtMLFlBQWpEOztBQUNBeEUsd0JBQUlDLEtBQUosQ0FBVyxxQkFBb0J5RixlQUFnQixFQUEvQzs7QUFHQSxZQUFJQSxlQUFKLEVBQXFCO0FBQ25CWCxVQUFBQSxrQkFBa0IsR0FBRyxJQUFyQjtBQUNBLGlCQUFPLEtBQVA7QUFDRDtBQUNGLE9BOUJLOztBQUFBO0FBQUE7QUFBQTtBQUFBLFFBQU47QUErQkEsV0FBT0Esa0JBQVA7QUFDRCxHQXRDRDs7QUFBQTtBQUFBO0FBQUE7QUFBQTs7ZUF3Q2V2RixpQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBleGVjIH0gZnJvbSAndGVlbl9wcm9jZXNzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGxvZyBmcm9tICcuLi9sb2dnZXIuanMnO1xuaW1wb3J0IHsgdGVtcERpciwgc3lzdGVtLCBta2RpcnAsIGZzLCB6aXAgfSBmcm9tICdhcHBpdW0tc3VwcG9ydCc7XG5pbXBvcnQgeyBnZXRKYXZhRm9yT3MsIGdldEFwa3NpZ25lckZvck9zLCBnZXRKYXZhSG9tZSwgcm9vdERpciwgQVBLU19FWFRFTlNJT04gfSBmcm9tICcuLi9oZWxwZXJzLmpzJztcblxuY29uc3QgREVGQVVMVF9QUklWQVRFX0tFWSA9IHBhdGgucmVzb2x2ZShyb290RGlyLCAna2V5cycsICd0ZXN0a2V5LnBrOCcpO1xuY29uc3QgREVGQVVMVF9DRVJUSUZJQ0FURSA9IHBhdGgucmVzb2x2ZShyb290RGlyLCAna2V5cycsICd0ZXN0a2V5Lng1MDkucGVtJyk7XG5jb25zdCBERUZBVUxUX0NFUlRfRElHRVNUID0gJ2E0MGRhODBhNTlkMTcwY2FhOTUwY2YxNWMxOGM0NTRkNDdhMzliMjY5ODlkOGI2NDBlY2Q3NDViYTcxYmY1ZGMnO1xuY29uc3QgQlVORExFVE9PTF9UVVRPUklBTCA9ICdodHRwczovL2RldmVsb3Blci5hbmRyb2lkLmNvbS9zdHVkaW8vY29tbWFuZC1saW5lL2J1bmRsZXRvb2wnO1xuY29uc3QgQVBLU0lHTkVSX1ZFUklGWV9GQUlMID0gJ0RPRVMgTk9UIFZFUklGWSc7XG5cbmxldCBhcGtTaWduaW5nTWV0aG9kcyA9IHt9O1xuXG4vKipcbiAqIEFwcGxpZXMgdGhlIHBhdGNoLCB3aGljaCB3b3JrYXJvdW5kcyctRGphdmEuZXh0LmRpcnMgaXMgbm90IHN1cHBvcnRlZC4gVXNlIC1jbGFzc3BhdGggaW5zdGVhZC4nXG4gKiBlcnJvciBvbiBXaW5kb3dzIGJ5IGNyZWF0aW5nIGEgdGVtcG9yYXJ5IHBhdGNoZWQgY29weSBvZiB0aGUgb3JpZ2luYWwgYXBrc2lnbmVyIHNjcmlwdC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gb3JpZ2luYWxQYXRoIC0gVGhlIG9yaWdpbmFsIHBhdGggdG8gYXBrc2lnbmVyIHRvb2xcbiAqIEByZXR1cm5zIHtzdHJpbmd9IFRoZSBmdWxsIHBhdGggdG8gdGhlIHBhdGNoZWQgc2NyaXB0IG9yIHRoZSBzYW1lIHBhdGggaWYgdGhlcmUgaXNcbiAqICAgICAgICAgICAgICAgICAgIG5vIG5lZWQgdG8gcGF0Y2ggdGhlIG9yaWdpbmFsIGZpbGUuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHBhdGNoQXBrc2lnbmVyIChvcmlnaW5hbFBhdGgpIHtcbiAgY29uc3Qgb3JpZ2luYWxDb250ZW50ID0gYXdhaXQgZnMucmVhZEZpbGUob3JpZ2luYWxQYXRoLCAnYXNjaWknKTtcbiAgY29uc3QgcGF0Y2hlZENvbnRlbnQgPSBvcmlnaW5hbENvbnRlbnQucmVwbGFjZSgnLURqYXZhLmV4dC5kaXJzPVwiJWZyYW1ld29ya2RpciVcIicsXG4gICAgJy1jcCBcIiVmcmFtZXdvcmtkaXIlXFxcXCpcIicpO1xuICBpZiAocGF0Y2hlZENvbnRlbnQgPT09IG9yaWdpbmFsQ29udGVudCkge1xuICAgIHJldHVybiBvcmlnaW5hbFBhdGg7XG4gIH1cbiAgbG9nLmRlYnVnKGBQYXRjaGluZyAnJHtvcmlnaW5hbFBhdGh9Li4uYCk7XG4gIGNvbnN0IHBhdGNoZWRQYXRoID0gYXdhaXQgdGVtcERpci5wYXRoKHtwcmVmaXg6ICdhcGtzaWduZXInLCBzdWZmaXg6ICcuYmF0J30pO1xuICBhd2FpdCBta2RpcnAocGF0aC5kaXJuYW1lKHBhdGNoZWRQYXRoKSk7XG4gIGF3YWl0IGZzLndyaXRlRmlsZShwYXRjaGVkUGF0aCwgcGF0Y2hlZENvbnRlbnQsICdhc2NpaScpO1xuICByZXR1cm4gcGF0Y2hlZFBhdGg7XG59XG5cbi8qKlxuICogRXhlY3V0ZSBhcGtzaWduZXIgdXRpbGl0eSB3aXRoIGdpdmVuIGFyZ3VtZW50cy5cbiAqXG4gKiBAcGFyYW0gez9BcnJheTxTdHJpbmc+fSBhcmdzIC0gVGhlIGxpc3Qgb2YgdG9vbCBhcmd1bWVudHMuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gQ29tbWFuZCBzdGRvdXRcbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiBhcGtzaWduZXIgYmluYXJ5IGlzIG5vdCBwcmVzZW50IG9uIHRoZSBsb2NhbCBmaWxlIHN5c3RlbVxuICogICAgICAgICAgICAgICAgIG9yIHRoZSByZXR1cm4gY29kZSBpcyBub3QgZXF1YWwgdG8gemVyby5cbiAqL1xuYXBrU2lnbmluZ01ldGhvZHMuZXhlY3V0ZUFwa3NpZ25lciA9IGFzeW5jIGZ1bmN0aW9uIChhcmdzID0gW10pIHtcbiAgY29uc3QgYXBrU2lnbmVyID0gYXdhaXQgZ2V0QXBrc2lnbmVyRm9yT3ModGhpcyk7XG4gIGNvbnN0IG9yaWdpbmFsRm9sZGVyID0gcGF0aC5kaXJuYW1lKGFwa1NpZ25lcik7XG4gIGNvbnN0IGdldEFwa3NpZ25lck91dHB1dCA9IGFzeW5jIChhcGtzaWduZXJQYXRoKSA9PiB7XG4gICAgY29uc3Qge3N0ZG91dCwgc3RkZXJyfSA9IGF3YWl0IGV4ZWMoYXBrc2lnbmVyUGF0aCwgYXJncywge1xuICAgICAgY3dkOiBvcmlnaW5hbEZvbGRlcixcbiAgICB9KTtcbiAgICBmb3IgKGxldCBbbmFtZSwgc3RyZWFtXSBvZiBbWydzdGRvdXQnLCBzdGRvdXRdLCBbJ3N0ZGVycicsIHN0ZGVycl1dKSB7XG4gICAgICBpZiAoIXN0cmVhbSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKG5hbWUgPT09ICdzdGRvdXQnKSB7XG4gICAgICAgIC8vIE1ha2UgdGhlIG91dHB1dCBsZXNzIHRhbGthdGl2ZVxuICAgICAgICBzdHJlYW0gPSBzdHJlYW0uc3BsaXQoJ1xcbicpXG4gICAgICAgICAgLmZpbHRlcigobGluZSkgPT4gIWxpbmUuaW5jbHVkZXMoJ1dBUk5JTkc6JykpXG4gICAgICAgICAgLmpvaW4oJ1xcbicpO1xuICAgICAgfVxuICAgICAgbG9nLmRlYnVnKGBhcGtzaWduZXIgJHtuYW1lfTogJHtzdHJlYW19YCk7XG4gICAgfVxuICAgIHJldHVybiBzdGRvdXQ7XG4gIH07XG4gIGxvZy5kZWJ1ZyhgU3RhcnRpbmcgJyR7YXBrU2lnbmVyfScgd2l0aCBhcmdzICcke0pTT04uc3RyaW5naWZ5KGFyZ3MpfSdgKTtcbiAgdHJ5IHtcbiAgICByZXR1cm4gYXdhaXQgZ2V0QXBrc2lnbmVyT3V0cHV0KGFwa1NpZ25lcik7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGxvZy53YXJuKGBHb3QgYW4gZXJyb3IgZHVyaW5nIGFwa3NpZ25lciBleGVjdXRpb246ICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgZm9yIChjb25zdCBbbmFtZSwgc3RyZWFtXSBvZiBbWydzdGRvdXQnLCBlcnIuc3Rkb3V0XSwgWydzdGRlcnInLCBlcnIuc3RkZXJyXV0pIHtcbiAgICAgIGlmIChzdHJlYW0pIHtcbiAgICAgICAgbG9nLndhcm4oYGFwa3NpZ25lciAke25hbWV9OiAke3N0cmVhbX1gKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHN5c3RlbS5pc1dpbmRvd3MoKSkge1xuICAgICAgY29uc3QgcGF0Y2hlZEFwa3NpZ25lciA9IGF3YWl0IHBhdGNoQXBrc2lnbmVyKGFwa1NpZ25lcik7XG4gICAgICBpZiAocGF0Y2hlZEFwa3NpZ25lciAhPT0gYXBrU2lnbmVyKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIGF3YWl0IGdldEFwa3NpZ25lck91dHB1dChwYXRjaGVkQXBrc2lnbmVyKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBhd2FpdCBmcy51bmxpbmsocGF0Y2hlZEFwa3NpZ25lcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgZXJyO1xuICB9XG59O1xuXG4vKipcbiAqIChSZSlzaWduIHRoZSBnaXZlbiBhcGsgZmlsZSBvbiB0aGUgbG9jYWwgZmlsZSBzeXN0ZW0gd2l0aCB0aGUgZGVmYXVsdCBjZXJ0aWZpY2F0ZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gYXBrIC0gVGhlIGZ1bGwgcGF0aCB0byB0aGUgbG9jYWwgYXBrIGZpbGUuXG4gKiBAdGhyb3dzIHtFcnJvcn0gSWYgc2lnbmluZyBmYWlscy5cbiAqL1xuYXBrU2lnbmluZ01ldGhvZHMuc2lnbldpdGhEZWZhdWx0Q2VydCA9IGFzeW5jIGZ1bmN0aW9uIChhcGspIHtcbiAgbG9nLmRlYnVnKGBTaWduaW5nICcke2Fwa30nIHdpdGggZGVmYXVsdCBjZXJ0YCk7XG4gIGlmICghKGF3YWl0IGZzLmV4aXN0cyhhcGspKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHthcGt9IGZpbGUgZG9lc24ndCBleGlzdC5gKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgYXJncyA9IFsnc2lnbicsXG4gICAgICAnLS1rZXknLCBERUZBVUxUX1BSSVZBVEVfS0VZLFxuICAgICAgJy0tY2VydCcsIERFRkFVTFRfQ0VSVElGSUNBVEUsXG4gICAgICBhcGtdO1xuICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUFwa3NpZ25lcihhcmdzKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgbG9nLndhcm4oYENhbm5vdCB1c2UgYXBrc2lnbmVyIHRvb2wgZm9yIHNpZ25pbmcuIERlZmF1bHRpbmcgdG8gc2lnbi5qYXIuIGAgK1xuICAgICAgYE9yaWdpbmFsIGVycm9yOiAke2Vyci5tZXNzYWdlfWAgKyAoZXJyLnN0ZGVyciA/IGA7IFN0ZEVycjogJHtlcnIuc3RkZXJyfWAgOiAnJykpO1xuICAgIGNvbnN0IGphdmEgPSBnZXRKYXZhRm9yT3MoKTtcbiAgICBjb25zdCBzaWduUGF0aCA9IHBhdGgucmVzb2x2ZSh0aGlzLmhlbHBlckphclBhdGgsICdzaWduLmphcicpO1xuICAgIGxvZy5kZWJ1ZyhcIlJlc2lnbmluZyBhcGsuXCIpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBleGVjKGphdmEsIFsnLWphcicsIHNpZ25QYXRoLCBhcGssICctLW92ZXJyaWRlJ10pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IHNpZ24gd2l0aCBkZWZhdWx0IGNlcnRpZmljYXRlLiBPcmlnaW5hbCBlcnJvciAke2UubWVzc2FnZX1gKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogKFJlKXNpZ24gdGhlIGdpdmVuIGFwayBmaWxlIG9uIHRoZSBsb2NhbCBmaWxlIHN5c3RlbSB3aXRoIGEgY3VzdG9tIGNlcnRpZmljYXRlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBhcGsgLSBUaGUgZnVsbCBwYXRoIHRvIHRoZSBsb2NhbCBhcGsgZmlsZS5cbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiBzaWduaW5nIGZhaWxzLlxuICovXG5hcGtTaWduaW5nTWV0aG9kcy5zaWduV2l0aEN1c3RvbUNlcnQgPSBhc3luYyBmdW5jdGlvbiAoYXBrKSB7XG4gIGxvZy5kZWJ1ZyhgU2lnbmluZyAnJHthcGt9JyB3aXRoIGN1c3RvbSBjZXJ0YCk7XG4gIGlmICghKGF3YWl0IGZzLmV4aXN0cyh0aGlzLmtleXN0b3JlUGF0aCkpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBLZXlzdG9yZTogJHt0aGlzLmtleXN0b3JlUGF0aH0gZG9lc24ndCBleGlzdC5gKTtcbiAgfVxuICBpZiAoIShhd2FpdCBmcy5leGlzdHMoYXBrKSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCcke2Fwa30nIGRvZXNuJ3QgZXhpc3QuYCk7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGFyZ3MgPSBbJ3NpZ24nLFxuICAgICAgJy0ta3MnLCB0aGlzLmtleXN0b3JlUGF0aCxcbiAgICAgICctLWtzLWtleS1hbGlhcycsIHRoaXMua2V5QWxpYXMsXG4gICAgICAnLS1rcy1wYXNzJywgYHBhc3M6JHt0aGlzLmtleXN0b3JlUGFzc3dvcmR9YCxcbiAgICAgICctLWtleS1wYXNzJywgYHBhc3M6JHt0aGlzLmtleVBhc3N3b3JkfWAsXG4gICAgICBhcGtdO1xuICAgIGF3YWl0IHRoaXMuZXhlY3V0ZUFwa3NpZ25lcihhcmdzKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgbG9nLndhcm4oYENhbm5vdCB1c2UgYXBrc2lnbmVyIHRvb2wgZm9yIHNpZ25pbmcuIERlZmF1bHRpbmcgdG8gamFyc2lnbmVyLiBgICtcbiAgICAgIGBPcmlnaW5hbCBlcnJvcjogJHtlcnIubWVzc2FnZX1gKTtcbiAgICB0cnkge1xuICAgICAgbG9nLmRlYnVnKFwiVW5zaWduaW5nIGFway5cIik7XG4gICAgICBhd2FpdCBleGVjKGdldEphdmFGb3JPcygpLCBbJy1qYXInLCBwYXRoLnJlc29sdmUodGhpcy5oZWxwZXJKYXJQYXRoLCAndW5zaWduLmphcicpLCBhcGtdKTtcbiAgICAgIGxvZy5kZWJ1ZyhcIlNpZ25pbmcgYXBrLlwiKTtcbiAgICAgIGNvbnN0IGphcnNpZ25lciA9IHBhdGgucmVzb2x2ZShnZXRKYXZhSG9tZSgpLCAnYmluJywgYGphcnNpZ25lciR7c3lzdGVtLmlzV2luZG93cygpID8gJy5leGUnIDogJyd9YCk7XG4gICAgICBhd2FpdCBleGVjKGphcnNpZ25lciwgWyctc2lnYWxnJywgJ01ENXdpdGhSU0EnLCAnLWRpZ2VzdGFsZycsICdTSEExJyxcbiAgICAgICAgJy1rZXlzdG9yZScsIHRoaXMua2V5c3RvcmVQYXRoLCAnLXN0b3JlcGFzcycsIHRoaXMua2V5c3RvcmVQYXNzd29yZCxcbiAgICAgICAgJy1rZXlwYXNzJywgdGhpcy5rZXlQYXNzd29yZCwgYXBrLCB0aGlzLmtleUFsaWFzXSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3Qgc2lnbiB3aXRoIGN1c3RvbSBjZXJ0aWZpY2F0ZS4gT3JpZ2luYWwgZXJyb3IgJHtlLm1lc3NhZ2V9YCk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIChSZSlzaWduIHRoZSBnaXZlbiBhcGsgZmlsZSBvbiB0aGUgbG9jYWwgZmlsZSBzeXN0ZW0gd2l0aCBlaXRoZXJcbiAqIGN1c3RvbSBvciBkZWZhdWx0IGNlcnRpZmljYXRlIGJhc2VkIG9uIF90aGlzLnVzZUtleXN0b3JlXyBwcm9wZXJ0eSB2YWx1ZVxuICogYW5kIFppcC1hbGlnbnMgaXQgYWZ0ZXIgc2lnbmluZy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gYXBwUGF0aCAtIFRoZSBmdWxsIHBhdGggdG8gdGhlIGxvY2FsIC5hcGsocykgZmlsZS5cbiAqIEB0aHJvd3Mge0Vycm9yfSBJZiBzaWduaW5nIGZhaWxzLlxuICovXG5hcGtTaWduaW5nTWV0aG9kcy5zaWduID0gYXN5bmMgZnVuY3Rpb24gKGFwcFBhdGgpIHtcbiAgaWYgKGFwcFBhdGguZW5kc1dpdGgoQVBLU19FWFRFTlNJT04pKSB7XG4gICAgbGV0IG1lc3NhZ2UgPSAnU2lnbmluZyBvZiAuYXBrcy1maWxlcyBpcyBub3Qgc3VwcG9ydGVkLiAnO1xuICAgIGlmICh0aGlzLnVzZUtleXN0b3JlKSB7XG4gICAgICBtZXNzYWdlICs9ICdDb25zaWRlciBtYW51YWwgYXBwbGljYXRpb24gYnVuZGxlIHNpZ25pbmcgd2l0aCB0aGUgY3VzdG9tIGtleXN0b3JlICcgK1xuICAgICAgICBgbGlrZSBpdCBpcyBkZXNjcmliZWQgYXQgJHtCVU5ETEVUT09MX1RVVE9SSUFMfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1lc3NhZ2UgKz0gYENvbnNpZGVyIG1hbnVhbCBhcHBsaWNhdGlvbiBidW5kbGUgc2lnbmluZyB3aXRoIHRoZSBrZXkgYXQgJyR7REVGQVVMVF9QUklWQVRFX0tFWX0nIGAgK1xuICAgICAgICBgYW5kIHRoZSBjZXJ0aWZpY2F0ZSBhdCAnJHtERUZBVUxUX0NFUlRJRklDQVRFfScuIFJlYWQgJHtCVU5ETEVUT09MX1RVVE9SSUFMfSBmb3IgbW9yZSBkZXRhaWxzLmA7XG4gICAgfVxuICAgIGxvZy53YXJuKG1lc3NhZ2UpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGxldCBhcGtzaWduZXJGb3VuZCA9IHRydWU7XG4gIHRyeSB7XG4gICAgYXdhaXQgZ2V0QXBrc2lnbmVyRm9yT3ModGhpcyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGFwa3NpZ25lckZvdW5kID0gZmFsc2U7XG4gIH1cblxuICBpZiAoYXBrc2lnbmVyRm91bmQpIHtcbiAgICAvLyBpdCBpcyBuZWNlc3NhcnkgdG8gYXBwbHkgemlwYWxpZ24gb25seSBiZWZvcmUgc2lnbmluZ1xuICAgIC8vIGlmIGFwa3NpZ25lciBpcyB1c2VkIG9yIG9ubHkgYWZ0ZXIgc2lnbmluZyBpZiB3ZSBvbmx5IGhhdmVcbiAgICAvLyBzaWduLmphciB1dGlsaXR5XG4gICAgYXdhaXQgdGhpcy56aXBBbGlnbkFwayhhcHBQYXRoKTtcbiAgfVxuXG4gIGlmICh0aGlzLnVzZUtleXN0b3JlKSB7XG4gICAgYXdhaXQgdGhpcy5zaWduV2l0aEN1c3RvbUNlcnQoYXBwUGF0aCk7XG4gIH0gZWxzZSB7XG4gICAgYXdhaXQgdGhpcy5zaWduV2l0aERlZmF1bHRDZXJ0KGFwcFBhdGgpO1xuICB9XG5cbiAgaWYgKCFhcGtzaWduZXJGb3VuZCkge1xuICAgIGF3YWl0IHRoaXMuemlwQWxpZ25BcGsoYXBwUGF0aCk7XG4gIH1cbn07XG5cbi8qKlxuICogUGVyZm9ybSB6aXAtYWxpZ25pbmcgdG8gdGhlIGdpdmVuIGxvY2FsIGFwayBmaWxlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBhcGsgLSBUaGUgZnVsbCBwYXRoIHRvIHRoZSBsb2NhbCBhcGsgZmlsZS5cbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSBhcGsgaGFzIGJlZW4gc3VjY2Vzc2Z1bGx5IGFsaWduZWRcbiAqIG9yIGZhbHNlIGlmIHRoZSBhcGsgaGFzIGJlZW4gYWxyZWFkeSBhbGlnbmVkLlxuICogQHRocm93cyB7RXJyb3J9IElmIHppcC1hbGlnbiBmYWlscy5cbiAqL1xuYXBrU2lnbmluZ01ldGhvZHMuemlwQWxpZ25BcGsgPSBhc3luYyBmdW5jdGlvbiAoYXBrKSB7XG4gIGF3YWl0IHRoaXMuaW5pdFppcEFsaWduKCk7XG4gIHRyeSB7XG4gICAgYXdhaXQgZXhlYyh0aGlzLmJpbmFyaWVzLnppcGFsaWduLCBbJy1jJywgJzQnLCBhcGtdKTtcbiAgICBsb2cuZGVidWcoYCR7YXBrfScgaXMgYWxyZWFkeSB6aXAtYWxpZ25lZC4gRG9pbmcgbm90aGluZ2ApO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGxvZy5kZWJ1ZyhgJyR7YXBrfScgaXMgbm90IHppcC1hbGlnbmVkLiBBbGlnbmluZ2ApO1xuICB9XG4gIGNvbnN0IGFsaWduZWRBcGsgPSBhd2FpdCB0ZW1wRGlyLnBhdGgoe3ByZWZpeDogJ2FwcGl1bScsIHN1ZmZpeDogJy50bXAnfSk7XG4gIGF3YWl0IG1rZGlycChwYXRoLmRpcm5hbWUoYWxpZ25lZEFwaykpO1xuICB0cnkge1xuICAgIGF3YWl0IGV4ZWModGhpcy5iaW5hcmllcy56aXBhbGlnbiwgWyctZicsICc0JywgYXBrLCBhbGlnbmVkQXBrXSk7XG4gICAgYXdhaXQgZnMubXYoYWxpZ25lZEFwaywgYXBrLCB7IG1rZGlycDogdHJ1ZSB9KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChhd2FpdCBmcy5leGlzdHMoYWxpZ25lZEFwaykpIHtcbiAgICAgIGF3YWl0IGZzLnVubGluayhhbGlnbmVkQXBrKTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKGB6aXBBbGlnbkFwayBmYWlsZWQuIE9yaWdpbmFsIGVycm9yOiAke2UubWVzc2FnZX0uIFN0ZG91dDogJyR7ZS5zdGRvdXR9JzsgU3RkZXJyOiAnJHtlLnN0ZGVycn0nYCk7XG4gIH1cbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIGFwcCBpcyBhbHJlYWR5IHNpZ25lZCB3aXRoIHRoZSBkZWZhdWx0IEFwcGl1bSBjZXJ0aWZpY2F0ZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gYXBwUGF0aCAtIFRoZSBmdWxsIHBhdGggdG8gdGhlIGxvY2FsIC5hcGsocykgZmlsZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBwZ2sgLSBUaGUgbmFtZSBvZiBhcHBsaWNhdGlvbiBwYWNrYWdlLlxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiBnaXZlbiBhcHBsaWNhdGlvbiBpcyBhbHJlYWR5IHNpZ25lZC5cbiAqL1xuYXBrU2lnbmluZ01ldGhvZHMuY2hlY2tBcGtDZXJ0ID0gYXN5bmMgZnVuY3Rpb24gKGFwcFBhdGgsIHBrZykge1xuICBsb2cuZGVidWcoYENoZWNraW5nIGFwcCBjZXJ0IGZvciAke2FwcFBhdGh9YCk7XG4gIGlmICghYXdhaXQgZnMuZXhpc3RzKGFwcFBhdGgpKSB7XG4gICAgbG9nLmRlYnVnKGAnJHthcHBQYXRofScgZG9lcyBub3QgZXhpc3RgKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAodGhpcy51c2VLZXlzdG9yZSkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmNoZWNrQ3VzdG9tQXBrQ2VydChhcHBQYXRoLCBwa2cpO1xuICB9XG5cbiAgaWYgKHBhdGguZXh0bmFtZShhcHBQYXRoKSA9PT0gQVBLU19FWFRFTlNJT04pIHtcbiAgICBhcHBQYXRoID0gYXdhaXQgdGhpcy5leHRyYWN0QmFzZUFwayhhcHBQYXRoKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYXdhaXQgZ2V0QXBrc2lnbmVyRm9yT3ModGhpcyk7XG4gICAgY29uc3Qgb3V0cHV0ID0gYXdhaXQgdGhpcy5leGVjdXRlQXBrc2lnbmVyKFsndmVyaWZ5JywgJy0tcHJpbnQtY2VydHMnLCBhcHBQYXRoXSk7XG4gICAgaWYgKCFfLmluY2x1ZGVzKG91dHB1dCwgREVGQVVMVF9DRVJUX0RJR0VTVCkpIHtcbiAgICAgIGxvZy5kZWJ1ZyhgJyR7YXBwUGF0aH0nIGlzIHNpZ25lZCB3aXRoIG5vbi1kZWZhdWx0IGNlcnRpZmljYXRlYCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGxvZy5kZWJ1ZyhgJyR7YXBwUGF0aH0nIGlzIGFscmVhZHkgc2lnbmVkLmApO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICAvLyBjaGVjayBpZiB0aGVyZSBpcyBubyBzaWduYXR1cmVcbiAgICBpZiAoZXJyLnN0ZGVyciAmJiBlcnIuc3RkZXJyLmluY2x1ZGVzKEFQS1NJR05FUl9WRVJJRllfRkFJTCkpIHtcbiAgICAgIGxvZy5kZWJ1ZyhgJyR7YXBwUGF0aH0nIGlzIG5vdCBzaWduZWQgd2l0aCBkZWJ1ZyBjZXJ0YCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGxvZy53YXJuKGBDYW5ub3QgdXNlIGFwa3NpZ25lciB0b29sIGZvciBzaWduYXR1cmUgdmVyaWZpY2F0aW9uLiBgICtcbiAgICAgIGBPcmlnaW5hbCBlcnJvcjogJHtlcnIubWVzc2FnZX1gKTtcbiAgfVxuXG4gIC8vIGRlZmF1bHQgdG8gdmVyaWZ5LmphclxuICB0cnkge1xuICAgIGxvZy5kZWJ1ZyhgRGVmYXVsdGluZyB0byB2ZXJpZnkuamFyYCk7XG4gICAgYXdhaXQgZXhlYyhnZXRKYXZhRm9yT3MoKSwgWyctamFyJywgcGF0aC5yZXNvbHZlKHRoaXMuaGVscGVySmFyUGF0aCwgJ3ZlcmlmeS5qYXInKSwgYXBwUGF0aF0pO1xuICAgIGxvZy5kZWJ1ZyhgJyR7YXBwUGF0aH0nIGlzIGFscmVhZHkgc2lnbmVkLmApO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBsb2cuZGVidWcoYCcke2FwcFBhdGh9JyBpcyBub3Qgc2lnbmVkIHdpdGggZGVidWcgY2VydCR7ZXJyLnN0ZGVyciA/IGA6ICR7ZXJyLnN0ZGVycn1gIDogJyd9YCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIHRoZSBhcHAgaXMgYWxyZWFkeSBzaWduZWQgd2l0aCBhIGN1c3RvbSBjZXJ0aWZpY2F0ZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gYXBwUGF0aCAtIFRoZSBmdWxsIHBhdGggdG8gdGhlIGxvY2FsIGFwayhzKSBmaWxlLlxuICogQHBhcmFtIHtzdHJpbmd9IHBnayAtIFRoZSBuYW1lIG9mIGFwcGxpY2F0aW9uIHBhY2thZ2UuXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIGdpdmVuIGFwcGxpY2F0aW9uIGlzIGFscmVhZHkgc2lnbmVkIHdpdGggYSBjdXN0b20gY2VydGlmaWNhdGUuXG4gKi9cbmFwa1NpZ25pbmdNZXRob2RzLmNoZWNrQ3VzdG9tQXBrQ2VydCA9IGFzeW5jIGZ1bmN0aW9uIChhcHBQYXRoLCBwa2cpIHtcbiAgbG9nLmRlYnVnKGBDaGVja2luZyBjdXN0b20gYXBwIGNlcnQgZm9yICR7YXBwUGF0aH1gKTtcblxuICBpZiAocGF0aC5leHRuYW1lKGFwcFBhdGgpID09PSBBUEtTX0VYVEVOU0lPTikge1xuICAgIGFwcFBhdGggPSBhd2FpdCB0aGlzLmV4dHJhY3RCYXNlQXBrKGFwcFBhdGgpO1xuICB9XG5cbiAgbGV0IGggPSBcImEtZkEtRjAtOVwiO1xuICBsZXQgbWQ1U3RyID0gW2AuKk1ENS4qKCg/Olske2h9XXsyfTopezE1fVske2h9XXsyfSlgXTtcbiAgbGV0IG1kNSA9IG5ldyBSZWdFeHAobWQ1U3RyLCAnbWknKTtcbiAgbGV0IGtleXRvb2wgPSBwYXRoLnJlc29sdmUoZ2V0SmF2YUhvbWUoKSwgJ2JpbicsIGBrZXl0b29sJHtzeXN0ZW0uaXNXaW5kb3dzKCkgPyAnLmV4ZScgOiAnJ31gKTtcbiAgbGV0IGtleXN0b3JlSGFzaCA9IGF3YWl0IHRoaXMuZ2V0S2V5c3RvcmVNZDUoa2V5dG9vbCwgbWQ1KTtcbiAgcmV0dXJuIGF3YWl0IHRoaXMuY2hlY2tBcGtLZXlzdG9yZU1hdGNoKGtleXRvb2wsIG1kNSwga2V5c3RvcmVIYXNoLCBwa2csIGFwcFBhdGgpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIE1ENSBoYXNoIG9mIHRoZSBrZXlzdG9yZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5dG9vbCAtIFRoZSBuYW1lIG9mIHRoZSBrZXl0b29sIHV0aWxpdHkuXG4gKiBAcGFyYW0ge1JlZ0V4cH0gbWQ1cmUgLSBUaGUgcGF0dGVybiB1c2VkIHRvIG1hdGNoIHRoZSByZXN1bHQgaW4gX2tleXRvb2xfIG91dHB1dC5cbiAqIEByZXR1cm4gez9zdHJpbmd9IEtleXN0b3JlIE1ENSBoYXNoIG9yIF9udWxsXyBpZiB0aGUgaGFzaCBjYW5ub3QgYmUgcGFyc2VkLlxuICogQHRocm93cyB7RXJyb3J9IElmIGdldHRpbmcga2V5c3RvcmUgTUQ1IGhhc2ggZmFpbHMuXG4gKi9cbmFwa1NpZ25pbmdNZXRob2RzLmdldEtleXN0b3JlTWQ1ID0gYXN5bmMgZnVuY3Rpb24gKGtleXRvb2wsIG1kNXJlKSB7XG4gIGxvZy5kZWJ1ZyhcIlByaW50aW5nIGtleXN0b3JlIG1kNS5cIik7XG4gIHRyeSB7XG4gICAgbGV0IHtzdGRvdXR9ID0gYXdhaXQgZXhlYyhrZXl0b29sLCBbJy12JywgJy1saXN0JyxcbiAgICAgICctYWxpYXMnLCB0aGlzLmtleUFsaWFzLFxuICAgICAgJy1rZXlzdG9yZScsIHRoaXMua2V5c3RvcmVQYXRoLFxuICAgICAgJy1zdG9yZXBhc3MnLCB0aGlzLmtleXN0b3JlUGFzc3dvcmRdKTtcbiAgICBsZXQga2V5c3RvcmVIYXNoID0gbWQ1cmUuZXhlYyhzdGRvdXQpO1xuICAgIGtleXN0b3JlSGFzaCA9IGtleXN0b3JlSGFzaCA/IGtleXN0b3JlSGFzaFsxXSA6IG51bGw7XG4gICAgbG9nLmRlYnVnKGBLZXlzdG9yZSBNRDU6ICR7a2V5c3RvcmVIYXNofWApO1xuICAgIHJldHVybiBrZXlzdG9yZUhhc2g7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGdldEtleXN0b3JlTWQ1IGZhaWxlZC4gT3JpZ2luYWwgZXJyb3I6ICR7ZS5tZXNzYWdlfWApO1xuICB9XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIHRoZSBNRDUgaGFzaCBvZiB0aGUgcGFydGljdWxhciBhcHBsaWNhdGlvbiBtYXRjaGVzIHRvIHRoZSBnaXZlbiBoYXNoLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXl0b29sIC0gVGhlIG5hbWUgb2YgdGhlIGtleXRvb2wgdXRpbGl0eS5cbiAqIEBwYXJhbSB7UmVnRXhwfSBtZDVyZSAtIFRoZSBwYXR0ZXJuIHVzZWQgdG8gbWF0Y2ggdGhlIHJlc3VsdCBpbiBfa2V5dG9vbF8gb3V0cHV0LlxuICogQHBhcmFtIHtzdHJpbmd9IGtleXN0b3JlSGFzaCAtIFRoZSBleHBlY3RlZCBoYXNoIHZhbHVlLlxuICogQHBhcmFtIHtzdHJpbmd9IHBrZyAtIFRoZSBuYW1lIG9mIHRoZSBpbnN0YWxsZWQgcGFja2FnZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBhcGsgLSBUaGUgZnVsbCBwYXRoIHRvIHRoZSBleGlzdGluZyBhcGsgZmlsZS5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgYm90aCBoYXNoZXMgYXJlIGVxdWFsLlxuICogQHRocm93cyB7RXJyb3J9IElmIGdldHRpbmcga2V5c3RvcmUgTUQ1IGhhc2ggZmFpbHMuXG4gKi9cbmFwa1NpZ25pbmdNZXRob2RzLmNoZWNrQXBrS2V5c3RvcmVNYXRjaCA9IGFzeW5jIGZ1bmN0aW9uIChrZXl0b29sLCBtZDVyZSwga2V5c3RvcmVIYXNoLCBwa2csIGFwaykge1xuICBsZXQgZW50cnlIYXNoID0gbnVsbDtcbiAgbGV0IHJzYSA9IC9eTUVUQS1JTkZcXC8uKlxcLltyUl1bc1NdW2FBXSQvO1xuICBsZXQgZm91bmRLZXlzdG9yZU1hdGNoID0gZmFsc2U7XG5cbiAgLy9mb3IgKGxldCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gIGF3YWl0IHppcC5yZWFkRW50cmllcyhhcGssIGFzeW5jICh7ZW50cnksIGV4dHJhY3RFbnRyeVRvfSkgPT4ge1xuICAgIGVudHJ5ID0gZW50cnkuZmlsZU5hbWU7XG4gICAgaWYgKCFyc2EudGVzdChlbnRyeSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbG9nLmRlYnVnKGBFbnRyeTogJHtlbnRyeX1gKTtcbiAgICBsZXQgZW50cnlQYXRoID0gcGF0aC5qb2luKHRoaXMudG1wRGlyLCBwa2csICdjZXJ0Jyk7XG4gICAgbG9nLmRlYnVnKGBlbnRyeVBhdGg6ICR7ZW50cnlQYXRofWApO1xuICAgIGxldCBlbnRyeUZpbGUgPSBwYXRoLmpvaW4oZW50cnlQYXRoLCBlbnRyeSk7XG4gICAgbG9nLmRlYnVnKGBlbnRyeUZpbGU6ICR7ZW50cnlGaWxlfWApO1xuICAgIC8vIGVuc3VyZSAvdG1wL3BrZy9jZXJ0LyBkb2Vzbid0IGV4aXN0IG9yIGV4dHJhY3Qgd2lsbCBmYWlsLlxuICAgIGF3YWl0IGZzLnJpbXJhZihlbnRyeVBhdGgpO1xuICAgIC8vIE1FVEEtSU5GL0NFUlQuUlNBXG4gICAgYXdhaXQgZXh0cmFjdEVudHJ5VG8oZW50cnlQYXRoKTtcbiAgICBsb2cuZGVidWcoXCJleHRyYWN0ZWQhXCIpO1xuICAgIC8vIGNoZWNrIGZvciBtYXRjaFxuICAgIGxvZy5kZWJ1ZyhcIlByaW50aW5nIGFwayBtZDUuXCIpO1xuICAgIGxldCB7c3Rkb3V0fSA9IGF3YWl0IGV4ZWMoa2V5dG9vbCwgWyctdicsICctcHJpbnRjZXJ0JywgJy1maWxlJywgZW50cnlGaWxlXSk7XG4gICAgZW50cnlIYXNoID0gbWQ1cmUuZXhlYyhzdGRvdXQpO1xuICAgIGVudHJ5SGFzaCA9IGVudHJ5SGFzaCA/IGVudHJ5SGFzaFsxXSA6IG51bGw7XG4gICAgbG9nLmRlYnVnKGBlbnRyeUhhc2ggTUQ1OiAke2VudHJ5SGFzaH1gKTtcbiAgICBsb2cuZGVidWcoYGtleXN0b3JlIE1ENTogJHtrZXlzdG9yZUhhc2h9YCk7XG4gICAgbGV0IG1hdGNoZXNLZXlzdG9yZSA9IGVudHJ5SGFzaCAmJiBlbnRyeUhhc2ggPT09IGtleXN0b3JlSGFzaDtcbiAgICBsb2cuZGVidWcoYE1hdGNoZXMga2V5c3RvcmU/ICR7bWF0Y2hlc0tleXN0b3JlfWApO1xuXG4gICAgLy8gSWYgd2UgaGF2ZSBhIGtleXN0b3JlIG1hdGNoLCBzdG9wIGl0ZXJhdGluZ1xuICAgIGlmIChtYXRjaGVzS2V5c3RvcmUpIHtcbiAgICAgIGZvdW5kS2V5c3RvcmVNYXRjaCA9IHRydWU7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIGZvdW5kS2V5c3RvcmVNYXRjaDtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGFwa1NpZ25pbmdNZXRob2RzO1xuIl0sImZpbGUiOiJsaWIvdG9vbHMvYXBrLXNpZ25pbmcuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==
