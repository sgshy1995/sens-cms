<template>
  <rehab-resource-list
    resource-name="康复文字"
    resource-type="text"
    :api="api"
  />
</template>

<script>
import RehabResourceList from '@/views/rehab/components/RehabResourceList'
import { rehabTextApi } from '@/service/api'

export default {
  name: 'RehabText',
  components: {
    RehabResourceList
  },
  data () {
    return {
      api: rehabTextApi
    }
  }
}
</script>
