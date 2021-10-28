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

    def user_params
      params.require(:user).permit(
        :first_name,
        :last_name,
        :email,
        :password,
        :password_confirmation,
        :phone,
        :username,
        seasons_users_attributes: []
      )
    end
  end
end
