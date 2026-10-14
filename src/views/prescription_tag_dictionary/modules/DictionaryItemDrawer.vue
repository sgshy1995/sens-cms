<template>
  <a-drawer
    placement="right"
    :width="760"
    :visible="visible"
    :mask-closable="false"
    :closable="true"
    :title="`字典项配置 - ${dictionary.name || ''}`"
    @close="handleCancel"
  >
    <div class="drawer-wrap">
      <div class="drawer-body">
        <div class="table-operator">
          <a-button type="primary" icon="plus" @click="handleAdd">新增字典项</a-button>
        </div>
        <a-table
          row-key="id"
          :columns="columns"
          :data-source="items"
          :loading="loading"
          :pagination="{ pageSize: 8, showSizeChanger: true }"
          :scroll="{ x: 720 }"
        >
          <span slot="status" slot-scope="text">
            <a-tag :color="text === 1 ? 'green' : 'red'">
              {{ text === 1 ? '正常' : '禁用' }}
            </a-tag>
          </span>
          <span slot="action" slot-scope="text, record">
            <a @click="handleEdit(record)">编辑</a>
            <a-divider type="vertical" />
            <a-popconfirm title="确定删除该字典项吗？" ok-text="确定" cancel-text="取消" @confirm="handleDelete(record)">
              <a style="color: #F56C6E">删除</a>
            </a-popconfirm>
          </span>
        </a-table>
      </div>
      <div class="drawer-footer">
        <a-button @click="handleCancel">关闭</a-button>
      </div>

      <a-modal
        :title="itemForm.id ? '编辑字典项' : '新增字典项'"
        :visible="itemVisible"
        :confirm-loading="itemLoading"
        ok-text="确定"
        cancel-text="取消"
        @ok="handleItemOk"
        @cancel="itemVisible = false"
      >
        <a-form-model ref="ItemForm" :model="itemForm" :rules="itemRules" :label-col="{ span: 5 }" :wrapper-col="{ span: 17 }">
          <a-form-model-item label="Value" prop="value">
            <a-input v-model="itemForm.value" placeholder="请输入字典项 Value" />
          </a-form-model-item>
          <a-form-model-item label="名称" prop="name">
            <a-input v-model="itemForm.name" placeholder="请输入字典项名称" />
          </a-form-model-item>
          <a-form-model-item label="优先级" prop="priority">
            <a-input-number v-model="itemForm.priority" style="width: 100%" :precision="0" :min="0" :step="1" />
          </a-form-model-item>
          <a-form-model-item label="状态" prop="status">
            <a-select v-model="itemForm.status">
              <a-select-option :value="1">正常</a-select-option>
              <a-select-option :value="0">禁用</a-select-option>
            </a-select>
          </a-form-model-item>
        </a-form-model>
      </a-modal>
    </div>
  </a-drawer>
</template>

<script>
import { deleteAction, getAction, postAction, putAction } from '@/utils/manage'
import { prescriptionTagDictionaryItemApi } from '@/service/api'

const columns = [
  { title: 'Value', dataIndex: 'value', width: '180px', ellipsis: true },
  { title: '名称', dataIndex: 'name', width: '180px', ellipsis: true },
  { title: '优先级', dataIndex: 'priority', width: '100px' },
  { title: '状态', dataIndex: 'status', width: '100px', scopedSlots: { customRender: 'status' } },
  { title: '操作', width: '140px', fixed: 'right', scopedSlots: { customRender: 'action' } }
]

export default {
  props: {
    visible: {
      type: Boolean,
      required: true
    }
  },
  data () {
    this.columns = columns
    return {
      dictionary: {},
      items: [],
      loading: false,
      itemVisible: false,
      itemLoading: false,
      itemRules: {
        value: [{ required: true, min: 1, max: 64, message: '请输入1-64个字符的 Value' }],
        name: [{ required: true, min: 1, max: 64, message: '请输入1-64个字符的名称' }],
        priority: [{ required: true, message: '请输入优先级' }],
        status: [{ required: true, trigger: 'change', message: '请选择状态' }]
      },
      itemForm: this.defaultItemForm()
    }
  },
  methods: {
    defaultItemForm () {
      return {
        id: '',
        value: '',
        name: '',
        priority: 0,
        status: 1
      }
    },
    open (dictionary) {
      this.dictionary = { ...dictionary }
      this.loadItems()
    },
    loadItems () {
      if (!this.dictionary.id) return
      this.loading = true
      getAction(prescriptionTagDictionaryItemApi.getCustom, {
        dictionary_id: this.dictionary.id
      }).then(res => {
        this.items = res.data || []
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '查询失败')
      }).finally(() => {
        this.loading = false
      })
    },
    handleAdd () {
      this.itemForm = this.defaultItemForm()
      this.itemVisible = true
      this.$nextTick(() => {
        this.$refs.ItemForm && this.$refs.ItemForm.clearValidate()
      })
    },
    handleEdit (record) {
      this.itemForm = {
        id: record.id,
        value: record.value,
        name: record.name,
        priority: record.priority,
        status: record.status
      }
      this.itemVisible = true
      this.$nextTick(() => {
        this.$refs.ItemForm && this.$refs.ItemForm.clearValidate()
      })
    },
    handleItemOk () {
      this.$refs.ItemForm.validate(valid => {
        if (!valid) return
        this.itemLoading = true
        const payload = {
          dictionary_id: this.dictionary.id,
          value: this.itemForm.value,
          name: this.itemForm.name,
          priority: this.itemForm.priority,
          status: this.itemForm.status
        }
        const request = this.itemForm.id
          ? putAction(prescriptionTagDictionaryItemApi.update, { id: this.itemForm.id, ...payload })
          : postAction(prescriptionTagDictionaryItemApi.create, payload)
        request.then(res => {
          this.$message.success(res.message || '操作成功')
          this.itemVisible = false
          this.loadItems()
          this.$emit('ok')
        }).catch(err => {
          this.$message.error((err.data && err.data.message) || '操作失败')
        }).finally(() => {
          this.itemLoading = false
        })
      })
    },
    handleDelete (record) {
      deleteAction(prescriptionTagDictionaryItemApi.deleteOneById(record.id)).then(res => {
        this.$message.success(res.message || '删除成功')
        this.loadItems()
        this.$emit('ok')
      }).catch(err => {
        this.$message.error((err.data && err.data.message) || '删除失败')
      })
    },
    handleCancel () {
      this.$emit('cancel')
    }
  }
}
</script>
