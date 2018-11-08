"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _chai = _interopRequireDefault(require("chai"));

var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));

var teen_process = _interopRequireWildcard(require("teen_process"));

var _appiumSupport = require("appium-support");

var _ = _interopRequireDefault(require("../.."));

var _appiumTestSupport = require("appium-test-support");

var _path = _interopRequireDefault(require("path"));

_chai.default.use(_chaiAsPromised.default);

const should = _chai.default.should(),
      pkg = 'com.example.android.contactmanager',
      uri = 'content://contacts/people/1',
      act = '.ContactManager',
      startAppOptions = {
  stopApp: true,
  action: 'action',
  category: 'cat',
  flags: 'flags',
  pkg: 'pkg',
  activity: 'act',
  optionalIntentArguments: '-x options -y option argument -z option arg with spaces'
},
      cmd = ['am', 'start', '-W', '-n', 'pkg/act', '-S', '-a', 'action', '-c', 'cat', '-f', 'flags', '-x', 'options', '-y', 'option', 'argument', '-z', 'option', 'arg with spaces'],
      language = 'en',
      country = 'US',
      locale = 'en-US';

const adb = new _.default({
  adbExecTimeout: 60000
});
describe('Apk-utils', (0, _appiumTestSupport.withMocks)({
  adb,
  fs: _appiumSupport.fs,
  teen_process
}, function (mocks) {
  afterEach(function () {
    mocks.verify();
  });
  describe('isAppInstalled', function () {
    it('should parse correctly and return true', (0, _asyncToGenerator2.default)(function* () {
      const pkg = 'dummy.package';
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'package', pkg]).returns(`Packages:
          Package [${pkg}] (2469669):
            userId=2000`);
      (yield adb.isAppInstalled(pkg)).should.be.true;
    }));
    it('should parse correctly and return false', (0, _asyncToGenerator2.default)(function* () {
      const pkg = 'dummy.package';
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'package', pkg]).returns(`Dexopt state:
          Unable to find package: ${pkg}`);
      (yield adb.isAppInstalled(pkg)).should.be.false;
    }));
  });
  describe('extractStringsFromApk', function () {
    it('should fallback to default if en locale is not present in the config', (0, _asyncToGenerator2.default)(function* () {
      mocks.teen_process.expects('exec').onCall(0).returns({
        stdout: `
      Package Groups (1)
      Package Group 0 id=0x7f packageCount=1 name=io.appium.android.apis
      Package 0 id=0x7f name=io.appium.android.apis
        type 0 configCount=1 entryCount=6
          config (default):
            resource 0x7f0c0215 io.appium.android.apis:string/linear_layout_8_vertical: t=0x03 d=0x0000044c (s=0x0008 r=0x00)
              (string16) "Vertical"
            resource 0x7f0c0216 io.appium.android.apis:string/linear_layout_8_horizontal: t=0x03 d=0x0000044d (s=0x0008 r=0x00)
              (string16) "Horizontal"
          config fr:
            resource 0x7f0c0215 io.appium.android.apis:string/linear_layout_8_vertical: t=0x03 d=0x0000044c (s=0x0008 r=0x00)
              (string16) "Vertical"
            resource 0x7f0c0216 io.appium.android.apis:string/linear_layout_8_horizontal: t=0x03 d=0x0000044d (s=0x0008 r=0x00)
              (string16) "Horizontal"
      `
      });
      mocks.teen_process.expects('exec').returns({
        stdout: `
      nodpi-v4

      xlarge-v4
      v9
      v11
      v12
      v13
      w600dp-v13
      w720dp-v13
      w1024dp-v13
      h550dp-v13
      h670dp-v13
      h974dp-v13
      sw480dp-v13
      sw600dp-v13
      sw720dp-v13
      v14
      v16
      v17
      land
      land-v13
      ldpi-v4
      mdpi-v4
      hdpi-v4
      xhdpi-v4
      fr
      `
      });
      mocks.fs.expects('writeFile').once();

      const _ref4 = yield adb.extractStringsFromApk('/fake/path.apk', 'en', '/tmp'),
            apkStrings = _ref4.apkStrings,
            localPath = _ref4.localPath;

      apkStrings.linear_layout_8_horizontal.should.eql('Horizontal');
      localPath.should.eql(_path.default.resolve('/tmp', 'strings.json'));
    }));
    it('should properly parse aapt output', (0, _asyncToGenerator2.default)(function* () {
      mocks.teen_process.expects('exec').once().returns({
        stdout: `
        Package Groups (1)
        Package Group 0 id=0x7f packageCount=1 name=io.appium.test
          Package 0 id=0x7f name=io.appium.test
            type 0 configCount=1 entryCount=685
              spec resource 0x7f010000 io.appium.test:attr/audioMessageDuration: flags=0x00000000
              spec resource 0x7f010001 io.appium.test:attr/callingChatheadFooter: flags=0x00000000
              spec resource 0x7f010002 io.appium.test:attr/callingChatheadInitials: flags=0x00000000
              spec resource 0x7f010003 io.appium.test:attr/callingControlButtonLabel: flags=0x00000000
              spec resource 0x7f010004 io.appium.test:attr/circleRadius: flags=0x00000000
              config de-rDE:
                resource 0x7f010000 io.appium.test:attr/audioMessageDuration: <bag>
                  Parent=0x00000000(Resolved=0x7f000000), Count=1
                  #0 (Key=0x01000000): (color) #00000001
                resource 0x7f010001 io.appium.test:attr/callingChatheadFooter: <bag>
                  Parent=0x00000000(Resolved=0x7f000000), Count=1
                  #0 (Key=0x01000000): (color) #00000001
              config de-rDE:
                resource 0x7f080000 io.appium.test:string/abc_action_bar_home_description: t=0x03 d=0x00000c27 (s=0x0008 r=0x00)
                  (string8) "Navigate \\"home\\""
                resource 0x7f080001 io.appium.test:string/abc_action_bar_home_description_format: t=0x03 d=0x00000ad1 (s=0x0008 r=0x00)
                  (string8) "%1$s, %2$s"
                resource 0x7f080002 io.appium.test:string/abc_action_bar_home_subtitle_description_format: t=0x03 d=0x00000ad0 (s=0x0008 r=0x00)
                  (string8) "%1$s, %2$s, %3$s"
            type 1 configCount=1 entryCount=685
              config de-rDE:
                resource 0x7f0a0000 io.appium.test:plurals/calling__conversation_full__message: <bag>
                  Parent=0x00000000(Resolved=0x7f000000), Count=2
                  #0 (Key=0x01000004): (string8) "Calls work in conversations with up to 1 person."
                  #1 (Key=0x01000005): (string8) "Calls work in conversations with up to %1$d people. \\"blabla\\""
                resource 0x7f0a0001 io.appium.test:plurals/calling__voice_channel_full__message: <bag>
                  Parent=0x00000000(Resolved=0x7f000000), Count=6
                  #0 (Key=0x01000004): (string8) "There's only room for %1$d people in here."
                  #1 (Key=0x01000005): (string8) "There's only room for %1$d people in here."
                  #2 (Key=0x01000006): (string8) "There's only room for %1$d people in here."
                  #3 (Key=0x01000007): (string8) "There's only room for %1$d people in here."
                  #4 (Key=0x01000008): (string8) "There's only room for %1$d people in here."
                  #5 (Key=0x01000009): (string8) "There's only room for %1$d people in here."
            type 16 configCount=1 entryCount=8
              spec resource 0x7f110000 io.appium.test:menu/conversation_header_menu_audio: flags=0x00000000
              spec resource 0x7f110001 io.appium.test:menu/conversation_header_menu_collection: flags=0x00000000
              spec resource 0x7f110002 io.appium.test:menu/conversation_header_menu_collection_searching: flags=0x00000000
              spec resource 0x7f110003 io.appium.test:menu/conversation_header_menu_video: flags=0x00000000
              spec resource 0x7f110004 io.appium.test:menu/conversation_multiuse: flags=0x00000000
              spec resource 0x7f110005 io.appium.test:menu/toolbar_close_white: flags=0x00000000
              spec resource 0x7f110006 io.appium.test:menu/toolbar_collection: flags=0x00000000
              spec resource 0x7f110007 io.appium.test:menu/toolbar_sketch: flags=0x00000000
              config (default):
                resource 0x7f110000 io.appium.test:menu/conversation_header_menu_audio: t=0x03 d=0x000000b6 (s=0x0008 r=0x00)
                  (string8) "res/menu/conversation_header_menu_audio.xml"
                resource 0x7f110001 io.appium.test:menu/conversation_header_menu_collection: t=0x03 d=0x000000b7 (s=0x0008 r=0x00)
                  (string8) "res/menu/conversation_header_menu_collection.xml"
                resource 0x7f110002 io.appium.test:menu/conversation_header_menu_collection_searching: t=0x03 d=0x000000b8 (s=0x0008 r=0x00)
                  (string8) "res/menu/conversation_header_menu_collection_searching.xml"
                resource 0x7f110003 io.appium.test:menu/conversation_header_menu_video: t=0x03 d=0x000000b9 (s=0x0008 r=0x00)
                  (string8) "res/menu/conversation_header_menu_video.xml"
                resource 0x7f110004 io.appium.test:menu/conversation_multiuse: t=0x03 d=0x000000ba (s=0x0008 r=0x00)
                  (string8) "res/menu/conversation_multiuse.xml"
                resource 0x7f110005 io.appium.test:menu/toolbar_close_white: t=0x03 d=0x000000bb (s=0x0008 r=0x00)
                  (string8) "res/menu/toolbar_close_white.xml"
                resource 0x7f110006 io.appium.test:menu/toolbar_collection: t=0x03 d=0x000000bc (s=0x0008 r=0x00)
                  (string8) "res/menu/toolbar_collection.xml"
                resource 0x7f110007 io.appium.test:menu/toolbar_sketch: t=0x03 d=0x0000007f (s=0x0008 r=0x00)
                  (string8) "res/menu/toolbar_sketch.xml"
        `
      });
      mocks.fs.expects('writeFile').once();

      const _ref6 = yield adb.extractStringsFromApk('/fake/path.apk', 'de-DE', '/tmp'),
            apkStrings = _ref6.apkStrings,
            localPath = _ref6.localPath;

      apkStrings.abc_action_bar_home_description.should.eql('Navigate "home"');
      apkStrings.calling__conversation_full__message.should.eql(['Calls work in conversations with up to 1 person.', 'Calls work in conversations with up to %1$d people. "blabla"']);
      localPath.should.eql(_path.default.resolve('/tmp', 'strings.json'));
    }));
  });
  describe('getFocusedPackageAndActivity', function () {
    it('should parse correctly and return package and activity', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'window', 'windows']).returns(`mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ` + `ActivityRecord{2 u ${pkg}/${act} t181}}}\n` + `mCurrentFocus=Window{4330b6c0 com.android.settings/com.android.settings.SubSettings paused=false}`);

      let _ref8 = yield adb.getFocusedPackageAndActivity(),
          appPackage = _ref8.appPackage,
          appActivity = _ref8.appActivity;

      appPackage.should.equal(pkg);
      appActivity.should.equal(act);
    }));
    it('should parse correctly and return package and activity when a comma is present', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'window', 'windows']).returns(`mFocusedApp=AppWindowToken{20fe217e token=Token{21878739 ` + `ActivityRecord{16425300 u0 ${pkg}/${act}, isShadow:false t10}}}`);

      let _ref10 = yield adb.getFocusedPackageAndActivity(),
          appPackage = _ref10.appPackage,
          appActivity = _ref10.appActivity;

      appPackage.should.equal(pkg);
      appActivity.should.equal(act);
    }));
    it('should parse correctly and return package and activity of only mCurrentFocus is set', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'window', 'windows']).returns(`mFocusedApp=null\n  mCurrentFocus=Window{4330b6c0 u0 ${pkg}/${act} paused=false}`);

      let _ref12 = yield adb.getFocusedPackageAndActivity(),
          appPackage = _ref12.appPackage,
          appActivity = _ref12.appActivity;

      appPackage.should.equal(pkg);
      appActivity.should.equal(act);
    }));
    it('should return null if mFocusedApp=null', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'window', 'windows']).returns('mFocusedApp=null');

      let _ref14 = yield adb.getFocusedPackageAndActivity(),
          appPackage = _ref14.appPackage,
          appActivity = _ref14.appActivity;

      should.not.exist(appPackage);
      should.not.exist(appActivity);
    }));
    it('should return null if mCurrentFocus=null', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'window', 'windows']).returns('mCurrentFocus=null');

      let _ref16 = yield adb.getFocusedPackageAndActivity(),
          appPackage = _ref16.appPackage,
          appActivity = _ref16.appActivity;

      should.not.exist(appPackage);
      should.not.exist(appActivity);
    }));
  });
  describe('waitForActivityOrNot', function () {
    it('should call shell once and should return', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'window', 'windows']).returns(`mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ` + `ActivityRecord{2 u ${pkg}/${act} t181}}}`);
      yield adb.waitForActivityOrNot(pkg, act, false);
    }));
    it('should call shell multiple times and return', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').onCall(0).returns('mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ' + 'ActivityRecord{2c7c4318 u0 foo/bar t181}}}');
      mocks.adb.expects('shell').returns('mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ' + 'ActivityRecord{2c7c4318 u0 com.example.android.contactmanager/.ContactManager t181}}}');
      yield adb.waitForActivityOrNot(pkg, act, false);
    }));
    it('should call shell once return for not', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'window', 'windows']).returns('mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ' + 'ActivityRecord{c 0 foo/bar t181}}}');
      yield adb.waitForActivityOrNot(pkg, act, true);
    }));
    it('should call shell multiple times and return for not', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').onCall(0).returns(`mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ` + `ActivityRecord{2 u ${pkg}/${act} t181}}}`);
      mocks.adb.expects('shell').returns('mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ' + 'ActivityRecord{2c7c4318 u0 foo/bar t181}}}');
      yield adb.waitForActivityOrNot(pkg, act, true);
    }));
    it('should be able to get first of a comma-separated list of activities', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'window', 'windows']).returns(`mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ` + `ActivityRecord{2 u ${pkg}/.ContactManager t181}}}`);
      yield adb.waitForActivityOrNot(pkg, '.ContactManager, .OtherManager', false);
    }));
    it('should be able to get second of a comma-separated list of activities', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'window', 'windows']).returns(`mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ` + `ActivityRecord{2 u ${pkg}/.OtherManager t181}}}`);
      yield adb.waitForActivityOrNot(pkg, '.ContactManager, .OtherManager', false);
    }));
    it('should fail if no activity in a comma-separated list is available', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').atLeast(1).withExactArgs(['dumpsys', 'window', 'windows']).returns(`mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ` + `ActivityRecord{2 u ${pkg}/${act} t181}}}`);
      yield adb.waitForActivityOrNot(pkg, '.SuperManager, .OtherManager', false, 1000).should.eventually.be.rejected;
    }));
    it('should be able to match activities if waitActivity is a wildcard', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'window', 'windows']).returns(`mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ` + `ActivityRecord{2 u ${pkg}/.ContactManager t181}}}`);
      yield adb.waitForActivityOrNot(pkg, `*`, false);
    }));
    it('should be able to match activities if waitActivity is shortened and contains a whildcard', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'window', 'windows']).returns(`mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ` + `ActivityRecord{2 u ${pkg}/.ContactManager t181}}}`);
      yield adb.waitForActivityOrNot(pkg, `.*Manager`, false);
    }));
    it('should be able to match activities if waitActivity contains a wildcard alternative to activity', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'window', 'windows']).returns(`mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ` + `ActivityRecord{2 u ${pkg}/.ContactManager t181}}}`);
      yield adb.waitForActivityOrNot(pkg, `${pkg}.*`, false);
    }));
    it('should be able to match activities if waitActivity contains a wildcard on head', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'window', 'windows']).returns(`mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ` + `ActivityRecord{2 u ${pkg}/.ContactManager t181}}}`);
      yield adb.waitForActivityOrNot(pkg, `*.contactmanager.ContactManager`, false);
    }));
    it('should be able to match activities if waitActivity contains a wildcard across a pkg name and an activity name', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'window', 'windows']).returns(`mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ` + `ActivityRecord{2 u ${pkg}/.ContactManager t181}}}`);
      yield adb.waitForActivityOrNot(pkg, `com.*Manager`, false);
    }));
    it('should be able to match activities if waitActivity contains wildcards in both a pkg name and an activity name', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'window', 'windows']).returns(`mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ` + `ActivityRecord{2 u ${pkg}/.ContactManager t181}}}`);
      yield adb.waitForActivityOrNot(pkg, `com.*.contactmanager.*Manager`, false);
    }));
    it('should fail if activity not to match from regexp activities', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').atLeast(1).withExactArgs(['dumpsys', 'window', 'windows']).returns(`mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ` + `ActivityRecord{2 u com.example.android.supermanager/.SuperManager t181}}}`);
      yield adb.waitForActivityOrNot('com.example.android.supermanager', `${pkg}.*`, false, 1000).should.eventually.be.rejected;
    }));
    it('should be able to get an activity that is an inner class', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'window', 'windows']).returns(`mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ` + `ActivityRecord{2 u ${pkg}/.Settings$AppDrawOverlaySettingsActivity t181}}}`);
      yield adb.waitForActivityOrNot(pkg, '.Settings$AppDrawOverlaySettingsActivity', false);
    }));
    it('should be able to get first activity from first package in a comma-separated list of packages + activities', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'window', 'windows']).returns(`mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ` + `ActivityRecord{2 u com.android.settings/.ContactManager t181}}}`);
      yield adb.waitForActivityOrNot('com.android.settings,com.example.android.supermanager', '.ContactManager,.OtherManager', false);
    }));
    it('should be able to get first activity from second package in a comma-separated list of packages + activities', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'window', 'windows']).returns(`mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ` + `ActivityRecord{2 u com.example.android.supermanager/.ContactManager t181}}}`);
      yield adb.waitForActivityOrNot('com.android.settings,com.example.android.supermanager', '.ContactManager,.OtherManager', false);
    }));
    it('should be able to get second activity from first package in a comma-separated list of packages + activities', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'window', 'windows']).returns(`mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ` + `ActivityRecord{2 u com.android.settings/.OtherManager t181}}}`);
      yield adb.waitForActivityOrNot('com.android.settings,com.example.android.supermanager', '.ContactManager,.OtherManager', false);
    }));
    it('should be able to get second activity from second package in a comma-separated list of packages', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['dumpsys', 'window', 'windows']).returns(`mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ` + `ActivityRecord{2 u com.example.android.supermanager/.OtherManager t181}}}`);
      yield adb.waitForActivityOrNot('com.android.settings,com.example.android.supermanager', '.ContactManager,.OtherManager', false);
    }));
    it('should fail to get activity when focused activity matches none of the provided list of packages', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').atLeast(1).withExactArgs(['dumpsys', 'window', 'windows']).returns(`mFocusedApp=AppWindowToken{38600b56 token=Token{9ea1171 ` + `ActivityRecord{2 u com.otherpackage/.ContactManager t181}}}`);
      yield adb.waitForActivityOrNot('com.android.settings,com.example.android.supermanager', '.ContactManager, .OtherManager', false, 1000).should.eventually.be.rejected;
    }));
  });
  describe('waitForActivity', function () {
    it('should call waitForActivityOrNot with correct arguments', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('waitForActivityOrNot').once().withExactArgs(pkg, act, false, 20000).returns('');
      yield adb.waitForActivity(pkg, act);
    }));
  });
  describe('waitForNotActivity', function () {
    it('should call waitForActivityOrNot with correct arguments', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('waitForActivityOrNot').once().withExactArgs(pkg, act, true, 20000).returns('');
      yield adb.waitForNotActivity(pkg, act);
    }));
  });
  describe('uninstallApk', function () {
    it('should call forceStop and adbExec with correct arguments', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('isAppInstalled').once().withExactArgs(pkg).returns(true);
      mocks.adb.expects('forceStop').once().withExactArgs(pkg).returns('');
      mocks.adb.expects('adbExec').once().withExactArgs(['uninstall', pkg], {
        timeout: 20000
      }).returns('Success');
      (yield adb.uninstallApk(pkg)).should.be.true;
    }));
    it('should not call forceStop and adbExec if app not installed', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('isAppInstalled').once().withExactArgs(pkg).returns(false);
      mocks.adb.expects('forceStop').never();
      mocks.adb.expects('adbExec').never();
      (yield adb.uninstallApk(pkg)).should.be.false;
    }));
  });
  describe('installFromDevicePath', function () {
    it('should call forceStop and adbExec with correct arguments', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['pm', 'install', '-r', 'foo'], {}).returns('');
      yield adb.installFromDevicePath('foo');
    }));
  });
  describe('install', function () {
    it('should call forceStop and adbExec with correct arguments', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('getApiLevel').once().returns(23);
      mocks.adb.expects('adbExec').once().withExactArgs(['install', '-r', 'foo'], {
        timeout: 60000
      }).returns('');
      yield adb.install('foo');
    }));
    it('should call forceStop and adbExec with correct arguments when not replacing', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('getApiLevel').once().returns(23);
      mocks.adb.expects('adbExec').once().withExactArgs(['install', 'foo'], {
        timeout: 60000
      }).returns('');
      yield adb.install('foo', {
        replace: false
      });
    }));
    it('should call apks install if the path points to it', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('installApks').once().withArgs('foo.apks').returns('');
      yield adb.install('foo.apks');
    }));
  });
  describe('startUri', function () {
    it('should fail if uri or pkg are not provided', (0, _asyncToGenerator2.default)(function* () {
      yield adb.startUri().should.eventually.be.rejectedWith(/arguments are required/);
      yield adb.startUri('foo').should.eventually.be.rejectedWith(/arguments are required/);
    }));
    it('should fail if "unable to resolve intent" appears in shell command result', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', uri, pkg]).returns('Something something something Unable to resolve intent something something');
      yield adb.startUri(uri, pkg).should.eventually.be.rejectedWith(/Unable to resolve intent/);
    }));
    it('should build a call to a VIEW intent with the uri', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', uri, pkg]).returns('Passable result');
      yield adb.startUri(uri, pkg);
    }));
  });
  describe('startApp', function () {
    it('should call getApiLevel and shell with correct arguments', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('getApiLevel').once().withExactArgs().returns(17);
      mocks.adb.expects('shell').once().withArgs(cmd).returns('');
      yield adb.startApp(startAppOptions);
    }));
    it('should call getApiLevel and shell with correct arguments', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('getApiLevel').twice().returns(17);
      mocks.adb.expects('shell').onCall(0).returns('Error: Activity class foo does not exist');
      mocks.adb.expects('shell').returns('');
      yield adb.startApp(startAppOptions);
    }));
    it('should call getApiLevel and shell with correct arguments when activity is inner class', (0, _asyncToGenerator2.default)(function* () {
      const startAppOptionsWithInnerClass = {
        pkg: 'pkg',
        activity: 'act$InnerAct'
      },
            cmdWithInnerClass = ['am', 'start', '-W', '-n', 'pkg/act\\$InnerAct', '-S'];
      mocks.adb.expects('getApiLevel').once().withExactArgs().returns(17);
      mocks.adb.expects('shell').once().withArgs(cmdWithInnerClass).returns('');
      yield adb.startApp(startAppOptionsWithInnerClass);
    }));
  });
  describe('getDeviceLanguage', function () {
    it('should call shell one time with correct args and return language when API < 23', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").returns(18);
      mocks.adb.expects("shell").once().withExactArgs(['getprop', 'persist.sys.language']).returns(language);
      (yield adb.getDeviceLanguage()).should.equal(language);
    }));
    it('should call shell two times with correct args and return language when API < 23', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").returns(18);
      mocks.adb.expects("shell").once().withExactArgs(['getprop', 'persist.sys.language']).returns('');
      mocks.adb.expects("shell").once().withExactArgs(['getprop', 'ro.product.locale.language']).returns(language);
      (yield adb.getDeviceLanguage()).should.equal(language);
    }));
    it('should call shell one time with correct args and return language when API = 23', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").returns(23);
      mocks.adb.expects("shell").once().withExactArgs(['getprop', 'persist.sys.locale']).returns(locale);
      (yield adb.getDeviceLanguage()).should.equal(language);
    }));
    it('should call shell two times with correct args and return language when API = 23', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").returns(23);
      mocks.adb.expects("shell").once().withExactArgs(['getprop', 'persist.sys.locale']).returns('');
      mocks.adb.expects("shell").once().withExactArgs(['getprop', 'ro.product.locale']).returns(locale);
      (yield adb.getDeviceLanguage()).should.equal(language);
    }));
  });
  describe('setDeviceLanguage', function () {
    it('should call shell one time with correct args when API < 23', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").once().returns(21);
      mocks.adb.expects("shell").once().withExactArgs(['setprop', 'persist.sys.language', language]).returns("");
      yield adb.setDeviceLanguage(language);
    }));
  });
  describe('getDeviceCountry', function () {
    it('should call shell one time with correct args and return country', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("shell").once().withExactArgs(['getprop', 'persist.sys.country']).returns(country);
      (yield adb.getDeviceCountry()).should.equal(country);
    }));
    it('should call shell two times with correct args and return country', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("shell").once().withExactArgs(['getprop', 'persist.sys.country']).returns('');
      mocks.adb.expects("shell").once().withExactArgs(['getprop', 'ro.product.locale.region']).returns(country);
      (yield adb.getDeviceCountry()).should.equal(country);
    }));
  });
  describe('setDeviceCountry', function () {
    it('should call shell one time with correct args', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").once().returns(21);
      mocks.adb.expects("shell").once().withExactArgs(['setprop', 'persist.sys.country', country]).returns("");
      yield adb.setDeviceCountry(country);
    }));
  });
  describe('getDeviceLocale', function () {
    it('should call shell one time with correct args and return locale', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("shell").once().withExactArgs(['getprop', 'persist.sys.locale']).returns(locale);
      (yield adb.getDeviceLocale()).should.equal(locale);
    }));
    it('should call shell two times with correct args and return locale', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("shell").once().withExactArgs(['getprop', 'persist.sys.locale']).returns('');
      mocks.adb.expects("shell").once().withExactArgs(['getprop', 'ro.product.locale']).returns(locale);
      (yield adb.getDeviceLocale()).should.equal(locale);
    }));
  });
  describe('ensureCurrentLocale', function () {
    it('should return false if no arguments', (0, _asyncToGenerator2.default)(function* () {
      (yield adb.ensureCurrentLocale()).should.be.false;
    }));
    it('should return true when API 22 and only language', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").withExactArgs().once().returns(22);
      mocks.adb.expects("getDeviceLanguage").withExactArgs().once().returns("fr");
      mocks.adb.expects("getDeviceCountry").withExactArgs().never();
      (yield adb.ensureCurrentLocale("fr", null)).should.be.true;
    }));
    it('should return true when API 22 and only country', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").withExactArgs().once().returns(22);
      mocks.adb.expects("getDeviceCountry").withExactArgs().once().returns("FR");
      mocks.adb.expects("getDeviceLanguage").withExactArgs().never();
      (yield adb.ensureCurrentLocale(null, "FR")).should.be.true;
    }));
    it('should return true when API 22', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").withExactArgs().once().returns(22);
      mocks.adb.expects("getDeviceLanguage").withExactArgs().once().returns("fr");
      mocks.adb.expects("getDeviceCountry").withExactArgs().once().returns("FR");
      (yield adb.ensureCurrentLocale('FR', 'fr')).should.be.true;
    }));
    it('should return false when API 22', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").withExactArgs().once().returns(22);
      mocks.adb.expects("getDeviceLanguage").withExactArgs().once().returns("");
      mocks.adb.expects("getDeviceCountry").withExactArgs().once().returns("FR");
      (yield adb.ensureCurrentLocale('en', 'US')).should.be.false;
    }));
    it('should return true when API 23', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").withExactArgs().once().returns(23);
      mocks.adb.expects("getDeviceLocale").withExactArgs().once().returns("fr-FR");
      (yield adb.ensureCurrentLocale('fr', 'fr')).should.be.true;
    }));
    it('should return false when API 23', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").withExactArgs().once().returns(23);
      mocks.adb.expects("getDeviceLocale").withExactArgs().once().returns("");
      (yield adb.ensureCurrentLocale('en', 'us')).should.be.false;
    }));
    it('should return true when API 23 with script', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").withExactArgs().once().returns(23);
      mocks.adb.expects("getDeviceLocale").withExactArgs().once().returns("zh-Hans-CN");
      (yield adb.ensureCurrentLocale('zh', 'CN', 'Hans')).should.be.true;
    }));
    it('should return false when API 23 with script', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").withExactArgs().once().returns(23);
      mocks.adb.expects("getDeviceLocale").withExactArgs().once().returns("");
      (yield adb.ensureCurrentLocale('zh', 'CN', 'Hans')).should.be.false;
    }));
  });
  describe('setDeviceLocale', function () {
    it('should not call setDeviceLanguageCountry because of empty', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('setDeviceLanguageCountry').never();
      yield adb.setDeviceLocale();
    }));
    it('should not call setDeviceLanguageCountry because of invalid format no -', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('setDeviceLanguageCountry').never();
      yield adb.setDeviceLocale('jp');
    }));
    it('should not call setDeviceLanguageCountry because of invalid format /', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('setDeviceLanguageCountry').never();
      yield adb.setDeviceLocale('en/US');
    }));
    it('should call setDeviceLanguageCountry', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('setDeviceLanguageCountry').withExactArgs(language, country).once().returns("");
      yield adb.setDeviceLocale('en-US');
    }));
    it('should call setDeviceLanguageCountry with degits for country', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('setDeviceLanguageCountry').withExactArgs(language, country + "0").once().returns("");
      yield adb.setDeviceLocale('en-US0');
    }));
  });
  describe('setDeviceLanguageCountry', function () {
    it('should return if language and country are not passed', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('getDeviceLanguage').never();
      mocks.adb.expects('getDeviceCountry').never();
      mocks.adb.expects('getDeviceLocale').never();
      mocks.adb.expects('setDeviceLanguage').never();
      mocks.adb.expects('setDeviceCountry').never();
      mocks.adb.expects('setDeviceLocale').never();
      mocks.adb.expects('reboot').never();
      yield adb.setDeviceLanguageCountry();
    }));
    it('should set language, country and reboot the device when API < 23', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").withExactArgs().once().returns(22);
      mocks.adb.expects("getDeviceLanguage").withExactArgs().once().returns("fr");
      mocks.adb.expects("getDeviceCountry").withExactArgs().once().returns("");
      mocks.adb.expects("setDeviceLanguage").withExactArgs(language).once().returns("");
      mocks.adb.expects("setDeviceCountry").withExactArgs(country).once().returns("");
      mocks.adb.expects("reboot").once().returns("");
      yield adb.setDeviceLanguageCountry(language, country);
    }));
    it('should not set language and country if it does not change when API < 23', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").withExactArgs().once().returns(22);
      mocks.adb.expects('getDeviceLanguage').once().returns('en');
      mocks.adb.expects('getDeviceCountry').once().returns('US');
      mocks.adb.expects('getDeviceLocale').never();
      mocks.adb.expects('setDeviceLanguage').never();
      mocks.adb.expects('setDeviceCountry').never();
      mocks.adb.expects('setDeviceLocale').never();
      mocks.adb.expects('reboot').never();
      yield adb.setDeviceLanguageCountry(language.toLowerCase(), country.toLowerCase());
    }));
    it('should set locale when API is 23', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").withExactArgs().once().returns(23);
      mocks.adb.expects("getDeviceLocale").withExactArgs().once().returns('fr-FR');
      mocks.adb.expects("setDeviceSysLocale").withExactArgs(locale).once().returns('fr-FR');
      mocks.adb.expects("reboot").once().returns("");
      yield adb.setDeviceLanguageCountry(language, country);
    }));
    it('should not set language and country if it does not change when API is 23', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").withExactArgs().once().returns(23);
      mocks.adb.expects("getDeviceLocale").withExactArgs().once().returns(locale);
      mocks.adb.expects('setDeviceSysLocale').never();
      mocks.adb.expects('reboot').never();
      yield adb.setDeviceLanguageCountry(language, country);
    }));
    it('should call set locale via setting app when API 24+', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").withExactArgs().once().returns(24);
      mocks.adb.expects("getDeviceLocale").withExactArgs().once().returns('fr-FR');
      mocks.adb.expects("setDeviceSysLocaleViaSettingApp").withExactArgs(language, country, null).once().returns("");
      mocks.adb.expects('reboot').never();
      yield adb.setDeviceLanguageCountry(language, country);
    }));
    it('should call set locale with script via setting app when API 24+', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").withExactArgs().once().returns(24);
      mocks.adb.expects("getDeviceLocale").withExactArgs().once().returns('fr-FR');
      mocks.adb.expects("setDeviceSysLocaleViaSettingApp").withExactArgs('zh', 'CN', 'Hans').once().returns("");
      mocks.adb.expects('reboot').never();
      yield adb.setDeviceLanguageCountry('zh', 'CN', 'Hans');
    }));
    it('should not set language and country if it does not change when API 24+', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").withExactArgs().once().returns(24);
      mocks.adb.expects("getDeviceLocale").withExactArgs().once().returns(locale);
      mocks.adb.expects("setDeviceSysLocaleViaSettingApp").never();
      mocks.adb.expects('reboot').never();
      yield adb.setDeviceLanguageCountry(language, country);
    }));
    it('should not set language and country if no language when API 24+', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").withExactArgs().once().returns(24);
      mocks.adb.expects("getDeviceLocale").withExactArgs().once().returns(locale);
      mocks.adb.expects("setDeviceSysLocaleViaSettingApp").never();
      mocks.adb.expects('reboot').never();
      yield adb.setDeviceLanguageCountry(country);
    }));
    it('should not set language and country if no country when API 24+', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("getApiLevel").withExactArgs().once().returns(24);
      mocks.adb.expects("getDeviceLocale").withExactArgs().once().returns(locale);
      mocks.adb.expects("setDeviceSysLocaleViaSettingApp").never();
      mocks.adb.expects('reboot').never();
      yield adb.setDeviceLanguageCountry(language);
    }));
  });
  describe('getApkInfo', function () {
    const APK_INFO = `package: name='io.appium.settings' versionCode='2' versionName='1.1' platformBuildVersionName='6.0-2166767'
    sdkVersion:'17'
    targetSdkVersion:'23'
    uses-permission: name='android.permission.INTERNET'
    uses-permission: name='android.permission.CHANGE_NETWORK_STATE'
    uses-permission: name='android.permission.ACCESS_NETWORK_STATE'
    uses-permission: name='android.permission.READ_PHONE_STATE'
    uses-permission: name='android.permission.WRITE_SETTINGS'
    uses-permission: name='android.permission.CHANGE_WIFI_STATE'
    uses-permission: name='android.permission.ACCESS_WIFI_STATE'
    uses-permission: name='android.permission.ACCESS_FINE_LOCATION'
    uses-permission: name='android.permission.ACCESS_COARSE_LOCATION'
    uses-permission: name='android.permission.ACCESS_MOCK_LOCATION'
    application-label:'Appium Settings'
    application-icon-120:'res/drawable-ldpi-v4/ic_launcher.png'
    application-icon-160:'res/drawable-mdpi-v4/ic_launcher.png'
    application-icon-240:'res/drawable-hdpi-v4/ic_launcher.png'
    application-icon-320:'res/drawable-xhdpi-v4/ic_launcher.png'
    application: label='Appium Settings' icon='res/drawable-mdpi-v4/ic_launcher.png'
    application-debuggable
    launchable-activity: name='io.appium.settings.Settings'  label='Appium Settings' icon=''
    feature-group: label=''
      uses-feature: name='android.hardware.wifi'
      uses-feature: name='android.hardware.location'
      uses-implied-feature: name='android.hardware.location' reason='requested android.permission.ACCESS_COARSE_LOCATION permission, requested android.permission.ACCESS_FINE_LOCATION permission, and requested android.permission.ACCESS_MOCK_LOCATION permission'
      uses-feature: name='android.hardware.location.gps'
      uses-implied-feature: name='android.hardware.location.gps' reason='requested android.permission.ACCESS_FINE_LOCATION permission'
      uses-feature: name='android.hardware.location.network'
      uses-implied-feature: name='android.hardware.location.network' reason='requested android.permission.ACCESS_COARSE_LOCATION permission'
      uses-feature: name='android.hardware.touchscreen'
      uses-implied-feature: name='android.hardware.touchscreen' reason='default feature for all apps'
    main
    other-receivers
    other-services
    supports-screens: 'small' 'normal' 'large' 'xlarge'
    supports-any-density: 'true'
    locales: '--_--'
    densities: '120' '160' '240' '320'`;
    it('should properly parse apk info', (0, _asyncToGenerator2.default)(function* () {
      mocks.fs.expects('exists').once().returns(true);
      mocks.adb.expects('initAapt').once().returns(true);
      mocks.teen_process.expects('exec').once().returns({
        stdout: APK_INFO
      });
      const result = yield adb.getApkInfo('/some/folder/path.apk');
      var _arr = [['name', 'io.appium.settings'], ['versionCode', 2], ['versionName', '1.1']];

      for (var _i = 0; _i < _arr.length; _i++) {
        let _arr$_i = (0, _slicedToArray2.default)(_arr[_i], 2),
            name = _arr$_i[0],
            value = _arr$_i[1];

        result.should.have.property(name, value);
      }
    }));
    it('should extract base apk first in order to retrieve apks info', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('extractBaseApk').once().returns('/some/otherfolder/path.apk');
      mocks.fs.expects('exists').once().returns(true);
      mocks.adb.expects('initAapt').once().returns(true);
      mocks.teen_process.expects('exec').once().returns({
        stdout: APK_INFO
      });
      const result = yield adb.getApkInfo('/some/folder/path.apks');
      var _arr2 = [['name', 'io.appium.settings'], ['versionCode', 2], ['versionName', '1.1']];

      for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
        let _arr2$_i = (0, _slicedToArray2.default)(_arr2[_i2], 2),
            name = _arr2$_i[0],
            value = _arr2$_i[1];

        result.should.have.property(name, value);
      }
    }));
  });
  describe('getPackageInfo', function () {
    it('should properly parse installed package info', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().returns(`Packages:
      Package [com.example.testapp.first] (2036fd1):
        userId=10225
        pkg=Package{42e7a36 com.example.testapp.first}
        codePath=/data/app/com.example.testapp.first-1
        resourcePath=/data/app/com.example.testapp.first-1
        legacyNativeLibraryDir=/data/app/com.example.testapp.first-1/lib
        primaryCpuAbi=null
        secondaryCpuAbi=null
        versionCode=1 minSdk=21 targetSdk=24
        versionName=1.0
        splits=[base]
        apkSigningVersion=1
        applicationInfo=ApplicationInfo{29cb2a4 com.example.testapp.first}
        flags=[ HAS_CODE ALLOW_CLEAR_USER_DATA ALLOW_BACKUP ]
        privateFlags=[ RESIZEABLE_ACTIVITIES ]
        dataDir=/data/user/0/com.example.testapp.first
        supportsScreens=[small, medium, large, xlarge, resizeable, anyDensity]
        timeStamp=2016-11-03 01:12:08
        firstInstallTime=2016-11-03 01:12:09
        lastUpdateTime=2016-11-03 01:12:09
        signatures=PackageSignatures{9fe380d [53ea108d]}
        installPermissionsFixed=true installStatus=1
        pkgFlags=[ HAS_CODE ALLOW_CLEAR_USER_DATA ALLOW_BACKUP ]
        User 0: ceDataInode=474317 installed=true hidden=false suspended=false stopped=true notLaunched=true enabled=0
          runtime permissions:`);
      const result = yield adb.getPackageInfo('com.example.testapp.first');
      var _arr3 = [['name', 'com.example.testapp.first'], ['versionCode', 1], ['versionName', '1.0']];

      for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
        let _arr3$_i = (0, _slicedToArray2.default)(_arr3[_i3], 2),
            name = _arr3$_i[0],
            value = _arr3$_i[1];

        result.should.have.property(name, value);
      }
    }));
  });
  describe('installOrUpgrade', function () {
    const pkgId = 'io.appium.settings';
    const apkPath = '/path/to/my.apk';
    it('should execute install if the package is not present', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('getApkInfo').withExactArgs(apkPath).once().returns({
        name: pkgId
      });
      mocks.adb.expects('isAppInstalled').withExactArgs(pkgId).once().returns(false);
      mocks.adb.expects('install').withArgs(apkPath).once().returns(true);
      yield adb.installOrUpgrade(apkPath);
    }));
    it('should return if the same package version is already installed', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('getApkInfo').withExactArgs(apkPath).once().returns({
        versionCode: 1
      });
      mocks.adb.expects('getPackageInfo').once().returns({
        versionCode: 1
      });
      mocks.adb.expects('isAppInstalled').withExactArgs(pkgId).once().returns(true);
      yield adb.installOrUpgrade(apkPath, pkgId);
    }));
    it('should return if newer package version is already installed', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('getApkInfo').withExactArgs(apkPath).once().returns({
        name: pkgId,
        versionCode: 1
      });
      mocks.adb.expects('getPackageInfo').once().returns({
        versionCode: 2
      });
      mocks.adb.expects('isAppInstalled').withExactArgs(pkgId).once().returns(true);
      yield adb.installOrUpgrade(apkPath);
    }));
    it('should not throw an error if apk version code cannot be read', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('getApkInfo').withExactArgs(apkPath).once().returns({
        name: pkgId
      });
      mocks.adb.expects('getPackageInfo').once().returns({
        versionCode: 2
      });
      mocks.adb.expects('isAppInstalled').withExactArgs(pkgId).once().returns(true);
      yield adb.installOrUpgrade(apkPath);
    }));
    it('should not throw an error if pkg version code cannot be read', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('getApkInfo').withExactArgs(apkPath).once().returns({
        name: pkgId,
        versionCode: 1
      });
      mocks.adb.expects('getPackageInfo').once().returns({});
      mocks.adb.expects('isAppInstalled').withExactArgs(pkgId).once().returns(true);
      yield adb.installOrUpgrade(apkPath);
    }));
    it('should not throw an error if pkg id cannot be read', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('getApkInfo').withExactArgs(apkPath).once().returns({});
      yield adb.installOrUpgrade(apkPath);
    }));
    it('should perform upgrade if older package version is installed', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('getApkInfo').withExactArgs(apkPath).once().returns({
        name: pkgId,
        versionCode: 2
      });
      mocks.adb.expects('getPackageInfo').once().returns({
        versionCode: 1
      });
      mocks.adb.expects('isAppInstalled').withExactArgs(pkgId).once().returns(true);
      mocks.adb.expects('install').withArgs(apkPath, {
        replace: true,
        timeout: 60000
      }).once().returns(true);
      yield adb.installOrUpgrade(apkPath);
    }));
    it('should perform upgrade if older package version is installed, but version codes are not maintained', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('getApkInfo').withExactArgs(apkPath).once().returns({
        name: pkgId,
        versionCode: 1,
        versionName: '2.0.0'
      });
      mocks.adb.expects('getPackageInfo').once().returns({
        versionCode: 1,
        versionName: '1.0.0'
      });
      mocks.adb.expects('isAppInstalled').withExactArgs(pkgId).once().returns(true);
      mocks.adb.expects('install').withArgs(apkPath, {
        replace: true,
        timeout: 60000
      }).once().returns(true);
      yield adb.installOrUpgrade(apkPath);
    }));
    it('should perform upgrade if the same version is installed, but version codes are different', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('getApkInfo').withExactArgs(apkPath).once().returns({
        name: pkgId,
        versionCode: 2,
        versionName: '2.0.0'
      });
      mocks.adb.expects('getPackageInfo').once().returns({
        versionCode: 1,
        versionName: '2.0.0'
      });
      mocks.adb.expects('isAppInstalled').withExactArgs(pkgId).once().returns(true);
      mocks.adb.expects('install').withArgs(apkPath, {
        replace: true,
        timeout: 60000
      }).once().returns(true);
      yield adb.installOrUpgrade(apkPath);
    }));
    it('should uninstall and re-install if older package version is installed and upgrade fails', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('getApkInfo').withExactArgs(apkPath).once().returns({
        name: pkgId,
        versionCode: 2
      });
      mocks.adb.expects('getPackageInfo').once().returns({
        versionCode: 1
      });
      mocks.adb.expects('isAppInstalled').withExactArgs(pkgId).once().returns(true);
      mocks.adb.expects('install').withArgs(apkPath, {
        replace: true,
        timeout: 60000
      }).once().throws();
      mocks.adb.expects('uninstallApk').withExactArgs(pkgId).once().returns(true);
      mocks.adb.expects('install').withArgs(apkPath, {
        replace: false,
        timeout: 60000
      }).once().returns(true);
      yield adb.installOrUpgrade(apkPath);
    }));
    it('should throw an exception if upgrade and reinstall fail', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('getApkInfo').withExactArgs(apkPath).once().returns({
        name: pkgId,
        versionCode: 2
      });
      mocks.adb.expects('getPackageInfo').once().returns({
        versionCode: 1
      });
      mocks.adb.expects('isAppInstalled').withExactArgs(pkgId).once().returns(true);
      mocks.adb.expects('uninstallApk').withExactArgs(pkgId).once().returns(true);
      mocks.adb.expects('install').withArgs(apkPath).twice().throws();
      let isExceptionThrown = false;

      try {
        yield adb.installOrUpgrade(apkPath);
      } catch (e) {
        isExceptionThrown = true;
      }

      isExceptionThrown.should.be.true;
    }));
    it('should throw an exception if upgrade and uninstall fail', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('getApkInfo').withExactArgs(apkPath).once().returns({
        name: pkgId,
        versionCode: 2
      });
      mocks.adb.expects('getPackageInfo').once().returns({
        versionCode: 1
      });
      mocks.adb.expects('isAppInstalled').withExactArgs(pkgId).once().returns(true);
      mocks.adb.expects('uninstallApk').withExactArgs(pkgId).once().returns(false);
      mocks.adb.expects('install').withArgs(apkPath).once().throws();
      let isExceptionThrown = false;

      try {
        yield adb.installOrUpgrade(apkPath);
      } catch (e) {
        isExceptionThrown = true;
      }

      isExceptionThrown.should.be.true;
    }));
  });
}));require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvdW5pdC9hcGstdXRpbHMtc3BlY3MuanMiXSwibmFtZXMiOlsiY2hhaSIsInVzZSIsImNoYWlBc1Byb21pc2VkIiwic2hvdWxkIiwicGtnIiwidXJpIiwiYWN0Iiwic3RhcnRBcHBPcHRpb25zIiwic3RvcEFwcCIsImFjdGlvbiIsImNhdGVnb3J5IiwiZmxhZ3MiLCJhY3Rpdml0eSIsIm9wdGlvbmFsSW50ZW50QXJndW1lbnRzIiwiY21kIiwibGFuZ3VhZ2UiLCJjb3VudHJ5IiwibG9jYWxlIiwiYWRiIiwiQURCIiwiYWRiRXhlY1RpbWVvdXQiLCJkZXNjcmliZSIsImZzIiwidGVlbl9wcm9jZXNzIiwibW9ja3MiLCJhZnRlckVhY2giLCJ2ZXJpZnkiLCJpdCIsImV4cGVjdHMiLCJvbmNlIiwid2l0aEV4YWN0QXJncyIsInJldHVybnMiLCJpc0FwcEluc3RhbGxlZCIsImJlIiwidHJ1ZSIsImZhbHNlIiwib25DYWxsIiwic3Rkb3V0IiwiZXh0cmFjdFN0cmluZ3NGcm9tQXBrIiwiYXBrU3RyaW5ncyIsImxvY2FsUGF0aCIsImxpbmVhcl9sYXlvdXRfOF9ob3Jpem9udGFsIiwiZXFsIiwicGF0aCIsInJlc29sdmUiLCJhYmNfYWN0aW9uX2Jhcl9ob21lX2Rlc2NyaXB0aW9uIiwiY2FsbGluZ19fY29udmVyc2F0aW9uX2Z1bGxfX21lc3NhZ2UiLCJnZXRGb2N1c2VkUGFja2FnZUFuZEFjdGl2aXR5IiwiYXBwUGFja2FnZSIsImFwcEFjdGl2aXR5IiwiZXF1YWwiLCJub3QiLCJleGlzdCIsIndhaXRGb3JBY3Rpdml0eU9yTm90IiwiYXRMZWFzdCIsImV2ZW50dWFsbHkiLCJyZWplY3RlZCIsIndhaXRGb3JBY3Rpdml0eSIsIndhaXRGb3JOb3RBY3Rpdml0eSIsInRpbWVvdXQiLCJ1bmluc3RhbGxBcGsiLCJuZXZlciIsImluc3RhbGxGcm9tRGV2aWNlUGF0aCIsImluc3RhbGwiLCJyZXBsYWNlIiwid2l0aEFyZ3MiLCJzdGFydFVyaSIsInJlamVjdGVkV2l0aCIsInN0YXJ0QXBwIiwidHdpY2UiLCJzdGFydEFwcE9wdGlvbnNXaXRoSW5uZXJDbGFzcyIsImNtZFdpdGhJbm5lckNsYXNzIiwiZ2V0RGV2aWNlTGFuZ3VhZ2UiLCJzZXREZXZpY2VMYW5ndWFnZSIsImdldERldmljZUNvdW50cnkiLCJzZXREZXZpY2VDb3VudHJ5IiwiZ2V0RGV2aWNlTG9jYWxlIiwiZW5zdXJlQ3VycmVudExvY2FsZSIsInNldERldmljZUxvY2FsZSIsInNldERldmljZUxhbmd1YWdlQ291bnRyeSIsInRvTG93ZXJDYXNlIiwiQVBLX0lORk8iLCJyZXN1bHQiLCJnZXRBcGtJbmZvIiwibmFtZSIsInZhbHVlIiwiaGF2ZSIsInByb3BlcnR5IiwiZ2V0UGFja2FnZUluZm8iLCJwa2dJZCIsImFwa1BhdGgiLCJpbnN0YWxsT3JVcGdyYWRlIiwidmVyc2lvbkNvZGUiLCJ2ZXJzaW9uTmFtZSIsInRocm93cyIsImlzRXhjZXB0aW9uVGhyb3duIiwiZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUdBQSxjQUFLQyxHQUFMLENBQVNDLHVCQUFUOztBQUNBLE1BQU1DLE1BQU0sR0FBR0gsY0FBS0csTUFBTCxFQUFmO0FBQUEsTUFDTUMsR0FBRyxHQUFHLG9DQURaO0FBQUEsTUFFTUMsR0FBRyxHQUFHLDZCQUZaO0FBQUEsTUFHTUMsR0FBRyxHQUFHLGlCQUhaO0FBQUEsTUFJTUMsZUFBZSxHQUFHO0FBQ2hCQyxFQUFBQSxPQUFPLEVBQUUsSUFETztBQUVoQkMsRUFBQUEsTUFBTSxFQUFFLFFBRlE7QUFHaEJDLEVBQUFBLFFBQVEsRUFBRSxLQUhNO0FBSWhCQyxFQUFBQSxLQUFLLEVBQUUsT0FKUztBQUtoQlAsRUFBQUEsR0FBRyxFQUFFLEtBTFc7QUFNaEJRLEVBQUFBLFFBQVEsRUFBRSxLQU5NO0FBT2hCQyxFQUFBQSx1QkFBdUIsRUFBRTtBQVBULENBSnhCO0FBQUEsTUFhTUMsR0FBRyxHQUFHLENBQ0os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MkQsS0FBbEQsRUFBeUQ1RCxJQUF6RCxHQUFnRUUsT0FBaEUsQ0FBd0UsSUFBeEU7QUFDQVAsTUFBQUEsS0FBSyxDQUFDTixHQUFOLENBQVVVLE9BQVYsQ0FBa0IsY0FBbEIsRUFBa0NFLGFBQWxDLENBQWdEMkQsS0FBaEQsRUFBdUQ1RCxJQUF2RCxHQUE4REUsT0FBOUQsQ0FBc0UsS0FBdEU7QUFDQVAsTUFBQUEsS0FBSyxDQUFDTixHQUFOLENBQVVVLE9BQVYsQ0FBa0IsU0FBbEIsRUFBNkJxQyxRQUE3QixDQUFzQ3lCLE9BQXRDLEVBQStDN0QsSUFBL0MsR0FBc0RpRSxNQUF0RDtBQUNBLFVBQUlDLGlCQUFpQixHQUFHLEtBQXhCOztBQUNBLFVBQUk7QUFDRixjQUFNN0UsR0FBRyxDQUFDeUUsZ0JBQUosQ0FBcUJELE9BQXJCLENBQU47QUFDRCxPQUZELENBRUUsT0FBT00sQ0FBUCxFQUFVO0FBQ1ZELFFBQUFBLGlCQUFpQixHQUFHLElBQXBCO0FBQ0Q7O0FBQ0RBLE1BQUFBLGlCQUFpQixDQUFDNUYsTUFBbEIsQ0FBeUI4QixFQUF6QixDQUE0QkMsSUFBNUI7QUFDRCxLQWxCQyxFQUFGO0FBbUJELEdBcEpPLENBQVI7QUFxSkQsQ0FqZ0NxQixDQUFkLENBQVIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCAqIGFzIHRlZW5fcHJvY2VzcyBmcm9tICd0ZWVuX3Byb2Nlc3MnO1xuaW1wb3J0IHsgZnMgfSBmcm9tICdhcHBpdW0tc3VwcG9ydCc7XG5pbXBvcnQgQURCIGZyb20gJy4uLy4uJztcbmltcG9ydCB7IHdpdGhNb2NrcyB9IGZyb20gJ2FwcGl1bS10ZXN0LXN1cHBvcnQnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuY29uc3Qgc2hvdWxkID0gY2hhaS5zaG91bGQoKSxcbiAgICAgIHBrZyA9ICdjb20uZXhhbXBsZS5hbmRyb2lkLmNvbnRhY3RtYW5hZ2VyJyxcbiAgICAgIHVyaSA9ICdjb250ZW50Oi8vY29udGFjdHMvcGVvcGxlLzEnLFxuICAgICAgYWN0ID0gJy5Db250YWN0TWFuYWdlcicsXG4gICAgICBzdGFydEFwcE9wdGlvbnMgPSB7XG4gICAgICAgIHN0b3BBcHA6IHRydWUsXG4gICAgICAgIGFjdGlvbjogJ2FjdGlvbicsXG4gICAgICAgIGNhdGVnb3J5OiAnY2F0JyxcbiAgICAgICAgZmxhZ3M6ICdmbGFncycsXG4gICAgICAgIHBrZzogJ3BrZycsXG4gICAgICAgIGFjdGl2aXR5OiAnYWN0JyxcbiAgICAgICAgb3B0aW9uYWxJbnRlbnRBcmd1bWVudHM6ICcteCBvcHRpb25zIC15IG9wdGlvbiBhcmd1bWVudCAteiBvcHRpb24gYXJnIHdpdGggc3BhY2VzJyxcbiAgICAgIH0sXG4gICAgICBjbWQgPSBbXG4gICAgICAgICdhbScsICdzdGFydCcsICctVycsICctbicsICdwa2cvYWN0JywgJy1TJyxcbiAgICAgICAgJy1hJywgJ2FjdGlvbicsXG4gICAgICAgICctYycsICdjYXQnLFxuICAgICAgICAnLWYnLCAnZmxhZ3MnLFxuICAgICAgICAnLXgnLCAnb3B0aW9ucycsXG4gICAgICAgICcteScsICdvcHRpb24nLFxuICAgICAgICAnYXJndW1lbnQnLFxuICAgICAgICAnLXonLCAnb3B0aW9uJyxcbiAgICAgICAgJ2FyZyB3aXRoIHNwYWNlcycsXG4gICAgICBdLFxuICAgICAgbGFuZ3VhZ2UgPSAnZW4nLFxuICAgICAgY291bnRyeSA9ICdVUycsXG4gICAgICBsb2NhbGUgPSAnZW4tVVMnO1xuXG5jb25zdCBhZGIgPSBuZXcgQURCKHsgYWRiRXhlY1RpbWVvdXQ6IDYwMDAwIH0pO1xuXG5kZXNjcmliZSgnQXBrLXV0aWxzJywgd2l0aE1vY2tzKHthZGIsIGZzLCB0ZWVuX3Byb2Nlc3N9LCBmdW5jdGlvbiAobW9ja3MpIHtcbiAgYWZ0ZXJFYWNoKGZ1bmN0aW9uICgpIHtcbiAgICBtb2Nrcy52ZXJpZnkoKTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2lzQXBwSW5zdGFsbGVkJywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdzaG91bGQgcGFyc2UgY29ycmVjdGx5IGFuZCByZXR1cm4gdHJ1ZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IHBrZyA9ICdkdW1teS5wYWNrYWdlJztcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdzaGVsbCcpXG4gICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ2R1bXBzeXMnLCAncGFja2FnZScsIHBrZ10pXG4gICAgICAgIC5yZXR1cm5zKGBQYWNrYWdlczpcbiAgICAgICAgICBQYWNrYWdlIFske3BrZ31dICgyNDY5NjY5KTpcbiAgICAgICAgICAgIHVzZXJJZD0yMDAwYCk7XG4gICAgICAoYXdhaXQgYWRiLmlzQXBwSW5zdGFsbGVkKHBrZykpLnNob3VsZC5iZS50cnVlO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgcGFyc2UgY29ycmVjdGx5IGFuZCByZXR1cm4gZmFsc2UnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBwa2cgPSAnZHVtbXkucGFja2FnZSc7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2hlbGwnKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydkdW1wc3lzJywgJ3BhY2thZ2UnLCBwa2ddKVxuICAgICAgICAucmV0dXJucyhgRGV4b3B0IHN0YXRlOlxuICAgICAgICAgIFVuYWJsZSB0byBmaW5kIHBhY2thZ2U6ICR7cGtnfWApO1xuICAgICAgKGF3YWl0IGFkYi5pc0FwcEluc3RhbGxlZChwa2cpKS5zaG91bGQuYmUuZmFsc2U7XG4gICAgfSk7XG4gIH0pO1xuICBkZXNjcmliZSgnZXh0cmFjdFN0cmluZ3NGcm9tQXBrJywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdzaG91bGQgZmFsbGJhY2sgdG8gZGVmYXVsdCBpZiBlbiBsb2NhbGUgaXMgbm90IHByZXNlbnQgaW4gdGhlIGNvbmZpZycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLnRlZW5fcHJvY2Vzcy5leHBlY3RzKCdleGVjJykub25DYWxsKDApXG4gICAgICAucmV0dXJucyh7c3Rkb3V0OiBgXG4gICAgICBQYWNrYWdlIEdyb3VwcyAoMSlcbiAgICAgIFBhY2thZ2UgR3JvdXAgMCBpZD0weDdmIHBhY2thZ2VDb3VudD0xIG5hbWU9aW8uYXBwaXVtLmFuZHJvaWQuYXBpc1xuICAgICAgUGFja2FnZSAwIGlkPTB4N2YgbmFtZT1pby5hcHBpdW0uYW5kcm9pZC5hcGlzXG4gICAgICAgIHR5cGUgMCBjb25maWdDb3VudD0xIGVudHJ5Q291bnQ9NlxuICAgICAgICAgIGNvbmZpZyAoZGVmYXVsdCk6XG4gICAgICAgICAgICByZXNvdXJjZSAweDdmMGMwMjE1IGlvLmFwcGl1bS5hbmRyb2lkLmFwaXM6c3RyaW5nL2xpbmVhcl9sYXlvdXRfOF92ZXJ0aWNhbDogdD0weDAzIGQ9MHgwMDAwMDQ0YyAocz0weDAwMDggcj0weDAwKVxuICAgICAgICAgICAgICAoc3RyaW5nMTYpIFwiVmVydGljYWxcIlxuICAgICAgICAgICAgcmVzb3VyY2UgMHg3ZjBjMDIxNiBpby5hcHBpdW0uYW5kcm9pZC5hcGlzOnN0cmluZy9saW5lYXJfbGF5b3V0XzhfaG9yaXpvbnRhbDogdD0weDAzIGQ9MHgwMDAwMDQ0ZCAocz0weDAwMDggcj0weDAwKVxuICAgICAgICAgICAgICAoc3RyaW5nMTYpIFwiSG9yaXpvbnRhbFwiXG4gICAgICAgICAgY29uZmlnIGZyOlxuICAgICAgICAgICAgcmVzb3VyY2UgMHg3ZjBjMDIxNSBpby5hcHBpdW0uYW5kcm9pZC5hcGlzOnN0cmluZy9saW5lYXJfbGF5b3V0XzhfdmVydGljYWw6IHQ9MHgwMyBkPTB4MDAwMDA0NGMgKHM9MHgwMDA4IHI9MHgwMClcbiAgICAgICAgICAgICAgKHN0cmluZzE2KSBcIlZlcnRpY2FsXCJcbiAgICAgICAgICAgIHJlc291cmNlIDB4N2YwYzAyMTYgaW8uYXBwaXVtLmFuZHJvaWQuYXBpczpzdHJpbmcvbGluZWFyX2xheW91dF84X2hvcml6b250YWw6IHQ9MHgwMyBkPTB4MDAwMDA0NGQgKHM9MHgwMDA4IHI9MHgwMClcbiAgICAgICAgICAgICAgKHN0cmluZzE2KSBcIkhvcml6b250YWxcIlxuICAgICAgYH0pO1xuICAgICAgbW9ja3MudGVlbl9wcm9jZXNzLmV4cGVjdHMoJ2V4ZWMnKVxuICAgICAgLnJldHVybnMoe3N0ZG91dDogYFxuICAgICAgbm9kcGktdjRcblxuICAgICAgeGxhcmdlLXY0XG4gICAgICB2OVxuICAgICAgdjExXG4gICAgICB2MTJcbiAgICAgIHYxM1xuICAgICAgdzYwMGRwLXYxM1xuICAgICAgdzcyMGRwLXYxM1xuICAgICAgdzEwMjRkcC12MTNcbiAgICAgIGg1NTBkcC12MTNcbiAgICAgIGg2NzBkcC12MTNcbiAgICAgIGg5NzRkcC12MTNcbiAgICAgIHN3NDgwZHAtdjEzXG4gICAgICBzdzYwMGRwLXYxM1xuICAgICAgc3c3MjBkcC12MTNcbiAgICAgIHYxNFxuICAgICAgdjE2XG4gICAgICB2MTdcbiAgICAgIGxhbmRcbiAgICAgIGxhbmQtdjEzXG4gICAgICBsZHBpLXY0XG4gICAgICBtZHBpLXY0XG4gICAgICBoZHBpLXY0XG4gICAgICB4aGRwaS12NFxuICAgICAgZnJcbiAgICAgIGB9KTtcbiAgICAgIG1vY2tzLmZzLmV4cGVjdHMoJ3dyaXRlRmlsZScpLm9uY2UoKTtcbiAgICAgIGNvbnN0IHthcGtTdHJpbmdzLCBsb2NhbFBhdGh9ID0gYXdhaXQgYWRiLmV4dHJhY3RTdHJpbmdzRnJvbUFwaygnL2Zha2UvcGF0aC5hcGsnLCAnZW4nLCAnL3RtcCcpO1xuICAgICAgYXBrU3RyaW5ncy5saW5lYXJfbGF5b3V0XzhfaG9yaXpvbnRhbC5zaG91bGQuZXFsKCdIb3Jpem9udGFsJyk7XG4gICAgICBsb2NhbFBhdGguc2hvdWxkLmVxbChwYXRoLnJlc29sdmUoJy90bXAnLCAnc3RyaW5ncy5qc29uJykpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgcHJvcGVybHkgcGFyc2UgYWFwdCBvdXRwdXQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy50ZWVuX3Byb2Nlc3MuZXhwZWN0cygnZXhlYycpLm9uY2UoKVxuICAgICAgICAucmV0dXJucyh7c3Rkb3V0OiBgXG4gICAgICAgIFBhY2thZ2UgR3JvdXBzICgxKVxuICAgICAgICBQYWNrYWdlIEdyb3VwIDAgaWQ9MHg3ZiBwYWNrYWdlQ291bnQ9MSBuYW1lPWlvLmFwcGl1bS50ZXN0XG4gICAgICAgICAgUGFja2FnZSAwIGlkPTB4N2YgbmFtZT1pby5hcHBpdW0udGVzdFxuICAgICAgICAgICAgdHlwZSAwIGNvbmZpZ0NvdW50PTEgZW50cnlDb3VudD02ODVcbiAgICAgICAgICAgICAgc3BlYyByZXNvdXJjZSAweDdmMDEwMDAwIGlvLmFwcGl1bS50ZXN0OmF0dHIvYXVkaW9NZXNzYWdlRHVyYXRpb246IGZsYWdzPTB4MDAwMDAwMDBcbiAgICAgICAgICAgICAgc3BlYyByZXNvdXJjZSAweDdmMDEwMDAxIGlvLmFwcGl1bS50ZXN0OmF0dHIvY2FsbGluZ0NoYXRoZWFkRm9vdGVyOiBmbGFncz0weDAwMDAwMDAwXG4gICAgICAgICAgICAgIHNwZWMgcmVzb3VyY2UgMHg3ZjAxMDAwMiBpby5hcHBpdW0udGVzdDphdHRyL2NhbGxpbmdDaGF0aGVhZEluaXRpYWxzOiBmbGFncz0weDAwMDAwMDAwXG4gICAgICAgICAgICAgIHNwZWMgcmVzb3VyY2UgMHg3ZjAxMDAwMyBpby5hcHBpdW0udGVzdDphdHRyL2NhbGxpbmdDb250cm9sQnV0dG9uTGFiZWw6IGZsYWdzPTB4MDAwMDAwMDBcbiAgICAgICAgICAgICAgc3BlYyByZXNvdXJjZSAweDdmMDEwMDA0IGlvLmFwcGl1bS50ZXN0OmF0dHIvY2lyY2xlUmFkaXVzOiBmbGFncz0weDAwMDAwMDAwXG4gICAgICAgICAgICAgIGNvbmZpZyBkZS1yREU6XG4gICAgICAgICAgICAgICAgcmVzb3VyY2UgMHg3ZjAxMDAwMCBpby5hcHBpdW0udGVzdDphdHRyL2F1ZGlvTWVzc2FnZUR1cmF0aW9uOiA8YmFnPlxuICAgICAgICAgICAgICAgICAgUGFyZW50PTB4MDAwMDAwMDAoUmVzb2x2ZWQ9MHg3ZjAwMDAwMCksIENvdW50PTFcbiAgICAgICAgICAgICAgICAgICMwIChLZXk9MHgwMTAwMDAwMCk6IChjb2xvcikgIzAwMDAwMDAxXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UgMHg3ZjAxMDAwMSBpby5hcHBpdW0udGVzdDphdHRyL2NhbGxpbmdDaGF0aGVhZEZvb3RlcjogPGJhZz5cbiAgICAgICAgICAgICAgICAgIFBhcmVudD0weDAwMDAwMDAwKFJlc29sdmVkPTB4N2YwMDAwMDApLCBDb3VudD0xXG4gICAgICAgICAgICAgICAgICAjMCAoS2V5PTB4MDEwMDAwMDApOiAoY29sb3IpICMwMDAwMDAwMVxuICAgICAgICAgICAgICBjb25maWcgZGUtckRFOlxuICAgICAgICAgICAgICAgIHJlc291cmNlIDB4N2YwODAwMDAgaW8uYXBwaXVtLnRlc3Q6c3RyaW5nL2FiY19hY3Rpb25fYmFyX2hvbWVfZGVzY3JpcHRpb246IHQ9MHgwMyBkPTB4MDAwMDBjMjcgKHM9MHgwMDA4IHI9MHgwMClcbiAgICAgICAgICAgICAgICAgIChzdHJpbmc4KSBcIk5hdmlnYXRlIFxcXFxcImhvbWVcXFxcXCJcIlxuICAgICAgICAgICAgICAgIHJlc291cmNlIDB4N2YwODAwMDEgaW8uYXBwaXVtLnRlc3Q6c3RyaW5nL2FiY19hY3Rpb25fYmFyX2hvbWVfZGVzY3JpcHRpb25fZm9ybWF0OiB0PTB4MDMgZD0weDAwMDAwYWQxIChzPTB4MDAwOCByPTB4MDApXG4gICAgICAgICAgICAgICAgICAoc3RyaW5nOCkgXCIlMSRzLCAlMiRzXCJcbiAgICAgICAgICAgICAgICByZXNvdXJjZSAweDdmMDgwMDAyIGlvLmFwcGl1bS50ZXN0OnN0cmluZy9hYmNfYWN0aW9uX2Jhcl9ob21lX3N1YnRpdGxlX2Rlc2NyaXB0aW9uX2Zvcm1hdDogdD0weDAzIGQ9MHgwMDAwMGFkMCAocz0weDAwMDggcj0weDAwKVxuICAgICAgICAgICAgICAgICAgKHN0cmluZzgpIFwiJTEkcywgJTIkcywgJTMkc1wiXG4gICAgICAgICAgICB0eXBlIDEgY29uZmlnQ291bnQ9MSBlbnRyeUNvdW50PTY4NVxuICAgICAgICAgICAgICBjb25maWcgZGUtckRFOlxuICAgICAgICAgICAgICAgIHJlc291cmNlIDB4N2YwYTAwMDAgaW8uYXBwaXVtLnRlc3Q6cGx1cmFscy9jYWxsaW5nX19jb252ZXJzYXRpb25fZnVsbF9fbWVzc2FnZTogPGJhZz5cbiAgICAgICAgICAgICAgICAgIFBhcmVudD0weDAwMDAwMDAwKFJlc29sdmVkPTB4N2YwMDAwMDApLCBDb3VudD0yXG4gICAgICAgICAgICAgICAgICAjMCAoS2V5PTB4MDEwMDAwMDQpOiAoc3RyaW5nOCkgXCJDYWxscyB3b3JrIGluIGNvbnZlcnNhdGlvbnMgd2l0aCB1cCB0byAxIHBlcnNvbi5cIlxuICAgICAgICAgICAgICAgICAgIzEgKEtleT0weDAxMDAwMDA1KTogKHN0cmluZzgpIFwiQ2FsbHMgd29yayBpbiBjb252ZXJzYXRpb25zIHdpdGggdXAgdG8gJTEkZCBwZW9wbGUuIFxcXFxcImJsYWJsYVxcXFxcIlwiXG4gICAgICAgICAgICAgICAgcmVzb3VyY2UgMHg3ZjBhMDAwMSBpby5hcHBpdW0udGVzdDpwbHVyYWxzL2NhbGxpbmdfX3ZvaWNlX2NoYW5uZWxfZnVsbF9fbWVzc2FnZTogPGJhZz5cbiAgICAgICAgICAgICAgICAgIFBhcmVudD0weDAwMDAwMDAwKFJlc29sdmVkPTB4N2YwMDAwMDApLCBDb3VudD02XG4gICAgICAgICAgICAgICAgICAjMCAoS2V5PTB4MDEwMDAwMDQpOiAoc3RyaW5nOCkgXCJUaGVyZSdzIG9ubHkgcm9vbSBmb3IgJTEkZCBwZW9wbGUgaW4gaGVyZS5cIlxuICAgICAgICAgICAgICAgICAgIzEgKEtleT0weDAxMDAwMDA1KTogKHN0cmluZzgpIFwiVGhlcmUncyBvbmx5IHJvb20gZm9yICUxJGQgcGVvcGxlIGluIGhlcmUuXCJcbiAgICAgICAgICAgICAgICAgICMyIChLZXk9MHgwMTAwMDAwNik6IChzdHJpbmc4KSBcIlRoZXJlJ3Mgb25seSByb29tIGZvciAlMSRkIHBlb3BsZSBpbiBoZXJlLlwiXG4gICAgICAgICAgICAgICAgICAjMyAoS2V5PTB4MDEwMDAwMDcpOiAoc3RyaW5nOCkgXCJUaGVyZSdzIG9ubHkgcm9vbSBmb3IgJTEkZCBwZW9wbGUgaW4gaGVyZS5cIlxuICAgICAgICAgICAgICAgICAgIzQgKEtleT0weDAxMDAwMDA4KTogKHN0cmluZzgpIFwiVGhlcmUncyBvbmx5IHJvb20gZm9yICUxJGQgcGVvcGxlIGluIGhlcmUuXCJcbiAgICAgICAgICAgICAgICAgICM1IChLZXk9MHgwMTAwMDAwOSk6IChzdHJpbmc4KSBcIlRoZXJlJ3Mgb25seSByb29tIGZvciAlMSRkIHBlb3BsZSBpbiBoZXJlLlwiXG4gICAgICAgICAgICB0eXBlIDE2IGNvbmZpZ0NvdW50PTEgZW50cnlDb3VudD04XG4gICAgICAgICAgICAgIHNwZWMgcmVzb3VyY2UgMHg3ZjExMDAwMCBpby5hcHBpdW0udGVzdDptZW51L2NvbnZlcnNhdGlvbl9oZWFkZXJfbWVudV9hdWRpbzogZmxhZ3M9MHgwMDAwMDAwMFxuICAgICAgICAgICAgICBzcGVjIHJlc291cmNlIDB4N2YxMTAwMDEgaW8uYXBwaXVtLnRlc3Q6bWVudS9jb252ZXJzYXRpb25faGVhZGVyX21lbnVfY29sbGVjdGlvbjogZmxhZ3M9MHgwMDAwMDAwMFxuICAgICAgICAgICAgICBzcGVjIHJlc291cmNlIDB4N2YxMTAwMDIgaW8uYXBwaXVtLnRlc3Q6bWVudS9jb252ZXJzYXRpb25faGVhZGVyX21lbnVfY29sbGVjdGlvbl9zZWFyY2hpbmc6IGZsYWdzPTB4MDAwMDAwMDBcbiAgICAgICAgICAgICAgc3BlYyByZXNvdXJjZSAweDdmMTEwMDAzIGlvLmFwcGl1bS50ZXN0Om1lbnUvY29udmVyc2F0aW9uX2hlYWRlcl9tZW51X3ZpZGVvOiBmbGFncz0weDAwMDAwMDAwXG4gICAgICAgICAgICAgIHNwZWMgcmVzb3VyY2UgMHg3ZjExMDAwNCBpby5hcHBpdW0udGVzdDptZW51L2NvbnZlcnNhdGlvbl9tdWx0aXVzZTogZmxhZ3M9MHgwMDAwMDAwMFxuICAgICAgICAgICAgICBzcGVjIHJlc291cmNlIDB4N2YxMTAwMDUgaW8uYXBwaXVtLnRlc3Q6bWVudS90b29sYmFyX2Nsb3NlX3doaXRlOiBmbGFncz0weDAwMDAwMDAwXG4gICAgICAgICAgICAgIHNwZWMgcmVzb3VyY2UgMHg3ZjExMDAwNiBpby5hcHBpdW0udGVzdDptZW51L3Rvb2xiYXJfY29sbGVjdGlvbjogZmxhZ3M9MHgwMDAwMDAwMFxuICAgICAgICAgICAgICBzcGVjIHJlc291cmNlIDB4N2YxMTAwMDcgaW8uYXBwaXVtLnRlc3Q6bWVudS90b29sYmFyX3NrZXRjaDogZmxhZ3M9MHgwMDAwMDAwMFxuICAgICAgICAgICAgICBjb25maWcgKGRlZmF1bHQpOlxuICAgICAgICAgICAgICAgIHJlc291cmNlIDB4N2YxMTAwMDAgaW8uYXBwaXVtLnRlc3Q6bWVudS9jb252ZXJzYXRpb25faGVhZGVyX21lbnVfYXVkaW86IHQ9MHgwMyBkPTB4MDAwMDAwYjYgKHM9MHgwMDA4IHI9MHgwMClcbiAgICAgICAgICAgICAgICAgIChzdHJpbmc4KSBcInJlcy9tZW51L2NvbnZlcnNhdGlvbl9oZWFkZXJfbWVudV9hdWRpby54bWxcIlxuICAgICAgICAgICAgICAgIHJlc291cmNlIDB4N2YxMTAwMDEgaW8uYXBwaXVtLnRlc3Q6bWVudS9jb252ZXJzYXRpb25faGVhZGVyX21lbnVfY29sbGVjdGlvbjogdD0weDAzIGQ9MHgwMDAwMDBiNyAocz0weDAwMDggcj0weDAwKVxuICAgICAgICAgICAgICAgICAgKHN0cmluZzgpIFwicmVzL21lbnUvY29udmVyc2F0aW9uX2hlYWRlcl9tZW51X2NvbGxlY3Rpb24ueG1sXCJcbiAgICAgICAgICAgICAgICByZXNvdXJjZSAweDdmMTEwMDAyIGlvLmFwcGl1bS50ZXN0Om1lbnUvY29udmVyc2F0aW9uX2hlYWRlcl9tZW51X2NvbGxlY3Rpb25fc2VhcmNoaW5nOiB0PTB4MDMgZD0weDAwMDAwMGI4IChzPTB4MDAwOCByPTB4MDApXG4gICAgICAgICAgICAgICAgICAoc3RyaW5nOCkgXCJyZXMvbWVudS9jb252ZXJzYXRpb25faGVhZGVyX21lbnVfY29sbGVjdGlvbl9zZWFyY2hpbmcueG1sXCJcbiAgICAgICAgICAgICAgICByZXNvdXJjZSAweDdmMTEwMDAzIGlvLmFwcGl1bS50ZXN0Om1lbnUvY29udmVyc2F0aW9uX2hlYWRlcl9tZW51X3ZpZGVvOiB0PTB4MDMgZD0weDAwMDAwMGI5IChzPTB4MDAwOCByPTB4MDApXG4gICAgICAgICAgICAgICAgICAoc3RyaW5nOCkgXCJyZXMvbWVudS9jb252ZXJzYXRpb25faGVhZGVyX21lbnVfdmlkZW8ueG1sXCJcbiAgICAgICAgICAgICAgICByZXNvdXJjZSAweDdmMTEwMDA0IGlvLmFwcGl1bS50ZXN0Om1lbnUvY29udmVyc2F0aW9uX211bHRpdXNlOiB0PTB4MDMgZD0weDAwMDAwMGJhIChzPTB4MDAwOCByPTB4MDApXG4gICAgICAgICAgICAgICAgICAoc3RyaW5nOCkgXCJyZXMvbWVudS9jb252ZXJzYXRpb25fbXVsdGl1c2UueG1sXCJcbiAgICAgICAgICAgICAgICByZXNvdXJjZSAweDdmMTEwMDA1IGlvLmFwcGl1bS50ZXN0Om1lbnUvdG9vbGJhcl9jbG9zZV93aGl0ZTogdD0weDAzIGQ9MHgwMDAwMDBiYiAocz0weDAwMDggcj0weDAwKVxuICAgICAgICAgICAgICAgICAgKHN0cmluZzgpIFwicmVzL21lbnUvdG9vbGJhcl9jbG9zZV93aGl0ZS54bWxcIlxuICAgICAgICAgICAgICAgIHJlc291cmNlIDB4N2YxMTAwMDYgaW8uYXBwaXVtLnRlc3Q6bWVudS90b29sYmFyX2NvbGxlY3Rpb246IHQ9MHgwMyBkPTB4MDAwMDAwYmMgKHM9MHgwMDA4IHI9MHgwMClcbiAgICAgICAgICAgICAgICAgIChzdHJpbmc4KSBcInJlcy9tZW51L3Rvb2xiYXJfY29sbGVjdGlvbi54bWxcIlxuICAgICAgICAgICAgICAgIHJlc291cmNlIDB4N2YxMTAwMDcgaW8uYXBwaXVtLnRlc3Q6bWVudS90b29sYmFyX3NrZXRjaDogdD0weDAzIGQ9MHgwMDAwMDA3ZiAocz0weDAwMDggcj0weDAwKVxuICAgICAgICAgICAgICAgICAgKHN0cmluZzgpIFwicmVzL21lbnUvdG9vbGJhcl9za2V0Y2gueG1sXCJcbiAgICAgICAgYH0pO1xuICAgICAgbW9ja3MuZnMuZXhwZWN0cygnd3JpdGVGaWxlJykub25jZSgpO1xuICAgICAgY29uc3Qge2Fwa1N0cmluZ3MsIGxvY2FsUGF0aH0gPSBhd2FpdCBhZGIuZXh0cmFjdFN0cmluZ3NGcm9tQXBrKCcvZmFrZS9wYXRoLmFwaycsICdkZS1ERScsICcvdG1wJyk7XG4gICAgICBhcGtTdHJpbmdzLmFiY19hY3Rpb25fYmFyX2hvbWVfZGVzY3JpcHRpb24uc2hvdWxkLmVxbCgnTmF2aWdhdGUgXCJob21lXCInKTtcbiAgICAgIGFwa1N0cmluZ3MuY2FsbGluZ19fY29udmVyc2F0aW9uX2Z1bGxfX21lc3NhZ2Uuc2hvdWxkLmVxbChbXG4gICAgICAgICdDYWxscyB3b3JrIGluIGNvbnZlcnNhdGlvbnMgd2l0aCB1cCB0byAxIHBlcnNvbi4nLFxuICAgICAgICAnQ2FsbHMgd29yayBpbiBjb252ZXJzYXRpb25zIHdpdGggdXAgdG8gJTEkZCBwZW9wbGUuIFwiYmxhYmxhXCInLFxuICAgICAgXSk7XG4gICAgICBsb2NhbFBhdGguc2hvdWxkLmVxbChwYXRoLnJlc29sdmUoJy90bXAnLCAnc3RyaW5ncy5qc29uJykpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZ2V0Rm9jdXNlZFBhY2thZ2VBbmRBY3Rpdml0eScsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnc2hvdWxkIHBhcnNlIGNvcnJlY3RseSBhbmQgcmV0dXJuIHBhY2thZ2UgYW5kIGFjdGl2aXR5JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ3NoZWxsJylcbiAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnZHVtcHN5cycsICd3aW5kb3cnLCAnd2luZG93cyddKVxuICAgICAgICAucmV0dXJucyhgbUZvY3VzZWRBcHA9QXBwV2luZG93VG9rZW57Mzg2MDBiNTYgdG9rZW49VG9rZW57OWVhMTE3MSBgICtcbiAgICAgICAgICAgICAgICAgYEFjdGl2aXR5UmVjb3JkezIgdSAke3BrZ30vJHthY3R9IHQxODF9fX1cXG5gICtcbiAgICAgICAgICAgICAgICAgYG1DdXJyZW50Rm9jdXM9V2luZG93ezQzMzBiNmMwIGNvbS5hbmRyb2lkLnNldHRpbmdzL2NvbS5hbmRyb2lkLnNldHRpbmdzLlN1YlNldHRpbmdzIHBhdXNlZD1mYWxzZX1gKTtcblxuICAgICAgbGV0IHthcHBQYWNrYWdlLCBhcHBBY3Rpdml0eX0gPSBhd2FpdCBhZGIuZ2V0Rm9jdXNlZFBhY2thZ2VBbmRBY3Rpdml0eSgpO1xuICAgICAgYXBwUGFja2FnZS5zaG91bGQuZXF1YWwocGtnKTtcbiAgICAgIGFwcEFjdGl2aXR5LnNob3VsZC5lcXVhbChhY3QpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgcGFyc2UgY29ycmVjdGx5IGFuZCByZXR1cm4gcGFja2FnZSBhbmQgYWN0aXZpdHkgd2hlbiBhIGNvbW1hIGlzIHByZXNlbnQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2hlbGwnKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydkdW1wc3lzJywgJ3dpbmRvdycsICd3aW5kb3dzJ10pXG4gICAgICAgIC5yZXR1cm5zKGBtRm9jdXNlZEFwcD1BcHBXaW5kb3dUb2tlbnsyMGZlMjE3ZSB0b2tlbj1Ub2tlbnsyMTg3ODczOSBgICtcbiAgICAgICAgICAgICAgICAgYEFjdGl2aXR5UmVjb3JkezE2NDI1MzAwIHUwICR7cGtnfS8ke2FjdH0sIGlzU2hhZG93OmZhbHNlIHQxMH19fWApO1xuXG4gICAgICBsZXQge2FwcFBhY2thZ2UsIGFwcEFjdGl2aXR5fSA9IGF3YWl0IGFkYi5nZXRGb2N1c2VkUGFja2FnZUFuZEFjdGl2aXR5KCk7XG4gICAgICBhcHBQYWNrYWdlLnNob3VsZC5lcXVhbChwa2cpO1xuICAgICAgYXBwQWN0aXZpdHkuc2hvdWxkLmVxdWFsKGFjdCk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBwYXJzZSBjb3JyZWN0bHkgYW5kIHJldHVybiBwYWNrYWdlIGFuZCBhY3Rpdml0eSBvZiBvbmx5IG1DdXJyZW50Rm9jdXMgaXMgc2V0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ3NoZWxsJylcbiAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnZHVtcHN5cycsICd3aW5kb3cnLCAnd2luZG93cyddKVxuICAgICAgICAucmV0dXJucyhgbUZvY3VzZWRBcHA9bnVsbFxcbiAgbUN1cnJlbnRGb2N1cz1XaW5kb3d7NDMzMGI2YzAgdTAgJHtwa2d9LyR7YWN0fSBwYXVzZWQ9ZmFsc2V9YCk7XG5cbiAgICAgIGxldCB7YXBwUGFja2FnZSwgYXBwQWN0aXZpdHl9ID0gYXdhaXQgYWRiLmdldEZvY3VzZWRQYWNrYWdlQW5kQWN0aXZpdHkoKTtcbiAgICAgIGFwcFBhY2thZ2Uuc2hvdWxkLmVxdWFsKHBrZyk7XG4gICAgICBhcHBBY3Rpdml0eS5zaG91bGQuZXF1YWwoYWN0KTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIHJldHVybiBudWxsIGlmIG1Gb2N1c2VkQXBwPW51bGwnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2hlbGwnKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydkdW1wc3lzJywgJ3dpbmRvdycsICd3aW5kb3dzJ10pXG4gICAgICAgIC5yZXR1cm5zKCdtRm9jdXNlZEFwcD1udWxsJyk7XG4gICAgICBsZXQge2FwcFBhY2thZ2UsIGFwcEFjdGl2aXR5fSA9IGF3YWl0IGFkYi5nZXRGb2N1c2VkUGFja2FnZUFuZEFjdGl2aXR5KCk7XG4gICAgICBzaG91bGQubm90LmV4aXN0KGFwcFBhY2thZ2UpO1xuICAgICAgc2hvdWxkLm5vdC5leGlzdChhcHBBY3Rpdml0eSk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gbnVsbCBpZiBtQ3VycmVudEZvY3VzPW51bGwnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2hlbGwnKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydkdW1wc3lzJywgJ3dpbmRvdycsICd3aW5kb3dzJ10pXG4gICAgICAgIC5yZXR1cm5zKCdtQ3VycmVudEZvY3VzPW51bGwnKTtcbiAgICAgIGxldCB7YXBwUGFja2FnZSwgYXBwQWN0aXZpdHl9ID0gYXdhaXQgYWRiLmdldEZvY3VzZWRQYWNrYWdlQW5kQWN0aXZpdHkoKTtcbiAgICAgIHNob3VsZC5ub3QuZXhpc3QoYXBwUGFja2FnZSk7XG4gICAgICBzaG91bGQubm90LmV4aXN0KGFwcEFjdGl2aXR5KTtcbiAgICB9KTtcbiAgfSk7XG4gIGRlc2NyaWJlKCd3YWl0Rm9yQWN0aXZpdHlPck5vdCcsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgb25jZSBhbmQgc2hvdWxkIHJldHVybicsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdzaGVsbCcpXG4gICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ2R1bXBzeXMnLCAnd2luZG93JywgJ3dpbmRvd3MnXSlcbiAgICAgICAgLnJldHVybnMoYG1Gb2N1c2VkQXBwPUFwcFdpbmRvd1Rva2VuezM4NjAwYjU2IHRva2VuPVRva2VuezllYTExNzEgYCArXG4gICAgICAgICAgICAgICAgIGBBY3Rpdml0eVJlY29yZHsyIHUgJHtwa2d9LyR7YWN0fSB0MTgxfX19YCk7XG5cbiAgICAgIGF3YWl0IGFkYi53YWl0Rm9yQWN0aXZpdHlPck5vdChwa2csIGFjdCwgZmFsc2UpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgY2FsbCBzaGVsbCBtdWx0aXBsZSB0aW1lcyBhbmQgcmV0dXJuJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ3NoZWxsJykub25DYWxsKDApXG4gICAgICAgIC5yZXR1cm5zKCdtRm9jdXNlZEFwcD1BcHBXaW5kb3dUb2tlbnszODYwMGI1NiB0b2tlbj1Ub2tlbns5ZWExMTcxICcgK1xuICAgICAgICAgICAgICAgICAnQWN0aXZpdHlSZWNvcmR7MmM3YzQzMTggdTAgZm9vL2JhciB0MTgxfX19Jyk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2hlbGwnKVxuICAgICAgICAucmV0dXJucygnbUZvY3VzZWRBcHA9QXBwV2luZG93VG9rZW57Mzg2MDBiNTYgdG9rZW49VG9rZW57OWVhMTE3MSAnICtcbiAgICAgICAgICAgICAgICAgJ0FjdGl2aXR5UmVjb3JkezJjN2M0MzE4IHUwIGNvbS5leGFtcGxlLmFuZHJvaWQuY29udGFjdG1hbmFnZXIvLkNvbnRhY3RNYW5hZ2VyIHQxODF9fX0nKTtcblxuICAgICAgYXdhaXQgYWRiLndhaXRGb3JBY3Rpdml0eU9yTm90KHBrZywgYWN0LCBmYWxzZSk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIG9uY2UgcmV0dXJuIGZvciBub3QnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2hlbGwnKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydkdW1wc3lzJywgJ3dpbmRvdycsICd3aW5kb3dzJ10pXG4gICAgICAgIC5yZXR1cm5zKCdtRm9jdXNlZEFwcD1BcHBXaW5kb3dUb2tlbnszODYwMGI1NiB0b2tlbj1Ub2tlbns5ZWExMTcxICcgK1xuICAgICAgICAgICAgICAgICAnQWN0aXZpdHlSZWNvcmR7YyAwIGZvby9iYXIgdDE4MX19fScpO1xuXG4gICAgICBhd2FpdCBhZGIud2FpdEZvckFjdGl2aXR5T3JOb3QocGtnLCBhY3QsIHRydWUpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgY2FsbCBzaGVsbCBtdWx0aXBsZSB0aW1lcyBhbmQgcmV0dXJuIGZvciBub3QnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2hlbGwnKS5vbkNhbGwoMClcbiAgICAgICAgLnJldHVybnMoYG1Gb2N1c2VkQXBwPUFwcFdpbmRvd1Rva2VuezM4NjAwYjU2IHRva2VuPVRva2VuezllYTExNzEgYCArXG4gICAgICAgICAgICAgICAgIGBBY3Rpdml0eVJlY29yZHsyIHUgJHtwa2d9LyR7YWN0fSB0MTgxfX19YCk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2hlbGwnKVxuICAgICAgICAucmV0dXJucygnbUZvY3VzZWRBcHA9QXBwV2luZG93VG9rZW57Mzg2MDBiNTYgdG9rZW49VG9rZW57OWVhMTE3MSAnICtcbiAgICAgICAgICAgICAgICAgJ0FjdGl2aXR5UmVjb3JkezJjN2M0MzE4IHUwIGZvby9iYXIgdDE4MX19fScpO1xuICAgICAgYXdhaXQgYWRiLndhaXRGb3JBY3Rpdml0eU9yTm90KHBrZywgYWN0LCB0cnVlKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIGJlIGFibGUgdG8gZ2V0IGZpcnN0IG9mIGEgY29tbWEtc2VwYXJhdGVkIGxpc3Qgb2YgYWN0aXZpdGllcycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdzaGVsbCcpXG4gICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ2R1bXBzeXMnLCAnd2luZG93JywgJ3dpbmRvd3MnXSlcbiAgICAgICAgLnJldHVybnMoYG1Gb2N1c2VkQXBwPUFwcFdpbmRvd1Rva2VuezM4NjAwYjU2IHRva2VuPVRva2VuezllYTExNzEgYCArXG4gICAgICAgICAgICAgICAgIGBBY3Rpdml0eVJlY29yZHsyIHUgJHtwa2d9Ly5Db250YWN0TWFuYWdlciB0MTgxfX19YCk7XG5cbiAgICAgIGF3YWl0IGFkYi53YWl0Rm9yQWN0aXZpdHlPck5vdChwa2csICcuQ29udGFjdE1hbmFnZXIsIC5PdGhlck1hbmFnZXInLCBmYWxzZSk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBiZSBhYmxlIHRvIGdldCBzZWNvbmQgb2YgYSBjb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiBhY3Rpdml0aWVzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ3NoZWxsJylcbiAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnZHVtcHN5cycsICd3aW5kb3cnLCAnd2luZG93cyddKVxuICAgICAgICAucmV0dXJucyhgbUZvY3VzZWRBcHA9QXBwV2luZG93VG9rZW57Mzg2MDBiNTYgdG9rZW49VG9rZW57OWVhMTE3MSBgICtcbiAgICAgICAgICAgICAgICAgYEFjdGl2aXR5UmVjb3JkezIgdSAke3BrZ30vLk90aGVyTWFuYWdlciB0MTgxfX19YCk7XG5cbiAgICAgIGF3YWl0IGFkYi53YWl0Rm9yQWN0aXZpdHlPck5vdChwa2csICcuQ29udGFjdE1hbmFnZXIsIC5PdGhlck1hbmFnZXInLCBmYWxzZSk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBmYWlsIGlmIG5vIGFjdGl2aXR5IGluIGEgY29tbWEtc2VwYXJhdGVkIGxpc3QgaXMgYXZhaWxhYmxlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ3NoZWxsJylcbiAgICAgICAgLmF0TGVhc3QoMSlcbiAgICAgICAgLndpdGhFeGFjdEFyZ3MoWydkdW1wc3lzJywgJ3dpbmRvdycsICd3aW5kb3dzJ10pXG4gICAgICAgIC5yZXR1cm5zKGBtRm9jdXNlZEFwcD1BcHBXaW5kb3dUb2tlbnszODYwMGI1NiB0b2tlbj1Ub2tlbns5ZWExMTcxIGAgK1xuICAgICAgICAgICAgICAgICBgQWN0aXZpdHlSZWNvcmR7MiB1ICR7cGtnfS8ke2FjdH0gdDE4MX19fWApO1xuXG4gICAgICBhd2FpdCBhZGIud2FpdEZvckFjdGl2aXR5T3JOb3QocGtnLCAnLlN1cGVyTWFuYWdlciwgLk90aGVyTWFuYWdlcicsIGZhbHNlLCAxMDAwKVxuICAgICAgICAuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWQ7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBiZSBhYmxlIHRvIG1hdGNoIGFjdGl2aXRpZXMgaWYgd2FpdEFjdGl2aXR5IGlzIGEgd2lsZGNhcmQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2hlbGwnKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydkdW1wc3lzJywgJ3dpbmRvdycsICd3aW5kb3dzJ10pXG4gICAgICAgIC5yZXR1cm5zKGBtRm9jdXNlZEFwcD1BcHBXaW5kb3dUb2tlbnszODYwMGI1NiB0b2tlbj1Ub2tlbns5ZWExMTcxIGAgK1xuICAgICAgICAgICAgICAgICBgQWN0aXZpdHlSZWNvcmR7MiB1ICR7cGtnfS8uQ29udGFjdE1hbmFnZXIgdDE4MX19fWApO1xuXG4gICAgICBhd2FpdCBhZGIud2FpdEZvckFjdGl2aXR5T3JOb3QocGtnLCBgKmAsIGZhbHNlKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIGJlIGFibGUgdG8gbWF0Y2ggYWN0aXZpdGllcyBpZiB3YWl0QWN0aXZpdHkgaXMgc2hvcnRlbmVkIGFuZCBjb250YWlucyBhIHdoaWxkY2FyZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdzaGVsbCcpXG4gICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ2R1bXBzeXMnLCAnd2luZG93JywgJ3dpbmRvd3MnXSlcbiAgICAgICAgLnJldHVybnMoYG1Gb2N1c2VkQXBwPUFwcFdpbmRvd1Rva2VuezM4NjAwYjU2IHRva2VuPVRva2VuezllYTExNzEgYCArXG4gICAgICAgICAgICAgICAgIGBBY3Rpdml0eVJlY29yZHsyIHUgJHtwa2d9Ly5Db250YWN0TWFuYWdlciB0MTgxfX19YCk7XG5cbiAgICAgIGF3YWl0IGFkYi53YWl0Rm9yQWN0aXZpdHlPck5vdChwa2csIGAuKk1hbmFnZXJgLCBmYWxzZSk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBiZSBhYmxlIHRvIG1hdGNoIGFjdGl2aXRpZXMgaWYgd2FpdEFjdGl2aXR5IGNvbnRhaW5zIGEgd2lsZGNhcmQgYWx0ZXJuYXRpdmUgdG8gYWN0aXZpdHknLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2hlbGwnKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydkdW1wc3lzJywgJ3dpbmRvdycsICd3aW5kb3dzJ10pXG4gICAgICAgIC5yZXR1cm5zKGBtRm9jdXNlZEFwcD1BcHBXaW5kb3dUb2tlbnszODYwMGI1NiB0b2tlbj1Ub2tlbns5ZWExMTcxIGAgK1xuICAgICAgICAgICAgICAgICBgQWN0aXZpdHlSZWNvcmR7MiB1ICR7cGtnfS8uQ29udGFjdE1hbmFnZXIgdDE4MX19fWApO1xuXG4gICAgICBhd2FpdCBhZGIud2FpdEZvckFjdGl2aXR5T3JOb3QocGtnLCBgJHtwa2d9LipgLCBmYWxzZSk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBiZSBhYmxlIHRvIG1hdGNoIGFjdGl2aXRpZXMgaWYgd2FpdEFjdGl2aXR5IGNvbnRhaW5zIGEgd2lsZGNhcmQgb24gaGVhZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdzaGVsbCcpXG4gICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ2R1bXBzeXMnLCAnd2luZG93JywgJ3dpbmRvd3MnXSlcbiAgICAgICAgLnJldHVybnMoYG1Gb2N1c2VkQXBwPUFwcFdpbmRvd1Rva2VuezM4NjAwYjU2IHRva2VuPVRva2VuezllYTExNzEgYCArXG4gICAgICAgICAgICAgICAgIGBBY3Rpdml0eVJlY29yZHsyIHUgJHtwa2d9Ly5Db250YWN0TWFuYWdlciB0MTgxfX19YCk7XG5cbiAgICAgIGF3YWl0IGFkYi53YWl0Rm9yQWN0aXZpdHlPck5vdChwa2csIGAqLmNvbnRhY3RtYW5hZ2VyLkNvbnRhY3RNYW5hZ2VyYCwgZmFsc2UpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgYmUgYWJsZSB0byBtYXRjaCBhY3Rpdml0aWVzIGlmIHdhaXRBY3Rpdml0eSBjb250YWlucyBhIHdpbGRjYXJkIGFjcm9zcyBhIHBrZyBuYW1lIGFuZCBhbiBhY3Rpdml0eSBuYW1lJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ3NoZWxsJylcbiAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnZHVtcHN5cycsICd3aW5kb3cnLCAnd2luZG93cyddKVxuICAgICAgICAucmV0dXJucyhgbUZvY3VzZWRBcHA9QXBwV2luZG93VG9rZW57Mzg2MDBiNTYgdG9rZW49VG9rZW57OWVhMTE3MSBgICtcbiAgICAgICAgICAgICAgICAgYEFjdGl2aXR5UmVjb3JkezIgdSAke3BrZ30vLkNvbnRhY3RNYW5hZ2VyIHQxODF9fX1gKTtcblxuICAgICAgYXdhaXQgYWRiLndhaXRGb3JBY3Rpdml0eU9yTm90KHBrZywgYGNvbS4qTWFuYWdlcmAsIGZhbHNlKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIGJlIGFibGUgdG8gbWF0Y2ggYWN0aXZpdGllcyBpZiB3YWl0QWN0aXZpdHkgY29udGFpbnMgd2lsZGNhcmRzIGluIGJvdGggYSBwa2cgbmFtZSBhbmQgYW4gYWN0aXZpdHkgbmFtZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdzaGVsbCcpXG4gICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ2R1bXBzeXMnLCAnd2luZG93JywgJ3dpbmRvd3MnXSlcbiAgICAgICAgLnJldHVybnMoYG1Gb2N1c2VkQXBwPUFwcFdpbmRvd1Rva2VuezM4NjAwYjU2IHRva2VuPVRva2VuezllYTExNzEgYCArXG4gICAgICAgICAgICAgICAgIGBBY3Rpdml0eVJlY29yZHsyIHUgJHtwa2d9Ly5Db250YWN0TWFuYWdlciB0MTgxfX19YCk7XG5cbiAgICAgIGF3YWl0IGFkYi53YWl0Rm9yQWN0aXZpdHlPck5vdChwa2csIGBjb20uKi5jb250YWN0bWFuYWdlci4qTWFuYWdlcmAsIGZhbHNlKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIGZhaWwgaWYgYWN0aXZpdHkgbm90IHRvIG1hdGNoIGZyb20gcmVnZXhwIGFjdGl2aXRpZXMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2hlbGwnKVxuICAgICAgICAuYXRMZWFzdCgxKS53aXRoRXhhY3RBcmdzKFsnZHVtcHN5cycsICd3aW5kb3cnLCAnd2luZG93cyddKVxuICAgICAgICAucmV0dXJucyhgbUZvY3VzZWRBcHA9QXBwV2luZG93VG9rZW57Mzg2MDBiNTYgdG9rZW49VG9rZW57OWVhMTE3MSBgICtcbiAgICAgICAgICAgICAgICAgYEFjdGl2aXR5UmVjb3JkezIgdSBjb20uZXhhbXBsZS5hbmRyb2lkLnN1cGVybWFuYWdlci8uU3VwZXJNYW5hZ2VyIHQxODF9fX1gKTtcblxuICAgICAgYXdhaXQgYWRiLndhaXRGb3JBY3Rpdml0eU9yTm90KCdjb20uZXhhbXBsZS5hbmRyb2lkLnN1cGVybWFuYWdlcicsIGAke3BrZ30uKmAsIGZhbHNlLCAxMDAwKVxuICAgICAgICAuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWQ7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBiZSBhYmxlIHRvIGdldCBhbiBhY3Rpdml0eSB0aGF0IGlzIGFuIGlubmVyIGNsYXNzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ3NoZWxsJylcbiAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnZHVtcHN5cycsICd3aW5kb3cnLCAnd2luZG93cyddKVxuICAgICAgICAucmV0dXJucyhgbUZvY3VzZWRBcHA9QXBwV2luZG93VG9rZW57Mzg2MDBiNTYgdG9rZW49VG9rZW57OWVhMTE3MSBgICtcbiAgICAgICAgICBgQWN0aXZpdHlSZWNvcmR7MiB1ICR7cGtnfS8uU2V0dGluZ3MkQXBwRHJhd092ZXJsYXlTZXR0aW5nc0FjdGl2aXR5IHQxODF9fX1gKTtcblxuICAgICAgYXdhaXQgYWRiLndhaXRGb3JBY3Rpdml0eU9yTm90KHBrZywgJy5TZXR0aW5ncyRBcHBEcmF3T3ZlcmxheVNldHRpbmdzQWN0aXZpdHknLCBmYWxzZSk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBiZSBhYmxlIHRvIGdldCBmaXJzdCBhY3Rpdml0eSBmcm9tIGZpcnN0IHBhY2thZ2UgaW4gYSBjb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiBwYWNrYWdlcyArIGFjdGl2aXRpZXMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2hlbGwnKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydkdW1wc3lzJywgJ3dpbmRvdycsICd3aW5kb3dzJ10pXG4gICAgICAgIC5yZXR1cm5zKGBtRm9jdXNlZEFwcD1BcHBXaW5kb3dUb2tlbnszODYwMGI1NiB0b2tlbj1Ub2tlbns5ZWExMTcxIGAgK1xuICAgICAgICAgIGBBY3Rpdml0eVJlY29yZHsyIHUgY29tLmFuZHJvaWQuc2V0dGluZ3MvLkNvbnRhY3RNYW5hZ2VyIHQxODF9fX1gKTtcblxuICAgICAgYXdhaXQgYWRiLndhaXRGb3JBY3Rpdml0eU9yTm90KCdjb20uYW5kcm9pZC5zZXR0aW5ncyxjb20uZXhhbXBsZS5hbmRyb2lkLnN1cGVybWFuYWdlcicsICcuQ29udGFjdE1hbmFnZXIsLk90aGVyTWFuYWdlcicsIGZhbHNlKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIGJlIGFibGUgdG8gZ2V0IGZpcnN0IGFjdGl2aXR5IGZyb20gc2Vjb25kIHBhY2thZ2UgaW4gYSBjb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiBwYWNrYWdlcyArIGFjdGl2aXRpZXMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2hlbGwnKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydkdW1wc3lzJywgJ3dpbmRvdycsICd3aW5kb3dzJ10pXG4gICAgICAgIC5yZXR1cm5zKGBtRm9jdXNlZEFwcD1BcHBXaW5kb3dUb2tlbnszODYwMGI1NiB0b2tlbj1Ub2tlbns5ZWExMTcxIGAgK1xuICAgICAgICAgIGBBY3Rpdml0eVJlY29yZHsyIHUgY29tLmV4YW1wbGUuYW5kcm9pZC5zdXBlcm1hbmFnZXIvLkNvbnRhY3RNYW5hZ2VyIHQxODF9fX1gKTtcblxuICAgICAgYXdhaXQgYWRiLndhaXRGb3JBY3Rpdml0eU9yTm90KCdjb20uYW5kcm9pZC5zZXR0aW5ncyxjb20uZXhhbXBsZS5hbmRyb2lkLnN1cGVybWFuYWdlcicsICcuQ29udGFjdE1hbmFnZXIsLk90aGVyTWFuYWdlcicsIGZhbHNlKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIGJlIGFibGUgdG8gZ2V0IHNlY29uZCBhY3Rpdml0eSBmcm9tIGZpcnN0IHBhY2thZ2UgaW4gYSBjb21tYS1zZXBhcmF0ZWQgbGlzdCBvZiBwYWNrYWdlcyArIGFjdGl2aXRpZXMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2hlbGwnKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydkdW1wc3lzJywgJ3dpbmRvdycsICd3aW5kb3dzJ10pXG4gICAgICAgIC5yZXR1cm5zKGBtRm9jdXNlZEFwcD1BcHBXaW5kb3dUb2tlbnszODYwMGI1NiB0b2tlbj1Ub2tlbns5ZWExMTcxIGAgK1xuICAgICAgICAgIGBBY3Rpdml0eVJlY29yZHsyIHUgY29tLmFuZHJvaWQuc2V0dGluZ3MvLk90aGVyTWFuYWdlciB0MTgxfX19YCk7XG5cbiAgICAgIGF3YWl0IGFkYi53YWl0Rm9yQWN0aXZpdHlPck5vdCgnY29tLmFuZHJvaWQuc2V0dGluZ3MsY29tLmV4YW1wbGUuYW5kcm9pZC5zdXBlcm1hbmFnZXInLCAnLkNvbnRhY3RNYW5hZ2VyLC5PdGhlck1hbmFnZXInLCBmYWxzZSk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBiZSBhYmxlIHRvIGdldCBzZWNvbmQgYWN0aXZpdHkgZnJvbSBzZWNvbmQgcGFja2FnZSBpbiBhIGNvbW1hLXNlcGFyYXRlZCBsaXN0IG9mIHBhY2thZ2VzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ3NoZWxsJylcbiAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnZHVtcHN5cycsICd3aW5kb3cnLCAnd2luZG93cyddKVxuICAgICAgICAucmV0dXJucyhgbUZvY3VzZWRBcHA9QXBwV2luZG93VG9rZW57Mzg2MDBiNTYgdG9rZW49VG9rZW57OWVhMTE3MSBgICtcbiAgICAgICAgICBgQWN0aXZpdHlSZWNvcmR7MiB1IGNvbS5leGFtcGxlLmFuZHJvaWQuc3VwZXJtYW5hZ2VyLy5PdGhlck1hbmFnZXIgdDE4MX19fWApO1xuXG4gICAgICBhd2FpdCBhZGIud2FpdEZvckFjdGl2aXR5T3JOb3QoJ2NvbS5hbmRyb2lkLnNldHRpbmdzLGNvbS5leGFtcGxlLmFuZHJvaWQuc3VwZXJtYW5hZ2VyJywgJy5Db250YWN0TWFuYWdlciwuT3RoZXJNYW5hZ2VyJywgZmFsc2UpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgZmFpbCB0byBnZXQgYWN0aXZpdHkgd2hlbiBmb2N1c2VkIGFjdGl2aXR5IG1hdGNoZXMgbm9uZSBvZiB0aGUgcHJvdmlkZWQgbGlzdCBvZiBwYWNrYWdlcycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdzaGVsbCcpXG4gICAgICAgIC5hdExlYXN0KDEpLndpdGhFeGFjdEFyZ3MoWydkdW1wc3lzJywgJ3dpbmRvdycsICd3aW5kb3dzJ10pXG4gICAgICAgIC5yZXR1cm5zKGBtRm9jdXNlZEFwcD1BcHBXaW5kb3dUb2tlbnszODYwMGI1NiB0b2tlbj1Ub2tlbns5ZWExMTcxIGAgK1xuICAgICAgICAgIGBBY3Rpdml0eVJlY29yZHsyIHUgY29tLm90aGVycGFja2FnZS8uQ29udGFjdE1hbmFnZXIgdDE4MX19fWApO1xuXG4gICAgICBhd2FpdCBhZGIud2FpdEZvckFjdGl2aXR5T3JOb3QoJ2NvbS5hbmRyb2lkLnNldHRpbmdzLGNvbS5leGFtcGxlLmFuZHJvaWQuc3VwZXJtYW5hZ2VyJywgJy5Db250YWN0TWFuYWdlciwgLk90aGVyTWFuYWdlcicsIGZhbHNlLCAxMDAwKVxuICAgICAgICAuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWQ7XG4gICAgfSk7XG4gIH0pO1xuICBkZXNjcmliZSgnd2FpdEZvckFjdGl2aXR5JywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdzaG91bGQgY2FsbCB3YWl0Rm9yQWN0aXZpdHlPck5vdCB3aXRoIGNvcnJlY3QgYXJndW1lbnRzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ3dhaXRGb3JBY3Rpdml0eU9yTm90JylcbiAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKHBrZywgYWN0LCBmYWxzZSwgMjAwMDApXG4gICAgICAgIC5yZXR1cm5zKCcnKTtcbiAgICAgIGF3YWl0IGFkYi53YWl0Rm9yQWN0aXZpdHkocGtnLCBhY3QpO1xuICAgIH0pO1xuICB9KTtcbiAgZGVzY3JpYmUoJ3dhaXRGb3JOb3RBY3Rpdml0eScsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnc2hvdWxkIGNhbGwgd2FpdEZvckFjdGl2aXR5T3JOb3Qgd2l0aCBjb3JyZWN0IGFyZ3VtZW50cycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCd3YWl0Rm9yQWN0aXZpdHlPck5vdCcpXG4gICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhwa2csIGFjdCwgdHJ1ZSwgMjAwMDApXG4gICAgICAgIC5yZXR1cm5zKCcnKTtcbiAgICAgIGF3YWl0IGFkYi53YWl0Rm9yTm90QWN0aXZpdHkocGtnLCBhY3QpO1xuICAgIH0pO1xuICB9KTtcbiAgZGVzY3JpYmUoJ3VuaW5zdGFsbEFwaycsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnc2hvdWxkIGNhbGwgZm9yY2VTdG9wIGFuZCBhZGJFeGVjIHdpdGggY29ycmVjdCBhcmd1bWVudHMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnaXNBcHBJbnN0YWxsZWQnKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MocGtnKVxuICAgICAgICAucmV0dXJucyh0cnVlKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdmb3JjZVN0b3AnKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MocGtnKVxuICAgICAgICAucmV0dXJucygnJyk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnYWRiRXhlYycpXG4gICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ3VuaW5zdGFsbCcsIHBrZ10sIHt0aW1lb3V0OiAyMDAwMH0pXG4gICAgICAgIC5yZXR1cm5zKCdTdWNjZXNzJyk7XG4gICAgICAoYXdhaXQgYWRiLnVuaW5zdGFsbEFwayhwa2cpKS5zaG91bGQuYmUudHJ1ZTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIG5vdCBjYWxsIGZvcmNlU3RvcCBhbmQgYWRiRXhlYyBpZiBhcHAgbm90IGluc3RhbGxlZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdpc0FwcEluc3RhbGxlZCcpXG4gICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhwa2cpXG4gICAgICAgIC5yZXR1cm5zKGZhbHNlKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdmb3JjZVN0b3AnKVxuICAgICAgICAubmV2ZXIoKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdhZGJFeGVjJylcbiAgICAgICAgLm5ldmVyKCk7XG4gICAgICAoYXdhaXQgYWRiLnVuaW5zdGFsbEFwayhwa2cpKS5zaG91bGQuYmUuZmFsc2U7XG4gICAgfSk7XG4gIH0pO1xuICBkZXNjcmliZSgnaW5zdGFsbEZyb21EZXZpY2VQYXRoJywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdzaG91bGQgY2FsbCBmb3JjZVN0b3AgYW5kIGFkYkV4ZWMgd2l0aCBjb3JyZWN0IGFyZ3VtZW50cycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdzaGVsbCcpXG4gICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ3BtJywgJ2luc3RhbGwnLCAnLXInLCAnZm9vJ10sIHt9KVxuICAgICAgICAucmV0dXJucygnJyk7XG4gICAgICBhd2FpdCBhZGIuaW5zdGFsbEZyb21EZXZpY2VQYXRoKCdmb28nKTtcbiAgICB9KTtcbiAgfSk7XG4gIGRlc2NyaWJlKCdpbnN0YWxsJywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdzaG91bGQgY2FsbCBmb3JjZVN0b3AgYW5kIGFkYkV4ZWMgd2l0aCBjb3JyZWN0IGFyZ3VtZW50cycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdnZXRBcGlMZXZlbCcpXG4gICAgICAgIC5vbmNlKCkucmV0dXJucygyMyk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnYWRiRXhlYycpXG4gICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ2luc3RhbGwnLCAnLXInLCAnZm9vJ10sIHt0aW1lb3V0OiA2MDAwMH0pXG4gICAgICAgIC5yZXR1cm5zKCcnKTtcbiAgICAgIGF3YWl0IGFkYi5pbnN0YWxsKCdmb28nKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIGNhbGwgZm9yY2VTdG9wIGFuZCBhZGJFeGVjIHdpdGggY29ycmVjdCBhcmd1bWVudHMgd2hlbiBub3QgcmVwbGFjaW5nJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ2dldEFwaUxldmVsJylcbiAgICAgICAgLm9uY2UoKS5yZXR1cm5zKDIzKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdhZGJFeGVjJylcbiAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnaW5zdGFsbCcsICdmb28nXSwge3RpbWVvdXQ6IDYwMDAwfSlcbiAgICAgICAgLnJldHVybnMoJycpO1xuICAgICAgYXdhaXQgYWRiLmluc3RhbGwoJ2ZvbycsIHtyZXBsYWNlOiBmYWxzZX0pO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgY2FsbCBhcGtzIGluc3RhbGwgaWYgdGhlIHBhdGggcG9pbnRzIHRvIGl0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ2luc3RhbGxBcGtzJylcbiAgICAgICAgLm9uY2UoKS53aXRoQXJncygnZm9vLmFwa3MnKVxuICAgICAgICAucmV0dXJucygnJyk7XG4gICAgICBhd2FpdCBhZGIuaW5zdGFsbCgnZm9vLmFwa3MnKTtcbiAgICB9KTtcbiAgfSk7XG4gIGRlc2NyaWJlKCdzdGFydFVyaScsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnc2hvdWxkIGZhaWwgaWYgdXJpIG9yIHBrZyBhcmUgbm90IHByb3ZpZGVkJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgYXdhaXQgYWRiLnN0YXJ0VXJpKCkuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWRXaXRoKC9hcmd1bWVudHMgYXJlIHJlcXVpcmVkLyk7XG4gICAgICBhd2FpdCBhZGIuc3RhcnRVcmkoJ2ZvbycpLnNob3VsZC5ldmVudHVhbGx5LmJlLnJlamVjdGVkV2l0aCgvYXJndW1lbnRzIGFyZSByZXF1aXJlZC8pO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgZmFpbCBpZiBcInVuYWJsZSB0byByZXNvbHZlIGludGVudFwiIGFwcGVhcnMgaW4gc2hlbGwgY29tbWFuZCByZXN1bHQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2hlbGwnKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoW1xuICAgICAgICAgICdhbScsICdzdGFydCcsICctVycsICctYScsXG4gICAgICAgICAgJ2FuZHJvaWQuaW50ZW50LmFjdGlvbi5WSUVXJywgJy1kJywgdXJpLCBwa2dcbiAgICAgICAgXSlcbiAgICAgICAgLnJldHVybnMoJ1NvbWV0aGluZyBzb21ldGhpbmcgc29tZXRoaW5nIFVuYWJsZSB0byByZXNvbHZlIGludGVudCBzb21ldGhpbmcgc29tZXRoaW5nJyk7XG5cbiAgICAgIGF3YWl0IGFkYi5zdGFydFVyaSh1cmksIHBrZykuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWRXaXRoKC9VbmFibGUgdG8gcmVzb2x2ZSBpbnRlbnQvKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIGJ1aWxkIGEgY2FsbCB0byBhIFZJRVcgaW50ZW50IHdpdGggdGhlIHVyaScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdzaGVsbCcpXG4gICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbXG4gICAgICAgICAgJ2FtJywgJ3N0YXJ0JywgJy1XJywgJy1hJyxcbiAgICAgICAgICAnYW5kcm9pZC5pbnRlbnQuYWN0aW9uLlZJRVcnLCAnLWQnLCB1cmksIHBrZ1xuICAgICAgICBdKVxuICAgICAgICAucmV0dXJucygnUGFzc2FibGUgcmVzdWx0Jyk7XG5cbiAgICAgIGF3YWl0IGFkYi5zdGFydFVyaSh1cmksIHBrZyk7XG4gICAgfSk7XG4gIH0pO1xuICBkZXNjcmliZSgnc3RhcnRBcHAnLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ3Nob3VsZCBjYWxsIGdldEFwaUxldmVsIGFuZCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJndW1lbnRzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ2dldEFwaUxldmVsJylcbiAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKClcbiAgICAgICAgLnJldHVybnMoMTcpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ3NoZWxsJylcbiAgICAgICAgLm9uY2UoKS53aXRoQXJncyhjbWQpXG4gICAgICAgIC5yZXR1cm5zKCcnKTtcbiAgICAgIChhd2FpdCBhZGIuc3RhcnRBcHAoc3RhcnRBcHBPcHRpb25zKSk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBjYWxsIGdldEFwaUxldmVsIGFuZCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJndW1lbnRzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ2dldEFwaUxldmVsJylcbiAgICAgICAgLnR3aWNlKClcbiAgICAgICAgLnJldHVybnMoMTcpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ3NoZWxsJylcbiAgICAgICAgLm9uQ2FsbCgwKVxuICAgICAgICAucmV0dXJucygnRXJyb3I6IEFjdGl2aXR5IGNsYXNzIGZvbyBkb2VzIG5vdCBleGlzdCcpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ3NoZWxsJylcbiAgICAgICAgLnJldHVybnMoJycpO1xuICAgICAgKGF3YWl0IGFkYi5zdGFydEFwcChzdGFydEFwcE9wdGlvbnMpKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIGNhbGwgZ2V0QXBpTGV2ZWwgYW5kIHNoZWxsIHdpdGggY29ycmVjdCBhcmd1bWVudHMgd2hlbiBhY3Rpdml0eSBpcyBpbm5lciBjbGFzcycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IHN0YXJ0QXBwT3B0aW9uc1dpdGhJbm5lckNsYXNzID0geyBwa2c6ICdwa2cnLCBhY3Rpdml0eTogJ2FjdCRJbm5lckFjdCd9LFxuICAgICAgICAgICAgY21kV2l0aElubmVyQ2xhc3MgPSBbJ2FtJywgJ3N0YXJ0JywgJy1XJywgJy1uJywgJ3BrZy9hY3RcXFxcJElubmVyQWN0JywgJy1TJ107XG5cbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdnZXRBcGlMZXZlbCcpXG4gICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncygpXG4gICAgICAgIC5yZXR1cm5zKDE3KTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdzaGVsbCcpXG4gICAgICAgIC5vbmNlKCkud2l0aEFyZ3MoY21kV2l0aElubmVyQ2xhc3MpXG4gICAgICAgIC5yZXR1cm5zKCcnKTtcbiAgICAgIChhd2FpdCBhZGIuc3RhcnRBcHAoc3RhcnRBcHBPcHRpb25zV2l0aElubmVyQ2xhc3MpKTtcbiAgICB9KTtcbiAgfSk7XG4gIGRlc2NyaWJlKCdnZXREZXZpY2VMYW5ndWFnZScsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgb25lIHRpbWUgd2l0aCBjb3JyZWN0IGFyZ3MgYW5kIHJldHVybiBsYW5ndWFnZSB3aGVuIEFQSSA8IDIzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXRBcGlMZXZlbFwiKS5yZXR1cm5zKDE4KTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnZ2V0cHJvcCcsICdwZXJzaXN0LnN5cy5sYW5ndWFnZSddKVxuICAgICAgICAucmV0dXJucyhsYW5ndWFnZSk7XG4gICAgICAoYXdhaXQgYWRiLmdldERldmljZUxhbmd1YWdlKCkpLnNob3VsZC5lcXVhbChsYW5ndWFnZSk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIHR3byB0aW1lcyB3aXRoIGNvcnJlY3QgYXJncyBhbmQgcmV0dXJuIGxhbmd1YWdlIHdoZW4gQVBJIDwgMjMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImdldEFwaUxldmVsXCIpLnJldHVybnMoMTgpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydnZXRwcm9wJywgJ3BlcnNpc3Quc3lzLmxhbmd1YWdlJ10pXG4gICAgICAgIC5yZXR1cm5zKCcnKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnZ2V0cHJvcCcsICdyby5wcm9kdWN0LmxvY2FsZS5sYW5ndWFnZSddKVxuICAgICAgICAucmV0dXJucyhsYW5ndWFnZSk7XG4gICAgICAoYXdhaXQgYWRiLmdldERldmljZUxhbmd1YWdlKCkpLnNob3VsZC5lcXVhbChsYW5ndWFnZSk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIG9uZSB0aW1lIHdpdGggY29ycmVjdCBhcmdzIGFuZCByZXR1cm4gbGFuZ3VhZ2Ugd2hlbiBBUEkgPSAyMycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0QXBpTGV2ZWxcIikucmV0dXJucygyMyk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ2dldHByb3AnLCAncGVyc2lzdC5zeXMubG9jYWxlJ10pXG4gICAgICAgIC5yZXR1cm5zKGxvY2FsZSk7XG4gICAgICAoYXdhaXQgYWRiLmdldERldmljZUxhbmd1YWdlKCkpLnNob3VsZC5lcXVhbChsYW5ndWFnZSk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIHR3byB0aW1lcyB3aXRoIGNvcnJlY3QgYXJncyBhbmQgcmV0dXJuIGxhbmd1YWdlIHdoZW4gQVBJID0gMjMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImdldEFwaUxldmVsXCIpLnJldHVybnMoMjMpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydnZXRwcm9wJywgJ3BlcnNpc3Quc3lzLmxvY2FsZSddKVxuICAgICAgICAucmV0dXJucygnJyk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ2dldHByb3AnLCAncm8ucHJvZHVjdC5sb2NhbGUnXSlcbiAgICAgICAgLnJldHVybnMobG9jYWxlKTtcbiAgICAgIChhd2FpdCBhZGIuZ2V0RGV2aWNlTGFuZ3VhZ2UoKSkuc2hvdWxkLmVxdWFsKGxhbmd1YWdlKTtcbiAgICB9KTtcbiAgfSk7XG4gIGRlc2NyaWJlKCdzZXREZXZpY2VMYW5ndWFnZScsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgb25lIHRpbWUgd2l0aCBjb3JyZWN0IGFyZ3Mgd2hlbiBBUEkgPCAyMycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0QXBpTGV2ZWxcIilcbiAgICAgICAgLm9uY2UoKS5yZXR1cm5zKDIxKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnc2V0cHJvcCcsICdwZXJzaXN0LnN5cy5sYW5ndWFnZScsIGxhbmd1YWdlXSlcbiAgICAgICAgLnJldHVybnMoXCJcIik7XG4gICAgICBhd2FpdCBhZGIuc2V0RGV2aWNlTGFuZ3VhZ2UobGFuZ3VhZ2UpO1xuICAgIH0pO1xuICB9KTtcbiAgZGVzY3JpYmUoJ2dldERldmljZUNvdW50cnknLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIG9uZSB0aW1lIHdpdGggY29ycmVjdCBhcmdzIGFuZCByZXR1cm4gY291bnRyeScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnZ2V0cHJvcCcsICdwZXJzaXN0LnN5cy5jb3VudHJ5J10pXG4gICAgICAgIC5yZXR1cm5zKGNvdW50cnkpO1xuICAgICAgKGF3YWl0IGFkYi5nZXREZXZpY2VDb3VudHJ5KCkpLnNob3VsZC5lcXVhbChjb3VudHJ5KTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgdHdvIHRpbWVzIHdpdGggY29ycmVjdCBhcmdzIGFuZCByZXR1cm4gY291bnRyeScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnZ2V0cHJvcCcsICdwZXJzaXN0LnN5cy5jb3VudHJ5J10pXG4gICAgICAgIC5yZXR1cm5zKCcnKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnZ2V0cHJvcCcsICdyby5wcm9kdWN0LmxvY2FsZS5yZWdpb24nXSlcbiAgICAgICAgLnJldHVybnMoY291bnRyeSk7XG4gICAgICAoYXdhaXQgYWRiLmdldERldmljZUNvdW50cnkoKSkuc2hvdWxkLmVxdWFsKGNvdW50cnkpO1xuICAgIH0pO1xuICB9KTtcbiAgZGVzY3JpYmUoJ3NldERldmljZUNvdW50cnknLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIG9uZSB0aW1lIHdpdGggY29ycmVjdCBhcmdzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXRBcGlMZXZlbFwiKVxuICAgICAgICAub25jZSgpLnJldHVybnMoMjEpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydzZXRwcm9wJywgJ3BlcnNpc3Quc3lzLmNvdW50cnknLCBjb3VudHJ5XSlcbiAgICAgICAgLnJldHVybnMoXCJcIik7XG4gICAgICBhd2FpdCBhZGIuc2V0RGV2aWNlQ291bnRyeShjb3VudHJ5KTtcbiAgICB9KTtcbiAgfSk7XG4gIGRlc2NyaWJlKCdnZXREZXZpY2VMb2NhbGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIG9uZSB0aW1lIHdpdGggY29ycmVjdCBhcmdzIGFuZCByZXR1cm4gbG9jYWxlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydnZXRwcm9wJywgJ3BlcnNpc3Quc3lzLmxvY2FsZSddKVxuICAgICAgICAucmV0dXJucyhsb2NhbGUpO1xuICAgICAgKGF3YWl0IGFkYi5nZXREZXZpY2VMb2NhbGUoKSkuc2hvdWxkLmVxdWFsKGxvY2FsZSk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIHR3byB0aW1lcyB3aXRoIGNvcnJlY3QgYXJncyBhbmQgcmV0dXJuIGxvY2FsZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnZ2V0cHJvcCcsICdwZXJzaXN0LnN5cy5sb2NhbGUnXSlcbiAgICAgICAgLnJldHVybnMoJycpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydnZXRwcm9wJywgJ3JvLnByb2R1Y3QubG9jYWxlJ10pXG4gICAgICAgIC5yZXR1cm5zKGxvY2FsZSk7XG4gICAgICAoYXdhaXQgYWRiLmdldERldmljZUxvY2FsZSgpKS5zaG91bGQuZXF1YWwobG9jYWxlKTtcbiAgICB9KTtcbiAgfSk7XG4gIGRlc2NyaWJlKCdlbnN1cmVDdXJyZW50TG9jYWxlJywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdzaG91bGQgcmV0dXJuIGZhbHNlIGlmIG5vIGFyZ3VtZW50cycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIChhd2FpdCBhZGIuZW5zdXJlQ3VycmVudExvY2FsZSgpKS5zaG91bGQuYmUuZmFsc2U7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gdHJ1ZSB3aGVuIEFQSSAyMiBhbmQgb25seSBsYW5ndWFnZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0QXBpTGV2ZWxcIikud2l0aEV4YWN0QXJncygpLm9uY2UoKS5yZXR1cm5zKDIyKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0RGV2aWNlTGFuZ3VhZ2VcIikud2l0aEV4YWN0QXJncygpLm9uY2UoKS5yZXR1cm5zKFwiZnJcIik7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImdldERldmljZUNvdW50cnlcIikud2l0aEV4YWN0QXJncygpLm5ldmVyKCk7XG4gICAgICAoYXdhaXQgYWRiLmVuc3VyZUN1cnJlbnRMb2NhbGUoXCJmclwiLCBudWxsKSkuc2hvdWxkLmJlLnRydWU7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gdHJ1ZSB3aGVuIEFQSSAyMiBhbmQgb25seSBjb3VudHJ5JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXRBcGlMZXZlbFwiKS53aXRoRXhhY3RBcmdzKCkub25jZSgpLnJldHVybnMoMjIpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXREZXZpY2VDb3VudHJ5XCIpLndpdGhFeGFjdEFyZ3MoKS5vbmNlKCkucmV0dXJucyhcIkZSXCIpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXREZXZpY2VMYW5ndWFnZVwiKS53aXRoRXhhY3RBcmdzKCkubmV2ZXIoKTtcbiAgICAgIChhd2FpdCBhZGIuZW5zdXJlQ3VycmVudExvY2FsZShudWxsLCBcIkZSXCIpKS5zaG91bGQuYmUudHJ1ZTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIHJldHVybiB0cnVlIHdoZW4gQVBJIDIyJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXRBcGlMZXZlbFwiKS53aXRoRXhhY3RBcmdzKCkub25jZSgpLnJldHVybnMoMjIpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXREZXZpY2VMYW5ndWFnZVwiKS53aXRoRXhhY3RBcmdzKCkub25jZSgpLnJldHVybnMoXCJmclwiKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0RGV2aWNlQ291bnRyeVwiKS53aXRoRXhhY3RBcmdzKCkub25jZSgpLnJldHVybnMoXCJGUlwiKTtcbiAgICAgIChhd2FpdCBhZGIuZW5zdXJlQ3VycmVudExvY2FsZSgnRlInLCAnZnInKSkuc2hvdWxkLmJlLnRydWU7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gZmFsc2Ugd2hlbiBBUEkgMjInLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImdldEFwaUxldmVsXCIpLndpdGhFeGFjdEFyZ3MoKS5vbmNlKCkucmV0dXJucygyMik7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImdldERldmljZUxhbmd1YWdlXCIpLndpdGhFeGFjdEFyZ3MoKS5vbmNlKCkucmV0dXJucyhcIlwiKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0RGV2aWNlQ291bnRyeVwiKS53aXRoRXhhY3RBcmdzKCkub25jZSgpLnJldHVybnMoXCJGUlwiKTtcbiAgICAgIChhd2FpdCBhZGIuZW5zdXJlQ3VycmVudExvY2FsZSgnZW4nLCAnVVMnKSkuc2hvdWxkLmJlLmZhbHNlO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgcmV0dXJuIHRydWUgd2hlbiBBUEkgMjMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImdldEFwaUxldmVsXCIpLndpdGhFeGFjdEFyZ3MoKS5vbmNlKCkucmV0dXJucygyMyk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImdldERldmljZUxvY2FsZVwiKS53aXRoRXhhY3RBcmdzKCkub25jZSgpLnJldHVybnMoXCJmci1GUlwiKTtcbiAgICAgIChhd2FpdCBhZGIuZW5zdXJlQ3VycmVudExvY2FsZSgnZnInLCAnZnInKSkuc2hvdWxkLmJlLnRydWU7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gZmFsc2Ugd2hlbiBBUEkgMjMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImdldEFwaUxldmVsXCIpLndpdGhFeGFjdEFyZ3MoKS5vbmNlKCkucmV0dXJucygyMyk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImdldERldmljZUxvY2FsZVwiKS53aXRoRXhhY3RBcmdzKCkub25jZSgpLnJldHVybnMoXCJcIik7XG4gICAgICAoYXdhaXQgYWRiLmVuc3VyZUN1cnJlbnRMb2NhbGUoJ2VuJywgJ3VzJykpLnNob3VsZC5iZS5mYWxzZTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIHJldHVybiB0cnVlIHdoZW4gQVBJIDIzIHdpdGggc2NyaXB0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXRBcGlMZXZlbFwiKS53aXRoRXhhY3RBcmdzKCkub25jZSgpLnJldHVybnMoMjMpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXREZXZpY2VMb2NhbGVcIikud2l0aEV4YWN0QXJncygpLm9uY2UoKS5yZXR1cm5zKFwiemgtSGFucy1DTlwiKTtcbiAgICAgIChhd2FpdCBhZGIuZW5zdXJlQ3VycmVudExvY2FsZSgnemgnLCAnQ04nLCAnSGFucycpKS5zaG91bGQuYmUudHJ1ZTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIHJldHVybiBmYWxzZSB3aGVuIEFQSSAyMyB3aXRoIHNjcmlwdCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0QXBpTGV2ZWxcIikud2l0aEV4YWN0QXJncygpLm9uY2UoKS5yZXR1cm5zKDIzKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0RGV2aWNlTG9jYWxlXCIpLndpdGhFeGFjdEFyZ3MoKS5vbmNlKCkucmV0dXJucyhcIlwiKTtcbiAgICAgIChhd2FpdCBhZGIuZW5zdXJlQ3VycmVudExvY2FsZSgnemgnLCAnQ04nLCAnSGFucycpKS5zaG91bGQuYmUuZmFsc2U7XG4gICAgfSk7XG4gIH0pO1xuICBkZXNjcmliZSgnc2V0RGV2aWNlTG9jYWxlJywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdzaG91bGQgbm90IGNhbGwgc2V0RGV2aWNlTGFuZ3VhZ2VDb3VudHJ5IGJlY2F1c2Ugb2YgZW1wdHknLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2V0RGV2aWNlTGFuZ3VhZ2VDb3VudHJ5JykubmV2ZXIoKTtcbiAgICAgIGF3YWl0IGFkYi5zZXREZXZpY2VMb2NhbGUoKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIG5vdCBjYWxsIHNldERldmljZUxhbmd1YWdlQ291bnRyeSBiZWNhdXNlIG9mIGludmFsaWQgZm9ybWF0IG5vIC0nLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2V0RGV2aWNlTGFuZ3VhZ2VDb3VudHJ5JykubmV2ZXIoKTtcbiAgICAgIGF3YWl0IGFkYi5zZXREZXZpY2VMb2NhbGUoJ2pwJyk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBub3QgY2FsbCBzZXREZXZpY2VMYW5ndWFnZUNvdW50cnkgYmVjYXVzZSBvZiBpbnZhbGlkIGZvcm1hdCAvJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ3NldERldmljZUxhbmd1YWdlQ291bnRyeScpLm5ldmVyKCk7XG4gICAgICBhd2FpdCBhZGIuc2V0RGV2aWNlTG9jYWxlKCdlbi9VUycpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgY2FsbCBzZXREZXZpY2VMYW5ndWFnZUNvdW50cnknLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2V0RGV2aWNlTGFuZ3VhZ2VDb3VudHJ5Jykud2l0aEV4YWN0QXJncyhsYW5ndWFnZSwgY291bnRyeSlcbiAgICAgICAgICAub25jZSgpLnJldHVybnMoXCJcIik7XG4gICAgICBhd2FpdCBhZGIuc2V0RGV2aWNlTG9jYWxlKCdlbi1VUycpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgY2FsbCBzZXREZXZpY2VMYW5ndWFnZUNvdW50cnkgd2l0aCBkZWdpdHMgZm9yIGNvdW50cnknLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2V0RGV2aWNlTGFuZ3VhZ2VDb3VudHJ5Jykud2l0aEV4YWN0QXJncyhsYW5ndWFnZSwgY291bnRyeSArIFwiMFwiKVxuICAgICAgICAgIC5vbmNlKCkucmV0dXJucyhcIlwiKTtcbiAgICAgIGF3YWl0IGFkYi5zZXREZXZpY2VMb2NhbGUoJ2VuLVVTMCcpO1xuICAgIH0pO1xuICB9KTtcbiAgZGVzY3JpYmUoJ3NldERldmljZUxhbmd1YWdlQ291bnRyeScsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnc2hvdWxkIHJldHVybiBpZiBsYW5ndWFnZSBhbmQgY291bnRyeSBhcmUgbm90IHBhc3NlZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdnZXREZXZpY2VMYW5ndWFnZScpLm5ldmVyKCk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnZ2V0RGV2aWNlQ291bnRyeScpLm5ldmVyKCk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnZ2V0RGV2aWNlTG9jYWxlJykubmV2ZXIoKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdzZXREZXZpY2VMYW5ndWFnZScpLm5ldmVyKCk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2V0RGV2aWNlQ291bnRyeScpLm5ldmVyKCk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2V0RGV2aWNlTG9jYWxlJykubmV2ZXIoKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdyZWJvb3QnKS5uZXZlcigpO1xuICAgICAgYXdhaXQgYWRiLnNldERldmljZUxhbmd1YWdlQ291bnRyeSgpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgc2V0IGxhbmd1YWdlLCBjb3VudHJ5IGFuZCByZWJvb3QgdGhlIGRldmljZSB3aGVuIEFQSSA8IDIzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXRBcGlMZXZlbFwiKS53aXRoRXhhY3RBcmdzKClcbiAgICAgICAgICAub25jZSgpLnJldHVybnMoMjIpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXREZXZpY2VMYW5ndWFnZVwiKS53aXRoRXhhY3RBcmdzKClcbiAgICAgICAgICAub25jZSgpLnJldHVybnMoXCJmclwiKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0RGV2aWNlQ291bnRyeVwiKS53aXRoRXhhY3RBcmdzKClcbiAgICAgICAgICAub25jZSgpLnJldHVybnMoXCJcIik7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNldERldmljZUxhbmd1YWdlXCIpLndpdGhFeGFjdEFyZ3MobGFuZ3VhZ2UpXG4gICAgICAgICAgLm9uY2UoKS5yZXR1cm5zKFwiXCIpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzZXREZXZpY2VDb3VudHJ5XCIpLndpdGhFeGFjdEFyZ3MoY291bnRyeSlcbiAgICAgICAgICAub25jZSgpLnJldHVybnMoXCJcIik7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInJlYm9vdFwiKVxuICAgICAgICAgIC5vbmNlKCkucmV0dXJucyhcIlwiKTtcbiAgICAgIGF3YWl0IGFkYi5zZXREZXZpY2VMYW5ndWFnZUNvdW50cnkobGFuZ3VhZ2UsIGNvdW50cnkpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgbm90IHNldCBsYW5ndWFnZSBhbmQgY291bnRyeSBpZiBpdCBkb2VzIG5vdCBjaGFuZ2Ugd2hlbiBBUEkgPCAyMycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0QXBpTGV2ZWxcIikud2l0aEV4YWN0QXJncygpXG4gICAgICAgICAgLm9uY2UoKS5yZXR1cm5zKDIyKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdnZXREZXZpY2VMYW5ndWFnZScpLm9uY2UoKS5yZXR1cm5zKCdlbicpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ2dldERldmljZUNvdW50cnknKS5vbmNlKCkucmV0dXJucygnVVMnKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdnZXREZXZpY2VMb2NhbGUnKS5uZXZlcigpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ3NldERldmljZUxhbmd1YWdlJykubmV2ZXIoKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdzZXREZXZpY2VDb3VudHJ5JykubmV2ZXIoKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdzZXREZXZpY2VMb2NhbGUnKS5uZXZlcigpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ3JlYm9vdCcpLm5ldmVyKCk7XG4gICAgICBhd2FpdCBhZGIuc2V0RGV2aWNlTGFuZ3VhZ2VDb3VudHJ5KGxhbmd1YWdlLnRvTG93ZXJDYXNlKCksIGNvdW50cnkudG9Mb3dlckNhc2UoKSk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBzZXQgbG9jYWxlIHdoZW4gQVBJIGlzIDIzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXRBcGlMZXZlbFwiKS53aXRoRXhhY3RBcmdzKClcbiAgICAgICAgICAub25jZSgpLnJldHVybnMoMjMpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXREZXZpY2VMb2NhbGVcIikud2l0aEV4YWN0QXJncygpXG4gICAgICAgICAgLm9uY2UoKS5yZXR1cm5zKCdmci1GUicpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzZXREZXZpY2VTeXNMb2NhbGVcIikud2l0aEV4YWN0QXJncyhsb2NhbGUpXG4gICAgICAgICAgLm9uY2UoKS5yZXR1cm5zKCdmci1GUicpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJyZWJvb3RcIilcbiAgICAgICAgICAub25jZSgpLnJldHVybnMoXCJcIik7XG4gICAgICBhd2FpdCBhZGIuc2V0RGV2aWNlTGFuZ3VhZ2VDb3VudHJ5KGxhbmd1YWdlLCBjb3VudHJ5KTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIG5vdCBzZXQgbGFuZ3VhZ2UgYW5kIGNvdW50cnkgaWYgaXQgZG9lcyBub3QgY2hhbmdlIHdoZW4gQVBJIGlzIDIzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXRBcGlMZXZlbFwiKS53aXRoRXhhY3RBcmdzKClcbiAgICAgICAgICAub25jZSgpLnJldHVybnMoMjMpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXREZXZpY2VMb2NhbGVcIikud2l0aEV4YWN0QXJncygpXG4gICAgICAgICAgLm9uY2UoKS5yZXR1cm5zKGxvY2FsZSk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnc2V0RGV2aWNlU3lzTG9jYWxlJykubmV2ZXIoKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdyZWJvb3QnKS5uZXZlcigpO1xuICAgICAgYXdhaXQgYWRiLnNldERldmljZUxhbmd1YWdlQ291bnRyeShsYW5ndWFnZSwgY291bnRyeSk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBjYWxsIHNldCBsb2NhbGUgdmlhIHNldHRpbmcgYXBwIHdoZW4gQVBJIDI0KycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0QXBpTGV2ZWxcIikud2l0aEV4YWN0QXJncygpXG4gICAgICAgICAgLm9uY2UoKS5yZXR1cm5zKDI0KTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0RGV2aWNlTG9jYWxlXCIpLndpdGhFeGFjdEFyZ3MoKVxuICAgICAgICAgIC5vbmNlKCkucmV0dXJucygnZnItRlInKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2V0RGV2aWNlU3lzTG9jYWxlVmlhU2V0dGluZ0FwcFwiKS53aXRoRXhhY3RBcmdzKGxhbmd1YWdlLCBjb3VudHJ5LCBudWxsKVxuICAgICAgICAgIC5vbmNlKCkucmV0dXJucyhcIlwiKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdyZWJvb3QnKS5uZXZlcigpO1xuICAgICAgYXdhaXQgYWRiLnNldERldmljZUxhbmd1YWdlQ291bnRyeShsYW5ndWFnZSwgY291bnRyeSk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBjYWxsIHNldCBsb2NhbGUgd2l0aCBzY3JpcHQgdmlhIHNldHRpbmcgYXBwIHdoZW4gQVBJIDI0KycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0QXBpTGV2ZWxcIikud2l0aEV4YWN0QXJncygpXG4gICAgICAgICAgLm9uY2UoKS5yZXR1cm5zKDI0KTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0RGV2aWNlTG9jYWxlXCIpLndpdGhFeGFjdEFyZ3MoKVxuICAgICAgICAgIC5vbmNlKCkucmV0dXJucygnZnItRlInKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2V0RGV2aWNlU3lzTG9jYWxlVmlhU2V0dGluZ0FwcFwiKS53aXRoRXhhY3RBcmdzKCd6aCcsICdDTicsICdIYW5zJylcbiAgICAgICAgICAub25jZSgpLnJldHVybnMoXCJcIik7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygncmVib290JykubmV2ZXIoKTtcbiAgICAgIGF3YWl0IGFkYi5zZXREZXZpY2VMYW5ndWFnZUNvdW50cnkoJ3poJywgJ0NOJywgJ0hhbnMnKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIG5vdCBzZXQgbGFuZ3VhZ2UgYW5kIGNvdW50cnkgaWYgaXQgZG9lcyBub3QgY2hhbmdlIHdoZW4gQVBJIDI0KycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0QXBpTGV2ZWxcIikud2l0aEV4YWN0QXJncygpXG4gICAgICAgICAgLm9uY2UoKS5yZXR1cm5zKDI0KTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0RGV2aWNlTG9jYWxlXCIpLndpdGhFeGFjdEFyZ3MoKVxuICAgICAgICAgIC5vbmNlKCkucmV0dXJucyhsb2NhbGUpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzZXREZXZpY2VTeXNMb2NhbGVWaWFTZXR0aW5nQXBwXCIpLm5ldmVyKCk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygncmVib290JykubmV2ZXIoKTtcbiAgICAgIGF3YWl0IGFkYi5zZXREZXZpY2VMYW5ndWFnZUNvdW50cnkobGFuZ3VhZ2UsIGNvdW50cnkpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgbm90IHNldCBsYW5ndWFnZSBhbmQgY291bnRyeSBpZiBubyBsYW5ndWFnZSB3aGVuIEFQSSAyNCsnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImdldEFwaUxldmVsXCIpLndpdGhFeGFjdEFyZ3MoKVxuICAgICAgICAgIC5vbmNlKCkucmV0dXJucygyNCk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImdldERldmljZUxvY2FsZVwiKS53aXRoRXhhY3RBcmdzKClcbiAgICAgICAgICAub25jZSgpLnJldHVybnMobG9jYWxlKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2V0RGV2aWNlU3lzTG9jYWxlVmlhU2V0dGluZ0FwcFwiKS5uZXZlcigpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ3JlYm9vdCcpLm5ldmVyKCk7XG4gICAgICBhd2FpdCBhZGIuc2V0RGV2aWNlTGFuZ3VhZ2VDb3VudHJ5KGNvdW50cnkpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgbm90IHNldCBsYW5ndWFnZSBhbmQgY291bnRyeSBpZiBubyBjb3VudHJ5IHdoZW4gQVBJIDI0KycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0QXBpTGV2ZWxcIikud2l0aEV4YWN0QXJncygpXG4gICAgICAgICAgLm9uY2UoKS5yZXR1cm5zKDI0KTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0RGV2aWNlTG9jYWxlXCIpLndpdGhFeGFjdEFyZ3MoKVxuICAgICAgICAgIC5vbmNlKCkucmV0dXJucyhsb2NhbGUpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzZXREZXZpY2VTeXNMb2NhbGVWaWFTZXR0aW5nQXBwXCIpLm5ldmVyKCk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygncmVib290JykubmV2ZXIoKTtcbiAgICAgIGF3YWl0IGFkYi5zZXREZXZpY2VMYW5ndWFnZUNvdW50cnkobGFuZ3VhZ2UpO1xuICAgIH0pO1xuICB9KTtcbiAgZGVzY3JpYmUoJ2dldEFwa0luZm8nLCBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgQVBLX0lORk8gPSBgcGFja2FnZTogbmFtZT0naW8uYXBwaXVtLnNldHRpbmdzJyB2ZXJzaW9uQ29kZT0nMicgdmVyc2lvbk5hbWU9JzEuMScgcGxhdGZvcm1CdWlsZFZlcnNpb25OYW1lPSc2LjAtMjE2Njc2NydcbiAgICBzZGtWZXJzaW9uOicxNydcbiAgICB0YXJnZXRTZGtWZXJzaW9uOicyMydcbiAgICB1c2VzLXBlcm1pc3Npb246IG5hbWU9J2FuZHJvaWQucGVybWlzc2lvbi5JTlRFUk5FVCdcbiAgICB1c2VzLXBlcm1pc3Npb246IG5hbWU9J2FuZHJvaWQucGVybWlzc2lvbi5DSEFOR0VfTkVUV09SS19TVEFURSdcbiAgICB1c2VzLXBlcm1pc3Npb246IG5hbWU9J2FuZHJvaWQucGVybWlzc2lvbi5BQ0NFU1NfTkVUV09SS19TVEFURSdcbiAgICB1c2VzLXBlcm1pc3Npb246IG5hbWU9J2FuZHJvaWQucGVybWlzc2lvbi5SRUFEX1BIT05FX1NUQVRFJ1xuICAgIHVzZXMtcGVybWlzc2lvbjogbmFtZT0nYW5kcm9pZC5wZXJtaXNzaW9uLldSSVRFX1NFVFRJTkdTJ1xuICAgIHVzZXMtcGVybWlzc2lvbjogbmFtZT0nYW5kcm9pZC5wZXJtaXNzaW9uLkNIQU5HRV9XSUZJX1NUQVRFJ1xuICAgIHVzZXMtcGVybWlzc2lvbjogbmFtZT0nYW5kcm9pZC5wZXJtaXNzaW9uLkFDQ0VTU19XSUZJX1NUQVRFJ1xuICAgIHVzZXMtcGVybWlzc2lvbjogbmFtZT0nYW5kcm9pZC5wZXJtaXNzaW9uLkFDQ0VTU19GSU5FX0xPQ0FUSU9OJ1xuICAgIHVzZXMtcGVybWlzc2lvbjogbmFtZT0nYW5kcm9pZC5wZXJtaXNzaW9uLkFDQ0VTU19DT0FSU0VfTE9DQVRJT04nXG4gICAgdXNlcy1wZXJtaXNzaW9uOiBuYW1lPSdhbmRyb2lkLnBlcm1pc3Npb24uQUNDRVNTX01PQ0tfTE9DQVRJT04nXG4gICAgYXBwbGljYXRpb24tbGFiZWw6J0FwcGl1bSBTZXR0aW5ncydcbiAgICBhcHBsaWNhdGlvbi1pY29uLTEyMDoncmVzL2RyYXdhYmxlLWxkcGktdjQvaWNfbGF1bmNoZXIucG5nJ1xuICAgIGFwcGxpY2F0aW9uLWljb24tMTYwOidyZXMvZHJhd2FibGUtbWRwaS12NC9pY19sYXVuY2hlci5wbmcnXG4gICAgYXBwbGljYXRpb24taWNvbi0yNDA6J3Jlcy9kcmF3YWJsZS1oZHBpLXY0L2ljX2xhdW5jaGVyLnBuZydcbiAgICBhcHBsaWNhdGlvbi1pY29uLTMyMDoncmVzL2RyYXdhYmxlLXhoZHBpLXY0L2ljX2xhdW5jaGVyLnBuZydcbiAgICBhcHBsaWNhdGlvbjogbGFiZWw9J0FwcGl1bSBTZXR0aW5ncycgaWNvbj0ncmVzL2RyYXdhYmxlLW1kcGktdjQvaWNfbGF1bmNoZXIucG5nJ1xuICAgIGFwcGxpY2F0aW9uLWRlYnVnZ2FibGVcbiAgICBsYXVuY2hhYmxlLWFjdGl2aXR5OiBuYW1lPSdpby5hcHBpdW0uc2V0dGluZ3MuU2V0dGluZ3MnICBsYWJlbD0nQXBwaXVtIFNldHRpbmdzJyBpY29uPScnXG4gICAgZmVhdHVyZS1ncm91cDogbGFiZWw9JydcbiAgICAgIHVzZXMtZmVhdHVyZTogbmFtZT0nYW5kcm9pZC5oYXJkd2FyZS53aWZpJ1xuICAgICAgdXNlcy1mZWF0dXJlOiBuYW1lPSdhbmRyb2lkLmhhcmR3YXJlLmxvY2F0aW9uJ1xuICAgICAgdXNlcy1pbXBsaWVkLWZlYXR1cmU6IG5hbWU9J2FuZHJvaWQuaGFyZHdhcmUubG9jYXRpb24nIHJlYXNvbj0ncmVxdWVzdGVkIGFuZHJvaWQucGVybWlzc2lvbi5BQ0NFU1NfQ09BUlNFX0xPQ0FUSU9OIHBlcm1pc3Npb24sIHJlcXVlc3RlZCBhbmRyb2lkLnBlcm1pc3Npb24uQUNDRVNTX0ZJTkVfTE9DQVRJT04gcGVybWlzc2lvbiwgYW5kIHJlcXVlc3RlZCBhbmRyb2lkLnBlcm1pc3Npb24uQUNDRVNTX01PQ0tfTE9DQVRJT04gcGVybWlzc2lvbidcbiAgICAgIHVzZXMtZmVhdHVyZTogbmFtZT0nYW5kcm9pZC5oYXJkd2FyZS5sb2NhdGlvbi5ncHMnXG4gICAgICB1c2VzLWltcGxpZWQtZmVhdHVyZTogbmFtZT0nYW5kcm9pZC5oYXJkd2FyZS5sb2NhdGlvbi5ncHMnIHJlYXNvbj0ncmVxdWVzdGVkIGFuZHJvaWQucGVybWlzc2lvbi5BQ0NFU1NfRklORV9MT0NBVElPTiBwZXJtaXNzaW9uJ1xuICAgICAgdXNlcy1mZWF0dXJlOiBuYW1lPSdhbmRyb2lkLmhhcmR3YXJlLmxvY2F0aW9uLm5ldHdvcmsnXG4gICAgICB1c2VzLWltcGxpZWQtZmVhdHVyZTogbmFtZT0nYW5kcm9pZC5oYXJkd2FyZS5sb2NhdGlvbi5uZXR3b3JrJyByZWFzb249J3JlcXVlc3RlZCBhbmRyb2lkLnBlcm1pc3Npb24uQUNDRVNTX0NPQVJTRV9MT0NBVElPTiBwZXJtaXNzaW9uJ1xuICAgICAgdXNlcy1mZWF0dXJlOiBuYW1lPSdhbmRyb2lkLmhhcmR3YXJlLnRvdWNoc2NyZWVuJ1xuICAgICAgdXNlcy1pbXBsaWVkLWZlYXR1cmU6IG5hbWU9J2FuZHJvaWQuaGFyZHdhcmUudG91Y2hzY3JlZW4nIHJlYXNvbj0nZGVmYXVsdCBmZWF0dXJlIGZvciBhbGwgYXBwcydcbiAgICBtYWluXG4gICAgb3RoZXItcmVjZWl2ZXJzXG4gICAgb3RoZXItc2VydmljZXNcbiAgICBzdXBwb3J0cy1zY3JlZW5zOiAnc21hbGwnICdub3JtYWwnICdsYXJnZScgJ3hsYXJnZSdcbiAgICBzdXBwb3J0cy1hbnktZGVuc2l0eTogJ3RydWUnXG4gICAgbG9jYWxlczogJy0tXy0tJ1xuICAgIGRlbnNpdGllczogJzEyMCcgJzE2MCcgJzI0MCcgJzMyMCdgO1xuXG4gICAgaXQoJ3Nob3VsZCBwcm9wZXJseSBwYXJzZSBhcGsgaW5mbycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmZzLmV4cGVjdHMoJ2V4aXN0cycpLm9uY2UoKS5yZXR1cm5zKHRydWUpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ2luaXRBYXB0Jykub25jZSgpLnJldHVybnModHJ1ZSk7XG4gICAgICBtb2Nrcy50ZWVuX3Byb2Nlc3MuZXhwZWN0cygnZXhlYycpLm9uY2UoKS5yZXR1cm5zKHtzdGRvdXQ6IEFQS19JTkZPfSk7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBhZGIuZ2V0QXBrSW5mbygnL3NvbWUvZm9sZGVyL3BhdGguYXBrJyk7XG4gICAgICBmb3IgKGxldCBbbmFtZSwgdmFsdWVdIG9mIFtcbiAgICAgICAgWyduYW1lJywgJ2lvLmFwcGl1bS5zZXR0aW5ncyddLFxuICAgICAgICBbJ3ZlcnNpb25Db2RlJywgMl0sXG4gICAgICAgIFsndmVyc2lvbk5hbWUnLCAnMS4xJ11dKSB7XG4gICAgICAgIHJlc3VsdC5zaG91bGQuaGF2ZS5wcm9wZXJ0eShuYW1lLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBleHRyYWN0IGJhc2UgYXBrIGZpcnN0IGluIG9yZGVyIHRvIHJldHJpZXZlIGFwa3MgaW5mbycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdleHRyYWN0QmFzZUFwaycpLm9uY2UoKS5yZXR1cm5zKCcvc29tZS9vdGhlcmZvbGRlci9wYXRoLmFwaycpO1xuICAgICAgbW9ja3MuZnMuZXhwZWN0cygnZXhpc3RzJykub25jZSgpLnJldHVybnModHJ1ZSk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnaW5pdEFhcHQnKS5vbmNlKCkucmV0dXJucyh0cnVlKTtcbiAgICAgIG1vY2tzLnRlZW5fcHJvY2Vzcy5leHBlY3RzKCdleGVjJykub25jZSgpLnJldHVybnMoe3N0ZG91dDogQVBLX0lORk99KTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGFkYi5nZXRBcGtJbmZvKCcvc29tZS9mb2xkZXIvcGF0aC5hcGtzJyk7XG4gICAgICBmb3IgKGxldCBbbmFtZSwgdmFsdWVdIG9mIFtcbiAgICAgICAgWyduYW1lJywgJ2lvLmFwcGl1bS5zZXR0aW5ncyddLFxuICAgICAgICBbJ3ZlcnNpb25Db2RlJywgMl0sXG4gICAgICAgIFsndmVyc2lvbk5hbWUnLCAnMS4xJ11dKSB7XG4gICAgICAgIHJlc3VsdC5zaG91bGQuaGF2ZS5wcm9wZXJ0eShuYW1lLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuICBkZXNjcmliZSgnZ2V0UGFja2FnZUluZm8nLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ3Nob3VsZCBwcm9wZXJseSBwYXJzZSBpbnN0YWxsZWQgcGFja2FnZSBpbmZvJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ3NoZWxsJykub25jZSgpLnJldHVybnMoYFBhY2thZ2VzOlxuICAgICAgUGFja2FnZSBbY29tLmV4YW1wbGUudGVzdGFwcC5maXJzdF0gKDIwMzZmZDEpOlxuICAgICAgICB1c2VySWQ9MTAyMjVcbiAgICAgICAgcGtnPVBhY2thZ2V7NDJlN2EzNiBjb20uZXhhbXBsZS50ZXN0YXBwLmZpcnN0fVxuICAgICAgICBjb2RlUGF0aD0vZGF0YS9hcHAvY29tLmV4YW1wbGUudGVzdGFwcC5maXJzdC0xXG4gICAgICAgIHJlc291cmNlUGF0aD0vZGF0YS9hcHAvY29tLmV4YW1wbGUudGVzdGFwcC5maXJzdC0xXG4gICAgICAgIGxlZ2FjeU5hdGl2ZUxpYnJhcnlEaXI9L2RhdGEvYXBwL2NvbS5leGFtcGxlLnRlc3RhcHAuZmlyc3QtMS9saWJcbiAgICAgICAgcHJpbWFyeUNwdUFiaT1udWxsXG4gICAgICAgIHNlY29uZGFyeUNwdUFiaT1udWxsXG4gICAgICAgIHZlcnNpb25Db2RlPTEgbWluU2RrPTIxIHRhcmdldFNkaz0yNFxuICAgICAgICB2ZXJzaW9uTmFtZT0xLjBcbiAgICAgICAgc3BsaXRzPVtiYXNlXVxuICAgICAgICBhcGtTaWduaW5nVmVyc2lvbj0xXG4gICAgICAgIGFwcGxpY2F0aW9uSW5mbz1BcHBsaWNhdGlvbkluZm97MjljYjJhNCBjb20uZXhhbXBsZS50ZXN0YXBwLmZpcnN0fVxuICAgICAgICBmbGFncz1bIEhBU19DT0RFIEFMTE9XX0NMRUFSX1VTRVJfREFUQSBBTExPV19CQUNLVVAgXVxuICAgICAgICBwcml2YXRlRmxhZ3M9WyBSRVNJWkVBQkxFX0FDVElWSVRJRVMgXVxuICAgICAgICBkYXRhRGlyPS9kYXRhL3VzZXIvMC9jb20uZXhhbXBsZS50ZXN0YXBwLmZpcnN0XG4gICAgICAgIHN1cHBvcnRzU2NyZWVucz1bc21hbGwsIG1lZGl1bSwgbGFyZ2UsIHhsYXJnZSwgcmVzaXplYWJsZSwgYW55RGVuc2l0eV1cbiAgICAgICAgdGltZVN0YW1wPTIwMTYtMTEtMDMgMDE6MTI6MDhcbiAgICAgICAgZmlyc3RJbnN0YWxsVGltZT0yMDE2LTExLTAzIDAxOjEyOjA5XG4gICAgICAgIGxhc3RVcGRhdGVUaW1lPTIwMTYtMTEtMDMgMDE6MTI6MDlcbiAgICAgICAgc2lnbmF0dXJlcz1QYWNrYWdlU2lnbmF0dXJlc3s5ZmUzODBkIFs1M2VhMTA4ZF19XG4gICAgICAgIGluc3RhbGxQZXJtaXNzaW9uc0ZpeGVkPXRydWUgaW5zdGFsbFN0YXR1cz0xXG4gICAgICAgIHBrZ0ZsYWdzPVsgSEFTX0NPREUgQUxMT1dfQ0xFQVJfVVNFUl9EQVRBIEFMTE9XX0JBQ0tVUCBdXG4gICAgICAgIFVzZXIgMDogY2VEYXRhSW5vZGU9NDc0MzE3IGluc3RhbGxlZD10cnVlIGhpZGRlbj1mYWxzZSBzdXNwZW5kZWQ9ZmFsc2Ugc3RvcHBlZD10cnVlIG5vdExhdW5jaGVkPXRydWUgZW5hYmxlZD0wXG4gICAgICAgICAgcnVudGltZSBwZXJtaXNzaW9uczpgKTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGFkYi5nZXRQYWNrYWdlSW5mbygnY29tLmV4YW1wbGUudGVzdGFwcC5maXJzdCcpO1xuICAgICAgZm9yIChsZXQgW25hbWUsIHZhbHVlXSBvZiBbXG4gICAgICAgIFsnbmFtZScsICdjb20uZXhhbXBsZS50ZXN0YXBwLmZpcnN0J10sXG4gICAgICAgIFsndmVyc2lvbkNvZGUnLCAxXSxcbiAgICAgICAgWyd2ZXJzaW9uTmFtZScsICcxLjAnXV0pIHtcbiAgICAgICAgcmVzdWx0LnNob3VsZC5oYXZlLnByb3BlcnR5KG5hbWUsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG4gIGRlc2NyaWJlKCdpbnN0YWxsT3JVcGdyYWRlJywgZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHBrZ0lkID0gJ2lvLmFwcGl1bS5zZXR0aW5ncyc7XG4gICAgY29uc3QgYXBrUGF0aCA9ICcvcGF0aC90by9teS5hcGsnO1xuXG4gICAgaXQoJ3Nob3VsZCBleGVjdXRlIGluc3RhbGwgaWYgdGhlIHBhY2thZ2UgaXMgbm90IHByZXNlbnQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnZ2V0QXBrSW5mbycpLndpdGhFeGFjdEFyZ3MoYXBrUGF0aCkub25jZSgpLnJldHVybnMoe1xuICAgICAgICBuYW1lOiBwa2dJZFxuICAgICAgfSk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnaXNBcHBJbnN0YWxsZWQnKS53aXRoRXhhY3RBcmdzKHBrZ0lkKS5vbmNlKCkucmV0dXJucyhmYWxzZSk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnaW5zdGFsbCcpLndpdGhBcmdzKGFwa1BhdGgpLm9uY2UoKS5yZXR1cm5zKHRydWUpO1xuICAgICAgYXdhaXQgYWRiLmluc3RhbGxPclVwZ3JhZGUoYXBrUGF0aCk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gaWYgdGhlIHNhbWUgcGFja2FnZSB2ZXJzaW9uIGlzIGFscmVhZHkgaW5zdGFsbGVkJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ2dldEFwa0luZm8nKS53aXRoRXhhY3RBcmdzKGFwa1BhdGgpLm9uY2UoKS5yZXR1cm5zKHtcbiAgICAgICAgdmVyc2lvbkNvZGU6IDFcbiAgICAgIH0pO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ2dldFBhY2thZ2VJbmZvJykub25jZSgpLnJldHVybnMoe1xuICAgICAgICB2ZXJzaW9uQ29kZTogMVxuICAgICAgfSk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnaXNBcHBJbnN0YWxsZWQnKS53aXRoRXhhY3RBcmdzKHBrZ0lkKS5vbmNlKCkucmV0dXJucyh0cnVlKTtcbiAgICAgIGF3YWl0IGFkYi5pbnN0YWxsT3JVcGdyYWRlKGFwa1BhdGgsIHBrZ0lkKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIHJldHVybiBpZiBuZXdlciBwYWNrYWdlIHZlcnNpb24gaXMgYWxyZWFkeSBpbnN0YWxsZWQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnZ2V0QXBrSW5mbycpLndpdGhFeGFjdEFyZ3MoYXBrUGF0aCkub25jZSgpLnJldHVybnMoe1xuICAgICAgICBuYW1lOiBwa2dJZCxcbiAgICAgICAgdmVyc2lvbkNvZGU6IDFcbiAgICAgIH0pO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ2dldFBhY2thZ2VJbmZvJykub25jZSgpLnJldHVybnMoe1xuICAgICAgICB2ZXJzaW9uQ29kZTogMlxuICAgICAgfSk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnaXNBcHBJbnN0YWxsZWQnKS53aXRoRXhhY3RBcmdzKHBrZ0lkKS5vbmNlKCkucmV0dXJucyh0cnVlKTtcbiAgICAgIGF3YWl0IGFkYi5pbnN0YWxsT3JVcGdyYWRlKGFwa1BhdGgpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgbm90IHRocm93IGFuIGVycm9yIGlmIGFwayB2ZXJzaW9uIGNvZGUgY2Fubm90IGJlIHJlYWQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnZ2V0QXBrSW5mbycpLndpdGhFeGFjdEFyZ3MoYXBrUGF0aCkub25jZSgpLnJldHVybnMoe1xuICAgICAgICBuYW1lOiBwa2dJZFxuICAgICAgfSk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnZ2V0UGFja2FnZUluZm8nKS5vbmNlKCkucmV0dXJucyh7XG4gICAgICAgIHZlcnNpb25Db2RlOiAyXG4gICAgICB9KTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdpc0FwcEluc3RhbGxlZCcpLndpdGhFeGFjdEFyZ3MocGtnSWQpLm9uY2UoKS5yZXR1cm5zKHRydWUpO1xuICAgICAgYXdhaXQgYWRiLmluc3RhbGxPclVwZ3JhZGUoYXBrUGF0aCk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBub3QgdGhyb3cgYW4gZXJyb3IgaWYgcGtnIHZlcnNpb24gY29kZSBjYW5ub3QgYmUgcmVhZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdnZXRBcGtJbmZvJykud2l0aEV4YWN0QXJncyhhcGtQYXRoKS5vbmNlKCkucmV0dXJucyh7XG4gICAgICAgIG5hbWU6IHBrZ0lkLFxuICAgICAgICB2ZXJzaW9uQ29kZTogMVxuICAgICAgfSk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnZ2V0UGFja2FnZUluZm8nKS5vbmNlKCkucmV0dXJucyh7fSk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnaXNBcHBJbnN0YWxsZWQnKS53aXRoRXhhY3RBcmdzKHBrZ0lkKS5vbmNlKCkucmV0dXJucyh0cnVlKTtcbiAgICAgIGF3YWl0IGFkYi5pbnN0YWxsT3JVcGdyYWRlKGFwa1BhdGgpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgbm90IHRocm93IGFuIGVycm9yIGlmIHBrZyBpZCBjYW5ub3QgYmUgcmVhZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdnZXRBcGtJbmZvJykud2l0aEV4YWN0QXJncyhhcGtQYXRoKS5vbmNlKCkucmV0dXJucyh7fSk7XG4gICAgICBhd2FpdCBhZGIuaW5zdGFsbE9yVXBncmFkZShhcGtQYXRoKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIHBlcmZvcm0gdXBncmFkZSBpZiBvbGRlciBwYWNrYWdlIHZlcnNpb24gaXMgaW5zdGFsbGVkJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ2dldEFwa0luZm8nKS53aXRoRXhhY3RBcmdzKGFwa1BhdGgpLm9uY2UoKS5yZXR1cm5zKHtcbiAgICAgICAgbmFtZTogcGtnSWQsXG4gICAgICAgIHZlcnNpb25Db2RlOiAyXG4gICAgICB9KTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdnZXRQYWNrYWdlSW5mbycpLm9uY2UoKS5yZXR1cm5zKHtcbiAgICAgICAgdmVyc2lvbkNvZGU6IDFcbiAgICAgIH0pO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ2lzQXBwSW5zdGFsbGVkJykud2l0aEV4YWN0QXJncyhwa2dJZCkub25jZSgpLnJldHVybnModHJ1ZSk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnaW5zdGFsbCcpLndpdGhBcmdzKGFwa1BhdGgsIHtyZXBsYWNlOiB0cnVlLCB0aW1lb3V0OiA2MDAwMH0pLm9uY2UoKS5yZXR1cm5zKHRydWUpO1xuICAgICAgYXdhaXQgYWRiLmluc3RhbGxPclVwZ3JhZGUoYXBrUGF0aCk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBwZXJmb3JtIHVwZ3JhZGUgaWYgb2xkZXIgcGFja2FnZSB2ZXJzaW9uIGlzIGluc3RhbGxlZCwgYnV0IHZlcnNpb24gY29kZXMgYXJlIG5vdCBtYWludGFpbmVkJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ2dldEFwa0luZm8nKS53aXRoRXhhY3RBcmdzKGFwa1BhdGgpLm9uY2UoKS5yZXR1cm5zKHtcbiAgICAgICAgbmFtZTogcGtnSWQsXG4gICAgICAgIHZlcnNpb25Db2RlOiAxLFxuICAgICAgICB2ZXJzaW9uTmFtZTogJzIuMC4wJyxcbiAgICAgIH0pO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ2dldFBhY2thZ2VJbmZvJykub25jZSgpLnJldHVybnMoe1xuICAgICAgICB2ZXJzaW9uQ29kZTogMSxcbiAgICAgICAgdmVyc2lvbk5hbWU6ICcxLjAuMCcsXG4gICAgICB9KTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdpc0FwcEluc3RhbGxlZCcpLndpdGhFeGFjdEFyZ3MocGtnSWQpLm9uY2UoKS5yZXR1cm5zKHRydWUpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ2luc3RhbGwnKS53aXRoQXJncyhhcGtQYXRoLCB7cmVwbGFjZTogdHJ1ZSwgdGltZW91dDogNjAwMDB9KS5vbmNlKCkucmV0dXJucyh0cnVlKTtcbiAgICAgIGF3YWl0IGFkYi5pbnN0YWxsT3JVcGdyYWRlKGFwa1BhdGgpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgcGVyZm9ybSB1cGdyYWRlIGlmIHRoZSBzYW1lIHZlcnNpb24gaXMgaW5zdGFsbGVkLCBidXQgdmVyc2lvbiBjb2RlcyBhcmUgZGlmZmVyZW50JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ2dldEFwa0luZm8nKS53aXRoRXhhY3RBcmdzKGFwa1BhdGgpLm9uY2UoKS5yZXR1cm5zKHtcbiAgICAgICAgbmFtZTogcGtnSWQsXG4gICAgICAgIHZlcnNpb25Db2RlOiAyLFxuICAgICAgICB2ZXJzaW9uTmFtZTogJzIuMC4wJyxcbiAgICAgIH0pO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ2dldFBhY2thZ2VJbmZvJykub25jZSgpLnJldHVybnMoe1xuICAgICAgICB2ZXJzaW9uQ29kZTogMSxcbiAgICAgICAgdmVyc2lvbk5hbWU6ICcyLjAuMCcsXG4gICAgICB9KTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdpc0FwcEluc3RhbGxlZCcpLndpdGhFeGFjdEFyZ3MocGtnSWQpLm9uY2UoKS5yZXR1cm5zKHRydWUpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ2luc3RhbGwnKS53aXRoQXJncyhhcGtQYXRoLCB7cmVwbGFjZTogdHJ1ZSwgdGltZW91dDogNjAwMDB9KS5vbmNlKCkucmV0dXJucyh0cnVlKTtcbiAgICAgIGF3YWl0IGFkYi5pbnN0YWxsT3JVcGdyYWRlKGFwa1BhdGgpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgdW5pbnN0YWxsIGFuZCByZS1pbnN0YWxsIGlmIG9sZGVyIHBhY2thZ2UgdmVyc2lvbiBpcyBpbnN0YWxsZWQgYW5kIHVwZ3JhZGUgZmFpbHMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnZ2V0QXBrSW5mbycpLndpdGhFeGFjdEFyZ3MoYXBrUGF0aCkub25jZSgpLnJldHVybnMoe1xuICAgICAgICBuYW1lOiBwa2dJZCxcbiAgICAgICAgdmVyc2lvbkNvZGU6IDJcbiAgICAgIH0pO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ2dldFBhY2thZ2VJbmZvJykub25jZSgpLnJldHVybnMoe1xuICAgICAgICB2ZXJzaW9uQ29kZTogMVxuICAgICAgfSk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnaXNBcHBJbnN0YWxsZWQnKS53aXRoRXhhY3RBcmdzKHBrZ0lkKS5vbmNlKCkucmV0dXJucyh0cnVlKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdpbnN0YWxsJykud2l0aEFyZ3MoYXBrUGF0aCwge3JlcGxhY2U6IHRydWUsIHRpbWVvdXQ6IDYwMDAwfSkub25jZSgpLnRocm93cygpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ3VuaW5zdGFsbEFwaycpLndpdGhFeGFjdEFyZ3MocGtnSWQpLm9uY2UoKS5yZXR1cm5zKHRydWUpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ2luc3RhbGwnKS53aXRoQXJncyhhcGtQYXRoLCB7cmVwbGFjZTogZmFsc2UsIHRpbWVvdXQ6IDYwMDAwfSkub25jZSgpLnJldHVybnModHJ1ZSk7XG4gICAgICBhd2FpdCBhZGIuaW5zdGFsbE9yVXBncmFkZShhcGtQYXRoKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIHRocm93IGFuIGV4Y2VwdGlvbiBpZiB1cGdyYWRlIGFuZCByZWluc3RhbGwgZmFpbCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdnZXRBcGtJbmZvJykud2l0aEV4YWN0QXJncyhhcGtQYXRoKS5vbmNlKCkucmV0dXJucyh7XG4gICAgICAgIG5hbWU6IHBrZ0lkLFxuICAgICAgICB2ZXJzaW9uQ29kZTogMlxuICAgICAgfSk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnZ2V0UGFja2FnZUluZm8nKS5vbmNlKCkucmV0dXJucyh7XG4gICAgICAgIHZlcnNpb25Db2RlOiAxXG4gICAgICB9KTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdpc0FwcEluc3RhbGxlZCcpLndpdGhFeGFjdEFyZ3MocGtnSWQpLm9uY2UoKS5yZXR1cm5zKHRydWUpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ3VuaW5zdGFsbEFwaycpLndpdGhFeGFjdEFyZ3MocGtnSWQpLm9uY2UoKS5yZXR1cm5zKHRydWUpO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ2luc3RhbGwnKS53aXRoQXJncyhhcGtQYXRoKS50d2ljZSgpLnRocm93cygpO1xuICAgICAgbGV0IGlzRXhjZXB0aW9uVGhyb3duID0gZmFsc2U7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBhZGIuaW5zdGFsbE9yVXBncmFkZShhcGtQYXRoKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaXNFeGNlcHRpb25UaHJvd24gPSB0cnVlO1xuICAgICAgfVxuICAgICAgaXNFeGNlcHRpb25UaHJvd24uc2hvdWxkLmJlLnRydWU7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCB0aHJvdyBhbiBleGNlcHRpb24gaWYgdXBncmFkZSBhbmQgdW5pbnN0YWxsIGZhaWwnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnZ2V0QXBrSW5mbycpLndpdGhFeGFjdEFyZ3MoYXBrUGF0aCkub25jZSgpLnJldHVybnMoe1xuICAgICAgICBuYW1lOiBwa2dJZCxcbiAgICAgICAgdmVyc2lvbkNvZGU6IDJcbiAgICAgIH0pO1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoJ2dldFBhY2thZ2VJbmZvJykub25jZSgpLnJldHVybnMoe1xuICAgICAgICB2ZXJzaW9uQ29kZTogMVxuICAgICAgfSk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnaXNBcHBJbnN0YWxsZWQnKS53aXRoRXhhY3RBcmdzKHBrZ0lkKS5vbmNlKCkucmV0dXJucyh0cnVlKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCd1bmluc3RhbGxBcGsnKS53aXRoRXhhY3RBcmdzKHBrZ0lkKS5vbmNlKCkucmV0dXJucyhmYWxzZSk7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cygnaW5zdGFsbCcpLndpdGhBcmdzKGFwa1BhdGgpLm9uY2UoKS50aHJvd3MoKTtcbiAgICAgIGxldCBpc0V4Y2VwdGlvblRocm93biA9IGZhbHNlO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgYWRiLmluc3RhbGxPclVwZ3JhZGUoYXBrUGF0aCk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGlzRXhjZXB0aW9uVGhyb3duID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlzRXhjZXB0aW9uVGhyb3duLnNob3VsZC5iZS50cnVlO1xuICAgIH0pO1xuICB9KTtcbn0pKTtcbiJdLCJmaWxlIjoidGVzdC91bml0L2Fway11dGlscy1zcGVjcy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLiJ9
