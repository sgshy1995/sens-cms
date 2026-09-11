<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="14" :sm="24">
              <a-form-item label="选择文章">
                <a-select
                  v-model="selectedArticleId"
                  style="width: 360px"
                  placeholder="输入文章标题搜索并选择"
                  show-search
                  :filter-option="false"
                  :not-found-content="articleLoading ? '搜索中...' : '未找到相关文章'"
                  @search="handleArticleSearch"
                  @change="handleArticleChange"
                  allow-clear
                >
                  <a-select-option v-for="item in articleOptions" :key="item.id" :value="item.id">
                    {{ item.title }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :md="10" :sm="24">
              <div class="selected-article-info" v-if="selectedArticle">
                <span>已选文章：</span>
                <span style="font-weight: bold">{{ selectedArticle.title }}</span>
                <span style="margin-left: 12px;color: #888">作者：{{ selectedArticle.name }}</span>
              </div>
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
        :showPagination="false"
        :scroll="{x: 1200}"
      >
        <span slot="serial" slot-scope="text, record, index">
          {{ index + 1 }}
        </span>

        <span slot="content" slot-scope="text">
          <ellipsis :length="40" tooltip>{{ text }}</ellipsis>
        </span>

        <span slot="action" slot-scope="text, record">
          <template>
            <a-popconfirm title="确定删除该评论吗？" ok-text="确定" cancel-text="取消" @confirm="handleDelete(record)">
              <a style="color: #F56C6E">删除</a>
            </a-popconfirm>
          </template>
        </span>
      </s-table>
    </a-card>
  </page-header-wrapper>
</template>

<script>
import moment from 'moment'
import { STable, Ellipsis } from '@/components'

import { getAction, deleteAction } from '@/utils/manage'
import { forumArticleApi, forumCommentApi } from '@/service/api'

const columns = [
  {
    title: '#',
    scopedSlots: { customRender: 'serial' }
  },
  {
    title: '评论用户',
    dataIndex: 'name'
  },
  {
    title: '回复对象',
    dataIndex: 'to_name',
    customRender: (text) => text || '-'
  },
  {
    title: '评论内容',
    dataIndex: 'content',
    scopedSlots: { customRender: 'content' }
  },
  {
    title: '点赞数',
    dataIndex: 'like_num'
  },
  {
    title: '回复数',
    dataIndex: 'reply_num'
  },
  {
    title: 'IP归属地',
    dataIndex: 'location',
    customRender: (text) => text || '-'
  },
  {
    title: '评论时间',
    dataIndex: 'created_at',
    customRender: (text) => text ? moment(new Date(text), 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss') : ''
  },
  {
    title: '操作',
    dataIndex: 'action',
    width: '100px',
    scopedSlots: { customRender: 'action' },
    fixed: 'right'
  }
]

export default {
  name: 'ForumCommentManage',
  components: {
    STable,
    Ellipsis
  },
  data () {
    this.columns = columns
    return {
      moment,
      selectedArticleId: undefined,
      selectedArticle: null,
      articleOptions: [],
      articleLoading: false,
      comments: [],
      loadData: () => {
        return Promise.resolve({
          data: this.comments,
          pageNo: 1,
          pageSize: this.comments.length,
          totalCount: this.comments.length
        })
      }
    }
  },
  methods: {
    handleArticleSearch (keyword) {
      if (!keyword) {
        this.articleOptions = []
        return
      }
      this.articleLoading = true
      getAction(forumArticleApi.get, {
        keyword,
        pageNo: 1,
        pageSize: 20,
        status: 1
      }).then(res => {
        this.articleOptions = res.data.data || []
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '搜索文章失败')
      }).finally(() => {
        this.articleLoading = false
      })
    },
    handleArticleChange (articleId) {
      if (!articleId) {
        this.selectedArticle = null
        this.comments = []
        this.$refs.table.refresh()
        return
      }
      const found = this.articleOptions.find(item => item.id === articleId)
      if (found) {
        this.selectedArticle = { ...found }
      }
      this.loadComments(articleId)
    },
    loadComments (articleId) {
      getAction(forumCommentApi.getByArticle(articleId)).then(res => {
        this.comments = res.data || []
        this.$refs.table.refresh()
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '查询评论失败')
      })
    },
    handleDelete (record) {
      deleteAction(forumCommentApi.deleteOneById(record.id)).then(res => {
        this.$message.success(res.message || '删除成功')
        if (this.selectedArticleId) {
          this.loadComments(this.selectedArticleId)
        }
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '删除失败')
      })
    }
  }
}
</script>
