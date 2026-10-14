<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="12" :sm="24">
              <a-form-item label="处方标签名称">
                <a-input
                  allow-clear
                  v-model="queryParam.title"
                  placeholder="请输入处方标签名称模糊查询"
                  @keypress.enter="loadData"
                />
              </a-form-item>
            </a-col>
            <a-col :md="12" :sm="24">
              <span class="table-page-search-submitButtons">
                <a-button type="primary" @click="loadData">查询</a-button>
                <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
              </span>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <div class="table-operator">
        <a-button type="primary" icon="plus" @click="handleAdd">新建标签</a-button>
      </div>

      <a-table
        row-key="id"
        :columns="columns"
        :data-source="filteredData"
        :loading="loading"
        :pagination="{ pageSize: 10, showSizeChanger: true }"
      >
        <span slot="status" slot-scope="text">
          <a-tag :color="text === 1 ? 'green' : 'red'">
            {{ text === 1 ? '正常' : '禁用' }}
          </a-tag>
        </span>
        <span slot="createdAt" slot-scope="text">
          {{ formatTime(text) }}
        </span>
        <span slot="updatedAt" slot-scope="text">
          {{ formatTime(text) }}
        </span>
        <span slot="action" slot-scope="text, record">
          <a @click="handleEdit(record)">编辑</a>
          <a-divider type="vertical" />
          <a-popconfirm title="确定删除该处方标签吗？" ok-text="确定" cancel-text="取消" @confirm="handleDelete(record)">
            <a style="color: #F56C6E">删除</a>
          </a-popconfirm>
        </span>
      </a-table>

      <create-form
        ref="createModal"
        :visible="visible"
        :model="mdl"
        @cancel="handleCancel"
        @ok="handleOk"
      />
    </a-card>
  </page-header-wrapper>
</template>

<script>
import moment from 'moment'
import CreateForm from './modules/CreateForm'
import { deleteAction, getAction } from '@/utils/manage'
import { prescriptionTagApi } from '@/service/api'

const columns = [
  { title: '#', dataIndex: 'index', width: '64px', customRender: (text, record, index) => index + 1 },
  { title: '标签名称', dataIndex: 'title' },
  { title: '优先级', dataIndex: 'priority', width: '120px' },
  { title: '状态', dataIndex: 'status', width: '120px', scopedSlots: { customRender: 'status' } },
  { title: '创建时间', dataIndex: 'created_at', scopedSlots: { customRender: 'createdAt' } },
  { title: '更新时间', dataIndex: 'updated_at', scopedSlots: { customRender: 'updatedAt' } },
  { title: '操作', width: '140px', scopedSlots: { customRender: 'action' } }
]

export default {
  name: 'PrescriptionTag',
  components: {
    CreateForm
  },
  data () {
    this.columns = columns
    return {
      loading: false,
      visible: false,
      mdl: null,
      queryParam: {},
      dataList: []
    }
  },
  computed: {
    filteredData () {
      const title = (this.queryParam.title || '').trim()
      if (!title) return this.dataList
      return this.dataList.filter(item => item.title.includes(title))
    }
  },
  created () {
    this.loadData()
  },
  methods: {
    formatTime (value) {
      return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    loadData () {
      this.loading = true
      getAction(prescriptionTagApi.getAll, this.queryParam).then(res => {
        this.dataList = res.data || []
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '查询失败')
      }).finally(() => {
        this.loading = false
      })
    },
    handleReset () {
      this.queryParam = {}
      this.loadData()
    },
    handleAdd () {
      this.mdl = null
      this.visible = true
      this.$nextTick(() => {
        this.$refs.createModal.reset()
      })
    },
    handleEdit (record) {
      this.mdl = { ...record }
      this.visible = true
      this.$nextTick(() => {
        this.$refs.createModal.edit(record)
      })
    },
    handleDelete (record) {
      deleteAction(prescriptionTagApi.deleteOneById(record.id)).then(res => {
        this.$message.success(res.message || '删除成功')
        this.loadData()
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '删除失败')
      })
    },
    handleOk () {
      this.visible = false
      this.loadData()
    },
    handleCancel () {
      this.visible = false
    }
  }
}
</script>
