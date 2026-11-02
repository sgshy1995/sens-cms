<template>
  <a-drawer
    placement="right"
    :width="720"
    :visible="visible"
    :mask-closable="false"
    :closable="true"
    :title="form.id ? `编辑${resourceName}` : `新建${resourceName}`"
    @close="handleCancel"
  >
    <div class="drawer-wrap">
      <div class="drawer-body">
        <a-spin :spinning="loading">
          <a-form-model ref="RuleForm" :model="form" v-bind="formLayout" :rules="rules">
            <a-form-model-item :label="`${resourceName}标题`" prop="title">
              <a-input v-model="form.title" :placeholder="`请输入${resourceName}标题`" />
            </a-form-model-item>

            <a-form-model-item label="康复标签" prop="prescription_tag_id">
              <a-select
                v-model="form.prescription_tag_id"
                show-search
                option-filter-prop="children"
                placeholder="请选择康复标签"
                @change="handleTagChange"
              >
                <a-select-option v-for="tag in tagOptions" :key="tag.id" :value="tag.id">
                  {{ tag.title }}
                </a-select-option>
              </a-select>
            </a-form-model-item>

            <a-form-model-item v-if="form.prescription_tag_id" label="康复字典分类" required>
              <div class="dictionary-group">
                <div v-for="dictionary in currentDictionaries" :key="dictionary.id" class="dictionary-block">
                  <div class="dictionary-block-title">
                    <span>{{ dictionary.name }}</span>
                    <span class="dictionary-block-actions">
                      <a-tag :color="dictionary.filter_mode === 'decrease' ? 'orange' : 'blue'">
                        {{ dictionary.filter_mode === 'decrease' ? '递减类 · 必选' : '递增类 · 至少选一类' }}
                      </a-tag>
                      <a v-if="selectedItemIdsInDictionary(dictionary.id).length" @click="clearDictionary(dictionary.id)">清除</a>
                    </span>
                  </div>
                  <a-checkbox-group
                    v-if="isMultipleSelection(dictionary.id)"
                    :value="selectedItemIdsInDictionary(dictionary.id)"
                    @change="values => handleDictionarySelect(dictionary.id, values)"
                  >
                    <a-checkbox
                      v-for="item in itemsByDictionary(dictionary.id)"
                      :key="item.id"
                      :value="item.id"
                      class="dictionary-item-choice"
                    >
                      {{ item.name }}
                    </a-checkbox>
                  </a-checkbox-group>
                  <a-radio-group
                    v-else
                    :value="selectedItemId(dictionary.id)"
                    @change="event => handleDictionarySelect(dictionary.id, event.target.value)"
                  >
                    <a-radio
                      v-for="item in itemsByDictionary(dictionary.id)"
                      :key="item.id"
                      :value="item.id"
                      class="dictionary-item-choice"
                    >
                      {{ item.name }}
                    </a-radio>
                  </a-radio-group>
                  <div v-if="!itemsByDictionary(dictionary.id).length" class="empty-tip">该分类暂无可选项</div>
                </div>
              </div>
            </a-form-model-item>

            <a-form-model-item v-if="resourceType === 'text'" :label="contentLabel" prop="content" :rules="contentRules">
              <a-textarea v-model="form.content" :rows="12" placeholder="请输入文字内容" />
            </a-form-model-item>

            <a-form-model-item v-else :label="contentLabel" prop="content" :rules="contentRules">
              <div class="upload-tip">
                {{ resourceType === 'video' ? '请上传视频文件' : '请上传图片文件' }}
              </div>
              <video
                v-if="resourceType === 'video' && previewUrl"
                class="content-preview"
                :src="previewUrl"
                controls
              />
              <img
                v-if="resourceType === 'image' && previewUrl"
                class="content-preview"
                :src="previewUrl"
                :alt="`${contentLabel}预览`"
              >
              <a-upload
                :accept="accept"
                :file-list="fileList"
                :remove="handleRemove"
                :before-upload="beforeUpload"
              >
                <a-button>
                  <a-icon type="upload" />
                  选择文件
                </a-button>
              </a-upload>
            </a-form-model-item>

            <a-form-model-item v-if="resourceType === 'video'" label="视频封面">
              <div class="upload-tip">非必填。若不上传，系统会截取视频第一帧作为封面。</div>
              <img
                v-if="coverPreviewUrl"
                class="content-preview"
                :src="coverPreviewUrl"
                alt="封面预览"
              >
              <a-upload
                accept="image/*"
                :file-list="coverFileList"
                :remove="handleRemoveCover"
                :before-upload="beforeUploadCover"
              >
                <a-button>
                  <a-icon type="upload" />
                  选择封面
                </a-button>
              </a-upload>
            </a-form-model-item>

            <a-form-model-item v-if="resourceType !== 'text'" label="文字说明" prop="description">
              <a-textarea v-model="form.description" :rows="5" placeholder="请输入文字说明（选填）" />
            </a-form-model-item>

            <a-form-model-item label="状态" prop="status">
              <a-select v-model="form.status" placeholder="请选择状态">
                <a-select-option :value="1">发布</a-select-option>
                <a-select-option :value="0">下线</a-select-option>
              </a-select>
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
import { getAction, postAction, putAction, uploadAction } from '@/utils/manage'
import { resolveFileUrl } from '@/utils/util'
import {
  prescriptionTagApi,
  prescriptionTagDictionaryApi,
  prescriptionTagDictionaryItemApi,
  rehabResourceApi
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
    resourceName: {
      type: String,
      required: true
    },
    resourceType: {
      type: String,
      required: true
    },
    api: {
      type: Object,
      required: true
    }
  },
  data () {
    this.formLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 5 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 17 }
      }
    }
    return {
      rules: {
        title: [
          { required: true, min: 1, max: 100, message: '请输入1-100个字符的标题' }
        ],
        prescription_tag_id: [
          { required: true, trigger: 'change', message: '请选择康复标签' }
        ],
        status: [
          { required: true, trigger: 'change', message: '请选择状态' }
        ]
      },
      form: {
        id: '',
        title: '',
        prescription_tag_id: '',
        content: '',
        cover: '',
        description: '',
        status: 1
      },
      tagOptions: [],
      dictionaries: [],
      dictionaryItems: [],
      selectedItemIds: [],
      fileList: [],
      file: null,
      previewUrl: '',
      coverFileList: [],
      coverFile: null,
      coverPreviewUrl: '',
      loading: false
    }
  },
  computed: {
    accept () {
      return this.resourceType === 'video' ? 'video/*' : 'image/*'
    },
    contentLabel () {
      return {
        video: '视频内容',
        image: '图片内容',
        text: '文字内容'
      }[this.resourceType] || '内容'
    },
    contentRules () {
      return [{
        validator: (rule, value, callback) => {
          if (this.resourceType === 'text') {
            if (value && value.trim()) {
              callback()
            } else {
              callback(new Error('请输入文字内容'))
            }
            return
          }
          if (this.file || value) {
            callback()
          } else {
            callback(new Error(this.resourceType === 'video' ? '请上传视频' : '请上传图片'))
          }
        },
        trigger: 'change'
      }]
    },
    currentDictionaries () {
      return this.dictionaries.filter(item => item.prescription_tag_id === this.form.prescription_tag_id)
    }
  },
  created () {
    this.loadLabelOptions()
  },
  methods: {
    loadLabelOptions () {
      Promise.all([
        getAction(prescriptionTagApi.getAll),
        getAction(prescriptionTagDictionaryApi.getCustom, { status: 1 }),
        getAction(prescriptionTagDictionaryItemApi.getAll)
      ]).then(([tags, dictionaries, items]) => {
        this.tagOptions = tags.data || []
        this.dictionaries = dictionaries.data || []
        this.dictionaryItems = items.data || []
      }).catch(() => {})
    },
    handleTagChange () {
      this.selectedItemIds = []
    },
    itemsByDictionary (dictionaryId) {
      return this.dictionaryItems.filter(item => item.dictionary_id === dictionaryId && item.status === 1)
    },
    selectedItemIdsInDictionary (dictionaryId) {
      return this.selectedItemIds.filter(id => {
        const item = this.dictionaryItems.find(dictionaryItem => dictionaryItem.id === id)
        return item && item.dictionary_id === dictionaryId
      })
    },
    selectedItemId (dictionaryId) {
      return this.selectedItemIdsInDictionary(dictionaryId)[0]
    },
    isMultipleSelection (dictionaryId) {
      const dictionary = this.currentDictionaries.find(item => item.id === dictionaryId)
      return !!dictionary && dictionary.selection_mode === 'multiple'
    },
    handleDictionarySelect (dictionaryId, itemIds) {
      const remain = this.selectedItemIds.filter(id => {
        const item = this.dictionaryItems.find(dictionaryItem => dictionaryItem.id === id)
        return item && item.dictionary_id !== dictionaryId
      })
      const nextIds = Array.isArray(itemIds) ? itemIds : itemIds ? [itemIds] : []
      const validIds = nextIds.filter(id => {
        const item = this.dictionaryItems.find(dictionaryItem => dictionaryItem.id === id)
        return item && item.dictionary_id === dictionaryId
      })
      this.selectedItemIds = [
        ...remain,
        ...(this.isMultipleSelection(dictionaryId) ? validIds : validIds.slice(0, 1))
      ]
    },
    clearDictionary (dictionaryId) {
      this.handleDictionarySelect(dictionaryId, [])
    },
    validateLabelSelection () {
      if (!this.form.prescription_tag_id) {
        throw new Error('请选择康复标签')
      }
      for (const dictionary of this.currentDictionaries) {
        if (dictionary.filter_mode === 'decrease' && !this.selectedItemIdsInDictionary(dictionary.id).length) {
          throw new Error(`请选择「${dictionary.name}」`)
        }
      }
      const increaseDictionaries = this.currentDictionaries.filter(item => item.filter_mode === 'increase')
      if (increaseDictionaries.length > 0 && !increaseDictionaries.some(item => this.selectedItemIdsInDictionary(item.id).length)) {
        throw new Error('递增类康复标签至少选择一个分类')
      }
      return this.selectedItemIds.map(id => {
        const item = this.dictionaryItems.find(dictionaryItem => dictionaryItem.id === id)
        return {
          dictionary_id: item ? item.dictionary_id : undefined,
          dictionary_item_id: id
        }
      })
    },
    reset () {
      this.clearPreview()
      this.clearCoverPreview()
      this.loading = false
      this.file = null
      this.fileList = []
      this.coverFile = null
      this.coverFileList = []
      this.form = {
        id: '',
        title: '',
        prescription_tag_id: '',
        content: '',
        cover: '',
        description: '',
        status: 1
      }
      this.selectedItemIds = []
      this.$nextTick(() => {
        this.$refs.RuleForm && this.$refs.RuleForm.clearValidate()
      })
    },
    edit (record) {
      this.clearPreview()
      this.clearCoverPreview()
      this.loading = false
      this.file = null
      this.fileList = []
      this.coverFile = null
      this.coverFileList = []
      this.form = {
        id: record.id,
        title: record.title,
        prescription_tag_id: record.prescription_tag_id,
        content: record.content,
        cover: record.cover,
        description: record.description,
        status: record.status
      }
      this.selectedItemIds = (record.dictionary_items || []).map(item => item.dictionary_item_id)
      this.previewUrl = record.content ? resolveFileUrl(record.content) : ''
      this.coverPreviewUrl = record.cover ? resolveFileUrl(record.cover) : ''
      this.$nextTick(() => {
        this.$refs.RuleForm && this.$refs.RuleForm.clearValidate()
      })
    },
    beforeUpload (file) {
      this.clearPreview()
      this.file = file
      this.fileList = [file]
      this.previewUrl = URL.createObjectURL(file)
      this.form.content = ''
      this.$nextTick(() => {
        this.$refs.RuleForm && this.$refs.RuleForm.validateField('content')
      })
      return false
    },
    handleRemove () {
      this.clearPreview()
      this.file = null
      this.fileList = []
      this.form.content = ''
      this.$nextTick(() => {
        this.$refs.RuleForm && this.$refs.RuleForm.validateField('content')
      })
    },
    clearPreview () {
      if (this.previewUrl && this.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.previewUrl)
      }
      this.previewUrl = ''
    },
    beforeUploadCover (file) {
      this.clearCoverPreview()
      this.coverFile = file
      this.coverFileList = [file]
      this.coverPreviewUrl = URL.createObjectURL(file)
      this.form.cover = ''
      return false
    },
    handleRemoveCover () {
      this.clearCoverPreview()
      this.coverFile = null
      this.coverFileList = []
      this.form.cover = ''
    },
    clearCoverPreview () {
      if (this.coverPreviewUrl && this.coverPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.coverPreviewUrl)
      }
      this.coverPreviewUrl = ''
    },
    handleOk () {
      this.$refs.RuleForm.validate(async valid => {
        if (!valid) return
        this.loading = true
        try {
          const dictionaryItems = this.validateLabelSelection()
          const preflight = await postAction(rehabResourceApi.preflight, {
            resource_type: this.resourceType,
            resource_id: this.form.id || undefined,
            prescription_tag_id: this.form.prescription_tag_id,
            dictionary_items: dictionaryItems
          })
          if (!preflight || preflight.code !== 200) {
            throw new Error((preflight && preflight.message) || '标签组合校验失败')
          }
          let content = this.form.content
          let cover = this.form.cover
          const generateCover = this.resourceType === 'video' && !this.coverFile && !cover
          if (this.resourceType !== 'text' && this.file) {
            const formData = new FormData()
            formData.append('file', this.file)
            if (generateCover) {
              formData.append('generate_cover', '1')
            }
            const uploadRes = await uploadAction(this.api.uploadContent, formData)
            if (!uploadRes || !uploadRes.data) {
              throw new Error('文件上传失败')
            }
            if (typeof uploadRes.data === 'string') {
              content = uploadRes.data
            } else if (uploadRes.data.content) {
              content = uploadRes.data.content
              if (this.resourceType === 'video' && uploadRes.data.cover) {
                cover = uploadRes.data.cover
              }
            } else {
              throw new Error('文件上传失败')
            }
          }

          if (this.resourceType === 'video' && this.coverFile) {
            const coverFormData = new FormData()
            coverFormData.append('file', this.coverFile)
            const coverRes = await uploadAction(this.api.uploadCover, coverFormData)
            if (!coverRes || !coverRes.data) {
              throw new Error('封面上传失败')
            }
            cover = coverRes.data
          }

          const payload = {
            title: this.form.title,
            content,
            prescription_tag_id: this.form.prescription_tag_id,
            dictionary_items: dictionaryItems,
            status: Number(this.form.status),
            ...(this.resourceType !== 'text' ? { description: this.form.description } : {}),
            ...(this.resourceType === 'video' ? { cover } : {})
          }
          const res = this.form.id
            ? await putAction(this.api.update, { id: this.form.id, ...payload })
            : await postAction(this.api.create, payload)
          this.$message.success(res.message || '操作成功')
          this.$emit('ok')
        } catch (err) {
          this.$message.error((err.data && err.data.message) || err.message || '操作失败')
        } finally {
          this.loading = false
        }
      })
    },
    handleCancel () {
      this.$emit('cancel')
    }
  }
}
</script>

<style lang="less" scoped>
.upload-tip {
  color: #8c8c8c;
  line-height: 1.5;
}

.dictionary-group {
  max-height: 320px;
  padding: 4px 12px;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.dictionary-block {
  padding: 10px 0;
  border-bottom: 1px dashed #f0f0f0;
}

.dictionary-block:last-child {
  border-bottom: none;
}

.dictionary-block-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.dictionary-block-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.dictionary-item-choice {
  display: inline-flex;
  margin-right: 16px;
  margin-bottom: 6px;
}

.empty-tip {
  color: #bfbfbf;
  font-size: 12px;
}

.content-preview {
  display: block;
  width: 100%;
  max-width: 420px;
  max-height: 260px;
  margin-bottom: 12px;
  object-fit: contain;
  background: #f5f5f5;
  border-radius: 4px;
}
</style>
