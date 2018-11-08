"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _chai = _interopRequireDefault(require("chai"));

var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));

var _helpers = require("../../lib/helpers.js");

_chai.default.use(_chaiAsPromised.default);

describe('Helpers', function () {
  it('getAndroidPlatformAndPath should return empty object when no ANDROID_HOME is set', (0, _asyncToGenerator2.default)(function* () {
    let android_home = process.env.ANDROID_HOME;
    delete process.env.ANDROID_HOME;

    try {
      yield (0, _helpers.getAndroidPlatformAndPath)().should.eventually.be.rejectedWith(/ANDROID_HOME environment variable was not exported/);
    } finally {
      process.env.ANDROID_HOME = android_home;
    }
  }));
  it('getAndroidPlatformAndPath should return platform and path for android', (0, _asyncToGenerator2.default)(function* () {
    let _ref3 = yield (0, _helpers.getAndroidPlatformAndPath)(),
        platform = _ref3.platform,
        platformPath = _ref3.platformPath;

    platform.should.exist;
    platformPath.should.exist;
  }));
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvZnVuY3Rpb25hbC9oZWxwZXJzLXNwZWNzLWUyZS1zcGVjcy5qcyJdLCJuYW1lcyI6WyJjaGFpIiwidXNlIiwiY2hhaUFzUHJvbWlzZWQiLCJkZXNjcmliZSIsIml0IiwiYW5kcm9pZF9ob21lIiwicHJvY2VzcyIsImVudiIsIkFORFJPSURfSE9NRSIsInNob3VsZCIsImV2ZW50dWFsbHkiLCJiZSIsInJlamVjdGVkV2l0aCIsInBsYXRmb3JtIiwicGxhdGZvcm1QYXRoIiwiZXhpc3QiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUVBQSxjQUFLQyxHQUFMLENBQVNDLHVCQUFUOztBQUVBQyxRQUFRLENBQUMsU0FBRCxFQUFZLFlBQVk7QUFDOUJDLEVBQUFBLEVBQUUsQ0FBQyxrRkFBRCxrQ0FBcUYsYUFBa0I7QUFDdkcsUUFBSUMsWUFBWSxHQUFHQyxPQUFPLENBQUNDLEdBQVIsQ0FBWUMsWUFBL0I7QUFFQSxXQUFPRixPQUFPLENBQUNDLEdBQVIsQ0FBWUMsWUFBbkI7O0FBRUEsUUFBSTtBQUNGLFlBQU0sMENBQTRCQyxNQUE1QixDQUFtQ0MsVUFBbkMsQ0FBOENDLEVBQTlDLENBQWlEQyxZQUFqRCxDQUE4RCxvREFBOUQsQ0FBTjtBQUNELEtBRkQsU0FFVTtBQUVSTixNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWUMsWUFBWixHQUEyQkgsWUFBM0I7QUFDRDtBQUNGLEdBWEMsRUFBRjtBQWFBRCxFQUFBQSxFQUFFLENBQUMsdUVBQUQsa0NBQTBFLGFBQWtCO0FBQUEsc0JBQ3ZELHlDQUR1RDtBQUFBLFFBQ3ZGUyxRQUR1RixTQUN2RkEsUUFEdUY7QUFBQSxRQUM3RUMsWUFENkUsU0FDN0VBLFlBRDZFOztBQUU1RkQsSUFBQUEsUUFBUSxDQUFDSixNQUFULENBQWdCTSxLQUFoQjtBQUNBRCxJQUFBQSxZQUFZLENBQUNMLE1BQWIsQ0FBb0JNLEtBQXBCO0FBQ0QsR0FKQyxFQUFGO0FBTUQsQ0FwQk8sQ0FBUiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IHsgZ2V0QW5kcm9pZFBsYXRmb3JtQW5kUGF0aCB9IGZyb20gJy4uLy4uL2xpYi9oZWxwZXJzLmpzJztcblxuY2hhaS51c2UoY2hhaUFzUHJvbWlzZWQpO1xuXG5kZXNjcmliZSgnSGVscGVycycsIGZ1bmN0aW9uICgpIHtcbiAgaXQoJ2dldEFuZHJvaWRQbGF0Zm9ybUFuZFBhdGggc2hvdWxkIHJldHVybiBlbXB0eSBvYmplY3Qgd2hlbiBubyBBTkRST0lEX0hPTUUgaXMgc2V0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgIGxldCBhbmRyb2lkX2hvbWUgPSBwcm9jZXNzLmVudi5BTkRST0lEX0hPTUU7XG4gICAgLy8gdGVtcCBzZXR0aW5nIGFuZHJvaWRfaG9tZSB0byBudWxsLlxuICAgIGRlbGV0ZSBwcm9jZXNzLmVudi5BTkRST0lEX0hPTUU7XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgZ2V0QW5kcm9pZFBsYXRmb3JtQW5kUGF0aCgpLnNob3VsZC5ldmVudHVhbGx5LmJlLnJlamVjdGVkV2l0aCgvQU5EUk9JRF9IT01FIGVudmlyb25tZW50IHZhcmlhYmxlIHdhcyBub3QgZXhwb3J0ZWQvKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgLy8gcmVzZXR0aW5nIEFORFJPSURfSE9NRVxuICAgICAgcHJvY2Vzcy5lbnYuQU5EUk9JRF9IT01FID0gYW5kcm9pZF9ob21lO1xuICAgIH1cbiAgfSk7XG5cbiAgaXQoJ2dldEFuZHJvaWRQbGF0Zm9ybUFuZFBhdGggc2hvdWxkIHJldHVybiBwbGF0Zm9ybSBhbmQgcGF0aCBmb3IgYW5kcm9pZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICBsZXQge3BsYXRmb3JtLCBwbGF0Zm9ybVBhdGh9ID0gYXdhaXQgZ2V0QW5kcm9pZFBsYXRmb3JtQW5kUGF0aCgpO1xuICAgIHBsYXRmb3JtLnNob3VsZC5leGlzdDtcbiAgICBwbGF0Zm9ybVBhdGguc2hvdWxkLmV4aXN0O1xuICB9KTtcblxufSk7XG4iXSwiZmlsZSI6InRlc3QvZnVuY3Rpb25hbC9oZWxwZXJzLXNwZWNzLWUyZS1zcGVjcy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLiJ9
