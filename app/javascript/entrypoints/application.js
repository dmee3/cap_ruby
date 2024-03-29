console.log('Vite ⚡️ Rails')

import 'virtual:windi-base.css'
import 'virtual:windi-components.css'

import 'virtual:windi-devtools'

import '~/stylesheets/application.css'

import 'virtual:windi-utilities.css'

import flatpickr from 'flatpickr'

document.addEventListener('DOMContentLoaded', () => {
  // Navigation bar responsiveness
  const mobileNavBtn = document.querySelector('#mobile-menu-btn')
  if (mobileNavBtn) {
    mobileNavBtn.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('-translate-x-full')
    })
  }

  // Mobile menu logout
  const mobileLogOut = document.querySelector('#mobile-log-out')
  if (mobileLogOut) {
    mobileLogOut.addEventListener('click', () => { mobileLogOut.submit() })
  }

  // Season changing
  const seasonTrigger = document.getElementById('season-dropdown-trigger')
  if (seasonTrigger) {
    const seasonDropdown = document.getElementById('season-dropdown-menu')
    seasonTrigger.addEventListener('click', () => { seasonDropdown.classList.remove('hidden') })
    document.addEventListener('click', (e) => {
      if (!seasonTrigger.contains(e.target)) {
        seasonDropdown.classList.add('hidden')
      }
    })
  }
  const mobileSeasonTrigger = document.getElementById('mobile-season-dropdown-trigger')
  if (mobileSeasonTrigger) {
    const mobileSeasonDropdown = document.getElementById('mobile-season-dropdown-menu')
    mobileSeasonTrigger.addEventListener('click', () => { mobileSeasonDropdown.classList.remove('hidden') })
    document.addEventListener('click', (e) => {
      if (!mobileSeasonTrigger.contains(e.target)) {
        mobileSeasonDropdown.classList.add('hidden')
      }
    })
  }

  // User menu dropdown
  const userMenuTrigger = document.getElementById('user-menu-trigger')
  if (userMenuTrigger) {
    const userMenu = document.getElementById('user-menu')
    userMenuTrigger.addEventListener('click', () => { userMenu.classList.remove('hidden') })
    document.addEventListener('click', (e) => {
      if (!userMenuTrigger.contains(e.target)) {
        userMenu.classList.add('hidden')
      }
    })
  }

  const flashes = document.querySelectorAll('.flash')
  flashes.forEach(flash => {
    const close = flash.querySelector('.flash-close')
    close.addEventListener('click', () => {
      flash.parentNode.removeChild(flash)
    })
  })

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
})
