<template>
  <page-header-wrapper>
    <a-card :bordered="false" v-if="!showVideo">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="8" :sm="24">
              <a-form-item label="订单号">
                <a-input @keypress.enter="$refs.table.refresh(true)" v-model="queryParam.order_no"
                         placeholder="请输入订单号模糊查询" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="支付流水号">
                <a-input @keypress.enter="$refs.table.refresh(true)" v-model="queryParam.payment_no"
                         placeholder="请输入支付流水号模糊查询" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="物流单号">
                <a-input @keypress.enter="$refs.table.refresh(true)" v-model="queryParam.courier_number"
                         placeholder="请输入物流单号模糊查询" />
              </a-form-item>
            </a-col>
            <template v-if="advanced">
              <a-col :md="8" :sm="24">
                <a-form-item label="订单日期">
                  <a-date-picker v-model="queryParam.date" style="width: 100%" placeholder="请输入订单日期" />
                </a-form-item>
              </a-col>
              <a-col :md="8" :sm="24">
                <a-form-item label="状态">
                  <a-select v-model="queryParam.status" placeholder="请选择">
                    <a-select-option value="0">取消/关闭</a-select-option>
                    <a-select-option value="1">待支付</a-select-option>
                    <a-select-option value="2">待发货</a-select-option>
                    <a-select-option value="3">已发货</a-select-option>
                    <a-select-option value="4">已收货</a-select-option>
                    <a-select-option value="5">退货中</a-select-option>
                    <a-select-option value="6">已退货</a-select-option>
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

      <s-table
        ref="table"
        size="default"
        rowKey="id"
        :columns="columns"
        :data="loadData"
        :alert="options.alert"
        :rowSelection="options.rowSelection"
        :showRowSelection="false"
        :showPagination="true"
        :totalNum="totalNum"
        :scroll="{x: 1920}"
      >
        <span slot="serial" slot-scope="text, record, index">
          {{ index + 1 }}
        </span>
        <span slot="status" slot-scope="text" style="font-weight: bold" :style="{color: status_list_map[text].color}">
          {{ status_list_map[text].text }}
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
            <a @click="handleShowCommodity(record)">商品清单</a>
            <a-divider type="vertical" v-if="record.status === 2" />
            <a @click="handleBeginShipment(record)" v-if="record.status === 2">发货</a>
            <a-divider type="vertical" v-if="record.status > 2" />
            <a @click="handleShowShipping(record)" v-if="record.status > 2">物流信息</a>
            <a-divider type="vertical" v-if="record.status > 3" />
            <a @click="handleBackShipment(record)" v-if="record.status > 3">退货</a>
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
    <commodity-modal ref="CommodityModal"></commodity-modal>
    <shipment-modal ref="ShipmentModal" @ok="$refs.table.refresh(true)"></shipment-modal>
    <courier-info-modal ref="CourierInfoModal"></courier-info-modal>
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
import { courierApi, equipmentApi, equipmentModelApi, equipmentOrderApi } from "@/service/api";

import CommodityModal from "@/views/equipment_order/modules/CommodityModal";
import ShipmentModal from "@/views/equipment_order/modules/ShipmentModal";
import CourierInfoModal from "@/views/equipment_order/modules/CourierInfoModal";

const columns = [
  {
    title: "#",
    scopedSlots: { customRender: "serial" }
  },
  {
    title: "下单用户名",
    dataIndex: "username"
  },
  {
    title: "下单用户姓名",
    dataIndex: "name"
  },
  {
    title: "订单号",
    dataIndex: "order_no"
  },
  {
    title: "支付流水号",
    dataIndex: "payment_no"
  },
  {
    title: "购买器材种类数",
    dataIndex: "order_total",
    width: 140
  },
  {
    title: "购买总数量",
    dataIndex: "order_total_num"
  },
  {
    title: "下单时间",
    dataIndex: "order_time",
    customRender: (text) => text ? moment(new Date(text), "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss") : ""
  },
  {
    title: "支付时间",
    dataIndex: "payment_time",
    customRender: (text) => text ? moment(new Date(text), "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss") : ""
  },
  {
    title: "支付金额/元",
    dataIndex: "payment_num"
  },
  {
    title: "物流单号",
    dataIndex: "courier_number"
  },
  {
    title: "物流公司",
    dataIndex: "courier_company",
    customRender: (text) => text ? (courierCompanyList.find(item => item.type === text) ? courierCompanyList.find(item => item.type === text).name : '') : ""
  },
  {
    title: "备注",
    dataIndex: "remark"
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

let courierCompanyList = []

export default {
  name: "TableList",
  components: {
    STable,
    Ellipsis,
    CreateForm,
    CreateFormModel,
    StepByStepModal,
    CommodityModal,
    ShipmentModal,
    CourierInfoModal
  },
  data() {
    this.columns = columns;
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
      status_list_map: {
        0: {
          color: "#FE4D52",
          text: "取消/关闭"
        },
        1: {
          color: "#0093FB",
          text: "待支付"
        },
        2: {
          color: "#F8BB6C",
          text: "待发货"
        },
        3: {
          color: "#59C337",
          text: "已发货"
        },
        4: {
          color: "#59C337",
          text: "已收货"
        },
        5: {
          color: "#FE4D52",
          text: "退货中"
        },
        6: {
          color: "#FE4D52",
          text: "已退货"
        },
      },
      // 加载数据方法 必须为 Promise 对象
      loadData: parameter => {
        const requestParameters = Object.assign({}, parameter, this.queryParam);
        console.log("loadData request parameters:", requestParameters);
        return getAction(equipmentOrderApi.get, requestParameters)
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
      dataSourceVideo: [],
      selectedRowKeysVideo: [],
      selectedRowsVideo: [],
      showVideo: false,
      equipment_id: "",
      courierCompanyList: courierCompanyList
    };
  },
  created() {
    getRoleList({ t: new Date() });
    this.getCourierCompanyList('').then(data => {
      courierCompanyList = data
    })
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
    handleShowCommodity(info){
      this.$refs.CommodityModal.show(info)
    },
    handleShowShipping(info){
      this.$refs.CourierInfoModal.show(info)
    },
    handleBeginShipment(info){
      this.$refs.ShipmentModal.show(info)
    },
    handleBackShipment(info){
      this.$message.warning('暂不支持退货')
    },
    handleReset() {
      this.queryParam = {};
      this.$refs.table.refresh(true);
    },
    getCourierCompanyList(courier_company){
      return new Promise((resolve, reject) => {
        getAction(courierApi.courier_company_list, {
          courier_company
        }).then(res => {
          resolve(res.data)
        }).catch(err=>{
          reject(err)
        })
      })
    },
    handleBack() {
      this.queryParamVideo = {};
      this.equipment_id = "";
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
