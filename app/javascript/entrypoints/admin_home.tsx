// import Vue from 'vue/dist/vue.esm'
// import BehindMembers from '../vue/components/behind_members.vue'
// import UpcomingConflicts from '../vue/components/upcoming_conflicts.vue'

// document.addEventListener('DOMContentLoaded', () => {
//   new Vue({
//     el: '#main-content',
//     components: {
//       BehindMembers,
//       UpcomingConflicts,
//     },
//   })
// })

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import Hello from '../react/hello'

const AdminHome = () => {
  console.log('Admin Home executing')
  ReactDOM.render(
    <Hello name="Dan" />,
    document.getElementById('main-content')
  )
}

AdminHome()

export default AdminHome