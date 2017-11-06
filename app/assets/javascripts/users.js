$(document).ready(function() {
  $('.delete-btn').click(function(evt) {
    $('#delete-form').attr('action', '/users/' + $(this).data('id'));
    $('#delete-name').text('Delete ' + $(this).data('name'));
    $('#delete-modal').modal('show');
  });

  $('#delete-modal').on('hide.bs.modal', function(e) {
    $('#delete-form').attr('action', '/');
    $('#delete-name').text('');
  });
});