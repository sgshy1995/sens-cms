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

            <a-form-model-item label="备注" prop="remark">
              <a-textarea v-model="form.remark" :rows="5" placeholder="请输入备注（选填）" />
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
import { postAction, putAction, uploadAction } from '@/utils/manage'
import { resolveFileUrl } from '@/utils/util'

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
        status: [
          { required: true, trigger: 'change', message: '请选择状态' }
        ]
      },
      form: {
        id: '',
        title: '',
        content: '',
        cover: '',
        remark: '',
        status: 1
      },
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
    }
  },
  methods: {
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
        content: '',
        cover: '',
        remark: '',
        status: 1
      }
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
        content: record.content,
        cover: record.cover,
        remark: record.remark,
        status: record.status
      }
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
            remark: this.form.remark,
            status: Number(this.form.status),
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
