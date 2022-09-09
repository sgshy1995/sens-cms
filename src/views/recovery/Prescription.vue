<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="8" :sm="24">
              <a-form-item label="处方标题">
                <a-input @keypress.enter="$refs.table.refresh(true)" v-model="queryParam.title" placeholder="请输入处方标题模糊查询" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="处方类型">
                <a-select v-model="queryParam.prescription_type" placeholder="请选择">
                  <a-select-option value="0">文章</a-select-option>
                  <a-select-option value="1">视频</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <template v-if="advanced">
              <a-col :md="8" :sm="24">
                <a-form-item label="难度">
                  <a-select v-model="queryParam.difficulty" placeholder="请选择">
                    <a-select-option value="1">难度1</a-select-option>
                    <a-select-option value="2">难度2</a-select-option>
                    <a-select-option value="3">难度3</a-select-option>
                    <a-select-option value="4">难度4</a-select-option>
                    <a-select-option value="5">难度5</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :md="8" :sm="24">
                <a-form-item label="关节部位">
                  <a-select v-model="queryParam.part" placeholder="请选择">
                    <a-select-option value="0">肩关节</a-select-option>
                    <a-select-option value="1">肘关节</a-select-option>
                    <a-select-option value="2">腕关节</a-select-option>
                    <a-select-option value="3">髋关节</a-select-option>
                    <a-select-option value="4">膝关节</a-select-option>
                    <a-select-option value="5">踝关节</a-select-option>
                    <a-select-option value="6">脊柱</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :md="8" :sm="24">
                <a-form-item label="症状">
                  <a-select v-model="queryParam.symptoms" placeholder="请选择">
                    <a-select-option value="0">疼痛</a-select-option>
                    <a-select-option value="1">肿胀</a-select-option>
                    <a-select-option value="2">活动受限</a-select-option>
                    <a-select-option value="3">弹响</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :md="8" :sm="24">
                <a-form-item label="阶段">
                  <a-select v-model="queryParam.phase" placeholder="请选择">
                    <a-select-option value="0">0-2周</a-select-option>
                    <a-select-option value="1">3-6周</a-select-option>
                    <a-select-option value="2">6-12周</a-select-option>
                    <a-select-option value="3">12周以后</a-select-option>
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
        <a-button type="primary" icon="plus" @click="handleAdd">新建处方</a-button>
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
      >
        <span slot="serial" slot-scope="text, record, index">
          {{ index + 1 }}
        </span>
        <span slot="prescription_type" slot-scope="text, record, index">
          <a-icon v-if="text === 0" style="margin-right: 4px" type="file-text" />
          <a-icon v-if="text === 1" style="margin-right: 4px" type="video-camera" />
          <span>{{ text === 0 ? '文章' : '视频' }}</span>
        </span>
        <span slot="status" slot-scope="text">
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
            <a @click="handleEdit(record)">编辑</a>
            <a-divider type="vertical" />
            <a-popconfirm v-if="record.status === 0" title="确定发布上线改该处方吗？" ok-text="确定" cancel-text="取消" @confirm="handlePublish(record, 1)">
              <a>快速发布</a>
            </a-popconfirm>
            <a-popconfirm v-if="record.status === 1" title="确定发布上线改该处方吗？" ok-text="确定" cancel-text="取消" @confirm="handlePublish(record, 0)">
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
  </page-header-wrapper>
</template>

<script>
import moment from "moment";
import { STable, Ellipsis } from "@/components";
import { getRoleList, getServiceList } from "@/api/manage";

import StepByStepModal from "./modules/StepByStepModal";
import CreateForm from "./modules/CreateForm";

import { getAction, postAction, putAction, uploadAction } from "@/utils/manage";
import {prescriptionApi} from "@/service/api";

const columns = [
  {
    title: "#",
    scopedSlots: { customRender: "serial" }
  },
  {
    title: "处方标题",
    dataIndex: "title"
  },
  {
    title: "处方类型",
    dataIndex: "prescription_type",
    needTotal: true,
    scopedSlots: { customRender: "prescription_type" }
  },
  {
    title: "处方描述",
    dataIndex: "description",
    scopedSlots: { customRender: "description" }
  },
  {
    title: "观看人数",
    dataIndex: "watch_num"
  },
  {
    title: "难度",
    dataIndex: "difficulty"
  },
  {
    title: "处方时长",
    dataIndex: "time_length"
  },
  {
    title: "关节部位",
    dataIndex: "part",
    customRender: (text) => {
      switch (text) {
        case 0: {
          return "肩关节";
        }
        case 1: {
          return "肘关节";
        }
        case 2: {
          return "腕关节";
        }
        case 3: {
          return "髋关节";
        }
        case 4: {
          return "膝关节";
        }
        case 5: {
          return "踝关节";
        }
        case 6: {
          return "脊柱";
        }
        default: {
          return "";
        }
      }
    }
  },
  {
    title: "症状",
    dataIndex: "symptoms",
    customRender: (text) => {
      switch (text) {
        case 0: {
          return "疼痛";
        }
        case 1: {
          return "肿胀";
        }
        case 2: {
          return "活动受限";
        }
        case 3: {
          return "弹响";
        }
        default: {
          return "";
        }
      }
    }
  },
  {
    title: "阶段",
    dataIndex: "phase",
    customRender: (text) => {
      switch (text) {
        case 0: {
          return "0-2周";
        }
        case 1: {
          return "3-6周";
        }
        case 2: {
          return "6-12周";
        }
        case 3: {
          return "12周以后";
        }
        default: {
          return "";
        }
      }
    }
  },
  {
    title: "最近发布时间",
    dataIndex: "publish_time",
    customRender: (text) => text ? moment(new Date(text), 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss') : ''
  },
  {
    title: "状态",
    dataIndex: "status",
    scopedSlots: { customRender: "status" }
  },
  {
    title: "操作",
    dataIndex: "action",
    width: "150px",
    scopedSlots: { customRender: "action" }
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
    StepByStepModal
  },
  data() {
    this.columns = columns;
    return {
      // create model
      totalNum: 0,
      visible: false,
      confirmLoading: false,
      mdl: null,
      // 高级搜索 展开/关闭
      advanced: false,
      // 查询参数
      queryParam: {},
      // 加载数据方法 必须为 Promise 对象
      loadData: parameter => {
        const requestParameters = Object.assign({}, parameter, this.queryParam);
        console.log("loadData request parameters:", requestParameters);
        return getAction(prescriptionApi.get,requestParameters)
          .then(res => {
            this.totalNum = res.data.totalCount
            return res.data;
          }).finally(()=>{
            this.$refs.table.clearSelected();
          });
      },
      options: {
        alert: { show: true, clear: () => { this.selectedRowKeys = [] } },
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
    handleReset(){
      this.queryParam = {}
      this.$refs.table.refresh(true)
    },
    handleAdd() {
      this.mdl = null;
      this.visible = true;
    },
    handleEdit(record) {
      this.visible = true;
      const mdl = { ...record }
      Object.keys(mdl).map(key=>{
        if (typeof mdl[key] === 'number'){
          mdl[key] = mdl[key].toString()
        }
      })
      this.mdl = { ...mdl };
    },
    handlePublish(record, status){
      this.confirmLoading = true;
      const formIn = {...record, status}
      this.handleUpdateForm(formIn)
    },
    batchUpdate(status){
      let that = this
      this.$confirm({
        title: '提示',
        centered: true,
        content: `确定${status ? '发布' : '下线'}这些处方吗？`,
        onOk() {
          return new Promise((resolve, reject) => {
            putAction(prescriptionApi.batch, {
              ids: that.selectedRowKeys.join(),
              status
            }).then((response) => {
              resolve(response);
              // 刷新表格
              that.$refs.table.refresh();
              that.$message.success(response.message || '操作成功');
            }).catch(err => {
              that.$message.error((err.data && err.data.message) || '操作失败')
              reject(err);
            })
          })
        }
      });
    },
    handleCreateForm(formIn){
      const form = this.$refs.createModal.form;
      postAction(prescriptionApi.create, formIn).then(res => {
        this.visible = false;
        this.confirmLoading = false;
        // 重置表单数据
        form.resetFields();
        // 刷新表格
        this.$refs.table.refresh();
        this.$refs.createModal.fileList = []
        this.$message.success(res.message || "添加成功");
      }).catch(err1=>{
        this.$message.error((err1.data && err1.data.message) || "添加失败");
      }).finally(()=>{
        this.confirmLoading = false;
      })
    },
    handleUpdateForm(formIn){
      const form = this.$refs.createModal.form;
      putAction(prescriptionApi.update, formIn).then(res => {
        this.visible = false;
        this.confirmLoading = false;
        // 重置表单数据
        form.resetFields();
        // 刷新表格
        this.$refs.table.refresh();
        this.$refs.createModal.fileList = []
        console.log('res', res)
        this.$message.success(res.message || "更新成功");
      }).catch(err1=>{
        console.log('err1', err1)
        console.log('err1.data', err1.data)
        this.$message.error((err1.data && err1.data.message) || "更新失败");
      }).finally(()=>{
        this.confirmLoading = false;
      })
    },
    handleOk() {
      const form = this.$refs.createModal.form;
      this.confirmLoading = true;
      form.validateFields((errors, values) => {
        if (!errors) {
          console.log("values", values);
          const formIn = {...values}
          Object.keys(formIn).map(key=>{
            if (['prescription_type', 'difficulty', 'part', 'symptoms', 'phase', 'status'].includes(key)){
              formIn[key] = Number(formIn[key])
            }
          })
          if (!values.id) {
            // 修改 e.g.
            const formDataVideo = new FormData()
            formDataVideo.append('file', this.$refs.createModal.form.getFieldValue('prescription_video').file)
            const formDataCover = new FormData()
            formDataCover.append('file', this.$refs.createModal.form.getFieldValue('cover').file)
            Promise.all([
              uploadAction(prescriptionApi.uploadVideo, formDataVideo),
              uploadAction(prescriptionApi.uploadCover, formDataCover)
            ]).then(responses=>{
              formIn.prescription_video = responses[0].data
              formIn.cover = responses[1].data
              this.handleCreateForm(formIn)
            }).catch(err=>{
              this.$message.error((err.data && err.data.message) || "添加失败");
            }).finally(()=>{
              this.confirmLoading = false;
            })
          }else{
            console.log("formIn", formIn);
            if (!this.$refs.createModal.fileList.length && !this.$refs.createModal.fileList.length){
              this.handleUpdateForm(formIn)
            }else{
              const formDataVideo = new FormData()
              formDataVideo.append('file', this.$refs.createModal.form.getFieldValue('prescription_video').file)
              const formDataCover = new FormData()
              formDataCover.append('file', this.$refs.createModal.form.getFieldValue('cover').file)
              Promise.all([
                uploadAction(prescriptionApi.uploadVideo, formDataVideo),
                uploadAction(prescriptionApi.uploadCover, formDataCover)
              ]).then(responses=>{
                formIn.prescription_video = responses[0].data
                formIn.cover = responses[1].data
                this.handleUpdateForm(formIn)
              }).catch(err=>{
                this.$message.error((err.data && err.data.message) || "更新失败");
              }).finally(()=>{
                this.confirmLoading = false;
              })
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
.text-item{
  &.success .ant-badge-status-text{
    color: #52c41a;
  }

  &.fail .ant-badge-status-text{
    color: #F42132;
  }
}
</style>
