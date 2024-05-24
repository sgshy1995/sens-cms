<template>
  <a-modal
    title="处方标签检查结果"
    :width="840"
    :visible="visible"
    :confirmLoading="confirmLoading"
    @cancel="handleCancel"
    @close="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <div style="color: #E34745;margin-bottom: 12px">您当前要删除的标签为 <span style="font-weight: bold">{{ selectedItem.real_title }}</span></div>
      <div style="color: #E34745;margin-bottom: 12px">该标签已经绑定了 <span style="font-weight: bold">{{ totalNum }}</span> 个运动处方，请先将这些处方绑定至其他标签！</div>
      <a-form-model ref="RuleForm" :model="form" :rules="rules" layout="inline">
        <a-row :gutter="48">
          <a-col :md="24" :sm="24">
            <a-form-model-item label="处方标签" required prop="tag">
              <div style="display: flex;align-items: center;height: 40px">
                <a-cascader change-on-select style="width: 440px" v-model="form.tag" :options="dataTree" @change="onChange"  placeholder="请选择处方标签" />
                <a-button style="margin-left: 24px" type="primary" @click="handleConfirm">绑定</a-button>
              </div>
            </a-form-model-item>
          </a-col>
        </a-row>
      </a-form-model>
      <div style="width: 100%;height: 24px"></div>
      <s-table
        v-if="visible"
        ref="table"
        size="default"
        rowKey="id"
        :columns="columns"
        :data="loadData"
        :alert="options.alert"
        :rowSelection="options.rowSelection"
        :showPagination="true"
        :totalNum="totalNum"
        :scroll="{x: 1920}"
      >
        <span slot="serial" slot-scope="text, record, index">
          {{ index + 1 }}
        </span>
        <span slot="prescription_type" slot-scope="text, record, index">
          <a-icon v-if="text === 0" style="margin-right: 4px" type="file-text" />
          <a-icon v-if="text === 1" style="margin-right: 4px" type="video-camera" />
          <span>{{ text === 0 ? "文章" : "视频" }}</span>
        </span>

        <span slot="rehabilitation" slot-scope="text">
          {{ dataList.find(i => i.id === text) ? dataList.find(i => i.id === text).title : '' }}
        </span>

        <span slot="part" slot-scope="text">
          {{ dataList.find(i => i.id === text) ? dataList.find(i => i.id === text).title : '' }}
        </span>

        <span slot="symptoms" slot-scope="text">
          {{ dataList.find(i => i.id === text) ? dataList.find(i => i.id === text).title : '' }}
        </span>

        <span slot="phase" slot-scope="text">
          {{ dataList.find(i => i.id === text) ? dataList.find(i => i.id === text).title : '' }}
        </span>

        <span slot="status" slot-scope="text" style="font-weight: bold">
          <span class="text-item success" v-if="text === 1">
            <a-badge :status="text | statusTypeFilter" :text="text | statusFilter" />
          </span>
          <span class="text-item fail" v-else>
            <a-badge :status="text | statusTypeFilter" :text="text | statusFilter" />
          </span>
        </span>

        <span slot="description" slot-scope="text">
          <ellipsis :length="20" tooltip>{{ text }}</ellipsis>
        </span>

        <span slot="gist" slot-scope="text">
          <ellipsis :length="20" tooltip>{{ text }}</ellipsis>
        </span>
      </s-table>
    </a-spin>
    <template slot="footer">
      <a-button key="cancel" @click="handleCancel">取消</a-button>
    </template>
  </a-modal>
</template>

<script>
import pick from 'lodash.pick'
import { getAction, putAction } from "@/utils/manage";
import { equipmentApi, prescriptionApi, prescriptionTagApi } from "@/service/api";
import { Ellipsis, STable } from "@/components";
import moment from "moment/moment";

const stepForms = [
  ['name', 'desc'],
  ['target', 'template', 'type'],
  ['time', 'frequency']
]

const columns = [
  {
    title: "#",
    scopedSlots: { customRender: "serial" }
  },
  {
    title: "处方标题",
    dataIndex: "title"
  },
  {
    title: "处方类型",
    dataIndex: "prescription_type",
    needTotal: true,
    scopedSlots: { customRender: "prescription_type" }
  },
  {
    title: "处方描述",
    dataIndex: "description",
    scopedSlots: { customRender: "description" }
  },
  {
    title: "处方要点",
    dataIndex: "gist",
    scopedSlots: { customRender: "gist" }
  },
  {
    title: "观看人数",
    dataIndex: "watch_num"
  },
  {
    title: "难度",
    dataIndex: "difficulty"
  },
  {
    title: "处方时长",
    dataIndex: "time_length"
  },
  {
    title: "复健类型",
    dataIndex: "rehabilitation",
    scopedSlots: { customRender: "rehabilitation" }
  },
  {
    title: "部位",
    dataIndex: "part",
    scopedSlots: { customRender: "part" }
  },
  {
    title: "问题",
    dataIndex: "symptoms",
    scopedSlots: { customRender: "symptoms" }
  },
  {
    title: "阶段",
    dataIndex: "phase",
    scopedSlots: { customRender: "phase" }
  },
  {
    title: "优先级",
    dataIndex: "priority"
  },
  {
    title: "最近发布时间",
    dataIndex: "publish_time",
    customRender: (text) => text ? moment(new Date(text), "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss") : ""
  },
  {
    title: "状态",
    dataIndex: "status",
    scopedSlots: { customRender: "status" }
  }
];

const statusMap = {
  0: {
    status: "error",
    text: "已下线"
  },
  1: {
    status: "success",
    text: "已发布"
  }
};

export default {
  name: 'StepByStepModal',
  components: { STable, Ellipsis },
  props: {
    visible: {
      type: Boolean,
      required: true
    },
  },
  data () {
    this.columns = columns;
    return {
      totalNum: 0,
      labelCol: {
        xs: { span: 24 },
        sm: { span: 7 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 13 }
      },
      confirmLoading: false,
      currentStep: 0,
      mdl: {},
      form: {
        tag: []
      },
      rules: {
        tag: [{required: true, trigger: 'change', validator: this.handleValidate}],
      },
      queryParam: {
        tag: []
      },
      // 加载数据方法 必须为 Promise 对象
      loadData: parameter => {
        const requestParameters = Object.assign({}, parameter, this.queryParam);
        console.log("loadData request parameters:", requestParameters);
        // return getAction(prescriptionApi.get,requestParameters)
        //   .then(res => {
        //     this.totalNum = res.data.totalCount
        //     return res.data;
        //   }).finally(()=>{
        //     this.$refs.table.clearSelected();
        //   });
        return getAction(prescriptionApi.get, requestParameters).then(res => {
          this.totalNum = res.data.totalCount;
          if (!this.totalNum){
            this.$emit('cancel')
          }
          return res.data;
        }).finally(() => {
          this.$refs.table && this.$refs.table.clearSelected();
        });
      },
      options: {
        alert: {
          show: true, clear: () => {
            this.selectedRowKeys = [];
          }
        },
        rowSelection: {
          selectedRowKeys: this.selectedRowKeys,
          onChange: this.onSelectChange
        }
      },
      dataSource: [],
      dataTree: [],
      selectedRowKeys: [],
      selectedRows: [],
      prescriptionsList: [],
      dataList: [],
      dataListLabel: [],
      selectedItem: {}
    }
  },
  filters: {
    statusFilter(type) {
      return statusMap[type].text;
    },
    statusTypeFilter(type) {
      return statusMap[type].status;
    }
  },
  computed: {
    rowSelection() {
      return {
        selectedRowKeys: this.selectedRowKeys,
        onChange: this.onSelectChange
      };
    }
  },
  methods: {
    handleValidate(rule, value, callback){
      if (!value || !value.length){
        callback('请选择新的处方标签')
      }else{
        callback()
      }
    },
    onSelectChange(selectedRowKeys, selectedRows) {
      this.selectedRowKeys = selectedRowKeys;
      this.selectedRows = selectedRows;
    },
    handleConfirm() {
      this.$refs.RuleForm.validate(valid => {
        if (valid) {
          if (!this.selectedRowKeys.length) {
            this.$message.warning('请先选择要绑定的处方')
            return
          }
          this.confirmLoading = true;
          putAction(prescriptionApi.batchChangeTag, {
            ids: this.selectedRowKeys.join(),
            tag: {
              ...this.form
            }
          }).then((response) => {
            // 刷新表格
            this.$refs.table.refresh();
            this.$message.success(response.message || "操作成功");
            this.confirmLoading = false;
          }).catch(err => {
            this.$message.error((err.data && err.data.message) || "操作失败");
          });
        }
      })
    },
    onChange(value) {
      console.log(value);
      this.form.rehabilitation = value.length >= 1 ? value[0] : undefined;
      this.form.part = value.length >= 2 ? value[1] : undefined;
      this.form.symptoms = value.length >= 3 ? value[2] : undefined;
      this.form.phase = value.length >= 4 ? value[3] : undefined;
      this.$refs.RuleForm.validate()
    },
    getTreeData(){
      getAction(prescriptionTagApi.getAll).then(res => {
        const data = res.data
        this.dataList = data.map(i => {
          return {
            ...i,
            key: i.id
          }
        })
        let dataSourceGet = [];
        this.dataListLabel = data.map(i => {
          return {
            ...i,
            value: i.id,
            label: i.title,
            disabled: this.queryParam.tag.includes(i.id),
          }
        })

        data.forEach((item, index) => {
          if (item.parent_id === '0'){
            console.log('dataSourceGet', dataSourceGet)
            dataSourceGet.push({
              ...item,
              value: item.id,
              label: item.title,
              children: [],
              disabled: this.queryParam.tag.includes(item.id),
            })
          }
        })

        data.forEach((item, index) => {
          if (item.level === 2){
            const indexFind = dataSourceGet.findIndex(i => i.id === item.parent_id);
            dataSourceGet[indexFind].children.push({
              ...item,
              value: item.id,
              label: item.title,
              children: [],
              disabled: this.queryParam.tag.includes(item.id),
            })
          }
        })

        data.forEach((item, index) => {
          if (item.level === 3){
            let indexFind = 0;
            let indexFind1 = 0;
            dataSourceGet.forEach((itemIn, indexIn) => {
              itemIn.children.forEach((itemInner, indexInner) => {
                if (itemInner.id === item.parent_id){
                  indexFind = indexIn;
                  indexFind1 = indexInner;
                }
              })
            })
            dataSourceGet[indexFind].children[indexFind1].children.push({
              ...item,
              value: item.id,
              label: item.title,
              children: [],
              disabled: this.queryParam.tag.includes(item.id),
            })
          }
        })

        data.forEach((item, index) => {
          if (item.level === 4){
            let indexFind = 0;
            let indexFind1 = 0;
            let indexFind2 = 0;
            dataSourceGet.forEach((itemIn, indexIn) => {
              itemIn.children.forEach((itemInner, indexInner) => {
                itemInner.children.forEach((itemInnerIn, indexInnerIn) => {
                  if (itemInnerIn.id === item.parent_id){
                    indexFind = indexIn;
                    indexFind1 = indexInner;
                    indexFind2 = indexInnerIn;
                  }
                })
              })
            })
            dataSourceGet[indexFind].children[indexFind1].children[indexFind2].children.push({
              ...item,
              value: item.id,
              label: item.title,
              children: [],
              disabled: this.queryParam.tag.includes(item.id),
            })
          }
        })

        this.dataTree = [...dataSourceGet]
        this.confirmLoading = false
      })
    },
    edit (record) {
      this.confirmLoading = true
      this.queryParam = {...record.queryParam}
      this.dataSource = [...record.list]
      this.selectedItem = {...record.selectedItem}
      this.getTreeData()
    },
    handleNext (step) {
      const { form: { validateFields } } = this
      const currentStep = step + 1
      if (currentStep <= 2) {
        // stepForms
        validateFields(stepForms[ this.currentStep ], (errors, values) => {
          if (!errors) {
            this.currentStep = currentStep
          }
        })
        return
      }
      // last step
      this.confirmLoading = true
      validateFields((errors, values) => {
        console.log('errors:', errors, 'val:', values)
        if (!errors) {
          console.log('values:', values)
          setTimeout(() => {
            this.confirmLoading = false
            this.$emit('ok', values)
          }, 1500)
        } else {
          this.confirmLoading = false
        }
      })
    },
    backward () {
      this.currentStep--
    },
    handleCancel () {
      // clear form & currentStep
      this.$emit('cancel')
    },
    reset(){
      this.prescriptionsList = []
      this.form = {
        tag: []
      }
      this.selectedItem = {}
      this.dataSource = []
    }
  }
}
</script>
