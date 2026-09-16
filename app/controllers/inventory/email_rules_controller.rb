# frozen_string_literal: true

module Inventory
  class EmailRulesController < InventoryController
    before_action -> { redirect_if_not('admin', 'coordinator') }
    # create/update re-render the form on failure, so they need its collections
    # too or the rejected submit raises instead of showing what to fix.
    before_action :set_form_variables, only: %i[new edit create update]
    before_action :set_email_rule, only: %i[edit update destroy]

    def index
      @rules = EmailRule.includes(:user, :inventory_item).sort_by { |r| r.inventory_item.name.downcase }
      watched_ids = @rules.map(&:inventory_item_id).uniq
      @watched_item_count = watched_ids.length
      @unwatched_count = Item.where.not(id: watched_ids).count
      # The prompt names a real gap rather than a hypothetical one: something
      # already at zero that nobody is being told about.
      @unwatched_zero = Item.where.not(id: watched_ids).find_by(quantity: 0)
    end

    def new
      @rule = EmailRule.new(inventory_item_id: params[:inventory_item_id])
    end

    def create
      @rule = EmailRule.new(rule_params)
      if @rule.save
        flash[:success] = 'Created rule'
        redirect_to inventory_email_rules_path
      else
        flash.now[:error] = @rule.errors.full_messages.to_sentence
        render :new
      end
    end

    def edit; end

    # Linked only from inside the edit form, so a delete always follows a
    # deliberate open rather than sitting next to a list row.
    def destroy
      @rule.destroy
      flash[:success] = 'Deleted alert'
      redirect_to inventory_email_rules_path
    end

    def update
      if @rule.update(rule_params)
        flash[:success] = 'Updated rule'
        redirect_to inventory_email_rules_path
      else
        flash.now[:error] = @rule.errors.full_messages.to_sentence
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
