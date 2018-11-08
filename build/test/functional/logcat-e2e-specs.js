"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _chai = _interopRequireDefault(require("chai"));

var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));

var _adb = _interopRequireDefault(require("../../lib/adb"));

var _logcat = _interopRequireDefault(require("../../lib/logcat"));

var _setup = require("./setup");

_chai.default.use(_chaiAsPromised.default);

_chai.default.should();

describe('logcat', function () {
  this.timeout(_setup.MOCHA_TIMEOUT);

  function runClearDeviceLogTest(_x, _x2) {
    return _runClearDeviceLogTest.apply(this, arguments);
  }

  function _runClearDeviceLogTest() {
    _runClearDeviceLogTest = (0, _asyncToGenerator2.default)(function* (adb, logcat, clear = true) {
      let logs = yield adb.adbExec(['logcat', '-d']);
      yield logcat.startCapture();
      yield logcat.stopCapture();
      let newLogs = yield adb.adbExec(['logcat', '-d']);

      if (clear) {
        newLogs.should.not.include(logs);
      } else {
        newLogs.should.include(logs);
      }
    });
    return _runClearDeviceLogTest.apply(this, arguments);
  }

  let adb;
  let logcat;
  before((0, _asyncToGenerator2.default)(function* () {
    adb = yield _adb.default.createADB();
  }));
  afterEach((0, _asyncToGenerator2.default)(function* () {
    if (logcat) {
      yield logcat.stopCapture();
    }
  }));
  describe('clearDeviceLogsOnStart = false', function () {
    before(function () {
      logcat = new _logcat.default({
        adb: adb.executable,
        debug: false,
        debugTrace: false
      });
    });
    it('getLogs should return logs', (0, _asyncToGenerator2.default)(function* () {
      yield logcat.startCapture();
      let logs = logcat.getLogs();
      logs.should.have.length.above(0);
    }));
    it('getAllLogs should return all logs', (0, _asyncToGenerator2.default)(function* () {
      yield logcat.startCapture();
      let logs = logcat.getAllLogs();
      logs.should.have.length.above(0);
    }));
    it('should not affect device logs', (0, _asyncToGenerator2.default)(function* () {
      yield runClearDeviceLogTest(adb, logcat, false);
    }));
  });
  describe('clearDeviceLogsOnStart = true', function () {
    before(function () {
      logcat = new _logcat.default({
        adb: adb.executable,
        debug: false,
        debugTrace: false,
        clearDeviceLogsOnStart: true
      });
    });
    it('should clear the logs before starting capture', (0, _asyncToGenerator2.default)(function* () {
      yield runClearDeviceLogTest(adb, logcat, true);
    }));
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvZnVuY3Rpb25hbC9sb2djYXQtZTJlLXNwZWNzLmpzIl0sIm5hbWVzIjpbImNoYWkiLCJ1c2UiLCJjaGFpQXNQcm9taXNlZCIsInNob3VsZCIsImRlc2NyaWJlIiwidGltZW91dCIsIk1PQ0hBX1RJTUVPVVQiLCJydW5DbGVhckRldmljZUxvZ1Rlc3QiLCJhZGIiLCJsb2djYXQiLCJjbGVhciIsImxvZ3MiLCJhZGJFeGVjIiwic3RhcnRDYXB0dXJlIiwic3RvcENhcHR1cmUiLCJuZXdMb2dzIiwibm90IiwiaW5jbHVkZSIsImJlZm9yZSIsIkFEQiIsImNyZWF0ZUFEQiIsImFmdGVyRWFjaCIsIkxvZ2NhdCIsImV4ZWN1dGFibGUiLCJkZWJ1ZyIsImRlYnVnVHJhY2UiLCJpdCIsImdldExvZ3MiLCJoYXZlIiwibGVuZ3RoIiwiYWJvdmUiLCJnZXRBbGxMb2dzIiwiY2xlYXJEZXZpY2VMb2dzT25TdGFydCJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBR0FBLGNBQUtDLEdBQUwsQ0FBU0MsdUJBQVQ7O0FBQ0FGLGNBQUtHLE1BQUw7O0FBRUFDLFFBQVEsQ0FBQyxRQUFELEVBQVcsWUFBWTtBQUM3QixPQUFLQyxPQUFMLENBQWFDLG9CQUFiOztBQUQ2QixXQUdkQyxxQkFIYztBQUFBO0FBQUE7O0FBQUE7QUFBQSw2REFHN0IsV0FBc0NDLEdBQXRDLEVBQTJDQyxNQUEzQyxFQUFtREMsS0FBSyxHQUFHLElBQTNELEVBQWlFO0FBQy9ELFVBQUlDLElBQUksU0FBU0gsR0FBRyxDQUFDSSxPQUFKLENBQVksQ0FBQyxRQUFELEVBQVcsSUFBWCxDQUFaLENBQWpCO0FBQ0EsWUFBTUgsTUFBTSxDQUFDSSxZQUFQLEVBQU47QUFDQSxZQUFNSixNQUFNLENBQUNLLFdBQVAsRUFBTjtBQUNBLFVBQUlDLE9BQU8sU0FBU1AsR0FBRyxDQUFDSSxPQUFKLENBQVksQ0FBQyxRQUFELEVBQVcsSUFBWCxDQUFaLENBQXBCOztBQUNBLFVBQUlGLEtBQUosRUFBVztBQUNUSyxRQUFBQSxPQUFPLENBQUNaLE1BQVIsQ0FBZWEsR0FBZixDQUFtQkMsT0FBbkIsQ0FBMkJOLElBQTNCO0FBQ0QsT0FGRCxNQUVPO0FBQ0xJLFFBQUFBLE9BQU8sQ0FBQ1osTUFBUixDQUFlYyxPQUFmLENBQXVCTixJQUF2QjtBQUNEO0FBQ0YsS0FiNEI7QUFBQTtBQUFBOztBQWU3QixNQUFJSCxHQUFKO0FBQ0EsTUFBSUMsTUFBSjtBQUNBUyxFQUFBQSxNQUFNLGlDQUFDLGFBQWtCO0FBQ3ZCVixJQUFBQSxHQUFHLFNBQVNXLGFBQUlDLFNBQUosRUFBWjtBQUNELEdBRkssRUFBTjtBQUdBQyxFQUFBQSxTQUFTLGlDQUFDLGFBQWtCO0FBQzFCLFFBQUlaLE1BQUosRUFBWTtBQUNWLFlBQU1BLE1BQU0sQ0FBQ0ssV0FBUCxFQUFOO0FBQ0Q7QUFDRixHQUpRLEVBQVQ7QUFLQVYsRUFBQUEsUUFBUSxDQUFDLGdDQUFELEVBQW1DLFlBQVk7QUFDckRjLElBQUFBLE1BQU0sQ0FBQyxZQUFZO0FBQ2pCVCxNQUFBQSxNQUFNLEdBQUcsSUFBSWEsZUFBSixDQUFXO0FBQ2xCZCxRQUFBQSxHQUFHLEVBQUVBLEdBQUcsQ0FBQ2UsVUFEUztBQUVsQkMsUUFBQUEsS0FBSyxFQUFFLEtBRlc7QUFHbEJDLFFBQUFBLFVBQVUsRUFBRTtBQUhNLE9BQVgsQ0FBVDtBQUtELEtBTkssQ0FBTjtBQU9BQyxJQUFBQSxFQUFFLENBQUMsNEJBQUQsa0NBQStCLGFBQWtCO0FBQ2pELFlBQU1qQixNQUFNLENBQUNJLFlBQVAsRUFBTjtBQUNBLFVBQUlGLElBQUksR0FBR0YsTUFBTSxDQUFDa0IsT0FBUCxFQUFYO0FBQ0FoQixNQUFBQSxJQUFJLENBQUNSLE1BQUwsQ0FBWXlCLElBQVosQ0FBaUJDLE1BQWpCLENBQXdCQyxLQUF4QixDQUE4QixDQUE5QjtBQUNELEtBSkMsRUFBRjtBQUtBSixJQUFBQSxFQUFFLENBQUMsbUNBQUQsa0NBQXNDLGFBQWtCO0FBQ3hELFlBQU1qQixNQUFNLENBQUNJLFlBQVAsRUFBTjtBQUNBLFVBQUlGLElBQUksR0FBR0YsTUFBTSxDQUFDc0IsVUFBUCxFQUFYO0FBQ0FwQixNQUFBQSxJQUFJLENBQUNSLE1BQUwsQ0FBWXlCLElBQVosQ0FBaUJDLE1BQWpCLENBQXdCQyxLQUF4QixDQUE4QixDQUE5QjtBQUNELEtBSkMsRUFBRjtBQUtBSixJQUFBQSxFQUFFLENBQUMsK0JBQUQsa0NBQWtDLGFBQWtCO0FBQ3BELFlBQU1uQixxQkFBcUIsQ0FBQ0MsR0FBRCxFQUFNQyxNQUFOLEVBQWMsS0FBZCxDQUEzQjtBQUNELEtBRkMsRUFBRjtBQUdELEdBckJPLENBQVI7QUFzQkFMLEVBQUFBLFFBQVEsQ0FBQywrQkFBRCxFQUFrQyxZQUFZO0FBQ3BEYyxJQUFBQSxNQUFNLENBQUMsWUFBWTtBQUNqQlQsTUFBQUEsTUFBTSxHQUFHLElBQUlhLGVBQUosQ0FBVztBQUNsQmQsUUFBQUEsR0FBRyxFQUFFQSxHQUFHLENBQUNlLFVBRFM7QUFFbEJDLFFBQUFBLEtBQUssRUFBRSxLQUZXO0FBR2xCQyxRQUFBQSxVQUFVLEVBQUUsS0FITTtBQUlsQk8sUUFBQUEsc0JBQXNCLEVBQUU7QUFKTixPQUFYLENBQVQ7QUFNRCxLQVBLLENBQU47QUFRQU4sSUFBQUEsRUFBRSxDQUFDLCtDQUFELGtDQUFrRCxhQUFrQjtBQUNwRSxZQUFNbkIscUJBQXFCLENBQUNDLEdBQUQsRUFBTUMsTUFBTixFQUFjLElBQWQsQ0FBM0I7QUFDRCxLQUZDLEVBQUY7QUFHRCxHQVpPLENBQVI7QUFhRCxDQTVETyxDQUFSIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5pbXBvcnQgY2hhaUFzUHJvbWlzZWQgZnJvbSAnY2hhaS1hcy1wcm9taXNlZCc7XG5pbXBvcnQgQURCIGZyb20gJy4uLy4uL2xpYi9hZGInO1xuaW1wb3J0IExvZ2NhdCBmcm9tICcuLi8uLi9saWIvbG9nY2F0JztcbmltcG9ydCB7IE1PQ0hBX1RJTUVPVVQgfSBmcm9tICcuL3NldHVwJztcblxuXG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5jaGFpLnNob3VsZCgpO1xuXG5kZXNjcmliZSgnbG9nY2F0JywgZnVuY3Rpb24gKCkge1xuICB0aGlzLnRpbWVvdXQoTU9DSEFfVElNRU9VVCk7XG5cbiAgYXN5bmMgZnVuY3Rpb24gcnVuQ2xlYXJEZXZpY2VMb2dUZXN0IChhZGIsIGxvZ2NhdCwgY2xlYXIgPSB0cnVlKSB7XG4gICAgbGV0IGxvZ3MgPSBhd2FpdCBhZGIuYWRiRXhlYyhbJ2xvZ2NhdCcsICctZCddKTtcbiAgICBhd2FpdCBsb2djYXQuc3RhcnRDYXB0dXJlKCk7XG4gICAgYXdhaXQgbG9nY2F0LnN0b3BDYXB0dXJlKCk7XG4gICAgbGV0IG5ld0xvZ3MgPSBhd2FpdCBhZGIuYWRiRXhlYyhbJ2xvZ2NhdCcsICctZCddKTtcbiAgICBpZiAoY2xlYXIpIHtcbiAgICAgIG5ld0xvZ3Muc2hvdWxkLm5vdC5pbmNsdWRlKGxvZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdMb2dzLnNob3VsZC5pbmNsdWRlKGxvZ3MpO1xuICAgIH1cbiAgfVxuXG4gIGxldCBhZGI7XG4gIGxldCBsb2djYXQ7XG4gIGJlZm9yZShhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgYWRiID0gYXdhaXQgQURCLmNyZWF0ZUFEQigpO1xuICB9KTtcbiAgYWZ0ZXJFYWNoKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAobG9nY2F0KSB7XG4gICAgICBhd2FpdCBsb2djYXQuc3RvcENhcHR1cmUoKTtcbiAgICB9XG4gIH0pO1xuICBkZXNjcmliZSgnY2xlYXJEZXZpY2VMb2dzT25TdGFydCA9IGZhbHNlJywgZnVuY3Rpb24gKCkge1xuICAgIGJlZm9yZShmdW5jdGlvbiAoKSB7XG4gICAgICBsb2djYXQgPSBuZXcgTG9nY2F0KHtcbiAgICAgICAgYWRiOiBhZGIuZXhlY3V0YWJsZSxcbiAgICAgICAgZGVidWc6IGZhbHNlLFxuICAgICAgICBkZWJ1Z1RyYWNlOiBmYWxzZSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGl0KCdnZXRMb2dzIHNob3VsZCByZXR1cm4gbG9ncycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGF3YWl0IGxvZ2NhdC5zdGFydENhcHR1cmUoKTtcbiAgICAgIGxldCBsb2dzID0gbG9nY2F0LmdldExvZ3MoKTtcbiAgICAgIGxvZ3Muc2hvdWxkLmhhdmUubGVuZ3RoLmFib3ZlKDApO1xuICAgIH0pO1xuICAgIGl0KCdnZXRBbGxMb2dzIHNob3VsZCByZXR1cm4gYWxsIGxvZ3MnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBhd2FpdCBsb2djYXQuc3RhcnRDYXB0dXJlKCk7XG4gICAgICBsZXQgbG9ncyA9IGxvZ2NhdC5nZXRBbGxMb2dzKCk7XG4gICAgICBsb2dzLnNob3VsZC5oYXZlLmxlbmd0aC5hYm92ZSgwKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIG5vdCBhZmZlY3QgZGV2aWNlIGxvZ3MnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBhd2FpdCBydW5DbGVhckRldmljZUxvZ1Rlc3QoYWRiLCBsb2djYXQsIGZhbHNlKTtcbiAgICB9KTtcbiAgfSk7XG4gIGRlc2NyaWJlKCdjbGVhckRldmljZUxvZ3NPblN0YXJ0ID0gdHJ1ZScsIGZ1bmN0aW9uICgpIHtcbiAgICBiZWZvcmUoZnVuY3Rpb24gKCkge1xuICAgICAgbG9nY2F0ID0gbmV3IExvZ2NhdCh7XG4gICAgICAgIGFkYjogYWRiLmV4ZWN1dGFibGUsXG4gICAgICAgIGRlYnVnOiBmYWxzZSxcbiAgICAgICAgZGVidWdUcmFjZTogZmFsc2UsXG4gICAgICAgIGNsZWFyRGV2aWNlTG9nc09uU3RhcnQ6IHRydWUsXG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIGNsZWFyIHRoZSBsb2dzIGJlZm9yZSBzdGFydGluZyBjYXB0dXJlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgYXdhaXQgcnVuQ2xlYXJEZXZpY2VMb2dUZXN0KGFkYiwgbG9nY2F0LCB0cnVlKTtcbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdLCJmaWxlIjoidGVzdC9mdW5jdGlvbmFsL2xvZ2NhdC1lMmUtc3BlY3MuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==
