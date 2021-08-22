// Styles
import '../stylesheets/application.scss'

// All vue registrations
// import './vue_setup.js'

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
})
