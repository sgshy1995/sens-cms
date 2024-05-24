<template>
  <page-header-wrapper>
    <a-card :bordered="false" :loading="loading">
      <a-spin :spinning="loadingIn">
        <div class="table-page-search-wrapper">
          <a-form layout="inline">
            <a-row :gutter="48">
              <a-col :md="24" :sm="24">
                <a-form-item label="处方标签名称">
                  <a-input allowClear @change="onChange" @keypress.enter="$refs.table.refresh(true)" v-model="queryParam.title"
                           placeholder="请输入处方标签名称模糊查询" />
                </a-form-item>
              </a-col>
              <!--            <a-col :md="!advanced && 8 || 24" :sm="24">-->
              <!--              <span class="table-page-search-submitButtons"-->
              <!--                    :style="advanced && { float: 'right', overflow: 'hidden' } || {} ">-->
              <!--                <a-button type="primary" @click="$refs.table.refresh(true)">查询</a-button>-->
              <!--                <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>-->
              <!--              </span>-->
              <!--            </a-col>-->
            </a-row>
          </a-form>
        </div>

        <div class="table-operator">
          <a-button type="primary" icon="plus" @click="() => handleAdd()">新建标签</a-button>
          <a-button icon="down" @click="() => handleExpandAll()">展开所有</a-button>
          <a-button icon="up" @click="() => handleExpandNone()">合并所有</a-button>
        </div>

        <div class="tag-tree">
          <div class="tag-tree-left">
            <a-tree
              :selectable="true"
              :expanded-keys="expandedKeys"
              :auto-expand-parent="autoExpandParent"
              :tree-data="dataSource"
              @expand="onExpand"
              :selectedKeys.sync="selectedKeys"
              @select="onSelect"
            >
              <template slot="title" slot-scope="{ title }">
              <span v-if="title.indexOf(searchValue) > -1">
                {{ title.substr(0, title.indexOf(searchValue)) }}<span style="color: #f50">{{ searchValue }}</span>
                {{ title.substr(title.indexOf(searchValue) + searchValue.length) }}
              </span>
                <span v-else>{{ title }}</span>
              </template>
            </a-tree>
          </div>

          <div class="tag-tree-right">
            <a-card>
              <div class="tag-tree-right-empty" v-if="!selectedItem.id">
                <a-empty :image="simpleImage" description="请选择标签树节点"></a-empty>
              </div>
              <div class="tag-tree-right-content" v-else>
                <a-alert :showIcon="true" style="margin-bottom: 12px">
                  <template slot="message">
                    <span>当前选择 <span style="font-weight: bold">{{ selectedItem.real_title }}</span></span>
                  </template>
                </a-alert>
                <div class="tag-tree-right-content-item">标签名: <span style="font-weight: bold">{{ selectedItem.title }}</span></div>
                <div class="tag-tree-right-content-item">标签层级: <span style="font-weight: bold">{{ selectedItem.level }}</span></div>
                <div class="tag-tree-right-content-item">标签优先级: <span style="font-weight: bold">{{ selectedItem.priority }}</span></div>
                <div class="tag-tree-right-content-item">标签状态: <span style="font-weight: bold" :class="['text-item-tag', statusMap[selectedItem.status].status]">{{ statusMap[selectedItem.status].text }}</span></div>
                <div class="tag-tree-right-content-buttons">
                  <a-button type="primary" @click="handleEdit">编辑</a-button>
                  <a-button type="danger" @click="handleDeleteItem" style="margin-left: 8px" v-if="!selectedItem.children.length || selectedItem.level === 4">删除</a-button>
                </div>
              </div>
            </a-card>
          </div>
        </div>
      </a-spin>
      <create-form
        ref="createModal"
        :visible="visible"
        :loading="confirmLoading"
        :model="mdl"
        @cancel="handleCancel"
        @ok="handleOk"
      />
      <prescription-check-modal ref="checkModal" :visible="visibleCheck" @cancel="handleCancelCheck" />
    </a-card>
  </page-header-wrapper>
</template>

<script>
import { Empty } from 'ant-design-vue';
import moment from "moment";
import { STable, Ellipsis } from "@/components";
import { getRoleList, getServiceList } from "@/api/manage";

import StepByStepModal from "./modules/StepByStepModal";
import PrescriptionCheckModal from "./modules/PrescriptionCheckModal.vue";
import CreateForm from "./modules/CreateForm";

import { deleteAction, getAction, postAction, putAction, uploadAction } from "@/utils/manage";
import { prescriptionApi, prescriptionTagApi } from "@/service/api";

export default {
  name: "PrescriptionTag",
  components: {
    Ellipsis,
    CreateForm,
    StepByStepModal,
    PrescriptionCheckModal
  },
  beforeCreate() {
    this.simpleImage = Empty.PRESENTED_IMAGE_SIMPLE;
  },
  data() {
    return {
      loading: true,
      statusMap: {
        0: {
          status: "error",
          text: "禁用"
        },
        1: {
          status: "success",
          text: "正常"
        }
      },
      selectedKeys: [],
      expandedKeys: [],
      autoExpandParent: true,
      // create model
      totalNum: 0,
      visible: false,
      visibleCheck: false,
      confirmLoading: false,
      mdl: null,
      // 高级搜索 展开/关闭
      advanced: false,
      // 查询参数
      queryParam: {},
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
      searchValue: '',
      selectedItem: {},
      loadingIn: false
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
    this.loadData();
  },
  methods: {
    handleDeleteItem(){
      this.loadingIn = true
      const query = {}
      if (this.selectedItem.level === 1) {
        query.rehabilitation = this.selectedItem.id
      }else if (this.selectedItem.level === 2) {
        query.part = this.selectedItem.id
      }else if (this.selectedItem.level === 3) {
        query.symptoms = this.selectedItem.id
      }else if (this.selectedItem.level === 4) {
        query.phase = this.selectedItem.id
      }
      getAction(prescriptionApi.get, query).then(res => {
        console.log('res', res.data)
        if (res.data.data.length) {
          this.visibleCheck = true;
          this.$refs.checkModal.edit({
            queryParam: {
              ...query,
              tag: [query[Object.keys(query)[0]]]
            },
            list: [...res.data.data],
            selectedItem: {
              ...this.selectedItem
            }
          });
        }else {
          let that = this;
          const title = this.selectedItem.real_title
          this.$confirm({
            title: "提示",
            centered: true,
            content: h => <div><span style="color: red">确定删除此标签吗？</span><br /><span style="font-weight: bold">{ title }</span></div>,
            onOk() {
              return new Promise((resolve, reject) => {
                deleteAction(prescriptionTagApi.deleteOneById(that.selectedItem.id)).then((response) => {
                  if (response.code === 200) {
                    resolve(response);
                    that.selectedItem = {};
                    that.selectedKeys = [];
                    that.loadData();
                    that.$message.success(response.message || "操作成功");
                  }else{
                    reject(err);
                    that.$message.success(response.message || "操作失败");
                  }
                }).catch(err => {
                  that.$message.error((err.data && err.data.message) || "操作失败");
                  reject(err);
                });
              });
            }
          });
        }
      }).finally(() => {
        this.loadingIn = false
      })
    },
    onExpand(expandedKeys) {
      this.expandedKeys = expandedKeys;
      this.autoExpandParent = false;
    },
    onSelect(e, f){
      console.log(e , f)
      if (e.length){
        this.selectedItem = {...f.selectedNodes[0].data.props.dataRef}
        if (this.selectedItem.level === 2){
          const parent1Find = this.dataList.find(i => i.id === this.selectedItem.parent_id);
          const title1 = parent1Find.title;
          this.$set(this.selectedItem, 'real_title', `${title1} - ${this.selectedItem.title}`)
        }else if (this.selectedItem.level === 3){
          const parent1Find = this.dataList.find(i => i.id === this.selectedItem.parent_id);
          const parent2Find = this.dataList.find(i => i.id === parent1Find.parent_id);
          const title1 = parent1Find.title;
          const title2 = parent2Find.title;
          this.$set(this.selectedItem, 'real_title', `${title2} - ${title1} - ${this.selectedItem.title}`)
        }else if (this.selectedItem.level === 4){
          const parent1Find = this.dataList.find(i => i.id === this.selectedItem.parent_id);
          const parent2Find = this.dataList.find(i => i.id === parent1Find.parent_id);
          const parent3Find = this.dataList.find(i => i.id === parent2Find.parent_id);
          const title1 = parent1Find.title;
          const title2 = parent2Find.title;
          const title3 = parent3Find.title;
          this.$set(this.selectedItem, 'real_title', `${title3} - ${title2} - ${title1} - ${this.selectedItem.title}`)
        }else{
          this.$set(this.selectedItem, 'real_title', this.selectedItem.title)
        }
      }else {
        this.selectedItem = {}
      }
    },
    onChange(e) {
      this.selectedItem = {};
      this.selectedKeys = [];
      const value = e.target.value;
      const expandedKeys = this.dataList
        .map(item => {
          if (item.title.indexOf(value) > -1) {
            return this.getParentKey(item.key, this.dataSource);
          }
          return null;
        })
        .filter((item, i, self) => item && self.indexOf(item) === i);
      Object.assign(this, {
        expandedKeys,
        searchValue: value,
        autoExpandParent: true,
      });
    },
    getParentKey(key, tree) {
      let parentKey;
      for (let i = 0; i < tree.length; i++) {
        const node = tree[i];
        if (node.children) {
          if (node.children.some(item => item.key === key)) {
            parentKey = node.key;
          } else if (this.getParentKey(key, node.children)) {
            parentKey = this.getParentKey(key, node.children);
          }
        }
      }
      return parentKey;
    },
    loadData() {
      this.loading = true;
      getAction(prescriptionTagApi.getAll, this.queryParam)
        .then(res => {
          if (res.code === 200){
            const data = res.data;
            console.log('data', data)
            let dataSourceGet = [];
            this.dataList = data.map(i => {
              return {
                ...i,
                key: i.id
              }
            })

            if (this.selectedItem.id){
              let findOne = this.dataList.find(i => i.id === this.selectedItem.id)
              this.selectedItem.title = findOne.title;
              this.selectedItem.priority = findOne.priority;
              this.selectedItem.status = findOne.status;
              if (this.selectedItem.level === 2){
                const parent1Find = this.dataList.find(i => i.id === this.selectedItem.parent_id);
                const title1 = parent1Find.title;
                this.$set(this.selectedItem, 'real_title', `${title1} - ${this.selectedItem.title}`)
              }else if (this.selectedItem.level === 3){
                const parent1Find = this.dataList.find(i => i.id === this.selectedItem.parent_id);
                const parent2Find = this.dataList.find(i => i.id === parent1Find.parent_id);
                const title1 = parent1Find.title;
                const title2 = parent2Find.title;
                this.$set(this.selectedItem, 'real_title', `${title2} - ${title1} - ${this.selectedItem.title}`)
              }else if (this.selectedItem.level === 4){
                const parent1Find = this.dataList.find(i => i.id === this.selectedItem.parent_id);
                const parent2Find = this.dataList.find(i => i.id === parent1Find.parent_id);
                const parent3Find = this.dataList.find(i => i.id === parent2Find.parent_id);
                const title1 = parent1Find.title;
                const title2 = parent2Find.title;
                const title3 = parent3Find.title;
                this.$set(this.selectedItem, 'real_title', `${title3} - ${title2} - ${title1} - ${this.selectedItem.title}`)
              }else{
                this.$set(this.selectedItem, 'real_title', this.selectedItem.title)
              }
            }

            data.forEach((item, index) => {
              if (item.parent_id === '0'){
                console.log('dataSourceGet', dataSourceGet)
                dataSourceGet.push({
                  ...item,
                  key: item.id,
                  children: []
                })
              }
            })

            data.forEach((item, index) => {
              if (item.level === 2){
                const indexFind = dataSourceGet.findIndex(i => i.id === item.parent_id);
                dataSourceGet[indexFind].children.push({
                  ...item,
                  key: item.id,
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
                  key: item.id,
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
                  key: item.id,
                  children: []
                })
              }
            })


            this.dataSource = [...dataSourceGet]

            this.loading = false;
          }

        }).finally(() => {

      });
    },
    handleReset() {
      this.queryParam = {};
    },
    handleExpandAll() {
      this.expandedKeys = this.dataList.map(i => i.id);
    },
    handleExpandNone() {
      this.expandedKeys = [];
      this.selectedItem = {};
      this.selectedKeys = [];
    },
    handleAdd(id) {
      this.mdl = null;
      this.visible = true;
      this.$nextTick(() => {
        this.$refs.createModal.getData(id);
      })
    },
    handleEdit() {
      this.handleAdd(this.selectedItem.id);
    },
    handlePublish(record, status) {
      this.confirmLoading = true;
      const formIn = { ...record, status };
      this.handleUpdateForm(formIn);
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
      this.handleCancel()
      this.loadData()
    },
    handleCancel() {
      this.visible = false;
      this.$refs.createModal.reset();
    },
    handleCancelCheck(){
      this.visibleCheck = false;
      this.$refs.checkModal.reset();
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
.text-item-tag {
  &.success {
    color: #52c41a;
  }

  &.fail {
    color: #F42132;
  }
}
</style>

<style lang="less" scoped>
.tag-tree{
  width: 100%;
  display: flex;
  flex-direction: row;

  .tag-tree-left{
    min-width: 200px;
    max-height: 1000px;
    overflow: auto;
  }

  .tag-tree-right{
    margin-left: 24px;
    flex: 1;
    height: 300px;

    ::v-deep .ant-card{
      width: 100%;
      height: 100%;

      .ant-card-body{
        width: 100%;
        height: 100%;
      }

      .tag-tree-right-empty{
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tag-tree-right-content{
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;

        .tag-tree-right-content-title{
          font-size: 14px;
          font-weight: normal;
          color: #000;
          margin-bottom: 12px;
        }

        .tag-tree-right-content-name{
          font-size: 14px;
          font-weight: bold;
          color: #000;
        }

        .tag-tree-right-content-item{
          font-size: 14px;
          font-weight: normal;
          color: #000;
          margin-top: 12px;
        }

        .tag-tree-right-content-buttons{
          margin-top: 24px;
        }
      }
    }
  }
}
</style>
