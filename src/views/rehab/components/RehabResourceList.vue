<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="resourceType === 'text' ? 6 : 8" :sm="24">
              <a-form-item :label="`${resourceName}标题`">
                <a-input
                  allow-clear
                  v-model="queryParam.title"
                  :placeholder="`请输入${resourceName}标题模糊查询`"
                  @keypress.enter="loadData"
                />
              </a-form-item>
            </a-col>
            <a-col v-if="resourceType === 'text'" :md="6" :sm="24">
              <a-form-item label="文字内容">
                <a-input
                  allow-clear
                  v-model="queryParam.content"
                  placeholder="请输入文字内容模糊查询"
                  @keypress.enter="loadData"
                />
              </a-form-item>
            </a-col>
            <a-col :md="resourceType === 'text' ? 6 : 8" :sm="24">
              <a-form-item label="状态">
                <a-select v-model="queryParam.status" allow-clear placeholder="请选择状态">
                  <a-select-option :value="1">发布</a-select-option>
                  <a-select-option :value="0">下线</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :md="resourceType === 'text' ? 6 : 8" :sm="24">
              <span class="table-page-search-submitButtons">
                <a-button type="primary" @click="loadData">查询</a-button>
                <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
              </span>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <div class="table-operator">
        <a-button type="primary" icon="plus" @click="handleAdd">新建{{ resourceName }}</a-button>
      </div>

      <a-table
        row-key="id"
        :columns="columns"
        :data-source="dataList"
        :loading="loading"
        :pagination="{ pageSize: 10, showSizeChanger: true }"
        :scroll="{ x: tableScrollX }"
      >
        <span slot="content" slot-scope="text, record">
          <template v-if="resourceType === 'image'">
            <img
              v-if="text"
              class="resource-thumb"
              :src="resolveFileUrl(text)"
              alt="图片"
              @click="openFile(text)"
            >
            <span v-else>-</span>
          </template>
          <template v-else-if="resourceType === 'video'">
            <a v-if="text" @click="openFile(text, record)">查看视频</a>
            <span v-else>-</span>
          </template>
          <template v-else>
            <a-tooltip :title="text">
              <span class="ellipsis-text">{{ truncate(text, 24) }}</span>
            </a-tooltip>
          </template>
        </span>
        <span slot="remark" slot-scope="text">
          <a-tooltip :title="text">
            <span class="ellipsis-text">{{ truncate(text, 30) }}</span>
          </a-tooltip>
        </span>
        <span slot="cover" slot-scope="text">
          <img
            v-if="text"
            class="resource-thumb"
            :src="resolveFileUrl(text)"
            alt="视频封面"
            @click="openImageFile(text)"
          >
          <span v-else>-</span>
        </span>
        <span slot="status" slot-scope="text">
          <a-tag :color="text === 1 ? 'green' : 'red'">
            {{ text === 1 ? '发布' : '下线' }}
          </a-tag>
        </span>
        <span slot="createdAt" slot-scope="text">
          {{ formatTime(text) }}
        </span>
        <span slot="updatedAt" slot-scope="text">
          {{ formatTime(text) }}
        </span>
        <span slot="action" slot-scope="text, record">
          <a @click="handleEdit(record)">编辑</a>
          <a-divider type="vertical" />
          <a-popconfirm
            :title="record.status === 1 ? `确定下线该${resourceName}吗？` : `确定发布该${resourceName}吗？`"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleStatus(record)"
          >
            <a>{{ record.status === 1 ? '下线' : '发布' }}</a>
          </a-popconfirm>
          <a-divider type="vertical" />
          <a-popconfirm :title="`确定删除该${resourceName}吗？`" ok-text="确定" cancel-text="取消" @confirm="handleDelete(record)">
            <a style="color: #F56C6E">删除</a>
          </a-popconfirm>
        </span>
      </a-table>

      <a-modal
        v-model="videoVisible"
        title="视频预览"
        :footer="null"
        :width="videoModalWidth"
        :destroy-on-close="true"
        @cancel="closeVideo"
      >
        <div class="video-preview-wrap">
          <video
            ref="videoPlayer"
            class="video-js vjs-big-play-centered video-preview-player"
            controls
            preload="auto"
            :poster="videoPoster"
          />
        </div>
      </a-modal>

      <img
        v-if="imagePreviewUrl"
        ref="viewerImage"
        class="viewer-source-image"
        :src="imagePreviewUrl"
        alt="图片预览"
      >

      <rehab-resource-form
        ref="createModal"
        :visible="visible"
        :model="mdl"
        :resource-name="resourceName"
        :resource-type="resourceType"
        :api="api"
        @cancel="handleCancel"
        @ok="handleOk"
      />
    </a-card>
  </page-header-wrapper>
</template>

<script>
import moment from 'moment'
import Viewer from 'viewerjs'
import 'viewerjs/dist/viewer.css'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import RehabResourceForm from './RehabResourceForm'
import { deleteAction, getAction, putAction } from '@/utils/manage'
import { resolveFileUrl } from '@/utils/util'

const contentLabelMap = {
  video: '视频内容',
  image: '图片内容',
  text: '文字内容'
}

const createColumns = contentLabel => [
  { title: '#', dataIndex: 'index', width: '64px', customRender: (text, record, index) => index + 1 },
  { title: '标题', dataIndex: 'title', width: '180px', ellipsis: true },
  { title: contentLabel, dataIndex: 'content', width: '220px', ellipsis: true, scopedSlots: { customRender: 'content' } },
  { title: '备注', dataIndex: 'remark', width: '240px', ellipsis: true, scopedSlots: { customRender: 'remark' } },
  { title: '状态', dataIndex: 'status', width: '100px', scopedSlots: { customRender: 'status' } },
  { title: '创建时间', dataIndex: 'created_at', width: '170px', scopedSlots: { customRender: 'createdAt' } },
  { title: '更新时间', dataIndex: 'updated_at', width: '170px', scopedSlots: { customRender: 'updatedAt' } },
  { title: '操作', width: '220px', fixed: 'right', scopedSlots: { customRender: 'action' } }
]

export default {
  name: 'RehabResourceList',
  components: {
    RehabResourceForm
  },
  props: {
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
    const columns = createColumns(contentLabelMap[this.resourceType] || '内容')
    this.columns = this.resourceType === 'video'
      ? [
          ...columns.slice(0, 3),
          { title: '封面', dataIndex: 'cover', width: '90px', scopedSlots: { customRender: 'cover' } },
          ...columns.slice(3)
        ]
      : columns
    const tableScrollX = this.columns.reduce((total, column) => {
      return total + (parseInt(column.width, 10) || 160)
    }, 0)
    return {
      loading: false,
      visible: false,
      mdl: null,
      queryParam: {},
      dataList: [],
      videoVisible: false,
      videoModalWidth: 520,
      videoPoster: '',
      videoPlayer: null,
      imagePreviewUrl: '',
      imageViewer: null,
      tableScrollX
    }
  },
  beforeDestroy () {
    this.disposeVideoPlayer()
    this.disposeImageViewer()
  },
  created () {
    this.loadData()
  },
  methods: {
    resolveFileUrl,
    formatTime (value) {
      return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    truncate (value, length) {
      if (!value) return '-'
      return value.length > length ? `${value.slice(0, length)}...` : value
    },
    openFile (path, record = {}) {
      const url = resolveFileUrl(path)
      if (!url) return
      if (this.resourceType === 'video') {
        this.videoPoster = record.cover ? resolveFileUrl(record.cover) : ''
        this.openVideo(url)
      } else if (this.resourceType === 'image') {
        this.openImage(url)
      }
    },
    openImageFile (path) {
      const url = resolveFileUrl(path)
      if (url) {
        this.openImage(url)
      }
    },
    openVideo (url) {
      this.videoVisible = true
      this.$nextTick(() => {
        this.disposeVideoPlayer()
        this.videoPlayer = videojs(this.$refs.videoPlayer, {
          controls: true,
          autoplay: false,
          preload: 'auto',
          playsinline: true,
          poster: this.videoPoster,
          sources: [{
            src: url,
            type: this.getVideoType(url)
          }]
        })
        this.videoPlayer.on('loadedmetadata', () => {
          this.fitVideoPlayer()
        })
      })
    },
    closeVideo () {
      this.disposeVideoPlayer()
      this.videoVisible = false
      this.videoModalWidth = 520
      this.videoPoster = ''
    },
    disposeVideoPlayer () {
      if (this.videoPlayer) {
        this.videoPlayer.dispose()
        this.videoPlayer = null
      }
    },
    fitVideoPlayer () {
      if (!this.videoPlayer) return
      const videoWidth = this.videoPlayer.videoWidth()
      const videoHeight = this.videoPlayer.videoHeight()
      if (!videoWidth || !videoHeight) return

      const maxPlayerWidth = Math.max(240, Math.min(720, window.innerWidth - 120))
      const maxPlayerHeight = Math.max(240, window.innerHeight * 0.7)
      const scale = Math.min(1, maxPlayerWidth / videoWidth, maxPlayerHeight / videoHeight)
      const displayWidth = Math.round(videoWidth * scale)
      const displayHeight = Math.round(videoHeight * scale)

      this.videoPlayer.width(displayWidth)
      this.videoPlayer.height(displayHeight)
      this.videoModalWidth = Math.max(360, Math.min(maxPlayerWidth + 48, displayWidth + 48))
    },
    openImage (url) {
      this.disposeImageViewer()
      this.imagePreviewUrl = url
      this.$nextTick(() => {
        this.imageViewer = new Viewer(this.$refs.viewerImage, {
          navbar: false,
          title: false,
          toolbar: {
            zoomIn: true,
            zoomOut: true,
            oneToOne: true,
            reset: true,
            prev: true,
            next: true,
            play: false,
            rotateLeft: false,
            rotateRight: false,
            flipHorizontal: false,
            flipVertical: false
          },
          transition: true,
          zIndex: 2000
        })
        this.imageViewer.show()
      })
    },
    disposeImageViewer () {
      if (this.imageViewer) {
        this.imageViewer.destroy()
        this.imageViewer = null
      }
    },
    getVideoType (url) {
      if (/\.m3u8($|\?)/i.test(url)) return 'application/x-mpegURL'
      if (/\.webm($|\?)/i.test(url)) return 'video/webm'
      return 'video/mp4'
    },
    loadData () {
      this.loading = true
      getAction(this.api.get, this.queryParam).then(res => {
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
      this.visible = true
      this.$nextTick(() => {
        this.$refs.createModal.reset()
      })
    },
    handleEdit (record) {
      this.mdl = { ...record }
      this.visible = true
      this.$nextTick(() => {
        this.$refs.createModal.edit(record)
      })
    },
    handleStatus (record) {
      const status = record.status === 1 ? 0 : 1
      putAction(this.api.update, { id: record.id, status }).then(res => {
        this.$message.success(res.message || '操作成功')
        this.loadData()
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '操作失败')
      })
    },
    handleDelete (record) {
      deleteAction(this.api.deleteOneById(record.id)).then(res => {
        this.$message.success(res.message || '删除成功')
        this.loadData()
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '删除失败')
      })
    },
    handleOk () {
      this.visible = false
      this.loadData()
    },
    handleCancel () {
      this.visible = false
    }
  }
}
</script>

<style lang="less" scoped>
.resource-thumb {
  width: 72px;
  height: 48px;
  object-fit: cover;
  cursor: pointer;
  border-radius: 4px;
}

.ellipsis-text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.video-preview-wrap {
  display: flex;
  justify-content: center;
  width: 100%;
}

.video-preview-player {
  max-width: 100%;
}

.viewer-source-image {
  position: fixed;
  top: -9999px;
  left: -9999px;
  width: 1px;
  height: 1px;
  pointer-events: none;
  opacity: 0;
}
</style>
