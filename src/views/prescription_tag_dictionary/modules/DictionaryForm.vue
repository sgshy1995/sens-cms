<template>
  <a-drawer
    placement="right"
    :width="640"
    :visible="visible"
    :mask-closable="false"
    :closable="true"
    :title="form.id ? '编辑字典' : '新建字典'"
    @close="handleCancel"
  >
    <div class="drawer-wrap">
      <div class="drawer-body">
        <a-spin :spinning="loading">
          <a-form-model ref="RuleForm" :model="form" v-bind="formLayout" :rules="rules">
            <a-form-model-item label="处方标签" prop="prescription_tag_id">
              <a-select
                v-model="form.prescription_tag_id"
                show-search
                option-filter-prop="children"
                placeholder="请选择处方标签"
              >
                <a-select-option v-for="tag in tags" :key="tag.id" :value="tag.id">
                  {{ tag.title }}
                </a-select-option>
              </a-select>
            </a-form-model-item>
            <a-form-model-item label="字典 Code" prop="code">
              <a-input v-model="form.code" placeholder="请输入字典 Code" />
            </a-form-model-item>
            <a-form-model-item label="字典名称" prop="name">
              <a-input v-model="form.name" placeholder="请输入字典名称" />
            </a-form-model-item>
            <a-form-model-item label="筛选类型" prop="filter_mode">
              <a-radio-group v-model="form.filter_mode">
                <a-radio value="decrease">
                  <span class="filter-mode-decrease">
                    <a-icon type="arrow-down" />
                    <span>筛选数据递减类</span>
                  </span>
                </a-radio>
                <a-radio value="increase">
                  <span class="filter-mode-increase">
                    <a-icon type="arrow-up" />
                    <span>筛选数据递增类</span>
                  </span>
                </a-radio>
              </a-radio-group>
            </a-form-model-item>
            <a-form-model-item label="选择方式" prop="selection_mode">
              <a-radio-group v-model="form.selection_mode">
                <a-radio value="single">单选</a-radio>
                <a-radio value="multiple">多选</a-radio>
              </a-radio-group>
              <div class="field-help">
                单选时该分类最多选择一个字典项；多选时该分类可以选择多个字典项。
              </div>
            </a-form-model-item>
            <a-form-model-item label="数据权重" prop="data_weight">
              <a-input-number
                v-model="form.data_weight"
                style="width: 100%"
                :precision="0"
                :min="0"
                :step="1"
                placeholder="同一康复标签下权重必须唯一"
              />
              <div class="field-help">
                用于方案内容排序：同一康复标签下必须唯一，数值越大，所属分类在方案中越靠前。
              </div>
            </a-form-model-item>
            <a-form-model-item label="优先级" prop="priority">
              <a-input-number
                v-model="form.priority"
                style="width: 100%"
                :precision="0"
                :min="0"
                :step="1"
                placeholder="请输入优先级"
              />
              <div class="field-help">
                仅用于 CMS 分类列表展示排序：数值越小越靠前，不参与方案内容排序。
              </div>
            </a-form-model-item>
            <a-form-model-item label="状态" prop="status">
              <a-select v-model="form.status" placeholder="请选择">
                <a-select-option :value="1">正常</a-select-option>
                <a-select-option :value="0">禁用</a-select-option>
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
import { postAction, putAction } from '@/utils/manage'
import { prescriptionTagDictionaryApi } from '@/service/api'

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
    tags: {
      type: Array,
      default: () => []
    }
  },
  data () {
    this.formLayout = {
      labelCol: { xs: { span: 24 }, sm: { span: 6 } },
      wrapperCol: { xs: { span: 24 }, sm: { span: 15 } }
    }
    return {
      rules: {
        prescription_tag_id: [{ required: true, trigger: 'change', message: '请选择处方标签' }],
        code: [{ required: true, min: 1, max: 64, message: '请输入1-64个字符的字典 Code' }],
        name: [{ required: true, min: 1, max: 64, message: '请输入1-64个字符的字典名称' }],
        filter_mode: [{ required: true, trigger: 'change', message: '请选择筛选类型' }],
        selection_mode: [{ required: true, trigger: 'change', message: '请选择字典分类选择方式' }],
        data_weight: [{ required: true, message: '请输入数据权重' }],
        priority: [{ required: true, message: '请输入优先级' }],
        status: [{ required: true, trigger: 'change', message: '请选择状态' }]
      },
      form: this.defaultForm(),
      loading: false
    }
  },
  methods: {
    defaultForm () {
      return {
        id: '',
        prescription_tag_id: undefined,
        code: '',
        name: '',
        filter_mode: 'decrease',
        selection_mode: 'single',
        data_weight: 0,
        priority: 0,
        status: 1
      }
    },
    open (record) {
      this.form = record ? {
        id: record.id,
        prescription_tag_id: record.prescription_tag_id,
        code: record.code,
        name: record.name,
        filter_mode: record.filter_mode,
        selection_mode: record.selection_mode || 'single',
        data_weight: record.data_weight,
        priority: record.priority,
        status: record.status
      } : this.defaultForm()
      this.loading = false
      this.$nextTick(() => {
        this.$refs.RuleForm && this.$refs.RuleForm.clearValidate()
      })
    },
    handleOk () {
      this.$refs.RuleForm.validate(valid => {
        if (!valid) return
        this.loading = true
        const payload = {
          prescription_tag_id: this.form.prescription_tag_id,
          code: this.form.code,
          name: this.form.name,
          filter_mode: this.form.filter_mode,
          selection_mode: this.form.selection_mode,
          data_weight: this.form.data_weight,
          priority: this.form.priority,
          status: this.form.status
        }
        const request = this.form.id
          ? putAction(prescriptionTagDictionaryApi.update, { id: this.form.id, ...payload })
          : postAction(prescriptionTagDictionaryApi.create, payload)
        request.then(res => {
          this.$message.success(res.message || '操作成功')
          this.$emit('ok')
        }).catch(err => {
          this.$message.error((err.data && err.data.message) || '操作失败')
        }).finally(() => {
          this.loading = false
        })
      })
    },
    handleCancel () {
      this.$emit('cancel')
    }
  }
}
</script>

<style lang="less" scoped>
.field-help {
  margin-top: 6px;
  color: #8c8c8c;
  font-size: 12px;
  line-height: 18px;
}

.filter-mode-decrease,
.filter-mode-increase {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.filter-mode-decrease {
  color: #f5222d;
}

.filter-mode-increase {
  color: #52c41a;
}
</style>
