<template>
  <a-modal
    :maskClosable="false"
    :title="id ? '编辑器材' : '新建器材'"
    :width="840"
    :visible="visible"
    :confirmLoading="loading || checkLoading"
    @ok="() => { $emit('ok') }"
    @cancel="() => { $emit('cancel') }"
    :okText="checkLoading ? '校验中' : '确定'"
  >
    <a-spin :spinning="loading">
      <a-form :form="form" v-bind="formLayout">
        <!-- 检查是否有 id 并且大于0，大于0是修改。其他是新增，新增不显示主键ID -->
        <a-form-item v-show="model && model.id > 0" label="主键ID">
          <a-input v-decorator="['id', { initialValue: 0 }]" disabled />
        </a-form-item>
        <a-form-item label="器材编号">
          <a-input
            v-decorator="['serial_number', {rules: [{required: true, min: 10, max: 10, validator: this.handleValidate}]}]"
            placeholder="请输入器材编号" />
        </a-form-item>
        <a-form-item label="器材标题">
          <a-input v-decorator="['title', {rules: [{required: true, min: 2, max: 12, message: '请输入至少2字符，最多14个字符'}]}]"
                   placeholder="请输入器材标题" />
        </a-form-item>
        <a-form-item label="器材封面">
          <div style="color: #d6d6d6">支持常用图片格式，不要太大</div>
          <img style="width: 400px;height: 250px;margin-bottom: 12px" v-if="coverUrl" :src="coverUrl" alt="cover">
          <a-upload v-decorator="['cover', {rules: [{required: true, message: '请上传器材封面'}]}]" accept="image/*"
                    :file-list="fileListImg" :remove="handleRemoveImg" :before-upload="beforeUploadImg">
            <a-button>
              <a-icon type="upload" />
              选择图片文件
            </a-button>
          </a-upload>
        </a-form-item>
        <a-form-item label="器材描述">
          <a-textarea :rows="6"
                      v-decorator="['description', {rules: [{required: true, min: 10, max: 800, message: '请输入至少10字符，最多800个字符'}]}]"
                      placeholder="请输入器材描述" />
        </a-form-item>
        <a-form-item label="器材类型">
          <a-select v-decorator="['equipment_type', {rules: [{required: true, trigger: 'change', message: '请选择器材类型'}]}]"
                    placeholder="请选择">
            <a-select-option value="0">康复训练器材</a-select-option>
            <a-select-option value="1">康复理疗设备</a-select-option>
            <a-select-option value="2">康复治疗师工具</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="是否轮播">
          <a-select v-decorator="['carousel', {rules: [{required: true, trigger: 'change', message: '请选择是否轮播'}]}]"
                    placeholder="请选择">
            <a-select-option value="1">是</a-select-option>
            <a-select-option value="0">否</a-select-option>
          </a-select>
          <div style="color: #096dd9;line-height: 1.5">轮播规则：一个以上开启轮播；至少为三个，不够则从最新的课程补齐；最多为五个，若超过五个，则取最新的五个。</div>
        </a-form-item>
        <a-form-item label="器材长图">
          <div style="color: #d6d6d6">支持常用图片格式，不要太大。最多9张图片。</div>
          <a-upload list-type="picture-card"
                    v-decorator="['long_figure', {rules: [{required: true, message: '请上传器材长图'}]}]" accept="image/*"
                    :file-list="fileListLong" :remove="handleRemoveLong" :before-upload="beforeUploadLong">
            <div v-if="fileListLong.length < 9">
              <a-icon type="plus" />
              <div class="ant-upload-text">
                上传图片
              </div>
            </div>
          </a-upload>
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script>
import pick from "lodash.pick";
import {equipmentApi} from "@/service/api";
import { getAction } from "@/utils/manage";

// 表单字段
const fields = ["id", "serial_number", "title", "cover", "description", "long_figure", "equipment_type", "carousel"];

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
  data() {
    this.formLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 7 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 13 }
      }
    };
    return {
      form: this.$form.createForm(this),
      fileList: [],
      fileListLong: [],
      fileListImg: [],
      uploading: false,
      videoUrl: "",
      coverUrl: "",
      coverBlob: null,
      baseUrl: process.env.VUE_APP_API_BASE_URL + "/",
      cdnUrl: process.env.VUE_APP_CDN_BASE_URL + '/',
      id: "",
      checkDiscount: false,
      checkLoading: false
    };
  },
  created() {
    console.log("custom modal created");

    // 防止表单未注册
    fields.forEach(v => this.form.getFieldDecorator(v));
    this.form.setFieldsValue({ carousel: "0", is_discount: "0" });
  },
  watch: {
    visible() {
      if (!this.visible) {
        this.videoUrl = "";
        this.coverUrl = "";
        this.fileList = [];
        this.fileListImg = [];
        this.fileListLong = [];
        this.coverBlob = null;
        this.id = "";
      }
    },
    model: {
      handler() {
        this.model && this.form.setFieldsValue(pick(this.model, fields));
        this.$nextTick(() => {
          const value = this.form.getFieldValue("cover");
          if (value && typeof value === "string") {
            this.coverUrl = this.cdnUrl + this.form.getFieldValue("cover");
          }
          const longText = this.form.getFieldValue("long_figure");
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
          this.id = this.form.getFieldValue("id");
          if (!this.id) {
            this.form.setFieldsValue({ carousel: "0" });
          }
        });
      },
      deep: true
    }
  },
  methods: {
    handleValidate(rule, value, callback){
      if (!value || value.length !== 10){
        callback('请输入数字大写字母和-的组合，十位，且不可重复')
      }else{
        this.checkLoading = true
        getAction(equipmentApi.check, {serial_number: value, id: this.id}).then((res) => {
          if(res.data){
            callback()
          }else{
            callback(res.message)
          }
        }).finally(()=>{
          this.checkLoading = false
        })
      }
    },
    handleChange(e) {
      this.checkDiscount = e === "1";
      this.$nextTick(() => {
        this.form.resetFields(["discount", "discount_validity"]);
      });
    },
    handleChangeDate(e) {
      console.log("e", e);
    },
    handleRemoveImg(file) {
      const index = this.fileListImg.indexOf(file);
      const newFileList = this.fileListImg.slice();
      newFileList.splice(index, 1);
      this.fileListImg = newFileList;
      this.coverUrl = "";
      this.coverBlob = null;
      this.form.setFieldsValue({ cover: null });
    },
    handleRemoveLong(file) {
      const index = this.fileListLong.indexOf(file);
      const newFileList = this.fileListLong.slice();
      newFileList.splice(index, 1);
      this.fileListLong = newFileList;
      this.form.setFieldsValue({ long_figure: file });
    },
    beforeUploadImg(file) {
      console.log("file", file);
      this.fileListImg = [...this.fileListImg, file];
      this.form.setFieldsValue({ cover: file });
      this.coverUrl = URL.createObjectURL(file);
      return false;
    },
    beforeUploadLong(file) {
      console.log("file", file);
      file.url = URL.createObjectURL(file);
      this.fileListLong = [...this.fileListLong, file];
      console.log("fileListLong", this.fileListLong);
      this.form.setFieldsValue({ long_figure: file });
      return false;
    }
  }
};
</script>

<style lang="less">
/* you can make up upload button and sample style by using stylesheets */
.ant-upload-select-picture-card i {
  font-size: 32px;
  color: #999;
}

.ant-upload-select-picture-card .ant-upload-text {
  margin-top: 8px;
  color: #666;
}
</style>
