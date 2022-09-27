<template>
  <a-modal
    :maskClosable="false"
    :title="id ? '编辑型号' : '新建型号'"
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
        <a-form-item label="型号标题">
          <a-input v-decorator="['title', {rules: [{required: true, min: 2, max: 12, message: '请输入至少2字符，最多14个字符'}]}]"
                   placeholder="请输入型号标题" />
        </a-form-item>
        <a-form-item label="型号介绍">
          <a-textarea :rows="6"
                      v-decorator="['description', {rules: [{required: true, min: 10, max: 800, message: '请输入至少10字符，最多800个字符'}]}]"
                      placeholder="请输入型号介绍" />
        </a-form-item>
        <a-form-item label="参数信息">
          <a-textarea :rows="6"
                      v-decorator="['parameter', {rules: [{required: false, min: 1, max: 800, message: '请输入至少1字符，最多800个字符'}]}]"
                      placeholder="请输入参数信息，回车隔开，可为空" />
        </a-form-item>
        <a-form-item label="品牌">
          <a-input v-decorator="['brand', {rules: [{required: true, min: 1, max: 20, message: '请输入至少1字符，最多20个字符'}]}]"
                   placeholder="请输入品牌" />
        </a-form-item>
        <a-form-item label="售价">
          <a-input-number style="width: 100%" :precision="2" :min="0.01" :step="1"
                          v-decorator="['price', {rules: [{required: true, message: '请输入售价'}]}]" placeholder="请输入售价" />
        </a-form-item>
        <a-form-item label="是否折扣">
          <a-select @change="handleChange"
                    v-decorator="['is_discount', {rules: [{required: true, trigger: 'change', message: '请选择是否折扣'}]}]"
                    placeholder="请选择">
            <a-select-option value="1">是</a-select-option>
            <a-select-option value="0">否</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="折扣价">
          <a-input-number :disabled="!checkDiscount" style="width: 100%" :precision="2" :min="0.01" :step="1"
                          v-decorator="['discount', {rules: [{required: checkDiscount, message: '请输入折扣价'}]}]"
                          placeholder="请输入折扣价" />
        </a-form-item>
        <a-form-item label="折扣有效期">
          <a-date-picker :disabled="!checkDiscount" valueFormat="YYYY-MM-DD HH:mm:ss" @change="handleChangeDate"
                         style="width: 100%" show-time format="YYYY-MM-DD HH:mm:ss" placeholder="请选择折扣有效期"
                         v-decorator="['discount_validity', {rules: [{required: checkDiscount, trigger: 'change', message: '请选择折扣有效期'}]}]" />
        </a-form-item>
        <a-form-item label="库存数">
          <a-input-number style="width: 100%" :precision="0" :min="0" :step="1"
                          v-decorator="['inventory', {rules: [{required: true, message: '请输入库存数'}]}]"
                          placeholder="请输入库存数" />
        </a-form-item>
        <a-form-item label="发货地">
          <a-select v-decorator="['dispatch_place', {rules: [{required: true, trigger: 'change', message: '请选择发货地'}]}]"
                    placeholder="请选择">
            <a-select-option v-for="(u,index) in provinces" :key="u" :value="u">{{ u }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="型号排序">
          <a-input-number style="width: 100%" :precision="0" :min="0" :step="1"
                          v-decorator="['sort', {rules: [{required: true, message: '请输入型号排序'}]}]"
                          placeholder="请输入型号排序" />
          <div style="color: #096dd9;line-height: 1.5">排序规则：数字越<span style="color: #D14748">小</span>权重越<span
            style="color: #D14748">大</span>，排序越靠<span style="color: #D14748">前</span>；相同数字按照时间排序。最好保持不同的数字。
          </div>
        </a-form-item>
        <a-form-item label="型号多图">
          <div style="color: #d6d6d6">支持常用图片格式，不要太大。最多9张图片。</div>
          <a-upload list-type="picture-card"
                    v-decorator="['multi_figure', {rules: [{required: true, message: '请上传型号多图'}]}]" accept="image/*"
                    :file-list="fileListLong" :remove="handleRemoveLong" :before-upload="beforeUploadLong">
            <div v-if="fileListLong.length < 9">
              <a-icon type="plus" />
              <div class="ant-upload-text">
                上传图片
              </div>
            </div>
          </a-upload>
        </a-form-item>
        <a-form-item label="是否发布">
          <a-select v-decorator="['status', {rules: [{required: true, trigger: 'change', message: '请选择是否发布'}]}]"
                    placeholder="请选择">
            <a-select-option value="1">发布</a-select-option>
            <a-select-option value="0">下线</a-select-option>
          </a-select>
        </a-form-item>
        <!--        <a-form-item label="cover" v-show="false">
                  <a-input v-decorator="['cover', { initialValue: '' }]" disabled />
                </a-form-item>-->
      </a-form>
    </a-spin>
    <video width="400" height="300" v-if="videoUrl" v-show="false" @loadeddata="createPreImg($event)"
           class="content-video" :src="videoUrl" crossorigin="anonymous" preload="auto" />
  </a-modal>
</template>

<script>
import pick from "lodash.pick";

// 表单字段
const fields = ["id", "title", "description", "status", "multi_figure", "parameter", "brand", "price", "is_discount", "discount", "discount_validity", "inventory", "dispatch_place", "sort", "time_length"];

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
      fileListImg: [],
      uploading: false,
      videoUrl: "",
      coverUrl: "",
      coverBlob: null,
      baseUrl: process.env.VUE_APP_API_BASE_URL + "/",
      id: "",
      checkDiscount: false,
      provinces: [
        "北京市", "天津市", "上海市", "重庆市", "河北省", "山西省", "辽宁省", "吉林省", "黑龙江省", "江苏省", "浙江省", "安徽省", "福建省", "江西省", "山东省", "河南省", "湖北省", "湖南省", "广东省", "海南省", "四川省", "贵州省", "云南省", "陕西省", "甘肃省", "青海省", "台湾省", "内蒙古自治区", "广西壮族自治区", "西藏自治区", "宁夏回族自治区", "新疆维吾尔自治区"
      ],
      fileListLong: []
    };
  },
  created() {
    console.log("custom modal created");

    // 防止表单未注册
    fields.forEach(v => this.form.getFieldDecorator(v));
    this.form.setFieldsValue({ status: "1" });
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
          const longText = this.form.getFieldValue("multi_figure");
          if (longText && typeof longText === "string") {
            this.fileListLong = longText.split(",").map((url,index) => {
              return {
                url: this.baseUrl + url,
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
        });
      },
      deep: true
    }
  },
  methods: {
    handleChange(e) {
      this.checkDiscount = e === "1";
      this.$nextTick(() => {
        this.form.resetFields(["discount", "discount_validity"]);
      });
    },
    handleChangeDate(e) {
      console.log("e", e);
    },
    handleRemoveLong(file) {
      const index = this.fileListLong.indexOf(file);
      const newFileList = this.fileListLong.slice();
      newFileList.splice(index, 1);
      this.fileListLong = newFileList;
      this.form.setFieldsValue({ multi_figure: file });
    },
    beforeUploadLong(file) {
      console.log("file", file);
      file.url = URL.createObjectURL(file);
      this.fileListLong = [...this.fileListLong, file];
      console.log("fileListLong", this.fileListLong);
      this.form.setFieldsValue({ multi_figure: file });
      return false;
    }
  }
};
</script>
