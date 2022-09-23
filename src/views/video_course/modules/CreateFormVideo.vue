<template>
  <a-modal
    :maskClosable="false"
    :title="id ? '编辑视频' : '新建视频'"
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
          <a-input v-decorator="['id', { initialValue: 0 }]" disabled />
        </a-form-item>
        <a-form-item label="视频标题">
          <a-input v-decorator="['title', {rules: [{required: true, min: 2, max: 12, message: '请输入至少2字符，最多14个字符'}]}]" placeholder="请输入视频标题" />
        </a-form-item>
        <a-form-item label="视频地址">
          <div style="color: #d6d6d6">支持视频格式文件，尽可能保证视频的清晰度，不要太大</div>
          <a-upload v-decorator="['source', {rules: [{required: true, message: '请上传视频'}]}]" accept="video/*" :file-list="fileList" :remove="handleRemove" :before-upload="beforeUpload">
            <a-button> <a-icon type="upload" /> 选择视频文件 </a-button>
          </a-upload>
        </a-form-item>
        <a-form-item label="视频封面">
          <div style="color: #D14748">注意：如果不上传，则默认使用视频第一针作为封面。</div>
          <div style="color: #d6d6d6">支持常用图片格式，不要太大</div>
          <img style="width: 400px;height: 250px;margin-bottom: 12px" v-if="coverUrl" :src="coverUrl" alt="cover">
          <a-upload v-decorator="['cover', {rules: [{required: false, message: '请上传视频封面'}]}]" accept="image/*" :file-list="fileListImg" :remove="handleRemoveImg" :before-upload="beforeUploadImg">
            <a-button> <a-icon type="upload" /> 选择图片文件 </a-button>
          </a-upload>
        </a-form-item>
        <a-form-item label="视频描述">
          <a-textarea :rows="6" v-decorator="['description', {rules: [{required: true, min: 10, max: 800, message: '请输入至少10字符，最多800个字符'}]}]" placeholder="请输入视频描述" />
        </a-form-item>
        <a-form-item label="视频时长">
          <a-input v-decorator="['time_length', {rules: [{required: true, min: 1, message: '请输入视频时长，格式为X时X分X秒'}]}]" placeholder="请输入视频时长，如1时2分33秒" />
        </a-form-item>
        <a-form-item label="视频排序">
          <a-input-number style="width: 100%" :precision="0" :min="0" :step="1" v-decorator="['sort', {rules: [{required: true, message: '请输入视频排序'}]}]" placeholder="请输入视频排序" />
          <div style="color: #096dd9;line-height: 1.5">排序规则：数字越<span style="color: #D14748">小</span>权重越<span style="color: #D14748">大</span>，排序越靠<span style="color: #D14748">前</span>；相同数字按照时间排序。最好保持不同的数字，一般数字和节数保持一致即可。</div>
        </a-form-item>
        <a-form-item label="是否发布">
          <a-select v-decorator="['status', {rules: [{required: true, trigger: 'change', message: '请选择是否发布'}]}]"  placeholder="请选择">
            <a-select-option value="1">发布</a-select-option>
            <a-select-option value="0">下线</a-select-option>
          </a-select>
        </a-form-item>
        <!--        <a-form-item label="cover" v-show="false">
                  <a-input v-decorator="['cover', { initialValue: '' }]" disabled />
                </a-form-item>-->
      </a-form>
    </a-spin>
    <video width="400" height="300" v-if="videoUrl" v-show="false" @loadeddata="createPreImg($event)" class="content-video" :src="videoUrl" crossorigin="anonymous" preload="auto" />
  </a-modal>
</template>

<script>
import pick from 'lodash.pick'

// 表单字段
const fields = ['id', 'title', 'description', 'status', 'source', 'cover', 'sort', 'time_length']

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
      id: ''
    }
  },
  created () {
    console.log('custom modal created')

    // 防止表单未注册
    fields.forEach(v => this.form.getFieldDecorator(v))
    this.form.setFieldsValue({status: '1'})
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
        this.$nextTick(()=>{
          const value = this.form.getFieldValue('cover')
          if(value && typeof value === 'string') {
            this.coverUrl = this.baseUrl + this.form.getFieldValue('cover')
          }
          this.id = this.form.getFieldValue('id')
        })
      },
      deep: true
    }
  },
  methods: {
    handleRemove(file) {
      const index = this.fileList.indexOf(file);
      const newFileList = this.fileList.slice();
      newFileList.splice(index, 1);
      this.fileList = newFileList;
      this.videoUrl = ''
      this.form.setFieldsValue({source: null})
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
      this.form.setFieldsValue({source: file})
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
        this.videoUrl = URL.createObjectURL(this.form.getFieldValue('source'))
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
