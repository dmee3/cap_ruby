# frozen_string_literal: true

module Users
  # Devise's default sign-out redirect lands on `root_path`, which requires
  # authentication. The just-signed-out user therefore trips `authenticate_user!`,
  # and Warden's failure app stamps the "You need to sign in or sign up before
  # continuing." alert on its way to /login — scolding someone for doing exactly
  # what they asked to do.
  #
  # Sending them to the login page directly skips that bounce. Sign-out itself is
  # untouched: Devise has already reset the session and cleared the remember-me
  # cookie by the time `after_sign_out_path_for` is consulted, so this changes
  # only where the browser lands, never what gets invalidated.
  class SessionsController < Devise::SessionsController
    private

    def after_sign_out_path_for(_resource_or_scope)
      new_user_session_path
    end
  end
end
