<template>
  <page-header-wrapper>
    <a-card :bordered="false" v-if="!showVideo">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="8" :sm="24">
              <a-form-item label="器材编号">
                <a-input @keypress.enter="$refs.table.refresh(true)" v-model="queryParam.serial_number"
                         placeholder="请输入器材编号模糊查询" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="器材标题">
                <a-input @keypress.enter="$refs.table.refresh(true)" v-model="queryParam.title"
                         placeholder="请输入器材标题模糊查询" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="器材类型">
                <a-select v-model="queryParam.equipment_type" placeholder="请选择">
                  <a-select-option value="0">康复训练器材</a-select-option>
                  <a-select-option value="1">康复理疗设备</a-select-option>
                  <a-select-option value="2">康复治疗师工具</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <template v-if="advanced">
              <a-col :md="8" :sm="24">
                <a-form-item label="是否包含折扣">
                  <a-select v-model="queryParam.has_discount" placeholder="请选择">
                    <a-select-option value="1">是</a-select-option>
                    <a-select-option value="0">否</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :md="8" :sm="24">
                <a-form-item label="是否轮播">
                  <a-select v-model="queryParam.carousel" placeholder="请选择">
                    <a-select-option value="1">是</a-select-option>
                    <a-select-option value="0">否</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :md="8" :sm="24">
                <a-form-item label="发布日期">
                  <a-date-picker v-model="queryParam.date" style="width: 100%" placeholder="请输入更新日期" />
                </a-form-item>
              </a-col>
              <a-col :md="8" :sm="24">
                <a-form-item label="状态">
                  <a-select v-model="queryParam.status" placeholder="请选择">
                    <a-select-option value="0">已发布</a-select-option>
                    <a-select-option value="1">已下架</a-select-option>
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
        <a-button type="primary" icon="plus" @click="handleAdd">添加器材</a-button>
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

        <span slot="model_num" :style="{color: text ? '#333' : '#F42132'}" slot-scope="text">
          {{ text }}
        </span>

        <span slot="has_discount" :style="{color: text ? '#59C337' : '#333'}" slot-scope="text">
          {{ text ? "是" : "否" }}
        </span>

        <span slot="carousel" :style="{color: text ? '#59C337' : '#333'}" slot-scope="text">
          {{ text ? "是" : "否" }}
        </span>

        <span slot="action" slot-scope="text, record">
          <template>
            <a @click="handleEdit(record)">编辑</a>
            <a-divider type="vertical" />
            <a @click="handleConfigVideo(record)">配置型号</a>
            <a-divider type="vertical" />
            <a @click="handleCarousel(record, record.carousel ? 0 : 1)">{{ record.carousel ? "结束轮播" : "开始轮播" }}</a>
            <a-divider type="vertical" />
            <a-popconfirm v-if="record.status === 0" title="确定发布上线该器材吗？" ok-text="确定" cancel-text="取消"
                          @confirm="handlePublish(record, 1)">
              <a>快速发布</a>
            </a-popconfirm>
            <a-popconfirm v-if="record.status === 1" title="确定下线该器材吗？" ok-text="确定" cancel-text="取消"
                          @confirm="handlePublish(record, 0)">
              <a>快速下线</a>
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


    <a-card :bordered="false" v-else>
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="8" :sm="24">
              <a-form-item label="型号标题">
                <a-input @keypress.enter="$refs.tableModel.refresh(true)" v-model="queryParamVideo.title"
                         placeholder="请输入型号标题模糊查询" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-button type="primary" @click="$refs.tableModel.refresh(true)">查询</a-button>
              <a-button style="margin-left: 8px" @click="handleResetVideo">重置</a-button>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <div class="table-operator">
        <a-button icon="left" @click="handleBack" style="margin-right: 24px">返回</a-button>
        <a-button type="primary" icon="plus" @click="handleAddVideo">添加型号</a-button>
        <a-dropdown v-action:edit v-if="selectedRowKeysVideo.length > 0">
          <a-menu slot="overlay">
            <a-menu-item key="1" @click="batchUpdateVideo(1)">
              <a-icon type="eye" />
              发布
            </a-menu-item>
            <!-- lock | unlock -->
            <a-menu-item key="2" @click="batchUpdateVideo(0)">
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

      <div class="table-show" v-if="showVideo">
        <span>当前选择器材：<span>{{ equipment_name }}</span></span>
      </div>

      <s-table
        ref="tableModel"
        size="default"
        rowKey="id"
        :columns="columnsModel"
        :data="loadDataVideo"
        :alert="optionsModel.alert"
        :rowSelection="optionsModel.rowSelection"
        :showPagination="true"
        :totalNum="totalNumModel"
        :scroll="{x: 1920}"
      >
        <span slot="serial" slot-scope="text, record, index">
          {{ index + 1 }}
        </span>
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

        <span slot="parameter" slot-scope="text">
          <ellipsis :length="20" tooltip>{{ text }}</ellipsis>
        </span>

        <span slot="inventory" :style="{color: text ? '#333' : '#F42132'}" slot-scope="text">
          {{ text ? text : '0 (库存不足)' }}
        </span>

        <span slot="is_discount" :style="{color: text ? '#FBAC33' : '#333'}" slot-scope="text">
          {{ text ? "是" : "否" }}
        </span>

        <span slot="discount" :style="{color: record.is_discount ? '#FBAC33' : '#333'}" slot-scope="text, record">
          {{ record.is_discount ? text : "" }}
        </span>

        <span slot="discount_validity" :style="{color: record.is_discount ? '#FBAC33' : '#333'}"
              slot-scope="text, record">
          {{ record.is_discount ? moment(new Date(text), "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss") : "" }}
        </span>

        <span slot="action" slot-scope="text, record">
          <template>
            <a @click="handleEditModel(record)">编辑</a>
            <a-divider type="vertical" />
            <a-popconfirm v-if="record.status === 0" title="确定发布上线该型号吗？" ok-text="确定" cancel-text="取消"
                          @confirm="handlePublishVideo(record, 1)">
              <a>快速发布</a>
            </a-popconfirm>
            <a-popconfirm v-if="record.status === 1" title="确定下线该型号吗？注意：如果型号全部下线，器材商品也将自动下线。" ok-text="确定"
                          cancel-text="取消"
                          @confirm="handlePublishVideo(record, 0)">
              <a>快速下线</a>
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

      <create-form-model
        ref="createModalModel"
        :visible="visibleModel"
        :loading="confirmLoadingModel"
        :model="mdlModel"
        @cancel="handleCancelModel"
        @ok="handleOkModel"
      />
      <step-by-step-modal ref="modal" @ok="handleOk" />
    </a-card>
  </page-header-wrapper>
</template>

<script>
import moment from "moment";
import { STable, Ellipsis } from "@/components";
import { getRoleList, getServiceList } from "@/api/manage";

import StepByStepModal from "./modules/StepByStepModal";
import CreateForm from "./modules/CreateForm";
import CreateFormModel from "./modules/CreateFormModel";

import { getAction, postAction, putAction, uploadAction } from "@/utils/manage";
import { equipmentApi, equipmentModelApi } from "@/service/api";

const columns = [
  {
    title: "#",
    scopedSlots: { customRender: "serial" }
  },
  {
    title: "器材编号",
    dataIndex: "serial_number"
  },
  {
    title: "器材标题",
    dataIndex: "title"
  },
  {
    title: "器材介绍",
    dataIndex: "description",
    scopedSlots: { customRender: "description" }
  },
  {
    title: "器材类型",
    dataIndex: "equipment_type",
    customRender: (text) => text === 0 ? '康复训练器材' : text === 1 ? '康复理疗设备' : text === 2 ? '康复治疗师工具' : ''
  },
  {
    title: "上线型号数",
    dataIndex: "model_num",
    scopedSlots: { customRender: "model_num" }
  },
  {
    title: "购买总次数",
    dataIndex: "frequency_total_num",
    sorter: true
  },
  {
    title: "是否包含折扣",
    dataIndex: "has_discount",
    scopedSlots: { customRender: "has_discount" }
  },
  {
    title: "是否轮播",
    dataIndex: "carousel",
    scopedSlots: { customRender: "carousel" }
  },
  {
    title: "最近发布时间",
    dataIndex: "publish_time",
    customRender: (text) => text ? moment(new Date(text), "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss") : ""
  },
  {
    title: "状态",
    dataIndex: "status",
    scopedSlots: { customRender: "status" }
  },
  {
    title: "操作",
    dataIndex: "action",
    width: "280px",
    scopedSlots: { customRender: "action" },
    fixed: "right"
  }
];

const columnsModel = [
  {
    title: "#",
    scopedSlots: { customRender: "serial" }
  },
  {
    title: "型号标题",
    dataIndex: "title"
  },
  {
    title: "型号介绍",
    dataIndex: "description",
    scopedSlots: { customRender: "description" }
  },
  {
    title: "参数信息",
    dataIndex: "parameter",
    scopedSlots: { customRender: "description" }
  },
  {
    title: "品牌",
    dataIndex: "brand"
  },
  {
    title: "购买次数",
    dataIndex: "frequency_num",
    sorter: true
  },
  {
    title: "售价",
    dataIndex: "price"
  },
  {
    title: "是否折扣",
    dataIndex: "is_discount",
    scopedSlots: { customRender: "is_discount" }
  },
  {
    title: "折扣价",
    dataIndex: "discount",
    scopedSlots: { customRender: "discount" }
  },
  {
    title: "折扣有效期",
    dataIndex: "discount_validity",
    scopedSlots: { customRender: "discount_validity" }
  },
  {
    title: "库存数",
    dataIndex: "inventory",
    scopedSlots: { customRender: "inventory" }
  },
  {
    title: "发货地",
    dataIndex: "dispatch_place"
  },
  {
    title: "型号排序",
    dataIndex: "sort"
  },
  {
    title: "最近发布时间",
    dataIndex: "created_at",
    customRender: (text) => text ? moment(new Date(text), "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss") : ""
  },
  {
    title: "状态",
    dataIndex: "status",
    scopedSlots: { customRender: "status" }
  },
  {
    title: "操作",
    dataIndex: "action",
    width: "280px",
    scopedSlots: { customRender: "action" },
    fixed: "right"
  }
];

const statusMap = {
  0: {
    status: "error",
    text: "已下线"
  },
  1: {
    status: "success",
    text: "已发布"
  }
};

export default {
  name: "TableList",
  components: {
    STable,
    Ellipsis,
    CreateForm,
    CreateFormModel,
    StepByStepModal
  },
  data() {
    this.columns = columns;
    this.columnsModel = columnsModel;
    return {
      // create model
      moment,
      totalNum: 0,
      totalNumModel: 0,
      visible: false,
      confirmLoading: false,
      mdl: null,
      visibleModel: false,
      confirmLoadingModel: false,
      mdlModel: null,
      // 高级搜索 展开/关闭
      advanced: false,
      // 查询参数
      queryParam: {},
      queryParamVideo: {},
      // 加载数据方法 必须为 Promise 对象
      loadData: parameter => {
        const requestParameters = Object.assign({}, parameter, this.queryParam);
        console.log("loadData request parameters:", requestParameters);
        return getAction(equipmentApi.get, requestParameters)
          .then(res => {
            this.totalNum = res.data.totalCount;
            return res.data;
          }).catch(err => {
            return {
              pageNo: 1,
              pageSize: 10,
              totalCount: 0,
              totalPage: 0,
              data: []
            };
          }).finally(() => {
            this.$refs.table.clearSelected();
          });
      },
      loadDataVideo: parameter => {
        const requestParameters = Object.assign({}, parameter, this.queryParamVideo);
        requestParameters.equipment_id = this.equipment_id;
        console.log("loadData request parameters:", requestParameters);
        return getAction(equipmentModelApi.get, requestParameters)
          .then(res => {
            this.totalNumModel = res.data.totalCount;
            return res.data;
          }).catch(err => {
            return {
              pageNo: 1,
              pageSize: 10,
              totalCount: 0,
              totalPage: 0,
              data: []
            };
          }).finally(() => {
            this.$refs.tableModel.clearSelected();
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
      optionsModel: {
        alert: {
          show: true, clear: () => {
            this.selectedRowKeysVideo = [];
          }
        },
        rowSelection: {
          selectedRowKeys: this.selectedRowKeysVideo,
          onChange: this.onSelectChangeVideo
        }
      },
      dataSource: [],
      selectedRowKeys: [],
      selectedRows: [],
      dataSourceVideo: [],
      selectedRowKeysVideo: [],
      selectedRowsVideo: [],
      showVideo: false,
      equipment_id: "",
      equipment_name: ""
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
    handleReset() {
      this.queryParam = {};
      this.$refs.table.refresh(true);
    },
    handleResetVideo() {
      this.queryParamVideo = {};
      this.$refs.tableModel.refresh(true);
    },
    handleBack() {
      this.queryParamVideo = {};
      this.equipment_id = "";
      this.equipment_name = "";
      this.showVideo = false;
      this.$nextTick(() => {
        this.$refs.table.refresh(true);
      });
    },
    handleAdd() {
      this.mdl = null;
      this.visible = true;
    },
    handleAddVideo() {
      this.mdlModel = null;
      this.visibleModel = true;
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
    handleEditModel(record) {
      this.visibleModel = true;
      const mdl = { ...record };
      Object.keys(mdl).map(key => {
        if (typeof mdl[key] === "number") {
          mdl[key] = mdl[key].toString();
        }
      });
      this.mdlModel = { ...mdl };
    },
    handleConfigVideo(record) {
      this.queryParam = {};
      this.equipment_id = record.id;
      this.equipment_name = record.title;
      this.showVideo = true;
      this.$nextTick(() => {
        this.$refs.tableModel.refresh(true);
      });
    },
    handlePublish(record, status) {
      if (status && !record.model_num) {
        this.$message.warning("该器材未关联相关型号，无法发布");
        return;
      }
      this.confirmLoading = true;
      const formIn = { ...record, status };
      this.handleUpdateForm(formIn);
    },
    handlePublishVideo(record, status) {
      this.confirmLoadingModel = true;
      const formIn = { ...record, status };
      this.handleUpdateFormModel(formIn);
    },
    handleCarousel(record, status) {
      let that = this;
      const formIn = { ...record, carousel: status };
      this.$confirm({
        title: "提示",
        centered: true,
        content: h => <span>确定对该器材{status ? "开始轮播" : "结束轮播"}吗？<br /><br /><span
          style="color: #096dd9">轮播规则：一个以上开启轮播；至少为三个，不够则从最新的课程补齐；最多为五个，若超过五个，则取最新的五个。</span></span>,
        onOk() {
          return new Promise((resolve, reject) => {
            that.handleUpdateForm(formIn).then((response) => {
              resolve(response);
            }).catch(err => {
              reject(err);
            });
          });
        }
      });
    },
    batchUpdate(status) {
      if (this.selectedRows.find(item => !item.model_num) && status) {
        this.$message.warning("所选中存在未关联型号的器材，无法发布");
        return;
      }
      let that = this;
      this.$confirm({
        title: "提示",
        centered: true,
        content: `确定${status ? "发布" : "下线"}这些器材吗？`,
        onOk() {
          return new Promise((resolve, reject) => {
            putAction(equipmentApi.batch, {
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
    batchUpdateVideo(status) {
      let that = this;
      this.$confirm({
        title: "提示",
        centered: true,
        content: `确定${status ? "发布" : "下线"}这些型号吗？注意：如果全部下架，那么该器材也将跟随下架。`,
        onOk() {
          return new Promise((resolve, reject) => {
            putAction(equipmentModelApi.batch, {
              ids: that.selectedRowKeysVideo.join(),
              equipment_id: that.equipment_id,
              status
            }).then((response) => {
              resolve(response);
              // 刷新表格
              that.$refs.tableModel.refresh();
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
      return new Promise((resolve, reject) => {
        postAction(equipmentApi.create, formIn).then(res => {
          this.visible = false;
          this.confirmLoading = false;
          // 重置表单数据
          form.resetFields();
          // 刷新表格
          this.$refs.table.refresh();
          this.$refs.createModal.fileList = [];
          this.$refs.createModal.fileListLong = [];
          this.$refs.createModal.fileListImg = [];
          this.$message.success(res.message || "添加成功");
          resolve(res)
        }).catch(err1 => {
          this.$message.error((err1.data && err1.data.message) || "添加失败");
          reject(err1)
        }).finally(() => {
          this.confirmLoading = false;
        });
      })
    },
    handleCreateFormModel(formIn) {
      const form = this.$refs.createModalModel.form;
      return new Promise((resolve, reject) => {
        postAction(equipmentModelApi.create, formIn).then(res => {
          this.visibleModel = false;
          this.confirmLoadingModel = false;
          // 重置表单数据
          form.resetFields();
          // 刷新表格
          this.$refs.tableModel.refresh();
          this.$refs.createModalModel.fileList = [];
          this.$refs.createModalModel.fileListImg = [];
          this.$message.success(res.message || "添加成功");
          resolve(res)
        }).catch(err1 => {
          this.$message.error((err1.data && err1.data.message) || "添加失败");
          reject(err1)
        }).finally(() => {
          this.confirmLoadingModel = false;
        });
      })
    },
    handleUpdateForm(formIn) {
      const form = this.$refs.createModal.form;
      return new Promise((resolve, reject) => {
        putAction(equipmentApi.update, formIn).then(res => {
          this.visible = false;
          this.confirmLoading = false;
          // 重置表单数据
          form.resetFields();
          // 刷新表格
          this.$refs.table.refresh();
          this.$refs.createModal.fileList = [];
          this.$refs.createModal.fileListLong = [];
          this.$refs.createModal.fileListImg = [];
          console.log("res", res);
          this.$message.success(res.message || "更新成功");
          resolve(res);
        }).catch(err1 => {
          console.log("err1", err1);
          console.log("err1.data", err1.data);
          this.$message.error((err1.data && err1.data.message) || "更新失败");
          reject(err1);
        }).finally(() => {
          this.confirmLoading = false;
        });
      });
    },
    handleUpdateFormModel(formIn) {
      const form = this.$refs.createModalModel.form;
      return new Promise((resolve, reject) => {
        putAction(equipmentModelApi.update, formIn).then(res => {
          this.visibleModel = false;
          this.confirmLoadingModel = false;
          // 重置表单数据
          form.resetFields();
          // 刷新表格
          this.$refs.tableModel.refresh();
          this.$refs.createModalModel.fileList = [];
          this.$refs.createModal.fileListLong = [];
          this.$refs.createModalModel.fileListImg = [];
          console.log("res", res);
          this.$message.success(res.message || "更新成功");
          resolve(res);
        }).catch(err1 => {
          console.log("err1", err1);
          console.log("err1.data", err1.data);
          this.$message.error((err1.data && err1.data.message) || "更新失败");
          reject(err1);
        }).finally(() => {
          this.confirmLoadingModel = false;
        });
      });
    },
    handleOk() {
      const form = this.$refs.createModal.form;
      form.validateFields((errors, values) => {
        if (!errors) {
          this.confirmLoading = true;
          console.log("values", values);
          const formIn = { ...values };
          Object.keys(formIn).map(key => {
            if (["equipment_type", "carousel", "status"].includes(key)) {
              formIn[key] = Number(formIn[key]);
            }
          });
          if (!values.id) {
            // 修改 e.g.
            const formDataCover = new FormData();
            formDataCover.append("file", this.$refs.createModal.form.getFieldValue("cover").file);
            const formDataLongAll = [];
            this.$refs.createModal.fileListLong.map(file => {
              if (!file.ready) {
                const formDataLong = new FormData();
                formDataLong.append("file", file);
                formDataLongAll.push(formDataLong);
              }
            });
            Promise.all([
              uploadAction(equipmentApi.uploadCover, formDataCover),
              ...formDataLongAll.map(formData => uploadAction(equipmentApi.updateLong, formData))
            ]).then(async (responses) => {
              console.log("responses", responses);
              formIn.cover = responses[0].data;
              formIn.long_figure = responses.slice(1, responses.length).map(response => response.data).join(",");
              console.log("formIn", formIn);
              await this.handleCreateForm(formIn);
            }).catch(err => {
              this.$message.error((err.data && err.data.message) || "添加失败");
            }).finally(() => {
              this.confirmLoading = false;
            });
          } else {
            console.log("formIn", formIn);
            if (!this.$refs.createModal.fileListImg.length && !this.$refs.createModal.fileListLong.length) {
              this.handleUpdateForm(formIn);
            } else {
              const promiseList = []
              if (this.$refs.createModal.fileListImg.length){
                const formDataCover = new FormData();
                formDataCover.append("file", this.$refs.createModal.form.getFieldValue("cover").file);
                promiseList.push(uploadAction(equipmentApi.uploadCover, formDataCover))
              }
              if (this.$refs.createModal.fileListLong.length){
                this.$refs.createModal.fileListLong.map(file => {
                  if (!file.ready) {
                    const formDataLong = new FormData();
                    formDataLong.append("file", file);
                    promiseList.push(uploadAction(equipmentApi.updateLong, formDataLong));
                  }
                });
              }
              Promise.all(promiseList).then(async (responses) => {
                let uploadPaths = []
                if (this.$refs.createModal.fileListImg.length){
                  formIn.cover = responses[0].data;
                  uploadPaths = responses.slice(1, responses.length).map(response => response.data);
                }else{
                  uploadPaths = responses.map(response => response.data);
                }
                if (this.$refs.createModal.fileListLong.length){
                  const readyPaths = this.$refs.createModal.fileListLong.filter(file => file.ready).map(file => file.path);
                  const paths = [...readyPaths, ...uploadPaths];
                  formIn.long_figure = paths.join(",");
                }
                await this.handleUpdateForm(formIn);
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
    handleOkModel() {
      const form = this.$refs.createModalModel.form;
      form.validateFields((errors, values) => {
        if (!errors) {
          this.confirmLoadingModel = true;
          console.log("values", values);
          const formIn = { ...values };
          Object.keys(formIn).map(key => {
            if (["sort", "status", "is_discount", "inventory"].includes(key)) {
              formIn[key] = Number(formIn[key]);
            }
          });
          formIn.equipment_id = this.equipment_id;
          if (!values.id) {
            // 修改 e.g.
            const formDataLongAll = [];
            this.$refs.createModalModel.fileListLong.map(file => {
              if (!file.ready) {
                const formDataLong = new FormData();
                formDataLong.append("file", file);
                formDataLongAll.push(formDataLong);
              }
            });
            Promise.all([
              ...formDataLongAll.map(formData => uploadAction(equipmentModelApi.uploadDataMultiFigure, formData))
            ]).then(async (responses) => {
              formIn.multi_figure = responses.map(response => response.data).join(",");
              console.log("formIn", formIn);
              await this.handleCreateFormModel(formIn);
            }).catch(err => {
              this.$message.error((err.data && err.data.message) || "添加失败");
            }).finally(() => {
              this.confirmLoadingModel = false;
            });
          } else {
            console.log("formIn", formIn);
            if (!this.$refs.createModalModel.fileListLong.length) {
              this.handleUpdateFormModel(formIn);
            } else {
              const promiseList = []
              if (this.$refs.createModalModel.fileListLong.length){
                this.$refs.createModalModel.fileListLong.map(file => {
                  if (!file.ready) {
                    const formDataLong = new FormData();
                    formDataLong.append("file", file);
                    promiseList.push(uploadAction(equipmentModelApi.uploadDataMultiFigure, formDataLong));
                  }
                });
              }
              Promise.all(promiseList).then(async (responses) => {
                const uploadPaths = responses.map(response => response.data);
                if (this.$refs.createModalModel.fileListLong.length){
                  const readyPaths = this.$refs.createModalModel.fileListLong.filter(file => file.ready).map(file => file.path);
                  const paths = [...readyPaths, ...uploadPaths];
                  formIn.multi_figure = paths.join(",");
                }
                await this.handleUpdateFormModel(formIn);
              }).catch(err => {
                this.$message.error((err.data && err.data.message) || "更新失败");
              }).finally(() => {
                this.confirmLoadingModel = false;
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
    handleCancelModel() {
      this.visibleModel = false;
      const form = this.$refs.createModalModel.form;
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
    onSelectChangeVideo(selectedRowKeys, selectedRows) {
      this.selectedRowKeysVideo = selectedRowKeys;
      this.selectedRowsVideo = selectedRows;
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

<style lang="less" scoped>
.table-show{
  width: 100%;
  height: 39px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  background-color: #e7bbcd;
  border: 1px solid #B2024A;
  margin-bottom: 16px;
  padding-left: 24px;

  > span {
    font-size: 14px;
    color: #000;

    > span {
      color: #B2024A;
      font-weight: bold;
      padding-left: 6px;
    }
  }
}
</style>