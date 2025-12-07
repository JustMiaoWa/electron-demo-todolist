import { nanoid } from '../../node_modules/nanoid/nanoid.js';
var app = new Vue({
  el: '#app',
  data() {
    return {
      status: '0',
      message: 'Hello Vue!',
      today: '',
      todoList: [], // 保存待办事项列表
      redoList: [], // 保存已完成事项列表
      dialogFormVisible: false, // 控制添加事项对话框的显示与隐藏
      form: {
        name: '', // 事项名称
        time: '', // 事项时间
        status: '0' // 事项状态，0表示未完成，1表示已完成
      }
    }
  },
  mounted() {
    this.today = this.getCurrentDate();
    this.initData(); // 初始化数据
    this.refreshTableList(); // 刷新表格数据
  },
  methods: {
    closeDailog(){
      this.dialogFormVisible = false
      this.form = {
        name: '', // 事项名称
        time: '', // 事项时间
        status: '0' // 事项状态，0表示未完成，1表示已完成
      }
    },
    submitForm(){
      let data = JSON.parse(localStorage.getItem('data'))
      data.push({
        id: nanoid(),
        name: this.form.name,
        time: this.form.time,
        status: this.form.status
      })
      localStorage.setItem('data',JSON.stringify(data))
      this.refreshTableList() // 刷新表格数据
      // console.log(window.api)
      window.api.startTask(this.form.time, this.form.name)
      this.closeDailog();
    },
    initData(){
      let data = [
        {
          id:'1',
          name: '睡觉',
          time: '22:00:00',
          status: '0'   // 0:未完成 1:已完成
        },
        {
          id:'2',
          name: '洗衣服',
          time: '21:30:00',
          status: '0'   // 0:未完成 1:已完成
        },
        {
          id:'3',
          name: '吃饭',
          time: '17:30:00',
          status: '0'   // 0:未完成 1:已完成
        }
      ]
      localStorage.setItem('data',JSON.stringify(data))
    },
    refreshTableList(){
      this.$set(this, 'todoList', JSON.parse(localStorage.getItem('data')).filter(item => item.status === '0'))
      this.$set(this, 'redoList', JSON.parse(localStorage.getItem('data')).filter(item => item.status === '1'))
      // this.todoList = JSON.parse(localStorage.getItem('data')).filter(item => item.status == '0')
      // this.redoList = JSON.parse(localStorage.getItem('data')).filter(item => item.status == '1')
      // console.log(this.todoList)
    },
    getCurrentDate() {
      let now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth() + 1;
      let day = now.getDate();
      return year + '/' + month + '/' + day;
    },
    closeWindow: function() {
      window.api.closeWindow();
    },
    // 删除
    deleteItem: function(id) {
      this.$confirm('此操作将永久删除该任务, 是否继续?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          let data = JSON.parse(localStorage.getItem('data'))
          data = data.filter(item => item.id != id)
          localStorage.setItem('data',JSON.stringify(data))
          this.refreshTableList()
          this.$message({
            type: 'success',
            message: '删除成功!'
          });
        }).catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除'
          });          
        });
    },
    // 完成
    compeleteItem: function(id) {
      console.log(id)
      let data = JSON.parse(localStorage.getItem('data'))
      data.forEach(item => {
        if(item.id === id){
          item.status = '1'
        }
      })
      localStorage.setItem('data',JSON.stringify(data))
      this.refreshTableList()
    }
  }
})