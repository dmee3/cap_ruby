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
      removals, attrs = split_removals(user_params)
      if @user.update(attrs)
        apply_removals(@user, removals)
        PaymentScheduleService.ensure_payment_schedules_for_user(@user)
        flash[:success] = "#{@user.first_name} updated"
        redirect_to('/admin/users')
      else
        Rollbar.info('User could not be updated.', errors: @user.errors.full_messages)
        @form = ::Admin::UserFormPresenter.call(@user, current_season)
        render :edit, status: :unprocessable_entity
      end
    end

    # Sends Devise's own reset email and stamps reset_password_sent_at, so the
    # edit screen can answer "did I already send this".
    def send_reset
      user = User.find(params[:id])
      user.send_reset_password_instructions
      flash[:success] = "Reset link sent to #{user.email}"
      redirect_to("/admin/users/#{user.id}/edit")
    end

    def destroy
      @user = User.find params[:id]
      if @user.destroy
        head(200)
      else
        head(422)
      end
    end

    # A season toggled off posts `_destroy`, which would delete the row and
    # strand its payment schedule. Those rows go to SeasonRemovalService instead.
    # A restored row comes back as an ordinary role, so it needs no special case.
    def split_removals(attrs)
      rows = attrs[:seasons_users_attributes]
      return [[], attrs] if rows.blank?

      # The form posts indexed rows, which arrive as a hash keyed by index; a
      # JSON array posts them as an array. Both are valid nested attributes, so
      # normalise before partitioning.
      list = rows.respond_to?(:values) ? rows.values : rows.to_a
      kept, removed = list.partition { |row| row[:_destroy].blank? }
      remaining = attrs.except(:seasons_users_attributes)
      remaining[:seasons_users_attributes] = kept if kept.any?
      [removed.filter_map { |row| row[:id].presence }, remaining]
    end

    def apply_removals(user, ids)
      return if ids.empty?

      user.reload
      ids.each do |id|
        row = user.seasons_users.find { |su| su.id.to_s == id.to_s }
        next if row.nil?

        SeasonRemovalService.remove(user, row.season_id, actor: current_user)
      end
      user.reload
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
        :inventory_access,
        :whistleblower_recipient,
        seasons_users_attributes: %i[id _destroy season_id role ensemble section]
      )
    end
  end
end
