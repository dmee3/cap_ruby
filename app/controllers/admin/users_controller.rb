class Admin::UsersController < ApplicationController
  before_action :logout_if_unauthorized
  before_action -> { redirect_if_not 'admin' }

  def index
    respond_to do |format|
      format.html { }
      format.json do
        @users = User
          .for_season(current_season['id'])
          .with_role(params[:user_type] || 'member')
          .map do |u|
            {
              id: u.id,
              first_name: u.first_name,
              last_name: u.last_name,
              section: u.section_for(current_season['id'])
            }
          end
        render json: { users: @users }
      end
    end
  end

  def show
    @user = User.find(params[:id])
  end

  def new
    @user = User.new
  end

  def create
    @user = User.new(user_params)
    if @user.save
      update_seasons
      flash[:success] = "#{@user.first_name} created"
      redirect_to('/admin/users')
    else
      Rollbar.info('User could not be created.', errors: @user.errors.full_messages)
      flash.now[:error] = @user.errors.full_messages.to_sentence
      render :new
    end
  end

  def edit
    @user = User.find(params[:id])
  end

  def update
    @user = User.find(params[:id])
    if @user.update(user_params.reject { |_k, v| v.blank? }) # only update non-empty fields
      update_seasons
      flash[:success] = "#{@user.first_name} updated"
      redirect_to('/admin/users')
    else
      Rollbar.info('User could not be updated.', errors: @user.errors.full_messages)
      flash[:error] = "Unable to update #{@user.first_name}"
      redirect_to("/admin/users/edit/#{@user.id}")
    end
  end

  def destroy
    @user = User.find params[:id]
    if @user.destroy
      head(200)
    else
      head(422)
    end
  end

  private

  def update_seasons
    Season.all.each do |season|
      section = params["section_#{season.year}"]

      # Deleting season
      if section == ''
        SeasonsUser.where(season_id: season.id, user_id: @user.id).destroy_all

      # Updating season
      elsif su = SeasonsUser.find_by(season_id: season.id, user_id: @user.id)
        if su.section != section
          su.section = section
          su.save
        end

      # Creating season
      else
        su = SeasonsUser.create(season_id: season.id, user_id: @user.id, section: section)
        create_payment_schedule(season)
      end
    end
  end

  def create_payment_schedule(season)
    return unless PaymentSchedule.find_by(season_id: season.id, user_id: @user_id).blank?

    if season.year == '2020'
      @user.payment_schedules << DefaultPaymentSchedule.create(@user.id, season.id)
    else
      @user.payment_schedules << PaymentSchedule.create(user_id: @user_id, season_id: season.id)
    end
  end

  def user_params
    params.require(:user).permit(
      :first_name,
      :last_name,
      :email,
      :password,
      :password_confirmation,
      :phone,
      :role_id,
      :section,
      :username,
      season_ids:[]
    )
  end
end
