# frozen_string_literal: true

module Users
  # Devise's default sign-out redirect goes to root_path, which requires auth —
  # so the user trips authenticate_user! and gets an "unauthenticated" alert for
  # signing out. Going to /login directly skips that bounce; the session is
  # already destroyed by the time after_sign_out_path_for runs.
  class SessionsController < Devise::SessionsController
    private

    def after_sign_out_path_for(_resource_or_scope)
      new_user_session_path
    end
  end
end
