const { contextBridge, ipcRenderer } = require('electron')

// 暴露api给渲染进程、主进程
contextBridge.exposeInMainWorld('api', {
  closeWindow: () => ipcRenderer.send('closeWindow'),
  startTask: (time,task) => ipcRenderer.send('startTask', time, task),
  getTaskName: () => { return ipcRenderer.invoke('getTaskName') },
  closeRemind: () => ipcRenderer.send('close-remind-window')
})