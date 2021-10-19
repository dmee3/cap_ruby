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
      document.querySelector('#sidebar').classList.toggle('-translate-x-full')
    })
  }

  // Mobile menu logout
  const mobileLogOut = document.querySelector('#mobile-log-out')
  if (mobileLogOut) {
    mobileLogOut.addEventListener('click', () => { mobileLogOut.submit() })
  }

  // Season changing
  const seasonTrigger = document.querySelector('#season-dropdown-trigger')
  if (seasonTrigger) {
    const seasonDropdown = document.querySelector('#season-dropdown-menu')
    seasonTrigger.addEventListener('click', () => { seasonDropdown.classList.remove('hidden') })
    document.addEventListener('click', (e) => {
      if (!seasonTrigger.contains(e.target)) {
        seasonDropdown.classList.add('hidden')
      }
    })
  }

  // User menu dropdown
  const userMenuTrigger = document.querySelector('#user-menu-trigger')
  if (userMenuTrigger) {
    const userMenu = document.querySelector('#user-menu')
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
  })
})
