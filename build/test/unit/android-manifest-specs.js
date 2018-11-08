"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _chai = _interopRequireDefault(require("chai"));

var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));

var _ = _interopRequireDefault(require("../.."));

var teen_process = _interopRequireWildcard(require("teen_process"));

var helpers = _interopRequireWildcard(require("../../lib/helpers.js"));

var _appiumTestSupport = require("appium-test-support");

_chai.default.use(_chaiAsPromised.default);

const adb = new _.default();
describe('android-manifest', (0, _appiumTestSupport.withMocks)({
  adb,
  teen_process,
  helpers
}, function (mocks) {
  afterEach(function () {
    mocks.verify();
  });
  describe('processFromManifest', function () {
    it('should correctly parse process from manifest', (0, _asyncToGenerator2.default)(function* () {
      adb.binaries.aapt = 'dummy_aapt';
      const localApk = 'dummyAPK',
            dummyProcess = 'dummyProcess';
      mocks.adb.expects("initAapt").once().withExactArgs().returns('');
      mocks.teen_process.expects("exec").once().withExactArgs('dummy_aapt', ['dump', 'xmltree', localApk, 'AndroidManifest.xml']).returns({
        stdout: ` E: application (line=234)
                          A: android:process(0x01010011)="${dummyProcess}"`
      });
      (yield adb.processFromManifest(localApk)).should.equal(dummyProcess);
    }));
  });
  describe('packageAndLaunchActivityFromManifest', function () {
    it('should correctly parse package and activity from manifest with apkanalyzer tool', (0, _asyncToGenerator2.default)(function* () {
      const apkanalyzerDummyPath = 'apkanalyzer';
      mocks.helpers.expects("getApkanalyzerForOs").returns(apkanalyzerDummyPath);
      const localApk = 'dummyAPK';
      const dummyPackageName = 'io.appium.android';
      const dummyActivityName = 'io.appium.mainactivity.MainTabActivity';
      mocks.teen_process.expects("exec").once().withArgs(apkanalyzerDummyPath).returns({
        stdout: `
        <?xml version="1.0" encoding="utf-8"?>
        <manifest
          xmlns:amazon="http://schemas.amazon.com/apk/res/android"
          xmlns:android="http://schemas.android.com/apk/res/android"
          android:versionCode="1234"
          android:versionName="3.0.0"
          android:installLocation="0"
          package="${dummyPackageName}">

          <application
              android:theme="@ref/0x7f0f00ef"
              android:label="@ref/0x7f0e00b4"
              android:icon="@ref/0x7f0b0001"
              android:name="io.appium.app.testappAppShell"
              android:debuggable="false"
              android:allowTaskReparenting="true"
              android:allowBackup="false"
              android:hardwareAccelerated="true"
              android:supportsRtl="true">

              <activity
                  android:name="io.appium.mainactivity.MainTabActivity"
                  android:exported="true"
                  android:clearTaskOnLaunch="false"
                  android:launchMode="1"
                  android:screenOrientation="1"
                  android:configChanges="0x4a0"
                  android:alwaysRetainTaskState="true"
                  android:windowSoftInputMode="0x30" />

              <activity-alias
                  android:name="${dummyActivityName}"
                  android:exported="true"
                  android:clearTaskOnLaunch="false"
                  android:launchMode="1"
                  android:screenOrientation="1"
                  android:configChanges="0x4a0"
                  android:targetActivity="io.appium.mainactivity.MainTabActivity"
                  android:alwaysRetainTaskState="true"
                  android:windowSoftInputMode="0x30">

                  <intent-filter>

                      <action
                          android:name="android.intent.action.MAIN" />

                      <category
                          android:name="android.intent.category.LAUNCHER" />
                  </intent-filter>

                  <intent-filter>

                      <action
                          android:name="android.intent.action.VIEW" />

                      <category
                          android:name="android.intent.category.DEFAULT" />

                      <category
                          android:name="android.intent.category.BROWSABLE" />

                      <data
                          android:scheme="testapp"
                          android:host="headline_event" />

                      <data
                          android:scheme="testapp"
                          android:host="story-camera" />

                      <data
                          android:scheme="testapp"
                          android:host="direct-inbox" />

                      <data
                          android:scheme="testapp"
                          android:host="share" />
                  </intent-filter>
              </activity-alias>

              <activity
                  android:name="io.appium.mainactivity.MainActivity"
                  android:exported="true"
                  android:clearTaskOnLaunch="false"
                  android:launchMode="1"
                  android:screenOrientation="1"
                  android:configChanges="0x4a0"
                  android:alwaysRetainTaskState="true"
                  android:windowSoftInputMode="0x30" />

              <activity
                  android:name="io.appium.nux.activity.SignedOutFragmentActivity"
                  android:screenOrientation="1"
                  android:configChanges="0x4a0"
                  android:windowSoftInputMode="0x2" />

              <activity
                  android:name="io.appium.nux.impl.OnboardingActivity"
                  android:exported="false"
                  android:screenOrientation="1"
                  android:configChanges="0x4a0"
                  android:windowSoftInputMode="0x2" />

              <activity
                  android:theme="@ref/0x7f0f009e"
                  android:name="io.appium.creation.activity.MediaCaptureActivity"
                  android:screenOrientation="1" />

              <activity
                  android:theme="@ref/0x7f0f009e"
                  android:name="io.appium.video.videocall.activity.VideoCallActivity"
                  android:exported="false"
                  android:launchMode="1"
                  android:screenOrientation="1"
                  android:configChanges="0x4a0"
                  android:windowSoftInputMode="0x2" />

              <activity
                  android:name="io.appium.bugreporter.BugReporterActivity"
                  android:launchMode="2"
                  android:screenOrientation="1" />

              <activity
                  android:name="io.appium.osversionblock.OsVersionBlockingActivity"
                  android:exported="false"
                  android:screenOrientation="1" />

              <activity
                  android:name="io.appium.share.twitter.TwitterOAuthActivity"
                  android:configChanges="0x4a0" />

              <activity
                  android:name="io.appium.share.tumblr.TumblrAuthActivity" />

              <activity
                  android:name="io.appium.share.vkontakte.VkontakteAuthActivity" />

              <activity
                  android:name="io.appium.share.ameba.AmebaAuthActivity" />

              <activity
                  android:name="io.appium.share.odnoklassniki.OdnoklassnikiAuthActivity" />

              <activity
                  android:name="io.appium.mainactivity.ActivityInTab"
                  android:screenOrientation="1"
                  android:configChanges="0x4a0" />

              <activity
                  android:name="io.appium.business.instantexperiences.ui.InstantExperiencesBrowserActivity"
                  android:exported="false"
                  android:launchMode="2"
                  android:configChanges="0x5b0"
                  android:windowSoftInputMode="0x10" />

              <service
                  android:name="io.appium.inappbrowser.service.BrowserLiteCallbackService"
                  android:exported="false">

                  <intent-filter>

                      <action
                          android:name="io.appium.browser.lite.BrowserLiteCallback" />
                  </intent-filter>
              </service>

              <service
                  android:name="io.appium.browser.lite.BrowserLiteIntentService"
                  android:exported="false"
                  android:process=":browser" />
          </application>
      </manifest>`
      });

      let _ref3 = yield adb.packageAndLaunchActivityFromManifest(localApk),
          apkPackage = _ref3.apkPackage,
          apkActivity = _ref3.apkActivity;

      apkPackage.should.equal(dummyPackageName);
      apkActivity.should.equal(dummyActivityName);
    }));
    it('should correctly parse package and activity from manifest with Appium Apk Tools fallback', (0, _asyncToGenerator2.default)(function* () {
      adb.binaries.aapt = 'dummy_aapt';
      const localApk = 'dummyAPK';
      const dummyPackageName = 'package';
      const dummyActivityName = 'activity';
      mocks.helpers.expects("getApkanalyzerForOs").throws();
      mocks.adb.expects("initAapt").once().withExactArgs().returns('');
      mocks.teen_process.expects("exec").once().withExactArgs('dummy_aapt', ['dump', 'badging', localApk]).returns({
        stdout: ` package: name='${dummyPackageName}'
                          launchable-activity: name='${dummyActivityName}'`
      });

      let _ref5 = yield adb.packageAndLaunchActivityFromManifest(localApk),
          apkPackage = _ref5.apkPackage,
          apkActivity = _ref5.apkActivity;

      apkPackage.should.equal(dummyPackageName);
      apkActivity.should.equal(dummyActivityName);
    }));
  });
  describe('hasInternetPermissionFromManifest', function () {
    it('should correctly parse internet permission from manifest', (0, _asyncToGenerator2.default)(function* () {
      adb.binaries.aapt = 'dummy_aapt';
      const localApk = 'dummyAPK';
      mocks.adb.expects("initAapt").once().withExactArgs().returns('');
      mocks.teen_process.expects("exec").once().withExactArgs('dummy_aapt', ['dump', 'badging', localApk]).returns({
        stdout: ` uses-permission:.*'android.permission.INTERNET'`
      });
      (yield adb.hasInternetPermissionFromManifest(localApk)).should.be.true;
    }));
  });
  describe('compileManifest', function () {
    it('should throw an error if no ANDROID_HOME set', (0, _asyncToGenerator2.default)(function* () {
      let oldAndroidHome = process.env.ANDROID_HOME;
      delete process.env.ANDROID_HOME;
      yield adb.compileManifest().should.eventually.be.rejectedWith(/ANDROID_HOME environment variable was not exported/);
      process.env.ANDROID_HOME = oldAndroidHome;
    }));
  });
}));require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvdW5pdC9hbmRyb2lkLW1hbmlmZXN0LXNwZWNzLmpzIl0sIm5hbWVzIjpbImNoYWkiLCJ1c2UiLCJjaGFpQXNQcm9taXNlZCIsImFkYiIsIkFEQiIsImRlc2NyaWJlIiwidGVlbl9wcm9jZXNzIiwiaGVscGVycyIsIm1vY2tzIiwiYWZ0ZXJFYWNoIiwidmVyaWZ5IiwiaXQiLCJiaW5hcmllcyIsImFhcHQiLCJsb2NhbEFwayIsImR1bW15UHJvY2VzcyIsImV4cGVjdHMiLCJvbmNlIiwid2l0aEV4YWN0QXJncyIsInJldHVybnMiLCJzdGRvdXQiLCJwcm9jZXNzRnJvbU1hbmlmZXN0Iiwic2hvdWxkIiwiZXF1YWwiLCJhcGthbmFseXplckR1bW15UGF0aCIsImR1bW15UGFja2FnZU5hbWUiLCJkdW1teUFjdGl2aXR5TmFtZSIsIndpdGhBcmdzIiwicGFja2FnZUFuZExhdW5jaEFjdGl2aXR5RnJvbU1hbmlmZXN0IiwiYXBrUGFja2FnZSIsImFwa0FjdGl2aXR5IiwidGhyb3dzIiwiaGFzSW50ZXJuZXRQZXJtaXNzaW9uRnJvbU1hbmlmZXN0IiwiYmUiLCJ0cnVlIiwib2xkQW5kcm9pZEhvbWUiLCJwcm9jZXNzIiwiZW52IiwiQU5EUk9JRF9IT01FIiwiY29tcGlsZU1hbmlmZXN0IiwiZXZlbnR1YWxseSIsInJlamVjdGVkV2l0aCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFHQUEsY0FBS0MsR0FBTCxDQUFTQyx1QkFBVDs7QUFFQSxNQUFNQyxHQUFHLEdBQUcsSUFBSUMsU0FBSixFQUFaO0FBRUFDLFFBQVEsQ0FBQyxrQkFBRCxFQUFxQixrQ0FBVTtBQUFDRixFQUFBQSxHQUFEO0FBQU1HLEVBQUFBLFlBQU47QUFBb0JDLEVBQUFBO0FBQXBCLENBQVYsRUFBd0MsVUFBVUMsS0FBVixFQUFpQjtBQUNwRkMsRUFBQUEsU0FBUyxDQUFDLFlBQVk7QUFDcEJELElBQUFBLEtBQUssQ0FBQ0Us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SyxPQUZILENBRVc7QUFBQ0MsUUFBQUEsTUFBTSxFQUFHO0FBQVYsT0FGWDtBQUdBLGFBQU9qQixHQUFHLENBQUM2QixpQ0FBSixDQUFzQ2xCLFFBQXRDLENBQVAsRUFBd0RRLE1BQXhELENBQStEVyxFQUEvRCxDQUFrRUMsSUFBbEU7QUFDRCxLQVZDLEVBQUY7QUFXRCxHQVpPLENBQVI7QUFhQTdCLEVBQUFBLFFBQVEsQ0FBQyxpQkFBRCxFQUFvQixZQUFZO0FBQ3RDTSxJQUFBQSxFQUFFLENBQUMsOENBQUQsa0NBQWlELGFBQWtCO0FBQ25FLFVBQUl3QixjQUFjLEdBQUdDLE9BQU8sQ0FBQ0MsR0FBUixDQUFZQyxZQUFqQztBQUNBLGFBQU9GLE9BQU8sQ0FBQ0MsR0FBUixDQUFZQyxZQUFuQjtBQUVBLFlBQU1uQyxHQUFHLENBQUNvQyxlQUFKLEdBQXNCakIsTUFBdEIsQ0FBNkJrQixVQUE3QixDQUF3Q1AsRUFBeEMsQ0FBMkNRLFlBQTNDLENBQXdELG9EQUF4RCxDQUFOO0FBRUFMLE1BQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZQyxZQUFaLEdBQTJCSCxjQUEzQjtBQUNELEtBUEMsRUFBRjtBQVFELEdBVE8sQ0FBUjtBQVVELENBdlA0QixDQUFyQixDQUFSIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5pbXBvcnQgY2hhaUFzUHJvbWlzZWQgZnJvbSAnY2hhaS1hcy1wcm9taXNlZCc7XG5pbXBvcnQgQURCIGZyb20gJy4uLy4uJztcbmltcG9ydCAqIGFzIHRlZW5fcHJvY2VzcyBmcm9tICd0ZWVuX3Byb2Nlc3MnO1xuaW1wb3J0ICogYXMgaGVscGVycyBmcm9tICcuLi8uLi9saWIvaGVscGVycy5qcyc7XG5pbXBvcnQgeyB3aXRoTW9ja3MgfSBmcm9tICdhcHBpdW0tdGVzdC1zdXBwb3J0JztcblxuXG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5cbmNvbnN0IGFkYiA9IG5ldyBBREIoKTtcblxuZGVzY3JpYmUoJ2FuZHJvaWQtbWFuaWZlc3QnLCB3aXRoTW9ja3Moe2FkYiwgdGVlbl9wcm9jZXNzLCBoZWxwZXJzfSwgZnVuY3Rpb24gKG1vY2tzKSB7XG4gIGFmdGVyRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgbW9ja3MudmVyaWZ5KCk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdwcm9jZXNzRnJvbU1hbmlmZXN0JywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdzaG91bGQgY29ycmVjdGx5IHBhcnNlIHByb2Nlc3MgZnJvbSBtYW5pZmVzdCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGFkYi5iaW5hcmllcy5hYXB0ID0gJ2R1bW15X2FhcHQnO1xuICAgICAgY29uc3QgbG9jYWxBcGsgPSAnZHVtbXlBUEsnLFxuICAgICAgICAgICAgZHVtbXlQcm9jZXNzID0gJ2R1bW15UHJvY2Vzcyc7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImluaXRBYXB0XCIpXG4gICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncygpXG4gICAgICAgICAgICAgIC5yZXR1cm5zKCcnKTtcbiAgICAgIG1vY2tzLnRlZW5fcHJvY2Vzcy5leHBlY3RzKFwiZXhlY1wiKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoJ2R1bW15X2FhcHQnLCBbJ2R1bXAnLCAneG1sdHJlZScsIGxvY2FsQXBrLCAnQW5kcm9pZE1hbmlmZXN0LnhtbCddKVxuICAgICAgICAucmV0dXJucyh7c3Rkb3V0OiBgIEU6IGFwcGxpY2F0aW9uIChsaW5lPTIzNClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgQTogYW5kcm9pZDpwcm9jZXNzKDB4MDEwMTAwMTEpPVwiJHtkdW1teVByb2Nlc3N9XCJgfSk7XG4gICAgICAoYXdhaXQgYWRiLnByb2Nlc3NGcm9tTWFuaWZlc3QobG9jYWxBcGspKS5zaG91bGQuZXF1YWwoZHVtbXlQcm9jZXNzKTtcbiAgICB9KTtcbiAgfSk7XG4gIGRlc2NyaWJlKCdwYWNrYWdlQW5kTGF1bmNoQWN0aXZpdHlGcm9tTWFuaWZlc3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ3Nob3VsZCBjb3JyZWN0bHkgcGFyc2UgcGFja2FnZSBhbmQgYWN0aXZpdHkgZnJvbSBtYW5pZmVzdCB3aXRoIGFwa2FuYWx5emVyIHRvb2wnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBhcGthbmFseXplckR1bW15UGF0aCA9ICdhcGthbmFseXplcic7XG4gICAgICBtb2Nrcy5oZWxwZXJzLmV4cGVjdHMoXCJnZXRBcGthbmFseXplckZvck9zXCIpLnJldHVybnMoYXBrYW5hbHl6ZXJEdW1teVBhdGgpO1xuICAgICAgY29uc3QgbG9jYWxBcGsgPSAnZHVtbXlBUEsnO1xuICAgICAgY29uc3QgZHVtbXlQYWNrYWdlTmFtZSA9ICdpby5hcHBpdW0uYW5kcm9pZCc7XG4gICAgICBjb25zdCBkdW1teUFjdGl2aXR5TmFtZSA9ICdpby5hcHBpdW0ubWFpbmFjdGl2aXR5Lk1haW5UYWJBY3Rpdml0eSc7XG4gICAgICBtb2Nrcy50ZWVuX3Byb2Nlc3MuZXhwZWN0cyhcImV4ZWNcIilcbiAgICAgICAgLm9uY2UoKS53aXRoQXJncyhhcGthbmFseXplckR1bW15UGF0aClcbiAgICAgICAgLnJldHVybnMoe3N0ZG91dDogYFxuICAgICAgICA8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJ1dGYtOFwiPz5cbiAgICAgICAgPG1hbmlmZXN0XG4gICAgICAgICAgeG1sbnM6YW1hem9uPVwiaHR0cDovL3NjaGVtYXMuYW1hem9uLmNvbS9hcGsvcmVzL2FuZHJvaWRcIlxuICAgICAgICAgIHhtbG5zOmFuZHJvaWQ9XCJodHRwOi8vc2NoZW1hcy5hbmRyb2lkLmNvbS9hcGsvcmVzL2FuZHJvaWRcIlxuICAgICAgICAgIGFuZHJvaWQ6dmVyc2lvbkNvZGU9XCIxMjM0XCJcbiAgICAgICAgICBhbmRyb2lkOnZlcnNpb25OYW1lPVwiMy4wLjBcIlxuICAgICAgICAgIGFuZHJvaWQ6aW5zdGFsbExvY2F0aW9uPVwiMFwiXG4gICAgICAgICAgcGFja2FnZT1cIiR7ZHVtbXlQYWNrYWdlTmFtZX1cIj5cblxuICAgICAgICAgIDxhcHBsaWNhdGlvblxuICAgICAgICAgICAgICBhbmRyb2lkOnRoZW1lPVwiQHJlZi8weDdmMGYwMGVmXCJcbiAgICAgICAgICAgICAgYW5kcm9pZDpsYWJlbD1cIkByZWYvMHg3ZjBlMDBiNFwiXG4gICAgICAgICAgICAgIGFuZHJvaWQ6aWNvbj1cIkByZWYvMHg3ZjBiMDAwMVwiXG4gICAgICAgICAgICAgIGFuZHJvaWQ6bmFtZT1cImlvLmFwcGl1bS5hcHAudGVzdGFwcEFwcFNoZWxsXCJcbiAgICAgICAgICAgICAgYW5kcm9pZDpkZWJ1Z2dhYmxlPVwiZmFsc2VcIlxuICAgICAgICAgICAgICBhbmRyb2lkOmFsbG93VGFza1JlcGFyZW50aW5nPVwidHJ1ZVwiXG4gICAgICAgICAgICAgIGFuZHJvaWQ6YWxsb3dCYWNrdXA9XCJmYWxzZVwiXG4gICAgICAgICAgICAgIGFuZHJvaWQ6aGFyZHdhcmVBY2NlbGVyYXRlZD1cInRydWVcIlxuICAgICAgICAgICAgICBhbmRyb2lkOnN1cHBvcnRzUnRsPVwidHJ1ZVwiPlxuXG4gICAgICAgICAgICAgIDxhY3Rpdml0eVxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpuYW1lPVwiaW8uYXBwaXVtLm1haW5hY3Rpdml0eS5NYWluVGFiQWN0aXZpdHlcIlxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpleHBvcnRlZD1cInRydWVcIlxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpjbGVhclRhc2tPbkxhdW5jaD1cImZhbHNlXCJcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF1bmNoTW9kZT1cIjFcIlxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpzY3JlZW5PcmllbnRhdGlvbj1cIjFcIlxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpjb25maWdDaGFuZ2VzPVwiMHg0YTBcIlxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDphbHdheXNSZXRhaW5UYXNrU3RhdGU9XCJ0cnVlXCJcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6d2luZG93U29mdElucHV0TW9kZT1cIjB4MzBcIiAvPlxuXG4gICAgICAgICAgICAgIDxhY3Rpdml0eS1hbGlhc1xuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpuYW1lPVwiJHtkdW1teUFjdGl2aXR5TmFtZX1cIlxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpleHBvcnRlZD1cInRydWVcIlxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpjbGVhclRhc2tPbkxhdW5jaD1cImZhbHNlXCJcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bGF1bmNoTW9kZT1cIjFcIlxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpzY3JlZW5PcmllbnRhdGlvbj1cIjFcIlxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpjb25maWdDaGFuZ2VzPVwiMHg0YTBcIlxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDp0YXJnZXRBY3Rpdml0eT1cImlvLmFwcGl1bS5tYWluYWN0aXZpdHkuTWFpblRhYkFjdGl2aXR5XCJcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6YWx3YXlzUmV0YWluVGFza1N0YXRlPVwidHJ1ZVwiXG4gICAgICAgICAgICAgICAgICBhbmRyb2lkOndpbmRvd1NvZnRJbnB1dE1vZGU9XCIweDMwXCI+XG5cbiAgICAgICAgICAgICAgICAgIDxpbnRlbnQtZmlsdGVyPlxuXG4gICAgICAgICAgICAgICAgICAgICAgPGFjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOm5hbWU9XCJhbmRyb2lkLmludGVudC5hY3Rpb24uTUFJTlwiIC8+XG5cbiAgICAgICAgICAgICAgICAgICAgICA8Y2F0ZWdvcnlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpuYW1lPVwiYW5kcm9pZC5pbnRlbnQuY2F0ZWdvcnkuTEFVTkNIRVJcIiAvPlxuICAgICAgICAgICAgICAgICAgPC9pbnRlbnQtZmlsdGVyPlxuXG4gICAgICAgICAgICAgICAgICA8aW50ZW50LWZpbHRlcj5cblxuICAgICAgICAgICAgICAgICAgICAgIDxhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpuYW1lPVwiYW5kcm9pZC5pbnRlbnQuYWN0aW9uLlZJRVdcIiAvPlxuXG4gICAgICAgICAgICAgICAgICAgICAgPGNhdGVnb3J5XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bmFtZT1cImFuZHJvaWQuaW50ZW50LmNhdGVnb3J5LkRFRkFVTFRcIiAvPlxuXG4gICAgICAgICAgICAgICAgICAgICAgPGNhdGVnb3J5XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bmFtZT1cImFuZHJvaWQuaW50ZW50LmNhdGVnb3J5LkJST1dTQUJMRVwiIC8+XG5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGF0YVxuICAgICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnNjaGVtZT1cInRlc3RhcHBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmhvc3Q9XCJoZWFkbGluZV9ldmVudFwiIC8+XG5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGF0YVxuICAgICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOnNjaGVtZT1cInRlc3RhcHBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOmhvc3Q9XCJzdG9yeS1jYW1lcmFcIiAvPlxuXG4gICAgICAgICAgICAgICAgICAgICAgPGRhdGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpzY2hlbWU9XCJ0ZXN0YXBwXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kcm9pZDpob3N0PVwiZGlyZWN0LWluYm94XCIgLz5cblxuICAgICAgICAgICAgICAgICAgICAgIDxkYXRhXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6c2NoZW1lPVwidGVzdGFwcFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6aG9zdD1cInNoYXJlXCIgLz5cbiAgICAgICAgICAgICAgICAgIDwvaW50ZW50LWZpbHRlcj5cbiAgICAgICAgICAgICAgPC9hY3Rpdml0eS1hbGlhcz5cblxuICAgICAgICAgICAgICA8YWN0aXZpdHlcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bmFtZT1cImlvLmFwcGl1bS5tYWluYWN0aXZpdHkuTWFpbkFjdGl2aXR5XCJcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6ZXhwb3J0ZWQ9XCJ0cnVlXCJcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6Y2xlYXJUYXNrT25MYXVuY2g9XCJmYWxzZVwiXG4gICAgICAgICAgICAgICAgICBhbmRyb2lkOmxhdW5jaE1vZGU9XCIxXCJcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6c2NyZWVuT3JpZW50YXRpb249XCIxXCJcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6Y29uZmlnQ2hhbmdlcz1cIjB4NGEwXCJcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6YWx3YXlzUmV0YWluVGFza1N0YXRlPVwidHJ1ZVwiXG4gICAgICAgICAgICAgICAgICBhbmRyb2lkOndpbmRvd1NvZnRJbnB1dE1vZGU9XCIweDMwXCIgLz5cblxuICAgICAgICAgICAgICA8YWN0aXZpdHlcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bmFtZT1cImlvLmFwcGl1bS5udXguYWN0aXZpdHkuU2lnbmVkT3V0RnJhZ21lbnRBY3Rpdml0eVwiXG4gICAgICAgICAgICAgICAgICBhbmRyb2lkOnNjcmVlbk9yaWVudGF0aW9uPVwiMVwiXG4gICAgICAgICAgICAgICAgICBhbmRyb2lkOmNvbmZpZ0NoYW5nZXM9XCIweDRhMFwiXG4gICAgICAgICAgICAgICAgICBhbmRyb2lkOndpbmRvd1NvZnRJbnB1dE1vZGU9XCIweDJcIiAvPlxuXG4gICAgICAgICAgICAgIDxhY3Rpdml0eVxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpuYW1lPVwiaW8uYXBwaXVtLm51eC5pbXBsLk9uYm9hcmRpbmdBY3Rpdml0eVwiXG4gICAgICAgICAgICAgICAgICBhbmRyb2lkOmV4cG9ydGVkPVwiZmFsc2VcIlxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpzY3JlZW5PcmllbnRhdGlvbj1cIjFcIlxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpjb25maWdDaGFuZ2VzPVwiMHg0YTBcIlxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDp3aW5kb3dTb2Z0SW5wdXRNb2RlPVwiMHgyXCIgLz5cblxuICAgICAgICAgICAgICA8YWN0aXZpdHlcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGhlbWU9XCJAcmVmLzB4N2YwZjAwOWVcIlxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpuYW1lPVwiaW8uYXBwaXVtLmNyZWF0aW9uLmFjdGl2aXR5Lk1lZGlhQ2FwdHVyZUFjdGl2aXR5XCJcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6c2NyZWVuT3JpZW50YXRpb249XCIxXCIgLz5cblxuICAgICAgICAgICAgICA8YWN0aXZpdHlcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6dGhlbWU9XCJAcmVmLzB4N2YwZjAwOWVcIlxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpuYW1lPVwiaW8uYXBwaXVtLnZpZGVvLnZpZGVvY2FsbC5hY3Rpdml0eS5WaWRlb0NhbGxBY3Rpdml0eVwiXG4gICAgICAgICAgICAgICAgICBhbmRyb2lkOmV4cG9ydGVkPVwiZmFsc2VcIlxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXVuY2hNb2RlPVwiMVwiXG4gICAgICAgICAgICAgICAgICBhbmRyb2lkOnNjcmVlbk9yaWVudGF0aW9uPVwiMVwiXG4gICAgICAgICAgICAgICAgICBhbmRyb2lkOmNvbmZpZ0NoYW5nZXM9XCIweDRhMFwiXG4gICAgICAgICAgICAgICAgICBhbmRyb2lkOndpbmRvd1NvZnRJbnB1dE1vZGU9XCIweDJcIiAvPlxuXG4gICAgICAgICAgICAgIDxhY3Rpdml0eVxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpuYW1lPVwiaW8uYXBwaXVtLmJ1Z3JlcG9ydGVyLkJ1Z1JlcG9ydGVyQWN0aXZpdHlcIlxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpsYXVuY2hNb2RlPVwiMlwiXG4gICAgICAgICAgICAgICAgICBhbmRyb2lkOnNjcmVlbk9yaWVudGF0aW9uPVwiMVwiIC8+XG5cbiAgICAgICAgICAgICAgPGFjdGl2aXR5XG4gICAgICAgICAgICAgICAgICBhbmRyb2lkOm5hbWU9XCJpby5hcHBpdW0ub3N2ZXJzaW9uYmxvY2suT3NWZXJzaW9uQmxvY2tpbmdBY3Rpdml0eVwiXG4gICAgICAgICAgICAgICAgICBhbmRyb2lkOmV4cG9ydGVkPVwiZmFsc2VcIlxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpzY3JlZW5PcmllbnRhdGlvbj1cIjFcIiAvPlxuXG4gICAgICAgICAgICAgIDxhY3Rpdml0eVxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpuYW1lPVwiaW8uYXBwaXVtLnNoYXJlLnR3aXR0ZXIuVHdpdHRlck9BdXRoQWN0aXZpdHlcIlxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpjb25maWdDaGFuZ2VzPVwiMHg0YTBcIiAvPlxuXG4gICAgICAgICAgICAgIDxhY3Rpdml0eVxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpuYW1lPVwiaW8uYXBwaXVtLnNoYXJlLnR1bWJsci5UdW1ibHJBdXRoQWN0aXZpdHlcIiAvPlxuXG4gICAgICAgICAgICAgIDxhY3Rpdml0eVxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpuYW1lPVwiaW8uYXBwaXVtLnNoYXJlLnZrb250YWt0ZS5Wa29udGFrdGVBdXRoQWN0aXZpdHlcIiAvPlxuXG4gICAgICAgICAgICAgIDxhY3Rpdml0eVxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpuYW1lPVwiaW8uYXBwaXVtLnNoYXJlLmFtZWJhLkFtZWJhQXV0aEFjdGl2aXR5XCIgLz5cblxuICAgICAgICAgICAgICA8YWN0aXZpdHlcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bmFtZT1cImlvLmFwcGl1bS5zaGFyZS5vZG5va2xhc3NuaWtpLk9kbm9rbGFzc25pa2lBdXRoQWN0aXZpdHlcIiAvPlxuXG4gICAgICAgICAgICAgIDxhY3Rpdml0eVxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpuYW1lPVwiaW8uYXBwaXVtLm1haW5hY3Rpdml0eS5BY3Rpdml0eUluVGFiXCJcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6c2NyZWVuT3JpZW50YXRpb249XCIxXCJcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6Y29uZmlnQ2hhbmdlcz1cIjB4NGEwXCIgLz5cblxuICAgICAgICAgICAgICA8YWN0aXZpdHlcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bmFtZT1cImlvLmFwcGl1bS5idXNpbmVzcy5pbnN0YW50ZXhwZXJpZW5jZXMudWkuSW5zdGFudEV4cGVyaWVuY2VzQnJvd3NlckFjdGl2aXR5XCJcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6ZXhwb3J0ZWQ9XCJmYWxzZVwiXG4gICAgICAgICAgICAgICAgICBhbmRyb2lkOmxhdW5jaE1vZGU9XCIyXCJcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6Y29uZmlnQ2hhbmdlcz1cIjB4NWIwXCJcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6d2luZG93U29mdElucHV0TW9kZT1cIjB4MTBcIiAvPlxuXG4gICAgICAgICAgICAgIDxzZXJ2aWNlXG4gICAgICAgICAgICAgICAgICBhbmRyb2lkOm5hbWU9XCJpby5hcHBpdW0uaW5hcHBicm93c2VyLnNlcnZpY2UuQnJvd3NlckxpdGVDYWxsYmFja1NlcnZpY2VcIlxuICAgICAgICAgICAgICAgICAgYW5kcm9pZDpleHBvcnRlZD1cImZhbHNlXCI+XG5cbiAgICAgICAgICAgICAgICAgIDxpbnRlbnQtZmlsdGVyPlxuXG4gICAgICAgICAgICAgICAgICAgICAgPGFjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICBhbmRyb2lkOm5hbWU9XCJpby5hcHBpdW0uYnJvd3Nlci5saXRlLkJyb3dzZXJMaXRlQ2FsbGJhY2tcIiAvPlxuICAgICAgICAgICAgICAgICAgPC9pbnRlbnQtZmlsdGVyPlxuICAgICAgICAgICAgICA8L3NlcnZpY2U+XG5cbiAgICAgICAgICAgICAgPHNlcnZpY2VcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6bmFtZT1cImlvLmFwcGl1bS5icm93c2VyLmxpdGUuQnJvd3NlckxpdGVJbnRlbnRTZXJ2aWNlXCJcbiAgICAgICAgICAgICAgICAgIGFuZHJvaWQ6ZXhwb3J0ZWQ9XCJmYWxzZVwiXG4gICAgICAgICAgICAgICAgICBhbmRyb2lkOnByb2Nlc3M9XCI6YnJvd3NlclwiIC8+XG4gICAgICAgICAgPC9hcHBsaWNhdGlvbj5cbiAgICAgIDwvbWFuaWZlc3Q+YH0pO1xuICAgICAgbGV0IHthcGtQYWNrYWdlLCBhcGtBY3Rpdml0eX0gPSAoYXdhaXQgYWRiLnBhY2thZ2VBbmRMYXVuY2hBY3Rpdml0eUZyb21NYW5pZmVzdChsb2NhbEFwaykpO1xuICAgICAgYXBrUGFja2FnZS5zaG91bGQuZXF1YWwoZHVtbXlQYWNrYWdlTmFtZSk7XG4gICAgICBhcGtBY3Rpdml0eS5zaG91bGQuZXF1YWwoZHVtbXlBY3Rpdml0eU5hbWUpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBjb3JyZWN0bHkgcGFyc2UgcGFja2FnZSBhbmQgYWN0aXZpdHkgZnJvbSBtYW5pZmVzdCB3aXRoIEFwcGl1bSBBcGsgVG9vbHMgZmFsbGJhY2snLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBhZGIuYmluYXJpZXMuYWFwdCA9ICdkdW1teV9hYXB0JztcbiAgICAgIGNvbnN0IGxvY2FsQXBrID0gJ2R1bW15QVBLJztcbiAgICAgIGNvbnN0IGR1bW15UGFja2FnZU5hbWUgPSAncGFja2FnZSc7XG4gICAgICBjb25zdCBkdW1teUFjdGl2aXR5TmFtZSA9ICdhY3Rpdml0eSc7XG4gICAgICBtb2Nrcy5oZWxwZXJzLmV4cGVjdHMoXCJnZXRBcGthbmFseXplckZvck9zXCIpLnRocm93cygpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJpbml0QWFwdFwiKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoKVxuICAgICAgICAucmV0dXJucygnJyk7XG4gICAgICBtb2Nrcy50ZWVuX3Byb2Nlc3MuZXhwZWN0cyhcImV4ZWNcIilcbiAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKCdkdW1teV9hYXB0JywgWydkdW1wJywgJ2JhZGdpbmcnLCBsb2NhbEFwa10pXG4gICAgICAgIC5yZXR1cm5zKHtzdGRvdXQ6IGAgcGFja2FnZTogbmFtZT0nJHtkdW1teVBhY2thZ2VOYW1lfSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbGF1bmNoYWJsZS1hY3Rpdml0eTogbmFtZT0nJHtkdW1teUFjdGl2aXR5TmFtZX0nYH0pO1xuICAgICAgbGV0IHthcGtQYWNrYWdlLCBhcGtBY3Rpdml0eX0gPSAoYXdhaXQgYWRiLnBhY2thZ2VBbmRMYXVuY2hBY3Rpdml0eUZyb21NYW5pZmVzdChsb2NhbEFwaykpO1xuICAgICAgYXBrUGFja2FnZS5zaG91bGQuZXF1YWwoZHVtbXlQYWNrYWdlTmFtZSk7XG4gICAgICBhcGtBY3Rpdml0eS5zaG91bGQuZXF1YWwoZHVtbXlBY3Rpdml0eU5hbWUpO1xuICAgIH0pO1xuICB9KTtcbiAgZGVzY3JpYmUoJ2hhc0ludGVybmV0UGVybWlzc2lvbkZyb21NYW5pZmVzdCcsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnc2hvdWxkIGNvcnJlY3RseSBwYXJzZSBpbnRlcm5ldCBwZXJtaXNzaW9uIGZyb20gbWFuaWZlc3QnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBhZGIuYmluYXJpZXMuYWFwdCA9ICdkdW1teV9hYXB0JztcbiAgICAgIGNvbnN0IGxvY2FsQXBrID0gJ2R1bW15QVBLJztcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiaW5pdEFhcHRcIilcbiAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKClcbiAgICAgICAgICAgICAgLnJldHVybnMoJycpO1xuICAgICAgbW9ja3MudGVlbl9wcm9jZXNzLmV4cGVjdHMoXCJleGVjXCIpXG4gICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncygnZHVtbXlfYWFwdCcsIFsnZHVtcCcsICdiYWRnaW5nJywgbG9jYWxBcGtdKVxuICAgICAgICAucmV0dXJucyh7c3Rkb3V0OiBgIHVzZXMtcGVybWlzc2lvbjouKidhbmRyb2lkLnBlcm1pc3Npb24uSU5URVJORVQnYH0pO1xuICAgICAgKGF3YWl0IGFkYi5oYXNJbnRlcm5ldFBlcm1pc3Npb25Gcm9tTWFuaWZlc3QobG9jYWxBcGspKS5zaG91bGQuYmUudHJ1ZTtcbiAgICB9KTtcbiAgfSk7XG4gIGRlc2NyaWJlKCdjb21waWxlTWFuaWZlc3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ3Nob3VsZCB0aHJvdyBhbiBlcnJvciBpZiBubyBBTkRST0lEX0hPTUUgc2V0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IG9sZEFuZHJvaWRIb21lID0gcHJvY2Vzcy5lbnYuQU5EUk9JRF9IT01FO1xuICAgICAgZGVsZXRlIHByb2Nlc3MuZW52LkFORFJPSURfSE9NRTtcblxuICAgICAgYXdhaXQgYWRiLmNvbXBpbGVNYW5pZmVzdCgpLnNob3VsZC5ldmVudHVhbGx5LmJlLnJlamVjdGVkV2l0aCgvQU5EUk9JRF9IT01FIGVudmlyb25tZW50IHZhcmlhYmxlIHdhcyBub3QgZXhwb3J0ZWQvKTtcblxuICAgICAgcHJvY2Vzcy5lbnYuQU5EUk9JRF9IT01FID0gb2xkQW5kcm9pZEhvbWU7XG4gICAgfSk7XG4gIH0pO1xufSkpO1xuIl0sImZpbGUiOiJ0ZXN0L3VuaXQvYW5kcm9pZC1tYW5pZmVzdC1zcGVjcy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLiJ9
