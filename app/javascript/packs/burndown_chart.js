import Vue from 'vue/dist/vue.esm'
import BurndownChart from '../vue/burndown_chart.vue'

document.addEventListener('DOMContentLoaded', () => {
  new Vue({
    el: '#burndown-chart',
    components: { BurndownChart },
    data: {},
  })
})
