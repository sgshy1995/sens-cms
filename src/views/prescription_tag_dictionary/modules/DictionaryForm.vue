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
            <a-form-model-item label="优先级" prop="priority">
              <a-input-number
                v-model="form.priority"
                style="width: 100%"
                :precision="0"
                :min="0"
                :step="1"
                placeholder="请输入优先级"
              />
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
