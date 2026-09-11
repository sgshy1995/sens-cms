<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="8" :sm="24">
              <a-form-item label="标题">
                <a-input @keypress.enter="$refs.table.refresh(true)" v-model="queryParam.keyword" placeholder="请输入文章标题/摘要模糊查询" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="康复标签">
                <a-cascader
                  style="width: 100%"
                  :options="tagOptions"
                  v-model="queryParam.tag"
                  change-on-select
                  allow-clear
                  placeholder="请选择康复标签"
                />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="审核状态">
                <a-select v-model="queryParam.audit_status" placeholder="请选择" allow-clear>
                  <a-select-option value="0">待审核</a-select-option>
                  <a-select-option value="1">通过</a-select-option>
                  <a-select-option value="2">驳回</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <template v-if="advanced">
              <a-col :md="8" :sm="24">
                <a-form-item label="文章状态">
                  <a-select v-model="queryParam.status" placeholder="请选择" allow-clear>
                    <a-select-option value="1">正常</a-select-option>
                    <a-select-option value="0">已删除</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :md="8" :sm="24">
                <a-form-item label="是否置顶">
                  <a-select v-model="queryParam.is_top" placeholder="请选择" allow-clear>
                    <a-select-option value="1">是</a-select-option>
                    <a-select-option value="0">否</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :md="8" :sm="24">
                <a-form-item label="是否精华">
                  <a-select v-model="queryParam.is_essence" placeholder="请选择" allow-clear>
                    <a-select-option value="1">是</a-select-option>
                    <a-select-option value="0">否</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </template>
            <a-col :md="!advanced && 8 || 24" :sm="24">
              <span
                class="table-page-search-submitButtons"
                :style="advanced && { float: 'right', overflow: 'hidden' } || {} ">
                <a-button type="primary" @click="$refs.table.refresh(true)">查询</a-button>
                <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
                <a @click="toggleAdvanced" style="margin-left: 8px">
                  {{ advanced ? "收起" : "展开" }}
                  <a-icon :type="advanced ? 'up' : 'down'" />
                </a>
              </span>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <div class="table-operator">
        <a-button type="primary" icon="plus" @click="handleAdd">发布文章</a-button>
      </div>

      <s-table
        ref="table"
        size="default"
        rowKey="id"
        :columns="columns"
        :data="loadData"
        :alert="options.alert"
        :rowSelection="options.rowSelection"
        :showPagination="true"
        :totalNum="totalNum"
        :scroll="{x: 1920}"
      >
        <span slot="serial" slot-scope="text, record, index">
          {{ index + 1 }}
        </span>

        <span slot="titleColumn" slot-scope="text">
          <ellipsis :length="20" tooltip>{{ text }}</ellipsis>
        </span>

        <span slot="audit_status" slot-scope="text">
          <a-tag color="orange" v-if="text === 0">待审核</a-tag>
          <a-tag color="green" v-else-if="text === 1">通过</a-tag>
          <a-tag color="red" v-else-if="text === 2">驳回</a-tag>
          <a-tag v-else>{{ text }}</a-tag>
        </span>

        <span slot="status" slot-scope="text">
          <span style="color: #59C337;font-weight: bold" v-if="text === 1">正常</span>
          <span style="color: #F56C6E;font-weight: bold" v-else>已删除</span>
        </span>

        <span slot="is_top" slot-scope="text" :style="{color: text === 1 ? '#FBAC33' : '#333', fontWeight: text === 1 ? 'bold' : 'normal'}">
          {{ text === 1 ? '是' : '否' }}
        </span>

        <span slot="is_essence" slot-scope="text" :style="{color: text === 1 ? '#59C337' : '#333', fontWeight: text === 1 ? 'bold' : 'normal'}">
          {{ text === 1 ? '是' : '否' }}
        </span>

        <span slot="action" slot-scope="text, record">
          <template>
            <a @click="handleEdit(record)">编辑</a>
            <a-divider type="vertical" />
            <a @click="handleMark(record, { is_top: record.is_top === 1 ? 0 : 1 })">{{ record.is_top === 1 ? '取消置顶' : '置顶' }}</a>
            <a-divider type="vertical" />
            <a @click="handleMark(record, { is_essence: record.is_essence === 1 ? 0 : 1 })">{{ record.is_essence === 1 ? '取消精华' : '精华' }}</a>
            <a-divider type="vertical" />
            <a-popconfirm title="确定删除该文章吗？" ok-text="确定" cancel-text="取消" @confirm="handleDelete(record)">
              <a style="color: #F56C6E">删除</a>
            </a-popconfirm>
          </template>
        </span>
      </s-table>

      <create-form
        ref="createModal"
        :visible="visible"
        :loading="confirmLoading"
        :model="mdl"
        @cancel="handleCancel"
        @ok="handleOk"
      />
    </a-card>
  </page-header-wrapper>
</template>

<script>
import moment from 'moment'
import { STable, Ellipsis } from '@/components'

import CreateForm from './modules/CreateForm'

import { getAction, postAction, putAction, deleteAction, uploadAction } from '@/utils/manage'
import { forumArticleApi, prescriptionTagApi } from '@/service/api'
import { buildTagTree } from './modules/tagTree'

const columns = [
  {
    title: '#',
    scopedSlots: { customRender: 'serial' }
  },
  {
    title: '标题',
    dataIndex: 'title',
    scopedSlots: { customRender: 'titleColumn' }
  },
  {
    title: '康复标签',
    dataIndex: 'tag_name',
    customRender: (text) => text || '-'
  },
  {
    title: '作者',
    dataIndex: 'name'
  },
  {
    title: '审核状态',
    dataIndex: 'audit_status',
    scopedSlots: { customRender: 'audit_status' }
  },
  {
    title: '状态',
    dataIndex: 'status',
    scopedSlots: { customRender: 'status' }
  },
  {
    title: '置顶',
    dataIndex: 'is_top',
    scopedSlots: { customRender: 'is_top' }
  },
  {
    title: '精华',
    dataIndex: 'is_essence',
    scopedSlots: { customRender: 'is_essence' }
  },
  {
    title: '点赞',
    dataIndex: 'like_num'
  },
  {
    title: '收藏',
    dataIndex: 'collect_num'
  },
  {
    title: '评论',
    dataIndex: 'comment_num'
  },
  {
    title: '浏览',
    dataIndex: 'view_num'
  },
  {
    title: '发布时间',
    dataIndex: 'publish_time',
    customRender: (text) => text ? moment(new Date(text), 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss') : ''
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    customRender: (text) => text ? moment(new Date(text), 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss') : ''
  },
  {
    title: '操作',
    dataIndex: 'action',
    width: '260px',
    scopedSlots: { customRender: 'action' },
    fixed: 'right'
  }
]

export default {
  name: 'ForumArticleList',
  components: {
    STable,
    Ellipsis,
    CreateForm
  },
  data () {
    this.columns = columns
    return {
      moment,
      totalNum: 0,
      visible: false,
      confirmLoading: false,
      mdl: null,
      advanced: false,
      tagOptions: [],
      queryParam: {
        status: '1',
        tag: []
      },
      loadData: parameter => {
        const requestParameters = Object.assign({}, parameter, this.queryParam)
        if (Array.isArray(requestParameters.tag) && requestParameters.tag.length) {
          requestParameters.tag = requestParameters.tag[requestParameters.tag.length - 1]
        } else {
          requestParameters.tag = ''
        }
        return getAction(forumArticleApi.get, requestParameters)
          .then(res => {
            this.totalNum = res.data.totalCount
            return res.data
          })
          .finally(() => {
            this.$refs.table.clearSelected()
          })
      },
      options: {
        alert: { show: true, clear: () => { this.selectedRowKeys = [] } },
        rowSelection: {
          selectedRowKeys: this.selectedRowKeys,
          onChange: this.onSelectChange
        }
      },
      dataSource: [],
      selectedRowKeys: [],
      selectedRows: []
    }
  },
  created () {
    this.loadTagOptions()
  },
  methods: {
    handleReset () {
      this.queryParam = {
        status: '1',
        tag: []
      }
      this.$refs.table.refresh(true)
    },
    loadTagOptions () {
      getAction(prescriptionTagApi.getAll).then(res => {
        const data = res.data || []
        this.tagOptions = buildTagTree(data)
      }).catch(() => {})
    },
    handleAdd () {
      this.mdl = null
      this.visible = true
    },
    handleEdit (record) {
      this.confirmLoading = true
      getAction(forumArticleApi.getOneById(record.id)).then(res => {
        this.mdl = { ...res.data }
        this.visible = true
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '查询文章失败')
      }).finally(() => {
        this.confirmLoading = false
      })
    },
    handleMark (record, payload) {
      putAction(forumArticleApi.mark(record.id), payload).then(res => {
        this.$message.success(res.message || '更新成功')
        this.$refs.table.refresh()
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '更新失败')
      })
    },
    handleDelete (record) {
      deleteAction(forumArticleApi.deleteOneById(record.id)).then(res => {
        this.$message.success(res.message || '删除成功')
        this.$refs.table.refresh()
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '删除失败')
      })
    },
    handleSubmit (formIn) {
      if (formIn.id) {
        putAction(forumArticleApi.update(formIn.id), formIn).then(res => {
          this.$message.success(res.message || '更新成功')
          this.handleCancel()
          this.$refs.table.refresh()
        }).catch(err => {
          this.$message.error((err.data && err.data.message) || '更新失败')
        }).finally(() => {
          this.confirmLoading = false
        })
      } else {
        postAction(forumArticleApi.create, formIn).then(res => {
          this.$message.success(res.message || '发布成功')
          this.handleCancel()
          this.$refs.table.refresh()
        }).catch(err => {
          this.$message.error((err.data && err.data.message) || '发布失败')
        }).finally(() => {
          this.confirmLoading = false
        })
      }
    },
    handleOk () {
      const form = this.$refs.createModal.form
      this.confirmLoading = true
      form.validateFields((errors, values) => {
        if (errors) {
          this.confirmLoading = false
          return
        }
        const content = this.$refs.createModal.editorContent
        if (!content || !String(content).replace(/<[^>]*>/g, '').trim()) {
          this.$message.warning('请输入文章内容')
          this.confirmLoading = false
          return
        }
        const formIn = { ...values, content }
        if (Array.isArray(formIn.tag) && formIn.tag.length) {
          formIn.tag = formIn.tag[formIn.tag.length - 1]
        } else {
          formIn.tag = null
        }
        const hasNewCover = this.$refs.createModal.fileListImg.length > 0
        if (hasNewCover && values.cover && values.cover.file) {
          const formDataCover = new FormData()
          formDataCover.append('file', values.cover.file)
          uploadAction(forumArticleApi.uploadCover, formDataCover).then(res => {
            formIn.cover = res.data
            this.handleSubmit(formIn)
          }).catch(err => {
            this.$message.error((err.data && err.data.message) || '封面上传失败')
            this.confirmLoading = false
          })
        } else {
          this.handleSubmit(formIn)
        }
      })
    },
    handleCancel () {
      this.visible = false
      const form = this.$refs.createModal.form
      form.resetFields()
    },
    onSelectChange (selectedRowKeys, selectedRows) {
      this.selectedRowKeys = selectedRowKeys
      this.selectedRows = selectedRows
    },
    toggleAdvanced () {
      this.advanced = !this.advanced
    }
  }
}
</script>

<style lang="less">
.text-item{
  &.success .ant-badge-status-text{
    color: #52c41a;
  }

  &.fail .ant-badge-status-text{
    color: #F42132;
  }
}
</style>
