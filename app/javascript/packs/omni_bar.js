import Vue from 'vue/dist/vue.esm'
import OmniBar from '../omni_bar.vue'

document.addEventListener('DOMContentLoaded', () => {
  const omni_bar = new Vue({
    el: '#omni-bar',
    data: {},
    components: { OmniBar }
  })
})