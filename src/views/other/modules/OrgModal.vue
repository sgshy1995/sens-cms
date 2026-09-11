<template>
  <a-drawer
    placement="right"
    :width="560"
    title="操作"
    :visible="visible"
    :mask-closable="false"
    :closable="true"
    @close="handleCancel"
  >
    <div class="drawer-wrap">
      <div class="drawer-body">
        <a-spin :spinning="confirmLoading">
          <a-form :form="form">

            <a-form-item
              label="父级ID"
            >
              <a-input v-decorator="['parentId', {}]" disabled />
            </a-form-item>

            <a-form-item
              label="机构名称"
            >
              <a-input v-decorator="['orgName', {}]" />
            </a-form-item>
          </a-form>
        </a-spin>
      </div>

      <div class="drawer-footer">
        <a-button @click="handleCancel">取消</a-button>
        <a-button type="primary" :loading="confirmLoading" @click="handleOk">确定</a-button>
      </div>
    </div>

  </a-drawer>
</template>

<script>
export default {
  name: 'OrgModal',
  data () {
    return {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 5 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      },
      visible: false,
      confirmLoading: false,
      mdl: {}
    }
  },
  beforeCreate () {
    this.form = this.$form.createForm(this)
    console.log('form::', this.form)
  },
  created () {

  },
  methods: {
    add (id) {
      this.edit({ parentId: id })
    },
    edit (record) {
      this.mdl = Object.assign({}, record)
      this.visible = true
      this.$nextTick(() => {
        this.form.setFieldsValue({ ...record })
      })
    },
    close () {
      this.$emit('close')
      this.visible = false
    },
    handleOk () {
      const _this = this
      // 触发表单验证
      this.form.validateFields((err, values) => {
        // 验证表单没错误
        if (!err) {
          console.log('form values', values)

          _this.confirmLoading = true
          // 模拟后端请求 2000 毫秒延迟
          new Promise((resolve) => {
            setTimeout(() => resolve(), 2000)
          }).then(() => {
            // Do something
            _this.$message.success('保存成功')
            _this.$emit('ok')
          }).catch(() => {
            // Do something
          }).finally(() => {
            _this.confirmLoading = false
            _this.close()
          })
        }
      })
    },
    handleCancel () {
      this.close()
    }

  }
}
</script>
