// To see this message, add the following to the `<head>` section in your
// views/layouts/application.html.erb
//
//    <%= vite_client_tag %>
//    <%= vite_javascript_tag 'application' %>
console.log('Vite ⚡️ Rails')

// If using a TypeScript entrypoint file:
//     <%= vite_typescript_tag 'application' %>
//
// If you want to use .jsx or .tsx, add the extension:
//     <%= vite_javascript_tag 'application.jsx' %>

console.log('Visit the guide for more information: ', 'https://vite-ruby.netlify.app/guide/rails')

// Example: Load Rails libraries in Vite.
//
// import '@rails/ujs'
//
// import Turbolinks from 'turbolinks'
// import ActiveStorage from '@rails/activestorage'
//
// // Import all channels.
// import.meta.globEager('./**/*_channel.js')
//
// Turbolinks.start()
// ActiveStorage.start()

// Example: Import a stylesheet in app/frontend/index.css
// import '~/index.css'
import '~/stylesheets/application.scss'

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
