# frozen_string_literal: true

module Admin
  class PaymentsController < AdminController
    QUERY_KEYS = %i[sort dir q type_id start_date end_date scope limit offset].freeze

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

    def new
      @payment = Payment.new
      @payment.user_id = params[:user_id] if params[:user_id]
      @payment_types = manual_payment_types
      @payment.payment_type_id = preselected_payment_type_id(params[:payment_type])
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

      # Strong params would drop a stray user_id silently. An attempt to move
      # a payment between members is worth refusing out loud, not absorbing.
      if reassignment_attempted?
        Rollbar.info('Rejected an attempt to reassign a payment', payment_id: @payment.id)
        return head(:unprocessable_entity)
      end

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

    private

    # Sliced before permitting: `permit` on the whole params hash treats the
    # always-present `:format`, `:controller` and `:action` as unpermitted and
    # logs them on every JSON request.
    def payments_query_params
      params.slice(*QUERY_KEYS).permit(*QUERY_KEYS)
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

    # Resolved against the types the form actually offers, so a stale or
    # Stripe-valued link leaves the select on its placeholder instead of
    # preselecting something the admin cannot submit. Depends on
    # @payment_types already being built.
    def preselected_payment_type_id(name)
      return nil if name.blank?

      @payment_types.find { |t| t[:name].casecmp?(name) }&.fetch(:id)
    end

    def add_payment_member_models
      Admin::AddPaymentPresenter.members_for(current_season)
    end

    def payment_params
      params.require(:payment).permit(:user_id, :payment_type_id, :amount, :date_paid, :notes)
    end

    # A user_id that differs from the record's own is a reassignment attempt.
    # One matching the current owner is harmless — the form may echo it back.
    def reassignment_attempted?
      submitted = params.dig(:payment, :user_id)
      submitted.present? && submitted.to_s != @payment.user_id.to_s
    end

    # Deliberately NO `:user_id` — a payment can't be moved between members.
    # Reassigning one silently rewrites two members' dues histories, so the
    # supported path is delete-and-re-record, which leaves an audit trail.
    # This is enforced here rather than only in the form: a permitted param is
    # reachable by anyone who can craft a request.
    # Conversion to cents happens in `payment_attrs`, not here.
    def update_params
      params.require(:payment).permit(:payment_type_id, :amount, :date_paid, :notes)
    end
  end
end
