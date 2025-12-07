const path = require('path')
//引入两个模块：app 和 BrowserWindow

//app 模块，控制整个应用程序的事件生命周期。
//BrowserWindow 模块，它创建和管理程序的窗口。

const iconPath = path.join(__dirname, './public/logo.png')   //应用运行时的标题栏图标
const { app, BrowserWindow, Tray, Menu, ipcMain, globalShortcut, screen } = require('electron')

let mainWindow = null //主窗口
let tray = null //系统托盘图标
let remindWindow = null //提醒窗口
function createTray() {
  tray = new Tray(iconPath)
  const contenxtMenu = Menu.buildFromTemplate([
    {
      label: '显示主界面',
      click: () => {
        mainWindow.show()
      }
    },
    {
      label: '退出',
      click: () => {
        app.isQuiting = true
        app.quit()
      }
    }
  ])
  tray.setToolTip('todo-list')
  tray.setContextMenu(contenxtMenu)
  tray.on('click', () => {
    if (mainWindow.isVisible()) mainWindow.hide()
    else mainWindow.show()
  })
}


//在 Electron 中，只有在 app 模块的 ready 事件被激发后才能创建浏览器窗口
app.on('ready', () => {

  //创建一个窗口
  mainWindow = new BrowserWindow({
    frame: false, //隐藏默认的标题栏
    resizable: true, //禁止窗口缩放
    width: 1200,
    height: 700,
    icon: iconPath, //应用运行时的标题栏图标
    webPreferences: {
      nodeIntegration: true, //允许渲染进程使用node
      backgroundThrottling: true, //允许窗口在后台运行
      contextIsolation: true, //启用上下文隔离
      enableRemoteModule: true, //允许渲染进程使用remote模块
      webSecurity: false, //允许渲染进程使用node
      preload: path.join(__dirname, './preload.js') //预加载脚本，在渲染进程加载前执行
    }
  })
  
  //窗口加载html文件
  mainWindow.loadFile('./src/main.html')
  mainWindow.removeMenu() //隐藏默认的菜单栏
  // 点击关闭时，隐藏窗口而不是关闭
  // mainWindow.on('close', (e) => {
  //   if(!app.isQuiting) {
  //     e.preventDefault()
  //     mainWindow.hide()
  //   }
  // })
  // 注册快捷键打开控制台
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    mainWindow.webContents.openDevTools();
  });
  createTray()  //创建系统托盘图标

  ipcMain.on('closeWindow',()=> {
    mainWindow.hide()
  })

  ipcMain.on('startTask', (event, timeString, task) => {
    console.log('event,task:', timeString, task);
    const now = new Date();

    // timeString 格式："HH:mm:00"
    const parts = timeString.split(':');
    if (parts.length !== 3) {
      console.error("时间格式错误，应为 HH:mm:00，收到：", timeString);
      return;
    }

    const hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);
    const second = parseInt(parts[2], 10);

    // 使用今天的日期 + 传入的时分秒构造目标时间
    let targetTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour,
      minute,
      second
    );

    // 计算延迟
    let delay = targetTime.getTime() - now.getTime();

    // 如果时间已过，自动推到明天
    if (delay < 0) {
      targetTime.setDate(targetTime.getDate() + 1);
      delay = targetTime.getTime() - now.getTime();
    }

    console.log("当前时间：", now.toLocaleString());
    console.log("目标时间：", targetTime.toLocaleString());
    console.log("延迟毫秒：", delay);

    setTimeout(() => {
      // 这里替换为你自己的提醒窗口函数
      createRemindWindow(task);
    }, delay);
  })


  let remindWindow = null
  let autoCloseTimer = null

  function createRemindWindow(task) {
    if (remindWindow) {
      remindWindow.close()
      remindWindow = null
    }

    remindWindow = new BrowserWindow({
      width: 360,
      height: 180,
      frame: false,
      resizable: false,
      alwaysOnTop: true,        // 永远置顶
      skipTaskbar: true,        // 不显示在任务栏
      transparent: true,        // 透明背景
      movable: true,            // 允许拖动
      focusable: true,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js')
      }
    })

    // 放到右下角
    const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
    const { width, height } = remindWindow.getBounds()

    // 右下角
    const x = sw - width - 20
    const y = sh - height - 20

remindWindow.setPosition(x, y)

    remindWindow.setAlwaysOnTop(true, 'screen-saver')
    remindWindow.setVisibleOnAllWorkspaces(true)

    remindWindow.loadFile(path.join(__dirname, 'src/remind.html'))

    remindWindow.once('ready-to-show', () => {
      remindWindow.show()
    })

    // 任务名传递
    ipcMain.removeHandler('getTaskName')
    ipcMain.handle('getTaskName', () => task)

    // 关闭监听
    ipcMain.removeAllListeners('close-remind-window')
    ipcMain.on('close-remind-window', () => {
      if (remindWindow) {
        remindWindow.close()
        remindWindow = null
      }
    })

    // 自动关闭（30秒）
    clearTimeout(autoCloseTimer)
    autoCloseTimer = setTimeout(() => {
      if (remindWindow) {
        remindWindow.close()
        remindWindow = null
      }
    }, 30 * 1000)
  }

})