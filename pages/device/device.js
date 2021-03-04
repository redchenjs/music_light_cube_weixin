// device.js

import { ab2str, str2ab } from '../../utils/util.js';

const TX_BUF_SIZE = 509;

// 固件更新服务
const otaServiceId = '0000FF52-0000-1000-8000-00805F9B34FB';
const otaCharacteristicId = '00005201-0000-1000-8000-00805F9B34FB';
// 设备配置服务
const vfxServiceId = '0000FF53-0000-1000-8000-00805F9B34FB';
const vfxCharacteristicId = '00005301-0000-1000-8000-00805F9B34FB';

Page({
  data: {
    devId: '读取中...',
    devVer: '读取中...',
    otaRun: false,
    otaTimer: 0,
    dataPath: '',
    dataSize: 0,
    dataDone: 0,
    dataProg: 0,
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
  vfxModeInput(e) {
    let value = e.detail.value;
    if (value > 255) {
      value = 255;
    }
    this.setData({
      vfxModeIdx: value
    });
  },
  // 特效样式选择事件
  vfxModePickerChange(e) {
    this.setData({
      vfxModeIdx: e.detail.value
    });
  },
  // 缩放系数滑块事件
  scaleFactorSliderChange(e) {
    this.setData({
      vfxScaleFactor: e.detail.value
    });
  },
  // 亮度滑块事件
  lightnessSliderChange(e) {
    this.setData({
      vfxLightness: e.detail.value
    });
  },
  // 背光滑块事件
  backlightSliderChange(e) {
    this.setData({
      vfxBacklight: e.detail.value
    });
  },
  // 音频输入开关事件
  audioInputSwitchChange(e) {
    this.setData({
      vfxAudioInput: e.detail.value
    });
  },
  // 提交按钮事件
  submitBtn() {
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
      success(res) {
        wx.hideLoading({
          complete(res) { /* empty statement */ }
        });
      },
      fail(res) {
        if (!that.data.cancelled) {
          wx.hideLoading({
            success(res) {
              wx.showModal({
                title: '提示',
                content: '数据同步失败',
                showCancel: false,
                success(res) {
                  wx.navigateBack({
                    delta: 1
                  });
                }
              });
            },
            fail(res) { /* empty statement */ }
          });
        }
      },
      complete(res) {
        console.log(res.errMsg);
      }
    });
  },
  // 重设按钮事件
  resetBtn() {
    let that = this;

    wx.showModal({
      title: '提示',
      content: '确认重设配置',
      showCancel: true,
      success(res) {
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
                recvMask: 0x1
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
            fail(res) {
              if (!that.data.cancelled) {
                wx.hideLoading({
                  success(res) {
                    wx.showModal({
                      title: '提示',
                      content: '数据同步失败',
                      showCancel: false,
                      success(res) {
                        wx.navigateBack({
                          delta: 1
                        });
                      }
                    });
                  },
                  fail(res) { /* empty statement */ }
                });
              }
            },
            complete(res) {
              console.log(res.errMsg);
            }
          });
        }
      }
    });
  },
  // OTA数据处理函数
  otaExec(e) {
    let that = this;

    if (!that.data.cancelled) {
      console.log('<= ' + ab2str(e));
    } else {
      return;
    }

    if (ab2str(e) === 'OK\r\n') {
      wx.showLoading({
        title: '固件升级中',
        mask: true
      });

      let dataSent = true;
      that.setData({
        otaTimer: setInterval(function () {
          if (dataSent) {
            dataSent = false;
          } else {
            return;
          }

          let dataLeft = that.data.dataSize - that.data.dataDone;
          let dataRead = (dataLeft >= TX_BUF_SIZE) ? TX_BUF_SIZE : dataLeft;

          if (dataLeft != 0) {
            // 发送OTA数据
            wx.writeBLECharacteristicValue({
              deviceId: that.data.devId,
              serviceId: otaServiceId,
              characteristicId: otaCharacteristicId,
              value: str2ab(wx.getFileSystemManager().readFileSync(that.data.dataPath, 'binary', that.data.dataDone, dataRead)),
              success(res) {
                dataSent = true;
              }
            });
          } else {
            clearInterval(that.data.otaTimer);
          }

          that.setData({
            dataDone: that.data.dataDone + dataRead,
            dataProg: that.data.dataDone * 100 / that.data.dataSize
          });
        }, 5)
      });
    } else if (ab2str(e) === 'DONE\r\n') {
      wx.hideLoading({
        success(res) {
          wx.showModal({
            title: '提示',
            content: '固件升级成功',
            showCancel: false,
            success(res) {
              that.setData({
                otaRun: false
              });
              // 发送重启设备命令
              let otaCmd = 'FW+RST!\r\n';
              console.log('=> ' + otaCmd);
              wx.writeBLECharacteristicValue({
                deviceId: that.data.devId,
                serviceId: otaServiceId,
                characteristicId: otaCharacteristicId,
                value: str2ab(otaCmd),
                complete(res) {
                  console.log(res.errMsg);
                }
              });
            }
          });
        },
        fail(res) { /* empty statement */ }
      });
    } else if (ab2str(e) === 'FAIL\r\n') {
      clearInterval(that.data.otaTimer);
      wx.hideLoading({
        success(res) {
          wx.showModal({
            title: '提示',
            content: '设备未就绪',
            showCancel: false,
            success(res) {
              that.setData({
                otaRun: false
              });
            }
          });
        },
        fail(res) { /* empty statement */ }
      });
    } else if (ab2str(e) === 'ERROR\r\n') {
      clearInterval(that.data.otaTimer);
      wx.hideLoading({
        success(res) {
          wx.showModal({
            title: '提示',
            content: '固件写入失败',
            showCancel: false,
            success(res) {
              that.setData({
                otaRun: false
              });
              wx.navigateBack({
                delta: 1
              });
            }
          });
        },
        fail(res) { /* empty statement */ }
      });
    }
  },
  // 选项按钮事件
  optionBtn() {
    let that = this;

    wx.showActionSheet({
      itemList: ['固件升级', '重启设备'],
      success(res) {
        switch (res.tapIndex) {
          case 0: // 固件升级
            wx.chooseMessageFile({
              count: 1,
              type: 'file',
              success(res) {
                that.setData({
                  dataPath: res.tempFiles[0].path,
                  dataSize: res.tempFiles[0].size,
                  dataDone: 0,
                  dataProg: 0
                });

                wx.showModal({
                  title: '提示',
                  content: '确认升级固件',
                  showCancel: true,
                  success(res) {
                    if (res.confirm) {
                      wx.showLoading({
                        title: '等待设备就绪',
                        mask: true
                      });

                      that.setData({
                        otaRun: true
                      });

                      // 发送固件升级命令
                      let otaCmd = 'FW+UPD:' + that.data.dataSize + '\r\n';
                      console.log('=> ' + otaCmd);
                      wx.writeBLECharacteristicValue({
                        deviceId: that.data.devId,
                        serviceId: otaServiceId,
                        characteristicId: otaCharacteristicId,
                        value: str2ab(otaCmd),
                        complete(res) {
                          console.log(res.errMsg);
                        }
                      });
                    }
                  }
                });
              }
            });
            break;
          case 1: // 重启设备
            wx.showModal({
              title: '提示',
              content: '确认重启设备',
              showCancel: true,
              success(res) {
                if (res.confirm) {
                  // 发送重启设备命令
                  let otaCmd = 'FW+RST!\r\n';
                  console.log('=> ' + otaCmd);
                  wx.writeBLECharacteristicValue({
                    deviceId: that.data.devId,
                    serviceId: otaServiceId,
                    characteristicId: otaCharacteristicId,
                    value: str2ab(otaCmd),
                    complete(res) {
                      console.log(res.errMsg);
                    }
                  });
                }
              }
            });
            break;
          default:
            break;
        }
      }
    });
  },
  // 页面加载事件
  onLoad(e) {
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
        // 设置MTU大小
        wx.setBLEMTU({
          deviceId: that.data.devId,
          mtu: TX_BUF_SIZE + 3,
          complete(res) {
            console.log(res.errMsg);
          }
        });
        // 启用OTA服务通知
        wx.notifyBLECharacteristicValueChange({
          state: true,
          deviceId: that.data.devId,
          serviceId: otaServiceId,
          characteristicId: otaCharacteristicId,
          complete(res) {
            console.log(res.errMsg);
          }
        });
        // 读固件版本
        wx.readBLECharacteristicValue({
          deviceId: that.data.devId,
          serviceId: otaServiceId,
          characteristicId: otaCharacteristicId,
          success(res) {
            // 链路状态回调
            wx.onBLEConnectionStateChange(function (res) {
              if (!that.data.cancelled && !res.connected) {
                wx.hideLoading({
                  complete(res) {
                    wx.showModal({
                      title: '提示',
                      content: '与设备连接中断',
                      showCancel: false,
                      success(res) {
                        wx.navigateBack({
                          delta: 1
                        });
                      }
                    });
                  }
                });
              }
            });
          },
          fail(res) {
            if (!that.data.cancelled) {
              wx.hideLoading({
                success(res) {
                  wx.showModal({
                    title: '提示',
                    content: '不支持该设备',
                    showCancel: false,
                    success(res) {
                      wx.navigateBack({
                        delta: 1
                      });
                    }
                  });
                },
                fail(res) { /* empty statement */ }
              });
            }
          },
          complete(res) {
            console.log(res.errMsg);
          }
        });
        // 读设备配置
        wx.readBLECharacteristicValue({
          deviceId: that.data.devId,
          serviceId: vfxServiceId,
          characteristicId: vfxCharacteristicId,
          complete(res) {
            console.log(res.errMsg);
          }
        });
        // 数据到达回调
        wx.onBLECharacteristicValueChange(function (res) {
          // 固件版本信息
          if (res.characteristicId == otaCharacteristicId) {
            if (!that.data.otaRun) {
              that.setData({
                devVer: ab2str(res.value),
                recvMask: that.data.recvMask | 0x1
              });
            } else {
              that.otaExec(res.value);

              return;
            }
          }
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
                vfxModeIdx: that.data.vfxModeList.findIndex(function (e) { return e.id == data[1]; })
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
                devHasAin: true,
                vfxAudioInput: data[7]
              });
            }
            that.setData({
              recvMask: that.data.recvMask | 0x2
            });
          }
          // 数据接收完毕
          if (that.data.recvMask == 0x3) {
            wx.hideLoading({
              complete(res) { /* empty statement */ }
            });
          }
        });
      },
      // 创建BLE连接失败
      fail(res) {
        if (!that.data.cancelled) {
          wx.hideLoading({
            success(res) {
              wx.showModal({
                title: '提示',
                content: '无法连接到设备',
                showCancel: false,
                success(res) {
                  wx.navigateBack({
                    delta: 1
                  });
                }
              });
            },
            fail(res) { /* empty statement */ }
          });
        }
      },
      // 创建BLE连接完成
      complete(res) {
        console.log(res.errMsg);
      }
    });
  },
  // 页面卸载事件
  onUnload() {
    let that = this;

    that.setData({
      cancelled: true
    });

    wx.closeBLEConnection({
      deviceId: that.data.devId,
      complete(res) {
        console.log(res.errMsg);
      }
    });
  }
});