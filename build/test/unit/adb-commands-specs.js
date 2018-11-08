"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _chai = _interopRequireDefault(require("chai"));

var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));

var _ = _interopRequireDefault(require("../.."));

var _net = _interopRequireDefault(require("net"));

var _events = _interopRequireDefault(require("events"));

var _logcat = _interopRequireDefault(require("../../lib/logcat.js"));

var teen_process = _interopRequireWildcard(require("teen_process"));

var _appiumTestSupport = require("appium-test-support");

_chai.default.use(_chaiAsPromised.default);

const should = _chai.default.should();

const apiLevel = 21,
      platformVersion = '4.4.4',
      language = 'en',
      country = 'US',
      locale = 'en-US',
      IME = 'com.android.inputmethod.latin/.LatinIME',
      imeList = `com.android.inputmethod.latin/.LatinIME:
  mId=com.android.inputmethod.latin/.LatinIME mSettingsActivityName=com.android
  mIsDefaultResId=0x7f070000
  Service:
    priority=0 preferredOrder=0 match=0x108000 specificIndex=-1 isDefault=false
    ServiceInfo:
      name=com.android.inputmethod.latin.LatinIME
      packageName=com.android.inputmethod.latin
      labelRes=0x7f0a0037 nonLocalizedLabel=null icon=0x0 banner=0x0
      enabled=true exported=true processName=com.android.inputmethod.latin
      permission=android.permission.BIND_INPUT_METHOD
      flags=0x0`,
      psOutput = `USER     PID   PPID  VSIZE  RSS     WCHAN    PC   NAME
u0_a101   5078  3129  487404 37044 ffffffff b76ce565 S com.example.android.contactmanager`,
      contactManagerPackage = 'com.example.android.contactmanager',
      model = `Android SDK built for X86_64`,
      manufacturer = `unknown`,
      screenSize = `768x1280`;
const adb = new _.default({
  adbExecTimeout: 60000
});
const logcat = new _logcat.default({
  adb: adb.executable,
  debug: false,
  debugTrace: false
});
describe('adb commands', (0, _appiumTestSupport.withMocks)({
  adb,
  logcat,
  teen_process,
  net: _net.default
}, function (mocks) {
  afterEach(function () {
    mocks.verify();
  });
  describe('shell', function () {
    describe('getApiLevel', function () {
      it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("getDeviceProperty").once().withExactArgs('ro.build.version.sdk').returns(`${apiLevel}`);
        (yield adb.getApiLevel()).should.equal(apiLevel);
      }));
    });
    describe('getPlatformVersion', function () {
      it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("getDeviceProperty").once().withExactArgs('ro.build.version.release').returns(platformVersion);
        (yield adb.getPlatformVersion()).should.equal(platformVersion);
      }));
    });
    describe('getDeviceSysLanguage', function () {
      it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['getprop', 'persist.sys.language']).returns(language);
        (yield adb.getDeviceSysLanguage()).should.equal(language);
      }));
    });
    describe('setDeviceSysLanguage', function () {
      it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['setprop', 'persist.sys.language', language]).returns("");
        yield adb.setDeviceSysLanguage(language);
      }));
    });
    describe('getDeviceSysCountry', function () {
      it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['getprop', 'persist.sys.country']).returns(country);
        (yield adb.getDeviceSysCountry()).should.equal(country);
      }));
    });
    describe('getLocationProviders', function () {
      it('should call shell with correct args and return empty location_providers_allowed', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("getSetting").once().withExactArgs('secure', 'location_providers_allowed').returns('');
        let providers = yield adb.getLocationProviders();
        providers.should.be.an('array');
        providers.length.should.equal(0);
      }));
      it('should return one location_providers_allowed', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("getSetting").once().withExactArgs('secure', 'location_providers_allowed').returns('gps');
        let providers = yield adb.getLocationProviders();
        providers.should.be.an('array');
        providers.length.should.equal(1);
        providers.should.include('gps');
      }));
      it('should return both location_providers_allowed', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("getSetting").once().withExactArgs('secure', 'location_providers_allowed').returns('gps ,wifi');
        let providers = yield adb.getLocationProviders();
        providers.should.be.an('array');
        providers.length.should.equal(2);
        providers.should.include('gps');
        providers.should.include('wifi');
      }));
    });
    describe('toggleGPSLocationProvider', function () {
      it('should call shell with correct args on gps enabled', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("setSetting").withExactArgs('secure', 'location_providers_allowed', '+gps');
        mocks.adb.expects("setSetting").withExactArgs('secure', 'location_providers_allowed', '-gps');
        yield adb.toggleGPSLocationProvider(true);
        yield adb.toggleGPSLocationProvider(false);
      }));
    });
    describe('setDeviceSysCountry', function () {
      it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['setprop', 'persist.sys.country', country]).returns("");
        yield adb.setDeviceSysCountry(country);
      }));
    });
    describe('getDeviceSysLocale', function () {
      it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['getprop', 'persist.sys.locale']).returns(locale);
        (yield adb.getDeviceSysLocale()).should.equal(locale);
      }));
    });
    describe('setDeviceSysLocale', function () {
      it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['setprop', 'persist.sys.locale', locale]).returns("");
        yield adb.setDeviceSysLocale(locale);
      }));
    });
    describe('getDeviceProductLanguage', function () {
      it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['getprop', 'ro.product.locale.language']).returns(language);
        (yield adb.getDeviceProductLanguage()).should.equal(language);
      }));
    });
    describe('getDeviceProductCountry', function () {
      it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['getprop', 'ro.product.locale.region']).returns(country);
        (yield adb.getDeviceProductCountry()).should.equal(country);
      }));
    });
    describe('getDeviceProductLocale', function () {
      it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['getprop', 'ro.product.locale']).returns(locale);
        (yield adb.getDeviceProductLocale()).should.equal(locale);
      }));
    });
    describe('setDeviceProperty', function () {
      it('should call setprop with correct args without root', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("getApiLevel").once().returns(21);
        mocks.adb.expects("shell").withExactArgs(['setprop', 'persist.sys.locale', locale]).returns("");
        yield adb.setDeviceProperty('persist.sys.locale', locale);
      }));
      it('should call setprop with correct args with root', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("getApiLevel").once().returns(26);
        mocks.adb.expects("root").once().returns("");
        mocks.adb.expects("shell").withExactArgs(['setprop', 'persist.sys.locale', locale]).returns("");
        mocks.adb.expects("unroot").once().returns("");
        yield adb.setDeviceProperty('persist.sys.locale', locale);
      }));
    });
    describe('availableIMEs', function () {
      it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withArgs(['ime', 'list', '-a']).returns(imeList);
        (yield adb.availableIMEs()).should.have.length.above(0);
      }));
    });
    describe('enabledIMEs', function () {
      it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withArgs(['ime', 'list']).returns(imeList);
        (yield adb.enabledIMEs()).should.have.length.above(0);
      }));
    });
    describe('defaultIME', function () {
      let defaultIME = 'com.android.inputmethod.latin/.LatinIME';
      it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("getSetting").once().withExactArgs('secure', 'default_input_method').returns(defaultIME);
        (yield adb.defaultIME()).should.equal(defaultIME);
      }));
    });
    describe('disableIME', function () {
      it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['ime', 'disable', IME]).returns("");
        yield adb.disableIME(IME);
      }));
    });
    describe('enableIME', function () {
      it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['ime', 'enable', IME]).returns("");
        yield adb.enableIME(IME);
      }));
    });
    describe('keyevent', function () {
      it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        let keycode = '29';
        let code = parseInt(keycode, 10);
        mocks.adb.expects("shell").once().withExactArgs(['input', 'keyevent', code]).returns("");
        yield adb.keyevent(keycode);
      }));
    });
    describe('inputText', function () {
      it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        let text = 'some text with spaces';
        let expectedText = 'some%stext%swith%sspaces';
        mocks.adb.expects("shell").once().withExactArgs(['input', 'text', expectedText]).returns("");
        yield adb.inputText(text);
      }));
    });
    describe('clearTextField', function () {
      it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['input', 'keyevent', '67', '112', '67', '112', '67', '112', '67', '112']).returns("");
        yield adb.clearTextField(4);
      }));
    });
    describe('lock', function () {
      it('should call isScreenLocked, keyevent', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("isScreenLocked").exactly(3).onCall(0).returns(false).onCall(1).returns(false).onCall(2).returns(true);
        mocks.adb.expects("keyevent").once().withExactArgs(26).returns("");
        yield adb.lock();
      }));
    });
    describe('back', function () {
      it('should call keyevent with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("keyevent").once().withExactArgs(4).returns("");
        yield adb.back();
      }));
    });
    describe('goToHome', function () {
      it('should call keyevent with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("keyevent").once().withExactArgs(3).returns("");
        yield adb.goToHome();
      }));
    });
    describe.skip('isScreenLocked', function () {
      it('should call keyevent with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("keyevent").once().withExactArgs(3).returns("");
        yield adb.goToHome();
      }));
    });
    describe('isSoftKeyboardPresent', function () {
      it('should call shell with correct args and should return false', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['dumpsys', 'input_method']).returns("mInputShown=false");

        let _ref31 = yield adb.isSoftKeyboardPresent(),
            isKeyboardShown = _ref31.isKeyboardShown,
            canCloseKeyboard = _ref31.canCloseKeyboard;

        canCloseKeyboard.should.be.false;
        isKeyboardShown.should.be.false;
      }));
      it('should call shell with correct args and should return true', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['dumpsys', 'input_method']).returns("mInputShown=true mIsInputViewShown=true");

        let _ref33 = yield adb.isSoftKeyboardPresent(),
            isKeyboardShown = _ref33.isKeyboardShown,
            canCloseKeyboard = _ref33.canCloseKeyboard;

        isKeyboardShown.should.be.true;
        canCloseKeyboard.should.be.true;
      }));
    });
    describe('isAirplaneModeOn', function () {
      it('should call shell with correct args and should be true', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("getSetting").once().withExactArgs('global', 'airplane_mode_on').returns("1");
        (yield adb.isAirplaneModeOn()).should.be.true;
      }));
      it('should call shell with correct args and should be false', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("getSetting").once().withExactArgs('global', 'airplane_mode_on').returns("0");
        (yield adb.isAirplaneModeOn()).should.be.false;
      }));
    });
    describe('setAirplaneMode', function () {
      it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("setSetting").once().withExactArgs('global', 'airplane_mode_on', 1).returns("");
        yield adb.setAirplaneMode(1);
      }));
    });
    describe('broadcastAirplaneMode', function () {
      it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['am', 'broadcast', '-a', 'android.intent.action.AIRPLANE_MODE', '--ez', 'state', 'true']).returns("");
        yield adb.broadcastAirplaneMode(true);
      }));
    });
    describe('isWifiOn', function () {
      it('should call shell with correct args and should be true', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("getSetting").once().withExactArgs('global', 'wifi_on').returns("1");
        (yield adb.isWifiOn()).should.be.true;
      }));
      it('should call shell with correct args and should be false', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("getSetting").once().withExactArgs('global', 'wifi_on').returns("0");
        (yield adb.isWifiOn()).should.be.false;
      }));
    });
    describe('setWifiState', function () {
      it('should call shell with correct args for real device', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['am', 'broadcast', '-a', 'io.appium.settings.wifi', '-n', 'io.appium.settings/.receivers.WiFiConnectionSettingReceiver', '--es', 'setstatus', 'enable']).returns("");
        yield adb.setWifiState(true);
      }));
      it('should call shell with correct args for emulator', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("root").once().returns(true);
        mocks.adb.expects("shell").once().withExactArgs(['svc', 'wifi', 'disable']).returns("");
        mocks.adb.expects("unroot").once();
        yield adb.setWifiState(false, true);
      }));
    });
    describe('isDataOn', function () {
      it('should call shell with correct args and should be true', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("getSetting").once().withExactArgs('global', 'mobile_data').returns("1");
        (yield adb.isDataOn()).should.be.true;
      }));
      it('should call shell with correct args and should be false', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("getSetting").once().withExactArgs('global', 'mobile_data').returns("0");
        (yield adb.isDataOn()).should.be.false;
      }));
    });
    describe('setDataState', function () {
      it('should call shell with correct args for real device', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['am', 'broadcast', '-a', 'io.appium.settings.data_connection', '-n', 'io.appium.settings/.receivers.DataConnectionSettingReceiver', '--es', 'setstatus', 'disable']).returns("");
        yield adb.setDataState(false);
      }));
      it('should call shell with correct args for emulator', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("root").once().returns(true);
        mocks.adb.expects("shell").once().withExactArgs(['svc', 'data', 'enable']).returns("");
        mocks.adb.expects("unroot").once();
        yield adb.setDataState(true, true);
      }));
    });
    describe('setWifiAndData', function () {
      it('should call shell with correct args when turning only wifi on for real device', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['am', 'broadcast', '-a', 'io.appium.settings.wifi', '-n', 'io.appium.settings/.receivers.WiFiConnectionSettingReceiver', '--es', 'setstatus', 'enable']).returns("");
        yield adb.setWifiAndData({
          wifi: true
        });
      }));
      it('should call shell with correct args when turning only wifi off for emulator', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("root").once().returns(true);
        mocks.adb.expects("shell").once().withExactArgs(['svc', 'wifi', 'disable']).returns("");
        mocks.adb.expects("unroot").once();
        yield adb.setWifiAndData({
          wifi: false
        }, true);
      }));
      it('should call shell with correct args when turning only data on for emulator', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("root").once().returns(true);
        mocks.adb.expects("shell").once().withExactArgs(['svc', 'data', 'enable']).returns("");
        mocks.adb.expects("unroot").once();
        yield adb.setWifiAndData({
          data: true
        }, true);
      }));
      it('should call shell with correct args when turning only data off for real device', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['am', 'broadcast', '-a', 'io.appium.settings.data_connection', '-n', 'io.appium.settings/.receivers.DataConnectionSettingReceiver', '--es', 'setstatus', 'disable']).returns("");
        yield adb.setWifiAndData({
          data: false
        });
      }));
      it('should call shell with correct args when turning both wifi and data on for real device', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").twice().returns("");
        yield adb.setWifiAndData({
          wifi: true,
          data: true
        });
      }));
      it('should call shell with correct args when turning both wifi and data off for emulator', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("root").atLeast(1).returns(true);
        mocks.adb.expects("shell").twice().returns("");
        mocks.adb.expects("unroot").atLeast(1);
        yield adb.setWifiAndData({
          wifi: false,
          data: false
        }, true);
      }));
    });
    describe('setAnimationState', function () {
      const adbArgs = ['am', 'broadcast', '-a', 'io.appium.settings.animation', '-n', 'io.appium.settings/.receivers.AnimationSettingReceiver', '--es', 'setstatus'];
      it('should call shell with correct args to enable animation', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(adbArgs.concat('enable'));
        yield adb.setAnimationState(true);
      }));
      it('should call shell with correct args to disable animation', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(adbArgs.concat('disable'));
        yield adb.setAnimationState(false);
      }));
    });
    describe('isAnimationOn', function () {
      const mockSetting = function mockSetting(duration_scale, transition_scale, window_scale) {
        mocks.adb.expects("getSetting").once().withExactArgs('global', 'animator_duration_scale').returns(duration_scale);
        mocks.adb.expects("getSetting").once().withExactArgs('global', 'transition_animation_scale').returns(transition_scale);
        mocks.adb.expects("getSetting").once().withExactArgs('global', 'window_animation_scale').returns(window_scale);
      };

      it('should return false if all animation settings are equal to zero', (0, _asyncToGenerator2.default)(function* () {
        mockSetting("0.0", "0.0", "0.0");
        (yield adb.isAnimationOn()).should.be.false;
      }));
      it('should return true if animator_duration_scale setting is NOT equal to zero', (0, _asyncToGenerator2.default)(function* () {
        mockSetting("0.5", "0.0", "0.0");
        (yield adb.isAnimationOn()).should.be.true;
      }));
      it('should return true if transition_animation_scale setting is NOT equal to zero', (0, _asyncToGenerator2.default)(function* () {
        mockSetting("0.0", "0.5", "0.0");
        (yield adb.isAnimationOn()).should.be.true;
      }));
      it('should return true if window_animation_scale setting is NOT equal to zero', (0, _asyncToGenerator2.default)(function* () {
        mockSetting("0.0", "0.0", "0.5");
        (yield adb.isAnimationOn()).should.be.true;
      }));
    });
    describe('setDeviceSysLocaleViaSettingApp', function () {
      it('should call shell with locale settings without script', (0, _asyncToGenerator2.default)(function* () {
        const adbArgs = ['am', 'broadcast', '-a', 'io.appium.settings.locale', '-n', 'io.appium.settings/.receivers.LocaleSettingReceiver', '--es', 'lang', 'en', '--es', 'country', 'US'];
        mocks.adb.expects("shell").once().withExactArgs(adbArgs);
        yield adb.setDeviceSysLocaleViaSettingApp('en', 'US');
      }));
      it('should call shell with locale settings with script', (0, _asyncToGenerator2.default)(function* () {
        const adbArgs = ['am', 'broadcast', '-a', 'io.appium.settings.locale', '-n', 'io.appium.settings/.receivers.LocaleSettingReceiver', '--es', 'lang', 'zh', '--es', 'country', 'CN', '--es', 'script', 'Hans'];
        mocks.adb.expects("shell").once().withExactArgs(adbArgs);
        yield adb.setDeviceSysLocaleViaSettingApp('zh', 'CN', 'Hans');
      }));
    });
    describe('setGeoLocation', function () {
      const location = {
        longitude: '50.5',
        latitude: '50.1'
      };
      it('should call shell with correct args for real device', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['am', 'startservice', '-e', 'longitude', location.longitude, '-e', 'latitude', location.latitude, `io.appium.settings/.LocationService`]).returns("");
        yield adb.setGeoLocation(location);
      }));
      it('should call adb with correct args for emulator', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("resetTelnetAuthToken").once().returns(true);
        mocks.adb.expects("adbExec").once().withExactArgs(['emu', 'geo', 'fix', location.longitude, location.latitude]).returns("");
        mocks.adb.expects("adbExec").once().withExactArgs(['emu', 'geo', 'fix', location.longitude.replace('.', ','), location.latitude.replace('.', ',')]).returns("");
        yield adb.setGeoLocation(location, true);
      }));
    });
    describe('processExists', function () {
      it('should call shell with correct args and should find process', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs("ps").returns(psOutput);
        (yield adb.processExists(contactManagerPackage)).should.be.true;
      }));
      it('should call shell with correct args and should not find process', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs("ps").returns("foo");
        (yield adb.processExists(contactManagerPackage)).should.be.false;
      }));
    });
    describe('forwardPort', function () {
      const sysPort = 12345,
            devicePort = 54321;
      it('forwardPort should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("adbExec").once().withExactArgs(['forward', `tcp:${sysPort}`, `tcp:${devicePort}`]).returns("");
        yield adb.forwardPort(sysPort, devicePort);
      }));
      it('forwardAbstractPort should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("adbExec").once().withExactArgs(['forward', `tcp:${sysPort}`, `localabstract:${devicePort}`]).returns("");
        yield adb.forwardAbstractPort(sysPort, devicePort);
      }));
      it('removePortForward should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("adbExec").once().withExactArgs(['forward', `--remove`, `tcp:${sysPort}`]).returns("");
        yield adb.removePortForward(sysPort, devicePort);
      }));
    });
    describe('ping', function () {
      it('should call shell with correct args and should return true', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(["echo", "ping"]).returns("ping");
        (yield adb.ping()).should.be.true;
      }));
    });
    describe('restart', function () {
      it('should call adb in correct order', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("stopLogcat").once().returns("");
        mocks.adb.expects("restartAdb").once().returns("");
        mocks.adb.expects("waitForDevice").once().returns("");
        mocks.adb.expects("startLogcat").once().returns("");
        yield adb.restart();
      }));
    });
    describe('stopLogcat', function () {
      it('should call stopCapture', (0, _asyncToGenerator2.default)(function* () {
        adb.logcat = logcat;
        mocks.logcat.expects("stopCapture").once().returns("");
        yield adb.stopLogcat();
      }));
    });
    describe('getLogcatLogs', function () {
      it('should call getLogs', (0, _asyncToGenerator2.default)(function* () {
        adb.logcat = logcat;
        mocks.logcat.expects("getLogs").once().returns("");
        yield adb.getLogcatLogs();
      }));
    });
    describe('getPIDsByName', function () {
      it('should call shell and parse pids correctly', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['ps']).returns(psOutput);
        (yield adb.getPIDsByName(contactManagerPackage))[0].should.equal(5078);
      }));
    });
    describe('killProcessesByName', function () {
      it('should call getPIDsByName and kill process correctly', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("getPIDsByName").once().withExactArgs(contactManagerPackage).returns([5078]);
        mocks.adb.expects("killProcessByPID").once().withExactArgs(5078).returns("");
        yield adb.killProcessesByName(contactManagerPackage);
      }));
    });
    describe('killProcessByPID', function () {
      const pid = 5078;
      it('should call kill process correctly', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['kill', '-0', pid]).returns('');
        mocks.adb.expects("shell").withExactArgs(['kill', pid]).twice().onCall(0).returns('').onCall(1).throws();
        yield adb.killProcessByPID(pid);
      }));
      it('should force kill process if normal kill fails', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['kill', '-0', pid]).returns('');
        mocks.adb.expects("shell").atLeast(2).withExactArgs(['kill', pid]).returns('');
        mocks.adb.expects("shell").once().withExactArgs(['kill', '-9', pid]).returns('');
        yield adb.killProcessByPID(pid);
      }));
      it('should throw an error if a process with given ID does not exist', (0, _asyncToGenerator2.default)(function* () {
        mocks.adb.expects("shell").once().withExactArgs(['whoami']).returns('root');
        mocks.adb.expects("root").never();
        mocks.adb.expects("unroot").never();
        mocks.adb.expects("shell").once().withExactArgs(['kill', '-0', pid]).throws();
        yield adb.killProcessByPID(pid).should.eventually.be.rejected;
      }));
    });
    describe('broadcastProcessEnd', function () {
      it('should broadcast process end', (0, _asyncToGenerator2.default)(function* () {
        let intent = 'intent',
            processName = 'processName';
        mocks.adb.expects("shell").once().withExactArgs(['am', 'broadcast', '-a', intent]).returns("");
        mocks.adb.expects("processExists").once().withExactArgs(processName).returns(false);
        yield adb.broadcastProcessEnd(intent, processName);
      }));
    });
    describe('broadcast', function () {
      it('should broadcast intent', (0, _asyncToGenerator2.default)(function* () {
        let intent = 'intent';
        mocks.adb.expects("shell").once().withExactArgs(['am', 'broadcast', '-a', intent]).returns("");
        yield adb.broadcast(intent);
      }));
    });
    describe('instrument', function () {
      it('should call shell with correct arguments', (0, _asyncToGenerator2.default)(function* () {
        let intent = 'intent';
        mocks.adb.expects("shell").once().withExactArgs(['am', 'broadcast', '-a', intent]).returns("");
        yield adb.broadcast(intent);
      }));
    });
    describe('androidCoverage', function () {
      it('should call shell with correct arguments', (0, _asyncToGenerator2.default)(function* () {
        adb.executable.defaultArgs = [];
        adb.executable.path = "dummy_adb_path";
        let conn = new _events.default.EventEmitter();

        conn.start = () => {};

        const instrumentClass = 'instrumentClass',
              waitPkg = 'waitPkg',
              waitActivity = 'waitActivity';
        let args = adb.executable.defaultArgs.concat(['shell', 'am', 'instrument', '-e', 'coverage', 'true', '-w']).concat([instrumentClass]);
        mocks.teen_process.expects("SubProcess").once().withExactArgs('dummy_adb_path', args).returns(conn);
        mocks.adb.expects("waitForActivity").once().withExactArgs(waitPkg, waitActivity).returns("");
        yield adb.androidCoverage(instrumentClass, waitPkg, waitActivity);
      }));
    });
  });
  describe('device info', function () {
    it('should get device model', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("shell").once().withExactArgs(['getprop', 'ro.product.model']).returns(model);
      yield adb.getModel();
    }));
    it('should get device manufacturer', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("shell").once().withExactArgs(['getprop', 'ro.product.manufacturer']).returns(manufacturer);
      yield adb.getManufacturer();
    }));
    it('should get device screen size', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("shell").once().withExactArgs(['wm', 'size']).returns(screenSize);
      yield adb.getScreenSize();
    }));
    it('should get device screen density', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("shell").once().withExactArgs(['wm', 'density']).returns("Physical density: 420");
      let density = yield adb.getScreenDensity();
      density.should.equal(420);
    }));
    it('should return null for invalid screen density', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("shell").once().withExactArgs(['wm', 'density']).returns("Physical density: unknown");
      let density = yield adb.getScreenDensity();
      should.equal(density, null);
    }));
  });
  describe('app permission', function () {
    const dumpedOutput = `
          declared permissions:
            com.xxx.permission.C2D_MESSAGE: prot=signature, INSTALLED
            com.xxx.permission.C2D_MESSAGE: prot=signature
          requested permissions:
            android.permission.ACCESS_NETWORK_STATE
            android.permission.WRITE_EXTERNAL_STORAGE
            android.permission.INTERNET
            android.permission.READ_CONTACTS
            android.permission.RECORD_AUDIO
            android.permission.VIBRATE
            android.permission.CAMERA
            android.permission.FLASHLIGHT
            android.permission.READ_PHONE_STATE
            android.permission.MODIFY_AUDIO_SETTINGS
            android.permission.BLUETOOTH
            android.permission.WAKE_LOCK
            com.google.android.c2dm.permission.RECEIVE
            com.xxx.permission.C2D_MESSAGE
            android.permission.ACCESS_FINE_LOCATION
            android.permission.READ_EXTERNAL_STORAGE
            android.permission.RECEIVE_BOOT_COMPLETED
            .permission.C2D_MESSAGE
          install permissions:
            com.google.android.c2dm.permission.RECEIVE: granted=true
            android.permission.MODIFY_AUDIO_SETTINGS: granted=true
            android.permission.RECEIVE_BOOT_COMPLETED: granted=true
            android.permission.BLUETOOTH: granted=true
            android.permission.INTERNET: granted=true
            com.xxx.permission.C2D_MESSAGE: granted=true
            android.permission.FLASHLIGHT: granted=true
            android.permission.ACCESS_NETWORK_STATE: granted=true
            android.permission.VIBRATE: granted=true
            android.permission.WAKE_LOCK: granted=true
          User 0: ceDataInode=1504712 installed=true hidden=false suspended=false stopped=false notLaunched=false enabled=0
            gids=[3002, 3003]
            runtime permissions:
              android.permission.ACCESS_FINE_LOCATION: granted=true
              android.permission.READ_EXTERNAL_STORAGE: granted=true
              android.permission.READ_PHONE_STATE: granted=true
              android.permission.CAMERA: granted=false, flags=[ USER_SET ]
              android.permission.WRITE_EXTERNAL_STORAGE: granted=true
              android.permission.RECORD_AUDIO: granted=true
              android.permission.READ_CONTACTS: granted=false, flags=[ USER_SET ]


      Dexopt state:
        [com.xxx]
          Instruction Set: arm
            path: /data/app/com.xxx-1/base.apk
            status: /data/app/com.xxxa-1/oat/arm/base.odex [compilation_filter=interpret-only, status=kOatUpToDate]


      Compiler stats:
        [com.xxx]
           base.apk - 8264

    DUMP OF SERVICE activity:
      ACTIVITY MANAGER PENDING INTENTS (dumpsys activity intents)
        (nothing)`;
    const dumpedLimitedOutput = `
          declared permissions:
            com.xxx.permission.C2D_MESSAGE: prot=signature, INSTALLED
            com.xxx.permission.C2D_MESSAGE: prot=signature
          requested permissions:
            android.permission.ACCESS_NETWORK_STATE
            android.permission.WRITE_EXTERNAL_STORAGE
            android.permission.INTERNET
            android.permission.READ_CONTACTS
            android.permission.RECORD_AUDIO
            android.permission.VIBRATE
            android.permission.CAMERA
            android.permission.FLASHLIGHT
            android.permission.READ_PHONE_STATE
            android.permission.MODIFY_AUDIO_SETTINGS
            android.permission.BLUETOOTH
            android.permission.WAKE_LOCK
            com.google.android.c2dm.permission.RECEIVE
            com.xxx.permission.C2D_MESSAGE
            android.permission.ACCESS_FINE_LOCATION
            android.permission.READ_EXTERNAL_STORAGE
            android.permission.RECEIVE_BOOT_COMPLETED
            .permission.C2D_MESSAGE
          User 0: ceDataInode=1504712 installed=true hidden=false suspended=false stopped=false notLaunched=false enabled=0
            gids=[3002, 3003]
            runtime permissions:
              android.permission.ACCESS_FINE_LOCATION: granted=true
              android.permission.READ_EXTERNAL_STORAGE: granted=true
              android.permission.READ_PHONE_STATE: granted=true
              android.permission.CAMERA: granted=false, flags=[ USER_SET ]
              android.permission.WRITE_EXTERNAL_STORAGE: granted=true
              android.permission.RECORD_AUDIO: granted=true
              android.permission.READ_CONTACTS: granted=false, flags=[ USER_SET ]


      Dexopt state:
        [com.xxx]
          Instruction Set: arm
            path: /data/app/com.xxx-1/base.apk
            status: /data/app/com.xxxa-1/oat/arm/base.odex [compilation_filter=interpret-only, status=kOatUpToDate]


      Compiler stats:
        [com.xxx]
           base.apk - 8264

    DUMP OF SERVICE activity:
      ACTIVITY MANAGER PENDING INTENTS (dumpsys activity intents)
        (nothing)`;
    it('should grant requested permission', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("shell").once().withArgs(['pm', 'grant', 'io.appium.android.apis', 'android.permission.READ_EXTERNAL_STORAGE']);
      yield adb.grantPermission('io.appium.android.apis', 'android.permission.READ_EXTERNAL_STORAGE');
    }));
    it('should revoke requested permission', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("shell").once().withArgs(['pm', 'revoke', 'io.appium.android.apis', 'android.permission.READ_EXTERNAL_STORAGE']);
      yield adb.revokePermission('io.appium.android.apis', 'android.permission.READ_EXTERNAL_STORAGE');
    }));
    it('should properly list requested permissions', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("shell").once().returns(dumpedOutput);
      const result = yield adb.getReqPermissions('io.appium.android');
      var _arr = ['android.permission.ACCESS_NETWORK_STATE', 'android.permission.WRITE_EXTERNAL_STORAGE', 'android.permission.INTERNET', 'android.permission.READ_CONTACTS', 'android.permission.RECORD_AUDIO', 'android.permission.VIBRATE', 'android.permission.CAMERA', 'android.permission.FLASHLIGHT', 'android.permission.READ_PHONE_STATE', 'android.permission.MODIFY_AUDIO_SETTINGS', 'android.permission.BLUETOOTH', 'android.permission.WAKE_LOCK', 'android.permission.ACCESS_FINE_LOCATION', 'android.permission.READ_EXTERNAL_STORAGE', 'android.permission.RECEIVE_BOOT_COMPLETED'];

      for (var _i = 0; _i < _arr.length; _i++) {
        let perm = _arr[_i];
        result.should.include(perm);
      }
    }));
    it('should properly list requested permissions for output without install permissions', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("shell").once().returns(dumpedLimitedOutput);
      const result = yield adb.getReqPermissions('io.appium.android');
      var _arr2 = ['android.permission.ACCESS_NETWORK_STATE', 'android.permission.WRITE_EXTERNAL_STORAGE', 'android.permission.INTERNET', 'android.permission.READ_CONTACTS', 'android.permission.RECORD_AUDIO', 'android.permission.VIBRATE', 'android.permission.CAMERA', 'android.permission.FLASHLIGHT', 'android.permission.READ_PHONE_STATE', 'android.permission.MODIFY_AUDIO_SETTINGS', 'android.permission.BLUETOOTH', 'android.permission.WAKE_LOCK', 'android.permission.ACCESS_FINE_LOCATION', 'android.permission.READ_EXTERNAL_STORAGE', 'android.permission.RECEIVE_BOOT_COMPLETED'];

      for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
        let perm = _arr2[_i2];
        result.should.include(perm);
      }
    }));
    it('should properly list granted permissions', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("shell").once().returns(dumpedOutput);
      const result = yield adb.getGrantedPermissions('io.appium.android');
      var _arr3 = ['android.permission.MODIFY_AUDIO_SETTINGS', 'android.permission.RECEIVE_BOOT_COMPLETED', 'android.permission.BLUETOOTH', 'android.permission.INTERNET', 'android.permission.FLASHLIGHT', 'android.permission.ACCESS_NETWORK_STATE', 'android.permission.VIBRATE', 'android.permission.WAKE_LOCK', 'android.permission.ACCESS_FINE_LOCATION', 'android.permission.READ_EXTERNAL_STORAGE', 'android.permission.READ_PHONE_STATE', 'android.permission.WRITE_EXTERNAL_STORAGE', 'android.permission.RECORD_AUDIO'];

      for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
        let perm = _arr3[_i3];
        result.should.include(perm);
      }

      var _arr4 = ['android.permission.READ_CONTACTS', 'android.permission.CAMERA'];

      for (var _i4 = 0; _i4 < _arr4.length; _i4++) {
        let perm = _arr4[_i4];
        result.should.not.include(perm);
      }
    }));
    it('should properly list granted permissions for output without install permissions', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("shell").once().returns(dumpedLimitedOutput);
      const result = yield adb.getGrantedPermissions('io.appium.android');
      var _arr5 = ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.READ_EXTERNAL_STORAGE', 'android.permission.READ_PHONE_STATE', 'android.permission.WRITE_EXTERNAL_STORAGE', 'android.permission.RECORD_AUDIO'];

      for (var _i5 = 0; _i5 < _arr5.length; _i5++) {
        let perm = _arr5[_i5];
        result.should.include(perm);
      }

      var _arr6 = ['android.permission.READ_CONTACTS', 'android.permission.CAMERA'];

      for (var _i6 = 0; _i6 < _arr6.length; _i6++) {
        let perm = _arr6[_i6];
        result.should.not.include(perm);
      }
    }));
    it('should properly list denied permissions', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("shell").once().returns(dumpedOutput);
      const result = yield adb.getDeniedPermissions('io.appium.android');
      var _arr7 = ['android.permission.MODIFY_AUDIO_SETTINGS', 'android.permission.RECEIVE_BOOT_COMPLETED', 'android.permission.BLUETOOTH', 'android.permission.INTERNET', 'android.permission.FLASHLIGHT', 'android.permission.ACCESS_NETWORK_STATE', 'android.permission.VIBRATE', 'android.permission.WAKE_LOCK', 'android.permission.ACCESS_FINE_LOCATION', 'android.permission.READ_EXTERNAL_STORAGE', 'android.permission.READ_PHONE_STATE', 'android.permission.WRITE_EXTERNAL_STORAGE', 'android.permission.RECORD_AUDIO'];

      for (var _i7 = 0; _i7 < _arr7.length; _i7++) {
        let perm = _arr7[_i7];
        result.should.not.include(perm);
      }

      var _arr8 = ['android.permission.READ_CONTACTS', 'android.permission.CAMERA'];

      for (var _i8 = 0; _i8 < _arr8.length; _i8++) {
        let perm = _arr8[_i8];
        result.should.include(perm);
      }
    }));
    it('should properly list denied permissions for output without install permissions', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects("shell").once().returns(dumpedLimitedOutput);
      const result = yield adb.getDeniedPermissions('io.appium.android');
      var _arr9 = ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.READ_EXTERNAL_STORAGE', 'android.permission.READ_PHONE_STATE', 'android.permission.WRITE_EXTERNAL_STORAGE', 'android.permission.RECORD_AUDIO'];

      for (var _i9 = 0; _i9 < _arr9.length; _i9++) {
        let perm = _arr9[_i9];
        result.should.not.include(perm);
      }

      var _arr10 = ['android.permission.READ_CONTACTS', 'android.permission.CAMERA'];

      for (var _i10 = 0; _i10 < _arr10.length; _i10++) {
        let perm = _arr10[_i10];
        result.should.include(perm);
      }
    }));
  });
  describe('sendTelnetCommand', function () {
    it('should call shell with correct args', (0, _asyncToGenerator2.default)(function* () {
      const port = 54321;
      let conn = new _events.default.EventEmitter();
      let commands = [];

      conn.write = function (command) {
        commands.push(command);
      };

      mocks.adb.expects("getEmulatorPort").once().withExactArgs().returns(port);
      mocks.net.expects("createConnection").once().withExactArgs(port, 'localhost').returns(conn);
      let p = adb.sendTelnetCommand('avd name');
      setTimeout(function () {
        conn.emit('connect');
        conn.emit('data', 'OK');
        conn.emit('data', 'OK');
        conn.emit('close');
      }, 0);
      yield p;
      commands[0].should.equal("avd name\n");
      commands[1].should.equal("quit\n");
    }));
    it('should return the last line of the output only', (0, _asyncToGenerator2.default)(function* () {
      const port = 54321;
      let conn = new _events.default.EventEmitter();
      let commands = [];
      let expected = "desired_command_output";

      conn.write = function (command) {
        commands.push(command);
      };

      mocks.adb.expects("getEmulatorPort").once().withExactArgs().returns(port);
      mocks.net.expects("createConnection").once().withExactArgs(port, 'localhost').returns(conn);
      let p = adb.sendTelnetCommand('avd name');
      setTimeout(function () {
        conn.emit('connect');
        conn.emit('data', 'OK');
        conn.emit('data', 'OK\nunwanted_echo_output\n' + expected);
        conn.emit('close');
      }, 0);
      let actual = yield p;
      actual.should.equal(expected);
    }));
    it('should throw error if network connection errors', (0, _asyncToGenerator2.default)(function* () {
      const port = 54321;
      let conn = new _events.default.EventEmitter();
      let commands = [];
      let expected = "desired_command_output";

      conn.write = function (command) {
        commands.push(command);
      };

      mocks.adb.expects("getEmulatorPort").once().withExactArgs().returns(port);
      mocks.net.expects("createConnection").once().withExactArgs(port, 'localhost').returns(conn);
      let p = adb.sendTelnetCommand('avd name');
      setTimeout(function () {
        conn.emit('connect');
        conn.emit('data', 'OK');
        conn.emit('data', 'OK\nunwanted_echo_output\n' + expected);
        conn.emit('error', new Error('ouch!'));
      }, 0);
      yield p.should.eventually.be.rejectedWith(/ouch/);
    }));
  });
  it('isValidClass should correctly validate class names', function () {
    adb.isValidClass('some.package/some.package.Activity').index.should.equal(0);
    should.not.exist(adb.isValidClass('illegalPackage#/adsasd'));
  });
  it('getAdbPath should correctly return adbPath', function () {
    adb.getAdbPath().should.equal(adb.executable.path);
  });
  describe('setHttpProxy', function () {
    it('should throw an error on undefined proxy_host', (0, _asyncToGenerator2.default)(function* () {
      yield adb.setHttpProxy().should.eventually.be.rejected;
    }));
    it('should throw an error on undefined proxy_port', (0, _asyncToGenerator2.default)(function* () {
      yield adb.setHttpProxy("http://localhost").should.eventually.be.rejected;
    }));
    it('should call setSetting method with correct args', (0, _asyncToGenerator2.default)(function* () {
      let proxyHost = "http://localhost";
      let proxyPort = 4723;
      mocks.adb.expects('setSetting').once().withExactArgs('global', 'http_proxy', `${proxyHost}:${proxyPort}`);
      mocks.adb.expects('setSetting').once().withExactArgs('secure', 'http_proxy', `${proxyHost}:${proxyPort}`);
      mocks.adb.expects('setSetting').once().withExactArgs('system', 'http_proxy', `${proxyHost}:${proxyPort}`);
      mocks.adb.expects('setSetting').once().withExactArgs('system', 'global_http_proxy_host', proxyHost);
      mocks.adb.expects('setSetting').once().withExactArgs('system', 'global_http_proxy_port', proxyPort);
      yield adb.setHttpProxy(proxyHost, proxyPort);
    }));
  });
  describe('setSetting', function () {
    it('should call shell settings put', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withExactArgs(['settings', 'put', 'namespace', 'setting', 'value']);
      yield adb.setSetting('namespace', 'setting', 'value');
    }));
  });
  describe('getSetting', function () {
    it('should call shell settings get', (0, _asyncToGenerator2.default)(function* () {
      mocks.adb.expects('shell').once().withArgs(['settings', 'get', 'namespace', 'setting']).returns('value');
      (yield adb.getSetting('namespace', 'setting')).should.be.equal('value');
    }));
  });
}));require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvdW5pdC9hZGItY29tbWFuZHMtc3BlY3MuanMiXSwibmFtZXMiOlsiY2hhaSIsInVzZSIsImNoYWlBc1Byb21pc2VkIiwic2hvdWxkIiwiYXBpTGV2ZWwiLCJwbGF0Zm9ybVZlcnNpb24iLCJsYW5ndWFnZSIsImNvdW50cnkiLCJsb2NhbGUiLCJJTUUiLCJpbWVMaXN0IiwicHNPdXRwdXQiLCJjb250YWN0TWFuYWdlclBhY2thZ2UiLCJtb2RlbCIsIm1hbnVmYWN0dXJlciIsInNjcmVlblNpemUiLCJhZGIiLCJBREIiLCJhZGJFeGVjVGltZW91dCIsImxvZ2NhdCIsIkxvZ2NhdCIsImV4ZWN1dGFibGUiLCJkZWJ1ZyIsImRlYnVnVHJhY2UiLCJkZXNjcmliZSIsInRlZW5fcHJvY2VzcyIsIm5ldCIsIm1vY2tzIiwiYWZ0ZXJFYWNoIiwidmVyaWZ5IiwiaXQiLCJleHBlY3RzIiwib25jZSIsIndpdGhFeGFjdEFyZ3MiLCJyZXR1cm5zIiwiZ2V0QXBpTGV2ZWwiLCJlcXVhbCIsImdldFBsYXRmb3JtVmVyc2lvbiIsImdldERldmljZVN5c0xhbmd1YWdlIiwic2V0RGV2aWNlU3lzTGFuZ3VhZ2UiLCJnZXREZXZpY2VTeXNDb3VudHJ5IiwicHJvdmlkZXJzIiwiZ2V0TG9jYXRpb25Qcm92aWRlcnMiLCJiZSIsImFuIiwibGVuZ3RoIiwiaW5jbHVkZSIsInRvZ2dsZUdQU0xvY2F0aW9uUHJvdmlkZXIiLCJzZXREZXZpY2VTeXNDb3VudHJ5IiwiZ2V0RGV2aWNlU3lzTG9jYWxlIiwic2V0RGV2aWNlU3lzTG9jYWxlIiwiZ2V0RGV2aWNlUHJvZHVjdExhbmd1YWdlIiwiZ2V0RGV2aWNlUHJvZHVjdENvdW50cnkiLCJnZXREZXZpY2VQcm9kdWN0TG9jYWxlIiwic2V0RGV2aWNlUHJvcGVydHkiLCJ3aXRoQXJncyIsImF2YWlsYWJsZUlNRXMiLCJoYXZlIiwiYWJvdmUiLCJlbmFibGVkSU1FcyIsImRlZmF1bHRJTUUiLCJkaXNhYmxlSU1FIiwiZW5hYmxlSU1FIiwia2V5Y29kZSIsImNvZGUiLCJwYXJzZUludCIsImtleWV2ZW50IiwidGV4dCIsImV4cGVjdGVkVGV4dCIsImlucHV0VGV4dCIsImNsZWFyVGV4dEZpZWxkIiwiZXhhY3RseSIsIm9uQ2FsbCIsImxvY2siLCJiYWNrIiwiZ29Ub0hvbWUiLCJza2lwIiwiaXNTb2Z0S2V5Ym9hcmRQcmVzZW50IiwiaXNLZXlib2FyZFNob3duIiwiY2FuQ2xvc2VLZXlib2FyZCIsImZhbHNlIiwidHJ1ZSIsImlzQWlycGxhbmVNb2RlT24iLCJzZXRBaXJwbGFuZU1vZGUiLCJicm9hZGNhc3RBaXJwbGFuZU1vZGUiLCJpc1dpZmlPbiIsInNldFdpZmlTdGF0ZSIsImlzRGF0YU9uIiwic2V0RGF0YVN0YXRlIiwic2V0V2lmaUFuZERhdGEiLCJ3aWZpIiwiZGF0YSIsInR3aWNlIiwiYXRMZWFzdCIsImFkYkFyZ3MiLCJjb25jYXQiLCJzZXRBbmltYXRpb25TdGF0ZSIsIm1vY2tTZXR0aW5nIiwiZHVyYXRpb25fc2NhbGUiLCJ0cmFuc2l0aW9uX3NjYWxlIiwid2luZG93X3NjYWxlIiwiaXNBbmltYXRpb25PbiIsInNldERldmljZVN5c0xvY2FsZVZpYVNldHRpbmdBcHAiLCJsb2NhdGlvbiIsImxvbmdpdHVkZSIsImxhdGl0dWRlIiwic2V0R2VvTG9jYXRpb24iLCJyZXBsYWNlIiwicHJvY2Vzc0V4aXN0cyIsInN5c1BvcnQiLCJkZXZpY2VQb3J0IiwiZm9yd2FyZFBvcnQiLCJmb3J3YXJkQWJzdHJhY3RQb3J0IiwicmVtb3ZlUG9ydEZvcndhcmQiLCJwaW5nIiwicmVzdGFydCIsInN0b3BMb2djYXQiLCJnZXRMb2djYXRMb2dzIiwiZ2V0UElEc0J5TmFtZSIsImtpbGxQcm9jZXNzZXNCeU5hbWUiLCJwaWQiLCJ0aHJvd3MiLCJraWxsUHJvY2Vzc0J5UElEIiwibmV2ZXIiLCJldmVudHVhbGx5IiwicmVqZWN0ZWQiLCJpbnRlbnQiLCJwcm9jZXNzTmFtZSIsImJyb2FkY2FzdFByb2Nlc3NFbmQiLCJicm9hZGNhc3QiLCJkZWZhdWx0QXJncyIsInBhdGgiLCJjb25uIiwiZXZlbnRzIiwiRXZlbnRFbWl0dGVyIiwic3RhcnQiLCJpbnN0cnVtZW50Q2xhc3MiLCJ3YWl0UGtnIiwid2FpdEFjdGl2aXR5IiwiYXJncyIsImFuZHJvaWRDb3ZlcmFnZSIsImdldE1vZGVsIiwiZ2V0TWFudWZhY3R1cmVyIiwiZ2V0U2NyZWVuU2l6ZSIsImRlbnNpdHkiLCJnZXRTY3JlZW5EZW5zaXR5IiwiZHVtcGVkT3V0cHV0IiwiZHVtcGVkTGltaXRlZE91dHB1dCIsImdyYW50UGVybWlzc2lvbiIsInJldm9rZVBlcm1pc3Npb24iLCJyZXN1bHQiLCJnZXRSZXFQZXJtaXNzaW9ucyIsInBlcm0iLCJnZXRHcmFudGVkUGVybWlzc2lvbnMiLCJub3QiLCJnZXREZW5pZWRQZXJtaXNzaW9ucyIsInBvcnQiLCJjb21tYW5kcyIsIndyaXRlIiwiY29tbWFuZCIsInB1c2giLCJwIiwic2VuZFRlbG5ldENvbW1hbmQiLCJzZXRUaW1lb3V0IiwiZW1pdCIsImV4cGVjdGVkIiwiYWN0dWFsIiwiRXJyb3IiLCJyZWplY3RlZFdpdGgiLCJpc1ZhbGlkQ2xhc3MiLCJpbmRleCIsImV4aXN0IiwiZ2V0QWRiUGF0aCIsInNldEh0dHBQcm94eSIsInByb3h5SG9zdCIsInByb3h5UG9ydCIsInNldFNldHRpbmciLCJnZXRTZXR0aW5nIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUdBQSxjQUFLQyxHQUFMLENBQVNDLHVCQUFUOztBQUNBLE1BQU1DLE1BQU0sR0FBR0gsY0FBS0csTUFBTCxFQUFmOztBQUNBLE1BQU1DLFFBQVEsR0FBRyxFQUFqQjtBQUFBLE1BQ01DLGVBQWUsR0FBRyxPQUR4QjtBQUFBLE1BRU1DLFFBQVEsR0FBRyxJQUZqQjtBQUFBLE1BR01DLE9BQU8sR0FBRyxJQUhoQjtBQUFBLE1BSU1DLE1BQU0sR0FBRyxPQUpmO0FBQUEsTUFLTUMsR0FBRyxHQUFHLHlDQUxa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V0FBZixFQUE0QixTQUE1QixFQUF1QyxPQUF2QyxDQUFOO0FBQ0QsS0FKQyxFQUFGO0FBS0QsR0FOTyxDQUFSO0FBT0F4SixFQUFBQSxRQUFRLENBQUMsWUFBRCxFQUFlLFlBQVk7QUFDakNNLElBQUFBLEVBQUUsQ0FBQyxnQ0FBRCxrQ0FBbUMsYUFBa0I7QUFDckRILE1BQUFBLEtBQUssQ0FBQ1gsR0FBTixDQUFVZSxPQUFWLENBQWtCLE9BQWxCLEVBQTJCQyxJQUEzQixHQUNHdUIsUUFESCxDQUNZLENBQUMsVUFBRCxFQUFhLEtBQWIsRUFBb0IsV0FBcEIsRUFBaUMsU0FBakMsQ0FEWixFQUVHckIsT0FGSCxDQUVXLE9BRlg7QUFHQSxhQUFPbEIsR0FBRyxDQUFDaUssVUFBSixDQUFlLFdBQWYsRUFBNEIsU0FBNUIsQ0FBUCxFQUErQzlLLE1BQS9DLENBQXNEd0MsRUFBdEQsQ0FBeURQLEtBQXpELENBQStELE9BQS9EO0FBQ0QsS0FMQyxFQUFGO0FBTUQsR0FQTyxDQUFSO0FBUUQsQ0F2bEN3QixDQUFqQixDQUFSIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5pbXBvcnQgY2hhaUFzUHJvbWlzZWQgZnJvbSAnY2hhaS1hcy1wcm9taXNlZCc7XG5pbXBvcnQgQURCIGZyb20gJy4uLy4uJztcbmltcG9ydCBuZXQgZnJvbSAnbmV0JztcbmltcG9ydCBldmVudHMgZnJvbSAnZXZlbnRzJztcbmltcG9ydCBMb2djYXQgZnJvbSAnLi4vLi4vbGliL2xvZ2NhdC5qcyc7XG5pbXBvcnQgKiBhcyB0ZWVuX3Byb2Nlc3MgZnJvbSAndGVlbl9wcm9jZXNzJztcbmltcG9ydCB7IHdpdGhNb2NrcyB9IGZyb20gJ2FwcGl1bS10ZXN0LXN1cHBvcnQnO1xuXG5cbmNoYWkudXNlKGNoYWlBc1Byb21pc2VkKTtcbmNvbnN0IHNob3VsZCA9IGNoYWkuc2hvdWxkKCk7XG5jb25zdCBhcGlMZXZlbCA9IDIxLFxuICAgICAgcGxhdGZvcm1WZXJzaW9uID0gJzQuNC40JyxcbiAgICAgIGxhbmd1YWdlID0gJ2VuJyxcbiAgICAgIGNvdW50cnkgPSAnVVMnLFxuICAgICAgbG9jYWxlID0gJ2VuLVVTJyxcbiAgICAgIElNRSA9ICdjb20uYW5kcm9pZC5pbnB1dG1ldGhvZC5sYXRpbi8uTGF0aW5JTUUnLFxuICAgICAgaW1lTGlzdCA9IGBjb20uYW5kcm9pZC5pbnB1dG1ldGhvZC5sYXRpbi8uTGF0aW5JTUU6XG4gIG1JZD1jb20uYW5kcm9pZC5pbnB1dG1ldGhvZC5sYXRpbi8uTGF0aW5JTUUgbVNldHRpbmdzQWN0aXZpdHlOYW1lPWNvbS5hbmRyb2lkXG4gIG1Jc0RlZmF1bHRSZXNJZD0weDdmMDcwMDAwXG4gIFNlcnZpY2U6XG4gICAgcHJpb3JpdHk9MCBwcmVmZXJyZWRPcmRlcj0wIG1hdGNoPTB4MTA4MDAwIHNwZWNpZmljSW5kZXg9LTEgaXNEZWZhdWx0PWZhbHNlXG4gICAgU2VydmljZUluZm86XG4gICAgICBuYW1lPWNvbS5hbmRyb2lkLmlucHV0bWV0aG9kLmxhdGluLkxhdGluSU1FXG4gICAgICBwYWNrYWdlTmFtZT1jb20uYW5kcm9pZC5pbnB1dG1ldGhvZC5sYXRpblxuICAgICAgbGFiZWxSZXM9MHg3ZjBhMDAzNyBub25Mb2NhbGl6ZWRMYWJlbD1udWxsIGljb249MHgwIGJhbm5lcj0weDBcbiAgICAgIGVuYWJsZWQ9dHJ1ZSBleHBvcnRlZD10cnVlIHByb2Nlc3NOYW1lPWNvbS5hbmRyb2lkLmlucHV0bWV0aG9kLmxhdGluXG4gICAgICBwZXJtaXNzaW9uPWFuZHJvaWQucGVybWlzc2lvbi5CSU5EX0lOUFVUX01FVEhPRFxuICAgICAgZmxhZ3M9MHgwYCxcbiAgICAgIHBzT3V0cHV0ID0gYFVTRVIgICAgIFBJRCAgIFBQSUQgIFZTSVpFICBSU1MgICAgIFdDSEFOICAgIFBDICAgTkFNRVxudTBfYTEwMSAgIDUwNzggIDMxMjkgIDQ4NzQwNCAzNzA0NCBmZmZmZmZmZiBiNzZjZTU2NSBTIGNvbS5leGFtcGxlLmFuZHJvaWQuY29udGFjdG1hbmFnZXJgLFxuICAgICAgY29udGFjdE1hbmFnZXJQYWNrYWdlID0gJ2NvbS5leGFtcGxlLmFuZHJvaWQuY29udGFjdG1hbmFnZXInLFxuICAgICAgbW9kZWwgPSBgQW5kcm9pZCBTREsgYnVpbHQgZm9yIFg4Nl82NGAsXG4gICAgICBtYW51ZmFjdHVyZXIgPSBgdW5rbm93bmAsXG4gICAgICBzY3JlZW5TaXplID0gYDc2OHgxMjgwYDtcblxuY29uc3QgYWRiID0gbmV3IEFEQih7IGFkYkV4ZWNUaW1lb3V0OiA2MDAwMCB9KTtcbmNvbnN0IGxvZ2NhdCA9IG5ldyBMb2djYXQoe1xuICBhZGI6IGFkYi5leGVjdXRhYmxlLFxuICBkZWJ1ZzogZmFsc2UsXG4gIGRlYnVnVHJhY2U6IGZhbHNlXG59KTtcblxuZGVzY3JpYmUoJ2FkYiBjb21tYW5kcycsIHdpdGhNb2Nrcyh7YWRiLCBsb2djYXQsIHRlZW5fcHJvY2VzcywgbmV0fSwgZnVuY3Rpb24gKG1vY2tzKSB7XG4gIGFmdGVyRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgbW9ja3MudmVyaWZ5KCk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdzaGVsbCcsIGZ1bmN0aW9uICgpIHtcbiAgICBkZXNjcmliZSgnZ2V0QXBpTGV2ZWwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgd2l0aCBjb3JyZWN0IGFyZ3MnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0RGV2aWNlUHJvcGVydHlcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoJ3JvLmJ1aWxkLnZlcnNpb24uc2RrJylcbiAgICAgICAgICAucmV0dXJucyhgJHthcGlMZXZlbH1gKTtcbiAgICAgICAgKGF3YWl0IGFkYi5nZXRBcGlMZXZlbCgpKS5zaG91bGQuZXF1YWwoYXBpTGV2ZWwpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ2dldFBsYXRmb3JtVmVyc2lvbicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJncycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXREZXZpY2VQcm9wZXJ0eVwiKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncygncm8uYnVpbGQudmVyc2lvbi5yZWxlYXNlJylcbiAgICAgICAgICAucmV0dXJucyhwbGF0Zm9ybVZlcnNpb24pO1xuICAgICAgICAoYXdhaXQgYWRiLmdldFBsYXRmb3JtVmVyc2lvbigpKS5zaG91bGQuZXF1YWwocGxhdGZvcm1WZXJzaW9uKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdnZXREZXZpY2VTeXNMYW5ndWFnZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJncycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ2dldHByb3AnLCAncGVyc2lzdC5zeXMubGFuZ3VhZ2UnXSlcbiAgICAgICAgICAucmV0dXJucyhsYW5ndWFnZSk7XG4gICAgICAgIChhd2FpdCBhZGIuZ2V0RGV2aWNlU3lzTGFuZ3VhZ2UoKSkuc2hvdWxkLmVxdWFsKGxhbmd1YWdlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdzZXREZXZpY2VTeXNMYW5ndWFnZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJncycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ3NldHByb3AnLCAncGVyc2lzdC5zeXMubGFuZ3VhZ2UnLCBsYW5ndWFnZV0pXG4gICAgICAgICAgLnJldHVybnMoXCJcIik7XG4gICAgICAgIGF3YWl0IGFkYi5zZXREZXZpY2VTeXNMYW5ndWFnZShsYW5ndWFnZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnZ2V0RGV2aWNlU3lzQ291bnRyeScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJncycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ2dldHByb3AnLCAncGVyc2lzdC5zeXMuY291bnRyeSddKVxuICAgICAgICAgIC5yZXR1cm5zKGNvdW50cnkpO1xuICAgICAgICAoYXdhaXQgYWRiLmdldERldmljZVN5c0NvdW50cnkoKSkuc2hvdWxkLmVxdWFsKGNvdW50cnkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ2dldExvY2F0aW9uUHJvdmlkZXJzJywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIHdpdGggY29ycmVjdCBhcmdzIGFuZCByZXR1cm4gZW1wdHkgbG9jYXRpb25fcHJvdmlkZXJzX2FsbG93ZWQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0U2V0dGluZ1wiKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncygnc2VjdXJlJywgJ2xvY2F0aW9uX3Byb3ZpZGVyc19hbGxvd2VkJylcbiAgICAgICAgICAucmV0dXJucygnJyk7XG4gICAgICAgIGxldCBwcm92aWRlcnMgPSBhd2FpdCBhZGIuZ2V0TG9jYXRpb25Qcm92aWRlcnMoKTtcbiAgICAgICAgcHJvdmlkZXJzLnNob3VsZC5iZS5hbignYXJyYXknKTtcbiAgICAgICAgcHJvdmlkZXJzLmxlbmd0aC5zaG91bGQuZXF1YWwoMCk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgcmV0dXJuIG9uZSBsb2NhdGlvbl9wcm92aWRlcnNfYWxsb3dlZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXRTZXR0aW5nXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKCdzZWN1cmUnLCAnbG9jYXRpb25fcHJvdmlkZXJzX2FsbG93ZWQnKVxuICAgICAgICAgIC5yZXR1cm5zKCdncHMnKTtcbiAgICAgICAgbGV0IHByb3ZpZGVycyA9IGF3YWl0IGFkYi5nZXRMb2NhdGlvblByb3ZpZGVycygpO1xuICAgICAgICBwcm92aWRlcnMuc2hvdWxkLmJlLmFuKCdhcnJheScpO1xuICAgICAgICBwcm92aWRlcnMubGVuZ3RoLnNob3VsZC5lcXVhbCgxKTtcbiAgICAgICAgcHJvdmlkZXJzLnNob3VsZC5pbmNsdWRlKCdncHMnKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCByZXR1cm4gYm90aCBsb2NhdGlvbl9wcm92aWRlcnNfYWxsb3dlZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXRTZXR0aW5nXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKCdzZWN1cmUnLCAnbG9jYXRpb25fcHJvdmlkZXJzX2FsbG93ZWQnKVxuICAgICAgICAgIC5yZXR1cm5zKCdncHMgLHdpZmknKTtcbiAgICAgICAgbGV0IHByb3ZpZGVycyA9IGF3YWl0IGFkYi5nZXRMb2NhdGlvblByb3ZpZGVycygpO1xuICAgICAgICBwcm92aWRlcnMuc2hvdWxkLmJlLmFuKCdhcnJheScpO1xuICAgICAgICBwcm92aWRlcnMubGVuZ3RoLnNob3VsZC5lcXVhbCgyKTtcbiAgICAgICAgcHJvdmlkZXJzLnNob3VsZC5pbmNsdWRlKCdncHMnKTtcbiAgICAgICAgcHJvdmlkZXJzLnNob3VsZC5pbmNsdWRlKCd3aWZpJyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgndG9nZ2xlR1BTTG9jYXRpb25Qcm92aWRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJncyBvbiBncHMgZW5hYmxlZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzZXRTZXR0aW5nXCIpXG4gICAgICAgICAgLndpdGhFeGFjdEFyZ3MoJ3NlY3VyZScsICdsb2NhdGlvbl9wcm92aWRlcnNfYWxsb3dlZCcsICcrZ3BzJyk7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2V0U2V0dGluZ1wiKVxuICAgICAgICAgIC53aXRoRXhhY3RBcmdzKCdzZWN1cmUnLCAnbG9jYXRpb25fcHJvdmlkZXJzX2FsbG93ZWQnLCAnLWdwcycpO1xuICAgICAgICBhd2FpdCBhZGIudG9nZ2xlR1BTTG9jYXRpb25Qcm92aWRlcih0cnVlKTtcbiAgICAgICAgYXdhaXQgYWRiLnRvZ2dsZUdQU0xvY2F0aW9uUHJvdmlkZXIoZmFsc2UpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ3NldERldmljZVN5c0NvdW50cnknLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgd2l0aCBjb3JyZWN0IGFyZ3MnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydzZXRwcm9wJywgJ3BlcnNpc3Quc3lzLmNvdW50cnknLCBjb3VudHJ5XSlcbiAgICAgICAgICAucmV0dXJucyhcIlwiKTtcbiAgICAgICAgYXdhaXQgYWRiLnNldERldmljZVN5c0NvdW50cnkoY291bnRyeSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnZ2V0RGV2aWNlU3lzTG9jYWxlJywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIHdpdGggY29ycmVjdCBhcmdzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnZ2V0cHJvcCcsICdwZXJzaXN0LnN5cy5sb2NhbGUnXSlcbiAgICAgICAgICAucmV0dXJucyhsb2NhbGUpO1xuICAgICAgICAoYXdhaXQgYWRiLmdldERldmljZVN5c0xvY2FsZSgpKS5zaG91bGQuZXF1YWwobG9jYWxlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdzZXREZXZpY2VTeXNMb2NhbGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgd2l0aCBjb3JyZWN0IGFyZ3MnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydzZXRwcm9wJywgJ3BlcnNpc3Quc3lzLmxvY2FsZScsIGxvY2FsZV0pXG4gICAgICAgICAgLnJldHVybnMoXCJcIik7XG4gICAgICAgIGF3YWl0IGFkYi5zZXREZXZpY2VTeXNMb2NhbGUobG9jYWxlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdnZXREZXZpY2VQcm9kdWN0TGFuZ3VhZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgd2l0aCBjb3JyZWN0IGFyZ3MnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydnZXRwcm9wJywgJ3JvLnByb2R1Y3QubG9jYWxlLmxhbmd1YWdlJ10pXG4gICAgICAgICAgLnJldHVybnMobGFuZ3VhZ2UpO1xuICAgICAgICAoYXdhaXQgYWRiLmdldERldmljZVByb2R1Y3RMYW5ndWFnZSgpKS5zaG91bGQuZXF1YWwobGFuZ3VhZ2UpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ2dldERldmljZVByb2R1Y3RDb3VudHJ5JywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIHdpdGggY29ycmVjdCBhcmdzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnZ2V0cHJvcCcsICdyby5wcm9kdWN0LmxvY2FsZS5yZWdpb24nXSlcbiAgICAgICAgICAucmV0dXJucyhjb3VudHJ5KTtcbiAgICAgICAgKGF3YWl0IGFkYi5nZXREZXZpY2VQcm9kdWN0Q291bnRyeSgpKS5zaG91bGQuZXF1YWwoY291bnRyeSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnZ2V0RGV2aWNlUHJvZHVjdExvY2FsZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJncycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ2dldHByb3AnLCAncm8ucHJvZHVjdC5sb2NhbGUnXSlcbiAgICAgICAgICAucmV0dXJucyhsb2NhbGUpO1xuICAgICAgICAoYXdhaXQgYWRiLmdldERldmljZVByb2R1Y3RMb2NhbGUoKSkuc2hvdWxkLmVxdWFsKGxvY2FsZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnc2V0RGV2aWNlUHJvcGVydHknLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2V0cHJvcCB3aXRoIGNvcnJlY3QgYXJncyB3aXRob3V0IHJvb3QnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0QXBpTGV2ZWxcIilcbiAgICAgICAgICAub25jZSgpLnJldHVybnMoMjEpO1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgICAgLndpdGhFeGFjdEFyZ3MoWydzZXRwcm9wJywgJ3BlcnNpc3Quc3lzLmxvY2FsZScsIGxvY2FsZV0pXG4gICAgICAgICAgLnJldHVybnMoXCJcIik7XG4gICAgICAgIGF3YWl0IGFkYi5zZXREZXZpY2VQcm9wZXJ0eSgncGVyc2lzdC5zeXMubG9jYWxlJywgbG9jYWxlKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBjYWxsIHNldHByb3Agd2l0aCBjb3JyZWN0IGFyZ3Mgd2l0aCByb290JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImdldEFwaUxldmVsXCIpXG4gICAgICAgICAgLm9uY2UoKS5yZXR1cm5zKDI2KTtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJyb290XCIpXG4gICAgICAgICAgLm9uY2UoKS5yZXR1cm5zKFwiXCIpO1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgICAgLndpdGhFeGFjdEFyZ3MoWydzZXRwcm9wJywgJ3BlcnNpc3Quc3lzLmxvY2FsZScsIGxvY2FsZV0pXG4gICAgICAgICAgLnJldHVybnMoXCJcIik7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwidW5yb290XCIpXG4gICAgICAgICAgLm9uY2UoKS5yZXR1cm5zKFwiXCIpO1xuICAgICAgICBhd2FpdCBhZGIuc2V0RGV2aWNlUHJvcGVydHkoJ3BlcnNpc3Quc3lzLmxvY2FsZScsIGxvY2FsZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnYXZhaWxhYmxlSU1FcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJncycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEFyZ3MoWydpbWUnLCAnbGlzdCcsICctYSddKVxuICAgICAgICAgIC5yZXR1cm5zKGltZUxpc3QpO1xuICAgICAgICAoYXdhaXQgYWRiLmF2YWlsYWJsZUlNRXMoKSkuc2hvdWxkLmhhdmUubGVuZ3RoLmFib3ZlKDApO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ2VuYWJsZWRJTUVzJywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIHdpdGggY29ycmVjdCBhcmdzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoQXJncyhbJ2ltZScsICdsaXN0J10pXG4gICAgICAgICAgLnJldHVybnMoaW1lTGlzdCk7XG4gICAgICAgIChhd2FpdCBhZGIuZW5hYmxlZElNRXMoKSkuc2hvdWxkLmhhdmUubGVuZ3RoLmFib3ZlKDApO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ2RlZmF1bHRJTUUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgZGVmYXVsdElNRSA9ICdjb20uYW5kcm9pZC5pbnB1dG1ldGhvZC5sYXRpbi8uTGF0aW5JTUUnO1xuICAgICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIHdpdGggY29ycmVjdCBhcmdzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImdldFNldHRpbmdcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoJ3NlY3VyZScsICdkZWZhdWx0X2lucHV0X21ldGhvZCcpXG4gICAgICAgICAgLnJldHVybnMoZGVmYXVsdElNRSk7XG4gICAgICAgIChhd2FpdCBhZGIuZGVmYXVsdElNRSgpKS5zaG91bGQuZXF1YWwoZGVmYXVsdElNRSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnZGlzYWJsZUlNRScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJncycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ2ltZScsICdkaXNhYmxlJywgSU1FXSlcbiAgICAgICAgICAucmV0dXJucyhcIlwiKTtcbiAgICAgICAgYXdhaXQgYWRiLmRpc2FibGVJTUUoSU1FKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdlbmFibGVJTUUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgd2l0aCBjb3JyZWN0IGFyZ3MnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydpbWUnLCAnZW5hYmxlJywgSU1FXSlcbiAgICAgICAgICAucmV0dXJucyhcIlwiKTtcbiAgICAgICAgYXdhaXQgYWRiLmVuYWJsZUlNRShJTUUpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ2tleWV2ZW50JywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIHdpdGggY29ycmVjdCBhcmdzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQga2V5Y29kZSA9ICcyOSc7XG4gICAgICAgIGxldCBjb2RlID0gcGFyc2VJbnQoa2V5Y29kZSwgMTApO1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnaW5wdXQnLCAna2V5ZXZlbnQnLCBjb2RlXSlcbiAgICAgICAgICAucmV0dXJucyhcIlwiKTtcbiAgICAgICAgYXdhaXQgYWRiLmtleWV2ZW50KGtleWNvZGUpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ2lucHV0VGV4dCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJncycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IHRleHQgPSAnc29tZSB0ZXh0IHdpdGggc3BhY2VzJztcbiAgICAgICAgbGV0IGV4cGVjdGVkVGV4dCA9ICdzb21lJXN0ZXh0JXN3aXRoJXNzcGFjZXMnO1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnaW5wdXQnLCAndGV4dCcsIGV4cGVjdGVkVGV4dF0pXG4gICAgICAgICAgLnJldHVybnMoXCJcIik7XG4gICAgICAgIGF3YWl0IGFkYi5pbnB1dFRleHQodGV4dCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnY2xlYXJUZXh0RmllbGQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgd2l0aCBjb3JyZWN0IGFyZ3MnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydpbnB1dCcsICdrZXlldmVudCcsICc2NycsICcxMTInLCAnNjcnLCAnMTEyJywgJzY3JywgJzExMicsICc2NycsICcxMTInXSlcbiAgICAgICAgICAucmV0dXJucyhcIlwiKTtcbiAgICAgICAgYXdhaXQgYWRiLmNsZWFyVGV4dEZpZWxkKDQpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ2xvY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgaXNTY3JlZW5Mb2NrZWQsIGtleWV2ZW50JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImlzU2NyZWVuTG9ja2VkXCIpXG4gICAgICAgICAgLmV4YWN0bHkoMylcbiAgICAgICAgICAub25DYWxsKDApLnJldHVybnMoZmFsc2UpXG4gICAgICAgICAgLm9uQ2FsbCgxKS5yZXR1cm5zKGZhbHNlKVxuICAgICAgICAgIC5vbkNhbGwoMikucmV0dXJucyh0cnVlKTtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJrZXlldmVudFwiKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncygyNilcbiAgICAgICAgICAucmV0dXJucyhcIlwiKTtcbiAgICAgICAgYXdhaXQgYWRiLmxvY2soKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdiYWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3Nob3VsZCBjYWxsIGtleWV2ZW50IHdpdGggY29ycmVjdCBhcmdzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImtleWV2ZW50XCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKDQpXG4gICAgICAgICAgLnJldHVybnMoXCJcIik7XG4gICAgICAgIGF3YWl0IGFkYi5iYWNrKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnZ29Ub0hvbWUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwga2V5ZXZlbnQgd2l0aCBjb3JyZWN0IGFyZ3MnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwia2V5ZXZlbnRcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoMylcbiAgICAgICAgICAucmV0dXJucyhcIlwiKTtcbiAgICAgICAgYXdhaXQgYWRiLmdvVG9Ib21lKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZS5za2lwKCdpc1NjcmVlbkxvY2tlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBrZXlldmVudCB3aXRoIGNvcnJlY3QgYXJncycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJrZXlldmVudFwiKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncygzKVxuICAgICAgICAgIC5yZXR1cm5zKFwiXCIpO1xuICAgICAgICBhd2FpdCBhZGIuZ29Ub0hvbWUoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdpc1NvZnRLZXlib2FyZFByZXNlbnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgd2l0aCBjb3JyZWN0IGFyZ3MgYW5kIHNob3VsZCByZXR1cm4gZmFsc2UnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydkdW1wc3lzJywgJ2lucHV0X21ldGhvZCddKVxuICAgICAgICAgIC5yZXR1cm5zKFwibUlucHV0U2hvd249ZmFsc2VcIik7XG4gICAgICAgIGxldCB7aXNLZXlib2FyZFNob3duLCBjYW5DbG9zZUtleWJvYXJkfSA9IGF3YWl0IGFkYi5pc1NvZnRLZXlib2FyZFByZXNlbnQoKTtcbiAgICAgICAgY2FuQ2xvc2VLZXlib2FyZC5zaG91bGQuYmUuZmFsc2U7XG4gICAgICAgIGlzS2V5Ym9hcmRTaG93bi5zaG91bGQuYmUuZmFsc2U7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJncyBhbmQgc2hvdWxkIHJldHVybiB0cnVlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnZHVtcHN5cycsICdpbnB1dF9tZXRob2QnXSlcbiAgICAgICAgICAucmV0dXJucyhcIm1JbnB1dFNob3duPXRydWUgbUlzSW5wdXRWaWV3U2hvd249dHJ1ZVwiKTtcbiAgICAgICAgbGV0IHtpc0tleWJvYXJkU2hvd24sIGNhbkNsb3NlS2V5Ym9hcmR9ID0gYXdhaXQgYWRiLmlzU29mdEtleWJvYXJkUHJlc2VudCgpO1xuICAgICAgICBpc0tleWJvYXJkU2hvd24uc2hvdWxkLmJlLnRydWU7XG4gICAgICAgIGNhbkNsb3NlS2V5Ym9hcmQuc2hvdWxkLmJlLnRydWU7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnaXNBaXJwbGFuZU1vZGVPbicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJncyBhbmQgc2hvdWxkIGJlIHRydWUnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0U2V0dGluZ1wiKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncygnZ2xvYmFsJywgJ2FpcnBsYW5lX21vZGVfb24nKVxuICAgICAgICAgIC5yZXR1cm5zKFwiMVwiKTtcbiAgICAgICAgKGF3YWl0IGFkYi5pc0FpcnBsYW5lTW9kZU9uKCkpLnNob3VsZC5iZS50cnVlO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgd2l0aCBjb3JyZWN0IGFyZ3MgYW5kIHNob3VsZCBiZSBmYWxzZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXRTZXR0aW5nXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKCdnbG9iYWwnLCAnYWlycGxhbmVfbW9kZV9vbicpXG4gICAgICAgICAgLnJldHVybnMoXCIwXCIpO1xuICAgICAgICAoYXdhaXQgYWRiLmlzQWlycGxhbmVNb2RlT24oKSkuc2hvdWxkLmJlLmZhbHNlO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ3NldEFpcnBsYW5lTW9kZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJncycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzZXRTZXR0aW5nXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKCdnbG9iYWwnLCAnYWlycGxhbmVfbW9kZV9vbicsIDEpXG4gICAgICAgICAgLnJldHVybnMoXCJcIik7XG4gICAgICAgIGF3YWl0IGFkYi5zZXRBaXJwbGFuZU1vZGUoMSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnYnJvYWRjYXN0QWlycGxhbmVNb2RlJywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIHdpdGggY29ycmVjdCBhcmdzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnYW0nLCAnYnJvYWRjYXN0JywgJy1hJywgJ2FuZHJvaWQuaW50ZW50LmFjdGlvbi5BSVJQTEFORV9NT0RFJywgJy0tZXonLCAnc3RhdGUnLCAndHJ1ZSddKVxuICAgICAgICAgIC5yZXR1cm5zKFwiXCIpO1xuICAgICAgICBhd2FpdCBhZGIuYnJvYWRjYXN0QWlycGxhbmVNb2RlKHRydWUpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ2lzV2lmaU9uJywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIHdpdGggY29ycmVjdCBhcmdzIGFuZCBzaG91bGQgYmUgdHJ1ZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXRTZXR0aW5nXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKCdnbG9iYWwnLCAnd2lmaV9vbicpXG4gICAgICAgICAgLnJldHVybnMoXCIxXCIpO1xuICAgICAgICAoYXdhaXQgYWRiLmlzV2lmaU9uKCkpLnNob3VsZC5iZS50cnVlO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgd2l0aCBjb3JyZWN0IGFyZ3MgYW5kIHNob3VsZCBiZSBmYWxzZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXRTZXR0aW5nXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKCdnbG9iYWwnLCAnd2lmaV9vbicpXG4gICAgICAgICAgLnJldHVybnMoXCIwXCIpO1xuICAgICAgICAoYXdhaXQgYWRiLmlzV2lmaU9uKCkpLnNob3VsZC5iZS5mYWxzZTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdzZXRXaWZpU3RhdGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgd2l0aCBjb3JyZWN0IGFyZ3MgZm9yIHJlYWwgZGV2aWNlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnYW0nLCAnYnJvYWRjYXN0JywgJy1hJywgJ2lvLmFwcGl1bS5zZXR0aW5ncy53aWZpJyxcbiAgICAgICAgICAgICctbicsICdpby5hcHBpdW0uc2V0dGluZ3MvLnJlY2VpdmVycy5XaUZpQ29ubmVjdGlvblNldHRpbmdSZWNlaXZlcicsXG4gICAgICAgICAgICAnLS1lcycsICdzZXRzdGF0dXMnLCAnZW5hYmxlJ10pXG4gICAgICAgICAgLnJldHVybnMoXCJcIik7XG4gICAgICAgIGF3YWl0IGFkYi5zZXRXaWZpU3RhdGUodHJ1ZSk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJncyBmb3IgZW11bGF0b3InLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwicm9vdFwiKVxuICAgICAgICAgIC5vbmNlKClcbiAgICAgICAgICAucmV0dXJucyh0cnVlKTtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ3N2YycsICd3aWZpJywgJ2Rpc2FibGUnXSlcbiAgICAgICAgICAucmV0dXJucyhcIlwiKTtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJ1bnJvb3RcIilcbiAgICAgICAgICAub25jZSgpO1xuICAgICAgICBhd2FpdCBhZGIuc2V0V2lmaVN0YXRlKGZhbHNlLCB0cnVlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdpc0RhdGFPbicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJncyBhbmQgc2hvdWxkIGJlIHRydWUnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0U2V0dGluZ1wiKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncygnZ2xvYmFsJywgJ21vYmlsZV9kYXRhJylcbiAgICAgICAgICAucmV0dXJucyhcIjFcIik7XG4gICAgICAgIChhd2FpdCBhZGIuaXNEYXRhT24oKSkuc2hvdWxkLmJlLnRydWU7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJncyBhbmQgc2hvdWxkIGJlIGZhbHNlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImdldFNldHRpbmdcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoJ2dsb2JhbCcsICdtb2JpbGVfZGF0YScpXG4gICAgICAgICAgLnJldHVybnMoXCIwXCIpO1xuICAgICAgICAoYXdhaXQgYWRiLmlzRGF0YU9uKCkpLnNob3VsZC5iZS5mYWxzZTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdzZXREYXRhU3RhdGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgd2l0aCBjb3JyZWN0IGFyZ3MgZm9yIHJlYWwgZGV2aWNlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnYW0nLCAnYnJvYWRjYXN0JywgJy1hJywgJ2lvLmFwcGl1bS5zZXR0aW5ncy5kYXRhX2Nvbm5lY3Rpb24nLFxuICAgICAgICAgICAgJy1uJywgJ2lvLmFwcGl1bS5zZXR0aW5ncy8ucmVjZWl2ZXJzLkRhdGFDb25uZWN0aW9uU2V0dGluZ1JlY2VpdmVyJyxcbiAgICAgICAgICAgICctLWVzJywgJ3NldHN0YXR1cycsICdkaXNhYmxlJ10pXG4gICAgICAgICAgLnJldHVybnMoXCJcIik7XG4gICAgICAgIGF3YWl0IGFkYi5zZXREYXRhU3RhdGUoZmFsc2UpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgd2l0aCBjb3JyZWN0IGFyZ3MgZm9yIGVtdWxhdG9yJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInJvb3RcIilcbiAgICAgICAgICAub25jZSgpXG4gICAgICAgICAgLnJldHVybnModHJ1ZSk7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydzdmMnLCAnZGF0YScsICdlbmFibGUnXSlcbiAgICAgICAgICAucmV0dXJucyhcIlwiKTtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJ1bnJvb3RcIilcbiAgICAgICAgICAub25jZSgpO1xuICAgICAgICBhd2FpdCBhZGIuc2V0RGF0YVN0YXRlKHRydWUsIHRydWUpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ3NldFdpZmlBbmREYXRhJywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIHdpdGggY29ycmVjdCBhcmdzIHdoZW4gdHVybmluZyBvbmx5IHdpZmkgb24gZm9yIHJlYWwgZGV2aWNlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnYW0nLCAnYnJvYWRjYXN0JywgJy1hJywgJ2lvLmFwcGl1bS5zZXR0aW5ncy53aWZpJyxcbiAgICAgICAgICAgICctbicsICdpby5hcHBpdW0uc2V0dGluZ3MvLnJlY2VpdmVycy5XaUZpQ29ubmVjdGlvblNldHRpbmdSZWNlaXZlcicsXG4gICAgICAgICAgICAnLS1lcycsICdzZXRzdGF0dXMnLCAnZW5hYmxlJ10pXG4gICAgICAgICAgLnJldHVybnMoXCJcIik7XG4gICAgICAgIGF3YWl0IGFkYi5zZXRXaWZpQW5kRGF0YSh7d2lmaTogdHJ1ZX0pO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgd2l0aCBjb3JyZWN0IGFyZ3Mgd2hlbiB0dXJuaW5nIG9ubHkgd2lmaSBvZmYgZm9yIGVtdWxhdG9yJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInJvb3RcIilcbiAgICAgICAgICAub25jZSgpXG4gICAgICAgICAgLnJldHVybnModHJ1ZSk7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydzdmMnLCAnd2lmaScsICdkaXNhYmxlJ10pXG4gICAgICAgICAgLnJldHVybnMoXCJcIik7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwidW5yb290XCIpXG4gICAgICAgICAgLm9uY2UoKTtcbiAgICAgICAgYXdhaXQgYWRiLnNldFdpZmlBbmREYXRhKHt3aWZpOiBmYWxzZX0sIHRydWUpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgd2l0aCBjb3JyZWN0IGFyZ3Mgd2hlbiB0dXJuaW5nIG9ubHkgZGF0YSBvbiBmb3IgZW11bGF0b3InLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwicm9vdFwiKVxuICAgICAgICAgIC5vbmNlKClcbiAgICAgICAgICAucmV0dXJucyh0cnVlKTtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ3N2YycsICdkYXRhJywgJ2VuYWJsZSddKVxuICAgICAgICAgIC5yZXR1cm5zKFwiXCIpO1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInVucm9vdFwiKVxuICAgICAgICAgIC5vbmNlKCk7XG4gICAgICAgIGF3YWl0IGFkYi5zZXRXaWZpQW5kRGF0YSh7ZGF0YTogdHJ1ZX0sIHRydWUpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgd2l0aCBjb3JyZWN0IGFyZ3Mgd2hlbiB0dXJuaW5nIG9ubHkgZGF0YSBvZmYgZm9yIHJlYWwgZGV2aWNlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnYW0nLCAnYnJvYWRjYXN0JywgJy1hJywgJ2lvLmFwcGl1bS5zZXR0aW5ncy5kYXRhX2Nvbm5lY3Rpb24nLFxuICAgICAgICAgICAgJy1uJywgJ2lvLmFwcGl1bS5zZXR0aW5ncy8ucmVjZWl2ZXJzLkRhdGFDb25uZWN0aW9uU2V0dGluZ1JlY2VpdmVyJyxcbiAgICAgICAgICAgICctLWVzJywgJ3NldHN0YXR1cycsICdkaXNhYmxlJ10pXG4gICAgICAgICAgLnJldHVybnMoXCJcIik7XG4gICAgICAgIGF3YWl0IGFkYi5zZXRXaWZpQW5kRGF0YSh7ZGF0YTogZmFsc2V9KTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIHdpdGggY29ycmVjdCBhcmdzIHdoZW4gdHVybmluZyBib3RoIHdpZmkgYW5kIGRhdGEgb24gZm9yIHJlYWwgZGV2aWNlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpLnR3aWNlKCkucmV0dXJucyhcIlwiKTtcbiAgICAgICAgYXdhaXQgYWRiLnNldFdpZmlBbmREYXRhKHt3aWZpOiB0cnVlLCBkYXRhOiB0cnVlfSk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJncyB3aGVuIHR1cm5pbmcgYm90aCB3aWZpIGFuZCBkYXRhIG9mZiBmb3IgZW11bGF0b3InLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwicm9vdFwiKVxuICAgICAgICAgIC5hdExlYXN0KDEpXG4gICAgICAgICAgLnJldHVybnModHJ1ZSk7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIikudHdpY2UoKS5yZXR1cm5zKFwiXCIpO1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInVucm9vdFwiKVxuICAgICAgICAgIC5hdExlYXN0KDEpO1xuICAgICAgICBhd2FpdCBhZGIuc2V0V2lmaUFuZERhdGEoe3dpZmk6IGZhbHNlLCBkYXRhOiBmYWxzZX0sIHRydWUpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ3NldEFuaW1hdGlvblN0YXRlJywgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgYWRiQXJncyA9IFtcbiAgICAgICAgJ2FtJywgJ2Jyb2FkY2FzdCcsICctYScsICdpby5hcHBpdW0uc2V0dGluZ3MuYW5pbWF0aW9uJyxcbiAgICAgICAgJy1uJywgJ2lvLmFwcGl1bS5zZXR0aW5ncy8ucmVjZWl2ZXJzLkFuaW1hdGlvblNldHRpbmdSZWNlaXZlcicsXG4gICAgICAgICctLWVzJywgJ3NldHN0YXR1cydcbiAgICAgIF07XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgd2l0aCBjb3JyZWN0IGFyZ3MgdG8gZW5hYmxlIGFuaW1hdGlvbicsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKS5vbmNlKCkud2l0aEV4YWN0QXJncyhhZGJBcmdzLmNvbmNhdCgnZW5hYmxlJykpO1xuICAgICAgICBhd2FpdCBhZGIuc2V0QW5pbWF0aW9uU3RhdGUodHJ1ZSk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJncyB0byBkaXNhYmxlIGFuaW1hdGlvbicsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKS5vbmNlKCkud2l0aEV4YWN0QXJncyhhZGJBcmdzLmNvbmNhdCgnZGlzYWJsZScpKTtcbiAgICAgICAgYXdhaXQgYWRiLnNldEFuaW1hdGlvblN0YXRlKGZhbHNlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdpc0FuaW1hdGlvbk9uJywgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgbW9ja1NldHRpbmcgPSBmdW5jdGlvbiAoZHVyYXRpb25fc2NhbGUsIHRyYW5zaXRpb25fc2NhbGUsIHdpbmRvd19zY2FsZSkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImdldFNldHRpbmdcIikub25jZSgpLndpdGhFeGFjdEFyZ3MoJ2dsb2JhbCcsICdhbmltYXRvcl9kdXJhdGlvbl9zY2FsZScpXG4gICAgICAgICAgLnJldHVybnMoZHVyYXRpb25fc2NhbGUpO1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImdldFNldHRpbmdcIikub25jZSgpLndpdGhFeGFjdEFyZ3MoJ2dsb2JhbCcsICd0cmFuc2l0aW9uX2FuaW1hdGlvbl9zY2FsZScpXG4gICAgICAgICAgLnJldHVybnModHJhbnNpdGlvbl9zY2FsZSk7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0U2V0dGluZ1wiKS5vbmNlKCkud2l0aEV4YWN0QXJncygnZ2xvYmFsJywgJ3dpbmRvd19hbmltYXRpb25fc2NhbGUnKVxuICAgICAgICAgIC5yZXR1cm5zKHdpbmRvd19zY2FsZSk7XG4gICAgICB9O1xuICAgICAgaXQoJ3Nob3VsZCByZXR1cm4gZmFsc2UgaWYgYWxsIGFuaW1hdGlvbiBzZXR0aW5ncyBhcmUgZXF1YWwgdG8gemVybycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja1NldHRpbmcoXCIwLjBcIiwgXCIwLjBcIiwgXCIwLjBcIik7XG4gICAgICAgIChhd2FpdCBhZGIuaXNBbmltYXRpb25PbigpKS5zaG91bGQuYmUuZmFsc2U7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgcmV0dXJuIHRydWUgaWYgYW5pbWF0b3JfZHVyYXRpb25fc2NhbGUgc2V0dGluZyBpcyBOT1QgZXF1YWwgdG8gemVybycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja1NldHRpbmcoXCIwLjVcIiwgXCIwLjBcIiwgXCIwLjBcIik7XG4gICAgICAgIChhd2FpdCBhZGIuaXNBbmltYXRpb25PbigpKS5zaG91bGQuYmUudHJ1ZTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCByZXR1cm4gdHJ1ZSBpZiB0cmFuc2l0aW9uX2FuaW1hdGlvbl9zY2FsZSBzZXR0aW5nIGlzIE5PVCBlcXVhbCB0byB6ZXJvJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2NrU2V0dGluZyhcIjAuMFwiLCBcIjAuNVwiLCBcIjAuMFwiKTtcbiAgICAgICAgKGF3YWl0IGFkYi5pc0FuaW1hdGlvbk9uKCkpLnNob3VsZC5iZS50cnVlO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIHJldHVybiB0cnVlIGlmIHdpbmRvd19hbmltYXRpb25fc2NhbGUgc2V0dGluZyBpcyBOT1QgZXF1YWwgdG8gemVybycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja1NldHRpbmcoXCIwLjBcIiwgXCIwLjBcIiwgXCIwLjVcIik7XG4gICAgICAgIChhd2FpdCBhZGIuaXNBbmltYXRpb25PbigpKS5zaG91bGQuYmUudHJ1ZTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdzZXREZXZpY2VTeXNMb2NhbGVWaWFTZXR0aW5nQXBwJywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIHdpdGggbG9jYWxlIHNldHRpbmdzIHdpdGhvdXQgc2NyaXB0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBhZGJBcmdzID0gWydhbScsICdicm9hZGNhc3QnLCAnLWEnLCAnaW8uYXBwaXVtLnNldHRpbmdzLmxvY2FsZScsXG4gICAgICAgICAgJy1uJywgJ2lvLmFwcGl1bS5zZXR0aW5ncy8ucmVjZWl2ZXJzLkxvY2FsZVNldHRpbmdSZWNlaXZlcicsXG4gICAgICAgICAgJy0tZXMnLCAnbGFuZycsICdlbicsICctLWVzJywgJ2NvdW50cnknLCAnVVMnXTtcblxuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpLm9uY2UoKS53aXRoRXhhY3RBcmdzKGFkYkFyZ3MpO1xuICAgICAgICBhd2FpdCBhZGIuc2V0RGV2aWNlU3lzTG9jYWxlVmlhU2V0dGluZ0FwcCgnZW4nLCAnVVMnKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgd2l0aCBsb2NhbGUgc2V0dGluZ3Mgd2l0aCBzY3JpcHQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IGFkYkFyZ3MgPSBbJ2FtJywgJ2Jyb2FkY2FzdCcsICctYScsICdpby5hcHBpdW0uc2V0dGluZ3MubG9jYWxlJyxcbiAgICAgICAgICAnLW4nLCAnaW8uYXBwaXVtLnNldHRpbmdzLy5yZWNlaXZlcnMuTG9jYWxlU2V0dGluZ1JlY2VpdmVyJyxcbiAgICAgICAgICAnLS1lcycsICdsYW5nJywgJ3poJywgJy0tZXMnLCAnY291bnRyeScsICdDTicsICctLWVzJywgJ3NjcmlwdCcsICdIYW5zJ107XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIikub25jZSgpLndpdGhFeGFjdEFyZ3MoYWRiQXJncyk7XG4gICAgICAgIGF3YWl0IGFkYi5zZXREZXZpY2VTeXNMb2NhbGVWaWFTZXR0aW5nQXBwKCd6aCcsICdDTicsICdIYW5zJyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnc2V0R2VvTG9jYXRpb24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBsb2NhdGlvbiA9IHtcbiAgICAgICAgbG9uZ2l0dWRlOiAnNTAuNScsXG4gICAgICAgIGxhdGl0dWRlOiAnNTAuMSdcbiAgICAgIH07XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgd2l0aCBjb3JyZWN0IGFyZ3MgZm9yIHJlYWwgZGV2aWNlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFtcbiAgICAgICAgICAgICdhbScsICdzdGFydHNlcnZpY2UnLFxuICAgICAgICAgICAgJy1lJywgJ2xvbmdpdHVkZScsIGxvY2F0aW9uLmxvbmdpdHVkZSxcbiAgICAgICAgICAgICctZScsICdsYXRpdHVkZScsIGxvY2F0aW9uLmxhdGl0dWRlLFxuICAgICAgICAgICAgYGlvLmFwcGl1bS5zZXR0aW5ncy8uTG9jYXRpb25TZXJ2aWNlYFxuICAgICAgICAgIF0pXG4gICAgICAgICAgLnJldHVybnMoXCJcIik7XG4gICAgICAgIGF3YWl0IGFkYi5zZXRHZW9Mb2NhdGlvbihsb2NhdGlvbik7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBhZGIgd2l0aCBjb3JyZWN0IGFyZ3MgZm9yIGVtdWxhdG9yJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInJlc2V0VGVsbmV0QXV0aFRva2VuXCIpXG4gICAgICAgICAgLm9uY2UoKS5yZXR1cm5zKHRydWUpO1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImFkYkV4ZWNcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydlbXUnLCAnZ2VvJywgJ2ZpeCcsIGxvY2F0aW9uLmxvbmdpdHVkZSwgbG9jYXRpb24ubGF0aXR1ZGVdKVxuICAgICAgICAgIC5yZXR1cm5zKFwiXCIpO1xuICAgICAgICAvLyBBIHdvcmthcm91bmQgZm9yIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvYW5kcm9pZC9pc3N1ZXMvZGV0YWlsP2lkPTIwNjE4MFxuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImFkYkV4ZWNcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydlbXUnLCAnZ2VvJywgJ2ZpeCcsIGxvY2F0aW9uLmxvbmdpdHVkZS5yZXBsYWNlKCcuJywgJywnKSwgbG9jYXRpb24ubGF0aXR1ZGUucmVwbGFjZSgnLicsICcsJyldKVxuICAgICAgICAgIC5yZXR1cm5zKFwiXCIpO1xuICAgICAgICBhd2FpdCBhZGIuc2V0R2VvTG9jYXRpb24obG9jYXRpb24sIHRydWUpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ3Byb2Nlc3NFeGlzdHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgd2l0aCBjb3JyZWN0IGFyZ3MgYW5kIHNob3VsZCBmaW5kIHByb2Nlc3MnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoXCJwc1wiKVxuICAgICAgICAgIC5yZXR1cm5zKHBzT3V0cHV0KTtcbiAgICAgICAgKGF3YWl0IGFkYi5wcm9jZXNzRXhpc3RzKGNvbnRhY3RNYW5hZ2VyUGFja2FnZSkpLnNob3VsZC5iZS50cnVlO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgd2l0aCBjb3JyZWN0IGFyZ3MgYW5kIHNob3VsZCBub3QgZmluZCBwcm9jZXNzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFwicHNcIilcbiAgICAgICAgICAucmV0dXJucyhcImZvb1wiKTtcbiAgICAgICAgKGF3YWl0IGFkYi5wcm9jZXNzRXhpc3RzKGNvbnRhY3RNYW5hZ2VyUGFja2FnZSkpLnNob3VsZC5iZS5mYWxzZTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdmb3J3YXJkUG9ydCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IHN5c1BvcnQgPSAxMjM0NSxcbiAgICAgICAgICAgIGRldmljZVBvcnQgPSA1NDMyMTtcbiAgICAgIGl0KCdmb3J3YXJkUG9ydCBzaG91bGQgY2FsbCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJncycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJhZGJFeGVjXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnZm9yd2FyZCcsIGB0Y3A6JHtzeXNQb3J0fWAsIGB0Y3A6JHtkZXZpY2VQb3J0fWBdKVxuICAgICAgICAgIC5yZXR1cm5zKFwiXCIpO1xuICAgICAgICBhd2FpdCBhZGIuZm9yd2FyZFBvcnQoc3lzUG9ydCwgZGV2aWNlUG9ydCk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdmb3J3YXJkQWJzdHJhY3RQb3J0IHNob3VsZCBjYWxsIHNoZWxsIHdpdGggY29ycmVjdCBhcmdzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImFkYkV4ZWNcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydmb3J3YXJkJywgYHRjcDoke3N5c1BvcnR9YCwgYGxvY2FsYWJzdHJhY3Q6JHtkZXZpY2VQb3J0fWBdKVxuICAgICAgICAgIC5yZXR1cm5zKFwiXCIpO1xuICAgICAgICBhd2FpdCBhZGIuZm9yd2FyZEFic3RyYWN0UG9ydChzeXNQb3J0LCBkZXZpY2VQb3J0KTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3JlbW92ZVBvcnRGb3J3YXJkIHNob3VsZCBjYWxsIHNoZWxsIHdpdGggY29ycmVjdCBhcmdzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImFkYkV4ZWNcIilcbiAgICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ2ZvcndhcmQnLCBgLS1yZW1vdmVgLCBgdGNwOiR7c3lzUG9ydH1gXSlcbiAgICAgICAgICAgIC5yZXR1cm5zKFwiXCIpO1xuICAgICAgICBhd2FpdCBhZGIucmVtb3ZlUG9ydEZvcndhcmQoc3lzUG9ydCwgZGV2aWNlUG9ydCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgncGluZycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJncyBhbmQgc2hvdWxkIHJldHVybiB0cnVlJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFtcImVjaG9cIiwgXCJwaW5nXCJdKVxuICAgICAgICAgIC5yZXR1cm5zKFwicGluZ1wiKTtcbiAgICAgICAgKGF3YWl0IGFkYi5waW5nKCkpLnNob3VsZC5iZS50cnVlO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ3Jlc3RhcnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgYWRiIGluIGNvcnJlY3Qgb3JkZXInLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic3RvcExvZ2NhdFwiKS5vbmNlKCkucmV0dXJucyhcIlwiKTtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJyZXN0YXJ0QWRiXCIpLm9uY2UoKS5yZXR1cm5zKFwiXCIpO1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcIndhaXRGb3JEZXZpY2VcIikub25jZSgpLnJldHVybnMoXCJcIik7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic3RhcnRMb2djYXRcIikub25jZSgpLnJldHVybnMoXCJcIik7XG4gICAgICAgIGF3YWl0IGFkYi5yZXN0YXJ0KCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnc3RvcExvZ2NhdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBzdG9wQ2FwdHVyZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYWRiLmxvZ2NhdCA9IGxvZ2NhdDtcbiAgICAgICAgbW9ja3MubG9nY2F0LmV4cGVjdHMoXCJzdG9wQ2FwdHVyZVwiKS5vbmNlKCkucmV0dXJucyhcIlwiKTtcbiAgICAgICAgYXdhaXQgYWRiLnN0b3BMb2djYXQoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdnZXRMb2djYXRMb2dzJywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3Nob3VsZCBjYWxsIGdldExvZ3MnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGFkYi5sb2djYXQgPSBsb2djYXQ7XG4gICAgICAgIG1vY2tzLmxvZ2NhdC5leHBlY3RzKFwiZ2V0TG9nc1wiKS5vbmNlKCkucmV0dXJucyhcIlwiKTtcbiAgICAgICAgYXdhaXQgYWRiLmdldExvZ2NhdExvZ3MoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdnZXRQSURzQnlOYW1lJywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIGFuZCBwYXJzZSBwaWRzIGNvcnJlY3RseScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ3BzJ10pXG4gICAgICAgICAgLnJldHVybnMocHNPdXRwdXQpO1xuICAgICAgICAoYXdhaXQgYWRiLmdldFBJRHNCeU5hbWUoY29udGFjdE1hbmFnZXJQYWNrYWdlKSlbMF0uc2hvdWxkLmVxdWFsKDUwNzgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ2tpbGxQcm9jZXNzZXNCeU5hbWUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgZ2V0UElEc0J5TmFtZSBhbmQga2lsbCBwcm9jZXNzIGNvcnJlY3RseScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJnZXRQSURzQnlOYW1lXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKGNvbnRhY3RNYW5hZ2VyUGFja2FnZSlcbiAgICAgICAgICAucmV0dXJucyhbNTA3OF0pO1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImtpbGxQcm9jZXNzQnlQSURcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoNTA3OClcbiAgICAgICAgICAucmV0dXJucyhcIlwiKTtcbiAgICAgICAgYXdhaXQgYWRiLmtpbGxQcm9jZXNzZXNCeU5hbWUoY29udGFjdE1hbmFnZXJQYWNrYWdlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdraWxsUHJvY2Vzc0J5UElEJywgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgcGlkID0gNTA3ODtcblxuICAgICAgaXQoJ3Nob3VsZCBjYWxsIGtpbGwgcHJvY2VzcyBjb3JyZWN0bHknLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydraWxsJywgJy0wJywgcGlkXSlcbiAgICAgICAgICAucmV0dXJucygnJyk7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgICAud2l0aEV4YWN0QXJncyhbJ2tpbGwnLCBwaWRdKVxuICAgICAgICAgIC50d2ljZSgpXG4gICAgICAgICAgLm9uQ2FsbCgwKVxuICAgICAgICAgIC5yZXR1cm5zKCcnKVxuICAgICAgICAgIC5vbkNhbGwoMSlcbiAgICAgICAgICAudGhyb3dzKCk7XG4gICAgICAgIGF3YWl0IGFkYi5raWxsUHJvY2Vzc0J5UElEKHBpZCk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBmb3JjZSBraWxsIHByb2Nlc3MgaWYgbm9ybWFsIGtpbGwgZmFpbHMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydraWxsJywgJy0wJywgcGlkXSlcbiAgICAgICAgICAucmV0dXJucygnJyk7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgICAuYXRMZWFzdCgyKS53aXRoRXhhY3RBcmdzKFsna2lsbCcsIHBpZF0pXG4gICAgICAgICAgLnJldHVybnMoJycpO1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsna2lsbCcsICctOScsIHBpZF0pXG4gICAgICAgICAgLnJldHVybnMoJycpO1xuICAgICAgICBhd2FpdCBhZGIua2lsbFByb2Nlc3NCeVBJRChwaWQpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgdGhyb3cgYW4gZXJyb3IgaWYgYSBwcm9jZXNzIHdpdGggZ2l2ZW4gSUQgZG9lcyBub3QgZXhpc3QnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWyd3aG9hbWknXSlcbiAgICAgICAgICAucmV0dXJucygncm9vdCcpO1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInJvb3RcIilcbiAgICAgICAgICAubmV2ZXIoKTtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJ1bnJvb3RcIilcbiAgICAgICAgICAubmV2ZXIoKTtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ2tpbGwnLCAnLTAnLCBwaWRdKVxuICAgICAgICAgIC50aHJvd3MoKTtcbiAgICAgICAgYXdhaXQgYWRiLmtpbGxQcm9jZXNzQnlQSUQocGlkKS5zaG91bGQuZXZlbnR1YWxseS5iZS5yZWplY3RlZDtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdicm9hZGNhc3RQcm9jZXNzRW5kJywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3Nob3VsZCBicm9hZGNhc3QgcHJvY2VzcyBlbmQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBpbnRlbnQgPSAnaW50ZW50JyxcbiAgICAgICAgICAgIHByb2Nlc3NOYW1lID0gJ3Byb2Nlc3NOYW1lJztcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ2FtJywgJ2Jyb2FkY2FzdCcsICctYScsIGludGVudF0pXG4gICAgICAgICAgLnJldHVybnMoXCJcIik7XG4gICAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwicHJvY2Vzc0V4aXN0c1wiKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhwcm9jZXNzTmFtZSlcbiAgICAgICAgICAucmV0dXJucyhmYWxzZSk7XG4gICAgICAgIGF3YWl0IGFkYi5icm9hZGNhc3RQcm9jZXNzRW5kKGludGVudCwgcHJvY2Vzc05hbWUpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ2Jyb2FkY2FzdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgYnJvYWRjYXN0IGludGVudCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IGludGVudCA9ICdpbnRlbnQnO1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnYW0nLCAnYnJvYWRjYXN0JywgJy1hJywgaW50ZW50XSlcbiAgICAgICAgICAucmV0dXJucyhcIlwiKTtcbiAgICAgICAgYXdhaXQgYWRiLmJyb2FkY2FzdChpbnRlbnQpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ2luc3RydW1lbnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIGNhbGwgc2hlbGwgd2l0aCBjb3JyZWN0IGFyZ3VtZW50cycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IGludGVudCA9ICdpbnRlbnQnO1xuICAgICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnYW0nLCAnYnJvYWRjYXN0JywgJy1hJywgaW50ZW50XSlcbiAgICAgICAgICAucmV0dXJucyhcIlwiKTtcbiAgICAgICAgYXdhaXQgYWRiLmJyb2FkY2FzdChpbnRlbnQpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ2FuZHJvaWRDb3ZlcmFnZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBzaGVsbCB3aXRoIGNvcnJlY3QgYXJndW1lbnRzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBhZGIuZXhlY3V0YWJsZS5kZWZhdWx0QXJncyA9IFtdO1xuICAgICAgICBhZGIuZXhlY3V0YWJsZS5wYXRoID0gXCJkdW1teV9hZGJfcGF0aFwiO1xuICAgICAgICBsZXQgY29ubiA9IG5ldyBldmVudHMuRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIGNvbm4uc3RhcnQgPSAoKSA9PiB7IH07IC8vIGRvIG5vdGhpbmdcbiAgICAgICAgY29uc3QgaW5zdHJ1bWVudENsYXNzID0gJ2luc3RydW1lbnRDbGFzcycsXG4gICAgICAgICAgICAgIHdhaXRQa2cgPSAnd2FpdFBrZycsXG4gICAgICAgICAgICAgIHdhaXRBY3Rpdml0eSA9ICd3YWl0QWN0aXZpdHknO1xuICAgICAgICBsZXQgYXJncyA9IGFkYi5leGVjdXRhYmxlLmRlZmF1bHRBcmdzXG4gICAgICAgICAgLmNvbmNhdChbJ3NoZWxsJywgJ2FtJywgJ2luc3RydW1lbnQnLCAnLWUnLCAnY292ZXJhZ2UnLCAndHJ1ZScsICctdyddKVxuICAgICAgICAgIC5jb25jYXQoW2luc3RydW1lbnRDbGFzc10pO1xuICAgICAgICBtb2Nrcy50ZWVuX3Byb2Nlc3MuZXhwZWN0cyhcIlN1YlByb2Nlc3NcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoJ2R1bW15X2FkYl9wYXRoJywgYXJncylcbiAgICAgICAgICAucmV0dXJucyhjb25uKTtcbiAgICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJ3YWl0Rm9yQWN0aXZpdHlcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3Mod2FpdFBrZywgd2FpdEFjdGl2aXR5KVxuICAgICAgICAgIC5yZXR1cm5zKFwiXCIpO1xuICAgICAgICBhd2FpdCBhZGIuYW5kcm9pZENvdmVyYWdlKGluc3RydW1lbnRDbGFzcywgd2FpdFBrZywgd2FpdEFjdGl2aXR5KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbiAgZGVzY3JpYmUoJ2RldmljZSBpbmZvJywgZnVuY3Rpb24gKCkge1xuICAgIGl0KCdzaG91bGQgZ2V0IGRldmljZSBtb2RlbCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWydnZXRwcm9wJywgJ3JvLnByb2R1Y3QubW9kZWwnXSlcbiAgICAgICAgICAucmV0dXJucyhtb2RlbCk7XG4gICAgICBhd2FpdCBhZGIuZ2V0TW9kZWwoKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIGdldCBkZXZpY2UgbWFudWZhY3R1cmVyJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhbJ2dldHByb3AnLCAncm8ucHJvZHVjdC5tYW51ZmFjdHVyZXInXSlcbiAgICAgICAgICAucmV0dXJucyhtYW51ZmFjdHVyZXIpO1xuICAgICAgYXdhaXQgYWRiLmdldE1hbnVmYWN0dXJlcigpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgZ2V0IGRldmljZSBzY3JlZW4gc2l6ZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWyd3bScsICdzaXplJ10pXG4gICAgICAgICAgLnJldHVybnMoc2NyZWVuU2l6ZSk7XG4gICAgICBhd2FpdCBhZGIuZ2V0U2NyZWVuU2l6ZSgpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgZ2V0IGRldmljZSBzY3JlZW4gZGVuc2l0eScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoWyd3bScsICdkZW5zaXR5J10pXG4gICAgICAgICAgLnJldHVybnMoXCJQaHlzaWNhbCBkZW5zaXR5OiA0MjBcIik7XG4gICAgICBsZXQgZGVuc2l0eSA9IGF3YWl0IGFkYi5nZXRTY3JlZW5EZW5zaXR5KCk7XG4gICAgICBkZW5zaXR5LnNob3VsZC5lcXVhbCg0MjApO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgcmV0dXJuIG51bGwgZm9yIGludmFsaWQgc2NyZWVuIGRlbnNpdHknLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKFsnd20nLCAnZGVuc2l0eSddKVxuICAgICAgICAgIC5yZXR1cm5zKFwiUGh5c2ljYWwgZGVuc2l0eTogdW5rbm93blwiKTtcbiAgICAgIGxldCBkZW5zaXR5ID0gYXdhaXQgYWRiLmdldFNjcmVlbkRlbnNpdHkoKTtcbiAgICAgIHNob3VsZC5lcXVhbChkZW5zaXR5LCBudWxsKTtcbiAgICB9KTtcbiAgfSk7XG4gIGRlc2NyaWJlKCdhcHAgcGVybWlzc2lvbicsIGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBkdW1wZWRPdXRwdXQgPSBgXG4gICAgICAgICAgZGVjbGFyZWQgcGVybWlzc2lvbnM6XG4gICAgICAgICAgICBjb20ueHh4LnBlcm1pc3Npb24uQzJEX01FU1NBR0U6IHByb3Q9c2lnbmF0dXJlLCBJTlNUQUxMRURcbiAgICAgICAgICAgIGNvbS54eHgucGVybWlzc2lvbi5DMkRfTUVTU0FHRTogcHJvdD1zaWduYXR1cmVcbiAgICAgICAgICByZXF1ZXN0ZWQgcGVybWlzc2lvbnM6XG4gICAgICAgICAgICBhbmRyb2lkLnBlcm1pc3Npb24uQUNDRVNTX05FVFdPUktfU1RBVEVcbiAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5XUklURV9FWFRFUk5BTF9TVE9SQUdFXG4gICAgICAgICAgICBhbmRyb2lkLnBlcm1pc3Npb24uSU5URVJORVRcbiAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5SRUFEX0NPTlRBQ1RTXG4gICAgICAgICAgICBhbmRyb2lkLnBlcm1pc3Npb24uUkVDT1JEX0FVRElPXG4gICAgICAgICAgICBhbmRyb2lkLnBlcm1pc3Npb24uVklCUkFURVxuICAgICAgICAgICAgYW5kcm9pZC5wZXJtaXNzaW9uLkNBTUVSQVxuICAgICAgICAgICAgYW5kcm9pZC5wZXJtaXNzaW9uLkZMQVNITElHSFRcbiAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5SRUFEX1BIT05FX1NUQVRFXG4gICAgICAgICAgICBhbmRyb2lkLnBlcm1pc3Npb24uTU9ESUZZX0FVRElPX1NFVFRJTkdTXG4gICAgICAgICAgICBhbmRyb2lkLnBlcm1pc3Npb24uQkxVRVRPT1RIXG4gICAgICAgICAgICBhbmRyb2lkLnBlcm1pc3Npb24uV0FLRV9MT0NLXG4gICAgICAgICAgICBjb20uZ29vZ2xlLmFuZHJvaWQuYzJkbS5wZXJtaXNzaW9uLlJFQ0VJVkVcbiAgICAgICAgICAgIGNvbS54eHgucGVybWlzc2lvbi5DMkRfTUVTU0FHRVxuICAgICAgICAgICAgYW5kcm9pZC5wZXJtaXNzaW9uLkFDQ0VTU19GSU5FX0xPQ0FUSU9OXG4gICAgICAgICAgICBhbmRyb2lkLnBlcm1pc3Npb24uUkVBRF9FWFRFUk5BTF9TVE9SQUdFXG4gICAgICAgICAgICBhbmRyb2lkLnBlcm1pc3Npb24uUkVDRUlWRV9CT09UX0NPTVBMRVRFRFxuICAgICAgICAgICAgLnBlcm1pc3Npb24uQzJEX01FU1NBR0VcbiAgICAgICAgICBpbnN0YWxsIHBlcm1pc3Npb25zOlxuICAgICAgICAgICAgY29tLmdvb2dsZS5hbmRyb2lkLmMyZG0ucGVybWlzc2lvbi5SRUNFSVZFOiBncmFudGVkPXRydWVcbiAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5NT0RJRllfQVVESU9fU0VUVElOR1M6IGdyYW50ZWQ9dHJ1ZVxuICAgICAgICAgICAgYW5kcm9pZC5wZXJtaXNzaW9uLlJFQ0VJVkVfQk9PVF9DT01QTEVURUQ6IGdyYW50ZWQ9dHJ1ZVxuICAgICAgICAgICAgYW5kcm9pZC5wZXJtaXNzaW9uLkJMVUVUT09USDogZ3JhbnRlZD10cnVlXG4gICAgICAgICAgICBhbmRyb2lkLnBlcm1pc3Npb24uSU5URVJORVQ6IGdyYW50ZWQ9dHJ1ZVxuICAgICAgICAgICAgY29tLnh4eC5wZXJtaXNzaW9uLkMyRF9NRVNTQUdFOiBncmFudGVkPXRydWVcbiAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5GTEFTSExJR0hUOiBncmFudGVkPXRydWVcbiAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5BQ0NFU1NfTkVUV09SS19TVEFURTogZ3JhbnRlZD10cnVlXG4gICAgICAgICAgICBhbmRyb2lkLnBlcm1pc3Npb24uVklCUkFURTogZ3JhbnRlZD10cnVlXG4gICAgICAgICAgICBhbmRyb2lkLnBlcm1pc3Npb24uV0FLRV9MT0NLOiBncmFudGVkPXRydWVcbiAgICAgICAgICBVc2VyIDA6IGNlRGF0YUlub2RlPTE1MDQ3MTIgaW5zdGFsbGVkPXRydWUgaGlkZGVuPWZhbHNlIHN1c3BlbmRlZD1mYWxzZSBzdG9wcGVkPWZhbHNlIG5vdExhdW5jaGVkPWZhbHNlIGVuYWJsZWQ9MFxuICAgICAgICAgICAgZ2lkcz1bMzAwMiwgMzAwM11cbiAgICAgICAgICAgIHJ1bnRpbWUgcGVybWlzc2lvbnM6XG4gICAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5BQ0NFU1NfRklORV9MT0NBVElPTjogZ3JhbnRlZD10cnVlXG4gICAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5SRUFEX0VYVEVSTkFMX1NUT1JBR0U6IGdyYW50ZWQ9dHJ1ZVxuICAgICAgICAgICAgICBhbmRyb2lkLnBlcm1pc3Npb24uUkVBRF9QSE9ORV9TVEFURTogZ3JhbnRlZD10cnVlXG4gICAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5DQU1FUkE6IGdyYW50ZWQ9ZmFsc2UsIGZsYWdzPVsgVVNFUl9TRVQgXVxuICAgICAgICAgICAgICBhbmRyb2lkLnBlcm1pc3Npb24uV1JJVEVfRVhURVJOQUxfU1RPUkFHRTogZ3JhbnRlZD10cnVlXG4gICAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5SRUNPUkRfQVVESU86IGdyYW50ZWQ9dHJ1ZVxuICAgICAgICAgICAgICBhbmRyb2lkLnBlcm1pc3Npb24uUkVBRF9DT05UQUNUUzogZ3JhbnRlZD1mYWxzZSwgZmxhZ3M9WyBVU0VSX1NFVCBdXG5cblxuICAgICAgRGV4b3B0IHN0YXRlOlxuICAgICAgICBbY29tLnh4eF1cbiAgICAgICAgICBJbnN0cnVjdGlvbiBTZXQ6IGFybVxuICAgICAgICAgICAgcGF0aDogL2RhdGEvYXBwL2NvbS54eHgtMS9iYXNlLmFwa1xuICAgICAgICAgICAgc3RhdHVzOiAvZGF0YS9hcHAvY29tLnh4eGEtMS9vYXQvYXJtL2Jhc2Uub2RleCBbY29tcGlsYXRpb25fZmlsdGVyPWludGVycHJldC1vbmx5LCBzdGF0dXM9a09hdFVwVG9EYXRlXVxuXG5cbiAgICAgIENvbXBpbGVyIHN0YXRzOlxuICAgICAgICBbY29tLnh4eF1cbiAgICAgICAgICAgYmFzZS5hcGsgLSA4MjY0XG5cbiAgICBEVU1QIE9GIFNFUlZJQ0UgYWN0aXZpdHk6XG4gICAgICBBQ1RJVklUWSBNQU5BR0VSIFBFTkRJTkcgSU5URU5UUyAoZHVtcHN5cyBhY3Rpdml0eSBpbnRlbnRzKVxuICAgICAgICAobm90aGluZylgO1xuXG4gICAgY29uc3QgZHVtcGVkTGltaXRlZE91dHB1dCA9IGBcbiAgICAgICAgICBkZWNsYXJlZCBwZXJtaXNzaW9uczpcbiAgICAgICAgICAgIGNvbS54eHgucGVybWlzc2lvbi5DMkRfTUVTU0FHRTogcHJvdD1zaWduYXR1cmUsIElOU1RBTExFRFxuICAgICAgICAgICAgY29tLnh4eC5wZXJtaXNzaW9uLkMyRF9NRVNTQUdFOiBwcm90PXNpZ25hdHVyZVxuICAgICAgICAgIHJlcXVlc3RlZCBwZXJtaXNzaW9uczpcbiAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5BQ0NFU1NfTkVUV09SS19TVEFURVxuICAgICAgICAgICAgYW5kcm9pZC5wZXJtaXNzaW9uLldSSVRFX0VYVEVSTkFMX1NUT1JBR0VcbiAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5JTlRFUk5FVFxuICAgICAgICAgICAgYW5kcm9pZC5wZXJtaXNzaW9uLlJFQURfQ09OVEFDVFNcbiAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5SRUNPUkRfQVVESU9cbiAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5WSUJSQVRFXG4gICAgICAgICAgICBhbmRyb2lkLnBlcm1pc3Npb24uQ0FNRVJBXG4gICAgICAgICAgICBhbmRyb2lkLnBlcm1pc3Npb24uRkxBU0hMSUdIVFxuICAgICAgICAgICAgYW5kcm9pZC5wZXJtaXNzaW9uLlJFQURfUEhPTkVfU1RBVEVcbiAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5NT0RJRllfQVVESU9fU0VUVElOR1NcbiAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5CTFVFVE9PVEhcbiAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5XQUtFX0xPQ0tcbiAgICAgICAgICAgIGNvbS5nb29nbGUuYW5kcm9pZC5jMmRtLnBlcm1pc3Npb24uUkVDRUlWRVxuICAgICAgICAgICAgY29tLnh4eC5wZXJtaXNzaW9uLkMyRF9NRVNTQUdFXG4gICAgICAgICAgICBhbmRyb2lkLnBlcm1pc3Npb24uQUNDRVNTX0ZJTkVfTE9DQVRJT05cbiAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5SRUFEX0VYVEVSTkFMX1NUT1JBR0VcbiAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5SRUNFSVZFX0JPT1RfQ09NUExFVEVEXG4gICAgICAgICAgICAucGVybWlzc2lvbi5DMkRfTUVTU0FHRVxuICAgICAgICAgIFVzZXIgMDogY2VEYXRhSW5vZGU9MTUwNDcxMiBpbnN0YWxsZWQ9dHJ1ZSBoaWRkZW49ZmFsc2Ugc3VzcGVuZGVkPWZhbHNlIHN0b3BwZWQ9ZmFsc2Ugbm90TGF1bmNoZWQ9ZmFsc2UgZW5hYmxlZD0wXG4gICAgICAgICAgICBnaWRzPVszMDAyLCAzMDAzXVxuICAgICAgICAgICAgcnVudGltZSBwZXJtaXNzaW9uczpcbiAgICAgICAgICAgICAgYW5kcm9pZC5wZXJtaXNzaW9uLkFDQ0VTU19GSU5FX0xPQ0FUSU9OOiBncmFudGVkPXRydWVcbiAgICAgICAgICAgICAgYW5kcm9pZC5wZXJtaXNzaW9uLlJFQURfRVhURVJOQUxfU1RPUkFHRTogZ3JhbnRlZD10cnVlXG4gICAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5SRUFEX1BIT05FX1NUQVRFOiBncmFudGVkPXRydWVcbiAgICAgICAgICAgICAgYW5kcm9pZC5wZXJtaXNzaW9uLkNBTUVSQTogZ3JhbnRlZD1mYWxzZSwgZmxhZ3M9WyBVU0VSX1NFVCBdXG4gICAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5XUklURV9FWFRFUk5BTF9TVE9SQUdFOiBncmFudGVkPXRydWVcbiAgICAgICAgICAgICAgYW5kcm9pZC5wZXJtaXNzaW9uLlJFQ09SRF9BVURJTzogZ3JhbnRlZD10cnVlXG4gICAgICAgICAgICAgIGFuZHJvaWQucGVybWlzc2lvbi5SRUFEX0NPTlRBQ1RTOiBncmFudGVkPWZhbHNlLCBmbGFncz1bIFVTRVJfU0VUIF1cblxuXG4gICAgICBEZXhvcHQgc3RhdGU6XG4gICAgICAgIFtjb20ueHh4XVxuICAgICAgICAgIEluc3RydWN0aW9uIFNldDogYXJtXG4gICAgICAgICAgICBwYXRoOiAvZGF0YS9hcHAvY29tLnh4eC0xL2Jhc2UuYXBrXG4gICAgICAgICAgICBzdGF0dXM6IC9kYXRhL2FwcC9jb20ueHh4YS0xL29hdC9hcm0vYmFzZS5vZGV4IFtjb21waWxhdGlvbl9maWx0ZXI9aW50ZXJwcmV0LW9ubHksIHN0YXR1cz1rT2F0VXBUb0RhdGVdXG5cblxuICAgICAgQ29tcGlsZXIgc3RhdHM6XG4gICAgICAgIFtjb20ueHh4XVxuICAgICAgICAgICBiYXNlLmFwayAtIDgyNjRcblxuICAgIERVTVAgT0YgU0VSVklDRSBhY3Rpdml0eTpcbiAgICAgIEFDVElWSVRZIE1BTkFHRVIgUEVORElORyBJTlRFTlRTIChkdW1wc3lzIGFjdGl2aXR5IGludGVudHMpXG4gICAgICAgIChub3RoaW5nKWA7XG5cbiAgICBpdCgnc2hvdWxkIGdyYW50IHJlcXVlc3RlZCBwZXJtaXNzaW9uJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEFyZ3MoWydwbScsICdncmFudCcsICdpby5hcHBpdW0uYW5kcm9pZC5hcGlzJywgJ2FuZHJvaWQucGVybWlzc2lvbi5SRUFEX0VYVEVSTkFMX1NUT1JBR0UnXSk7XG4gICAgICBhd2FpdCBhZGIuZ3JhbnRQZXJtaXNzaW9uKCdpby5hcHBpdW0uYW5kcm9pZC5hcGlzJywgJ2FuZHJvaWQucGVybWlzc2lvbi5SRUFEX0VYVEVSTkFMX1NUT1JBR0UnKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIHJldm9rZSByZXF1ZXN0ZWQgcGVybWlzc2lvbicsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwic2hlbGxcIilcbiAgICAgICAgICAub25jZSgpLndpdGhBcmdzKFsncG0nLCAncmV2b2tlJywgJ2lvLmFwcGl1bS5hbmRyb2lkLmFwaXMnLCAnYW5kcm9pZC5wZXJtaXNzaW9uLlJFQURfRVhURVJOQUxfU1RPUkFHRSddKTtcbiAgICAgIGF3YWl0IGFkYi5yZXZva2VQZXJtaXNzaW9uKCdpby5hcHBpdW0uYW5kcm9pZC5hcGlzJywgJ2FuZHJvaWQucGVybWlzc2lvbi5SRUFEX0VYVEVSTkFMX1NUT1JBR0UnKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIHByb3Blcmx5IGxpc3QgcmVxdWVzdGVkIHBlcm1pc3Npb25zJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKS5vbmNlKCkucmV0dXJucyhkdW1wZWRPdXRwdXQpO1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYWRiLmdldFJlcVBlcm1pc3Npb25zKCdpby5hcHBpdW0uYW5kcm9pZCcpO1xuICAgICAgZm9yIChsZXQgcGVybSBvZiBbXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uQUNDRVNTX05FVFdPUktfU1RBVEUnLFxuICAgICAgICAnYW5kcm9pZC5wZXJtaXNzaW9uLldSSVRFX0VYVEVSTkFMX1NUT1JBR0UnLFxuICAgICAgICAnYW5kcm9pZC5wZXJtaXNzaW9uLklOVEVSTkVUJyxcbiAgICAgICAgJ2FuZHJvaWQucGVybWlzc2lvbi5SRUFEX0NPTlRBQ1RTJyxcbiAgICAgICAgJ2FuZHJvaWQucGVybWlzc2lvbi5SRUNPUkRfQVVESU8nLFxuICAgICAgICAnYW5kcm9pZC5wZXJtaXNzaW9uLlZJQlJBVEUnLFxuICAgICAgICAnYW5kcm9pZC5wZXJtaXNzaW9uLkNBTUVSQScsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uRkxBU0hMSUdIVCcsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uUkVBRF9QSE9ORV9TVEFURScsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uTU9ESUZZX0FVRElPX1NFVFRJTkdTJyxcbiAgICAgICAgJ2FuZHJvaWQucGVybWlzc2lvbi5CTFVFVE9PVEgnLFxuICAgICAgICAnYW5kcm9pZC5wZXJtaXNzaW9uLldBS0VfTE9DSycsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uQUNDRVNTX0ZJTkVfTE9DQVRJT04nLFxuICAgICAgICAnYW5kcm9pZC5wZXJtaXNzaW9uLlJFQURfRVhURVJOQUxfU1RPUkFHRScsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uUkVDRUlWRV9CT09UX0NPTVBMRVRFRCdcbiAgICAgIF0pIHtcbiAgICAgICAgcmVzdWx0LnNob3VsZC5pbmNsdWRlKHBlcm0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgcHJvcGVybHkgbGlzdCByZXF1ZXN0ZWQgcGVybWlzc2lvbnMgZm9yIG91dHB1dCB3aXRob3V0IGluc3RhbGwgcGVybWlzc2lvbnMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpLm9uY2UoKS5yZXR1cm5zKGR1bXBlZExpbWl0ZWRPdXRwdXQpO1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYWRiLmdldFJlcVBlcm1pc3Npb25zKCdpby5hcHBpdW0uYW5kcm9pZCcpO1xuICAgICAgZm9yIChsZXQgcGVybSBvZiBbXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uQUNDRVNTX05FVFdPUktfU1RBVEUnLFxuICAgICAgICAnYW5kcm9pZC5wZXJtaXNzaW9uLldSSVRFX0VYVEVSTkFMX1NUT1JBR0UnLFxuICAgICAgICAnYW5kcm9pZC5wZXJtaXNzaW9uLklOVEVSTkVUJyxcbiAgICAgICAgJ2FuZHJvaWQucGVybWlzc2lvbi5SRUFEX0NPTlRBQ1RTJyxcbiAgICAgICAgJ2FuZHJvaWQucGVybWlzc2lvbi5SRUNPUkRfQVVESU8nLFxuICAgICAgICAnYW5kcm9pZC5wZXJtaXNzaW9uLlZJQlJBVEUnLFxuICAgICAgICAnYW5kcm9pZC5wZXJtaXNzaW9uLkNBTUVSQScsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uRkxBU0hMSUdIVCcsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uUkVBRF9QSE9ORV9TVEFURScsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uTU9ESUZZX0FVRElPX1NFVFRJTkdTJyxcbiAgICAgICAgJ2FuZHJvaWQucGVybWlzc2lvbi5CTFVFVE9PVEgnLFxuICAgICAgICAnYW5kcm9pZC5wZXJtaXNzaW9uLldBS0VfTE9DSycsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uQUNDRVNTX0ZJTkVfTE9DQVRJT04nLFxuICAgICAgICAnYW5kcm9pZC5wZXJtaXNzaW9uLlJFQURfRVhURVJOQUxfU1RPUkFHRScsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uUkVDRUlWRV9CT09UX0NPTVBMRVRFRCdcbiAgICAgIF0pIHtcbiAgICAgICAgcmVzdWx0LnNob3VsZC5pbmNsdWRlKHBlcm0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgcHJvcGVybHkgbGlzdCBncmFudGVkIHBlcm1pc3Npb25zJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKS5vbmNlKCkucmV0dXJucyhkdW1wZWRPdXRwdXQpO1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYWRiLmdldEdyYW50ZWRQZXJtaXNzaW9ucygnaW8uYXBwaXVtLmFuZHJvaWQnKTtcbiAgICAgIGZvciAobGV0IHBlcm0gb2YgW1xuICAgICAgICAnYW5kcm9pZC5wZXJtaXNzaW9uLk1PRElGWV9BVURJT19TRVRUSU5HUycsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uUkVDRUlWRV9CT09UX0NPTVBMRVRFRCcsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uQkxVRVRPT1RIJyxcbiAgICAgICAgJ2FuZHJvaWQucGVybWlzc2lvbi5JTlRFUk5FVCcsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uRkxBU0hMSUdIVCcsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uQUNDRVNTX05FVFdPUktfU1RBVEUnLFxuICAgICAgICAnYW5kcm9pZC5wZXJtaXNzaW9uLlZJQlJBVEUnLFxuICAgICAgICAnYW5kcm9pZC5wZXJtaXNzaW9uLldBS0VfTE9DSycsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uQUNDRVNTX0ZJTkVfTE9DQVRJT04nLFxuICAgICAgICAnYW5kcm9pZC5wZXJtaXNzaW9uLlJFQURfRVhURVJOQUxfU1RPUkFHRScsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uUkVBRF9QSE9ORV9TVEFURScsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uV1JJVEVfRVhURVJOQUxfU1RPUkFHRScsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uUkVDT1JEX0FVRElPJ1xuICAgICAgXSkge1xuICAgICAgICByZXN1bHQuc2hvdWxkLmluY2x1ZGUocGVybSk7XG4gICAgICB9XG4gICAgICBmb3IgKGxldCBwZXJtIG9mIFtcbiAgICAgICAgJ2FuZHJvaWQucGVybWlzc2lvbi5SRUFEX0NPTlRBQ1RTJyxcbiAgICAgICAgJ2FuZHJvaWQucGVybWlzc2lvbi5DQU1FUkEnLFxuICAgICAgXSkge1xuICAgICAgICByZXN1bHQuc2hvdWxkLm5vdC5pbmNsdWRlKHBlcm0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgcHJvcGVybHkgbGlzdCBncmFudGVkIHBlcm1pc3Npb25zIGZvciBvdXRwdXQgd2l0aG91dCBpbnN0YWxsIHBlcm1pc3Npb25zJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKS5vbmNlKCkucmV0dXJucyhkdW1wZWRMaW1pdGVkT3V0cHV0KTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGFkYi5nZXRHcmFudGVkUGVybWlzc2lvbnMoJ2lvLmFwcGl1bS5hbmRyb2lkJyk7XG4gICAgICBmb3IgKGxldCBwZXJtIG9mIFtcbiAgICAgICAgJ2FuZHJvaWQucGVybWlzc2lvbi5BQ0NFU1NfRklORV9MT0NBVElPTicsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uUkVBRF9FWFRFUk5BTF9TVE9SQUdFJyxcbiAgICAgICAgJ2FuZHJvaWQucGVybWlzc2lvbi5SRUFEX1BIT05FX1NUQVRFJyxcbiAgICAgICAgJ2FuZHJvaWQucGVybWlzc2lvbi5XUklURV9FWFRFUk5BTF9TVE9SQUdFJyxcbiAgICAgICAgJ2FuZHJvaWQucGVybWlzc2lvbi5SRUNPUkRfQVVESU8nXG4gICAgICBdKSB7XG4gICAgICAgIHJlc3VsdC5zaG91bGQuaW5jbHVkZShwZXJtKTtcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IHBlcm0gb2YgW1xuICAgICAgICAnYW5kcm9pZC5wZXJtaXNzaW9uLlJFQURfQ09OVEFDVFMnLFxuICAgICAgICAnYW5kcm9pZC5wZXJtaXNzaW9uLkNBTUVSQSdcbiAgICAgIF0pIHtcbiAgICAgICAgcmVzdWx0LnNob3VsZC5ub3QuaW5jbHVkZShwZXJtKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIHByb3Blcmx5IGxpc3QgZGVuaWVkIHBlcm1pc3Npb25zJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbW9ja3MuYWRiLmV4cGVjdHMoXCJzaGVsbFwiKS5vbmNlKCkucmV0dXJucyhkdW1wZWRPdXRwdXQpO1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYWRiLmdldERlbmllZFBlcm1pc3Npb25zKCdpby5hcHBpdW0uYW5kcm9pZCcpO1xuICAgICAgZm9yIChsZXQgcGVybSBvZiBbXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uTU9ESUZZX0FVRElPX1NFVFRJTkdTJyxcbiAgICAgICAgJ2FuZHJvaWQucGVybWlzc2lvbi5SRUNFSVZFX0JPT1RfQ09NUExFVEVEJyxcbiAgICAgICAgJ2FuZHJvaWQucGVybWlzc2lvbi5CTFVFVE9PVEgnLFxuICAgICAgICAnYW5kcm9pZC5wZXJtaXNzaW9uLklOVEVSTkVUJyxcbiAgICAgICAgJ2FuZHJvaWQucGVybWlzc2lvbi5GTEFTSExJR0hUJyxcbiAgICAgICAgJ2FuZHJvaWQucGVybWlzc2lvbi5BQ0NFU1NfTkVUV09SS19TVEFURScsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uVklCUkFURScsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uV0FLRV9MT0NLJyxcbiAgICAgICAgJ2FuZHJvaWQucGVybWlzc2lvbi5BQ0NFU1NfRklORV9MT0NBVElPTicsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uUkVBRF9FWFRFUk5BTF9TVE9SQUdFJyxcbiAgICAgICAgJ2FuZHJvaWQucGVybWlzc2lvbi5SRUFEX1BIT05FX1NUQVRFJyxcbiAgICAgICAgJ2FuZHJvaWQucGVybWlzc2lvbi5XUklURV9FWFRFUk5BTF9TVE9SQUdFJyxcbiAgICAgICAgJ2FuZHJvaWQucGVybWlzc2lvbi5SRUNPUkRfQVVESU8nLFxuICAgICAgXSkge1xuICAgICAgICByZXN1bHQuc2hvdWxkLm5vdC5pbmNsdWRlKHBlcm0pO1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgcGVybSBvZiBbXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uUkVBRF9DT05UQUNUUycsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uQ0FNRVJBJyxcbiAgICAgIF0pIHtcbiAgICAgICAgcmVzdWx0LnNob3VsZC5pbmNsdWRlKHBlcm0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgcHJvcGVybHkgbGlzdCBkZW5pZWQgcGVybWlzc2lvbnMgZm9yIG91dHB1dCB3aXRob3V0IGluc3RhbGwgcGVybWlzc2lvbnMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcInNoZWxsXCIpLm9uY2UoKS5yZXR1cm5zKGR1bXBlZExpbWl0ZWRPdXRwdXQpO1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYWRiLmdldERlbmllZFBlcm1pc3Npb25zKCdpby5hcHBpdW0uYW5kcm9pZCcpO1xuICAgICAgZm9yIChsZXQgcGVybSBvZiBbXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uQUNDRVNTX0ZJTkVfTE9DQVRJT04nLFxuICAgICAgICAnYW5kcm9pZC5wZXJtaXNzaW9uLlJFQURfRVhURVJOQUxfU1RPUkFHRScsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uUkVBRF9QSE9ORV9TVEFURScsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uV1JJVEVfRVhURVJOQUxfU1RPUkFHRScsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uUkVDT1JEX0FVRElPJ1xuICAgICAgXSkge1xuICAgICAgICByZXN1bHQuc2hvdWxkLm5vdC5pbmNsdWRlKHBlcm0pO1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgcGVybSBvZiBbXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uUkVBRF9DT05UQUNUUycsXG4gICAgICAgICdhbmRyb2lkLnBlcm1pc3Npb24uQ0FNRVJBJ1xuICAgICAgXSkge1xuICAgICAgICByZXN1bHQuc2hvdWxkLmluY2x1ZGUocGVybSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuICBkZXNjcmliZSgnc2VuZFRlbG5ldENvbW1hbmQnLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIHdpdGggY29ycmVjdCBhcmdzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgcG9ydCA9IDU0MzIxO1xuICAgICAgbGV0IGNvbm4gPSBuZXcgZXZlbnRzLkV2ZW50RW1pdHRlcigpO1xuICAgICAgbGV0IGNvbW1hbmRzID0gW107XG4gICAgICBjb25uLndyaXRlID0gZnVuY3Rpb24gKGNvbW1hbmQpIHtcbiAgICAgICAgY29tbWFuZHMucHVzaChjb21tYW5kKTtcbiAgICAgIH07XG4gICAgICBtb2Nrcy5hZGIuZXhwZWN0cyhcImdldEVtdWxhdG9yUG9ydFwiKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MoKVxuICAgICAgICAucmV0dXJucyhwb3J0KTtcbiAgICAgIG1vY2tzLm5ldC5leHBlY3RzKFwiY3JlYXRlQ29ubmVjdGlvblwiKVxuICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3MocG9ydCwgJ2xvY2FsaG9zdCcpXG4gICAgICAgIC5yZXR1cm5zKGNvbm4pO1xuICAgICAgbGV0IHAgPSBhZGIuc2VuZFRlbG5ldENvbW1hbmQoJ2F2ZCBuYW1lJyk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29ubi5lbWl0KCdjb25uZWN0Jyk7XG4gICAgICAgIGNvbm4uZW1pdCgnZGF0YScsICdPSycpO1xuICAgICAgICBjb25uLmVtaXQoJ2RhdGEnLCAnT0snKTtcbiAgICAgICAgY29ubi5lbWl0KCdjbG9zZScpO1xuICAgICAgfSwgMCk7XG4gICAgICBhd2FpdCBwO1xuICAgICAgY29tbWFuZHNbMF0uc2hvdWxkLmVxdWFsKFwiYXZkIG5hbWVcXG5cIik7XG4gICAgICBjb21tYW5kc1sxXS5zaG91bGQuZXF1YWwoXCJxdWl0XFxuXCIpO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgcmV0dXJuIHRoZSBsYXN0IGxpbmUgb2YgdGhlIG91dHB1dCBvbmx5JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgcG9ydCA9IDU0MzIxO1xuICAgICAgbGV0IGNvbm4gPSBuZXcgZXZlbnRzLkV2ZW50RW1pdHRlcigpO1xuICAgICAgbGV0IGNvbW1hbmRzID0gW107XG4gICAgICBsZXQgZXhwZWN0ZWQgPSBcImRlc2lyZWRfY29tbWFuZF9vdXRwdXRcIjtcbiAgICAgIGNvbm4ud3JpdGUgPSBmdW5jdGlvbiAoY29tbWFuZCkge1xuICAgICAgICBjb21tYW5kcy5wdXNoKGNvbW1hbmQpO1xuICAgICAgfTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0RW11bGF0b3JQb3J0XCIpXG4gICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncygpXG4gICAgICAgIC5yZXR1cm5zKHBvcnQpO1xuICAgICAgbW9ja3MubmV0LmV4cGVjdHMoXCJjcmVhdGVDb25uZWN0aW9uXCIpXG4gICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhwb3J0LCAnbG9jYWxob3N0JylcbiAgICAgICAgLnJldHVybnMoY29ubik7XG4gICAgICBsZXQgcCA9IGFkYi5zZW5kVGVsbmV0Q29tbWFuZCgnYXZkIG5hbWUnKTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25uLmVtaXQoJ2Nvbm5lY3QnKTtcbiAgICAgICAgY29ubi5lbWl0KCdkYXRhJywgJ09LJyk7XG4gICAgICAgIGNvbm4uZW1pdCgnZGF0YScsICdPS1xcbnVud2FudGVkX2VjaG9fb3V0cHV0XFxuJyArIGV4cGVjdGVkKTtcbiAgICAgICAgY29ubi5lbWl0KCdjbG9zZScpO1xuICAgICAgfSwgMCk7XG4gICAgICBsZXQgYWN0dWFsID0gYXdhaXQgcDtcbiAgICAgIChhY3R1YWwpLnNob3VsZC5lcXVhbChleHBlY3RlZCk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCB0aHJvdyBlcnJvciBpZiBuZXR3b3JrIGNvbm5lY3Rpb24gZXJyb3JzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgcG9ydCA9IDU0MzIxO1xuICAgICAgbGV0IGNvbm4gPSBuZXcgZXZlbnRzLkV2ZW50RW1pdHRlcigpO1xuICAgICAgbGV0IGNvbW1hbmRzID0gW107XG4gICAgICBsZXQgZXhwZWN0ZWQgPSBcImRlc2lyZWRfY29tbWFuZF9vdXRwdXRcIjtcbiAgICAgIGNvbm4ud3JpdGUgPSBmdW5jdGlvbiAoY29tbWFuZCkge1xuICAgICAgICBjb21tYW5kcy5wdXNoKGNvbW1hbmQpO1xuICAgICAgfTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKFwiZ2V0RW11bGF0b3JQb3J0XCIpXG4gICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncygpXG4gICAgICAgIC5yZXR1cm5zKHBvcnQpO1xuICAgICAgbW9ja3MubmV0LmV4cGVjdHMoXCJjcmVhdGVDb25uZWN0aW9uXCIpXG4gICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhwb3J0LCAnbG9jYWxob3N0JylcbiAgICAgICAgLnJldHVybnMoY29ubik7XG4gICAgICBsZXQgcCA9IGFkYi5zZW5kVGVsbmV0Q29tbWFuZCgnYXZkIG5hbWUnKTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25uLmVtaXQoJ2Nvbm5lY3QnKTtcbiAgICAgICAgY29ubi5lbWl0KCdkYXRhJywgJ09LJyk7XG4gICAgICAgIGNvbm4uZW1pdCgnZGF0YScsICdPS1xcbnVud2FudGVkX2VjaG9fb3V0cHV0XFxuJyArIGV4cGVjdGVkKTtcbiAgICAgICAgY29ubi5lbWl0KCdlcnJvcicsIG5ldyBFcnJvcignb3VjaCEnKSk7XG4gICAgICB9LCAwKTtcbiAgICAgIGF3YWl0IHAuc2hvdWxkLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWRXaXRoKC9vdWNoLyk7XG4gICAgfSk7XG4gIH0pO1xuICBpdCgnaXNWYWxpZENsYXNzIHNob3VsZCBjb3JyZWN0bHkgdmFsaWRhdGUgY2xhc3MgbmFtZXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgYWRiLmlzVmFsaWRDbGFzcygnc29tZS5wYWNrYWdlL3NvbWUucGFja2FnZS5BY3Rpdml0eScpLmluZGV4LnNob3VsZC5lcXVhbCgwKTtcbiAgICBzaG91bGQubm90LmV4aXN0KGFkYi5pc1ZhbGlkQ2xhc3MoJ2lsbGVnYWxQYWNrYWdlIy9hZHNhc2QnKSk7XG4gIH0pO1xuICBpdCgnZ2V0QWRiUGF0aCBzaG91bGQgY29ycmVjdGx5IHJldHVybiBhZGJQYXRoJywgZnVuY3Rpb24gKCkge1xuICAgIGFkYi5nZXRBZGJQYXRoKCkuc2hvdWxkLmVxdWFsKGFkYi5leGVjdXRhYmxlLnBhdGgpO1xuICB9KTtcbiAgZGVzY3JpYmUoJ3NldEh0dHBQcm94eScsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnc2hvdWxkIHRocm93IGFuIGVycm9yIG9uIHVuZGVmaW5lZCBwcm94eV9ob3N0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgYXdhaXQgYWRiLnNldEh0dHBQcm94eSgpLnNob3VsZC5ldmVudHVhbGx5LmJlLnJlamVjdGVkO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgdGhyb3cgYW4gZXJyb3Igb24gdW5kZWZpbmVkIHByb3h5X3BvcnQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBhd2FpdCBhZGIuc2V0SHR0cFByb3h5KFwiaHR0cDovL2xvY2FsaG9zdFwiKS5zaG91bGQuZXZlbnR1YWxseS5iZS5yZWplY3RlZDtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIGNhbGwgc2V0U2V0dGluZyBtZXRob2Qgd2l0aCBjb3JyZWN0IGFyZ3MnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgcHJveHlIb3N0ID0gXCJodHRwOi8vbG9jYWxob3N0XCI7XG4gICAgICBsZXQgcHJveHlQb3J0ID0gNDcyMztcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdzZXRTZXR0aW5nJykub25jZSgpLndpdGhFeGFjdEFyZ3MoJ2dsb2JhbCcsICdodHRwX3Byb3h5JywgYCR7cHJveHlIb3N0fToke3Byb3h5UG9ydH1gKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdzZXRTZXR0aW5nJykub25jZSgpLndpdGhFeGFjdEFyZ3MoJ3NlY3VyZScsICdodHRwX3Byb3h5JywgYCR7cHJveHlIb3N0fToke3Byb3h5UG9ydH1gKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdzZXRTZXR0aW5nJykub25jZSgpLndpdGhFeGFjdEFyZ3MoJ3N5c3RlbScsICdodHRwX3Byb3h5JywgYCR7cHJveHlIb3N0fToke3Byb3h5UG9ydH1gKTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdzZXRTZXR0aW5nJykub25jZSgpLndpdGhFeGFjdEFyZ3MoJ3N5c3RlbScsICdnbG9iYWxfaHR0cF9wcm94eV9ob3N0JywgcHJveHlIb3N0KTtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdzZXRTZXR0aW5nJykub25jZSgpLndpdGhFeGFjdEFyZ3MoJ3N5c3RlbScsICdnbG9iYWxfaHR0cF9wcm94eV9wb3J0JywgcHJveHlQb3J0KTtcbiAgICAgIGF3YWl0IGFkYi5zZXRIdHRwUHJveHkocHJveHlIb3N0LCBwcm94eVBvcnQpO1xuICAgIH0pO1xuICB9KTtcbiAgZGVzY3JpYmUoJ3NldFNldHRpbmcnLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIHNldHRpbmdzIHB1dCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdzaGVsbCcpLm9uY2UoKVxuICAgICAgICAud2l0aEV4YWN0QXJncyhbJ3NldHRpbmdzJywgJ3B1dCcsICduYW1lc3BhY2UnLCAnc2V0dGluZycsICd2YWx1ZSddKTtcbiAgICAgIGF3YWl0IGFkYi5zZXRTZXR0aW5nKCduYW1lc3BhY2UnLCAnc2V0dGluZycsICd2YWx1ZScpO1xuICAgIH0pO1xuICB9KTtcbiAgZGVzY3JpYmUoJ2dldFNldHRpbmcnLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ3Nob3VsZCBjYWxsIHNoZWxsIHNldHRpbmdzIGdldCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1vY2tzLmFkYi5leHBlY3RzKCdzaGVsbCcpLm9uY2UoKVxuICAgICAgICAud2l0aEFyZ3MoWydzZXR0aW5ncycsICdnZXQnLCAnbmFtZXNwYWNlJywgJ3NldHRpbmcnXSlcbiAgICAgICAgLnJldHVybnMoJ3ZhbHVlJyk7XG4gICAgICAoYXdhaXQgYWRiLmdldFNldHRpbmcoJ25hbWVzcGFjZScsICdzZXR0aW5nJykpLnNob3VsZC5iZS5lcXVhbCgndmFsdWUnKTtcbiAgICB9KTtcbiAgfSk7XG59KSk7XG4iXSwiZmlsZSI6InRlc3QvdW5pdC9hZGItY29tbWFuZHMtc3BlY3MuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==
