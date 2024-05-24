<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="8" :sm="24">
              <a-form-item label="处方标题">
                <a-input @keypress.enter="$refs.table.refresh(true)" v-model="queryParam.title"
                         placeholder="请输入处方标题模糊查询" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="处方标签">
                <a-cascader change-on-select v-model="queryParam.tag" :options="dataSource" @change="onChange"  placeholder="请选择处方标签查询" />
              </a-form-item>
            </a-col>
            <template v-if="advanced">
              <a-col :md="8" :sm="24">
                <a-form-item label="处方类型">
                  <a-select v-model="queryParam.prescription_type" placeholder="请选择">
                    <a-select-option value="0">文章</a-select-option>
                    <a-select-option value="1">视频</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
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
        <a-button type="primary" icon="plus" @click="() => handleAdd()">新建处方</a-button>
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
        <span slot="prescription_type" slot-scope="text, record, index">
          <a-icon v-if="text === 0" style="margin-right: 4px" type="file-text" />
          <a-icon v-if="text === 1" style="margin-right: 4px" type="video-camera" />
          <span>{{ text === 0 ? "文章" : "视频" }}</span>
        </span>

        <span slot="rehabilitation" slot-scope="text">
          {{ dataList.find(i => i.id === text) ? dataList.find(i => i.id === text).title : '' }}
        </span>

        <span slot="part" slot-scope="text">
          {{ dataList.find(i => i.id === text) ? dataList.find(i => i.id === text).title : '' }}
        </span>

        <span slot="symptoms" slot-scope="text">
          {{ dataList.find(i => i.id === text) ? dataList.find(i => i.id === text).title : '' }}
        </span>

        <span slot="phase" slot-scope="text">
          {{ dataList.find(i => i.id === text) ? dataList.find(i => i.id === text).title : '' }}
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

        <span slot="gist" slot-scope="text">
          <ellipsis :length="20" tooltip>{{ text }}</ellipsis>
        </span>

        <span slot="action" slot-scope="text, record">
          <template>
            <a @click="handleEdit(record)">编辑</a>
            <a-divider type="vertical" />
            <a-popconfirm v-if="record.status === 0" title="确定发布上线改该处方吗？" ok-text="确定" cancel-text="取消"
                          @confirm="handlePublish(record, 1)">
              <a>快速发布</a>
            </a-popconfirm>
            <a-popconfirm v-if="record.status === 1" title="确定发布上线改该处方吗？" ok-text="确定" cancel-text="取消"
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
  </page-header-wrapper>
</template>

<script>
import moment from "moment";
import { STable, Ellipsis } from "@/components";
import { getRoleList, getServiceList } from "@/api/manage";

import StepByStepModal from "./modules/StepByStepModal";
import CreateForm from "./modules/CreateForm";

import { getAction, postAction, putAction, uploadAction } from "@/utils/manage";
import { prescriptionApi, prescriptionTagApi } from "@/service/api";

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
    title: "处方要点",
    dataIndex: "gist",
    scopedSlots: { customRender: "gist" }
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
    title: "复健类型",
    dataIndex: "rehabilitation",
    scopedSlots: { customRender: "rehabilitation" }
  },
  {
    title: "部位",
    dataIndex: "part",
    scopedSlots: { customRender: "part" }
  },
  {
    title: "问题",
    dataIndex: "symptoms",
    scopedSlots: { customRender: "symptoms" }
  },
  {
    title: "阶段",
    dataIndex: "phase",
    scopedSlots: { customRender: "phase" }
  },
  {
    title: "优先级",
    dataIndex: "priority"
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
    width: "150px",
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
      queryParam: {
        tag: []
      },
      // 加载数据方法 必须为 Promise 对象
      loadData: parameter => {
        const requestParameters = Object.assign({}, parameter, this.queryParam);
        console.log("loadData request parameters:", requestParameters);
        // return getAction(prescriptionApi.get,requestParameters)
        //   .then(res => {
        //     this.totalNum = res.data.totalCount
        //     return res.data;
        //   }).finally(()=>{
        //     this.$refs.table.clearSelected();
        //   });
        return Promise.all([
          getAction(prescriptionApi.get, requestParameters),
          getAction(prescriptionTagApi.getAll)
        ]).then(responses => {
          this.totalNum = responses[0].data.totalCount;
          const data = responses[1].data
          this.dataList = data.map(i => {
            return {
              ...i,
              key: i.id
            }
          })
          let dataSourceGet = [];
          this.dataListLable = data.map(i => {
            return {
              ...i,
              value: i.id,
              label: i.title
            }
          })

          data.forEach((item, index) => {
            if (item.parent_id === '0'){
              console.log('dataSourceGet', dataSourceGet)
              dataSourceGet.push({
                ...item,
                value: item.id,
                label: item.title,
                children: []
              })
            }
          })

          data.forEach((item, index) => {
            if (item.level === 2){
              const indexFind = dataSourceGet.findIndex(i => i.id === item.parent_id);
              dataSourceGet[indexFind].children.push({
                ...item,
                value: item.id,
                label: item.title,
                children: []
              })
            }
          })

          data.forEach((item, index) => {
            if (item.level === 3){
              let indexFind = 0;
              let indexFind1 = 0;
              dataSourceGet.forEach((itemIn, indexIn) => {
                itemIn.children.forEach((itemInner, indexInner) => {
                  if (itemInner.id === item.parent_id){
                    indexFind = indexIn;
                    indexFind1 = indexInner;
                  }
                })
              })
              dataSourceGet[indexFind].children[indexFind1].children.push({
                ...item,
                value: item.id,
                label: item.title,
                children: []
              })
            }
          })

          data.forEach((item, index) => {
            if (item.level === 4){
              let indexFind = 0;
              let indexFind1 = 0;
              let indexFind2 = 0;
              dataSourceGet.forEach((itemIn, indexIn) => {
                itemIn.children.forEach((itemInner, indexInner) => {
                  itemInner.children.forEach((itemInnerIn, indexInnerIn) => {
                    if (itemInnerIn.id === item.parent_id){
                      indexFind = indexIn;
                      indexFind1 = indexInner;
                      indexFind2 = indexInnerIn;
                    }
                  })
                })
              })
              dataSourceGet[indexFind].children[indexFind1].children[indexFind2].children.push({
                ...item,
                value: item.id,
                label: item.title,
                children: []
              })
            }
          })

          this.dataSource = [...dataSourceGet]
          return responses[0].data;
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
      selectedRows: [],
      dataList: [],
      dataListLabel: []
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
    onChange(value) {
      console.log(value);
      this.queryParam.rehabilitation = value.length >= 1 ? value[0] : undefined;
      this.queryParam.part = value.length >= 2 ? value[1] : undefined;
      this.queryParam.symptoms = value.length >= 3 ? value[2] : undefined;
      this.queryParam.phase = value.length >= 4 ? value[3] : undefined;
    },
    handleReset() {
      this.queryParam = {
        tag: []
      };
      this.$refs.table.refresh(true);
    },
    handleAdd(id) {
      this.mdl = null;
      this.visible = true;
      this.$nextTick(() => {
        this.$refs.createModal.getData(id);
      })
    },
    handleEdit(record) {
      this.handleAdd(record.id);
    },
    handlePublish(record, status) {
      this.confirmLoading = true;
      const formIn = { ...record, status };
      this.handleUpdateForm(formIn);
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
    handleUpdateForm(formIn) {
      putAction(prescriptionApi.update, formIn).then(res => {
        this.visible = false;
        this.confirmLoading = false;
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
      this.handleCancel()
      this.queryParam = {
        tag: []
      }
      this.$refs.table.refresh(true)
    },
    handleCancel() {
      this.visible = false;
      this.$refs.createModal.reset();
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
