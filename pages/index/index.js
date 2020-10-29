// index.js

Page({
  data: {
    prompt: '未连接',
    devList: [],
    navOpen: false,
    discovering: false,
    buttonText: '搜索设备'
  },
  // 选取导航事件
  selectNav(e) {
    this.setData({
      navOpen: false
    });

    setTimeout(function () {
      wx.navigateTo({
        url: '../device/device?devId=' + e.currentTarget.dataset.devId
      });
    }, 300);
  },
  // 关闭导航事件
  closeNav() {
    let that = this;

    wx.stopBluetoothDevicesDiscovery({
      complete(res) {
        console.log(res.errMsg);

        that.setData({
          navOpen: false
        });
      }
    });
  },
  // 搜索按钮事件
  searchBtn() {
    let that = this;

    if (!that.data.discovering) {
      wx.closeBluetoothAdapter({
        // 关闭蓝牙适配器完成
        complete(res) {
          console.log(res.errMsg);
          wx.openBluetoothAdapter({
            // 打开蓝牙适配器成功
            success(res) {
              wx.startBluetoothDevicesDiscovery({
                allowDuplicatesKey: false,
                complete(res) {
                  console.log(res.errMsg);
                }
              });
              // 设备发现回调
              wx.onBluetoothDeviceFound(function (res) {
                that.setData({
                  navOpen: true,
                  devList: that.data.devList.concat(res.devices[0])
                });
              });
              // 适配器状态回调
              wx.onBluetoothAdapterStateChange(function (res) {
                if (!res.available || !res.discovering) {
                  that.setData({
                    prompt: '未连接',
                    devList: [],
                    navOpen: false,
                    discovering: false,
                    buttonText: '搜索设备'
                  });
                } else {
                  that.setData({
                    prompt: '搜索中...',
                    devList: [],
                    navOpen: false,
                    discovering: true,
                    buttonText: '取消搜索'
                  });
                }
              });
            },
            // 打开蓝牙适配器失败
            fail(res) {
              wx.showModal({
                title: '提示',
                content: '请检查蓝牙开关是否打开',
                showCancel: false
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
        }
      });
    }
  },
  // 页面隐藏事件
  onHide() {
    let that = this;

    if (that.data.discovering) {
      wx.stopBluetoothDevicesDiscovery({
        complete(res) {
          console.log(res.errMsg);

          that.setData({
            navOpen: false
          });
        }
      });
    }
  },
  // 页面卸载事件
  onUnload() {
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