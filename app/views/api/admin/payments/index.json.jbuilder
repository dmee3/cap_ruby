json.users(@users) do |user|
  json.id(user.id)
  json.first_name(user.first_name)
  json.last_name(user.last_name)
  json.ensemble(user.ensemble_for(current_season['id']))
  json.section(user.section_for(current_season['id']))
  json.payments(user.payments.select { |p| p.season_id == current_season['id'] })
  schedule = user.payment_schedules.select { |ps| ps.season_id == current_season['id'] }.first
  json.payment_schedule do
    json.id(schedule.id)
    json.entries(schedule.entries)
  end
end