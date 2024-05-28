<template>
  <a-modal
    :maskClosable="false"
    :title="viewType === 'edit' ? '编辑标签' : '新建标签'"
    :width="840"
    :visible="visible"
    :confirmLoading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
    class="tag-form"
  >
    <a-spin :spinning="loading">
      <a-form-model ref="RuleForm" :model="form" v-bind="formLayout" :rules="rules">
        <!-- 检查是否有 id 并且大于0，大于0是修改。其他是新增，新增不显示主键ID -->
<!--        <a-form-model-item v-show="model && model.id > 0" label="主键ID" prop="id">-->
<!--          <a-input v-model="form.id" disabled />-->
<!--        </a-form-model-item>-->
        <a-form-model-item label="标签名称" required prop="title">
          <a-input  v-model="form.title" placeholder="请输入标签名称" />
        </a-form-model-item>
        <a-form-model-item label="父级" required prop="parent_id">
          <a-cascader :disabled="viewType === 'edit'" change-on-select v-model="form.parent_id" :options="dataSource" @change="onChange"  placeholder="请选择父级" />
          <div v-if="form.parent_id.length === 1 && viewType === 'add'" style="color: #096dd9;line-height: 1.5">只选择"根级别"表示无父级，则将创建第一级标签</div>
        </a-form-model-item>
        <a-form-model-item label="层级" required prop="level" v-show="form.parent_id.length">
          <a-select v-model="form.level" placeholder="请选择" disabled>
            <a-select-option :value="1">第一级（复健类型）</a-select-option>
            <a-select-option :value="2">第二级（部位）</a-select-option>
            <a-select-option :value="3">第三级（问题）</a-select-option>
            <a-select-option :value="4">第四级（阶段）</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="优先级" required prop="priority">
          <a-input-number v-model="form.priority" style="width: 100%" :precision="0" :min="0" :step="1" placeholder="请输入优先级" required prop="priority" />
          <div style="color: #096dd9;line-height: 1.5">优先级：数字越<span style="color: #E97343">小</span>，优先级越<span style="color: #E97343">高</span>，即显示越靠<span style="color: #E97343">前</span>。</div>
          <div style="color: #096dd9;line-height: 1.5">现在只有第三级（问题）可以多选，因此只有第三级的该值有意义。</div>
        </a-form-model-item>
        <a-form-model-item label="状态" required prop="status">
          <a-select v-model="form.status" placeholder="请选择">
            <a-select-option :value="1">正常</a-select-option>
            <a-select-option :value="0">禁用</a-select-option>
          </a-select>
          <div style="color: #096dd9;line-height: 1.5">禁用状态表示前端用户无法使用该标签及其子标签进行检索。</div>
        </a-form-model-item>
        <!--        <a-form-item label="cover" v-show="false">
                  <a-input v-decorator="['cover', { initialValue: '' }]" disabled />
                </a-form-item>-->
      </a-form-model>
    </a-spin>
  </a-modal>
</template>

<script>
import pick from 'lodash.pick'
import { Modal } from 'ant-design-vue';

// 表单字段
const fields = ['id', 'title', 'parent_id', 'level', 'priority', 'status']

import { getAction, postAction, putAction, uploadAction } from "@/utils/manage";
import { prescriptionTagApi } from "@/service/api";

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
        title: [{required: true, min: 1, max: 14, message: '请输入1-14个字符的标签名称'}],
        parent_id: [{required: true, trigger: 'change', message: '请选择父级'}],
        priority: [{required: true, message: '请输入优先级'}],
        status: [{required: true, trigger: 'change', message: '请选择状态'}],
        level: [{required: true, trigger: 'change', message: '请选择层级'}]
      },
      form: {
        id: '',
        title: '',
        parent_id: [],
        priority: 0,
        level: 1,
        status: 1
      },
      fileList: [],
      fileListImg: [],
      uploading: false,
      videoUrl: '',
      coverUrl: '',
      coverBlob: null,
      baseUrl: process.env.VUE_APP_API_BASE_URL + '/',
      cdnUrl: process.env.VUE_APP_CDN_BASE_URL + '/',
      id: '',
      dataList: [],
      dataSource: [],
      loading: false,
      viewType: 'add'
    }
  },
  created () {
    console.log('custom modal created')

    this.loading = true
  },
  methods: {
    getData(id){

      if (id) {
        this.viewType = 'edit'
      }

      getAction(prescriptionTagApi.getAll)
        .then(res => {
          const data = res.data;
          console.log('data', data)
          let dataSourceGet = [
            {
              id: '0',
              title: '根级别',
              value: '0',
              label: '根级别',
              children: []
            }
          ];
          this.dataList = data.map(i => {
            return {
              ...i,
              value: i.id,
              label: i.title
            }
          })

          data.forEach((item, index) => {
            if (item.parent_id === '0'){
              console.log('dataSourceGet', dataSourceGet)
              dataSourceGet[0].children.push({
                ...item,
                value: item.id,
                label: item.title,
                children: []
              })
            }
          })

          data.forEach((item, index) => {
            if (item.level === 2){
              const indexFind = dataSourceGet[0].children.findIndex(i => i.id === item.parent_id);
              dataSourceGet[0].children[indexFind].children.push({
                ...item,
                value: item.id,
                label: item.title,
                children: []
              })
            }
          })

          data.forEach((item, index) => {
            if (item.level === 3){
              let indexFind = 0;
              let indexFind1 = 0;
              dataSourceGet[0].children.forEach((itemIn, indexIn) => {
                itemIn.children.forEach((itemInner, indexInner) => {
                  if (itemInner.id === item.parent_id){
                    indexFind = indexIn;
                    indexFind1 = indexInner;
                  }
                })
              })
              dataSourceGet[0].children[indexFind].children[indexFind1].children.push({
                ...item,
                value: item.id,
                label: item.title,
                children: []
              })
            }
          })

          this.dataSource = [...dataSourceGet]

          if (id){

            getAction(prescriptionTagApi.getOneById(id))
              .then(resIn => {
                const data = resIn.data;
                this.form.id = data.id;
                this.form.title = data.title;
                this.form.level = data.level;
                this.form.status = data.status;
                this.form.priority = data.priority;

                if (data.level === 1){
                  this.form.parent_id = ['0']
                }else if (data.level === 2){
                  this.form.parent_id = ['0', data.parent_id]
                }else if (data.level === 3){
                  const parent1 = this.dataList.find(i => i.id === data.parent_id).parent_id;
                  this.form.parent_id = ['0', parent1, data.parent_id]
                }else if (data.level === 4){
                  const parent1 = this.dataList.find(i => i.id === data.parent_id).parent_id;
                  const parent2 = this.dataList.find(i => i.id === parent1).parent_id;
                  this.form.parent_id = ['0', parent2, parent1, data.parent_id]
                }

                this.loading = false;
              })
          }else{
            this.loading = false;
          }

        }).finally(() => {

      });
    },
    handleOk(){
      const that = this
      that.handleOkSubmit()
    },
    handleOkSubmit(){
      this.$refs.RuleForm.validate(value => {
        console.log('value', value, this.form)
        if (value){
          this.loading = true;

          if (this.viewType === 'add'){
            const formSubmit = {
              title: this.form.title,
              parent_id: this.form.parent_id[this.form.parent_id.length - 1],
              level: this.form.level,
              priority: this.form.priority,
              status: this.form.status
            }
            postAction(prescriptionTagApi.create, formSubmit)
              .then(res => {
                if (res.code === 200) {
                  this.$message.success(res.message)
                  this.$emit('ok')
                }
              }).finally(()=>{
              this.loading = false
            })
          }else{
            const formSubmit = {
              id: this.form.id,
              title: this.form.title,
              parent_id: this.form.parent_id[this.form.parent_id.length - 1],
              level: this.form.level,
              priority: this.form.priority,
              status: this.form.status
            }
            putAction(prescriptionTagApi.update, formSubmit)
              .then(res => {
                if (res.code === 200) {
                  this.$message.success(res.message)
                  this.$emit('ok')
                }
              }).finally(()=>{
              this.loading = false
            })
          }

        } else {
          console.log('error submit!!');
          return false;
        }
      })
    },
    handleCancel(){
      this.$emit('cancel')
    },
    onChange(value) {
      console.log(value);
      this.form.level = value.length;
    },
    reset(){
      const form = this.$refs.RuleForm;
      form.resetFields(); // 清理表单数据（可不做）
      this.form.status = 1;
      this.form.level = 1;
      this.form.id = ''
    }
  }
}
</script>

<!--<style lang="less" scoped>-->
<!--.tag-form{-->

<!--  ::v-deep .ant-cascader-picker-disabled .ant-cascader-picker-label{-->
<!--    color: rgba(0, 0, 0, 0.65) !important;-->
<!--  }-->

<!--  ::v-deep .ant-select-disabled .ant-select-selection-selected-value{-->
<!--    color: rgba(0, 0, 0, 0.65) !important;-->
<!--  }-->
<!--}-->
<!--</style>-->
