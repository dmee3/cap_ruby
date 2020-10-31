import Vue from 'vue/dist/vue.esm'
import BurndownChart from '../vue/burndown_chart.vue'

document.addEventListener('DOMContentLoaded', () => {
  const burndown_chart = new Vue({
    el: '#burndown-chart',
    data: {},
    components: { BurndownChart },
  })
})
