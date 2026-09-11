<template>
  <a-drawer
    placement="right"
    :width="880"
    :visible="visible"
    :mask-closable="false"
    :closable="true"
    :title="id ? '编辑文章' : '发布文章'"
    @close="() => { $emit('cancel') }"
  >
    <div class="drawer-wrap">
      <div class="drawer-body">
        <a-spin :spinning="loading">
          <a-form :form="form" v-bind="formLayout">
            <a-form-item label="文章标题">
              <a-input @change="handleTitleChange" v-decorator="['title', {rules: [{required: true, min: 2, max: 60, message: '请输入至少2个字符，最多60个字符'}]}]" placeholder="请输入文章标题" />
            </a-form-item>
            <a-form-item label="文章摘要">
              <a-textarea @change="handleSummaryChange" :rows="3" v-decorator="['summary', {rules: [{max: 200, message: '最多200个字符'}]}]" placeholder="请输入文章摘要（选填）" />
            </a-form-item>
            <a-form-item label="康复标签">
              <a-cascader
                style="width: 100%"
                v-decorator="['tag']"
                :options="tagOptions"
                change-on-select
                allow-clear
                placeholder="请选择康复标签（选填）"
              />
            </a-form-item>
            <a-form-item label="封面图">
              <img style="width: 300px;margin-bottom: 12px;border-radius: 6px" v-if="coverUrl" :src="coverUrl" alt="cover">
              <a-upload v-decorator="['cover']" accept="image/*" :file-list="fileListImg" :remove="handleRemoveImg" :before-upload="beforeUploadImg">
                <a-button> <a-icon type="upload" /> 选择图片文件 </a-button>
              </a-upload>
            </a-form-item>
            <a-form-item label="文章内容" required>
              <wang-editor
                v-if="visible"
                :value="editorContent"
                :upload-url="uploadUrl"
                :cdn-base="cdnUrl"
                upload-file-name="file"
                @change="handleEditorChange"
              />
            </a-form-item>
          </a-form>
          <div style="color: #999;font-size: 12px">发布或修改后文章将进入待审核状态，审核通过后才会展示给用户。</div>
        </a-spin>
        <div class="preview-area">
          <div class="preview-area-title">实时预览区域</div>
          <div class="phone-wrap">
            <div class="phone">
              <div class="phone-screen">
                <div class="phone-scroll">
                  <img v-if="coverUrl" class="phone-cover" :src="coverUrl" alt="cover">
                  <div class="phone-body">
                    <div class="phone-title">{{ previewTitle || '文章标题' }}</div>
                    <div class="phone-summary" v-if="previewSummary">{{ previewSummary }}</div>
                    <div class="phone-content" v-if="editorContent" v-html="formatPreviewContent(editorContent)"></div>
                    <div class="phone-content phone-empty-text" v-else>文章内容将在这里显示</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="drawer-footer">
        <a-button @click="() => { $emit('cancel') }">取消</a-button>
        <a-button type="primary" :loading="loading" @click="() => { $emit('ok') }">确定</a-button>
      </div>
    </div>

  </a-drawer>
</template>

<script>
import pick from 'lodash.pick'
import WangEditor from '@/components/Editor/WangEditor'
import { getAction } from '@/utils/manage'
import { forumArticleApi, prescriptionTagApi } from '@/service/api'
import { buildTagTree, getTagPath } from './tagTree'
import { resolveFileUrl } from '@/utils/util'

// 表单字段
const fields = ['id', 'title', 'summary', 'cover', 'tag']

export default {
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    loading: {
      type: Boolean,
      default: () => false
    },
    model: {
      type: Object,
      default: () => null
    }
  },
  components: {
    WangEditor
  },
  data () {
    this.formLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 5 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 15 }
      }
    }
    return {
      form: this.$form.createForm(this),
      fileListImg: [],
      tagOptions: [],
      tagDataList: [],
      coverUrl: '',
      id: '',
      editorContent: '',
      previewTitle: '',
      previewSummary: '',
      uploadUrl: process.env.VUE_APP_API_BASE_URL + forumArticleApi.uploadCover,
      cdnUrl: process.env.VUE_APP_CDN_BASE_URL + '/'
    }
  },
  created () {
    fields.forEach(v => this.form.getFieldDecorator(v))
    this.loadTagOptions()
  },
  watch: {
    visible () {
      if (!this.visible) {
        this.fileListImg = []
        this.coverUrl = ''
        this.editorContent = ''
        this.id = ''
        this.previewTitle = ''
        this.previewSummary = ''
      }
    },
    model: {
      handler () {
        if (!this.model) {
          this.editorContent = ''
          this.form.resetFields()
          this.previewTitle = ''
          this.previewSummary = ''
          return
        }
        this.form.setFieldsValue(pick(this.model, fields))
        if (this.model.tag) {
          this.form.setFieldsValue({ tag: getTagPath(this.tagDataList, this.model.tag) })
        } else {
          this.form.setFieldsValue({ tag: [] })
        }
        this.previewTitle = this.model.title || ''
        this.previewSummary = this.model.summary || ''
        this.$nextTick(() => {
          const value = this.form.getFieldValue('cover')
          if (value && typeof value === 'string') {
            this.coverUrl = resolveFileUrl(value)
          }
          this.id = this.form.getFieldValue('id')
          this.editorContent = this.model.content || ''
        })
      },
      deep: true
    }
  },
  methods: {
    loadTagOptions () {
      getAction(prescriptionTagApi.getAll).then(res => {
        const data = res.data || []
        this.tagDataList = data
        this.tagOptions = buildTagTree(data)
        if (this.model && this.model.tag) {
          this.form.setFieldsValue({ tag: getTagPath(data, this.model.tag) })
        }
      }).catch(() => {})
    },
    handleEditorChange (html) {
      this.editorContent = html
    },
    handleTitleChange (e) {
      this.previewTitle = e.target.value
    },
    handleSummaryChange (e) {
      this.previewSummary = e.target.value
    },
    formatPreviewContent (html) {
      if (!html) return ''
      return html.replace(/src=["'](?!https?:\/\/|data:)([^"']+)["']/g, (_, src) => `src="${resolveFileUrl(src)}"`)
    },
    handleRemoveImg (file) {
      const index = this.fileListImg.indexOf(file)
      const newFileList = this.fileListImg.slice()
      newFileList.splice(index, 1)
      this.fileListImg = newFileList
      this.coverUrl = ''
      this.form.setFieldsValue({ cover: null })
    },
    beforeUploadImg (file) {
      this.fileListImg = [...this.fileListImg, file]
      this.form.setFieldsValue({ cover: file })
      this.coverUrl = URL.createObjectURL(file)
      return false
    }
  }
}
</script>

<style lang="less" scoped>
.preview-area {
  margin-top: 36px;
  padding-top: 24px;
  border-top: 1px dashed #d9d9d9;

  .preview-area-title {
    margin-bottom: 18px;
    font-size: 15px;
    font-weight: 600;
    color: #333;
  }
}

.phone-wrap {
  display: flex;
  justify-content: center;
  padding: 8px 0 4px;
}

.phone {
  position: relative;
  flex-shrink: 0;
  width: 300px;
  height: 560px;
  padding: 14px;
  background: #17171c;
  border: 2px solid #3c3c44;
  border-radius: 46px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.16);

  .phone-screen {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #fff;
    border-radius: 34px;
  }

  .phone-scroll {
    height: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .phone-cover {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
  }

  .phone-body {
    padding: 20px 18px 28px;
    background: #fff;
  }

  .phone-title {
    font-size: 17px;
    font-weight: 700;
    line-height: 1.4;
    color: #1a1a1a;
    word-break: break-word;
  }

  .phone-summary {
    margin-top: 10px;
    font-size: 14px;
    line-height: 1.6;
    color: #666;
    word-break: break-word;
  }

  .phone-content {
    margin-top: 16px;
    font-size: 15px;
    line-height: 1.75;
    color: #333;
    word-break: break-word;

    ::v-deep img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
    }
  }
}

.phone-empty-text {
  margin: 0;
  color: #999;
}
</style>
