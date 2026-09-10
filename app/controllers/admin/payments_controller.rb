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
      attrs = payment_params.to_h
      # The form field is dollars; store cents. `.to_f` first so "32.30" doesn't
      # truncate to 32 via the integer column before the ×100.
      attrs[:amount] = (attrs[:amount].to_f * 100).round if attrs[:amount].present?
      @payment = Payment.new(attrs)
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
      @payment = Payment.find(params[:id])
      @payment.amount /= 100
      render('admin/payments/edit')
    end

    def update
      @payment = Payment.find(params[:id])
      if @payment.update(update_params.reject { |_k, v| v.blank? }) # only update non-empty fields
        flash[:success] = 'Payment updated'
        redirect_to('/admin/payments')
      else
        Rollbar.info('Payment could not be updated.', errors: @payment.errors.full_messages)
        flash[:error] = 'Unable to update payment'
        redirect_to("/admin/payments/edit/#{@payment.id}")
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

    # Payment types an admin can pick when recording a payment made outside the
    # system — Stripe rows are created by the checkout flow, never entered here.
    def manual_payment_types
      PaymentType.where.not(name: 'Stripe').order(:name).map { |t| { id: t.id, name: t.name } }
    end

    # Per-member view-model for the add-payment form + its projection panel.
    # Everything the panel needs so a member switch doesn't refetch.
    def add_payment_member_models
      season_id = current_season['id']
      User.members_for_season(season_id).with_payments.order(:last_name, :first_name).map do |member|
        summary = PaymentService.member_dues_summary(member, season_id)
        {
          id: member.id,
          name: member.full_name,
          paid_before_cents: summary[:paid],
          season_total_cents: summary[:total],
          expected_cents: summary[:expected],
          applies_to: (summary[:remaining_installments] || []).first(2).map { |e| e[:pay_date].iso8601 }
        }
      end
    end

    def payment_params
      params.require(:payment).permit(:user_id, :payment_type_id, :amount, :date_paid, :notes)
    end

    def update_params
      params.require(:payment).permit(:payment_type_id, :amount, :date_paid, :notes).tap do |p|
        p[:amount] = p[:amount].to_i * 100 if p[:amount] # Convert to cents
      end
    end
  end
end
