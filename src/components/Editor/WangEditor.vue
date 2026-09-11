<template>
  <div :class="prefixCls">
    <div ref="editor" class="editor-wrapper"></div>
  </div>
</template>

<script>
import WEditor from 'wangeditor'
import storage from 'store'
import { ACCESS_TOKEN } from '@/store/mutation-types'
import { resolveFileUrl } from '@/utils/util'

export default {
  name: 'WangEditor',
  props: {
    prefixCls: {
      type: String,
      default: 'ant-editor-wang'
    },
    // eslint-disable-next-line
    value: {
      type: String
    },
    // 图片上传地址，为空则不开启上传
    uploadUrl: {
      type: String,
      default: ''
    },
    // 上传文件字段名
    uploadFileName: {
      type: String,
      default: 'file'
    },
    // 上传返回的相对路径前拼接的 CDN 域名
    cdnBase: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      editor: null,
      editorContent: null
    }
  },
  watch: {
    value (val) {
      this.editorContent = val
      if (this.editor && this.editor.txt) {
        this.editor.txt.html(val)
      }
    }
  },
  mounted () {
    this.initEditor()
  },
  beforeDestroy () {
    this.editor && this.editor.destroy()
  },
  methods: {
    initEditor () {
      this.editor = new WEditor(this.$refs.editor)
      this.editor.customConfig.onchange = (html) => {
        this.editorContent = html
        this.$emit('change', this.editorContent)
      }
      if (this.uploadUrl) {
        this.editor.customConfig.uploadImgServer = this.uploadUrl
        this.editor.customConfig.uploadFileName = this.uploadFileName
        this.editor.customConfig.uploadImgMaxSize = 5 * 1024 * 1024
        this.editor.customConfig.uploadImgMaxLength = 1
        this.editor.customConfig.uploadImgHeaders = {
          Authorization: 'Bearer ' + (storage.get(ACCESS_TOKEN) || '')
        }
        this.editor.customConfig.uploadImgHooks = {
          customInsert: (insertImgFn, result) => {
            if (result && result.data) {
              const url = resolveFileUrl(result.data)
              insertImgFn(url)
            }
          },
          error: (xhr, editor, err) => {
            this.$message && this.$message.error('图片上传失败')
          }
        }
      }
      this.editor.create()
      if (this.value) {
        this.editor.txt.html(this.value)
      }
    }
  }
}
</script>

<style lang="less" scoped>
.ant-editor-wang {
  .editor-wrapper {
    text-align: left;
  }

  ::v-deep .w-e-toolbar {
    flex-wrap: wrap;
  }
}
</style>
