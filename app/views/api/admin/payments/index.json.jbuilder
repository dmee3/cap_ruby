json.users(@users) do |user|
  json.id(user.id)
  json.first_name(user.first_name)
  json.last_name(user.last_name)
  json.ensemble(user.ensemble_for(current_season['id']))
  json.section(user.section_for(current_season['id']))
  json.payments(user.payments.select { |p| p.season_id == current_season['id'] })
  json.total(user.total_dues_for(current_season['id']))
  json.remaining_payments(user.remaining_payments_for(current_season['id']))
end