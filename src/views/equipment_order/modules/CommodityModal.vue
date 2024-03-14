<template>
    <a-modal
      :maskClosable="true"
      title="商品清单"
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
        <div class="commodity-modal">
          <div class="commodity-modal-title">
            <div class="commodity-modal-title-in">下单用户: <span>{{ info.username }}</span></div>
            <div class="commodity-modal-title-in">姓名: <span>{{ info.name }}</span></div>
            <div class="commodity-modal-title-in">订单号: <span>{{ info.order_no }}</span></div>
            <div class="commodity-modal-title-in">支付流水号: <span>{{ info.payment_no }}</span></div>
            <div class="commodity-modal-title-in">购买器材种类数: <span>{{ info.order_total }}</span></div>
            <div class="commodity-modal-title-in">购买总数量: <span>{{ info.order_total_num }}</span></div>
            <div class="commodity-modal-title-in">支付金额/元: <span>¥ {{ info.payment_num }}</span></div>
          </div>
          <div class="commodity-modal-body">
            <div class="commodity-modal-item" v-for="(u, index) in dataSource" :key="index">
              <div class="chart-right-content">
                <div class="body-item-top">
                  <div class="body-item-top-left">
                    <img class="body-item-top-left-img" :src="u.url" alt="cover" />
                  </div>
                  <div class="body-item-top-right">
                    <div class="body-item-top-right-title">{{ u.title }}</div>
                    <div class="body-item-top-right-tag">
                    <span class="item-right-tag-in" >
                      <span class="tag-in-text">{{ u.equipment_type_show }}</span>
                    </span>
                    </div>
                    <div class="body-item-top-right-description">{{ u.description }}</div>
                  </div>
                </div>
                <div class="body-item-bottom">
                  <div class="body-item-bottom-title">已购买型号</div>
                  <div class="body-item-bottom-body">
                    <div class="body-item-bottom-body-item" v-for="(u1, index1) in u.models" :key="u1.id">
                      <div class="body-model-left">
                        <img alt="cover" class="body-model-left-img" :src="u1.url" />
                      </div>
                      <div class="body-model-right">
                        <div class="body-model-right-title">{{ u1.title }}</div>
                        <div class="body-model-right-description">{{ u1.description }}</div>
                        <div class="body-model-right-price">
                          <span class="body-model-right-price-in">¥ {{ u1.price }}</span>
                        </div>
                        <div class="body-model-right-num">
                          ×{{ u1.add_num }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </a-spin>
    </a-modal>
</template>

<script>
import moment from "moment";

export default {
  name: "CommodityModel",
  data(){
    return {
      visible: false,
      loading: false,
      info: {},
      dataSource: [],
      baseUrl: process.env.VUE_APP_API_BASE_URL + "/",
      cdnUrl: process.env.VUE_APP_CDN_BASE_URL + '/',
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
        equipment.url = this.cdnUrl + equipment.cover
        equipment.models.map(model => {
          console.log('model', model)
          model.url = this.cdnUrl + model.multi_figure.split(',')[0]
        })
      })
      this.dataSource = [...data.equipment]
      this.info = {...data}
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
.commodity-modal{
  width: 100%;

  .commodity-modal-title{
    width: 100%;

    .commodity-modal-title-in{
      width: 100%;
      margin-bottom: 12px;

      > span{
        font-weight: bold;
      }
    }
  }

  .commodity-modal-body{
    width: 100%;
    max-height: 400px;
    overflow: auto;
  }

  .commodity-modal-item{
    width: 100%;
    margin-bottom: 36px;
    display: flex;
    justify-content: space-between;
    background: #fff;
    box-sizing: border-box;
    padding: 24px 12px 24px 0;
    position: relative;
    border-bottom: 1px dashed #333;

    .chart-left-icon-delete{
      margin-top: 24px;
      width: 32px;
      position: absolute;
      right: 24px;
      top: 0;
    }

    .chart-left-icon{
      width: 32px;
      box-sizing: border-box;
      margin-right: 24px;
      flex-shrink: 0;
      margin-top: 12px;

      .chart-left-icon-select{
        display: flex;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
        border: 1px solid #B0B3BC;
        height: 32px;
        border-radius: 6px;

        .chart-left-icon-select-in{
          display: none;
        }

        &.active{
          border-color: #4F68B0;
          background: #4F68B0;

          .chart-left-icon-select-in{
            display: block;
          }
        }

        &.disabled{
          border-color: #C8C9CC;
          background: #EBEDF0;

          .chart-left-icon-select-in{
            display: block;
          }
        }
      }

    }

    .chart-right-content{
      flex-grow: 1;
    }

    .body-item-top{
      width: 100%;
      display: flex;
      align-items: center;

      .body-item-top-left{
        width: 200px;
        height: 130px;
        border-radius: 12px;
        flex-shrink: 0;
        margin-right: 12px;
        overflow: hidden;

        .body-item-top-left-img{
          width: 100%;
          height: 100%;
        }
      }

      .body-item-top-right{
        flex-grow: 1;
        height: 130px;

        .body-item-top-right-title{
          width: calc(100% - 32px);
          font-size: 12px;
          font-weight: bold;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }

        .body-item-top-right-tag{
          width: 100%;
          margin-top: 6px;
          display: flex;
          align-items: center;

          .item-right-tag-in {
            font-size: 11px;
            color: #333;
            font-weight: 700;
            color: #aaa;

            .tag-in-point {
              box-sizing: border-box;
              padding: 0 6px;
            }
          }
        }

        .body-item-top-right-description{
          font-size: 8px;
          width: 100%;
          margin-top: 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          color: #aaa;
        }

        .body-item-top-right-price{
          color: #333;
          font-size: 12px;
          margin-top: 10px;

          .body-item-top-right-price-in{
            font-weight: bold;
            padding-left: 4px;
          }

          .in-discount{
            text-decoration:line-through;
            color: #999;
          }

          .show-discount{
            color: #4F68B0;
            padding-left: 16px;
          }
        }
      }
    }

    .body-item-bottom{
      width: 100%;
      margin-top: 24px;

      .body-item-bottom-title{
        width: 100%;
        font-size: 12px;
        font-weight: bold;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
      }

      .body-item-bottom-body{
        width: 100%;

        .body-item-bottom-body-item{
          width: 100%;
          margin-top: 24px;
          display: flex;
          justify-content: space-between;
          position: relative;

          .body-model-delete{
            width: 36px;
            position: absolute;
            right: 0;
            top: 0;
          }

          .body-model-left{
            width: 100px;
            height: 60px;
            border-radius: 12px;
            margin-right: 24px;
            flex-shrink: 0;

            .body-model-left-img{
              width: 100%;
              height: 100%;
              border-radius: 12px;
            }
          }

          .body-model-righter{
            margin-left: 12px;
            font-size: 15px;
            font-weight: bold;
          }

          .body-model-right{
            flex-grow: 1;
            position: relative;

            .body-model-right-title{
              width: 100%;
              font-size: 11px;
              font-weight: bold;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 1;
              -webkit-box-orient: vertical;
            }

            .body-model-right-description{
              width: 100%;
              font-size: 11px;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 1;
              -webkit-box-orient: vertical;
              color: #aaa;
              margin-top: 10px;
            }

            .body-model-right-num{
              color: #0598FB;
              font-size: 16px;
              margin-top: 10px;
              font-weight: bold;
            }

            .body-model-right-price{
              color: #333;
              font-size: 11px;
              margin-top: 10px;

              .body-model-right-price-in{
                font-weight: bold;
                padding-left: 4px;
              }

              .in-discount{
                text-decoration:line-through;
                color: #999;
              }

              .show-discount{
                color: #4F68B0;
                padding-left: 16px;
              }
            }

            .body-model-right-select{
              margin-top: 10px;
            }

            .body-model-right-empty{
              position: absolute;
              top: 50%;
              left: 50%;
              box-sizing: border-box;
              border: 2px solid #999;
              color: #999;
              font-size: 13px;
              border-radius: 50%;
              transform: translate(-50%,-50%) rotate(30deg);
              display: flex;
              align-items: center;
              justify-content: center;
              flex-direction: column;
              width: 100px;
              height: 100px;
              opacity: 0.9;
              z-index: 3;

              &::after{
                content: ' ';
                display: block;
                width: 80px;
                height: 80px;
                border-radius: 50%;
                border: 1px dashed #999;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%,-50%) rotate(30deg);
              }

              .body-model-right-empty-text{
                white-space: nowrap;
                font-weight: 800;
              }
            }
          }
        }
      }
    }
  }
}
</style>