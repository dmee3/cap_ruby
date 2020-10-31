import Vue from 'vue/dist/vue.esm'
import OmniBar from '../vue/omni_bar.vue'

document.addEventListener('DOMContentLoaded', () => {
  new Vue({
    el: '#omni-bar',
    components: { OmniBar },
    data: {},
  })
})
