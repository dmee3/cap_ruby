class Admin::NineVoltsController < ApplicationController
  before_action :logout_if_unauthorized
  before_action -> { redirect_if_not 'admin' }

  def index
    nine_volts = NineVolt.where(season_id: current_season['id'])
    render json: { nine_volts: nine_volts }, status: 200
  end

  def create
    nine_volts = NineVolt.find_or_create_by(user_id: params[:user_id], season_id: current_season['id'])
    nine_volts.update(turned_in: true)
    render json: { message: "Logged 9-volts." }, status: 200
  end

  def destroy
    NineVolt.find(params[:id]).update(turned_in: false)
    render json: { message: "Deleted 9-volts." }, status: 200
  end
end
