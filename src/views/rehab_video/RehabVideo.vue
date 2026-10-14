<template>
  <rehab-resource-list
    resource-name="康复视频"
    resource-type="video"
    :api="api"
  />
</template>

<script>
import RehabResourceList from '@/views/rehab/components/RehabResourceList'
import { rehabVideoApi } from '@/service/api'

export default {
  name: 'RehabVideo',
  components: {
    RehabResourceList
  },
  data () {
    return {
      api: rehabVideoApi
    }
  }
}
</script>
