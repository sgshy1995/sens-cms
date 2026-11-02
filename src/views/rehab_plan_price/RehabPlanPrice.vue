<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="price-header">
        <div>
          <div class="price-title">方案价格</div>
          <div class="price-tip">所有动态生成的康复方案当前统一使用此价格。</div>
        </div>
        <div v-if="!editing">
          <a-button type="primary" icon="edit" @click="beginEdit">编辑</a-button>
        </div>
        <div v-else class="header-actions">
          <a-button @click="cancelEdit">取消</a-button>
          <a-button type="primary" :loading="saving" @click="handleSave">保存</a-button>
        </div>
      </div>

      <a-spin :spinning="loading">
        <div v-if="!editing" class="price-info">
          <div class="info-row">
            <span class="info-label">方案价格</span>
            <span class="info-value price-value">￥{{ form.price }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">是否折扣</span>
            <span class="info-value">{{ form.is_discount ? '是' : '否' }}</span>
          </div>
          <div v-if="form.is_discount" class="info-row">
            <span class="info-label">折扣价</span>
            <span class="info-value price-value">￥{{ form.discount_price }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">状态</span>
            <span class="info-value">
              <a-tag :color="form.status === 1 ? 'green' : 'red'">
                {{ form.status === 1 ? '启用' : '停用' }}
              </a-tag>
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">更新时间</span>
            <span class="info-value">{{ formatTime(updatedAt) }}</span>
          </div>
        </div>

        <a-form-model v-else ref="RuleForm" :model="form" :rules="rules" :label-col="{ span: 5 }" :wrapper-col="{ span: 12 }">
          <a-form-model-item label="方案价格" prop="price">
            <a-input v-model="form.price" addon-before="￥" placeholder="请输入方案价格，最多两位小数" />
          </a-form-model-item>
          <a-form-model-item label="是否折扣" prop="is_discount">
            <a-switch v-model="form.is_discount" :checked-children="'是'" :un-checked-children="'否'" />
          </a-form-model-item>
          <a-form-model-item v-if="form.is_discount" label="折扣价" prop="discount_price">
            <a-input v-model="form.discount_price" addon-before="￥" placeholder="请输入折扣价，最多两位小数" />
          </a-form-model-item>
          <a-form-model-item label="状态" prop="status">
            <a-select v-model="form.status">
              <a-select-option :value="1">启用</a-select-option>
              <a-select-option :value="0">停用</a-select-option>
            </a-select>
          </a-form-model-item>
        </a-form-model>
      </a-spin>
    </a-card>
  </page-header-wrapper>
</template>

<script>
import moment from 'moment'
import { getAction, putAction } from '@/utils/manage'
import { rehabPlanPriceApi } from '@/service/api'

export default {
  name: 'RehabPlanPrice',
  data () {
    const validatePrice = (rule, value, callback) => {
      if (!/^\d+(\.\d{1,2})?$/.test(String(value || '').trim())) {
        callback(new Error('价格格式不正确，最多两位小数'))
        return
      }
      callback()
    }
    return {
      loading: false,
      saving: false,
      editing: false,
      updatedAt: '',
      snapshot: null,
      form: {
        price: '0.00',
        is_discount: false,
        discount_price: '',
        status: 1
      },
      rules: {
        price: [{ required: true, validator: validatePrice, trigger: 'change' }],
        discount_price: [{
          validator: (rule, value, callback) => {
            if (!this.form.is_discount) {
              callback()
              return
            }
            validatePrice(rule, value, callback)
          },
          trigger: 'change'
        }]
      }
    }
  },
  created () {
    this.loadData()
  },
  methods: {
    loadData () {
      this.loading = true
      getAction(rehabPlanPriceApi.get).then(res => {
        const data = res.data || {}
        this.form = {
          price: data.price ? Number(data.price).toFixed(2) : '0.00',
          is_discount: data.is_discount === 1,
          discount_price: data.discount_price ? Number(data.discount_price).toFixed(2) : '',
          status: data.status === 0 ? 0 : 1
        }
        this.updatedAt = data.updated_at || ''
        this.snapshot = { ...this.form }
        this.editing = false
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '价格加载失败')
      }).finally(() => {
        this.loading = false
      })
    },
    beginEdit () {
      this.snapshot = { ...this.form }
      this.editing = true
      this.$nextTick(() => {
        this.$refs.RuleForm && this.$refs.RuleForm.clearValidate()
      })
    },
    cancelEdit () {
      if (this.snapshot) {
        this.form = { ...this.snapshot }
      }
      this.editing = false
    },
    formatTime (value) {
      return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    handleSave () {
      this.$refs.RuleForm.validate(valid => {
        if (!valid) return
        if (this.form.is_discount && Number(this.form.discount_price) > Number(this.form.price)) {
          this.$message.error('折扣价不能高于方案价格')
          return
        }
        this.saving = true
        putAction(rehabPlanPriceApi.update, {
          price: this.form.price,
          is_discount: this.form.is_discount ? 1 : 0,
          discount_price: this.form.is_discount ? this.form.discount_price : null,
          status: this.form.status
        }).then(res => {
          this.$message.success(res.message || '保存成功')
          this.editing = false
          this.loadData()
        }).catch(err => {
          this.$message.error((err.data && err.data.message) || '保存失败')
        }).finally(() => {
          this.saving = false
        })
      })
    }
  }
}
</script>

<style lang="less" scoped>
.price-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
}

.price-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2329;
}

.price-tip {
  margin-top: 6px;
  color: #8c8c8c;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.price-info {
  max-width: 760px;
  padding: 4px 24px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}

.info-row {
  display: flex;
  min-height: 54px;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  width: 140px;
  flex: 0 0 140px;
  color: #8c8c8c;
}

.info-value {
  flex: 1;
  color: #1f2329;
  font-weight: 500;
}

.price-value {
  font-size: 18px;
  font-weight: 600;
  color: #ff6b35;
}
</style>
