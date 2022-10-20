<template>
    <a-modal
      :maskClosable="true"
      title="订单发货"
      :width="840"
      :visible="visible"
      :confirmLoading="loading"
      @ok="handleClose"
      @cancel="handleClose"
    >
      <div slot="footer">
        <a-button type="primary" @click="handleClose" style="margin-right: 24px">取消</a-button>
        <a-button type="primary" @click="handleConfirm" :loading="loading">确定发货</a-button>
      </div>
      <a-spin :spinning="loading">
        <div class="shipment-modal">
          <div class="shipment-modal-title">
            <div class="shipment-modal-title-in">下单用户: <span>{{ info.username }}</span></div>
            <div class="shipment-modal-title-in">姓名: <span>{{ info.name }}</span></div>
            <div class="shipment-modal-title-in">订单号: <span>{{ info.order_no }}</span></div>
            <div class="shipment-modal-title-in">支付流水号: <span>{{ info.payment_no }}</span></div>
            <div class="shipment-modal-title-in">购买器材种类数: <span>{{ info.order_total }}</span></div>
            <div class="shipment-modal-title-in">购买总数量: <span>{{ info.order_total_num }}</span></div>
            <div class="shipment-modal-title-in">支付金额/元: <span>¥ {{ info.payment_num }}</span></div>
          </div>
          <div class="shipment-modal-shipment">
            <div class="shipment-modal-shipment-title">配送信息</div>
            <div class="shipment-modal-shipment-in">配送联系人: <span>{{ info.shipping_name }}</span></div>
            <div class="shipment-modal-shipment-in">配送联系电话: <span>{{ info.shipping_phone }}</span></div>
            <div class="shipment-modal-shipment-in">配送地址: <span>{{ info.shipping_address }}</span></div>
          </div>
          <div class="shipment-modal-body">
            <div class="shipment-modal-body-title">起送信息</div>
            <div class="shipment-modal-body-in">
              <a-form :form="form" v-bind="formLayout">
                <a-form-item label="物流单号">
                  <a-input v-decorator="['courier_number', {rules: [{required: true, min: 1, message: '请输入物流单号'}]}]"
                           placeholder="请输入物流单号" />
                </a-form-item>
                <a-form-item label="物流公司">
                  <a-select :filter-option="filterOption" option-filter-prop="children" showSearch v-decorator="['courier_company', {rules: [{required: true, trigger: 'change', message: '请选择物流公司'}]}]"
                            placeholder="请选择物流公司">
                    <a-select-option :value="u.type" v-for="(u, index) in courierCompanyList" :key="u.type">{{ u.name }}</a-select-option>
                  </a-select>
                  <div style="line-height: 1.5;font-size: 12px;color: #FF6464">注意: 请正确选择快递公司，若未知则选择"其他"。否则可能导致物流信息查询失败。</div>
                </a-form-item>
                <a-form-item label="起送联系人">
                  <a-input v-decorator="['origin_name', {rules: [{required: true, min: 1, message: '请输入起送联系人'}]}]"
                           placeholder="请输入起送联系人" />
                </a-form-item>
                <a-form-item label="起送联系电话">
                  <a-input v-decorator="['origin_phone', {rules: [{required: true, min: 1, message: '请输入起送联系电话'}]}]"
                           placeholder="请输入起送联系电话" />
                </a-form-item>
                <a-form-item label="起送地址">
                  <a-input v-decorator="['origin_address', {rules: [{required: true, min: 1, message: '请输入起送地址'}]}]"
                           placeholder="请输入起送地址" />
                </a-form-item>
                <a-form-item label="备注">
                  <a-textarea v-decorator="['remark', {rules: [{required: false}]}]"
                           placeholder="请输入备注，可为空" :rows="3" />
                </a-form-item>
              </a-form>
            </div>
          </div>
        </div>
      </a-spin>
    </a-modal>
</template>

<script>
import moment from "moment";
import { courierApi, equipmentOrderApi } from "@/service/api";
import { getAction, postAction } from "@/utils/manage";

export default {
  name: "ShipmentModal",
  data(){
    this.formLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 7 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 13 }
      }
    };
    return {
      form: this.$form.createForm(this),
      visible: false,
      loading: false,
      info: {},
      dataSource: [],
      baseUrl: process.env.VUE_APP_API_BASE_URL + "/",
      courierCompanyList: [],
      courierCompanyListTotal: []
    }
  },
  methods: {
    show(info){
      this.getCourierCompanyList('').then(data => {
        this.courierCompanyListTotal = [...data, {name: '其他', type: 'other'}]
        this.courierCompanyList = [...data, {name: '其他', type: 'other'}]
      })
      this.visible = true
      const data = {...info}
      const status_map = ['取消/关闭', '待支付', '待发货', '已发货', '已收货', '退货中', '已退货']
      data.status_show = status_map[data.status]
      data.order_time_show = moment(data.order_time, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')
      data.payment_time_show = moment(data.payment_time, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')
      const payment_typ_map = ['余额支付', '微信支付', '支付宝支付', 'Apple支付']
      data.payment_type_show = payment_typ_map[data.payment_type]
      const equipment_type_map = ['康复训练器材', '康复理疗设备', '康复治疗师工具']
      data.equipment.map(equipment=>{
        equipment.equipment_type_show = equipment_type_map[equipment.equipment_type]
        equipment.url = this.baseUrl + equipment.cover
        equipment.models.map(model => {
          console.log('model', model)
          model.url = this.baseUrl + model.multi_figure.split(',')[0]
        })
      })
      this.dataSource = [...data.equipment]
      this.info = {...data}
    },
    filterOption(input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      );
    },
    getCourierCompanyList(courier_company){
      return new Promise((resolve, reject) => {
        getAction(courierApi.courier_company_list, {
          courier_company
        }).then(res => {
          resolve(res.data)
        }).catch(err=>{
          reject(err)
        })
      })
    },
    handleClose(){
      this.visible = false
      this.info = {}
      this.dataSource = []
    },
    handleConfirm(){
      this.form.validateFields((errors, values) => {
        if (!errors) {
          this.loading = true
          const formIn = { ...values };
          postAction(equipmentOrderApi.shipment, {
            ...formIn,
            id: this.info.id
          }).then(res=>{
            this.$message.success(res.message || "发货成功");
            this.form.resetFields()
            this.handleClose()
            this.$emit('ok')
          }).catch(err=>{
            this.$message.success(err.message || "发货失败");
          }).finally(()=>{
            this.loading = false
          })
        }
      })
    }
  }
};
</script>

<style scoped lang="less">
.shipment-modal{
  width: 100%;

  .shipment-modal-title{
    width: 100%;

    .shipment-modal-title-in{
      width: 100%;
      margin-bottom: 12px;

      > span{
        font-weight: bold;
      }
    }
  }

  .shipment-modal-shipment{
    margin-top: 24px;
    width: 100%;

    .shipment-modal-shipment-title{
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 24px;
    }

    .shipment-modal-shipment-in{
      width: 100%;
      margin-bottom: 12px;

      > span{
        font-weight: bold;
      }
    }
  }

  .shipment-modal-body{
    margin-top: 24px;
    width: 100%;

    .shipment-modal-body-title{
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 24px;
    }
  }
}
</style>