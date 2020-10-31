import 'bootstrap/js/dist/toast'

export default class {
  static showToast(title, content, color) {
    const $toast = $(`
      <div class="toast border-${color}" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header">
          <i class="fas fa-square text-${color} mr-1"></i>
          <strong class="mr-auto">${title}</strong>
          <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="toast-body">${content}</div>
      </div>
    `)

    $('#toast-container').append($toast)
    $toast.toast({ animation: true, delay: 5000 })
    $toast.toast('show')
  }
}
