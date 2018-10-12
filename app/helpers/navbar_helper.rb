module NavbarHelper
  def seasons
    current_user.seasons
  end

  def current_season
    session[:season] = current_user.seasons.last unless session[:season].present?
    session[:season]['year']
  end
end
