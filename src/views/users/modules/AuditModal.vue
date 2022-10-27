<template>
  <a-modal
    :maskClosable="false"
    title="认证审核"
    :width="840"
    :visible="visible"
    :confirmLoading="loading"
    @cancel="handleCancel"
  >
    <a-spin :spinning="loading">
      <a-empty :image="simpleImage" description="未查询到信息" v-if="!model.id" />
      <div style="width: 100%;max-height: 600px;overflow-y: auto;overflow-x: hidden;box-sizing: border-box;padding-bottom: 24px" v-else>
        <a-row class="audit-modal-row" :gutter="24">
          <a-col class="audit-modal-col-left" span="4"><span style="color: #333;font-weight: bold;white-space: nowrap">------------------- 用户信息 -------------------</span>
          </a-col>
        </a-row>
        <a-row class="audit-modal-row" :gutter="24">
          <a-col class="audit-modal-col-left" span="4">用户名:</a-col>
          <a-col class="audit-modal-col-right" span="20">{{ model.user_info.username }}</a-col>
        </a-row>
        <a-row class="audit-modal-row" :gutter="24">
          <a-col class="audit-modal-col-left" span="4">用户昵称:</a-col>
          <a-col class="audit-modal-col-right" span="20">{{ model.user_info.name }}</a-col>
        </a-row>
        <a-row class="audit-modal-row" :gutter="24">
          <a-col class="audit-modal-col-left" span="4">用户手机号:</a-col>
          <a-col class="audit-modal-col-right" span="20">{{ model.user_info.phone }}</a-col>
        </a-row>
        <a-row class="audit-modal-row" :gutter="24">
          <a-col class="audit-modal-col-left" span="4">用户状态:</a-col>
          <a-col class="audit-modal-col-right" span="20"
                 :style="{color: model.user_info.status === 1 ? '#59C337' : '#F56C6E'}">
            {{ model.user_info.status === 1 ? "正常" : "冻结" }}
          </a-col>
        </a-row>
        <a-row class="audit-modal-row" :gutter="24">
          <a-col class="audit-modal-col-left" span="4"><span style="color: #333;font-weight: bold;white-space: nowrap">------------------- 认证信息 -------------------</span>
          </a-col>
        </a-row>
        <a-row class="audit-modal-row" :gutter="24">
          <a-col class="audit-modal-col-left" span="4">认证名:</a-col>
          <a-col class="audit-modal-col-right" span="20">{{ model.name }}</a-col>
        </a-row>
        <a-row class="audit-modal-row" :gutter="24">
          <a-col class="audit-modal-col-left" span="4">认证联系电话:</a-col>
          <a-col class="audit-modal-col-right" span="20">{{ model.phone }}</a-col>
        </a-row>
        <a-row class="audit-modal-row" :gutter="24">
          <a-col class="audit-modal-col-left" span="4">认证性别:</a-col>
          <a-col class="audit-modal-col-right" span="20">{{ model.gender === 1 ? "男" : "女" }}</a-col>
        </a-row>
        <a-row class="audit-modal-row" :gutter="24">
          <a-col class="audit-modal-col-left" span="4">认证机构组织:</a-col>
          <a-col class="audit-modal-col-right" span="20">{{ model.organization }}</a-col>
        </a-row>
        <a-row class="audit-modal-row" :gutter="24">
          <a-col class="audit-modal-col-left" span="4">认证简介:</a-col>
          <a-col class="audit-modal-col-right" span="20">{{ model.fcc }}</a-col>
        </a-row>
        <div class="images-show-viewer">
          <a-row class="audit-modal-row" :gutter="24">
            <a-col class="audit-modal-col-left" span="4">身份证正面照:</a-col>
            <a-col class="audit-modal-col-right" span="20">
              <img class="images-show-viewer-1" :src="baseUrl + model.identity_card_front" alt="identity_card_front" style="width: 200px">
            </a-col>
          </a-row>
          <a-row class="audit-modal-row" :gutter="24">
            <a-col class="audit-modal-col-left" span="4">身份证反面照:</a-col>
            <a-col class="audit-modal-col-right" span="20">
              <img class="images-show-viewer-2" :src="baseUrl + model.identity_card_back" alt="identity_card_front" style="width: 200px">
            </a-col>
          </a-row>
          <a-row class="audit-modal-row" :gutter="24">
            <a-col class="audit-modal-col-left" span="4">执业证照:</a-col>
            <a-col class="audit-modal-col-right" span="20">
              <img class="images-show-viewer-3" :src="baseUrl + model.practicing_certificate" alt="identity_card_front" style="width: 200px">
            </a-col>
          </a-row>
          <a-row class="audit-modal-row" :gutter="24">
            <a-col class="audit-modal-col-left" span="4">工作证照:</a-col>
            <a-col class="audit-modal-col-right" span="20">
              <img class="images-show-viewer-4" :src="baseUrl + model.employee_card" alt="identity_card_front" style="width: 200px">
            </a-col>
          </a-row>
        </div>
        <a-row class="audit-modal-row" :gutter="24" v-if="model.status !== 2">
          <a-col class="audit-modal-col-left" span="4">审核意见:</a-col>
          <a-col class="audit-modal-col-right" span="20">{{ model.audit_info }}</a-col>
        </a-row>
        <a-row class="audit-modal-row" :gutter="24" v-if="model.status !== 2">
          <a-col class="audit-modal-col-left" span="4">审核结果:</a-col>
          <a-col class="audit-modal-col-right" span="20"
                 :style="{color: model.status === 3 ? '#59C337' : model.status === 1 ? '#F56C6E' : '#333'}">
            {{ model.status === 3 ? "审核通过" : model.status === 2 ? "待审核" : model.status === 1 ? "驳回" : "失效" }}
          </a-col>
        </a-row>
        <a-row class="audit-modal-row" :gutter="24" v-if="model.status !== 2 && model.validity_time">
          <a-col class="audit-modal-col-left" span="4">有效期:</a-col>
          <a-col class="audit-modal-col-right" span="20">
            {{ model.validity_time ? moment(model.validity_time, "YYYY-MM-DD").format("YYYY-MM-DD") : "" }}
          </a-col>
        </a-row>
      </div>
      <div style="width: 100%;padding-top: 24px;box-shadow: rgba(0, 0, 0, 0.45) 0 -15px 20px -20px;"
           v-if="model.status === 2">
        <a-row class="audit-modal-row" :gutter="24" style="margin-bottom: 24px" v-if="model.audit_info">
          <a-col class="audit-modal-col-left" span="4" style="text-align:right;color: #D14748">上次审核意见:</a-col>
          <a-col class="audit-modal-col-right" span="12" style="color: #D14748">{{ model.audit_info }}</a-col>
        </a-row>
        <a-form-model validateOnRuleChange :label-col="labelCol" :wrapper-col="wrapperCol" ref="Form" :model="form"
                      :rules="validatorRules">
          <a-form-model-item label="审核意见" prop="audit_info">
            <a-textarea :rows="3" v-model="form.audit_info" placeholder="请输入审核意见"></a-textarea>
          </a-form-model-item>
          <a-form-model-item label="审核结果" prop="status">
            <a-select v-model="form.status" placeholder="请选择审核结果" @change="handleChangeStatus">
              <a-select-option value="3">审核通过</a-select-option>
              <a-select-option value="1">驳回</a-select-option>
            </a-select>
          </a-form-model-item>
          <a-form-model-item label="有效期" prop="validity_time" v-if="form.status === '3'">
            <a-date-picker style="width: 100%;" placeholder="请选择有效期" v-model="form.validity_time"
                           valueFormat="YYYY-MM-DD" />
          </a-form-model-item>
        </a-form-model>
      </div>
    </a-spin>
    <div slot="footer">
      <a-button @click="handleCancel">取消</a-button>
      <a-button @click="handleConfirm" :loading="loading" style="margin-left: 24px" v-if="model.status === 2">确定
      </a-button>
    </div>
  </a-modal>
</template>

<script>
import { authenticatesApi } from "@/service/api";
import { getAction, postAction } from "@/utils/manage";
import { Empty } from "ant-design-vue";
import moment from "moment";
import Viewer from 'viewerjs'
import 'viewerjs/dist/viewer.css';

export default {
  name: "AuditModal",
  created() {
    this.simpleImage = Empty.PRESENTED_IMAGE_SIMPLE;
  },
  data() {
    return {
      moment,
      baseUrl: process.env.VUE_APP_API_BASE_URL + "/",
      visible: false,
      loading: false,
      model: {
        user_info: {}
      },
      form: {
        status: undefined,
        audit_info: "",
        validity_time: ""
      },
      validatorRules: {
        status: [{ required: true, message: "请选择审核结果", trigger: "change" }],
        audit_info: [{ required: true, message: "请输入审核意见" }],
        validity_time: [{ required: true, message: "请选择有效期", trigger: "change" }]
      },
      labelCol: { span: 4 },
      wrapperCol: { span: 12 },
      simpleImage: "",
      viewer: null
    };
  },
  methods: {
    handleChangeStatus(e) {
      console.log("eee", e);
      this.form.validity_time = "";
      if (e === "3") {
        this.validatorRules = {
          status: [{ required: true, message: "请选择审核结果", trigger: "change" }],
          audit_info: [{ required: true, message: "请输入审核意见" }],
          validity_time: [{ required: true, message: "请选择审核结果", trigger: "change" }]
        };
      } else {
        this.validatorRules = {
          status: [{ required: true, message: "请选择审核结果", trigger: "change" }],
          audit_info: [{ required: true, message: "请输入审核意见" }],
          validity_time: [{ required: false, message: "请选择审核结果", trigger: "change" }]
        };
      }
    },
    handleConfirm() {
      const that = this;
      // 触发表单验证
      this.$refs.Form.validate(valid => {
        if (valid) {
          this.loading = true;
          console.log("1111");
          postAction(authenticatesApi.audit, {
            ...this.form,
            status: Number(this.form.status),
            validity_time: `${this.form.validity_time} 23:59:59`,
            id: this.model.id
          }).then(res => {
            this.$message.success("审核完成");
            this.handleCancel();
            this.$emit("ok");
          }).catch(err1 => {
            this.$message.warning((err1 && err1.response && err1.response.data && err1.response.data.message) || "审核失败");
          }).finally(() => {
            this.loading = false;
          });
        }
      });
    },
    show(record) {
      this.loading = true;
      this.visible = true;
      getAction(authenticatesApi.getOneById(record.id)).then(res => {
        this.model = { ...res.data };
        console.log("model", this.model);
        this.$nextTick(()=>{
          this.viewer = new Viewer(document.querySelector('.images-show-viewer'), {
            inline: false
          });
        })
      }).finally(() => {
        this.loading = false;
      });
    },
    handleCancel() {
      this.visible = false;
      this.model = { user_info: {} };
      this.$refs.Form && this.$refs.Form.resetFields();
      this.viewer && this.viewer.destroy()
    }
  }
};
</script>

<style scoped lang="less">
.audit-modal-row {
  margin-bottom: 12px;

  .audit-modal-col-right {
    font-weight: bold;
  }
}

.images-show-viewer img{
  cursor: pointer;
}
</style>