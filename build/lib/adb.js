"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DEFAULT_ADB_PORT = exports.ADB = exports.default = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _lodash = _interopRequireDefault(require("lodash"));

var _os = _interopRequireDefault(require("os"));

var _path = _interopRequireDefault(require("path"));

var _index = _interopRequireDefault(require("./tools/index.js"));

var _helpers = require("./helpers");

var _systemCalls = require("./tools/system-calls");

const DEFAULT_ADB_PORT = 5037;
exports.DEFAULT_ADB_PORT = DEFAULT_ADB_PORT;

const JAR_PATH = _path.default.resolve(_helpers.rootDir, 'jars');

const DEFAULT_OPTS = {
  sdkRoot: null,
  udid: null,
  appDeviceReadyTimeout: null,
  useKeystore: null,
  keystorePath: null,
  keystorePassword: null,
  keyAlias: null,
  keyPassword: null,
  executable: {
    path: "adb",
    defaultArgs: []
  },
  tmpDir: _os.default.tmpdir(),
  curDeviceId: null,
  emulatorPort: null,
  logcat: null,
  binaries: {},
  instrumentProc: null,
  javaVersion: null,
  suppressKillServer: null,
  jars: {},
  helperJarPath: JAR_PATH,
  adbPort: DEFAULT_ADB_PORT,
  adbExecTimeout: _systemCalls.DEFAULT_ADB_EXEC_TIMEOUT
};

class ADB {
  constructor(opts = {}) {
    if (typeof opts.sdkRoot === "undefined") {
      opts.sdkRoot = process.env.ANDROID_HOME || '';
    }

    Object.assign(this, opts);

    _lodash.default.defaultsDeep(this, _lodash.default.cloneDeep(DEFAULT_OPTS));

    if (opts.remoteAdbHost) {
      this.executable.defaultArgs.push("-H", opts.remoteAdbHost);
    }

    if (opts.remoteAdbPort) {
      this.adbPort = opts.remoteAdbPort;
    }

    this.executable.defaultArgs.push("-P", this.adbPort);
    this.initJars();
  }

  initJars() {
    const tempJars = ['move_manifest.jar', 'sign.jar', 'appium_apk_tools.jar', 'unsign.jar', 'verify.jar'];

    for (var _i = 0; _i < tempJars.length; _i++) {
      const jarName = tempJars[_i];
      this.jars[jarName] = _path.default.resolve(JAR_PATH, jarName);
    }
  }

}

exports.ADB = ADB;

ADB.createADB = function () {
  var _ref = (0, _asyncToGenerator2.default)(function* (opts) {
    let adb = new ADB(opts);
    yield adb.getAdbWithCorrectAdbPath();
    return adb;
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();

var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
  for (var _iterator = _lodash.default.toPairs(_index.default)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
    let _step$value = (0, _slicedToArray2.default)(_step.value, 2),
        fnName = _step$value[0],
        fn = _step$value[1];

    ADB.prototype[fnName] = fn;
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

var _default = ADB;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hZGIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9BREJfUE9SVCIsIkpBUl9QQVRIIiwicGF0aCIsInJlc29sdmUiLCJyb290RGlyIiwiREVGQVVMVF9PUFRTIiwic2RrUm9vdCIsInVkaWQiLCJhcHBEZXZpY2VSZWFkeVRpbWVvdXQiLCJ1c2VLZXlzdG9yZSIsImtleXN0b3JlUGF0aCIsImtleXN0b3JlUGFzc3dvcmQiLCJrZXlBbGlhcyIsImtleVBhc3N3b3JkIiwiZXhlY3V0YWJsZSIsImRlZmF1bHRBcmdzIiwidG1wRGlyIiwib3MiLCJ0bXBkaXIiLCJjdXJEZXZpY2VJZCIsImVtdWxhdG9yUG9ydCIsImxvZ2NhdCIsImJpbmFyaWVzIiwiaW5zdHJ1bWVudFByb2MiLCJqYXZhVmVyc2lvbiIsInN1cHByZXNzS2lsbFNlcnZlciIsImphcnMiLCJoZWxwZXJKYXJQYXRoIiwiYWRiUG9ydCIsImFkYkV4ZWNUaW1lb3V0IiwiREVGQVVMVF9BREJfRVhFQ19USU1FT1VUIiwiQURCIiwiY29uc3RydWN0b3IiLCJvcHRzIiwicHJvY2VzcyIsImVudiIsIkFORFJPSURfSE9NRSIsIk9iamVjdCIsImFzc2lnbiIsIl8iLCJkZWZhdWx0c0RlZXAiLCJjbG9uZURlZXAiLCJyZW1vdGVBZGJIb3N0IiwicHVzaCIsInJlbW90ZUFkYlBvcnQiLCJpbml0SmFycyIsInRlbXBKYXJzIiwiamFyTmFtZSIsImNyZWF0ZUFEQiIsImFkYiIsImdldEFkYldpdGhDb3JyZWN0QWRiUGF0aCIsInRvUGFpcnMiLCJtZXRob2RzIiwiZm5OYW1lIiwiZm4iLCJwcm90b3R5cGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQSxNQUFNQSxnQkFBZ0IsR0FBRyxJQUF6Qjs7O0FBQ0EsTUFBTUMsUUFBUSxHQUFHQyxjQUFLQyxPQUFMLENBQWFDLGdCQUFiLEVBQXNCLE1BQXRCLENBQWpCOztBQUNBLE1BQU1DLFlB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QVYsQ0FBekIsOEhBQTZDO0FBQUE7QUFBQSxRQUFuQ0MsTUFBbUM7QUFBQSxRQUEzQkMsRUFBMkI7O0FBQzNDdkIsSUFBQUEsR0FBRyxDQUFDd0IsU0FBSixDQUFjRixNQUFkLElBQXdCQyxFQUF4QjtBQUNEOzs7Ozs7Ozs7Ozs7Ozs7O2VBRWN2QixHIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBvcyBmcm9tICdvcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBtZXRob2RzIGZyb20gJy4vdG9vbHMvaW5kZXguanMnO1xuaW1wb3J0IHsgcm9vdERpciB9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgeyBERUZBVUxUX0FEQl9FWEVDX1RJTUVPVVQgfSBmcm9tICcuL3Rvb2xzL3N5c3RlbS1jYWxscyc7XG5cbmNvbnN0IERFRkFVTFRfQURCX1BPUlQgPSA1MDM3O1xuY29uc3QgSkFSX1BBVEggPSBwYXRoLnJlc29sdmUocm9vdERpciwgJ2phcnMnKTtcbmNvbnN0IERFRkFVTFRfT1BUUyA9IHtcbiAgc2RrUm9vdDogbnVsbCxcbiAgdWRpZDogbnVsbCxcbiAgYXBwRGV2aWNlUmVhZHlUaW1lb3V0OiBudWxsLFxuICB1c2VLZXlzdG9yZTogbnVsbCxcbiAga2V5c3RvcmVQYXRoOiBudWxsLFxuICBrZXlzdG9yZVBhc3N3b3JkOiBudWxsLFxuICBrZXlBbGlhczogbnVsbCxcbiAga2V5UGFzc3dvcmQ6IG51bGwsXG4gIGV4ZWN1dGFibGU6IHtwYXRoOiBcImFkYlwiLCBkZWZhdWx0QXJnczogW119LFxuICB0bXBEaXI6IG9zLnRtcGRpcigpLFxuICBjdXJEZXZpY2VJZDogbnVsbCxcbiAgZW11bGF0b3JQb3J0OiBudWxsLFxuICBsb2djYXQ6IG51bGwsXG4gIGJpbmFyaWVzOiB7fSxcbiAgaW5zdHJ1bWVudFByb2M6IG51bGwsXG4gIGphdmFWZXJzaW9uOiBudWxsLFxuICBzdXBwcmVzc0tpbGxTZXJ2ZXI6IG51bGwsXG4gIGphcnM6IHt9LFxuICBoZWxwZXJKYXJQYXRoOiBKQVJfUEFUSCxcbiAgYWRiUG9ydDogREVGQVVMVF9BREJfUE9SVCxcbiAgYWRiRXhlY1RpbWVvdXQ6IERFRkFVTFRfQURCX0VYRUNfVElNRU9VVFxufTtcblxuY2xhc3MgQURCIHtcbiAgY29uc3RydWN0b3IgKG9wdHMgPSB7fSkge1xuICAgIGlmICh0eXBlb2Ygb3B0cy5zZGtSb290ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBvcHRzLnNka1Jvb3QgPSBwcm9jZXNzLmVudi5BTkRST0lEX0hPTUUgfHwgJyc7XG4gICAgfVxuXG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLCBvcHRzKTtcbiAgICBfLmRlZmF1bHRzRGVlcCh0aGlzLCBfLmNsb25lRGVlcChERUZBVUxUX09QVFMpKTtcblxuICAgIGlmIChvcHRzLnJlbW90ZUFkYkhvc3QpIHtcbiAgICAgIHRoaXMuZXhlY3V0YWJsZS5kZWZhdWx0QXJncy5wdXNoKFwiLUhcIiwgb3B0cy5yZW1vdGVBZGJIb3N0KTtcbiAgICB9XG4gICAgLy8gVE9ETyBmaWd1cmUgb3V0IHdoeSB3ZSBoYXZlIHRoaXMgb3B0aW9uIGFzIGl0IGRvZXMgbm90IGFwcGVhciB0byBiZVxuICAgIC8vIHVzZWQgYW55d2hlcmUuIFByb2JhYmx5IGRlcHJlY2F0ZSBpbiBmYXZvciBvZiBzaW1wbGUgb3B0cy5hZGJQb3J0XG4gICAgaWYgKG9wdHMucmVtb3RlQWRiUG9ydCkge1xuICAgICAgdGhpcy5hZGJQb3J0ID0gb3B0cy5yZW1vdGVBZGJQb3J0O1xuICAgIH1cbiAgICB0aGlzLmV4ZWN1dGFibGUuZGVmYXVsdEFyZ3MucHVzaChcIi1QXCIsIHRoaXMuYWRiUG9ydCk7XG5cbiAgICB0aGlzLmluaXRKYXJzKCk7XG4gIH1cblxuICBpbml0SmFycyAoKSB7XG4gICAgY29uc3QgdGVtcEphcnMgPSBbXG4gICAgICAnbW92ZV9tYW5pZmVzdC5qYXInLCAnc2lnbi5qYXInLCAnYXBwaXVtX2Fwa190b29scy5qYXInLFxuICAgICAgJ3Vuc2lnbi5qYXInLCAndmVyaWZ5LmphcicsXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IGphck5hbWUgb2YgdGVtcEphcnMpIHtcbiAgICAgIHRoaXMuamFyc1tqYXJOYW1lXSA9IHBhdGgucmVzb2x2ZShKQVJfUEFUSCwgamFyTmFtZSk7XG4gICAgfVxuICB9XG59XG5cbkFEQi5jcmVhdGVBREIgPSBhc3luYyBmdW5jdGlvbiAob3B0cykge1xuICBsZXQgYWRiID0gbmV3IEFEQihvcHRzKTtcbiAgYXdhaXQgYWRiLmdldEFkYldpdGhDb3JyZWN0QWRiUGF0aCgpO1xuICByZXR1cm4gYWRiO1xufTtcblxuLy8gYWRkIGFsbCB0aGUgbWV0aG9kcyB0byB0aGUgQURCIHByb3RvdHlwZVxuZm9yIChsZXQgW2ZuTmFtZSwgZm5dIG9mIF8udG9QYWlycyhtZXRob2RzKSkge1xuICBBREIucHJvdG90eXBlW2ZuTmFtZV0gPSBmbjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgQURCO1xuZXhwb3J0IHsgQURCLCBERUZBVUxUX0FEQl9QT1JUIH07XG4iXSwiZmlsZSI6ImxpYi9hZGIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4ifQ==
