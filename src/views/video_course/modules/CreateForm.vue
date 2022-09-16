<template>
  <a-modal
    :maskClosable="false"
    :title="id ? '编辑课程' : '新建课程'"
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
        <a-form-item label="课程标题">
          <a-input v-decorator="['title', {rules: [{required: true, min: 2, max: 12, message: '请输入至少2字符，最多14个字符'}]}]" placeholder="请输入课程标题" />
        </a-form-item>
        <a-form-item label="课程封面">
          <div style="color: #d6d6d6">支持常用图片格式，不要太大</div>
          <img style="width: 400px;height: 250px;margin-bottom: 12px" v-if="coverUrl" :src="coverUrl" alt="cover">
          <a-upload v-decorator="['cover', {rules: [{required: true, message: '请上传课程封面'}]}]" accept="image/*" :file-list="fileListImg" :remove="handleRemoveImg" :before-upload="beforeUploadImg">
            <a-button> <a-icon type="upload" /> 选择图片文件 </a-button>
          </a-upload>
        </a-form-item>
        <a-form-item label="课程描述">
          <a-textarea :rows="6" v-decorator="['description', {rules: [{required: true, min: 10, max: 800, message: '请输入至少10字符，最多800个字符'}]}]" placeholder="请输入课程描述" />
        </a-form-item>
        <a-form-item label="课程类型">
          <a-select v-decorator="['course_type', {rules: [{required: true, trigger: 'change', message: '请选择课程类型'}]}]" placeholder="请选择">
            <a-select-option value="0">运动康复</a-select-option>
            <a-select-option value="1">神经康复</a-select-option>
            <a-select-option value="2">产后康复</a-select-option>
            <a-select-option value="3">术后康复</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="售价">
          <a-input-number style="width: 100%" :precision="2" :min="0.01" :step="1" v-decorator="['price', {rules: [{required: true, message: '请输入售价'}]}]" placeholder="请输入售价" />
        </a-form-item>
        <a-form-item label="是否折扣">
          <a-select @change="handleChange" v-decorator="['is_discount', {rules: [{required: true, trigger: 'change', message: '请选择是否折扣'}]}]"  placeholder="请选择">
            <a-select-option value="1">是</a-select-option>
            <a-select-option value="0">否</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="折扣价">
          <a-input-number :disabled="!checkDiscount" style="width: 100%" :precision="2" :min="0.01" :step="1" v-decorator="['discount', {rules: [{required: checkDiscount, message: '请输入折扣价'}]}]" placeholder="请输入折扣价" />
        </a-form-item>
        <a-form-item label="折扣有效期">
          <a-date-picker :disabled="!checkDiscount" valueFormat="YYYY-MM-DD HH:mm:ss" @change="handleChangeDate" style="width: 100%" show-time format="YYYY-MM-DD HH:mm:ss" placeholder="请选择折扣有效期" v-decorator="['discount_validity', {rules: [{required: checkDiscount, trigger: 'change', message: '请选择折扣有效期'}]}]" />
        </a-form-item>
        <a-form-item label="是否轮播">
          <a-select v-decorator="['carousel', {rules: [{required: true, trigger: 'change', message: '请选择是否轮播'}]}]"  placeholder="请选择">
            <a-select-option value="1">是</a-select-option>
            <a-select-option value="0">否</a-select-option>
          </a-select>
          <div style="color: #096dd9;line-height: 1.5">轮播规则：一个以上开启轮播；至少为三个，不够则从最新的课程补齐；最多为五个，若超过五个，则取最新的五个。</div>
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script>
import pick from 'lodash.pick'

// 表单字段
const fields = ['id', 'title', 'cover', 'description', 'course_type', 'price', 'is_discount', 'discount', 'discount_validity', 'carousel']

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
      checkDiscount: false
    }
  },
  created () {
    console.log('custom modal created')

    // 防止表单未注册
    fields.forEach(v => this.form.getFieldDecorator(v))
    this.form.setFieldsValue({carousel: '0', is_discount: '0'})
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
          if(!this.id){
            this.form.setFieldsValue({carousel: '0', is_discount: '0'})
          }
        })
      },
      deep: true
    }
  },
  methods: {
    handleChange(e) {
      this.checkDiscount = e === '1';
      this.$nextTick(() => {
        this.form.resetFields(['discount', 'discount_validity']);
      });
    },
    handleChangeDate(e){
      console.log('e',e)
    },
    handleRemoveImg(file) {
      const index = this.fileListImg.indexOf(file);
      const newFileList = this.fileListImg.slice();
      newFileList.splice(index, 1);
      this.fileListImg = newFileList;
      this.coverUrl = ''
      this.coverBlob = null
      this.form.setFieldsValue({cover: null})
    },
    beforeUploadImg(file) {
      console.log('file', file)
      this.fileListImg = [...this.fileListImg, file];
      this.form.setFieldsValue({cover: file})
      this.coverUrl = URL.createObjectURL(file)
      return false;
    }
  }
}
</script>
