document.addEventListener('DOMContentLoaded', () => {
  const flashes = document.querySelectorAll('.flash')
  flashes.forEach(flash => {
    let close = flash.querySelector('.flash-close')
    close.addEventListener('click', () => {
      flash.parentNode.removeChild(flash)
    })
  })
})