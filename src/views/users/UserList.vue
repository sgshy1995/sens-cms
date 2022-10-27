<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="8" :sm="24">
              <a-form-item label="用户昵称">
                <a-input @keypress.enter="$refs.table.refresh(true)" v-model="queryParam.name"
                         placeholder="请输入用户昵称模糊查询" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="用户性别">
                <a-select v-model="queryParam.gender" placeholder="请选择">
                  <a-select-option value="1">男</a-select-option>
                  <a-select-option value="0">女</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <template v-if="advanced">
              <a-col :md="8" :sm="24">
                <a-form-item label="用户手机号">
                  <a-input @keypress.enter="$refs.table.refresh(true)" v-model="queryParam.phone"
                           placeholder="请输入用户手机号模糊查询" />
                </a-form-item>
              </a-col>
              <a-col :md="8" :sm="24">
                <a-form-item label="用户身份">
                  <a-select v-model="queryParam.identity" placeholder="请选择">
                    <a-select-option value="1">医师</a-select-option>
                    <a-select-option value="0">患者(默认)</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :md="8" :sm="24">
                <a-form-item label="用户认证">
                  <a-select v-model="queryParam.authenticate" placeholder="请选择">
                    <a-select-option value="2">通过认证</a-select-option>
                    <a-select-option value="1">认证待审核</a-select-option>
                    <a-select-option value="0">未通过认证</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :md="8" :sm="24">
                <a-form-item label="是否有讲师权限">
                  <a-select v-model="queryParam.if_lecture_auth" placeholder="请选择">
                    <a-select-option value="1">是</a-select-option>
                    <a-select-option value="0">否</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :md="8" :sm="24">
                <a-form-item label="用户微信昵称">
                  <a-input @keypress.enter="$refs.table.refresh(true)" v-model="queryParam.wx_nickname"
                           placeholder="请输入用户微信昵称模糊查询" />
                </a-form-item>
              </a-col>
              <a-col :md="8" :sm="24">
                <a-form-item label="注册日期">
                  <a-range-picker @change="onDateChange" v-model="date" style="width: 100%" valueFormat="YYYY-MM-DD" :placeholder="['注册开始日期', '注册结束日期']" />
                </a-form-item>
              </a-col>
              <a-col :md="8" :sm="24">
                <a-form-item label="状态">
                  <a-select v-model="queryParam.status" placeholder="请选择">
                    <a-select-option value="1">正常</a-select-option>
                    <a-select-option value="0">冻结</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </template>
            <a-col :md="!advanced && 8 || 24" :sm="24">
              <span class="table-page-search-submitButtons"
                    :style="advanced && { float: 'right', overflow: 'hidden' } || {} ">
                <a-button type="primary" @click="$refs.table.refresh(true)">查询</a-button>
                <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
                <a @click="toggleAdvanced" style="margin-left: 8px">
                  {{ advanced ? "收起" : "展开" }}
                  <a-icon :type="advanced ? 'up' : 'down'" />
                </a>
              </span>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <div class="table-operator">
        <a-button type="primary" icon="plus" @click="handleAdd" disabled>新建用户</a-button>
        <a-dropdown v-action:edit v-if="selectedRowKeys.length > 0">
          <a-menu slot="overlay">
            <a-menu-item key="1" @click="batchUpdate(1)">
              <a-icon type="eye" />
              发布
            </a-menu-item>
            <!-- lock | unlock -->
            <a-menu-item key="2" @click="batchUpdate(0)">
              <a-icon type="eye-invisible" />
              下线
            </a-menu-item>
          </a-menu>
          <a-button style="margin-left: 8px">
            批量操作
            <a-icon type="down" />
          </a-button>
        </a-dropdown>
      </div>

      <s-table
        ref="table"
        size="default"
        rowKey="id"
        :columns="columns"
        :data="loadData"
        :alert="options.alert"
        :rowSelection="options.rowSelection"
        :showPagination="true"
        :totalNum="totalNum"
        :scroll="{x: 1920}"
      >
        <span slot="serial" slot-scope="text, record, index">
          {{ index + 1 }}
        </span>

        <span slot="if_lecture_auth" slot-scope="text, record, index">
          <span v-if="text" style="color: #59C337;font-weight: bold">是</span>
          <span v-else style="color: #FCAB44;font-weight: bold">否</span>
        </span>

        <span slot="authenticate" slot-scope="text, record, index">
          <span v-if="text === 2" style="color: #59C337;font-weight: bold">已通过认证</span>
          <span v-else-if="text === 1" style="color: #328CDA;font-weight: bold">认证待审核</span>
          <span v-else style="color: #FCAB44;font-weight: bold">未通过认证</span>
        </span>

        <span slot="identity" slot-scope="text, record, index">
          <span v-if="text" style="color: #59C337;font-weight: bold">医师</span>
          <span v-else style="color: #FCAB44;font-weight: bold">患者</span>
        </span>

        <span slot="is_admin" slot-scope="text, record, index">
          <span v-if="text" style="color: #59C337;font-weight: bold">是</span>
          <span v-else style="color: #FCAB44;font-weight: bold">否</span>
        </span>

        <template slot="avatar" slot-scope="text">
          <img style="width: 40px;height: 40px;border-radius: 6px;cursor: pointer" v-if="text" :src="baseUrl + text" alt="avatar">
        </template>

        <template slot="background" slot-scope="text">
          <img style="width: 60px;height: 40px;border-radius: 6px;cursor: pointer" v-if="text" :src="baseUrl + text" alt="background">
        </template>

        <span slot="status" slot-scope="text" style="font-weight: bold">
          <span class="text-item success" v-if="text === 1">
            <a-badge :status="text | statusTypeFilter" :text="text | statusFilter" />
          </span>
          <span class="text-item fail" v-else>
            <a-badge :status="text | statusTypeFilter" :text="text | statusFilter" />
          </span>
        </span>
        <span slot="description" slot-scope="text">
          <ellipsis :length="20" tooltip>{{ text }}</ellipsis>
        </span>

        <span slot="action" slot-scope="text, record">
          <template>
            <a @click="handleEdit(record)">查看信息</a>
            <a-divider type="vertical" />
            <a-popconfirm v-if="record.if_lecture_auth === 0" title="确定为该用户设置讲师权限吗？" ok-text="确定" cancel-text="取消"
                          @confirm="handleUpdateIfLectureAuth(record, 1)">
              <a>设置为讲师</a>
            </a-popconfirm>
            <a-popconfirm v-if="record.if_lecture_auth === 1" title="确定为该用户取消讲师权限吗？" ok-text="确定" cancel-text="取消"
                          @confirm="handleUpdateIfLectureAuth(record, 0)">
              <a>取消讲师</a>
            </a-popconfirm>
          </template>
        </span>
      </s-table>

      <create-form
        ref="createModal"
        :visible="visible"
        :loading="confirmLoading"
        :model="mdl"
        @cancel="handleCancel"
        @ok="handleOk"
      />
      <step-by-step-modal ref="modal" @ok="handleOk" />
    </a-card>
  </page-header-wrapper>
</template>

<script type="jsx">
import moment from "moment";
import { STable, Ellipsis } from "@/components";
import { getRoleList, getServiceList } from "@/api/manage";

import StepByStepModal from "./modules/StepByStepModal";
import CreateForm from "./modules/CreateForm";

import { getAction, postAction, putAction, uploadAction } from "@/utils/manage";
import { prescriptionApi, usersApi } from "@/service/api";

const columns = [
  {
    title: "#",
    scopedSlots: { customRender: "serial" }
  },
  {
    title: "用户名",
    dataIndex: "username"
  },
  {
    title: "用户姓名",
    dataIndex: "name"
  },
  {
    title: "用户头像",
    dataIndex: "avatar",
    scopedSlots: { customRender: "avatar" }
  },
  {
    title: "用户背景",
    dataIndex: "background",
    scopedSlots: { customRender: "background" }
  },
  {
    title: "用户性别",
    dataIndex: "gender",
    customRender: (text) => {
      switch (text) {
        case 0: {
          return "女";
        }
        case 1: {
          return "男";
        }
        default: {
          return "";
        }
      }
    }
  },
  {
    title: "用户手机号",
    dataIndex: "phone"
  },
  {
    title: "用户身份",
    dataIndex: "identity",
    scopedSlots: { customRender: "identity" }
  },
  {
    title: "用户认证",
    dataIndex: "authenticate",
    scopedSlots: { customRender: "authenticate" }
  },
  {
    title: "是否有讲师权限",
    dataIndex: "if_lecture_auth",
    scopedSlots: { customRender: "if_lecture_auth" }
  },
  {
    title: "用户微信昵称",
    dataIndex: "wx_nickname"
  },
  {
    title: "最近登录时间",
    dataIndex: "recent_login_time",
    customRender: (text) => text ? moment(new Date(text), "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss") : ""
  },
  {
    title: "是否为admin权限",
    dataIndex: "is_admin",
    scopedSlots: { customRender: "is_admin" }
  },
  {
    title: "冻结原因",
    dataIndex: "freeze_reason"
  },
  {
    title: "状态",
    dataIndex: "status",
    scopedSlots: { customRender: "status" }
  },
  {
    title: "注册时间",
    dataIndex: "created_at",
    customRender: (text) => text ? moment(new Date(text), "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss") : ""
  },
  {
    title: "操作",
    dataIndex: "action",
    width: "240px",
    scopedSlots: { customRender: "action" },
    fixed: "right"
  }
];

const statusMap = {
  0: {
    status: "error",
    text: "已冻结"
  },
  1: {
    status: "success",
    text: "正常"
  }
};

export default {
  name: "TableList",
  components: {
    STable,
    Ellipsis,
    CreateForm,
    StepByStepModal
  },
  data() {
    this.columns = columns;
    return {
      baseUrl: process.env.VUE_APP_API_BASE_URL + "/",
      date: [],
      // create model
      totalNum: 0,
      visible: false,
      confirmLoading: false,
      mdl: {},
      // 高级搜索 展开/关闭
      advanced: false,
      // 查询参数
      queryParam: {},
      // 加载数据方法 必须为 Promise 对象
      loadData: parameter => {
        const requestParameters = Object.assign({}, parameter, this.queryParam);
        console.log("loadData request parameters:", requestParameters);
        return getAction(usersApi.get, requestParameters)
          .then(res => {
            this.totalNum = res.data.totalCount;
            return res.data;
          }).finally(() => {
            this.$refs.table.clearSelected();
          });
      },
      options: {
        alert: {
          show: true, clear: () => {
            this.selectedRowKeys = [];
          }
        },
        rowSelection: {
          selectedRowKeys: this.selectedRowKeys,
          onChange: this.onSelectChange
        }
      },
      dataSource: [],
      selectedRowKeys: [],
      selectedRows: []
    };
  },
  filters: {
    statusFilter(type) {
      return statusMap[type].text;
    },
    statusTypeFilter(type) {
      return statusMap[type].status;
    }
  },
  created() {
    getRoleList({ t: new Date() });
  },
  computed: {
    rowSelection() {
      return {
        selectedRowKeys: this.selectedRowKeys,
        onChange: this.onSelectChange
      };
    }
  },
  methods: {
    onDateChange(date, dateString) {
      console.log(date, dateString);
      this.queryParam.start_time = date[0]
      this.queryParam.end_time = date[1]
    },
    handleReset() {
      this.queryParam = {};
      this.date = []
      this.$refs.table.refresh(true);
    },
    handleAdd() {
      this.mdl = {};
      this.visible = true;
    },
    handleEdit(record) {
      this.visible = true;
      const mdl = { ...record };
      Object.keys(mdl).map(key => {
        if (typeof mdl[key] === "number") {
          mdl[key] = mdl[key].toString();
        }
      });
      this.mdl = { ...mdl };
    },
    handlePublish(record, status) {
      this.confirmLoading = true;
      const formIn = { ...record, status };
      this.handleUpdateForm(formIn);
    },
    handleUpdateIfLectureAuth(record, status){
      this.confirmLoading = true;
      putAction(usersApi.updateIfLectureAuth, {
        id: record.id,
        if_lecture_auth: status
      }).then(res => {
        this.visible = false;
        this.confirmLoading = false;
        // 刷新表格
        this.$refs.table.refresh();
        this.$refs.createModal.fileList = [];
        console.log("res", res);
        this.$message.success(res.message || "更新成功");
      }).catch(err1 => {
        console.log("err1", err1);
        console.log("err1.data", err1.response);
        this.$message.warning((err1 && err1.response && err1.response.data && err1.response.data.message) || "更新失败");
      }).finally(() => {
        this.confirmLoading = false;
      });
    },
    batchUpdate(status) {
      let that = this;
      this.$confirm({
        title: "提示",
        centered: true,
        content: `确定${status ? "发布" : "下线"}这些处方吗？`,
        onOk() {
          return new Promise((resolve, reject) => {
            putAction(prescriptionApi.batch, {
              ids: that.selectedRowKeys.join(),
              status
            }).then((response) => {
              resolve(response);
              // 刷新表格
              that.$refs.table.refresh();
              that.$message.success(response.message || "操作成功");
            }).catch(err => {
              that.$message.error((err.data && err.data.message) || "操作失败");
              reject(err);
            });
          });
        }
      });
    },
    handleCreateForm(formIn) {
      const form = this.$refs.createModal.form;
      postAction(prescriptionApi.create, formIn).then(res => {
        this.visible = false;
        this.confirmLoading = false;
        // 重置表单数据
        form.resetFields();
        // 刷新表格
        this.$refs.table.refresh();
        this.$refs.createModal.fileList = [];
        this.$message.success(res.message || "添加成功");
      }).catch(err1 => {
        this.$message.error((err1.data && err1.data.message) || "添加失败");
      }).finally(() => {
        this.confirmLoading = false;
      });
    },
    handleUpdateForm(formIn) {
      const form = this.$refs.createModal.form;
      putAction(prescriptionApi.update, formIn).then(res => {
        this.visible = false;
        this.confirmLoading = false;
        // 重置表单数据
        form.resetFields();
        // 刷新表格
        this.$refs.table.refresh();
        this.$refs.createModal.fileList = [];
        console.log("res", res);
        this.$message.success(res.message || "更新成功");
      }).catch(err1 => {
        console.log("err1", err1);
        console.log("err1.data", err1.data);
        this.$message.error((err1.data && err1.data.message) || "更新失败");
      }).finally(() => {
        this.confirmLoading = false;
      });
    },
    handleOk() {
      const form = this.$refs.createModal.form;
      this.confirmLoading = true;
      form.validateFields((errors, values) => {
        if (!errors) {
          console.log("values", values);
          const formIn = { ...values };
          Object.keys(formIn).map(key => {
            if (["prescription_type", "difficulty", "part", "symptoms", "phase", "status"].includes(key)) {
              formIn[key] = Number(formIn[key]);
            }
          });
          if (!values.id) {
            // 修改 e.g.
            const formDataVideo = new FormData();
            formDataVideo.append("file", this.$refs.createModal.form.getFieldValue("prescription_video").file);
            const formDataCover = new FormData();
            formDataCover.append("file", this.$refs.createModal.form.getFieldValue("cover").file);
            Promise.all([
              uploadAction(prescriptionApi.uploadVideo, formDataVideo),
              uploadAction(prescriptionApi.uploadCover, formDataCover)
            ]).then(responses => {
              formIn.prescription_video = responses[0].data;
              formIn.cover = responses[1].data;
              this.handleCreateForm(formIn);
            }).catch(err => {
              this.$message.error((err.data && err.data.message) || "添加失败");
            }).finally(() => {
              this.confirmLoading = false;
            });
          } else {
            console.log("formIn", formIn);
            if (!this.$refs.createModal.fileList.length && !this.$refs.createModal.fileListImg.length) {
              this.handleUpdateForm(formIn);
            } else {
              const formDataVideo = new FormData();
              formDataVideo.append("file", this.$refs.createModal.form.getFieldValue("prescription_video").file);
              const formDataCover = new FormData();
              formDataCover.append("file", this.$refs.createModal.form.getFieldValue("cover").file);
              Promise.all([
                uploadAction(prescriptionApi.uploadVideo, formDataVideo),
                uploadAction(prescriptionApi.uploadCover, formDataCover)
              ]).then(responses => {
                formIn.prescription_video = responses[0].data;
                formIn.cover = responses[1].data;
                this.handleUpdateForm(formIn);
              }).catch(err => {
                this.$message.error((err.data && err.data.message) || "更新失败");
              }).finally(() => {
                this.confirmLoading = false;
              });
            }
          }
        } else {
          this.confirmLoading = false;
        }
      });
    },
    handleCancel() {
      this.visible = false;

      const form = this.$refs.createModal.form;
      form.resetFields(); // 清理表单数据（可不做）
    },
    handleSub(record) {
      if (record.status !== 0) {
        this.$message.info(`${record.no} 订阅成功`);
      } else {
        this.$message.error(`${record.no} 订阅失败，规则已关闭`);
      }
    },
    onSelectChange(selectedRowKeys, selectedRows) {
      this.selectedRowKeys = selectedRowKeys;
      this.selectedRows = selectedRows;
    },
    toggleAdvanced() {
      this.advanced = !this.advanced;
    },
    resetSearchForm() {
      this.queryParam = {
        date: moment(new Date())
      };
    }
  }
};
</script>

<style lang="less">
.text-item {
  &.success .ant-badge-status-text {
    color: #52c41a;
  }

  &.fail .ant-badge-status-text {
    color: #F42132;
  }
}
</style>
