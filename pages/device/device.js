// device.js

import { ab2str } from '../../utils/util.js';

// 固件更新服务
const otaServiceId = '0000FF52-0000-1000-8000-00805F9B34FB';
const otaCharacteristicId = '00005201-0000-1000-8000-00805F9B34FB';
// 设备配置服务
const vfxServiceId = '0000FF53-0000-1000-8000-00805F9B34FB';
const vfxCharacteristicId = '00005301-0000-1000-8000-00805F9B34FB';

Page({
  data: {
    devId: '',
    devVer: '',
    recvMask: 0x0,
    cancelled: false,
    devHasVfx: false,
    devIsCube: false,
    devHasBlk: false,
    devHasAin: false,
    vfxModeIdx: 0x0,
    vfxScaleFactor: 0x0,
    vfxLightness: 0x0,
    vfxBacklight: 0x0,
    vfxAudioInput: false,
    vfxModeList: [
      { id: 0x00, name: '随机' },
      { id: 0x01, name: '彩虹' },
      { id: 0x02, name: '彩带' },
      { id: 0x03, name: '渐变' },
      { id: 0x04, name: '呼吸' },
      { id: 0x05, name: '星空-紫红' },
      { id: 0x06, name: '星空-黄绿' },
      { id: 0x07, name: '星空-青蓝' },
      { id: 0x08, name: '数字-固定' },
      { id: 0x09, name: '数字-滚动' },
      { id: 0x0A, name: '魔毯' },
      { id: 0x0B, name: '旋转曲面-正' },
      { id: 0x0C, name: '旋转曲面-反' },
      { id: 0x0D, name: '音乐喷泉-静态-线性' },
      { id: 0x0E, name: '音乐喷泉-渐变-线性' },
      { id: 0x0F, name: '音乐喷泉-螺旋-线性' },
      { id: 0x10, name: '音乐喷泉-静态-对数' },
      { id: 0x11, name: '音乐喷泉-渐变-对数' },
      { id: 0x12, name: '音乐喷泉-螺旋-对数' },
      { id: 0xFE, name: '暂停' },
      { id: 0xFF, name: '关闭' }
    ]
  },
  // 特效样式输入事件
  vfxModeInput: function(e) {
    let value = e.detail.value;
    if (value > 255) {
      value = 255;
    }
    this.setData({
      vfxModeIdx: value
    });
  },
  // 特效样式选择事件
  vfxModePickerChange: function(e) {
    this.setData({
      vfxModeIdx: e.detail.value
    });
  },
  // 缩放系数滑块事件
  scaleFactorSliderChange: function(e) {
    this.setData({
      vfxScaleFactor: e.detail.value
    });
  },
  // 亮度滑块事件
  lightnessSliderChange: function(e) {
    this.setData({
      vfxLightness: e.detail.value
    });
  },
  // 背光滑块事件
  backlightSliderChange: function(e) {
    this.setData({
      vfxBacklight: e.detail.value
    });
  },
  // 音频输入开关事件
  audioInputSwitchChange: function(e) {
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
    if (that.data.devIsCube) {
      dataView.setUint8(1, that.data.vfxModeList[that.data.vfxModeIdx].id);
    } else {
      dataView.setUint8(1, that.data.vfxModeIdx);
    }
    dataView.setUint8(2, that.data.vfxScaleFactor >> 8);
    dataView.setUint8(3, that.data.vfxScaleFactor & 0xFF);
    dataView.setUint8(4, that.data.vfxLightness >> 8);
    dataView.setUint8(5, that.data.vfxLightness & 0xFF);
    dataView.setUint8(6, that.data.vfxBacklight);
    dataView.setUint8(7, that.data.vfxAudioInput);

    // 写设备配置
    wx.writeBLECharacteristicValue({
      deviceId: that.data.devId,
      serviceId: vfxServiceId,
      characteristicId: vfxCharacteristicId,
      value: buffer,
      complete(res) {
        wx.hideLoading();
        console.log(res.errMsg);
      }
    });
  },
  // 重设按钮事件
  resetBtn: function() {
    let that = this;

    wx.showModal({
      title: '提示',
      content: '确认重设配置',
      showCancel: true,
      success: function(res) {
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
            serviceId: vfxServiceId,
            characteristicId: vfxCharacteristicId,
            value: buffer,
            success(res) {
              that.setData({
                recvMask: 0x2
              });
              // 回读新配置
              wx.readBLECharacteristicValue({
                deviceId: that.data.devId,
                serviceId: vfxServiceId,
                characteristicId: vfxCharacteristicId,
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
      devId: e.devId
    });

    wx.showLoading({
      title: '数据同步中',
      mask: true
    });

    wx.createBLEConnection({
      deviceId: that.data.devId,
      // 创建BLE连接成功
      success(res) {
        // 读设备配置
        wx.readBLECharacteristicValue({
          deviceId: that.data.devId,
          serviceId: vfxServiceId,
          characteristicId: vfxCharacteristicId,
          complete(res) {
            console.log(res.errMsg);
          }
        });
        // 读固件版本
        wx.readBLECharacteristicValue({
          deviceId: that.data.devId,
          serviceId: otaServiceId,
          characteristicId: otaCharacteristicId,
          fail(res) {
            wx.hideLoading();
            wx.showModal({
              title: '提示',
              content: '不支持该设备',
              showCancel: false,
              success: function(res) {
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
        wx.onBLECharacteristicValueChange(function(res) {
          // 设备配置信息
          if (res.characteristicId == vfxCharacteristicId) {
            let data = new Uint8Array(res.value);
            /*
                BTT0: VFX Enabled
                BIT1: Cube Mode Enabled
                BIT2: Backlight Enabled
                BIT3: Audio Input Enabled
            */
            if (data[0] & 0x01) {
              that.setData({
                devHasVfx: true,
                vfxScaleFactor: data[2] << 8 | data[3],
                vfxLightness: data[4] << 8 | data[5]
              });
            }
            if (data[0] & 0x02) {
              that.setData({
                devIsCube: true,
                vfxModeIdx: that.data.vfxModeList.findIndex(function(e) {return e.id == data[1];})
              });
            } else {
              that.setData({
                vfxModeIdx: data[1]
              });
            }
            if (data[0] & 0x04) {
              that.setData({
                devHasBlk: true,
                vfxBacklight: data[6]
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
          if (res.characteristicId == otaCharacteristicId) {
            that.setData({
              devVer: ab2str(res.value),
              recvMask: that.data.recvMask | 0x2
            });
          }
          // 数据接收完毕
          if (that.data.recvMask == 0x3) {
            wx.hideLoading();
          }
        });
      },
      // 创建BLE连接完成
      complete(res) {
        console.log(res.errMsg);
      }
    });
    // BLE链路状态回调
    wx.onBLEConnectionStateChange(function(res) {
      // 链路中断
      if (!that.data.cancelled && !res.connected) {
        wx.hideLoading({
          complete: function(res) {/* empty statement */}
        });

        wx.showModal({
          title: '提示',
          content: '与设备连接中断',
          showCancel: false,
          success: function(res) {
            wx.navigateBack({
              delta: 1
            });
          }
        });
      }
    });
  },
  // 页面卸载事件
  onUnload: function() {
    this.setData({
      cancelled: true
    });
    wx.closeBLEConnection({
      deviceId: this.data.devId,
      complete(res) {
        console.log(res.errMsg);
      }
    });
  }
});