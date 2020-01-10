// device.js
// 获取应用实例
const app = getApp();
const util = require('../../utils/util.js');

// 设备配置服务
const serviceIdA = "000000AA-0000-1000-8000-00805F9B34FB";
const characteristicIdA = "0000AA01-0000-1000-8000-00805F9B34FB";
// 固件版本服务
const serviceIdB = "000000BB-0000-1000-8000-00805F9B34FB";
const characteristicIdB = "0000BB02-0000-1000-8000-00805F9B34FB";

Page({
  data: {
    devId: '',
    devVer: '',
    recvMask: 0x0,
    cancelled: false,
    devHasVfx: false,
    devHasAin: false,
    devHasBlk: false,
    devIsCube: false,
    vfxMode: 0x0,
    vfxScaleFactor: 0x0,
    vfxLightness: 0x0,
    vfxBacklight: 0x0,
    vfxAudioInput: false,
    vfxModeList: [
      { id: 0x00, name: '关闭' },
      { id: 0x01, name: '渐变-点' },
      { id: 0x02, name: '渐变-面' },
      { id: 0x03, name: '渐变-体' },
      { id: 0x04, name: '呼吸' },
      { id: 0x05, name: '星空-紫红' },
      { id: 0x06, name: '星空-青蓝' },
      { id: 0x07, name: '星空-黄绿' },
      { id: 0x08, name: '数字-固定' },
      { id: 0x09, name: '数字-滚动' },
      { id: 0x0A, name: '跳跃飞毯' },
      { id: 0x0B, name: '旋转曲面-正' },
      { id: 0x0C, name: '旋转曲面-反' },
      { id: 0x0D, name: '音乐喷泉-静态-对数' },
      { id: 0x0E, name: '音乐喷泉-渐变-对数' },
      { id: 0x0F, name: '音乐喷泉-螺旋-对数' },
      { id: 0x10, name: '音乐喷泉-静态-线性' },
      { id: 0x11, name: '音乐喷泉-渐变-线性' },
      { id: 0x12, name: '音乐喷泉-螺旋-线性' },
    ],
  },
  // 特效样式输入事件
  vfxModeInput: function (e) {
    let value = e.detail.value;
    if (value > 255) {
      value = 255;
    }
    this.setData({
      vfxMode: value
    });
  },
  // 特效样式选择事件
  vfxModePickerChange: function (e) {
    this.setData({
      vfxMode: e.detail.value
    });
  },
  // 缩放系数滑块事件
  scaleFactorSliderChange: function (e) {
    this.setData({
      vfxScaleFactor: e.detail.value
    });
  },
  // 色阶滑块事件
  lightnessSliderChange: function (e) {
    this.setData({
      vfxLightness: e.detail.value
    });
  },
  // 背光滑块事件
  backlightSliderChange: function (e) {
    this.setData({
      vfxBacklight: e.detail.value
    });
  },
  // 音频输入开关事件
  audioInputSwitchChange: function (e) {
    this.setData({
      vfxAudioInput: e.detail.value
    });
  },
  // 提交按钮事件
  submitBtn: function() {
    let that = this;

    wx.showLoading({
      title: '数据同步中',
      mask: true
    });

    let buffer = new ArrayBuffer(8);
    let dataView = new DataView(buffer);

    dataView.setUint8(0, 0xEF);
    dataView.setUint8(1, that.data.vfxMode);
    dataView.setUint8(2, that.data.vfxScaleFactor >> 8);
    dataView.setUint8(3, that.data.vfxScaleFactor & 0xFF);
    dataView.setUint8(4, that.data.vfxLightness >> 8);
    dataView.setUint8(5, that.data.vfxLightness & 0xFF);
    dataView.setUint8(6, that.data.vfxBacklight);
    dataView.setUint8(7, that.data.vfxAudioInput);

    // 写设备配置
    wx.writeBLECharacteristicValue({
      deviceId: that.data.devId,
      serviceId: serviceIdA,
      characteristicId: characteristicIdA,
      value: buffer,
      complete(res) {
        wx.hideLoading();
        console.log(res.errMsg);
      }
    });
  },
  // 重设按钮事件
  resetBtn: function () {
    let that = this;

    wx.showModal({
      title: '提示',
      content: '确认重设配置',
      showCancel: true,
      success: function (res) {
        if (res.confirm) {
          wx.showLoading({
            title: '数据同步中',
            mask: true
          });

          let buffer = new ArrayBuffer(1);
          let dataView = new DataView(buffer);

          dataView.setUint8(0, 0xEF);

          // 写重设命令
          wx.writeBLECharacteristicValue({
            deviceId: that.data.devId,
            serviceId: serviceIdA,
            characteristicId: characteristicIdA,
            value: buffer,
            success(res) {
              that.setData({
                recvMask: 0x2
              });
              // 回读新配置
              wx.readBLECharacteristicValue({
                deviceId: that.data.devId,
                serviceId: serviceIdA,
                characteristicId: characteristicIdA,
                complete(res) {
                  console.log(res.errMsg);
                }
              });
            },
            complete(res) {
              console.log(res.errMsg);
            }
          });
        }
      }
    });
  },
  // 页面加载事件
  onLoad: function(e) {
    let that = this;

    that.setData({
      devId: e.devId,
    });

    wx.showLoading({
      title: '数据同步中',
      mask: true
    });

    wx.closeBluetoothAdapter({
      // 关闭蓝牙适配器完成
      complete(res) {
        console.log(res.errMsg);
        wx.openBluetoothAdapter({
          // 打开蓝牙适配器成功
          success(res) {
            wx.createBLEConnection({
              deviceId: that.data.devId,
              // 创建BLE连接成功
              success(res) {
                // 读设备配置
                wx.readBLECharacteristicValue({
                  deviceId: that.data.devId,
                  serviceId: serviceIdA,
                  characteristicId: characteristicIdA,
                  complete(res) {
                    console.log(res.errMsg);
                  }
                });
                // 读固件版本
                wx.readBLECharacteristicValue({
                  deviceId: that.data.devId,
                  serviceId: serviceIdB,
                  characteristicId: characteristicIdB,
                  fail(res) {
                    wx.hideLoading();
                    wx.showModal({
                      title: '提示',
                      content: '不支持该设备',
                      showCancel: false,
                      success: function (res) {
                        that.setData({
                          cancelled: true
                        });
                        wx.navigateBack({
                          delta: 1
                        });
                      }
                    });
                  },
                  complete(res) {
                    console.log(res.errMsg);
                  }
                });
                // 数据到达回调
                wx.onBLECharacteristicValueChange(function (res) {
                  // 设备配置信息
                  if (res.characteristicId == characteristicIdA) {
                    let data = new Uint8Array(res.value);
                    /*
                        BTT0: VFX Enabled
                        BIT1: Backlight Enabled
                        BIT2: Cube Mode Enabled
                        BIT3: Audio Input Enabled
                    */
                    if (data[0] & 0x01) {
                      that.setData({
                        devHasVfx: true,
                        vfxMode: data[1],
                        vfxScaleFactor: data[2] << 8 | data[3],
                        vfxLightness: data[4] << 8 | data[5]
                      });
                    }
                    if (data[0] & 0x02) {
                      that.setData({
                        devHasBlk: true,
                        vfxBacklight: data[6]
                      });
                    }
                    if (data[0] & 0x04) {
                      that.setData({
                        devIsCube: true
                      });
                    }
                    if (data[0] & 0x08) {
                      that.setData({
                        devHasAin: true
                      });
                      if (data[7]) {
                        that.setData({
                          vfxAudioInput: true
                        });
                      }
                    }
                    that.setData({
                      recvMask: that.data.recvMask | 0x1
                    });
                  }
                  // 固件版本信息
                  if (res.characteristicId == characteristicIdB) {
                    that.setData({
                      devVer: util.ab2str(res.value),
                      recvMask: that.data.recvMask | 0x2
                    });
                  }
                  // 数据接收完毕
                  if (that.data.recvMask == 0x3) {
                    wx.hideLoading();
                  }
                });
              },
              // 创建BLE连接失败
              fail: function (res) {
                wx.hideLoading();
                wx.showModal({
                  title: '提示',
                  content: '无法连接到设备',
                  showCancel: false,
                  success: function (res) {
                    wx.navigateBack({
                      delta: 1
                    });
                  }
                });
              },
              // 创建BLE连接完成
              complete(res) {
                console.log(res.errMsg);
              }
            });
            // BLE链路状态回调
            wx.onBLEConnectionStateChange(function (res) {
              // 链路中断
              if (that.data.cancelled == false && res.connected == false) {
                wx.hideLoading();
                wx.showModal({
                  title: '提示',
                  content: '与设备连接中断',
                  showCancel: false,
                  success: function (res) {
                    wx.navigateBack({
                      delta: 1
                    });
                  }
                });
              }
            });
          },
          // 打开蓝牙适配器失败
          fail: function (res) {
            wx.hideLoading();
            wx.showModal({
              title: '提示',
              content: '请检查手机蓝牙是否打开',
              showCancel: false,
              success: function (res) {
                wx.navigateBack({
                  delta: 1
                });
              }
            });
          },
          // 打开蓝牙适配器完成
          complete(res) {
            console.log(res.errMsg);
          }
        });
      }
    });
  },
  // 页面卸载事件
  onUnload: function () {
    this.setData({
      cancelled: true
    });
    wx.closeBLEConnection({
      deviceId: this.data.devId,
      complete(res) {
        console.log(res.errMsg);
      }
    });
    wx.closeBluetoothAdapter({
      complete(res) {
        console.log(res.errMsg);
      }
    });
  }
});