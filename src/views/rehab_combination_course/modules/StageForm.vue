<template>
  <a-drawer
    placement="right"
    :width="1120"
    :visible="visible"
    :mask-closable="false"
    :closable="true"
    :title="form.id ? '编辑阶段' : '新建阶段'"
    @close="handleCancel"
  >
    <div class="drawer-wrap">
      <div class="drawer-body">
        <div class="stage-form-layout">
          <div class="stage-form-main">
            <a-spin :spinning="loading">
              <a-form-model ref="RuleForm" :model="form" v-bind="formLayout" :rules="rules">
                <a-form-model-item label="阶段序号" prop="sort">
                  <a-select v-model="form.sort" placeholder="请选择当前是第几阶段">
                    <a-select-option
                      v-for="option in stageNoOptions"
                      :key="option.value"
                      :value="option.value"
                      :disabled="option.disabled"
                    >
                      {{ option.label }}{{ option.disabled ? '（已被其它阶段占用）' : '' }}
                    </a-select-option>
                  </a-select>
                  <div class="field-tip">选择该阶段在课程中的顺序位置，已创建的阶段序号不可重复选择。</div>
                </a-form-model-item>

                <a-form-model-item label="阶段字典项" prop="dictionary_item_id">
                  <a-select
                    v-model="form.dictionary_item_id"
                    show-search
                    option-filter-prop="children"
                    placeholder="请选择阶段匹配字典项"
                  >
                    <a-select-option
                      v-for="item in dictionaryOptions"
                      :key="item.id"
                      :value="item.id"
                      :disabled="item.disabled"
                    >
                      {{ item.name }}{{ item.disabled ? '（已被其它阶段选择）' : '' }}
                    </a-select-option>
                  </a-select>
                  <div class="field-tip">阶段字典项来自课程所选阶段字典分类「{{ course.stage_dictionary_name || '' }}」，每个阶段必须唯一。</div>
                </a-form-model-item>

                <a-form-model-item label="阶段标题" prop="title">
                  <a-input v-model="form.title" placeholder="请输入阶段标题" />
                </a-form-model-item>

                <a-form-model-item label="阶段正文" required>
                  <div class="field-tip">自由组合康复视频、图片、文字，可添加多个部分并调整顺序。</div>
                  <div v-if="!form.sections.length" class="section-empty">尚未添加正文部分</div>
                  <div v-for="(section, index) in form.sections" :key="section.key" class="section-card">
                    <div class="section-card-header">
                      <span class="section-card-title">部分 {{ index + 1 }}</span>
                      <div class="section-card-actions">
                        <a-button type="link" size="small" :disabled="index === 0" @click="moveSection(index, -1)">上移</a-button>
                        <a-button type="link" size="small" :disabled="index === form.sections.length - 1" @click="moveSection(index, 1)">下移</a-button>
                        <a-button type="link" size="small" style="color: #F56C6E" @click="removeSection(index)">删除</a-button>
                      </div>
                    </div>
                    <a-row :gutter="12">
                      <a-col :span="8">
                        <div class="section-field-label">资源类型</div>
                        <a-select v-model="section.resource_type" @change="() => handleResourceTypeChange(section)">
                          <a-select-option value="video">康复视频</a-select-option>
                          <a-select-option value="image">康复图片</a-select-option>
                          <a-select-option value="text">康复文字</a-select-option>
                        </a-select>
                      </a-col>
                      <a-col :span="16">
                        <div class="section-field-label">选择{{ resourceTypeName(section.resource_type) }}</div>
                        <a-select
                          v-model="section.resource_id"
                          show-search
                          option-filter-prop="children"
                          :placeholder="`请选择${resourceTypeName(section.resource_type)}`"
                        >
                          <a-select-option v-for="resource in resourcesByType(section.resource_type)" :key="resource.id" :value="resource.id">
                            {{ resource.title }}
                          </a-select-option>
                        </a-select>
                      </a-col>
                    </a-row>
                    <div class="section-field-label">下方附加内容</div>
                    <a-radio-group v-model="section.extra_type">
                      <a-radio :value="0">不添加，只展示</a-radio>
                      <a-radio :value="1">展示资源备注</a-radio>
                      <a-radio :value="2">自定义文字</a-radio>
                    </a-radio-group>
                    <a-textarea
                      v-if="section.extra_type === 2"
                      v-model="section.extra_text"
                      :rows="3"
                      class="section-extra-text"
                      placeholder="请输入自定义文字"
                    />
                    <div v-else-if="section.extra_type === 1" class="section-remark-preview">
                      备注：{{ resourceRemark(section) || '（该资源暂无备注）' }}
                    </div>
                  </div>
                  <a-button type="dashed" block icon="plus" @click="addSection">添加正文部分</a-button>
                </a-form-model-item>

                <a-form-model-item label="阶段备注" prop="remark">
                  <a-textarea v-model="form.remark" :rows="3" placeholder="请输入阶段备注（选填），会显示在最下方" />
                </a-form-model-item>

                <a-form-model-item label="阶段价格" prop="price">
                  <a-input v-model="form.price" placeholder="请输入阶段价格，最多两位小数" addon-before="￥" />
                </a-form-model-item>

                <a-form-model-item v-if="course.is_discount === 1" label="阶段折扣价格" prop="discount_price">
                  <a-input v-model="form.discount_price" placeholder="请输入阶段折扣价格（选填），最多两位小数" addon-before="￥" />
                </a-form-model-item>

                <a-form-model-item label="阶段状态" prop="status">
                  <a-radio-group v-model="form.status">
                    <a-radio :value="1">发布</a-radio>
                    <a-radio :value="0">下线</a-radio>
                  </a-radio-group>
                </a-form-model-item>
              </a-form-model>
            </a-spin>
          </div>

          <div class="stage-preview">
            <div class="preview-area-title">实时预览区域</div>
            <stage-preview :stage="previewStage" :is-discount="course.is_discount === 1" />
          </div>
        </div>
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
import StagePreview from './StagePreview'
import {
  rehabCombinationCourseStageApi,
  rehabVideoApi,
  rehabImageApi,
  rehabTextApi
} from '@/service/api'

let sectionKeySeed = 0

export default {
  components: {
    StagePreview
  },
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    course: {
      type: Object,
      default: () => ({})
    },
    dictionaryItems: {
      type: Array,
      default: () => []
    },
    usedItemIds: {
      type: Array,
      default: () => []
    },
    usedSorts: {
      type: Array,
      default: () => []
    }
  },
  data () {
    this.formLayout = {
      labelCol: { xs: { span: 24 }, sm: { span: 5 } },
      wrapperCol: { xs: { span: 24 }, sm: { span: 18 } }
    }
    return {
      rules: {
        sort: [{ required: true, trigger: 'change', message: '请选择阶段序号' }],
        dictionary_item_id: [{ required: true, trigger: 'change', message: '请选择阶段字典项' }],
        title: [{ required: true, min: 1, max: 100, message: '请输入1-100个字符的阶段标题' }],
        price: [{ required: true, validator: this.validatePrice, trigger: 'change' }],
        discount_price: [{ validator: this.validateOptionalPrice, trigger: 'change' }],
        status: [{ required: true, trigger: 'change', message: '请选择阶段状态' }]
      },
      form: this.defaultForm(),
      resources: {
        video: [],
        image: [],
        text: []
      },
      loading: false
    }
  },
  computed: {
    dictionaryOptions () {
      const used = this.usedItemIds.filter(id => id !== this.form.dictionary_item_id)
      return this.dictionaryItems.map(item => ({
        ...item,
        disabled: used.includes(item.id)
      }))
    },
    stageNoOptions () {
      const total = this.dictionaryItems.length
      const used = this.usedSorts.filter(sort => sort !== this.form.sort)
      return Array.from({ length: total }, (_, index) => ({
        value: index,
        label: `阶段 ${index + 1}`,
        disabled: used.includes(index)
      }))
    },
    dictionaryItemName () {
      const item = this.dictionaryItems.find(dictionaryItem => dictionaryItem.id === this.form.dictionary_item_id)
      return item ? item.name : ''
    },
    previewStage () {
      return {
        dictionary_item_name: this.dictionaryItemName,
        title: this.form.title,
        price: this.form.price,
        discount_price: this.form.discount_price,
        remark: this.form.remark,
        sections: this.form.sections.map(section => ({
          resource_type: section.resource_type,
          resource_title: this.sectionTitle(section),
          resource_content: this.resourceContent(section),
          resource_cover: this.resourceCover(section),
          resource_remark: this.resourceRemark(section),
          extra_type: section.extra_type,
          extra_text: section.extra_text
        }))
      }
    }
  },
  created () {
    this.loadResources()
  },
  methods: {
    defaultForm () {
      return {
        id: '',
        sort: undefined,
        dictionary_item_id: undefined,
        title: '',
        remark: '',
        price: '',
        discount_price: '',
        status: 1,
        sections: []
      }
    },
    createSection (data = {}) {
      sectionKeySeed += 1
      return {
        key: `section-${sectionKeySeed}`,
        resource_type: data.resource_type || 'video',
        resource_id: data.resource_id || undefined,
        extra_type: data.extra_type === undefined ? 0 : Number(data.extra_type),
        extra_text: data.extra_text || ''
      }
    },
    loadResources () {
      return Promise.all([
        getAction(rehabVideoApi.get, {}),
        getAction(rehabImageApi.get, {}),
        getAction(rehabTextApi.get, {})
      ]).then(([videos, images, texts]) => {
        this.resources = {
          video: videos.data || [],
          image: images.data || [],
          text: texts.data || []
        }
      }).catch(() => {})
    },
    resourcesByType (type) {
      return this.resources[type] || []
    },
    resourceTypeName (type) {
      return { video: '康复视频', image: '康复图片', text: '康复文字' }[type] || '资源'
    },
    resourceById (section) {
      return this.resourcesByType(section.resource_type).find(resource => resource.id === section.resource_id)
    },
    sectionTitle (section) {
      const resource = this.resourceById(section)
      return resource ? resource.title : ''
    },
    resourceContent (section) {
      const resource = this.resourceById(section)
      return resource ? resource.content : ''
    },
    resourceCover (section) {
      const resource = this.resourceById(section)
      return resource ? resource.cover : ''
    },
    resourceRemark (section) {
      const resource = this.resourceById(section)
      return resource ? resource.remark : ''
    },
    handleResourceTypeChange (section) {
      section.resource_id = undefined
    },
    addSection () {
      this.form.sections.push(this.createSection())
    },
    removeSection (index) {
      this.form.sections.splice(index, 1)
    },
    moveSection (index, offset) {
      const target = index + offset
      if (target < 0 || target >= this.form.sections.length) return
      const list = this.form.sections
      const temp = list[index]
      this.$set(list, index, list[target])
      this.$set(list, target, temp)
    },
    validatePrice (rule, value, callback) {
      if (!value) {
        callback(new Error('请输入阶段价格'))
        return
      }
      if (!/^\d+(\.\d{1,2})?$/.test(String(value))) {
        callback(new Error('价格格式不正确，最多两位小数'))
        return
      }
      callback()
    },
    validateOptionalPrice (rule, value, callback) {
      if (value && !/^\d+(\.\d{1,2})?$/.test(String(value))) {
        callback(new Error('价格格式不正确，最多两位小数'))
        return
      }
      callback()
    },
    open (record) {
      this.loading = false
      this.form = this.defaultForm()
      if (!record) {
        this.$nextTick(() => {
          this.$refs.RuleForm && this.$refs.RuleForm.clearValidate()
        })
        return
      }
      this.loading = true
      getAction(rehabCombinationCourseStageApi.getOneById(record.id)).then(res => {
        const data = res.data || {}
        this.form = {
          id: data.id,
          sort: data.sort,
          dictionary_item_id: data.dictionary_item_id,
          title: data.title,
          remark: data.remark || '',
          price: data.price,
          discount_price: data.discount_price || '',
          status: data.status,
          sections: (data.sections || []).map(section => this.createSection(section))
        }
        this.$nextTick(() => {
          this.$refs.RuleForm && this.$refs.RuleForm.clearValidate()
        })
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '查询阶段失败')
      }).finally(() => {
        this.loading = false
      })
    },
    handleOk () {
      this.$refs.RuleForm.validate(valid => {
        if (!valid) return
        if (!this.form.sections.length) {
          this.$message.warning('请至少添加一个阶段正文部分')
          return
        }
        const incompleteSection = this.form.sections.find(section => !section.resource_id)
        if (incompleteSection) {
          this.$message.warning('请为每个正文部分选择康复资源')
          return
        }
        const emptyCustomText = this.form.sections.find(section => section.extra_type === 2 && !String(section.extra_text || '').trim())
        if (emptyCustomText) {
          this.$message.warning('自定义文字内容不能为空')
          return
        }
        this.loading = true
        const payload = {
          course_id: this.course.id,
          sort: this.form.sort,
          dictionary_item_id: this.form.dictionary_item_id,
          title: this.form.title,
          remark: this.form.remark,
          price: String(this.form.price),
          discount_price: this.form.discount_price ? String(this.form.discount_price) : null,
          status: this.form.status,
          sections: this.form.sections.map((section, index) => ({
            resource_type: section.resource_type,
            resource_id: section.resource_id,
            extra_type: section.extra_type,
            extra_text: section.extra_text,
            sort: index
          }))
        }
        const request = this.form.id
          ? putAction(rehabCombinationCourseStageApi.update, { id: this.form.id, ...payload })
          : postAction(rehabCombinationCourseStageApi.create, payload)
        request.then(res => {
          this.$message.success(res.message || '操作成功')
          this.$emit('ok')
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
.stage-form-layout {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.stage-form-main {
  flex: 1;
  min-width: 0;
}

.field-tip {
  margin-bottom: 8px;
  color: #8c8c8c;
  font-size: 12px;
  line-height: 1.6;
}

.section-empty {
  padding: 20px;
  margin-bottom: 12px;
  color: #bfbfbf;
  text-align: center;
  background: #fafafa;
  border-radius: 6px;
}

.section-card {
  padding: 12px;
  margin-bottom: 12px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.section-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.section-card-title {
  font-weight: 600;
  color: #333;
}

.section-field-label {
  margin: 8px 0 4px;
  font-size: 12px;
  color: #595959;
}

.section-extra-text {
  margin-top: 8px;
}

.section-remark-preview {
  margin-top: 8px;
  padding: 8px 10px;
  font-size: 12px;
  color: #8c8c8c;
  background: #fff;
  border: 1px dashed #e8e8e8;
  border-radius: 4px;
}

.stage-preview {
  flex-shrink: 0;
  width: 320px;
}

.preview-area-title {
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  text-align: center;
}
</style>
