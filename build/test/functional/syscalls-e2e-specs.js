"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _chai = _interopRequireDefault(require("chai"));

var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));

var _ = _interopRequireDefault(require("../.."));

var _setup = require("./setup");

var _path = _interopRequireDefault(require("path"));

var _helpers = require("../../lib/helpers.js");

var _appiumSupport = require("appium-support");

const DEFAULT_CERTIFICATE = _path.default.resolve(_helpers.rootDir, 'keys', 'testkey.x509.pem');

_chai.default.use(_chaiAsPromised.default);

describe('System calls', function () {
  this.timeout(_setup.MOCHA_TIMEOUT);
  let adb;
  before((0, _asyncToGenerator2.default)(function* () {
    adb = yield _.default.createADB();
  }));
  it('getConnectedDevices should get devices', (0, _asyncToGenerator2.default)(function* () {
    let devices = yield adb.getConnectedDevices();
    devices.should.have.length.above(0);
  }));
  it('getDevicesWithRetry should get devices', (0, _asyncToGenerator2.default)(function* () {
    let devices = yield adb.getDevicesWithRetry();
    devices.should.have.length.above(0);
  }));
  it('adbExec should get devices when with devices', (0, _asyncToGenerator2.default)(function* () {
    (yield adb.adbExec("devices")).should.contain("List of devices attached");
  }));
  it('isDeviceConnected should be true', (0, _asyncToGenerator2.default)(function* () {
    (yield adb.isDeviceConnected()).should.be.true;
  }));
  it('shell should execute command in adb shell ', (0, _asyncToGenerator2.default)(function* () {
    (yield adb.shell(['getprop', 'ro.build.version.sdk'])).should.equal(`${_setup.apiLevel}`);
  }));
  it('getConnectedEmulators should get all connected emulators', (0, _asyncToGenerator2.default)(function* () {
    (yield adb.getConnectedEmulators()).length.should.be.above(0);
  }));
  it('getRunningAVD should get all connected avd', (0, _asyncToGenerator2.default)(function* () {
    (yield adb.getRunningAVD(_setup.avdName)).should.not.be.null;
  }));
  it('getRunningAVDWithRetry should get all connected avds', (0, _asyncToGenerator2.default)(function* () {
    (yield adb.getRunningAVDWithRetry(_setup.avdName)).should.not.be.null;
  }));
  it.skip('launchAVD should get all connected avds', (0, _asyncToGenerator2.default)(function* () {
    this.timeout(_setup.MOCHA_LONG_TIMEOUT);
    let proc = yield adb.launchAVD(_setup.avdName);
    (yield adb.getConnectedEmulators()).length.should.be.above(0);
    proc.stop();
  }));
  it('waitForDevice should get all connected avds', (0, _asyncToGenerator2.default)(function* () {
    yield adb.waitForDevice(2);
  }));
  it('reboot should reboot the device', (0, _asyncToGenerator2.default)(function* () {
    if (process.env.TRAVIS) {
      return this.skip();
    }

    this.timeout(_setup.MOCHA_LONG_TIMEOUT);
    yield adb.reboot(process.env.TRAVIS ? 200 : undefined);
    yield adb.ping();
  }));
  it('fileExists should detect when files do and do not exist', (0, _asyncToGenerator2.default)(function* () {
    (yield adb.fileExists('/foo/bar/baz.zip')).should.be.false;
    (yield adb.fileExists('/system/')).should.be.true;
  }));
  it('ls should list files', (0, _asyncToGenerator2.default)(function* () {
    (yield adb.ls('/foo/bar')).should.eql([]);
    (yield adb.ls('/system/')).should.contain('etc');
  }));
  it('should check if the given certificate is already installed', (0, _asyncToGenerator2.default)(function* () {
    const certBuffer = yield _appiumSupport.fs.readFile(DEFAULT_CERTIFICATE);
    (yield adb.isMitmCertificateInstalled(certBuffer)).should.be.false;
  }));
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvZnVuY3Rpb25hbC9zeXNjYWxscy1lMmUtc3BlY3MuanMiXSwibmFtZXMiOlsiREVGQVVMVF9DRVJUSUZJQ0FURSIsInBhdGgiLCJyZXNvbHZlIiwicm9vdERpciIsImNoYWkiLCJ1c2UiLCJjaGFpQXNQcm9taXNlZCIsImRlc2NyaWJlIiwidGltZW91dCIsIk1PQ0hBX1RJTUVPVVQiLCJhZGIiLCJiZWZvcmUiLCJBREIiLCJjcmVhdGVBREIiLCJpdCIsImRldmljZXMiLCJnZXRDb25uZWN0ZWREZXZpY2VzIiwic2hvdWxkIiwiaGF2ZSIsImxlbmd0aCIsImFib3ZlIiwiZ2V0RGV2aWNlc1dpdGhSZXRyeSIsImFkYkV4ZWMiLCJjb250YWluIiwiaXNEZXZpY2VDb25uZWN0ZWQiLCJiZSIsInRydWUiLCJzaGVsbCIsImVxdWFsIiwiYXBpTGV2ZWwiLCJnZXRDb25uZWN0ZWRFbXVsYXRvcnMiLCJnZXRSdW5uaW5nQVZEIiwiYXZkTmFtZSIsIm5vdCIsIm51bGwiLCJnZXRSdW5uaW5nQVZEV2l0aFJldHJ5Iiwic2tpcCIsIk1PQ0hBX0xPTkdfVElNRU9VVCIsInByb2MiLCJsYXVuY2hBVkQiLCJzdG9wIiwid2FpdEZvckRldmljZSIsInByb2Nlc3MiLCJlbnYiLCJUUkFWSVMiLCJyZWJvb3QiLCJ1bmRlZmluZWQiLCJwaW5nIiwiZmlsZUV4aXN0cyIsImZhbHNlIiwibHMiLCJlcWwiLCJjZXJ0QnVmZmVyIiwiZnMiLCJyZWFkRmlsZSIsImlzTWl0bUNlcnRpZmljYXRlSW5zdGFsbGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQSxNQUFNQSxtQkFBbUIsR0FBR0MsY0FBS0MsT0FBTCxDQUFhQyxnQkFBYixFQUFzQixNQUF0QixFQUE4QixrQkFBOUIsQ0FBNUI7O0FBRUFDLGNBQUtDLEdBQUwsQ0FBU0MsdUJBQVQ7O0FBRUFDLFFBQVEsQ0FBQyxjQUFELEVBQWlCLFlBQVk7QUFD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QUFDRCxHQUhDLEVBQUY7QUFJRCxDQWhFTyxDQUFSIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5pbXBvcnQgY2hhaUFzUHJvbWlzZWQgZnJvbSAnY2hhaS1hcy1wcm9taXNlZCc7XG5pbXBvcnQgQURCIGZyb20gJy4uLy4uJztcbmltcG9ydCB7IGFwaUxldmVsLCBhdmROYW1lLCBNT0NIQV9USU1FT1VULCBNT0NIQV9MT05HX1RJTUVPVVQgfSBmcm9tICcuL3NldHVwJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgcm9vdERpciB9IGZyb20gJy4uLy4uL2xpYi9oZWxwZXJzLmpzJztcbmltcG9ydCB7IGZzIH0gZnJvbSAnYXBwaXVtLXN1cHBvcnQnO1xuXG5jb25zdCBERUZBVUxUX0NFUlRJRklDQVRFID0gcGF0aC5yZXNvbHZlKHJvb3REaXIsICdrZXlzJywgJ3Rlc3RrZXkueDUwOS5wZW0nKTtcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuXG5kZXNjcmliZSgnU3lzdGVtIGNhbGxzJywgZnVuY3Rpb24gKCkge1xuICB0aGlzLnRpbWVvdXQoTU9DSEFfVElNRU9VVCk7XG5cbiAgbGV0IGFkYjtcbiAgYmVmb3JlKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICBhZGIgPSBhd2FpdCBBREIuY3JlYXRlQURCKCk7XG4gIH0pO1xuICBpdCgnZ2V0Q29ubmVjdGVkRGV2aWNlcyBzaG91bGQgZ2V0IGRldmljZXMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGRldmljZXMgPSBhd2FpdCBhZGIuZ2V0Q29ubmVjdGVkRGV2aWNlcygpO1xuICAgIGRldmljZXMuc2hvdWxkLmhhdmUubGVuZ3RoLmFib3ZlKDApO1xuICB9KTtcbiAgaXQoJ2dldERldmljZXNXaXRoUmV0cnkgc2hvdWxkIGdldCBkZXZpY2VzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgIGxldCBkZXZpY2VzID0gYXdhaXQgYWRiLmdldERldmljZXNXaXRoUmV0cnkoKTtcbiAgICBkZXZpY2VzLnNob3VsZC5oYXZlLmxlbmd0aC5hYm92ZSgwKTtcbiAgfSk7XG4gIGl0KCdhZGJFeGVjIHNob3VsZCBnZXQgZGV2aWNlcyB3aGVuIHdpdGggZGV2aWNlcycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAoYXdhaXQgYWRiLmFkYkV4ZWMoXCJkZXZpY2VzXCIpKS5zaG91bGQuY29udGFpbihcIkxpc3Qgb2YgZGV2aWNlcyBhdHRhY2hlZFwiKTtcbiAgfSk7XG4gIGl0KCdpc0RldmljZUNvbm5lY3RlZCBzaG91bGQgYmUgdHJ1ZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAoYXdhaXQgYWRiLmlzRGV2aWNlQ29ubmVjdGVkKCkpLnNob3VsZC5iZS50cnVlO1xuICB9KTtcbiAgaXQoJ3NoZWxsIHNob3VsZCBleGVjdXRlIGNvbW1hbmQgaW4gYWRiIHNoZWxsICcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAoYXdhaXQgYWRiLnNoZWxsKFsnZ2V0cHJvcCcsICdyby5idWlsZC52ZXJzaW9uLnNkayddKSkuc2hvdWxkLmVxdWFsKGAke2FwaUxldmVsfWApO1xuICB9KTtcbiAgaXQoJ2dldENvbm5lY3RlZEVtdWxhdG9ycyBzaG91bGQgZ2V0IGFsbCBjb25uZWN0ZWQgZW11bGF0b3JzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgIChhd2FpdCBhZGIuZ2V0Q29ubmVjdGVkRW11bGF0b3JzKCkpLmxlbmd0aC5zaG91bGQuYmUuYWJvdmUoMCk7XG4gIH0pO1xuICBpdCgnZ2V0UnVubmluZ0FWRCBzaG91bGQgZ2V0IGFsbCBjb25uZWN0ZWQgYXZkJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgIChhd2FpdCBhZGIuZ2V0UnVubmluZ0FWRChhdmROYW1lKSkuc2hvdWxkLm5vdC5iZS5udWxsO1xuICB9KTtcbiAgaXQoJ2dldFJ1bm5pbmdBVkRXaXRoUmV0cnkgc2hvdWxkIGdldCBhbGwgY29ubmVjdGVkIGF2ZHMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgKGF3YWl0IGFkYi5nZXRSdW5uaW5nQVZEV2l0aFJldHJ5KGF2ZE5hbWUpKS5zaG91bGQubm90LmJlLm51bGw7XG4gIH0pO1xuICAvLyBTa2lwcGluZyBmb3Igbm93LiBXaWxsIHVuc2tpcCBkZXBlbmRpbmcgb24gaG93IGl0IGJlaGF2ZXMgb24gQ0lcbiAgaXQuc2tpcCgnbGF1bmNoQVZEIHNob3VsZCBnZXQgYWxsIGNvbm5lY3RlZCBhdmRzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgIHRoaXMudGltZW91dChNT0NIQV9MT05HX1RJTUVPVVQpO1xuICAgIGxldCBwcm9jID0gYXdhaXQgYWRiLmxhdW5jaEFWRChhdmROYW1lKTtcbiAgICAoYXdhaXQgYWRiLmdldENvbm5lY3RlZEVtdWxhdG9ycygpKS5sZW5ndGguc2hvdWxkLmJlLmFib3ZlKDApO1xuICAgIHByb2Muc3RvcCgpO1xuICB9KTtcbiAgaXQoJ3dhaXRGb3JEZXZpY2Ugc2hvdWxkIGdldCBhbGwgY29ubmVjdGVkIGF2ZHMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgYXdhaXQgYWRiLndhaXRGb3JEZXZpY2UoMik7XG4gIH0pO1xuICBpdCgncmVib290IHNob3VsZCByZWJvb3QgdGhlIGRldmljZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAocHJvY2Vzcy5lbnYuVFJBVklTKSB7XG4gICAgICAvLyBUaGUgdGVzdCBpcyB2ZXJ5IHNsb3cgb24gQ0lcbiAgICAgIHJldHVybiB0aGlzLnNraXAoKTtcbiAgICB9XG4gICAgdGhpcy50aW1lb3V0KE1PQ0hBX0xPTkdfVElNRU9VVCk7XG4gICAgYXdhaXQgYWRiLnJlYm9vdChwcm9jZXNzLmVudi5UUkFWSVMgPyAyMDAgOiB1bmRlZmluZWQpO1xuICAgIGF3YWl0IGFkYi5waW5nKCk7XG4gIH0pO1xuICBpdCgnZmlsZUV4aXN0cyBzaG91bGQgZGV0ZWN0IHdoZW4gZmlsZXMgZG8gYW5kIGRvIG5vdCBleGlzdCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAoYXdhaXQgYWRiLmZpbGVFeGlzdHMoJy9mb28vYmFyL2Jhei56aXAnKSkuc2hvdWxkLmJlLmZhbHNlO1xuICAgIChhd2FpdCBhZGIuZmlsZUV4aXN0cygnL3N5c3RlbS8nKSkuc2hvdWxkLmJlLnRydWU7XG4gIH0pO1xuICBpdCgnbHMgc2hvdWxkIGxpc3QgZmlsZXMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgKGF3YWl0IGFkYi5scygnL2Zvby9iYXInKSkuc2hvdWxkLmVxbChbXSk7XG4gICAgKGF3YWl0IGFkYi5scygnL3N5c3RlbS8nKSkuc2hvdWxkLmNvbnRhaW4oJ2V0YycpO1xuICB9KTtcbiAgaXQoJ3Nob3VsZCBjaGVjayBpZiB0aGUgZ2l2ZW4gY2VydGlmaWNhdGUgaXMgYWxyZWFkeSBpbnN0YWxsZWQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgY2VydEJ1ZmZlciA9IGF3YWl0IGZzLnJlYWRGaWxlKERFRkFVTFRfQ0VSVElGSUNBVEUpO1xuICAgIChhd2FpdCBhZGIuaXNNaXRtQ2VydGlmaWNhdGVJbnN0YWxsZWQoY2VydEJ1ZmZlcikpLnNob3VsZC5iZS5mYWxzZTtcbiAgfSk7XG59KTtcbiJdLCJmaWxlIjoidGVzdC9mdW5jdGlvbmFsL3N5c2NhbGxzLWUyZS1zcGVjcy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLiJ9
