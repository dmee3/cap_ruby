# frozen_string_literal: true

module Admin
  class PaymentsController < AdminController
    def index
      respond_to do |format|
        format.html do
          @payment_types = manual_payment_types
          @season_payment_count = Payment.for_season(current_season['id']).count
          render('admin/payments/index')
        end
        format.json do
          render json: Admin::PaymentsQuery.new(current_season['id'], payments_query_params).call
        end
      end
    end

    def show
      @payment = Payment.find(params[:id])
      render('admin/payments/show')
    end

    def new
      @payment = Payment.new
      @payment.user_id = params[:user_id] if params[:user_id]
      @payment_types = manual_payment_types
      @members = add_payment_member_models
      @undo_payment_id = params[:undo].presence
      render('admin/payments/new')
    end

    def create
      @payment = Payment.new(payment_attrs(payment_params))
      @payment.season_id = current_season['id']

      saved = Payment.transaction do
        if @payment.save
          ActivityLogger.log_payment(@payment, current_user)
          true
        else
          false
        end
      end

      if saved
        flash[:success] = "#{ActiveSupport::NumberHelper.number_to_currency(@payment.amount / 100.0)} " \
                          "recorded for #{@payment.user.full_name}"
        flash[:undo_payment_id] = @payment.id
        redirect_to(admin_payments_path)
      else
        @payment_types = manual_payment_types
        @members = add_payment_member_models
        # Keep @payment.amount in cents — new.html.erb reads it as cents for the
        # sticky MoneyField value; no lossy /100 round-trip.
        flash.now[:error] = @payment.errors.full_messages.to_sentence
        render('admin/payments/new')
      end
    end

    def edit
      # Amount stays in cents — the view hands it to MoneyField, which takes
      # cents. (It used to be divided here, truncating $32.30 to $32.)
      @payment = Payment.find(params[:id])
      @payment_types = manual_payment_types
      @members = add_payment_member_models
      render('admin/payments/edit')
    end

    def update
      @payment = Payment.find(params[:id])

      if @payment.update(payment_attrs(update_params))
        flash[:success] = "#{ActiveSupport::NumberHelper.number_to_currency(@payment.amount / 100.0)} " \
                          "updated for #{@payment.user.full_name}"
        redirect_to(admin_payments_path)
      else
        Rollbar.info('Payment could not be updated.', errors: @payment.errors.full_messages)
        @payment_types = manual_payment_types
        @members = add_payment_member_models
        flash.now[:error] = @payment.errors.full_messages.to_sentence
        render('admin/payments/edit')
      end
    end

    def destroy
      @payment = Payment.find(params[:id])
      if @payment.destroy
        head(200)
      else
        head(422)
      end
    end

    def restore
      @payment = Payment.with_deleted.find(params[:id])
      if @payment.update(deleted_at: nil)
        head(200)
      else
        head(422)
      end
    end

    def upcoming_payments
      begin
        start_date = Date.parse(params[:start_date])
        end_date = Date.parse(params[:end_date])
      rescue TypeError, ArgumentError
        start_date = Date.today
        end_date = Date.today + 2.weeks
      end

      render(
        json: {
          payments: DashboardUtilities.upcoming_payments(start_date, end_date, current_season['id'])
        }
      )
    end

    def recent_payments
      begin
        start_date = Date.parse(params[:start_date])
        end_date = Date.parse(params[:end_date])
      rescue TypeError, ArgumentError
        start_date = Date.today - 1.week
        end_date = Date.today
      end

      render(
        json: {
          payments: DashboardUtilities.recent_payments(start_date, end_date, current_season['id'])
        }
      )
    end

    def behind_members
      render(json: { members: DashboardUtilities.behind_members(current_season['id']) })
    end

    def burndown_chart
      season_id = current_season['id']
      render(
        json: {
          scheduled: DashboardUtilities.season_scheduled_series(season_id),
          actual: DashboardUtilities.season_actual_series(season_id),
          today: Date.current.iso8601,
          currency: 'USD'
        }
      )
    end

    private

    def payments_query_params
      params.permit(:sort, :dir, :q, :type_id, :start_date, :end_date, :scope, :limit, :offset)
    end

    # The amount field is dollars; the column is integer cents. `.to_f` first,
    # so "32.30" doesn't truncate to 32 on the way through. Shared by create
    # and update — they drifted apart once already.
    def payment_attrs(permitted)
      attrs = permitted.to_h
      attrs[:amount] = (attrs[:amount].to_f * 100).round if attrs[:amount].present?
      attrs
    end

    # Payment types an admin can pick when recording a payment made outside the
    # system — Stripe rows are created by the checkout flow, never entered here.
    def manual_payment_types
      PaymentType.where.not(name: 'Stripe').order(:name).map { |t| { id: t.id, name: t.name } }
    end

    def add_payment_member_models
      Admin::AddPaymentPresenter.members_for(current_season)
    end

    def payment_params
      params.require(:payment).permit(:user_id, :payment_type_id, :amount, :date_paid, :notes)
    end

    # Same shape as `payment_params` — a payment recorded against the wrong
    # member is one of the likelier things you'd open this screen to fix.
    # Conversion to cents happens in `payment_attrs`, not here.
    def update_params
      params.require(:payment).permit(:user_id, :payment_type_id, :amount, :date_paid, :notes)
    end
  end
end
