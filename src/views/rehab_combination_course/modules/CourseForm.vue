<template>
  <a-drawer
    placement="right"
    :width="720"
    :visible="visible"
    :mask-closable="false"
    :closable="true"
    :title="form.id ? '编辑组合课程' : '新建组合课程'"
    @close="handleCancel"
  >
    <div class="drawer-wrap">
      <div class="drawer-body">
        <a-spin :spinning="loading">
          <a-form-model ref="RuleForm" :model="form" v-bind="formLayout" :rules="rules">
            <a-form-model-item label="课程标题" prop="title">
              <a-input v-model="form.title" placeholder="请输入课程标题" />
            </a-form-model-item>

            <a-form-model-item label="康复处方标签" prop="prescription_tag_id">
              <a-select
                v-model="form.prescription_tag_id"
                show-search
                option-filter-prop="children"
                placeholder="请选择康复处方标签（必须且只能选择一个）"
                @change="handleTagChange"
              >
                <a-select-option v-for="tag in tags" :key="tag.id" :value="tag.id">
                  {{ tag.title }}
                </a-select-option>
              </a-select>
            </a-form-model-item>

            <a-form-model-item label="普通字典项" required>
              <div class="field-tip">可选择多个字典分类，但每个字典分类中只能选择一个字典项（精确到字典项），用户可通过这些字典项检索到该课程。</div>
              <a-empty v-if="!form.prescription_tag_id" description="请先选择康复处方标签" />
              <a-empty v-else-if="!currentTagDictionaries.length" description="该标签下暂无字典分类" />
              <div v-else class="dictionary-group">
                <div
                  v-for="dictionary in currentTagDictionaries"
                  :key="dictionary.id"
                  class="dictionary-block"
                  :class="{ 'dictionary-block-disabled': dictionary.id === form.stage_dictionary_id }"
                >
                  <div class="dictionary-block-title">
                    <span>
                      {{ dictionary.name }}
                      <a-tag v-if="dictionary.id === form.stage_dictionary_id" color="orange" class="dictionary-block-tag">已选为阶段字典</a-tag>
                    </span>
                    <a v-if="selectedItemIdInDictionary(dictionary.id)" class="dictionary-block-clear" @click="clearDictionary(dictionary.id)">清除</a>
                  </div>
                  <a-empty v-if="!itemsByDictionary(dictionary.id).length" description="该分类下暂无字典项" :image-style="{ height: '32px' }" />
                  <a-radio-group
                    v-else
                    :disabled="dictionary.id === form.stage_dictionary_id"
                    :value="selectedItemIdInDictionary(dictionary.id)"
                    @change="event => handleDictionarySelect(dictionary.id, event.target.value)"
                  >
                    <a-radio
                      v-for="item in itemsByDictionary(dictionary.id)"
                      :key="item.id"
                      :value="item.id"
                      class="dictionary-item-radio"
                    >
                      {{ item.name }}
                    </a-radio>
                  </a-radio-group>
                </div>
              </div>
            </a-form-model-item>

            <a-form-model-item label="阶段匹配字典" prop="stage_dictionary_id">
              <a-select
                v-model="form.stage_dictionary_id"
                allow-clear
                show-search
                option-filter-prop="children"
                placeholder="请选择阶段匹配字典分类"
                :disabled="!form.prescription_tag_id"
                @change="handleStageDictionaryChange"
              >
                <a-select-option v-for="dictionary in stageDictionaryOptions" :key="dictionary.id" :value="dictionary.id">
                  {{ dictionary.name }}
                </a-select-option>
              </a-select>
              <div class="field-tip">阶段匹配字典分类决定阶段匹配，不能与已选普通字典项所属分类相同；选择后，普通字典项中对应分类会被禁用并清除已选。该分类下的字典项数量决定阶段数量上限。</div>
            </a-form-model-item>

            <a-form-model-item label="阶段数量">
              <div class="stage-count-line">
                已创建 <strong>{{ form.stage_count || 0 }}</strong> 个阶段
                <span v-if="stageItemTotal">（上限 {{ stageItemTotal }} 个）</span>
                <span class="field-tip-inline">阶段在保存课程后，通过列表页「阶段管理」进行创建。</span>
              </div>
            </a-form-model-item>

            <a-form-model-item label="是否折扣" prop="is_discount">
              <a-switch
                :checked="form.is_discount === 1"
                checked-children="折扣"
                un-checked-children="不折扣"
                @change="handleDiscountChange"
              />
            </a-form-model-item>

            <a-form-model-item label="备注" prop="remark">
              <a-textarea v-model="form.remark" :rows="3" placeholder="请输入备注（选填）" />
            </a-form-model-item>

            <a-form-model-item label="状态" prop="status">
              <a-radio-group v-model="form.status">
                <a-radio :value="1">发布</a-radio>
                <a-radio :value="0">下线</a-radio>
              </a-radio-group>
            </a-form-model-item>
          </a-form-model>
        </a-spin>
      </div>

      <div class="drawer-footer">
        <a-button @click="handleCancel">取消</a-button>
        <a-button type="primary" :loading="loading" @click="handleOk">确定</a-button>
      </div>
    </div>
  </a-drawer>
</template>

<script>
import { getAction, postAction, putAction } from '@/utils/manage'
import {
  prescriptionTagDictionaryApi,
  prescriptionTagDictionaryItemApi,
  rehabCombinationCourseApi
} from '@/service/api'

export default {
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    model: {
      type: Object,
      default: () => null
    },
    tags: {
      type: Array,
      default: () => []
    }
  },
  data () {
    this.formLayout = {
      labelCol: { xs: { span: 24 }, sm: { span: 6 } },
      wrapperCol: { xs: { span: 24 }, sm: { span: 17 } }
    }
    return {
      rules: {
        title: [{ required: true, min: 1, max: 100, message: '请输入1-100个字符的课程标题' }],
        prescription_tag_id: [{ required: true, trigger: 'change', message: '请选择康复处方标签' }],
        stage_dictionary_id: [{ required: true, trigger: 'change', message: '请选择阶段匹配字典分类' }],
        status: [{ required: true, trigger: 'change', message: '请选择状态' }]
      },
      form: this.defaultForm(),
      dictionaries: [],
      dictionaryItems: [],
      selectedItemIds: [],
      loading: false
    }
  },
  computed: {
    currentTagDictionaries () {
      return this.dictionaries.filter(dictionary => dictionary.prescription_tag_id === this.form.prescription_tag_id)
    },
    selectedDictionaryIds () {
      return this.selectedItemIds
        .map(id => this.dictionaryItems.find(item => item.id === id))
        .filter(Boolean)
        .map(item => item.dictionary_id)
    },
    stageDictionaryOptions () {
      const selected = this.selectedDictionaryIds
      return this.currentTagDictionaries.filter(dictionary => !selected.includes(dictionary.id))
    },
    stageItemTotal () {
      if (!this.form.stage_dictionary_id) return 0
      return this.itemsByDictionary(this.form.stage_dictionary_id).length
    }
  },
  created () {
    this.loadDictionaries()
    this.loadDictionaryItems()
  },
  methods: {
    defaultForm () {
      return {
        id: '',
        title: '',
        prescription_tag_id: undefined,
        stage_dictionary_id: undefined,
        is_discount: 0,
        remark: '',
        status: 1,
        stage_count: 0
      }
    },
    itemsByDictionary (dictionaryId) {
      return this.dictionaryItems.filter(item => item.dictionary_id === dictionaryId)
    },
    selectedItemIdInDictionary (dictionaryId) {
      const item = this.selectedItemIds
        .map(id => this.dictionaryItems.find(dictionaryItem => dictionaryItem.id === id))
        .find(dictionaryItem => dictionaryItem && dictionaryItem.dictionary_id === dictionaryId)
      return item ? item.id : undefined
    },
    handleDictionarySelect (dictionaryId, itemId) {
      const remain = this.selectedItemIds.filter(id => {
        const item = this.dictionaryItems.find(dictionaryItem => dictionaryItem.id === id)
        return item && item.dictionary_id !== dictionaryId
      })
      this.selectedItemIds = itemId ? [...remain, itemId] : remain
      this.handleItemsChange()
    },
    clearDictionary (dictionaryId) {
      this.handleDictionarySelect(dictionaryId, undefined)
    },
    loadDictionaries () {
      return getAction(prescriptionTagDictionaryApi.getCustom, {}).then(res => {
        this.dictionaries = res.data || []
      }).catch(() => {})
    },
    loadDictionaryItems () {
      return getAction(prescriptionTagDictionaryItemApi.getAll).then(res => {
        this.dictionaryItems = res.data || []
      }).catch(() => {})
    },
    open (record) {
      this.loading = false
      this.selectedItemIds = []
      if (!record) {
        this.form = this.defaultForm()
        this.$nextTick(() => {
          this.$refs.RuleForm && this.$refs.RuleForm.clearValidate()
        })
        return
      }
      this.loading = true
      getAction(rehabCombinationCourseApi.getOneById(record.id)).then(res => {
        const data = res.data || {}
        this.form = {
          id: data.id,
          title: data.title,
          prescription_tag_id: data.prescription_tag_id,
          stage_dictionary_id: data.stage_dictionary_id,
          is_discount: data.is_discount,
          remark: data.remark || '',
          status: data.status,
          stage_count: data.stage_count || 0
        }
        this.selectedItemIds = (data.dictionary_items || []).map(item => item.dictionary_item_id)
        this.$nextTick(() => {
          this.$refs.RuleForm && this.$refs.RuleForm.clearValidate()
        })
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '查询课程失败')
      }).finally(() => {
        this.loading = false
      })
    },
    handleTagChange () {
      this.selectedItemIds = []
      this.form.stage_dictionary_id = undefined
    },
    handleItemsChange () {
      // 若阶段字典分类与已选普通字典项所属分类相同，则清空阶段字典选择
      if (this.form.stage_dictionary_id && this.selectedDictionaryIds.includes(this.form.stage_dictionary_id)) {
        this.form.stage_dictionary_id = undefined
      }
    },
    handleStageDictionaryChange (dictionaryId) {
      if (!dictionaryId) return
      // 阶段字典分类与普通字典项互斥：清空普通字典中该分类的选择
      this.selectedItemIds = this.selectedItemIds.filter(id => {
        const item = this.dictionaryItems.find(dictionaryItem => dictionaryItem.id === id)
        return item && item.dictionary_id !== dictionaryId
      })
    },
    handleDiscountChange (checked) {
      this.form.is_discount = checked ? 1 : 0
    },
    handleOk () {
      this.$refs.RuleForm.validate(valid => {
        if (!valid) return
        if (!this.selectedItemIds.length) {
          this.$message.warning('请至少选择一种康复字典项')
          return
        }
        this.loading = true
        const dictionaryItems = this.selectedItemIds.map(id => {
          const item = this.dictionaryItems.find(dictionaryItem => dictionaryItem.id === id)
          return {
            dictionary_id: item ? item.dictionary_id : undefined,
            dictionary_item_id: id
          }
        })
        const payload = {
          title: this.form.title,
          prescription_tag_id: this.form.prescription_tag_id,
          stage_dictionary_id: this.form.stage_dictionary_id,
          is_discount: this.form.is_discount,
          remark: this.form.remark,
          status: this.form.status,
          dictionary_items: dictionaryItems
        }
        const request = this.form.id
          ? putAction(rehabCombinationCourseApi.update, { id: this.form.id, ...payload })
          : postAction(rehabCombinationCourseApi.create, payload)
        request.then(res => {
          this.$message.success(res.message || '操作成功')
          const createdCourseId = !this.form.id && res.data ? res.data.id : null
          this.$emit('ok', createdCourseId)
        }).catch(err => {
          this.$message.error((err.data && err.data.message) || '操作失败')
        }).finally(() => {
          this.loading = false
        })
      })
    },
    handleCancel () {
      this.$emit('cancel')
    }
  }
}
</script>

<style lang="less" scoped>
.field-tip {
  margin-bottom: 8px;
  color: #8c8c8c;
  font-size: 12px;
  line-height: 1.6;
}

.field-tip-inline {
  margin-left: 8px;
  color: #8c8c8c;
  font-size: 12px;
}

.dictionary-group {
  max-height: 320px;
  padding: 4px 12px;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.dictionary-block {
  padding: 8px 0;
  border-bottom: 1px dashed #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.dictionary-block-disabled {
  opacity: 0.55;
}

.dictionary-block-tag {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 400;
}

.dictionary-block-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-weight: 600;
  color: #333;
}

.dictionary-block-clear {
  font-size: 12px;
  font-weight: 400;
  color: #1890ff;
}

.dictionary-item-radio {
  margin-right: 16px;
}

.stage-count-line {
  color: #333;
  line-height: 1.8;

  strong {
    color: #1890ff;
    font-size: 16px;
  }
}
</style>
