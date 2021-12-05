# frozen_string_literal: true

module Inventory
  class EmailRulesController < InventoryController
    before_action -> { redirect_if_not('admin', 'coordinator') }
    before_action :set_form_variables, only: %i[new edit]
    before_action :set_email_rule, only: %i[edit update]

    def index
      @rules = EmailRule.all
    end

    def new
      @rule = EmailRule.new
    end

    def create
      @rule = EmailRule.new(rule_params)
      if @rule.save
        flash[:success] = "Created rule"
        redirect_to inventory_email_rules_path
      else
        flash.now[:error] = @rule.errors.full_messages
        render :new
      end
    end

    def edit; end

    def update
      if @rule.update(rule_params)
        flash[:success] = "Updated rule"
        redirect_to inventory_email_rules_path
      else
        flash.now[:error] = @rule.errors.full_messages
        render :edit
      end
    end

    private

    def set_form_variables
      admins = User.with_role_for_season('admin', current_season['id'])
      coordinators = User.with_role_for_season('coordinator', current_season['id'])
      @users = (admins + coordinators).sort_by(&:full_name)
      @categories = Category.includes(:items).all
    end

    def set_email_rule
      @rule = EmailRule.find(params[:id])
    end

    def rule_params
      params.require(:inventory_email_rule).permit(
        :inventory_item_id, :operator, :threshold, :mail_to_user_id
      )
    end
  end
end
