class CalendarsController < ApplicationController
  layout 'calendar'

  def new
    @members = User
      .with_role(:member)
      .for_season(Season.last.id)
      .select(:id, :first_name, :last_name)
      .order(:first_name)
      .to_json
  end
end
