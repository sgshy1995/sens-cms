<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="8" :sm="24">
              <a-form-item label="课程标题">
                <a-input
                  allow-clear
                  v-model="queryParam.title"
                  placeholder="请输入课程标题模糊查询"
                  @keypress.enter="loadData"
                />
              </a-form-item>
            </a-col>
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
              <a-form-item label="状态">
                <a-select v-model="queryParam.status" allow-clear placeholder="请选择状态">
                  <a-select-option :value="1">发布</a-select-option>
                  <a-select-option :value="0">下线</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :md="24" :sm="24">
              <span class="table-page-search-submitButtons">
                <a-button type="primary" @click="loadData">查询</a-button>
                <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
              </span>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <div class="table-operator">
        <a-button type="primary" icon="plus" @click="handleAdd">新建组合课程</a-button>
      </div>

      <a-table
        row-key="id"
        :columns="columns"
        :data-source="dataList"
        :loading="loading"
        :pagination="{ pageSize: 10, showSizeChanger: true }"
        :scroll="{ x: 1800 }"
      >
        <span slot="titleColumn" slot-scope="text, record">
          <a @click="handleEdit(record)">{{ text }}</a>
        </span>
        <span slot="dictionaryItems" slot-scope="text">
          <a-tooltip :title="formatDictionaryItems(text)">
            <span class="ellipsis-text">{{ formatDictionaryItems(text) || '-' }}</span>
          </a-tooltip>
        </span>
        <span slot="stageCount" slot-scope="text">
          <a-badge :count="text" :number-style="{ backgroundColor: '#52c41a' }" show-zero />
        </span>
        <span slot="isDiscount" slot-scope="text">
          <a-tag :color="text === 1 ? 'orange' : 'default'">{{ text === 1 ? '是' : '否' }}</a-tag>
        </span>
        <span slot="status" slot-scope="text">
          <a-tag :color="text === 1 ? 'green' : 'red'">{{ text === 1 ? '发布' : '下线' }}</a-tag>
        </span>
        <span slot="updatedAt" slot-scope="text">
          {{ formatTime(text) }}
        </span>
        <span slot="action" slot-scope="text, record">
          <a @click="handleManageStage(record)">阶段管理</a>
          <a-divider type="vertical" />
          <a @click="handleEdit(record)">编辑</a>
          <a-divider type="vertical" />
          <a-popconfirm
            :title="record.status === 1 ? '确定下线该课程吗？' : '确定发布该课程吗？'"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleStatus(record)"
          >
            <a>{{ record.status === 1 ? '下线' : '发布' }}</a>
          </a-popconfirm>
          <a-divider type="vertical" />
          <a-popconfirm title="确定删除该组合课程吗？阶段会一并删除。" ok-text="确定" cancel-text="取消" @confirm="handleDelete(record)">
            <a style="color: #F56C6E">删除</a>
          </a-popconfirm>
        </span>
      </a-table>

      <course-form
        ref="courseForm"
        :visible="formVisible"
        :model="mdl"
        :tags="tags"
        @cancel="formVisible = false"
        @ok="handleFormOk"
      />
      <stage-drawer
        ref="stageDrawer"
        :visible="stageVisible"
        @cancel="handleStageClose"
        @ok="loadData"
      />
    </a-card>
  </page-header-wrapper>
</template>

<script>
import moment from 'moment'
import CourseForm from './modules/CourseForm'
import StageDrawer from './modules/StageDrawer'
import { deleteAction, getAction, putAction } from '@/utils/manage'
import { prescriptionTagApi, rehabCombinationCourseApi } from '@/service/api'

const columns = [
  { title: '#', dataIndex: 'index', width: '64px', customRender: (text, record, index) => index + 1 },
  { title: '课程标题', dataIndex: 'title', width: '200px', ellipsis: true, scopedSlots: { customRender: 'titleColumn' } },
  { title: '处方标签', dataIndex: 'tag_name', width: '140px', ellipsis: true },
  { title: '普通字典项', dataIndex: 'dictionary_items', width: '280px', scopedSlots: { customRender: 'dictionaryItems' } },
  { title: '阶段字典', dataIndex: 'stage_dictionary_name', width: '140px', ellipsis: true },
  { title: '阶段数量', dataIndex: 'stage_count', width: '100px', scopedSlots: { customRender: 'stageCount' } },
  { title: '是否折扣', dataIndex: 'is_discount', width: '100px', scopedSlots: { customRender: 'isDiscount' } },
  { title: '状态', dataIndex: 'status', width: '100px', scopedSlots: { customRender: 'status' } },
  { title: '更新时间', dataIndex: 'updated_at', width: '180px', scopedSlots: { customRender: 'updatedAt' } },
  { title: '操作', width: '300px', fixed: 'right', scopedSlots: { customRender: 'action' } }
]

export default {
  name: 'RehabCombinationCourse',
  components: {
    CourseForm,
    StageDrawer
  },
  data () {
    this.columns = columns
    return {
      loading: false,
      tags: [],
      dataList: [],
      queryParam: {},
      formVisible: false,
      stageVisible: false,
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
    formatDictionaryItems (items) {
      if (!Array.isArray(items) || !items.length) return ''
      return items.map(item => `${item.dictionary_name || ''}：${item.item_name || ''}`).join('；')
    },
    loadTags () {
      getAction(prescriptionTagApi.getAll).then(res => {
        this.tags = res.data || []
      }).catch(() => {})
    },
    loadData () {
      this.loading = true
      getAction(rehabCombinationCourseApi.get, this.queryParam).then(res => {
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
      this.formVisible = true
      this.$nextTick(() => {
        this.$refs.courseForm.open(null)
      })
    },
    handleEdit (record) {
      this.mdl = { ...record }
      this.formVisible = true
      this.$nextTick(() => {
        this.$refs.courseForm.open(record)
      })
    },
    handleFormOk (createdCourseId) {
      this.formVisible = false
      this.loadData()
      if (createdCourseId) {
        this.$message.success('课程已创建，请继续为课程创建阶段')
        this.$nextTick(() => {
          this.stageVisible = true
          this.$refs.stageDrawer.openById(createdCourseId)
        })
      }
    },
    handleManageStage (record) {
      this.stageVisible = true
      this.$nextTick(() => {
        this.$refs.stageDrawer.openById(record.id)
      })
    },
    handleStageClose () {
      this.stageVisible = false
      this.loadData()
    },
    handleStatus (record) {
      const status = record.status === 1 ? 0 : 1
      putAction(rehabCombinationCourseApi.updateStatus(record.id), { status }).then(res => {
        this.$message.success(res.message || '操作成功')
        this.loadData()
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '操作失败')
      })
    },
    handleDelete (record) {
      deleteAction(rehabCombinationCourseApi.deleteOneById(record.id)).then(res => {
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
