<template>
  <a-modal
    :maskClosable="false"
    :title="id ? '编辑处方' : '新建处方'"
    :width="840"
    :visible="visible"
    :confirmLoading="loading"
    @ok="() => { $emit('ok') }"
    @cancel="() => { $emit('cancel') }"
  >
    <a-spin :spinning="loading">
      <a-form :form="form" v-bind="formLayout">
        <!-- 检查是否有 id 并且大于0，大于0是修改。其他是新增，新增不显示主键ID -->
        <a-form-item v-show="model && model.id > 0" label="主键ID">
          <a-input disabled v-decorator="['id', { initialValue: 0 }]" disabled />
        </a-form-item>
        <a-form-item label="用户名">
          <a-input disabled v-decorator="['username']" placeholder="无" />
        </a-form-item>
        <a-form-item label="用户姓名">
          <a-input disabled v-decorator="['name']" placeholder="无" />
        </a-form-item>
        <a-form-item label="用户头像">
          <img style="width: 200px;height: 200px;margin-bottom: 12px" v-if="model && model.avatar" :src="baseUrl + model.avatar" alt="avatar">
          <a-input disabled v-decorator="['avatar']" placeholder="无" v-else />
        </a-form-item>
        <a-form-item label="用户背景图">
          <img style="width: 500px;height: 300px;margin-bottom: 12px" v-if="model && model.background" :src="baseUrl + model.background" alt="background">
          <a-input disabled v-decorator="['background']" placeholder="无" v-else />
        </a-form-item>
        <a-form-item label="用户性别">
          <a-select disabled v-decorator="['gender']" placeholder="无">
            <a-select-option value="0">女</a-select-option>
            <a-select-option value="1">男</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="用户手机号">
          <a-input disabled v-decorator="['phone']" placeholder="无" />
        </a-form-item>
        <a-form-item label="用户身份">
          <a-select disabled v-decorator="['identity']" placeholder="无">
            <a-select-option value="0">患者</a-select-option>
            <a-select-option value="1">医师</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="用户认证">
          <a-select disabled v-decorator="['authenticate']" placeholder="无">
            <a-select-option value="0">未通过认证</a-select-option>
            <a-select-option value="1">已通过认证</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="是否有讲师权限">
          <a-select disabled v-decorator="['if_lecture_auth']" placeholder="无">
            <a-select-option value="0">否</a-select-option>
            <a-select-option value="1">有</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="用户微信昵称">
          <a-input disabled v-decorator="['wx_nickname']" placeholder="无" />
        </a-form-item>
        <a-form-item label="最近登录时间">
          <a-input disabled v-decorator="['recent_login_time']" placeholder="无" />
        </a-form-item>
        <a-form-item label="是否为admin权限">
          <a-select disabled v-decorator="['is_admin']" placeholder="无">
            <a-select-option value="0">否</a-select-option>
            <a-select-option value="1">是</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="冻结原因">
          <a-input disabled v-decorator="['freeze_reason']" placeholder="无" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select disabled v-decorator="['status']"  placeholder="无">
            <a-select-option value="1">正常</a-select-option>
            <a-select-option value="0">冻结</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script>
import pick from 'lodash.pick'

// 表单字段
const fields = ['id', 'name', 'username', 'avatar', 'background', 'gender', 'phone', 'identity', 'authenticate', 'if_lecture_auth', 'wx_nickname', 'recent_login_time', 'is_admin', 'freeze_reason', 'status', 'created_at']

export default {
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    loading: {
      type: Boolean,
      default: () => false
    },
    model: {
      type: Object,
      default: () => null
    }
  },
  data () {
    this.formLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 7 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 13 }
      }
    }
    return {
      form: this.$form.createForm(this),
      fileList: [],
      fileListImg: [],
      uploading: false,
      videoUrl: '',
      coverUrl: '',
      coverBlob: null,
      baseUrl: process.env.VUE_APP_API_BASE_URL + '/',
      id: '',
      modelIn: {}
    }
  },
  created () {
    console.log('custom modal created')

    // 防止表单未注册
    fields.forEach(v => this.form.getFieldDecorator(v))
  },
  watch : {
    visible(){
      if (!this.visible){
        this.videoUrl = ''
        this.coverUrl = ''
        this.fileList = []
        this.fileListImg = []
        this.coverBlob = null
        this.id = ''
      }
    },
    model: {
      handler(){
        this.model && this.form.setFieldsValue(pick(this.model, fields))
        console.log('model', this.model)
        this.$nextTick(()=>{
          this.id = this.form.getFieldValue('id')
        })
      },
      deep: true
    }
  },
  methods: {
    show(record){
      this.visible = true
      this.modelIn = {...record}
    },
    handleRemove(file) {
      const index = this.fileList.indexOf(file);
      const newFileList = this.fileList.slice();
      newFileList.splice(index, 1);
      this.fileList = newFileList;
      this.videoUrl = ''
      this.form.setFieldsValue({prescription_video: null})
      if(!this.fileListImg.length){
        this.coverUrl = ''
        this.form.setFieldsValue({cover: null})
        this.coverBlob = null
      }
    },
    beforeUpload(file) {
      console.log('file', file)
      this.fileList = [...this.fileList, file];
      if(!this.fileListImg.length){
        this.form.setFieldsValue({cover: null})
      }
      this.form.setFieldsValue({prescription_video: file})
      this.videoUrl = URL.createObjectURL(file)
      return false;
    },
    handleRemoveImg(file) {
      const index = this.fileListImg.indexOf(file);
      const newFileList = this.fileListImg.slice();
      newFileList.splice(index, 1);
      this.fileListImg = newFileList;
      this.coverUrl = ''
      this.coverBlob = null
      this.form.setFieldsValue({cover: null})
      if (this.fileList.length){
        this.videoUrl = URL.createObjectURL(this.form.getFieldValue('prescription_video'))
      }
    },
    beforeUploadImg(file) {
      console.log('file', file)
      this.fileListImg = [...this.fileListImg, file];
      this.form.setFieldsValue({cover: file})
      this.coverUrl = URL.createObjectURL(file)
      return false;
    },
    createPreImg(event) {  // event js原生事件
      if(this.fileListImg.length) return
      const videoEle = event.target; // 当前video dom节点

      videoEle.currentTime = 1; // 设置视频开始播放时间（因为有些手机第一帧显示黑屏，所以这里选取视频的第一秒作为封面）

      videoEle.addEventListener('canplay', () => { // 监听video的canplay事件

        // 创建canvas元素 并设置canvas大小等于video节点的大小
        const canvas = document.createElement('canvas');
        const scale = 0.8; // 压缩系数
        canvas.width = videoEle.videoWidth * scale;
        canvas.height = videoEle.videoHeight * scale;

        // canvas画图
        canvas.getContext('2d').drawImage(videoEle, 0, 0, canvas.width, canvas.height);

        // 把canvas转成base64编码格式
        this.coverUrl = canvas.toDataURL('image/jpeg', 0.5);

        canvas.toBlob((blob)=>{
          this.coverBlob = blob
          this.form.setFieldsValue({cover: {file: blob}})
        }, 'image/jpeg', 0.5);

        canvas.remove()
      });
    }
  }
}
</script>
