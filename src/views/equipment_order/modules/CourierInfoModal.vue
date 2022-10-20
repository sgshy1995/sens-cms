<template>
    <a-modal
      :maskClosable="true"
      title="物流信息查询"
      :width="840"
      :visible="visible"
      :confirmLoading="loading"
      @ok="handleClose"
      @cancel="handleClose"
    >
      <div slot="footer">
        <a-button type="primary" @click="handleClose">确定</a-button>
      </div>
      <a-spin :spinning="loading">
        <div class="shipment-modal">
          <div class="shipment-modal-shipment">
            <div class="shipment-modal-shipment-title">配送信息</div>
            <div class="shipment-modal-shipment-in">配送联系人: <span>{{ info.shipping_name }}</span></div>
            <div class="shipment-modal-shipment-in">配送联系电话: <span>{{ info.shipping_phone }}</span></div>
            <div class="shipment-modal-shipment-in">配送地址: <span>{{ info.shipping_address }}</span></div>
          </div>
          <div class="shipment-modal-origin">
            <div class="shipment-modal-origin-title">起送信息</div>
            <div class="shipment-modal-origin-in">起送联系人: <span>{{ info.origin_name }}</span></div>
            <div class="shipment-modal-origin-in">起送联系电话: <span>{{ info.origin_phone }}</span></div>
            <div class="shipment-modal-origin-in">起送地址: <span>{{ info.origin_address }}</span></div>
          </div>
          <div class="shipment-modal-info">
            <div class="shipment-modal-info-title">
              <div class="shipment-modal-info-title-in">物流信息</div>
              <div class="shipment-modal-info-title-info">
                <img v-if="courierInfo.logo" class="shipment-modal-info-title-info-img" :src="courierInfo.logo" alt="logo">
                <span v-if="courierInfo.expName" class="shipment-modal-info-title-info-name">{{ courierInfo.expName }}</span>
                <span>{{ info.courier_number }}</span>
                <span class="shipment-modal-info-title-info-status" v-if="courierInfo.deliverystatus">状态: {{ statusMap[courierInfo.deliverystatus] }}</span>
              </div>
            </div>
            <div class="shipment-modal-info-body">
              <a-timeline>
                <a-timeline-item :color="index === 0 ? 'green' : 'gray'" v-for="(u, index) in infoList" :key="index">
                  <div>{{ u.time }}</div>
                  <div>{{ u.status }}</div>
                </a-timeline-item>
              </a-timeline>
            </div>
          </div>
        </div>
      </a-spin>
    </a-modal>
</template>

<script>
import moment from "moment";
import { equipmentOrderApi, courierApi } from "@/service/api";
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
      infoList: [],
      courierInfo: {},
      statusMap: {
        "0": "揽件",
        "1": "在途中",
        "2": "正在派件",
        "3": "已签收",
        "4": "派送失败",
        "5": "疑难件",
        "6": "退件签收"
      }
    }
  },
  methods: {
    show(info){
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
      if (this.info.courier_info && this.info.courier_info.courier_content){
        this.infoList = JSON.parse(this.info.courier_info.courier_content).list || []
        this.courierInfo = JSON.parse(this.info.courier_info.courier_content)
      }else{
        this.infoList = []
        this.courierInfo = {}
      }
    },
    handleClose(){
      this.visible = false
      this.info = {}
      this.dataSource = []
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

  .shipment-modal-origin{
    margin-top: 24px;
    width: 100%;

    .shipment-modal-origin-title{
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 24px;
    }

    .shipment-modal-origin-in{
      width: 100%;
      margin-bottom: 12px;

      > span{
        font-weight: bold;
      }
    }
  }

  .shipment-modal-info{
    margin-top: 24px;
    width: 100%;

    .shipment-modal-info-title{
      width: 100%;
      margin-bottom: 24px;

      .shipment-modal-info-title-in{
        font-size: 16px;
        font-weight: bold;
      }

      .shipment-modal-info-title-info{
        margin-left: 24px;
        display: flex;
        align-items: center;
        font-size: 16px;
        margin-top: 24px;

        .shipment-modal-info-title-info-img{
          width: 60px;
          height: 30px;
        }

        .shipment-modal-info-title-info-name{
          padding: 0 12px;
        }

        .shipment-modal-info-title-info-status{
          padding-left: 12px;
          font-weight: bold;
        }
      }
    }

    .shipment-modal-info-body{
      padding-top: 12px;
      width: 100%;
      max-height: 400px;
      overflow: auto;
    }
  }
}
</style>