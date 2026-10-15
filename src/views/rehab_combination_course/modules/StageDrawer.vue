<template>
  <a-drawer
    placement="right"
    :width="1100"
    :visible="visible"
    :mask-closable="false"
    :closable="true"
    title="阶段管理"
    @close="handleCancel"
  >
    <div class="drawer-wrap">
      <div class="drawer-body">
        <a-spin :spinning="loading">
          <a-descriptions :column="2" bordered size="small" class="course-summary">
            <a-descriptions-item label="课程标题">{{ course.title || '-' }}</a-descriptions-item>
            <a-descriptions-item label="处方标签">{{ course.tag_name || '-' }}</a-descriptions-item>
            <a-descriptions-item label="阶段字典分类">{{ course.stage_dictionary_name || '-' }}</a-descriptions-item>
            <a-descriptions-item label="阶段数量">
              {{ stages.length }} / {{ stageDictionaryItems.length }}
            </a-descriptions-item>
            <a-descriptions-item label="是否折扣">{{ course.is_discount === 1 ? '是' : '否' }}</a-descriptions-item>
            <a-descriptions-item label="课程状态">{{ course.status === 1 ? '发布' : '下线' }}</a-descriptions-item>
          </a-descriptions>

          <div class="table-operator">
            <a-button type="primary" icon="plus" :disabled="!canAddStage" @click="handleAdd">新建阶段</a-button>
            <span class="operator-tip">每个阶段需选择一个「{{ course.stage_dictionary_name || '阶段字典' }}」字典项，且必须唯一。</span>
          </div>

          <a-table
            row-key="id"
            :columns="columns"
            :data-source="stages"
            :pagination="false"
            :scroll="{ x: 1180 }"
          >
            <span slot="sortColumn" slot-scope="text">
              <span class="stage-no">阶段 {{ text + 1 }}</span>
            </span>
            <span slot="titleColumn" slot-scope="text, record">
              <a @click="handleEdit(record)">{{ text }}</a>
            </span>
            <span slot="price" slot-scope="text, record">
              ￥{{ text }}
              <span v-if="course.is_discount === 1 && record.discount_price" class="discount-price">￥{{ record.discount_price }}</span>
            </span>
            <span slot="status" slot-scope="text">
              <a-tag :color="text === 1 ? 'green' : 'red'">{{ text === 1 ? '发布' : '下线' }}</a-tag>
            </span>
            <span slot="action" slot-scope="text, record, index">
              <a @click="handlePreview(record)">预览</a>
              <a-divider type="vertical" />
              <a @click="handleEdit(record)">编辑</a>
              <a-divider type="vertical" />
              <a-popconfirm
                title="确定上移该阶段吗？"
                ok-text="确定"
                cancel-text="取消"
                :disabled="index === 0"
                @confirm="handleMove(record, -1)"
              >
                <a :class="{ 'action-disabled': index === 0 }">上移</a>
              </a-popconfirm>
              <a-divider type="vertical" />
              <a-popconfirm
                title="确定下移该阶段吗？"
                ok-text="确定"
                cancel-text="取消"
                :disabled="index === stages.length - 1"
                @confirm="handleMove(record, 1)"
              >
                <a :class="{ 'action-disabled': index === stages.length - 1 }">下移</a>
              </a-popconfirm>
              <a-divider type="vertical" />
              <a-popconfirm
                :title="record.status === 1 ? '确定下线该阶段吗？' : '确定发布该阶段吗？'"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleStatus(record)"
              >
                <a>{{ record.status === 1 ? '下线' : '发布' }}</a>
              </a-popconfirm>
              <a-divider type="vertical" />
              <a-popconfirm title="确定删除该阶段吗？" ok-text="确定" cancel-text="取消" @confirm="handleDelete(record)">
                <a style="color: #F56C6E">删除</a>
              </a-popconfirm>
            </span>
          </a-table>
        </a-spin>
      </div>
      <div class="drawer-footer">
        <a-button @click="handleCancel">关闭</a-button>
      </div>

      <stage-form
        ref="stageForm"
        :visible="stageFormVisible"
        :course="course"
        :dictionary-items="stageDictionaryItems"
        :used-item-ids="usedItemIds"
        :used-sorts="usedSorts"
        @cancel="stageFormVisible = false"
        @ok="handleStageFormOk"
      />

      <a-drawer
        title="阶段预览"
        placement="right"
        :width="420"
        :visible="previewVisible"
        :mask-closable="true"
        :closable="true"
        :destroy-on-close="true"
        @close="previewVisible = false"
      >
        <stage-preview :stage="previewStage" :is-discount="course.is_discount === 1" />
      </a-drawer>
    </div>
  </a-drawer>
</template>

<script>
import StageForm from './StageForm'
import StagePreview from './StagePreview'
import { deleteAction, getAction, putAction } from '@/utils/manage'
import {
  prescriptionTagDictionaryItemApi,
  rehabCombinationCourseApi,
  rehabCombinationCourseStageApi
} from '@/service/api'

const columns = [
  { title: '阶段', dataIndex: 'sort', width: '140px', scopedSlots: { customRender: 'sortColumn' } },
  { title: '阶段标题', dataIndex: 'title', width: '200px', ellipsis: true, scopedSlots: { customRender: 'titleColumn' } },
  { title: '阶段字典项', dataIndex: 'dictionary_item_name', width: '160px', ellipsis: true },
  { title: '价格', dataIndex: 'price', width: '160px', scopedSlots: { customRender: 'price' } },
  { title: '状态', dataIndex: 'status', width: '100px', scopedSlots: { customRender: 'status' } },
  { title: '操作', width: '340px', fixed: 'right', scopedSlots: { customRender: 'action' } }
]

export default {
  components: {
    StageForm,
    StagePreview
  },
  props: {
    visible: {
      type: Boolean,
      required: true
    }
  },
  data () {
    this.columns = columns
    return {
      loading: false,
      course: {},
      stages: [],
      stageDictionaryItems: [],
      stageFormVisible: false,
      previewVisible: false,
      previewStage: {}
    }
  },
  computed: {
    usedItemIds () {
      return this.stages.map(stage => stage.dictionary_item_id)
    },
    usedSorts () {
      return this.stages.map(stage => stage.sort)
    },
    canAddStage () {
      return !!this.course.id && this.stages.length < this.stageDictionaryItems.length
    }
  },
  methods: {
    openById (courseId) {
      this.course = {}
      this.stages = []
      this.stageDictionaryItems = []
      if (!courseId) return
      this.loading = true
      getAction(rehabCombinationCourseApi.getOneById(courseId)).then(res => {
        const data = res.data || {}
        this.course = data
        this.stages = data.stages || []
        if (data.stage_dictionary_id) {
          return this.loadStageDictionaryItems(data.stage_dictionary_id)
        }
        return null
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '查询课程失败')
      }).finally(() => {
        this.loading = false
      })
    },
    loadStageDictionaryItems (dictionaryId) {
      return getAction(prescriptionTagDictionaryItemApi.getCustom, { dictionary_id: dictionaryId }).then(res => {
        this.stageDictionaryItems = res.data || []
      }).catch(() => {
        this.stageDictionaryItems = []
      })
    },
    reload () {
      this.openById(this.course.id)
      this.$emit('ok')
    },
    handleAdd () {
      if (!this.canAddStage) {
        this.$message.warning('阶段数量已达到该阶段字典分类的字典项数量上限')
        return
      }
      this.stageFormVisible = true
      this.$nextTick(() => {
        this.$refs.stageForm.open(null)
      })
    },
    handleEdit (record) {
      this.stageFormVisible = true
      this.$nextTick(() => {
        this.$refs.stageForm.open(record)
      })
    },
    handlePreview (record) {
      this.previewStage = {}
      getAction(rehabCombinationCourseStageApi.getOneById(record.id)).then(res => {
        this.previewStage = res.data || {}
        this.previewVisible = true
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '查询阶段失败')
      })
    },
    handleMove (record, offset) {
      const list = [...this.stages]
      const index = list.findIndex(item => item.id === record.id)
      const target = index + offset
      if (index < 0 || target < 0 || target >= list.length) return
      const temp = list[index]
      list[index] = list[target]
      list[target] = temp
      const stageIds = list.map(item => item.id)
      putAction(rehabCombinationCourseStageApi.sort, { course_id: this.course.id, stage_ids: stageIds }).then(res => {
        this.$message.success(res.message || '排序成功')
        this.reload()
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '排序失败')
      })
    },
    handleStageFormOk () {
      this.stageFormVisible = false
      this.reload()
    },
    handleStatus (record) {
      const status = record.status === 1 ? 0 : 1
      putAction(rehabCombinationCourseStageApi.updateStatus(record.id), { status }).then(res => {
        this.$message.success(res.message || '操作成功')
        this.reload()
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '操作失败')
      })
    },
    handleDelete (record) {
      deleteAction(rehabCombinationCourseStageApi.deleteOneById(record.id)).then(res => {
        this.$message.success(res.message || '删除成功')
        this.reload()
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '删除失败')
      })
    },
    handleCancel () {
      this.$emit('cancel')
    }
  }
}
</script>

<style lang="less" scoped>
.course-summary {
  margin-bottom: 16px;
}

.operator-tip {
  margin-left: 12px;
  color: #8c8c8c;
  font-size: 12px;
}

.stage-no {
  display: inline-block;
  min-width: 18px;
  margin-right: 4px;
  font-weight: 600;
  color: #333;
}

.action-disabled {
  color: #bfbfbf;
  cursor: not-allowed;
}

.discount-price {
  margin-left: 8px;
  color: #f5222d;
  text-decoration: line-through;
}
</style>
