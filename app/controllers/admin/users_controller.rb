# frozen_string_literal: true

module Admin
  class UsersController < AdminController
    def index; end

    def show
      @user = User.find(params[:id])
    end

    def new; end

    def create
      @user = User.new(user_params)
      if @user.save
        PaymentScheduleService.ensure_payment_schedules_for_user(@user)
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
      if @user.update(user_params)
        PaymentScheduleService.ensure_payment_schedules_for_user(@user)
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
        seasons_users_attributes: [:id, :_destroy, :season_id, :role, :ensemble, :section]
      )
    end
  end
end
