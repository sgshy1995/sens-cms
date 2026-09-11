<template>
  <a-drawer
    placement="right"
    :width="760"
    :visible="visible"
    :mask-closable="false"
    :closable="true"
    title="文章审核"
    @close="handleCancel"
  >
    <div class="drawer-wrap">
      <div class="drawer-body">
        <a-spin :spinning="loading">
          <a-empty v-if="!model.id" description="未查询到信息" />
          <template v-else>
            <div class="audit-content">
              <div class="audit-row">
                <span class="label">标题：</span>
                <span class="value">{{ model.title }}</span>
              </div>
              <div class="audit-row">
                <span class="label">作者：</span>
                <span class="value">{{ model.name }}</span>
              </div>
              <div class="audit-row">
                <span class="label">摘要：</span>
                <span class="value">{{ model.summary || '-' }}</span>
              </div>
              <div class="audit-row">
                <span class="label">康复标签：</span>
                <span class="value">{{ model.tag_name || '-' }}</span>
              </div>
              <div class="audit-row" v-if="model.cover">
                <span class="label">封面：</span>
                <img class="audit-cover" :src="resolveCover(model.cover)" alt="cover">
              </div>
              <div class="audit-row" v-if="model.audit_status === 2 && model.reject_reason">
                <span class="label" style="color: #F56C6E">驳回原因：</span>
                <span class="value" style="color: #F56C6E">{{ model.reject_reason }}</span>
              </div>
              <div class="audit-row audit-content-body">
                <div class="label">内容：</div>
                <div class="value rich-text-body" v-html="formatContent(model.content)"></div>
              </div>
            </div>
          </template>
        </a-spin>
        <div class="preview-area" v-if="model.id">
          <div class="preview-area-title">实时预览区域</div>
          <div class="phone-wrap">
            <div class="phone">
              <div class="phone-screen">
                <div class="phone-scroll">
                  <img v-if="model.cover" class="phone-cover" :src="resolveCover(model.cover)" alt="cover">
                  <div class="phone-body">
                    <div class="phone-title">{{ model.title }}</div>
                    <div class="phone-summary" v-if="model.summary">{{ model.summary }}</div>
                    <div class="phone-content" v-if="model.content" v-html="formatContent(model.content)"></div>
                    <div class="phone-empty-text" v-else>暂无内容</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="drawer-footer" v-if="model.audit_status === 0">
        <a-textarea :rows="3" v-model="rejectReason" placeholder="请输入驳回原因（驳回时必填）" style="margin-bottom: 12px" />
        <a-button type="primary" :loading="loading" @click="handleAudit(1)">通过</a-button>
        <a-button type="danger" :loading="loading" @click="handleAudit(2)">驳回</a-button>
      </div>
    </div>

  </a-drawer>
</template>

<script>
import { forumArticleApi } from '@/service/api'
import { getAction, putAction } from '@/utils/manage'
import { resolveFileUrl } from '@/utils/util'

export default {
  name: 'ForumAuditModal',
  data () {
    return {
      visible: false,
      loading: false,
      model: {},
      rejectReason: ''
    }
  },
  methods: {
    show (record) {
      this.visible = true
      this.loading = true
      this.rejectReason = ''
      getAction(forumArticleApi.getOneById(record.id)).then(res => {
        this.model = { ...res.data }
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '查询文章失败')
      }).finally(() => {
        this.loading = false
      })
    },
    handleAudit (auditStatus) {
      if (auditStatus === 2 && !this.rejectReason) {
        this.$message.warning('驳回需填写原因')
        return
      }
      this.loading = true
      putAction(forumArticleApi.audit(this.model.id), {
        audit_status: auditStatus,
        reject_reason: auditStatus === 2 ? this.rejectReason : undefined
      }).then(res => {
        this.$message.success(res.message || '审核完成')
        this.handleCancel()
        this.$emit('ok')
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '审核失败')
      }).finally(() => {
        this.loading = false
      })
    },
    handleCancel () {
      this.visible = false
      this.model = {}
      this.rejectReason = ''
    },
    formatContent (html) {
      if (!html) return ''
      return html.replace(/src=["'](?!https?:\/\/|data:)([^"']+)["']/g, (_, src) => `src="${resolveFileUrl(src)}"`)
    },
    resolveCover (cover) {
      return resolveFileUrl(cover)
    }
  }
}
</script>

<style lang="less" scoped>
.audit-content {
  max-height: 520px;
  overflow-y: auto;
  padding-right: 8px;

  .audit-row {
    margin-bottom: 14px;

    .label {
      color: #888;
      display: inline-block;
      vertical-align: top;
    }

    .value {
      font-weight: bold;
      word-break: break-all;
    }
  }

  .audit-cover {
    max-width: 300px;
    border-radius: 6px;
  }

  .audit-content-body {
    .value {
      display: block;
      margin-top: 6px;
    }
  }
}

.rich-text-body {
  ::v-deep img {
    max-width: 100%;
  }
}

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
  color: #999;
}
</style>
