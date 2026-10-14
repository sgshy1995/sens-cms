<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="8" :sm="24">
              <a-form-item label="处方标签">
                <a-select v-model="queryParam.prescription_tag_id" allow-clear show-search option-filter-prop="children" placeholder="请选择处方标签">
                  <a-select-option v-for="tag in tags" :key="tag.id" :value="tag.id">
                    {{ tag.title }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="字典名称">
                <a-input v-model="queryParam.name" allow-clear placeholder="请输入字典名称" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <span class="table-page-search-submitButtons">
                <a-button type="primary" @click="loadData">查询</a-button>
                <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
              </span>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <div class="table-operator">
        <a-button type="primary" icon="plus" @click="handleAdd">新建字典</a-button>
      </div>

      <a-table
        row-key="id"
        :columns="columns"
        :data-source="dictionaries"
        :loading="loading"
        :pagination="{ pageSize: 10, showSizeChanger: true }"
        :scroll="{ x: 1400 }"
      >
        <span slot="tagName" slot-scope="text">
          <span class="ellipsis-text" :title="tagName(text)">{{ tagName(text) }}</span>
        </span>
        <span slot="status" slot-scope="text">
          <a-tag :color="text === 1 ? 'green' : 'red'">
            {{ text === 1 ? '正常' : '禁用' }}
          </a-tag>
        </span>
        <span slot="updatedAt" slot-scope="text">
          {{ formatTime(text) }}
        </span>
        <span slot="action" slot-scope="text, record">
          <a @click="handleConfigure(record)">字典项配置</a>
          <a-divider type="vertical" />
          <a @click="handleEdit(record)">编辑</a>
          <a-divider type="vertical" />
          <a-popconfirm title="确定删除该字典吗？字典项会一并删除。" ok-text="确定" cancel-text="取消" @confirm="handleDelete(record)">
            <a style="color: #F56C6E">删除</a>
          </a-popconfirm>
        </span>
      </a-table>

      <dictionary-form
        ref="dictionaryForm"
        :visible="formVisible"
        :model="mdl"
        :tags="tags"
        @cancel="formVisible = false"
        @ok="handleFormOk"
      />
      <dictionary-item-drawer
        ref="itemDrawer"
        :visible="itemVisible"
        @ok="loadData"
        @cancel="itemVisible = false"
      />
    </a-card>
  </page-header-wrapper>
</template>

<script>
import moment from 'moment'
import DictionaryForm from './modules/DictionaryForm'
import DictionaryItemDrawer from './modules/DictionaryItemDrawer'
import { deleteAction, getAction } from '@/utils/manage'
import { prescriptionTagApi, prescriptionTagDictionaryApi, prescriptionTagDictionaryItemApi } from '@/service/api'

const columns = [
  { title: '#', dataIndex: 'index', width: '64px', customRender: (text, record, index) => index + 1 },
  { title: '字典名称', dataIndex: 'name', width: '180px', ellipsis: true },
  { title: 'Code', dataIndex: 'code', width: '160px', ellipsis: true },
  { title: '所属处方标签', dataIndex: 'prescription_tag_id', width: '180px', ellipsis: true, scopedSlots: { customRender: 'tagName' } },
  { title: '字典项数量', dataIndex: 'item_count', width: '120px' },
  { title: '优先级', dataIndex: 'priority', width: '100px' },
  { title: '状态', dataIndex: 'status', width: '100px', scopedSlots: { customRender: 'status' } },
  { title: '更新时间', dataIndex: 'updated_at', width: '180px', scopedSlots: { customRender: 'updatedAt' } },
  { title: '操作', width: '250px', fixed: 'right', scopedSlots: { customRender: 'action' } }
]

export default {
  name: 'PrescriptionTagDictionary',
  components: {
    DictionaryForm,
    DictionaryItemDrawer
  },
  data () {
    this.columns = columns
    return {
      loading: false,
      tags: [],
      dictionaries: [],
      queryParam: {},
      formVisible: false,
      itemVisible: false,
      mdl: null
    }
  },
  created () {
    this.loadTags()
    this.loadData()
  },
  methods: {
    formatTime (value) {
      return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    tagName (id) {
      const tag = this.tags.find(item => item.id === id)
      return tag ? tag.title : '-'
    },
    loadTags () {
      getAction(prescriptionTagApi.getAll).then(res => {
        this.tags = res.data || []
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '标签查询失败')
      })
    },
    loadData () {
      this.loading = true
      Promise.all([
        getAction(prescriptionTagDictionaryApi.getCustom, this.queryParam),
        getAction(prescriptionTagDictionaryItemApi.getAll)
      ]).then(responses => {
        const items = responses[1].data || []
        const itemCountMap = items.reduce((result, item) => {
          result[item.dictionary_id] = (result[item.dictionary_id] || 0) + 1
          return result
        }, {})
        this.dictionaries = (responses[0].data || []).map(dictionary => ({
          ...dictionary,
          item_count: itemCountMap[dictionary.id] || 0
        }))
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '字典查询失败')
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
      this.formVisible = true
      this.$nextTick(() => {
        this.$refs.dictionaryForm.open(null)
      })
    },
    handleEdit (record) {
      this.mdl = { ...record }
      this.formVisible = true
      this.$nextTick(() => {
        this.$refs.dictionaryForm.open(record)
      })
    },
    handleConfigure (record) {
      this.itemVisible = true
      this.$nextTick(() => {
        this.$refs.itemDrawer.open(record)
      })
    },
    handleFormOk () {
      this.formVisible = false
      this.loadData()
    },
    handleDelete (record) {
      deleteAction(prescriptionTagDictionaryApi.deleteOneById(record.id)).then(res => {
        this.$message.success(res.message || '删除成功')
        this.loadData()
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '删除失败')
      })
    }
  }
}
</script>

<style lang="less" scoped>
.ellipsis-text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
</style>
