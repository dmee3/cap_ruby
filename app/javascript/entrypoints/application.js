console.log('Vite ⚡️ Rails')

import '~/stylesheets/application.css'

import flatpickr from 'flatpickr'

document.addEventListener('DOMContentLoaded', () => {
  // ---- Mobile nav drawer ----
  const drawer = document.querySelector('.app-drawer')
  const scrim = document.querySelector('.app-scrim')
  const openDrawer = () => {
    drawer?.classList.add('is-open')
    scrim?.classList.add('is-open')
  }
  const closeDrawer = () => {
    drawer?.classList.remove('is-open')
    scrim?.classList.remove('is-open')
  }
  document.querySelector('#app-menu-btn')?.addEventListener('click', openDrawer)
  document.querySelector('#app-menu-btn-season')?.addEventListener('click', openDrawer)
  document.querySelector('#app-drawer-close')?.addEventListener('click', closeDrawer)
  scrim?.addEventListener('click', closeDrawer)

  // ---- Generic dropdown: [data-dropdown-trigger] toggles `hidden` on aria-controls target ----
  document.querySelectorAll('[data-dropdown-trigger]').forEach(trigger => {
    const menu = document.getElementById(trigger.getAttribute('aria-controls'))
    if (!menu) return
    trigger.addEventListener('click', (e) => {
      e.stopPropagation()
      menu.classList.toggle('hidden')
    })
    document.addEventListener('click', (e) => {
      if (!trigger.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hidden')
      }
    })
  })

  // ---- Forms that submit on click of the whole element (sidebar / drawer log out) ----
  document.querySelectorAll('[data-logout-form]').forEach(form => {
    form.addEventListener('click', () => form.submit())
  })

  // ---- Flash close ----
  document.querySelectorAll('.flash').forEach(flash => {
    flash.querySelector('.flash-close')?.addEventListener('click', () => flash.remove())
  })

  // ---- flatpickr ----
  flatpickr('.flatpickr', {
    altInput: true,
    altFormat: 'F j, Y',
    altInputClass: 'input-text',
    dateFormat: 'Y-m-d',
    disableMobile: true,
  })

  flatpickr('.flatpickr-dt', {
    altInput: true,
    altFormat: 'F j, Y h:i K',
    altInputClass: 'input-text',
    dateFormat: 'Y-m-d H:i',
    disableMobile: true,
    enableTime: true,
  })

  // Member conflict submission - only allow future dates
  flatpickr('.flatpickr-dt-member-conflict', {
    altInput: true,
    altFormat: 'F j, Y h:i K',
    altInputClass: 'input-text',
    dateFormat: 'Y-m-d H:i',
    disableMobile: true,
    enableTime: true,
    minDate: 'today',
  })
})
