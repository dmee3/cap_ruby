# frozen_string_literal: true
# typed: true

class EmailService
  extend T::Sig

  # Raised rather than rescued: a report that reached two of the three people
  # the reporter chose is not a partial success, and the screen has to be able
  # to say so instead of thanking them.
  class UndeliverableReport < StandardError; end

  class << self
    extend T::Sig

    sig { params(payment: Payment, user: User).void }
    def send_payment_submitted_email(payment, user)
      subject = "Payment submitted by #{user.full_name} for $#{payment.amount / 100}"
      text = "#{user.full_name} has submitted a payment for $#{payment.amount / 100}."
      [ENV.fetch('EMAIL_AARON', nil), ENV.fetch('EMAIL_DAN', nil)].each do |to|
        PostOffice.send_email(to, subject, text)
      end
    rescue StandardError => e
      Rollbar.error(e, user: user)
    end

    sig { params(conflict: Conflict, user: User, season_id: Integer).void }
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

      coordinators = User.with_role_for_season('coordinator', season_id)
      admins = User.with_role_for_season('admin', season_id)
      users_to_notify = coordinators + admins
      PostOffice.send_email(users_to_notify.map(&:email), subject, text)
    rescue StandardError => e
      Rollbar.error(e, user: user)
    end

    # A member editing their own pending conflict re-notifies whoever decides
    # it: the dates or reason they were about to rule on may have just moved.
    # Goes to coordinators and admins, never back to the member.
    sig { params(conflict: Conflict, user: User, season_id: Integer).void }
    def send_conflict_edited_email(conflict, user, season_id)
      role = user.seasons_users.select { |su| su.season_id == season_id }&.first
      subject = "Conflict updated by #{user.full_name}"
      text = <<~TEXT
        #{user.full_name} has updated their conflict for #{conflict.start_date}.\n\n
        Section: #{role&.ensemble} #{role&.section}\n
        Start: #{conflict.start_date}\n
        End: #{conflict.end_date}\n
        Reason: #{conflict.reason}
      TEXT

      coordinators = User.with_role_for_season('coordinator', season_id)
      admins = User.with_role_for_season('admin', season_id)
      PostOffice.send_email((coordinators + admins).map(&:email), subject, text)
    rescue StandardError => e
      Rollbar.error(e, user: user)
    end

    sig { params(email: String, report: String, recipient_ids: T::Array[T.untyped]).void }
    def send_whistleblower_email(email, report, recipient_ids)
      recipients = User.whistleblower_recipients.where(id: recipient_ids)
      addresses = recipients.filter_map { |user| user.email.presence }

      if addresses.length != recipient_ids.uniq.length
        raise UndeliverableReport,
              "report would reach #{addresses.length} of #{recipient_ids.uniq.length} chosen recipients"
      end

      email = '(Anonymous)' unless email.present?
      subject = 'Whistleblower Report'
      text = <<~TEXT
        Whistleblower report submitted at #{Time.now.strftime('%d/%m/%Y %l:%M %P')}.\n\n
        Email: #{email}\n
        Report:\n\n#{report}
      TEXT

      PostOffice.send_email(addresses, subject, text)
    end
  end
end
