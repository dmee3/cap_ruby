const addFlash = (status, message) => {
  const flashBar = getFlashBar()
  const newFlash = document.createElement('div')
  newFlash.classList.add('flash', getFlashClass(status))
  newFlash.innerHTML = `
    <span class="block flex-1">
      ${message}
    </span>
    <svg xmlns="http://www.w3.org/2000/svg" class="flash-close cursor-pointer h-6 w-6 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>`

  flashBar.appendChild(newFlash)

  addFlashCloseLogic(newFlash)
}

const getFlashBar = () => {
  let flashBar = document.getElementById('flash-bar')
  if (flashBar === null) {
    flashBar = document.createElement('div')
    flashBar.classList.add('flash-bar')
    document.getElementById('page-content').appendChild(flashBar)
  }
  return flashBar
}

const getFlashClass = status => {
  switch (status) {
    case 'success':
      return 'flash-success'
    case 'error':
    case 'alert':
      return 'flash-error'
    case 'info':
      return 'flash-info'
    default:
      return 'flash-default'
  }
}

const addFlashCloseLogic = (newFlash) => {
  const close = newFlash.querySelector('.flash-close')
  close.addEventListener('click', () => {
    newFlash.parentNode.removeChild(newFlash)
  })
}

export default addFlash