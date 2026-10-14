<template>
  <a-drawer
    placement="right"
    :width="640"
    :visible="visible"
    :mask-closable="false"
    :closable="true"
    :title="form.id ? '编辑标签' : '新建标签'"
    @close="handleCancel"
  >
    <div class="drawer-wrap">
      <div class="drawer-body">
        <a-spin :spinning="loading">
          <a-form-model ref="RuleForm" :model="form" v-bind="formLayout" :rules="rules">
            <a-form-model-item label="标签名称" prop="title">
              <a-input v-model="form.title" placeholder="请输入标签名称" />
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
              <div style="color: #096dd9;line-height: 1.5">数字越小，标签展示越靠前。</div>
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
import { prescriptionTagApi } from '@/service/api'

export default {
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    model: {
      type: Object,
      default: () => null
    }
  },
  data () {
    this.formLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 7 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 13 }
      }
    }
    return {
      rules: {
        title: [{ required: true, min: 1, max: 14, message: '请输入1-14个字符的标签名称' }],
        priority: [{ required: true, message: '请输入优先级' }],
        status: [{ required: true, trigger: 'change', message: '请选择状态' }]
      },
      form: {
        id: '',
        title: '',
        priority: 0,
        status: 1
      },
      loading: false
    }
  },
  methods: {
    reset () {
      this.loading = false
      this.form = {
        id: '',
        title: '',
        priority: 0,
        status: 1
      }
      this.$nextTick(() => {
        this.$refs.RuleForm && this.$refs.RuleForm.clearValidate()
      })
    },
    edit (record) {
      this.form = {
        id: record.id,
        title: record.title,
        priority: record.priority,
        status: record.status
      }
      this.$nextTick(() => {
        this.$refs.RuleForm && this.$refs.RuleForm.clearValidate()
      })
    },
    handleOk () {
      this.$refs.RuleForm.validate(valid => {
        if (!valid) return
        this.loading = true
        const payload = {
          title: this.form.title,
          priority: this.form.priority,
          status: this.form.status
        }
        const request = this.form.id
          ? putAction(prescriptionTagApi.update, { id: this.form.id, ...payload })
          : postAction(prescriptionTagApi.create, payload)
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
