<template>
  <page-header-wrapper>
    <a-card :bordered="false" v-if="!showVideo">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="8" :sm="24">
              <a-form-item label="课程标题">
                <a-input @keypress.enter="$refs.table.refresh(true)" v-model="queryParam.title"
                         placeholder="请输入课程标题模糊查询" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="视频数">
                <a-select v-model="queryParam.video_num_range" placeholder="请选择">
                  <a-select-option value="0">1-2个</a-select-option>
                  <a-select-option value="1">3-5个</a-select-option>
                  <a-select-option value="2">6-10个</a-select-option>
                  <a-select-option value="3">11-20个</a-select-option>
                  <a-select-option value="4">20个以上</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <template v-if="advanced">
              <a-col :md="8" :sm="24">
                <a-form-item label="售价范围">
                  <a-select v-model="queryParam.price_range" placeholder="请选择">
                    <a-select-option value="0">0-100</a-select-option>
                    <a-select-option value="1">100-500</a-select-option>
                    <a-select-option value="2">500-1000</a-select-option>
                    <a-select-option value="3">1000-3000</a-select-option>
                    <a-select-option value="4">3000-10000</a-select-option>
                    <a-select-option value="5">10000以上</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :md="8" :sm="24">
                <a-form-item label="是否折扣">
                  <a-select v-model="queryParam.is_discount" placeholder="请选择">
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
                    <a-select-option value="1">已下线</a-select-option>
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
        <a-button type="primary" icon="plus" @click="handleAdd">新建课程</a-button>
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

        <span slot="video_num" :style="{color: text ? '#333' : '#F42132'}" slot-scope="text">
          {{ text }}
        </span>

        <span slot="is_discount" :style="{color: text ? '#FBAC33' : '#333'}" slot-scope="text">
          {{ text ? "是" : "否" }}
        </span>

        <span slot="carousel" :style="{color: text ? '#59C337' : '#333'}" slot-scope="text">
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
            <a @click="handleEdit(record)">编辑</a>
            <a-divider type="vertical" />
            <a @click="handleConfigVideo(record)">配置视频</a>
            <a-divider type="vertical" />
            <a @click="handleCarousel(record, record.carousel ? 0 : 1)">{{ record.carousel ? "结束轮播" : "开始轮播" }}</a>
            <a-divider type="vertical" />
            <a-popconfirm v-if="record.status === 0" title="确定发布上线该课程吗？" ok-text="确定" cancel-text="取消"
                          @confirm="handlePublish(record, 1)">
              <a>快速发布</a>
            </a-popconfirm>
            <a-popconfirm v-if="record.status === 1" title="确定下线该课程吗？" ok-text="确定" cancel-text="取消"
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
              <a-form-item label="视频标题">
                <a-input @keypress.enter="$refs.tableVideo.refresh(true)" v-model="queryParamVideo.title"
                         placeholder="请输入课程标题模糊查询" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-button type="primary" @click="$refs.tableVideo.refresh(true)">查询</a-button>
              <a-button style="margin-left: 8px" @click="handleResetVideo">重置</a-button>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <div class="table-operator">
        <a-button icon="left" @click="handleBack" style="margin-right: 24px">返回</a-button>
        <a-button type="primary" icon="plus" @click="handleAddVideo">添加视频</a-button>
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

      <s-table
        ref="tableVideo"
        size="default"
        rowKey="id"
        :columns="columnsVideo"
        :data="loadDataVideo"
        :alert="optionsVideo.alert"
        :rowSelection="optionsVideo.rowSelection"
        :showPagination="true"
        :totalNum="totalNumVideo"
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

        <span slot="action" slot-scope="text, record">
          <template>
            <a @click="handleEditVideo(record)">编辑</a>
            <a-divider type="vertical" />
            <a-popconfirm v-if="record.status === 0" title="确定发布上线该视频吗？" ok-text="确定" cancel-text="取消"
                          @confirm="handlePublishVideo(record, 1)">
              <a>快速发布</a>
            </a-popconfirm>
            <a-popconfirm v-if="record.status === 1" title="确定下线该视频吗？注意：如果视频全部下线，课程也将自动下线。" ok-text="确定" cancel-text="取消"
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

      <create-form-video
        ref="createModalVideo"
        :visible="visibleVideo"
        :loading="confirmLoadingVideo"
        :model="mdlVideo"
        @cancel="handleCancelVideo"
        @ok="handleOkVideo"
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
import CreateFormVideo from "./modules/CreateFormVideo";

import { getAction, postAction, putAction, uploadAction } from "@/utils/manage";
import { videoCourseApi, courseInVideoApi } from "@/service/api";

const columns = [
  {
    title: "#",
    scopedSlots: { customRender: "serial" }
  },
  {
    title: "课程标题",
    dataIndex: "title"
  },
  {
    title: "课程描述",
    dataIndex: "description",
    scopedSlots: { customRender: "description" }
  },
  {
    title: "上线视频数",
    dataIndex: "video_num",
    scopedSlots: { customRender: "video_num" }
  },
  {
    title: "购买人数",
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

const columnsVideo = [
  {
    title: "#",
    scopedSlots: { customRender: "serial" }
  },
  {
    title: "视频标题",
    dataIndex: "title"
  },
  {
    title: "视频描述",
    dataIndex: "description",
    scopedSlots: { customRender: "description" }
  },
  {
    title: "视频时长",
    dataIndex: "time_length"
  },
  {
    title: "视频排序",
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
    CreateFormVideo,
    StepByStepModal
  },
  data() {
    this.columns = columns;
    this.columnsVideo = columnsVideo;
    return {
      // create model
      moment,
      totalNum: 0,
      totalNumVideo: 0,
      visible: false,
      confirmLoading: false,
      mdl: null,
      visibleVideo: false,
      confirmLoadingVideo: false,
      mdlVideo: null,
      // 高级搜索 展开/关闭
      advanced: false,
      // 查询参数
      queryParam: {},
      queryParamVideo: {},
      // 加载数据方法 必须为 Promise 对象
      loadData: parameter => {
        const requestParameters = Object.assign({}, parameter, this.queryParam);
        console.log("loadData request parameters:", requestParameters);
        return getAction(videoCourseApi.get, requestParameters)
          .then(res => {
            this.totalNum = res.data.totalCount;
            return res.data;
          }).catch(err=>{
            return {
              pageNo: 1,
              pageSize: 10,
              totalCount: 0,
              totalPage: 0,
              data: []
            }
          }).finally(() => {
            this.$refs.table.clearSelected();
          });
      },
      loadDataVideo: parameter => {
        const requestParameters = Object.assign({}, parameter, this.queryParamVideo);
        requestParameters.course_id = this.course_id
        console.log("loadData request parameters:", requestParameters);
        return getAction(courseInVideoApi.get, requestParameters)
          .then(res => {
            this.totalNumVideo = res.data.totalCount;
            return res.data;
          }).catch(err=>{
            return {
              pageNo: 1,
              pageSize: 10,
              totalCount: 0,
              totalPage: 0,
              data: []
            }
          }).finally(() => {
            this.$refs.tableVideo.clearSelected();
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
      optionsVideo: {
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
      course_id: ""
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
      this.$refs.tableVideo.refresh(true);
    },
    handleBack() {
      this.queryParamVideo = {};
      this.course_id = "";
      this.showVideo = false;
      this.$nextTick(()=>{
        this.$refs.table.refresh(true);
      })
    },
    handleAdd() {
      this.mdl = null;
      this.visible = true;
    },
    handleAddVideo() {
      this.mdlVideo = null;
      this.visibleVideo = true;
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
    handleEditVideo(record) {
      this.visibleVideo = true;
      const mdl = { ...record };
      Object.keys(mdl).map(key => {
        if (typeof mdl[key] === "number") {
          mdl[key] = mdl[key].toString();
        }
      });
      this.mdlVideo = { ...mdl };
    },
    handleConfigVideo(record) {
      this.queryParam = {};
      this.course_id = record.id;
      this.showVideo = true;
      this.$nextTick(()=>{
        this.$refs.tableVideo.refresh(true);
      })
    },
    handlePublish(record, status) {
      if (status && !record.video_num) {
        this.$message.warning("该课程未关联视频，无法发布");
        return;
      }
      this.confirmLoading = true;
      const formIn = { ...record, status };
      this.handleUpdateForm(formIn);
    },
    handlePublishVideo(record, status) {
      this.confirmLoadingVideo = true;
      const formIn = { ...record, status };
      this.handleUpdateFormVideo(formIn);
    },
    handleCarousel(record, status) {
      let that = this;
      const formIn = { ...record, carousel: status };
      this.$confirm({
        title: "提示",
        centered: true,
        content: h => <span>确定对该课程{status ? "开始轮播" : "结束轮播"}吗？<br /><br /><span
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
      if (this.selectedRows.find(item => !item.video_num) && status) {
        this.$message.warning("所选中存在未关联视频的课程，无法发布");
        return;
      }
      let that = this;
      this.$confirm({
        title: "提示",
        centered: true,
        content: `确定${status ? "发布" : "下线"}这些课程吗？`,
        onOk() {
          return new Promise((resolve, reject) => {
            putAction(videoCourseApi.batch, {
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
        content: `确定${status ? "发布" : "下线"}这些视频吗？注意：如果全部下架，那么该课程也将跟随下架。`,
        onOk() {
          return new Promise((resolve, reject) => {
            putAction(courseInVideoApi.batch, {
              ids: that.selectedRowKeysVideo.join(),
              course_id: that.course_id,
              status
            }).then((response) => {
              resolve(response);
              // 刷新表格
              that.$refs.tableVideo.refresh();
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
      postAction(videoCourseApi.create, formIn).then(res => {
        this.visible = false;
        this.confirmLoading = false;
        // 重置表单数据
        form.resetFields();
        // 刷新表格
        this.$refs.table.refresh();
        this.$refs.createModal.fileList = [];
        this.$refs.createModal.fileListImg = [];
        this.$message.success(res.message || "添加成功");
      }).catch(err1 => {
        this.$message.error((err1.data && err1.data.message) || "添加失败");
      }).finally(() => {
        this.confirmLoading = false;
      });
    },
    handleCreateFormVideo(formIn) {
      const form = this.$refs.createModalVideo.form;
      postAction(courseInVideoApi.create, formIn).then(res => {
        this.visibleVideo = false;
        this.confirmLoadingVideo = false;
        // 重置表单数据
        form.resetFields();
        // 刷新表格
        this.$refs.tableVideo.refresh();
        this.$refs.createModalVideo.fileList = [];
        this.$refs.createModalVideo.fileListImg = [];
        this.$message.success(res.message || "添加成功");
      }).catch(err1 => {
        this.$message.error((err1.data && err1.data.message) || "添加失败");
      }).finally(() => {
        this.confirmLoadingVideo = false;
      });
    },
    handleUpdateForm(formIn) {
      const form = this.$refs.createModal.form;
      return new Promise((resolve, reject) => {
        putAction(videoCourseApi.update, formIn).then(res => {
          this.visible = false;
          this.confirmLoading = false;
          // 重置表单数据
          form.resetFields();
          // 刷新表格
          this.$refs.table.refresh();
          this.$refs.createModal.fileList = [];
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
    handleUpdateFormVideo(formIn) {
      const form = this.$refs.createModalVideo.form;
      return new Promise((resolve, reject) => {
        putAction(courseInVideoApi.update, formIn).then(res => {
          this.visibleVideo = false;
          this.confirmLoadingVideo = false;
          // 重置表单数据
          form.resetFields();
          // 刷新表格
          this.$refs.tableVideo.refresh();
          this.$refs.createModalVideo.fileList = [];
          this.$refs.createModalVideo.fileListImg = [];
          console.log("res", res);
          this.$message.success(res.message || "更新成功");
          resolve(res);
        }).catch(err1 => {
          console.log("err1", err1);
          console.log("err1.data", err1.data);
          this.$message.error((err1.data && err1.data.message) || "更新失败");
          reject(err1);
        }).finally(() => {
          this.confirmLoadingVideo = false;
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
            if (["course_type", "frequency_num", "is_discount", "carousel", "status"].includes(key)) {
              formIn[key] = Number(formIn[key]);
            }
            if (["price", "discount"].includes(key)) {
              formIn[key] = formIn[key] ? String(formIn[key]) : null;
            }
          });
          if (!values.id) {
            // 修改 e.g.
            const formDataCover = new FormData();
            formDataCover.append("file", this.$refs.createModal.form.getFieldValue("cover").file);
            Promise.all([
              uploadAction(videoCourseApi.uploadCover, formDataCover)
            ]).then(responses => {
              formIn.cover = responses[0].data;
              this.handleCreateForm(formIn);
            }).catch(err => {
              this.$message.error((err.data && err.data.message) || "添加失败");
            }).finally(() => {
              this.confirmLoading = false;
            });
          } else {
            console.log("formIn", formIn);
            if (!this.$refs.createModal.fileListImg.length) {
              this.handleUpdateForm(formIn);
            } else {
              const formDataCover = new FormData();
              formDataCover.append("file", this.$refs.createModal.form.getFieldValue("cover").file);
              Promise.all([
                uploadAction(videoCourseApi.uploadCover, formDataCover)
              ]).then(responses => {
                formIn.cover = responses[0].data;
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
    handleOkVideo() {
      const form = this.$refs.createModalVideo.form;
      form.validateFields((errors, values) => {
        if (!errors) {
          this.confirmLoadingVideo = true;
          console.log("values", values);
          const formIn = { ...values };
          Object.keys(formIn).map(key => {
            if (["sort", "status"].includes(key)) {
              formIn[key] = Number(formIn[key]);
            }
          });
          formIn.course_id = this.course_id
          if (!values.id) {
            // 修改 e.g.
            const formDataVideo = new FormData();
            formDataVideo.append("file", this.$refs.createModalVideo.form.getFieldValue("source").file);
            const formDataCover = new FormData();
            formDataCover.append("file", this.$refs.createModalVideo.form.getFieldValue("cover").file);
            Promise.all([
              uploadAction(courseInVideoApi.uploadVideo, formDataVideo),
              uploadAction(courseInVideoApi.uploadCover, formDataCover)
            ]).then(responses => {
              formIn.source = responses[0].data;
              formIn.cover = responses[1].data;
              this.handleCreateFormVideo(formIn);
            }).catch(err => {
              this.$message.error((err.data && err.data.message) || "添加失败");
            }).finally(() => {
              this.confirmLoadingVideo = false;
            });
          } else {
            console.log("formIn", formIn);
            if (!this.$refs.createModalVideo.fileList.length && !this.$refs.createModalVideo.fileListImg.length) {
              this.handleUpdateFormVideo(formIn);
            } else {
              const formDataVideo = new FormData();
              formDataVideo.append("file", this.$refs.createModal.form.getFieldValue("source").file);
              const formDataCover = new FormData();
              formDataCover.append("file", this.$refs.createModal.form.getFieldValue("cover").file);
              Promise.all([
                uploadAction(courseInVideoApi.uploadVideo, formDataVideo),
                uploadAction(courseInVideoApi.uploadCover, formDataCover)
              ]).then(responses => {
                formIn.source = responses[0].data;
                formIn.cover = responses[1].data;
                this.handleUpdateFormVideo(formIn);
              }).catch(err => {
                this.$message.error((err.data && err.data.message) || "更新失败");
              }).finally(() => {
                this.confirmLoadingVideo = false;
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
    handleCancelVideo() {
      this.visibleVideo = false;

      const form = this.$refs.createModalVideo.form;
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
