<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="8" :sm="24">
              <a-form-item label="选择文章">
                <a-select
                  v-model="selectedArticleId"
                  style="width: 100%"
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
            <a-col :md="5" :sm="24">
              <a-form-item label="审核状态">
                <a-select v-model="queryParam.audit_status" placeholder="全部" allow-clear @change="$refs.table.refresh(true)">
                  <a-select-option value="0">待审核</a-select-option>
                  <a-select-option value="1">通过</a-select-option>
                  <a-select-option value="2">驳回</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :md="11" :sm="24">
              <a-form-item label="评论内容">
                <a-input-search
                  v-model="queryParam.keyword"
                  placeholder="输入评论内容搜索"
                  allow-clear
                  @search="$refs.table.refresh(true)"
                />
              </a-form-item>
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
        :showPagination="true"
        :totalNum="totalNum"
        :scroll="{x: 1400}"
      >
        <span slot="serial" slot-scope="text, record, index">
          {{ index + 1 }}
        </span>

        <span slot="article_title" slot-scope="text">
          <ellipsis :length="20" tooltip>{{ text || '-' }}</ellipsis>
        </span>

        <span slot="content" slot-scope="text">
          <ellipsis :length="36" tooltip>{{ text }}</ellipsis>
        </span>

        <span slot="audit_status" slot-scope="text">
          <a-tag color="orange" v-if="text === 0">待审核</a-tag>
          <a-tag color="green" v-else-if="text === 1">通过</a-tag>
          <a-tag color="red" v-else-if="text === 2">驳回</a-tag>
          <a-tag v-else>{{ text }}</a-tag>
        </span>

        <span slot="reject_reason" slot-scope="text">
          <span style="color: #F56C6E">{{ text || '-' }}</span>
        </span>

        <span slot="action" slot-scope="text, record">
          <template>
            <template v-if="record.audit_status === 0">
              <a @click="openAuditDrawer(record)">审核</a>
              <a-divider type="vertical" />
            </template>
            <a-popconfirm title="确定删除该评论吗？" ok-text="确定" cancel-text="取消" @confirm="handleDelete(record)">
              <a style="color: #F56C6E">删除</a>
            </a-popconfirm>
          </template>
        </span>
      </s-table>

      <a-drawer
        title="评论审核"
        placement="right"
        :width="720"
        :visible="auditDrawerVisible"
        :mask-closable="false"
        @close="closeAuditDrawer"
      >
        <a-spin :spinning="auditDrawerLoading">
          <div v-if="auditRecord" class="audit-drawer-body">
            <section class="audit-section">
              <div class="audit-section-title">评论内容</div>
              <div class="comment-detail-card">
                <div class="comment-detail-meta">
                  <span>{{ auditRecord.name || '匿名用户' }}</span>
                  <span>{{ auditRecord.created_at ? formatDate(auditRecord.created_at) : '' }}</span>
                </div>
                <div class="comment-detail-content">{{ auditRecord.content }}</div>
              </div>
            </section>

            <section class="audit-section">
              <div class="audit-section-title">文章详情</div>
              <div v-if="auditArticle.id" class="article-detail-card">
                <div class="article-detail-title">{{ auditArticle.title }}</div>
                <div class="article-detail-meta">
                  <span>作者：{{ auditArticle.name || '-' }}</span>
                  <span>发布于：{{ auditArticle.publish_time ? formatDate(auditArticle.publish_time) : '-' }}</span>
                </div>
                <div v-if="auditArticle.summary" class="article-detail-summary">{{ auditArticle.summary }}</div>
                <div class="article-detail-content" v-html="formatArticleContent(auditArticle.content)"></div>
              </div>
              <a-empty v-else description="未查询到文章信息" />
            </section>

            <section class="audit-section">
              <div class="audit-section-title">审核信息</div>
              <div class="audit-status-row">
                <a-tag color="orange" v-if="auditRecord.audit_status === 0">待审核</a-tag>
                <a-tag color="green" v-else-if="auditRecord.audit_status === 1">已通过</a-tag>
                <a-tag color="red" v-else-if="auditRecord.audit_status === 2">已驳回</a-tag>
                <span v-if="auditRecord.audit_time" class="audit-time">审核时间：{{ formatDate(auditRecord.audit_time) }}</span>
              </div>
              <div class="audit-remark-label">备注（选填）</div>
              <a-textarea
                v-model="auditRemark"
                :rows="4"
                :max-length="200"
                placeholder="可填写审核备注"
              />
            </section>
          </div>
        </a-spin>

        <div class="audit-drawer-footer" v-if="auditRecord">
          <a-button class="audit-action-button" type="primary" :loading="auditSubmitting && auditTargetStatus === 1" @click="submitAudit(1)">
            通过
          </a-button>
          <a-button class="audit-action-button" type="danger" :loading="auditSubmitting && auditTargetStatus === 2" @click="submitAudit(2)">
            驳回
          </a-button>
        </div>
      </a-drawer>
    </a-card>
  </page-header-wrapper>
</template>

<script>
import moment from 'moment'
import { STable, Ellipsis } from '@/components'

import { getAction, putAction, deleteAction } from '@/utils/manage'
import { forumArticleApi, forumCommentApi } from '@/service/api'
import { resolveFileUrl } from '@/utils/util'

const columns = [
  {
    title: '#',
    scopedSlots: { customRender: 'serial' }
  },
  {
    title: '所属文章',
    dataIndex: 'article_title',
    scopedSlots: { customRender: 'article_title' }
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
    title: '审核状态',
    dataIndex: 'audit_status',
    scopedSlots: { customRender: 'audit_status' }
  },
  {
    title: '审核备注',
    dataIndex: 'reject_reason',
    scopedSlots: { customRender: 'reject_reason' }
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
    width: '120px',
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
      articleOptions: [],
      articleLoading: false,
      totalNum: 0,
      auditDrawerVisible: false,
      auditDrawerLoading: false,
      auditSubmitting: false,
      auditTargetStatus: 0,
      auditRecord: null,
      auditArticle: {},
      auditRemark: '',
      queryParam: {
        article_id: undefined,
        audit_status: undefined,
        keyword: ''
      },
      loadData: parameter => {
        const requestParameters = Object.assign({}, parameter, this.queryParam)
        return getAction(forumCommentApi.get, requestParameters).then(res => {
          this.totalNum = res.data.totalCount
          return res.data
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
        this.queryParam.article_id = undefined
        this.$refs.table.refresh(true)
        return
      }
      this.queryParam.article_id = articleId
      this.$refs.table.refresh(true)
    },
    openAuditDrawer (record) {
      this.auditRecord = { ...record }
      this.auditArticle = {
        id: record.article_id,
        title: record.article_title
      }
      this.auditRemark = record.reject_reason || ''
      this.auditDrawerVisible = true
      this.loadArticleDetail(record.article_id)
    },
    closeAuditDrawer () {
      if (this.auditSubmitting) {
        return
      }
      this.auditDrawerVisible = false
      this.auditRecord = null
      this.auditArticle = {}
      this.auditRemark = ''
      this.auditTargetStatus = 0
    },
    loadArticleDetail (articleId) {
      this.auditDrawerLoading = true
      getAction(forumArticleApi.getOneById(articleId)).then(res => {
        this.auditArticle = { ...(res.data || {}) }
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '查询文章详情失败')
      }).finally(() => {
        this.auditDrawerLoading = false
      })
    },
    submitAudit (auditStatus) {
      if (!this.auditRecord || this.auditSubmitting) {
        return
      }
      this.auditSubmitting = true
      this.auditTargetStatus = auditStatus
      putAction(forumCommentApi.audit(this.auditRecord.id), {
        audit_status: auditStatus,
        reject_reason: this.auditRemark.trim() || undefined
      }).then(res => {
        this.$message.success(res.message || '审核完成')
        this.auditSubmitting = false
        this.closeAuditDrawer()
        this.$refs.table.refresh(true)
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '审核失败')
      }).finally(() => {
        this.auditSubmitting = false
      })
    },
    formatDate (text) {
      return text ? moment(new Date(text), 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss') : ''
    },
    formatArticleContent (html) {
      if (!html) return ''
      return html.replace(/src=["'](?!https?:\/\/|data:)([^"']+)["']/g, (_, src) => `src="${resolveFileUrl(src)}"`)
    },
    handleDelete (record) {
      deleteAction(forumCommentApi.deleteOneById(record.id)).then(res => {
        this.$message.success(res.message || '删除成功')
        this.$refs.table.refresh(true)
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '删除失败')
      })
    }
  }
}
</script>

<style lang="less" scoped>
.audit-drawer-body {
  padding-bottom: 8px;
}

.audit-section {
  margin-bottom: 26px;
}

.audit-section-title {
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid #fa8c16;
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
  color: #262626;
}

.comment-detail-card,
.article-detail-card {
  padding: 16px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.comment-detail-meta,
.article-detail-meta,
.audit-status-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.comment-detail-meta,
.article-detail-meta {
  margin-bottom: 12px;
  font-size: 12px;
  color: #8c8c8c;
}

.comment-detail-content {
  font-size: 14px;
  line-height: 24px;
  color: #262626;
  white-space: pre-wrap;
  word-break: break-all;
}

.article-detail-title {
  margin-bottom: 10px;
  font-size: 17px;
  font-weight: 600;
  line-height: 25px;
  color: #262626;
}

.article-detail-summary {
  margin-bottom: 14px;
  padding: 10px 12px;
  background: #fff;
  border-radius: 6px;
  font-size: 13px;
  line-height: 21px;
  color: #595959;
}

.article-detail-content {
  max-height: 300px;
  overflow-y: auto;
  padding-top: 14px;
  border-top: 1px solid #eeeeee;
  font-size: 14px;
  line-height: 23px;
  color: #262626;
  word-break: break-all;

  ::v-deep img {
    max-width: 100%;
  }
}

.audit-time {
  font-size: 12px;
  color: #8c8c8c;
}

.audit-remark-label {
  margin: 16px 0 8px;
  font-size: 13px;
  font-weight: 500;
  color: #595959;
}

.audit-drawer-footer {
  position: sticky;
  bottom: -24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin: 12px -24px -24px;
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

.audit-action-button {
  min-width: 104px;
  height: 38px;
}
</style>
