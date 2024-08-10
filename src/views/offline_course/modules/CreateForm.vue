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
          <a-input v-decorator="['title', {rules: [{required: true, min: 1, max: 30, message: '请输入至少1字符，最多30个字符'}]}]" placeholder="请输入课程标题" />
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
        <a-form-item label="课程流程">
          <a-textarea :rows="4" v-decorator="['flow', {rules: [{required: false, max: 800, message: '请输入最多800个字符'}]}]" placeholder="请输入课程流程" />
        </a-form-item>
        <a-form-item label="课程须知">
          <a-textarea :rows="4" v-decorator="['notice', {rules: [{required: false, max: 800, message: '请输入最多800个字符'}]}]" placeholder="请输入课程须知" />
        </a-form-item>
        <a-form-item label="课程多图">
          <div style="color: #d6d6d6">支持常用图片格式，不要太大。最多20张图片。</div>
          <a-upload list-type="picture-card"
                    v-decorator="['multigraph', {rules: [{required: false, message: '请上传课程多图'}]}]" accept="image/*"
                    :file-list="fileListLong" :remove="handleRemoveLong" :before-upload="beforeUploadLong">
            <div v-if="fileListLong.length < 20">
              <a-icon type="plus" />
              <div class="ant-upload-text">
                上传图片
              </div>
            </div>
          </a-upload>
        </a-form-item>
        <a-form-item label="课程类型">
          <a-select v-decorator="['course_type', {rules: [{required: true, trigger: 'change', message: '请选择课程类型'}]}]" placeholder="请选择">
            <a-select-option value="0">运动康复</a-select-option>
            <a-select-option value="1">神经康复</a-select-option>
            <a-select-option value="2">产后康复</a-select-option>
            <a-select-option value="3">术后康复</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="课程次数">
          <a-input-number style="width: 100%" :precision="0" :min="1" :step="1" v-decorator="['course_num', {rules: [{required: true, message: '请输入课程次数'}]}]" placeholder="请输入课程次数" />
        </a-form-item>
        <a-form-item label="课程有效期">
          <a-input-number style="width: 46%;margin-right: 8%" :precision="0" :min="1" :step="1" v-decorator="['period_validity_num', {rules: [{required: true, message: '请输入课程有效期'}]}]" placeholder="请输入课程有效期" />
          <a-select style="width: 46%" v-model="period_validity_type" placeholder="请选择">
            <a-select-option value="d">天</a-select-option>
            <a-select-option value="w">周</a-select-option>
            <a-select-option value="m">月</a-select-option>
            <a-select-option value="y">年</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="单次时长(分钟)">
          <a-input-number style="width: 100%" :precision="0" :min="1" :step="1" v-decorator="['single_duration', {rules: [{required: true, message: '请输入单次时长'}]}]" placeholder="请输入单次时长" />
        </a-form-item>
        <a-form-item label="售价">
          <a-input-number style="width: 100%" :precision="2" :min="0.01" :step="1" v-decorator="['price', {rules: [{required: true, message: '请输入售价'}]}]" placeholder="请输入售价" />
        </a-form-item>
        <a-form-item label="优先级">
          <a-input-number style="width: 100%" :precision="0" :min="1" :step="1" v-decorator="['priority', {rules: [{required: false, message: '请输入优先级'}]}]" placeholder="请输入优先级" />
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
          <div style="color: #096dd9;line-height: 1.5">轮播规则：一个以上开启轮播；最多为五个，若超过五个，则取优先级越高的或最新的五个。</div>
        </a-form-item>
        <a-form-item label="轮播封面">
          <div style="color: #d6d6d6">支持常用图片格式，不要太大</div>
          <img style="width: 400px;height: 250px;margin-bottom: 12px" v-if="coverUrlCarousel" :src="coverUrlCarousel" alt="cover">
          <a-upload v-decorator="['carousel_cover', {rules: [{required: false, message: '请上传轮播封面'}]}]" accept="image/*" :file-list="fileListImgCarousel" :remove="handleRemoveImgCarousel" :before-upload="beforeUploadImgCarousel">
            <a-button> <a-icon type="upload" /> 选择图片文件 </a-button>
          </a-upload>
        </a-form-item>
        <a-form-item label="是否发布">
          <a-select v-decorator="['status', {rules: [{required: true, trigger: 'change', message: '请选择是否发布'}]}]"  placeholder="请选择">
            <a-select-option value="1">发布</a-select-option>
            <a-select-option value="0">下线</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script>
import pick from 'lodash.pick'

// 表单字段
const fields = ['id', 'title', 'cover', 'description', 'flow', 'notice', 'multigraph', 'course_type', 'course_num', 'period_validity', 'period_validity_num', 'single_duration', 'price', 'priority', 'is_discount', 'discount', 'discount_validity', 'carousel', 'carousel_cover', 'status']

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
      period_validity_type: 'd',
      form: this.$form.createForm(this),
      fileList: [],
      fileListImg: [],
      fileListLong: [],
      fileListImgCarousel: [],
      uploading: false,
      videoUrl: '',
      coverUrl: '',
      coverUrlCarousel: '',
      coverBlob: null,
      coverBlobCarousel: null,
      baseUrl: process.env.VUE_APP_API_BASE_URL + '/',
      cdnUrl: process.env.VUE_APP_CDN_BASE_URL + '/',
      id: '',
      checkDiscount: false
    }
  },
  created () {
    console.log('custom modal created')

    // 防止表单未注册
    fields.forEach(v => this.form.getFieldDecorator(v))
    this.form.setFieldsValue({status: '1', carousel: '0', is_discount: '0'})
  },
  watch : {
    visible(){
      if (!this.visible){
        this.videoUrl = ''
        this.coverUrl = ''
        this.coverUrlCarousel = ''
        this.fileList = []
        this.fileListImg = []
        this.fileListLong = [];
        this.fileListImgCarousel = [];
        this.coverBlob = null
        this.coverBlobCarousel = null
        this.id = ''
      }
    },
    model: {
      handler(){
        this.model && this.form.setFieldsValue(pick(this.model, fields))
        this.$nextTick(()=>{
          const value = this.form.getFieldValue('cover')
          if(value && typeof value === 'string') {
            this.coverUrl = this.cdnUrl + this.form.getFieldValue('cover')
          }

          const valueCarousel = this.form.getFieldValue('carousel_cover')
          if(valueCarousel && typeof valueCarousel === 'string') {
            this.coverUrlCarousel = this.cdnUrl + this.form.getFieldValue('carousel_cover')
          }

          const valuePeriodValidity = this.form.getFieldValue('period_validity')
          if(valuePeriodValidity && typeof valuePeriodValidity === 'string') {
            let period_validity_num;
            let period_validity_type;
            if (/\d/.test(valuePeriodValidity)){
              period_validity_num = valuePeriodValidity.split('d')[0]
              period_validity_type = 'd'
            }else if (/\w/.test(valuePeriodValidity)){
              period_validity_num = valuePeriodValidity.split('w')[0]
              period_validity_type = 'w'
            }else if (/m/.test(valuePeriodValidity)){
              period_validity_num = valuePeriodValidity.split('m')[0]
              period_validity_type = 'm'
            }else {
              period_validity_num = valuePeriodValidity.split('y')[0]
              period_validity_type = 'y'
            }
            this.form.setFieldsValue({period_validity_num: period_validity_num})
            this.period_validity_type = period_validity_type;
          }

          const longText = this.form.getFieldValue("multigraph");
          if (longText && typeof longText === "string") {
            this.fileListLong = longText.split(",").map((url,index) => {
              return {
                url: this.cdnUrl + url,
                name: `long${index}.png`,
                size: 80031,
                type: "image/png",
                ready: true,
                uid: `long-${index}`,
                path: url
              };
            });
          }
          this.id = this.form.getFieldValue('id')
          if(!this.id){
            this.form.setFieldsValue({status: '1', carousel: '0', is_discount: '0'})
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
    handleRemoveImgCarousel(file) {
      const index = this.fileListImgCarousel.indexOf(file);
      const newFileList = this.fileListImgCarousel.slice();
      newFileList.splice(index, 1);
      this.fileListImgCarousel = newFileList;
      this.coverUrlCarousel = ''
      this.coverBlobCarousel = null
      this.form.setFieldsValue({carousel_cover: null})
    },
    handleRemoveLong(file) {
      const index = this.fileListLong.indexOf(file);
      const newFileList = this.fileListLong.slice();
      newFileList.splice(index, 1);
      this.fileListLong = newFileList;
      this.form.setFieldsValue({ multigraph: file });
    },
    beforeUploadImg(file) {
      console.log('file', file)
      this.fileListImg = [...this.fileListImg, file];
      this.form.setFieldsValue({cover: file})
      this.coverUrl = URL.createObjectURL(file)
      return false;
    },
    beforeUploadImgCarousel(file) {
      console.log('file', file)
      this.fileListImgCarousel = [...this.fileListImgCarousel, file];
      this.form.setFieldsValue({carousel_cover: file})
      this.coverUrlCarousel = URL.createObjectURL(file)
      return false;
    },
    beforeUploadLong(file) {
      console.log("file", file);
      file.url = URL.createObjectURL(file);
      this.fileListLong = [...this.fileListLong, file];
      console.log("fileListLong", this.fileListLong);
      this.form.setFieldsValue({ multigraph: file });
      return false;
    }
  }
}
</script>
