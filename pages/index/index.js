// index.js
// 获取应用实例
const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    prompt: '未连接',
    devList: [],
    navOpen: false,
    available: false,
    cancelled: false,
    discovering: false,
    buttonText: '搜索设备',
  },
  // 选取导航事件
  selectNav: function(e) {
    this.setData({
      navOpen: false
    });
    wx.navigateTo({
      url: '../device/device?devId=' + e.currentTarget.dataset.devId
    });
  },
  // 关闭导航事件
  closeNav: function() {
    this.setData({
      navOpen: false
    });
  },
  // 搜索按钮事件
  searchBtn: function() {
    let that = this;

    if (that.data.discovering == false) {
      wx.closeBluetoothAdapter({
        complete(res) {
          console.log(res.errMsg);
          wx.openBluetoothAdapter({
            success(res) {
              wx.onBluetoothAdapterStateChange(function (res) {
                that.setData({
                  available: res.available,
                  discovering: res.discovering,
                })
                if (that.data.available == false) {
                  that.setData({
                    prompt: '蓝牙已关闭',
                    buttonText: '搜索设备'
                  })
                } else {
                  if (that.data.discovering == false) {
                    if (that.data.cancelled == false) {
                      that.setData({
                        prompt: '搜索完成',
                        navOpen: true,
                        buttonText: '重新搜索'
                      })
                    } else {
                      that.setData({
                        prompt: '未连接',
                        buttonText: '搜索设备'
                      })
                    }
                  } else {
                    that.setData({
                      prompt: '搜索中...',
                      devList: [],
                      cancelled: false,
                      buttonText: '取消搜索'
                    })
                  }
                }
              })

              wx.startBluetoothDevicesDiscovery({
                allowDuplicatesKey: false,
                complete(res) {
                  console.log(res.errMsg);
                }
              })

              wx.onBluetoothDeviceFound(function (res) {
                that.setData({
                  devList: that.data.devList.concat(res.devices[0]),
                });
                wx.stopBluetoothDevicesDiscovery({
                  complete(res) {
                    console.log(res.errMsg);
                  }
                });
                wx.closeBluetoothAdapter({
                  complete(res) {
                    console.log(res.errMsg);
                  }
                });
              })
            },
            fail: function (res) {
              wx.showModal({
                title: '提示',
                content: '请检查手机蓝牙是否打开',
                showCancel: false,
                success: function (res) {
                  that.setData({
                    prompt: '蓝牙已关闭',
                    devList: [],
                    available: false,
                    cancelled: false,
                    discovering: false,
                  });
                }
              });
            },
            complete(res) {
              console.log(res.errMsg);
            }
          });
        }
      });
    } else {
      wx.stopBluetoothDevicesDiscovery({
        complete(res) {
          console.log(res.errMsg);
        }
      });
      wx.closeBluetoothAdapter({
        complete(res) {
          console.log(res.errMsg);
        }
      });
      that.setData({
        cancelled: true,
      });
    }
  },
});