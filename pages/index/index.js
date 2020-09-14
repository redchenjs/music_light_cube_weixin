// index.js
// 获取应用实例
const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    prompt: '未连接',
    devList: [],
    navOpen: false,
    discovering: false,
    buttonText: '搜索设备'
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
    let that = this;

    wx.stopBluetoothDevicesDiscovery({
      complete(res) {
        console.log(res.errMsg);

        that.setData({
          navOpen: false,
          discovering: false
        });
      }
    });
  },
  // 搜索按钮事件
  searchBtn: function() {
    let that = this;

    if (!that.data.discovering) {
      wx.closeBluetoothAdapter({
        // 关闭蓝牙适配器完成
        complete(res) {
          console.log(res.errMsg);
          wx.openBluetoothAdapter({
            // 打开蓝牙适配器成功
            success(res) {
              that.setData({
                discovering: true
              });
              wx.startBluetoothDevicesDiscovery({
                allowDuplicatesKey: false,
                complete(res) {
                  console.log(res.errMsg);
                }
              });
              // 设备发现回调
              wx.onBluetoothDeviceFound(function(res) {
                that.setData({
                  navOpen: true,
                  devList: that.data.devList.concat(res.devices[0])
                });
              });
              // 适配器状态回调
              wx.onBluetoothAdapterStateChange(function(res) {
                if (!res.available) {
                  that.setData({
                    prompt: '蓝牙已关闭',
                    devList: [],
                    navOpen: false,
                    discovering: false,
                    buttonText: '搜索设备'
                  });
                } else {
                  if (!res.discovering) {
                    that.setData({
                      prompt: '未连接',
                      devList: [],
                      navOpen: false,
                      buttonText: '搜索设备'
                    });
                  } else {
                    that.setData({
                      prompt: '搜索中...',
                      devList: [],
                      navOpen: false,
                      buttonText: '取消搜索'
                    });
                  }
                }
              });
            },
            // 打开蓝牙适配器失败
            fail: function(res) {
              wx.showModal({
                title: '提示',
                content: '请检查本机蓝牙是否打开',
                showCancel: false,
                success: function(res) {
                  that.setData({
                    prompt: '蓝牙已关闭',
                    devList: [],
                    discovering: false
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
    } else {
      wx.stopBluetoothDevicesDiscovery({
        complete(res) {
          console.log(res.errMsg);

          that.setData({
            discovering: false
          });
        }
      });
    }
  },
  // 页面隐藏事件
  onHide: function() {
    let that = this;

    if (that.data.discovering) {
      wx.stopBluetoothDevicesDiscovery({
        complete(res) {
          console.log(res.errMsg);

          that.setData({
            navOpen: false,
            discovering: false
          });
        }
      });
    }
  },
  // 页面卸载事件
  onUnload: function() {
    wx.stopBluetoothDevicesDiscovery({
      complete(res) {
        console.log(res.errMsg);

        wx.closeBluetoothAdapter({
          complete(res) {
            console.log(res.errMsg);
          }
        });
      }
    });
  }
});