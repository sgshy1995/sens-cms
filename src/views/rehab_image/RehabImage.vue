<template>
  <rehab-resource-list
    resource-name="康复图片"
    resource-type="image"
    :api="api"
  />
</template>

<script>
import RehabResourceList from '@/views/rehab/components/RehabResourceList'
import { rehabImageApi } from '@/service/api'

export default {
  name: 'RehabImage',
  components: {
    RehabResourceList
  },
  data () {
    return {
      api: rehabImageApi
    }
  }
}
</script>
