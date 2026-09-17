# frozen_string_literal: true

module Users
  # Devise answers a reset request and an expired token with a redirect and a
  # flash. "Did that work?" is the whole question at both of those moments, so
  # each one gets a screen instead.
  class PasswordsController < Devise::PasswordsController
    def sent
      @sent_to = flash[:reset_email]
      redirect_to(new_password_path(resource_name)) and return if @sent_to.blank?

      self.resource = resource_class.new
    end

    def expired
      self.resource = resource_class.new
    end

    # Devise renders :edit for a bad or expired token only after the user has
    # submitted it; arriving with one that's already spent lands here first.
    def edit
      super

      return if params[:reset_password_token].blank?

      token = Devise.token_generator.digest(
        resource_class, :reset_password_token, params[:reset_password_token]
      )
      user = resource_class.find_by(reset_password_token: token)
      redirect_to(expired_password_path) unless user&.reset_password_period_valid?
    end

    private

    # The address travels in the flash rather than the query string: a reset
    # URL gets shared and forwarded, and it shouldn't carry someone's email.
    def after_sending_reset_password_instructions_path_for(resource_name)
      flash[:reset_email] = params.dig(resource_name, :email)
      sent_password_path
    end
  end
end
