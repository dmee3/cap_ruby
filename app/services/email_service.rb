# frozen_string_literal: true

class EmailService
  class << self
    def send_payment_submitted_email(payment, user)
      subject = "Payment submitted by #{user.full_name} for $#{payment.amount / 100}"
      text = "#{user.full_name} has submitted a payment for $#{payment.amount / 100}."
      [ENV['EMAIL_AARON'], ENV['EMAIL_DAN']].each do |to|
        PostOffice.send_email(to, subject, text)
      end
    rescue StandardError => e
      Rollbar.error(e, user: user)
    end

    def send_conflict_submitted_email(conflict, user, season_id)
      role = user.seasons_users.select { |su| su.season_id == season_id }&.first
      subject = "Conflict submitted by #{user.full_name}"
      text = <<~TEXT
        #{user.full_name} has submitted a conflict for #{conflict.start_date}.\n\n
        Section: #{role.ensemble} #{role.section}\n
        Start: #{conflict.start_date}\n
        End: #{conflict.end_date}\n
        Reason: #{conflict.reason}
      TEXT

      users_to_notify = User.with_role_for_season("coordinator", season_id) + User.with_role_for_season("admin", season_id)
      PostOffice.send_email(users_to_notify.map(&:email), subject, text)
    rescue StandardError => e
      Rollbar.error(e, user: user)
    end

    def send_whistleblower_email(email, report)
      email = '(Anonymous)' unless email.present?
      subject = 'Whistleblower Report'
      text = <<~TEXT
        Whistleblower report submitted at #{Time.now.strftime('%d/%m/%Y %l:%M %P')}.\n\n
        Email: #{email}\n
        Report:\n\n#{report}
      TEXT

      [ENV['EMAIL_AARON'], ENV['EMAIL_DONNIE'], ENV['EMAIL_DAN'], ENV['EMAIL_GARRETT']].each do |to|
        PostOffice.send_email(to, subject, text)
      end
    end
  end
end
