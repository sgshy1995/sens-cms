<template>
  <div class="phone-wrap">
    <div class="phone">
      <div class="phone-screen">
        <div class="phone-scroll">
          <div class="phone-stage-header">
            <div class="phone-stage-item-tag" v-if="stage.dictionary_item_name">{{ stage.dictionary_item_name }}</div>
            <div class="phone-stage-title">{{ stage.title || '阶段标题' }}</div>
            <div class="phone-stage-price">
              ￥{{ stage.price || '0.00' }}
              <span v-if="isDiscount && stage.discount_price" class="phone-stage-discount">￥{{ stage.discount_price }}</span>
            </div>
          </div>
          <div class="phone-sections">
            <div v-for="(section, index) in previewSections" :key="index" class="phone-section">
              <div class="phone-section-title">{{ section.resource_title || `部分 ${index + 1}` }}</div>
              <template v-if="section.resource_type === 'video'">
                <img v-if="section.resource_cover" class="phone-section-media" :src="resolveFileUrl(section.resource_cover)" alt="视频封面">
                <div v-else class="phone-section-video-placeholder">
                  <a-icon type="play-circle" /> 康复视频
                </div>
              </template>
              <img
                v-else-if="section.resource_type === 'image' && section.resource_content"
                class="phone-section-media"
                :src="resolveFileUrl(section.resource_content)"
                alt="康复图片"
              >
              <div v-else-if="section.resource_type === 'text'" class="phone-section-text">{{ section.resource_content || '康复文字内容' }}</div>
              <div v-if="Number(section.extra_type) === 1" class="phone-section-extra">{{ section.resource_remark || '（暂无备注）' }}</div>
              <div v-else-if="Number(section.extra_type) === 2" class="phone-section-extra">{{ section.extra_text }}</div>
            </div>
            <div v-if="!previewSections.length" class="phone-section-empty">正文内容将在这里显示</div>
          </div>
          <div v-if="stage.remark" class="phone-stage-remark">{{ stage.remark }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { resolveFileUrl } from '@/utils/util'

export default {
  name: 'StagePreview',
  props: {
    stage: {
      type: Object,
      default: () => ({})
    },
    isDiscount: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    previewSections () {
      return Array.isArray(this.stage.sections) ? this.stage.sections : []
    }
  },
  methods: {
    resolveFileUrl
  }
}
</script>

<style lang="less" scoped>
.phone-wrap {
  display: flex;
  justify-content: center;
}

.phone {
  position: relative;
  flex-shrink: 0;
  width: 300px;
  height: 620px;
  padding: 14px;
  background: #17171c;
  border: 2px solid #3c3c44;
  border-radius: 46px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.16);

  .phone-screen {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #f7f8fa;
    border-radius: 34px;
  }

  .phone-scroll {
    height: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
}

.phone-stage-header {
  padding: 20px 16px;
  background: #fff;
}

.phone-stage-item-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  color: #1890ff;
  background: #e6f7ff;
  border-radius: 10px;
}

.phone-stage-title {
  margin-top: 10px;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.4;
  color: #1a1a1a;
  word-break: break-word;
}

.phone-stage-price {
  margin-top: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #f5222d;
}

.phone-stage-discount {
  margin-left: 8px;
  font-size: 13px;
  font-weight: 400;
  color: #bfbfbf;
  text-decoration: line-through;
}

.phone-sections {
  padding: 16px;
}

.phone-section {
  padding: 14px;
  margin-bottom: 12px;
  background: #fff;
  border-radius: 8px;
}

.phone-section-title {
  margin-bottom: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  word-break: break-word;
}

.phone-section-media {
  display: block;
  width: 100%;
  border-radius: 6px;
}

.phone-section-video-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  font-size: 13px;
  color: #8c8c8c;
  background: #f0f2f5;
  border-radius: 6px;

  .anticon {
    margin-right: 6px;
    font-size: 20px;
  }
}

.phone-section-text {
  font-size: 14px;
  line-height: 1.7;
  color: #333;
  word-break: break-word;
}

.phone-section-extra {
  margin-top: 10px;
  padding-top: 10px;
  font-size: 13px;
  line-height: 1.6;
  color: #8c8c8c;
  border-top: 1px dashed #f0f0f0;
  word-break: break-word;
}

.phone-section-empty {
  padding: 24px;
  font-size: 13px;
  color: #bfbfbf;
  text-align: center;
  background: #fff;
  border-radius: 8px;
}

.phone-stage-remark {
  padding: 0 16px 24px;
  font-size: 13px;
  line-height: 1.7;
  color: #8c8c8c;
  word-break: break-word;
}
</style>
