# frozen_string_literal: true

module Admin
  class UsersController < AdminController
    def index; end

    def show
      @user = User.find(params[:id])
    end

    def new
      @seasons = Season.all.order(:year)
      @user = User.new
      @seasons.each { |s| @user.seasons_users.build(season_id: s.id) }
    end

    def create
      @user = User.new(user_params)
      if @user.save
        update_seasons
        @user.welcome

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
        @user.initiate_password_reset if params['reset_password']
        flash[:success] = "#{@user.first_name} updated"
        redirect_to('/admin/users')
      else
        Rollbar.info('User could not be updated.', errors: @user.errors.full_messages)
        flash[:error] = "Unable to update #{@user.first_name}"
        redirect_to("/admin/users/#{@user.id}/edit")
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

    # This code sucks
    def update_seasons
      Season.all.each do |season|
        section = params["section_#{season.year}"]
        ensemble = params["ensemble_#{season.year}"]

        # Deleting season
        if ensemble == ''
          SeasonsUser.where(season_id: season.id, user_id: @user.id).destroy_all

        # Updating season
        elsif su = SeasonsUser.find_by(season_id: season.id, user_id: @user.id)
          if su.ensemble != ensemble || su.section != section
            su.update(ensemble: ensemble, section: section)
          end

        # Creating season
        else
          SeasonsUser.create(season_id: season.id, user_id: @user.id, ensemble: ensemble,
                             section: section)
          create_payment_schedule(season)
        end
      end
    end

    def create_payment_schedule(season)
      return unless PaymentSchedule.find_by(season_id: season.id, user_id: @user_id).blank?

      if season.year == '2021'
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
        :username,
        season_ids: []
      )
    end
  end
end
