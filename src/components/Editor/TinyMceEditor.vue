<template>
  <div class="tiny-mce-editor">
    <editor
      :value="content"
      :init="editorInit"
      @input="handleInput"
    />
  </div>
</template>

<script>
import tinymce from 'tinymce/tinymce'
import 'tinymce/models/dom'
import 'tinymce/themes/silver'
import 'tinymce/icons/default'
import 'tinymce/plugins/advlist'
import 'tinymce/plugins/lists'
import 'tinymce/plugins/link'
import 'tinymce/plugins/image'
import 'tinymce/plugins/table'
import 'tinymce/plugins/code'
import 'tinymce/plugins/fullscreen'
import 'tinymce/skins/ui/oxide/skin.min.css'
import 'tinymce-i18n/langs/zh_CN'
import Editor from '@tinymce/tinymce-vue'
import storage from 'store'
import { ACCESS_TOKEN } from '@/store/mutation-types'
import { resolveFileUrl } from '@/utils/util'

export default {
  name: 'TinyMceEditor',
  components: {
    Editor
  },
  props: {
    value: {
      type: String,
      default: ''
    },
    uploadUrl: {
      type: String,
      default: ''
    },
    uploadFileName: {
      type: String,
      default: 'file'
    },
    cdnBase: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      content: this.value || '',
      editorInit: {
        language: 'zh_CN',
        skin: false,
        content_css: false,
        height: 480,
        menubar: false,
        statusbar: false,
        branding: false,
        promotion: false,
        resize: true,
        elementpath: false,
        plugins: 'advlist lists link image table code fullscreen',
        toolbar: [
          'undo redo',
          'blocks fontfamily fontsize',
          'bold italic underline strikethrough',
          'forecolor backcolor',
          'alignleft aligncenter alignright',
          'bullist numlist outdent indent',
          'link image table',
          'removeformat code fullscreen'
        ].join(' | '),
        toolbar_mode: 'wrap',
        block_formats: '正文=p; 标题1=h1; 标题2=h2; 标题3=h3; 标题4=h4',
        font_family_formats: '苹方="PingFang SC"; 微软雅黑="Microsoft YaHei"; 宋体=SimSun; Arial=Arial; 等宽=monospace',
        font_size_formats: '12px 14px 16px 18px 20px 24px 32px',
        relative_urls: false,
        remove_script_host: false,
        convert_urls: false,
        paste_data_images: true,
        automatic_uploads: true,
        images_file_types: 'jpeg,jpg,jpe,jfi,jif,jfif,png,gif,webp,bmp',
        content_style: `
          body {
            margin: 16px;
            color: #1a1d24;
            font-family: "PingFang SC";
            font-size: 14px;
            line-height: 1.75;
          }
          img { max-width: 100%; height: auto; }
          table { border-collapse: collapse; }
          table td, table th { border: 1px solid #d9d9d9; padding: 6px 8px; }
        `,
        images_upload_handler: blobInfo => this.uploadImage(blobInfo.blob(), blobInfo.filename())
      }
    }
  },
  watch: {
    value (val) {
      const nextValue = val || ''
      if (this.content !== nextValue) {
        this.content = nextValue
      }
    }
  },
  methods: {
    handleInput (html) {
      this.content = html
      this.$emit('change', html)
    },
    uploadImage (blob, filename) {
      return new Promise((resolve, reject) => {
        if (!this.uploadUrl) {
          reject('图片上传地址未配置')
          return
        }
        if (blob.size > 5 * 1024 * 1024) {
          reject('图片不能超过5MB')
          return
        }
        const formData = new FormData()
        formData.append(this.uploadFileName, blob, filename)
        const xhr = new XMLHttpRequest()
        xhr.open('POST', this.uploadUrl)
        const token = storage.get(ACCESS_TOKEN)
        if (token) {
          xhr.setRequestHeader('Authorization', 'Bearer ' + token)
        }
        xhr.onload = () => {
          try {
            const result = JSON.parse(xhr.responseText || '{}')
            if (xhr.status < 200 || xhr.status >= 300 || !result.data) {
              throw new Error(result.message || '图片上传失败')
            }
            resolve(resolveFileUrl(result.data))
          } catch (error) {
            reject(error.message || '图片上传失败')
          }
        }
        xhr.onerror = () => reject('图片上传失败')
        xhr.send(formData)
      })
    }
  }
}
</script>

<style lang="less" scoped>
.tiny-mce-editor {
  :deep(.tox-tinymce) {
    border-radius: 6px;
    border-color: #d9d9d9;
  }

  :deep(.tox .tox-toolbar__group) {
    align-items: center;
  }
}
</style>
