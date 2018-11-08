"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _teen_process = require("teen_process");

var _appiumSupport = require("appium-support");

var _bluebird = _interopRequireDefault(require("bluebird"));

var _events = _interopRequireDefault(require("events"));

const EventEmitter = _events.default.EventEmitter;

const log = _appiumSupport.logger.getLogger('Logcat');

const MAX_BUFFER_SIZE = 10000;
const LOGCAT_PROC_STARTUP_TIMEOUT = 10000;

class Logcat extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.adb = opts.adb;
    this.clearLogs = opts.clearDeviceLogsOnStart || false;
    this.debug = opts.debug;
    this.debugTrace = opts.debugTrace;
    this.maxBufferSize = opts.maxBufferSize || MAX_BUFFER_SIZE;
    this.logs = [];
    this.logIdxSinceLastRequest = 0;
  }

  startCapture() {
    var _this = this;

    return (0, _asyncToGenerator2.default)(function* () {
      let started = false;
      return yield new _bluebird.default(function () {
        var _ref = (0, _asyncToGenerator2.default)(function* (_resolve, _reject) {
          const resolve = function resolve(...args) {
            started = true;

            _resolve(...args);
          };

          const reject = function reject(...args) {
            started = true;

            _reject(...args);
          };

          if (_this.clearLogs) {
            yield _this.clear();
          }

          log.debug('Starting logcat capture');
          _this.proc = new _teen_process.SubProcess(_this.adb.path, _this.adb.defaultArgs.concat(['logcat', '-v', 'threadtime']));

          _this.proc.on('exit', (code, signal) => {
            log.error(`Logcat terminated with code ${code}, signal ${signal}`);
            _this.proc = null;

            if (!started) {
              log.warn('Logcat not started. Continuing');
              resolve();
            }
          });

          _this.proc.on('lines-stderr', lines => {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = lines[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                let line = _step.value;

                if (/execvp\(\)/.test(line)) {
                  log.error('Logcat process failed to start');
                  reject(new Error(`Logcat process failed to start. stderr: ${line}`));
                }

                _this.outputHandler(line, 'STDERR: ');
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

            resolve();
          });

          _this.proc.on('lines-stdout', lines => {
            resolve();
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              for (var _iterator2 = lines[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                let line = _step2.value;

                _this.outputHandler(line);
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

          yield _this.proc.start(0);
          setTimeout(resolve, LOGCAT_PROC_STARTUP_TIMEOUT);
        });

        return function (_x, _x2) {
          return _ref.apply(this, arguments);
        };
      }());
    })();
  }

  outputHandler(output, prefix = '') {
    output = output.trim();

    if (!output) {
      return;
    }

    if (this.logs.length >= this.maxBufferSize) {
      this.logs.shift();

      if (this.logIdxSinceLastRequest > 0) {
        --this.logIdxSinceLastRequest;
      }
    }

    const outputObj = {
      timestamp: Date.now(),
      level: 'ALL',
      message: output
    };
    this.logs.push(outputObj);
    this.emit('output', outputObj);
    const isTrace = /W\/Trace/.test(output);

    if (this.debug && (!isTrace || this.debugTrace)) {
      log.debug(prefix + output);
    }
  }

  stopCapture() {
    var _this2 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      log.debug("Stopping logcat capture");

      if (!_this2.proc || !_this2.proc.isRunning) {
        log.debug("Logcat already stopped");
        _this2.proc = null;
        return;
      }

      _this2.proc.removeAllListeners('exit');

      yield _this2.proc.stop();
      _this2.proc = null;
    })();
  }

  getLogs() {
    if (this.logIdxSinceLastRequest < this.logs.length) {
      const result = this.logs.slice(this.logIdxSinceLastRequest);
      this.logIdxSinceLastRequest = this.logs.length;
      return result;
    }

    return [];
  }

  getAllLogs() {
    return this.logs;
  }

  clear() {
    var _this3 = this;

    return (0, _asyncToGenerator2.default)(function* () {
      log.debug('Clearing logcat logs from device');

      try {
        const args = _this3.adb.defaultArgs.concat(['logcat', '-c']);

        log.debug(`Running '${_this3.adb.path} ${args.join(' ')}'`);
        yield (0, _teen_process.exec)(_this3.adb.path, args);
      } catch (err) {
        log.warn(`Failed to clear logcat logs: ${err.message}`);
      }
    })();
  }

}

var _default = Logcat;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9sb2djYXQuanMiXSwibmFtZXMiOlsiRXZlbnRFbWl0dGVyIiwiZXZlbnRzIiwibG9nIiwibG9nZ2VyIiwiZ2V0TG9nZ2VyIiwiTUFYX0JVRkZFUl9TSVpFIiwiTE9HQ0FUX1BST0NfU1RBUlRVUF9USU1FT1VUIiwiTG9nY2F0IiwiY29uc3RydWN0b3IiLCJvcHRzIiwiYWRiIiwiY2xlYXJMb2dzIiwiY2xlYXJEZXZpY2VMb2dzT25TdGFydCIsImRlYnVnIiwiZGVidWdUcmFjZSIsIm1heEJ1ZmZlclNpemUiLCJsb2dzIiwibG9nSWR4U2luY2VMYXN0UmVxdWVzdCIsInN0YXJ0Q2FwdHVyZSIsInN0YXJ0ZWQiLCJCIiwiX3Jlc29sdmUiLCJfcmVqZWN0IiwicmVzb2x2ZSIsImFyZ3MiLCJyZWplY3QiLCJjbGVhciIsInByb2MiLCJTdWJQcm9jZXNzIiwicGF0aCIsImRlZmF1bHRBcmdzIiwiY29uY2F0Iiwib24iLCJjb2RlIiwic2lnbmFsIiwiZXJyb3IiLCJ3YXJuIiwibGluZXMiLCJsaW5lIiwidGVzdCIsIkVycm9yIiwib3V0cHV0SGFuZGxlciIsInN0YXJ0Iiwic2V0VGltZW91dCIsIm91dHB1dCIsInByZWZpeCIsInRyaW0iLCJsZW5ndGgiLCJzaGlmdCIsIm91dHB1dE9iaiIsInRpbWVzdGFtcCIsIkRhdGUiLCJub3ciLCJsZXZlbCIsIm1lc3NhZ2UiLCJwdXNoIiwiZW1pdCIsImlzVHJhY2UiLCJzdG9wQ2FwdHVyZSIsImlzUnVubmluZyIsInJlbW92ZUFsbExpc3RlbmVycyIsInN0b3AiLCJnZXRMb2dzIiwicmVzdWx0Iiwic2xpY2UiLCJnZXRBbGxMb2dzIiwiam9pbiIsImVyciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7TUFDUUEsWSxHQUFpQkMsZSxDQUFqQkQsWTs7QUFHUixNQUFNRSxHQUFHLEdBQUdDLHNCQUFPQyxTQUFQLENBQWlCLFFBQWpCLENBQVo7O0FBQ0EsTUFBTUMsZUFBZSxH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QSxVQUFVLEdBQUk7QUFDWixXQUFPLEtBQUtqRCxJQUFaO0FBQ0Q7O0FBRUtVLEVBQUFBLEtBQU4sR0FBZTtBQUFBOztBQUFBO0FBQ2J4QixNQUFBQSxHQUFHLENBQUNXLEtBQUosQ0FBVSxrQ0FBVjs7QUFDQSxVQUFJO0FBQ0YsY0FBTVcsSUFBSSxHQUFHLE1BQUksQ0FBQ2QsR0FBTCxDQUFTb0IsV0FBVCxDQUFxQkMsTUFBckIsQ0FBNEIsQ0FBQyxRQUFELEVBQVcsSUFBWCxDQUE1QixDQUFiOztBQUNBN0IsUUFBQUEsR0FBRyxDQUFDVyxLQUFKLENBQVcsWUFBVyxNQUFJLENBQUNILEdBQUwsQ0FBU21CLElBQUssSUFBR0wsSUFBSSxDQUFDMEMsSUFBTCxDQUFVLEdBQVYsQ0FBZSxHQUF0RDtBQUNBLGNBQU0sd0JBQUssTUFBSSxDQUFDeEQsR0FBTCxDQUFTbUIsSUFBZCxFQUFvQkwsSUFBcEIsQ0FBTjtBQUNELE9BSkQsQ0FJRSxPQUFPMkMsR0FBUCxFQUFZO0FBQ1pqRSxRQUFBQSxHQUFHLENBQUNrQyxJQUFKLENBQVUsZ0NBQStCK0IsR0FBRyxDQUFDYixPQUFRLEVBQXJEO0FBQ0Q7QUFSWTtBQVNkOztBQXZIK0I7O2VBMEhuQi9DLE0iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTdWJQcm9jZXNzLCBleGVjIH0gZnJvbSAndGVlbl9wcm9jZXNzJztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJ2FwcGl1bS1zdXBwb3J0JztcbmltcG9ydCBCIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBldmVudHMgZnJvbSAnZXZlbnRzJztcbmNvbnN0IHsgRXZlbnRFbWl0dGVyIH0gPSBldmVudHM7XG5cblxuY29uc3QgbG9nID0gbG9nZ2VyLmdldExvZ2dlcignTG9nY2F0Jyk7XG5jb25zdCBNQVhfQlVGRkVSX1NJWkUgPSAxMDAwMDtcbmNvbnN0IExPR0NBVF9QUk9DX1NUQVJUVVBfVElNRU9VVCA9IDEwMDAwO1xuXG5jbGFzcyBMb2djYXQgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvciAob3B0cyA9IHt9KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmFkYiA9IG9wdHMuYWRiO1xuICAgIHRoaXMuY2xlYXJMb2dzID0gb3B0cy5jbGVhckRldmljZUxvZ3NPblN0YXJ0IHx8IGZhbHNlO1xuICAgIHRoaXMuZGVidWcgPSBvcHRzLmRlYnVnO1xuICAgIHRoaXMuZGVidWdUcmFjZSA9IG9wdHMuZGVidWdUcmFjZTtcbiAgICB0aGlzLm1heEJ1ZmZlclNpemUgPSBvcHRzLm1heEJ1ZmZlclNpemUgfHwgTUFYX0JVRkZFUl9TSVpFO1xuICAgIHRoaXMubG9ncyA9IFtdO1xuICAgIHRoaXMubG9nSWR4U2luY2VMYXN0UmVxdWVzdCA9IDA7XG4gIH1cblxuICBhc3luYyBzdGFydENhcHR1cmUgKCkge1xuICAgIGxldCBzdGFydGVkID0gZmFsc2U7XG4gICAgcmV0dXJuIGF3YWl0IG5ldyBCKGFzeW5jIChfcmVzb2x2ZSwgX3JlamVjdCkgPT4geyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHByb21pc2UvcGFyYW0tbmFtZXNcbiAgICAgIGNvbnN0IHJlc29sdmUgPSBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgX3Jlc29sdmUoLi4uYXJncyk7XG4gICAgICB9O1xuICAgICAgY29uc3QgcmVqZWN0ID0gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgICAgc3RhcnRlZCA9IHRydWU7XG4gICAgICAgIF9yZWplY3QoLi4uYXJncyk7XG4gICAgICB9O1xuXG4gICAgICBpZiAodGhpcy5jbGVhckxvZ3MpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgICAgfVxuXG4gICAgICBsb2cuZGVidWcoJ1N0YXJ0aW5nIGxvZ2NhdCBjYXB0dXJlJyk7XG4gICAgICB0aGlzLnByb2MgPSBuZXcgU3ViUHJvY2Vzcyh0aGlzLmFkYi5wYXRoLCB0aGlzLmFkYi5kZWZhdWx0QXJncy5jb25jYXQoWydsb2djYXQnLCAnLXYnLCAndGhyZWFkdGltZSddKSk7XG4gICAgICB0aGlzLnByb2Mub24oJ2V4aXQnLCAoY29kZSwgc2lnbmFsKSA9PiB7XG4gICAgICAgIGxvZy5lcnJvcihgTG9nY2F0IHRlcm1pbmF0ZWQgd2l0aCBjb2RlICR7Y29kZX0sIHNpZ25hbCAke3NpZ25hbH1gKTtcbiAgICAgICAgdGhpcy5wcm9jID0gbnVsbDtcbiAgICAgICAgaWYgKCFzdGFydGVkKSB7XG4gICAgICAgICAgbG9nLndhcm4oJ0xvZ2NhdCBub3Qgc3RhcnRlZC4gQ29udGludWluZycpO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB0aGlzLnByb2Mub24oJ2xpbmVzLXN0ZGVycicsIChsaW5lcykgPT4ge1xuICAgICAgICBmb3IgKGxldCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgICAgICAgaWYgKC9leGVjdnBcXChcXCkvLnRlc3QobGluZSkpIHtcbiAgICAgICAgICAgIGxvZy5lcnJvcignTG9nY2F0IHByb2Nlc3MgZmFpbGVkIHRvIHN0YXJ0Jyk7XG4gICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGBMb2djYXQgcHJvY2VzcyBmYWlsZWQgdG8gc3RhcnQuIHN0ZGVycjogJHtsaW5lfWApKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5vdXRwdXRIYW5kbGVyKGxpbmUsICdTVERFUlI6ICcpO1xuICAgICAgICB9XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5wcm9jLm9uKCdsaW5lcy1zdGRvdXQnLCAobGluZXMpID0+IHtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICBmb3IgKGxldCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgICAgICAgdGhpcy5vdXRwdXRIYW5kbGVyKGxpbmUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGF3YWl0IHRoaXMucHJvYy5zdGFydCgwKTtcbiAgICAgIC8vIHJlc29sdmUgYWZ0ZXIgYSB0aW1lb3V0LCBldmVuIGlmIG5vIG91dHB1dCB3YXMgcmVjb3JkZWRcbiAgICAgIHNldFRpbWVvdXQocmVzb2x2ZSwgTE9HQ0FUX1BST0NfU1RBUlRVUF9USU1FT1VUKTtcbiAgICB9KTtcbiAgfVxuXG4gIG91dHB1dEhhbmRsZXIgKG91dHB1dCwgcHJlZml4ID0gJycpIHtcbiAgICBvdXRwdXQgPSBvdXRwdXQudHJpbSgpO1xuICAgIGlmICghb3V0cHV0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubG9ncy5sZW5ndGggPj0gdGhpcy5tYXhCdWZmZXJTaXplKSB7XG4gICAgICB0aGlzLmxvZ3Muc2hpZnQoKTtcbiAgICAgIGlmICh0aGlzLmxvZ0lkeFNpbmNlTGFzdFJlcXVlc3QgPiAwKSB7XG4gICAgICAgIC0tdGhpcy5sb2dJZHhTaW5jZUxhc3RSZXF1ZXN0O1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBvdXRwdXRPYmogPSB7XG4gICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICBsZXZlbDogJ0FMTCcsXG4gICAgICBtZXNzYWdlOiBvdXRwdXQsXG4gICAgfTtcbiAgICB0aGlzLmxvZ3MucHVzaChvdXRwdXRPYmopO1xuICAgIHRoaXMuZW1pdCgnb3V0cHV0Jywgb3V0cHV0T2JqKTtcbiAgICBjb25zdCBpc1RyYWNlID0gL1dcXC9UcmFjZS8udGVzdChvdXRwdXQpO1xuICAgIGlmICh0aGlzLmRlYnVnICYmICghaXNUcmFjZSB8fCB0aGlzLmRlYnVnVHJhY2UpKSB7XG4gICAgICBsb2cuZGVidWcocHJlZml4ICsgb3V0cHV0KTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBzdG9wQ2FwdHVyZSAoKSB7XG4gICAgbG9nLmRlYnVnKFwiU3RvcHBpbmcgbG9nY2F0IGNhcHR1cmVcIik7XG4gICAgaWYgKCF0aGlzLnByb2MgfHwgIXRoaXMucHJvYy5pc1J1bm5pbmcpIHtcbiAgICAgIGxvZy5kZWJ1ZyhcIkxvZ2NhdCBhbHJlYWR5IHN0b3BwZWRcIik7XG4gICAgICB0aGlzLnByb2MgPSBudWxsO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnByb2MucmVtb3ZlQWxsTGlzdGVuZXJzKCdleGl0Jyk7XG4gICAgYXdhaXQgdGhpcy5wcm9jLnN0b3AoKTtcbiAgICB0aGlzLnByb2MgPSBudWxsO1xuICB9XG5cbiAgZ2V0TG9ncyAoKSB7XG4gICAgaWYgKHRoaXMubG9nSWR4U2luY2VMYXN0UmVxdWVzdCA8IHRoaXMubG9ncy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMubG9ncy5zbGljZSh0aGlzLmxvZ0lkeFNpbmNlTGFzdFJlcXVlc3QpO1xuICAgICAgdGhpcy5sb2dJZHhTaW5jZUxhc3RSZXF1ZXN0ID0gdGhpcy5sb2dzLmxlbmd0aDtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGdldEFsbExvZ3MgKCkge1xuICAgIHJldHVybiB0aGlzLmxvZ3M7XG4gIH1cblxuICBhc3luYyBjbGVhciAoKSB7XG4gICAgbG9nLmRlYnVnKCdDbGVhcmluZyBsb2djYXQgbG9ncyBmcm9tIGRldmljZScpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBhcmdzID0gdGhpcy5hZGIuZGVmYXVsdEFyZ3MuY29uY2F0KFsnbG9nY2F0JywgJy1jJ10pO1xuICAgICAgbG9nLmRlYnVnKGBSdW5uaW5nICcke3RoaXMuYWRiLnBhdGh9ICR7YXJncy5qb2luKCcgJyl9J2ApO1xuICAgICAgYXdhaXQgZXhlYyh0aGlzLmFkYi5wYXRoLCBhcmdzKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGxvZy53YXJuKGBGYWlsZWQgdG8gY2xlYXIgbG9nY2F0IGxvZ3M6ICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExvZ2NhdDtcbiJdLCJmaWxlIjoibGliL2xvZ2NhdC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLiJ9
