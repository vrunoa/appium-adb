"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _chai = _interopRequireDefault(require("chai"));

var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));

var _ = _interopRequireDefault(require("../.."));

var _path = _interopRequireDefault(require("path"));

var _appiumSupport = require("appium-support");

var _helpers = require("../../lib/helpers.js");

const contactManagerPath = _path.default.resolve(_helpers.rootDir, 'test', 'fixtures', 'ContactManager.apk');

const contactMangerSelendroidPath = _path.default.resolve(_helpers.rootDir, 'test', 'fixtures', 'ContactManager-selendroid.apk');

const tmpDir = _path.default.resolve(_helpers.rootDir, 'test', 'temp');

const srcManifest = _path.default.resolve(_helpers.rootDir, 'test', 'fixtures', 'selendroid', 'AndroidManifest.xml');

const serverPath = _path.default.resolve(_helpers.rootDir, 'test', 'fixtures', 'selendroid', 'selendroid.apk');

_chai.default.use(_chaiAsPromised.default);

describe('Android-manifest', function () {
  let adb;
  before((0, _asyncToGenerator2.default)(function* () {
    adb = yield _.default.createADB();
  }));
  it('packageAndLaunchActivityFromManifest should parse package and Activity', (0, _asyncToGenerator2.default)(function* () {
    let _ref3 = yield adb.packageAndLaunchActivityFromManifest(contactManagerPath),
        apkPackage = _ref3.apkPackage,
        apkActivity = _ref3.apkActivity;

    apkPackage.should.equal('com.example.android.contactmanager');
    apkActivity.endsWith('.ContactManager').should.be.true;
  }));
  it('hasInternetPermissionFromManifest should be true', (0, _asyncToGenerator2.default)(function* () {
    let flag = yield adb.hasInternetPermissionFromManifest(contactMangerSelendroidPath);
    flag.should.be.true;
  }));
  it('hasInternetPermissionFromManifest should be false', (0, _asyncToGenerator2.default)(function* () {
    let flag = yield adb.hasInternetPermissionFromManifest(contactManagerPath);
    flag.should.be.false;
  }));
  it.skip('should compile and insert manifest', (0, _asyncToGenerator2.default)(function* () {
    let appPackage = 'com.example.android.contactmanager',
        newServerPath = _path.default.resolve(tmpDir, `selendroid.${appPackage}.apk`),
        newPackage = 'com.example.android.contactmanager.selendroid',
        dstDir = _path.default.resolve(tmpDir, appPackage),
        dstManifest = _path.default.resolve(dstDir, 'AndroidManifest.xml');

    try {
      yield _appiumSupport.fs.rimraf(tmpDir);
    } catch (e) {
      console.log(`Unable to delete temp directory. It might not be present. ${e.message}`);
    }

    yield _appiumSupport.fs.mkdir(tmpDir);
    yield _appiumSupport.fs.mkdir(dstDir);
    yield _appiumSupport.fs.writeFile(dstManifest, (yield _appiumSupport.fs.readFile(srcManifest, "utf8")), "utf8");
    yield adb.compileManifest(dstManifest, newPackage, appPackage);
    (yield _appiumSupport.util.fileExists(dstManifest)).should.be.true;
    yield adb.insertManifest(dstManifest, serverPath, newServerPath);
    (yield _appiumSupport.util.fileExists(newServerPath)).should.be.true;

    try {
      yield _appiumSupport.fs.rimraf(tmpDir);
    } catch (e) {
      console.log(`Unable to delete temp directory. It might not be present. ${e.message}`);
    }
  }));
});
describe.skip('Android-manifest To be implemented methods', function () {
  it('should return correct processFromManifest', (0, _asyncToGenerator2.default)(function* () {}));
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvZnVuY3Rpb25hbC9hbmRyb2lkLW1hbmlmZXN0LWUyZS1zcGVjcy5qcyJdLCJuYW1lcyI6WyJjb250YWN0TWFuYWdlclBhdGgiLCJwYXRoIiwicmVzb2x2ZSIsInJvb3REaXIiLCJjb250YWN0TWFuZ2VyU2VsZW5kcm9pZFBhdGgiLCJ0bXBEaXIiLCJzcmNNYW5pZmVzdCIsInNlcnZlclBhdGgiLCJjaGFpIiwidXNlIiwiY2hhaUFzUHJvbWlzZWQiLCJkZXNjcmliZSIsImFkYiIsImJlZm9yZSIsIkFEQiIsImNyZWF0ZUFEQiIsIml0IiwicGFja2FnZUFuZExhdW5jaEFjdGl2aXR5RnJvbU1hbmlmZXN0IiwiYXBrUGFja2FnZSIsImFwa0FjdGl2aXR5Iiwic2hvdWxkIiwiZXF1YWwiLCJlbmRzV2l0aCIsImJlIiwidHJ1ZSIsImZsYWciLCJoYXNJbnRlcm5ldFBlcm1pc3Npb25Gcm9tTWFuaWZlc3QiLCJmYWxzZSIsInNraXAiLCJhcHBQYWNrYWdlIiwibmV3U2VydmVyUGF0aCIsIm5ld1BhY2thZ2UiLCJkc3REaXIiLCJkc3RNYW5pZmVzdCIsImZzIiwicmltcmFmIiwiZSIsImNvbnNvbGUiLCJsb2ciLCJtZXNzYWdlIiwibWtkaXIiLCJ3cml0ZUZpbGUiLCJyZWFkRmlsZSIsImNvbXBpbGVNYW5pZmVzdCIsInV0aWwiLCJmaWxlRXhpc3RzIiwiaW5zZXJ0TWFuaWZlc3QiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUtBLE1BQU1BLGtCQUFrQixHQUFHQyxjQUFLQyxPQUFMLENBQWFDLGdCQUFiLEVBQXNCLE1BQXRCLEVBQThCLFVBQTlCLEVBQTBDLG9CQUExQyxDQUEzQjs7QUFDQSxNQUFNQywyQkFBMkIsR0FBR0gsY0FBS0MsT0FBTCxDQUFhQyxnQkFBYixFQUFzQixNQUF0QixFQUE4QixVQUE5QixFQUEwQywrQkFBMUMsQ0FBcEM7O0FBQ0EsTUFBTUUsTUFBTSxHQUFHSixjQUFLQyxP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LFdBQWhCLENBQVAsRUFBcUNiLE1BQXJDLENBQTRDRyxFQUE1QyxDQUErQ0MsSUFBL0M7QUFDQSxVQUFNWixHQUFHLENBQUNrQyxjQUFKLENBQW1CYixXQUFuQixFQUFnQzFCLFVBQWhDLEVBQTRDdUIsYUFBNUMsQ0FBTjtBQUNBLFdBQU9jLG9CQUFLQyxVQUFMLENBQWdCZixhQUFoQixDQUFQLEVBQXVDVixNQUF2QyxDQUE4Q0csRUFBOUMsQ0FBaURDLElBQWpEOztBQUVBLFFBQUk7QUFDRixZQUFNVSxrQkFBR0MsTUFBSCxDQUFVOUIsTUFBVixDQUFOO0FBQ0QsS0FGRCxDQUVFLE9BQU8rQixDQUFQLEVBQVU7QUFDVkMsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQWEsNkRBQTRERixDQUFDLENBQUNHLE9BQVEsRUFBbkY7QUFDRDtBQUNGLEdBekJEO0FBMEJELENBN0NPLENBQVI7QUErQ0E1QixRQUFRLENBQUNpQixJQUFULENBQWMsNENBQWQsRUFBNEQsWUFBWTtBQUN0RVosRUFBQUEsRUFBRSxDQUFDLDJDQUFELGtDQUE4QyxhQUFrQixDQUFHLENBQW5FLEVBQUY7QUFDRCxDQUZEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5pbXBvcnQgY2hhaUFzUHJvbWlzZWQgZnJvbSAnY2hhaS1hcy1wcm9taXNlZCc7XG5pbXBvcnQgQURCIGZyb20gJy4uLy4uJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZnMsIHV0aWwgfSBmcm9tICdhcHBpdW0tc3VwcG9ydCc7XG5pbXBvcnQgeyByb290RGlyIH0gZnJvbSAnLi4vLi4vbGliL2hlbHBlcnMuanMnO1xuXG5cbi8vIEFsbCBwYXRocyBiZWxvdyBhc3N1bWUgdGVzdHMgcnVuIHVuZGVyIC9idWlsZC90ZXN0LyBzbyBwYXRocyBhcmUgcmVsYXRpdmUgZnJvbVxuLy8gdGhhdCBkaXJlY3RvcnkuXG5jb25zdCBjb250YWN0TWFuYWdlclBhdGggPSBwYXRoLnJlc29sdmUocm9vdERpciwgJ3Rlc3QnLCAnZml4dHVyZXMnLCAnQ29udGFjdE1hbmFnZXIuYXBrJyk7XG5jb25zdCBjb250YWN0TWFuZ2VyU2VsZW5kcm9pZFBhdGggPSBwYXRoLnJlc29sdmUocm9vdERpciwgJ3Rlc3QnLCAnZml4dHVyZXMnLCAnQ29udGFjdE1hbmFnZXItc2VsZW5kcm9pZC5hcGsnKTtcbmNvbnN0IHRtcERpciA9IHBhdGgucmVzb2x2ZShyb290RGlyLCAndGVzdCcsICd0ZW1wJyk7XG5jb25zdCBzcmNNYW5pZmVzdCA9IHBhdGgucmVzb2x2ZShyb290RGlyLCAndGVzdCcsICdmaXh0dXJlcycsICdzZWxlbmRyb2lkJywgJ0FuZHJvaWRNYW5pZmVzdC54bWwnKTtcbmNvbnN0IHNlcnZlclBhdGggPSBwYXRoLnJlc29sdmUocm9vdERpciwgJ3Rlc3QnLCAnZml4dHVyZXMnLCAnc2VsZW5kcm9pZCcsICdzZWxlbmRyb2lkLmFwaycpO1xuXG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5cbmRlc2NyaWJlKCdBbmRyb2lkLW1hbmlmZXN0JywgZnVuY3Rpb24gKCkge1xuICBsZXQgYWRiO1xuICBiZWZvcmUoYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgIGFkYiA9IGF3YWl0IEFEQi5jcmVhdGVBREIoKTtcbiAgfSk7XG4gIGl0KCdwYWNrYWdlQW5kTGF1bmNoQWN0aXZpdHlGcm9tTWFuaWZlc3Qgc2hvdWxkIHBhcnNlIHBhY2thZ2UgYW5kIEFjdGl2aXR5JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgIGxldCB7YXBrUGFja2FnZSwgYXBrQWN0aXZpdHl9ID0gYXdhaXQgYWRiLnBhY2thZ2VBbmRMYXVuY2hBY3Rpdml0eUZyb21NYW5pZmVzdChjb250YWN0TWFuYWdlclBhdGgpO1xuICAgIGFwa1BhY2thZ2Uuc2hvdWxkLmVxdWFsKCdjb20uZXhhbXBsZS5hbmRyb2lkLmNvbnRhY3RtYW5hZ2VyJyk7XG4gICAgYXBrQWN0aXZpdHkuZW5kc1dpdGgoJy5Db250YWN0TWFuYWdlcicpLnNob3VsZC5iZS50cnVlO1xuICB9KTtcbiAgaXQoJ2hhc0ludGVybmV0UGVybWlzc2lvbkZyb21NYW5pZmVzdCBzaG91bGQgYmUgdHJ1ZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgZmxhZyA9IGF3YWl0IGFkYi5oYXNJbnRlcm5ldFBlcm1pc3Npb25Gcm9tTWFuaWZlc3QoY29udGFjdE1hbmdlclNlbGVuZHJvaWRQYXRoKTtcbiAgICBmbGFnLnNob3VsZC5iZS50cnVlO1xuICB9KTtcbiAgaXQoJ2hhc0ludGVybmV0UGVybWlzc2lvbkZyb21NYW5pZmVzdCBzaG91bGQgYmUgZmFsc2UnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGZsYWcgPSBhd2FpdCBhZGIuaGFzSW50ZXJuZXRQZXJtaXNzaW9uRnJvbU1hbmlmZXN0KGNvbnRhY3RNYW5hZ2VyUGF0aCk7XG4gICAgZmxhZy5zaG91bGQuYmUuZmFsc2U7XG4gIH0pO1xuICAvLyBUT0RPIGZpeCB0aGlzIHRlc3RcbiAgaXQuc2tpcCgnc2hvdWxkIGNvbXBpbGUgYW5kIGluc2VydCBtYW5pZmVzdCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgYXBwUGFja2FnZSA9ICdjb20uZXhhbXBsZS5hbmRyb2lkLmNvbnRhY3RtYW5hZ2VyJyxcbiAgICAgICAgbmV3U2VydmVyUGF0aCA9IHBhdGgucmVzb2x2ZSh0bXBEaXIsIGBzZWxlbmRyb2lkLiR7YXBwUGFja2FnZX0uYXBrYCksXG4gICAgICAgIG5ld1BhY2thZ2UgPSAnY29tLmV4YW1wbGUuYW5kcm9pZC5jb250YWN0bWFuYWdlci5zZWxlbmRyb2lkJyxcbiAgICAgICAgZHN0RGlyID0gcGF0aC5yZXNvbHZlKHRtcERpciwgYXBwUGFja2FnZSksXG4gICAgICAgIGRzdE1hbmlmZXN0ID0gcGF0aC5yZXNvbHZlKGRzdERpciwgJ0FuZHJvaWRNYW5pZmVzdC54bWwnKTtcbiAgICAvLyBkZWxldGluZyB0ZW1wIGRpcmVjdG9yeSBpZiBwcmVzZW50XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLnJpbXJhZih0bXBEaXIpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBVbmFibGUgdG8gZGVsZXRlIHRlbXAgZGlyZWN0b3J5LiBJdCBtaWdodCBub3QgYmUgcHJlc2VudC4gJHtlLm1lc3NhZ2V9YCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIH1cbiAgICBhd2FpdCBmcy5ta2Rpcih0bXBEaXIpO1xuICAgIGF3YWl0IGZzLm1rZGlyKGRzdERpcik7XG4gICAgYXdhaXQgZnMud3JpdGVGaWxlKGRzdE1hbmlmZXN0LCBhd2FpdCBmcy5yZWFkRmlsZShzcmNNYW5pZmVzdCwgXCJ1dGY4XCIpLCBcInV0ZjhcIik7XG4gICAgYXdhaXQgYWRiLmNvbXBpbGVNYW5pZmVzdChkc3RNYW5pZmVzdCwgbmV3UGFja2FnZSwgYXBwUGFja2FnZSk7XG4gICAgKGF3YWl0IHV0aWwuZmlsZUV4aXN0cyhkc3RNYW5pZmVzdCkpLnNob3VsZC5iZS50cnVlO1xuICAgIGF3YWl0IGFkYi5pbnNlcnRNYW5pZmVzdChkc3RNYW5pZmVzdCwgc2VydmVyUGF0aCwgbmV3U2VydmVyUGF0aCk7XG4gICAgKGF3YWl0IHV0aWwuZmlsZUV4aXN0cyhuZXdTZXJ2ZXJQYXRoKSkuc2hvdWxkLmJlLnRydWU7XG4gICAgLy8gZGVsZXRpbmcgdGVtcCBkaXJlY3RvcnlcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZnMucmltcmFmKHRtcERpcik7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5sb2coYFVuYWJsZSB0byBkZWxldGUgdGVtcCBkaXJlY3RvcnkuIEl0IG1pZ2h0IG5vdCBiZSBwcmVzZW50LiAke2UubWVzc2FnZX1gKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgfVxuICB9KTtcbn0pO1xuXG5kZXNjcmliZS5za2lwKCdBbmRyb2lkLW1hbmlmZXN0IFRvIGJlIGltcGxlbWVudGVkIG1ldGhvZHMnLCBmdW5jdGlvbiAoKSB7XG4gIGl0KCdzaG91bGQgcmV0dXJuIGNvcnJlY3QgcHJvY2Vzc0Zyb21NYW5pZmVzdCcsIGFzeW5jIGZ1bmN0aW9uICgpIHsgfSk7XG59KTtcbiJdLCJmaWxlIjoidGVzdC9mdW5jdGlvbmFsL2FuZHJvaWQtbWFuaWZlc3QtZTJlLXNwZWNzLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uIn0=
