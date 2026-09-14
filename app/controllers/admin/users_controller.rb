# frozen_string_literal: true

module Admin
  class UsersController < AdminController
    def index; end

    def show
      @user = User.includes(
        :seasons_users, :conflicts,
        payments: :payment_type,
        payment_schedules: :payment_schedule_entries
      ).find(params[:id])
      @member360 = Admin::Member360Presenter.call(@user, current_season)
    end

    def new
      @user = User.new
      @form = ::Admin::UserFormPresenter.call(@user, current_season)
    end

    def create
      @user = User.new(user_params)
      if @user.save
        PaymentScheduleService.ensure_payment_schedules_for_user(@user)
        @user.welcome
        flash[:success] = "#{@user.first_name} created"
        redirect_to("/admin/users/#{@user.id}")
      else
        Rollbar.info('User could not be created.', errors: @user.errors.full_messages)
        @form = ::Admin::UserFormPresenter.call(@user, current_season)
        render :new, status: :unprocessable_entity
      end
    end

    def edit
      @user = User.find(params[:id])
      @form = ::Admin::UserFormPresenter.call(@user, current_season)
    end

    # A failed save re-renders with everything the admin typed still in place.
    # It used to redirect, which threw the whole form away — the single most
    # expensive bug on this screen, since the form is the most complex in the
    # app.
    def update
      @user = User.find(params[:id])
      if @user.update(user_params)
        PaymentScheduleService.ensure_payment_schedules_for_user(@user)
        flash[:success] = "#{@user.first_name} updated"
        redirect_to('/admin/users')
      else
        Rollbar.info('User could not be updated.', errors: @user.errors.full_messages)
        @form = ::Admin::UserFormPresenter.call(@user, current_season)
        render :edit, status: :unprocessable_entity
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
        seasons_users_attributes: %i[id _destroy season_id role ensemble section]
      )
    end
  end
end
