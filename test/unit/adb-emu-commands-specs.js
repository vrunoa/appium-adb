import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import ADB from '../..';
import { withMocks } from 'appium-test-support';


chai.use(chaiAsPromised);
chai.should();

const emulators = [
  { udid: 'emulator-5554', state: 'device', port: 5554 },
  { udid: 'emulator-5556', state: 'device', port: 5556 },
];
const fingerprintId = 1111;

describe('adb emulator commands', () => {
  let adb = new ADB();
  describe("emu", () => {
    describe("isEmulatorConnected", withMocks({adb}, (mocks) => {
      it("should verify emulators state", async () => {
        mocks.adb.expects("getConnectedEmulators")
          .atLeast(3)
          .returns(emulators);
        adb.curDeviceId = "emulator-5554";
        (await adb.isEmulatorConnected()).should.equal(true);
        adb.curDeviceId = "emulator-5556";
        (await adb.isEmulatorConnected()).should.equal(true);
        adb.curDeviceId = "emulator-5558";
        (await adb.isEmulatorConnected()).should.equal(false);
        mocks.adb.verify();
      });
    }));
    describe("verifyEmulatorConnected", withMocks({adb}, (mocks) => {
      it("should throw an exception on emulator not connected", async () => {
        adb.curDeviceId = "emulator-5558";
        mocks.adb.expects("isEmulatorConnected")
          .once()
          .returns(false);
        await adb.verifyEmulatorConnected().should.eventually.be.rejected;
        mocks.adb.verify();
      });
    }));
    describe("fingerprint", withMocks({adb}, (mocks) => {
      it("should throw exception on undefined fingerprintId", async () => {
        await adb.fingerprint().should.eventually.be.rejected;
        mocks.adb.verify();
      });
      it("should throw exception on apiLevel lower than 23", async () => {
        mocks.adb.expects("getApiLevel")
          .once().withExactArgs()
          .returns(21);
        await adb.fingerprint(fingerprintId).should.eventually.be.rejected;
        mocks.adb.verify();
      });
      it("should call adbExec with the correct args", async () => {
        mocks.adb.expects("getApiLevel")
          .once().withExactArgs()
          .returns(23);
        mocks.adb.expects("isEmulatorConnected")
          .once().withExactArgs()
          .returns(true);
        mocks.adb.expects("resetTelnetAuthToken")
          .once().withExactArgs()
          .returns();
        mocks.adb.expects("adbExec")
          .once().withExactArgs(["emu", "finger", "touch", fingerprintId])
          .returns();
        await adb.fingerprint(fingerprintId);
        mocks.adb.verify();
      });
    }));
    describe("rotate", withMocks({adb}, (mocks) => {
      it("should call adbExec with the correct args", async () => {
        mocks.adb.expects("isEmulatorConnected")
          .once().withExactArgs()
          .returns(true);
        mocks.adb.expects("resetTelnetAuthToken")
          .once().withExactArgs()
          .returns();
        mocks.adb.expects("adbExec")
          .once().withExactArgs(["emu", "rotate"])
          .returns();
        await adb.rotate();
        mocks.adb.verify();
      });
    }));
    describe("power methods", withMocks({adb}, (mocks) => {
      it("should throw exception on invalid power ac state", async () => {
        await adb.powerAC('dead').should.eventually.be.rejectedWith("Wrong power AC state");
        mocks.adb.verify();
      });
      it("should set the power ac off", async () => {
        mocks.adb.expects("isEmulatorConnected")
          .once().withExactArgs()
          .returns(true);
        mocks.adb.expects("resetTelnetAuthToken")
          .once().withExactArgs()
          .returns();
        mocks.adb.expects("adbExec")
          .once().withExactArgs(["emu", "power", "ac", adb.POWER_AC_OFF])
          .returns();
        await adb.powerAC('off');
        mocks.adb.verify();
      });
      it("should set the power ac on", async () => {
        mocks.adb.expects("isEmulatorConnected")
          .once().withExactArgs()
          .returns(true);
        mocks.adb.expects("resetTelnetAuthToken")
          .once().withExactArgs()
          .returns();
        mocks.adb.expects("adbExec")
          .once().withExactArgs(["emu", "power", "ac", adb.POWER_AC_ON])
          .returns();
        await adb.powerAC('on');
        mocks.adb.verify();
      });
      it("should throw exception on invalid power battery percent", async () => {
        await adb.powerCapacity(-1).should.eventually.be.rejectedWith("should be valid integer between 0 and 100");
        await adb.powerCapacity("a").should.eventually.be.rejectedWith("should be valid integer between 0 and 100");
        await adb.powerCapacity(500).should.eventually.be.rejectedWith("should be valid integer between 0 and 100");
        mocks.adb.verify();
      });
      it("should set the power capacity", async () => {
        mocks.adb.expects("isEmulatorConnected")
          .once().withExactArgs()
          .returns(true);
        mocks.adb.expects("resetTelnetAuthToken")
          .once().withExactArgs()
          .returns();
        mocks.adb.expects("adbExec")
          .once().withExactArgs(["emu", "power", "capacity", 0])
          .returns();
        await adb.powerCapacity(0);
        mocks.adb.verify();
      });
      it("should call methods to power off the emulator", async () => {
        mocks.adb.expects("powerAC")
          .once().withExactArgs('off')
          .returns();
        mocks.adb.expects("powerCapacity")
          .once().withExactArgs(0)
          .returns();
        await adb.powerOFF();
        mocks.adb.verify();
      });
    }));
    describe("sendSMS", withMocks({adb}, (mocks) => {
      it("should throw exception on invalid phoneNumber", async () => {
        await adb.sendSMS("+549341312345678").should.eventually.be.rejectedWith("Sending an SMS requires a message");
        mocks.adb.verify();
      });
      it("should throw exception on invalid phoneNumber", async () => {
        await adb.sendSMS("00549341a312345678", 'Hello Appium').should.eventually.be.rejectedWith("Invalid phoneNumber");
        mocks.adb.verify();
      });
      it("should call adbExec with the correct args", async () => {
        let phoneNumber = 4509;
        let message = " Hello Appium ";
        mocks.adb.expects("isEmulatorConnected")
          .once().withExactArgs()
          .returns(true);
        mocks.adb.expects("resetTelnetAuthToken")
          .once().withExactArgs()
          .returns();
        mocks.adb.expects("adbExec")
          .once().withExactArgs(["emu", "sms", "send", "4509", "Hello Appium"])
          .returns();
        await adb.sendSMS(phoneNumber, message);
        mocks.adb.verify();
      });
    }));
  });
});
