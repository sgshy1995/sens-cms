<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="8" :sm="24">
              <a-form-item label="审核状态">
                <a-select v-model="queryParam.audit_status" placeholder="请选择">
                  <a-select-option value="0">待审核</a-select-option>
                  <a-select-option value="1">通过</a-select-option>
                  <a-select-option value="2">驳回</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
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
        :scroll="{x: 1400}"
      >
        <span slot="serial" slot-scope="text, record, index">
          {{ index + 1 }}
        </span>

        <span slot="titleColumn" slot-scope="text">
          <ellipsis :length="20" tooltip>{{ text }}</ellipsis>
        </span>

        <span slot="summary" slot-scope="text">
          <ellipsis :length="30" tooltip>{{ text || '-' }}</ellipsis>
        </span>

        <span slot="audit_status" slot-scope="text">
          <a-tag color="orange" v-if="text === 0">待审核</a-tag>
          <a-tag color="green" v-else-if="text === 1">通过</a-tag>
          <a-tag color="red" v-else-if="text === 2">驳回</a-tag>
        </span>

        <span slot="action" slot-scope="text, record">
          <template>
            <a @click="handleAudit(record)">{{ record.audit_status === 0 ? '审核' : '查看' }}</a>
          </template>
        </span>
      </s-table>

      <audit-modal ref="AuditModal" @ok="$refs.table.refresh(true)" />
    </a-card>
  </page-header-wrapper>
</template>

<script>
import moment from 'moment'
import { STable, Ellipsis } from '@/components'

import AuditModal from './modules/AuditModal'

import { getAction } from '@/utils/manage'
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
    title: '作者',
    dataIndex: 'name'
  },
  {
    title: '康复标签',
    dataIndex: 'tag_name',
    customRender: (text) => text || '-'
  },
  {
    title: '摘要',
    dataIndex: 'summary',
    scopedSlots: { customRender: 'summary' }
  },
  {
    title: '审核状态',
    dataIndex: 'audit_status',
    scopedSlots: { customRender: 'audit_status' }
  },
  {
    title: '驳回原因',
    dataIndex: 'reject_reason',
    customRender: (text) => text || '-'
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    customRender: (text) => text ? moment(new Date(text), 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss') : ''
  },
  {
    title: '操作',
    dataIndex: 'action',
    width: '120px',
    scopedSlots: { customRender: 'action' },
    fixed: 'right'
  }
]

export default {
  name: 'ForumArticleAudit',
  components: {
    STable,
    Ellipsis,
    AuditModal
  },
  data () {
    this.columns = columns
    return {
      moment,
      totalNum: 0,
      advanced: false,
      tagOptions: [],
      queryParam: {
        audit_status: '0',
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
    handleAudit (record) {
      this.$refs.AuditModal.show(record)
    },
    handleReset () {
      this.queryParam = {
        audit_status: '0',
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
