# frozen_string_literal: true

class WhistleblowersController < ApplicationController
  before_action :authenticate_user!

  def index
    @form = {
      recipients: recipient_options,
      minimum: User.whistleblower_minimum
    }
  end

  def create
    minimum = User.whistleblower_minimum
    picked = Array(params[:recipients]).compact_blank

    if minimum.zero?
      flash.now[:error] = 'Nobody is set up to receive reports yet. Ask an admin to set that up.'
      return render_index
    end

    if picked.length < minimum
      flash.now[:error] = "Please select at least #{minimum} #{'person'.pluralize(minimum)} to notify."
      return render_index
    end

    EmailService.send_whistleblower_email(params[:email].to_s, params[:report].to_s, picked)

    # Only what the confirmation screen needs to name: who received it, and
    # whether a reply is possible. Never the report, and never who sent it.
    flash[:report_sent] = {
      'recipients' => User.whistleblower_recipients.where(id: picked).map(&:full_name),
      'contactable' => params[:email].present?
    }
    redirect_to(sent_whistleblowers_path)
  rescue EmailService::UndeliverableReport => e
    # The reporter chose these people, and some of them can't be reached. Saying
    # "sent" here would be a lie about the one thing this screen promises.
    Rails.logger.error("Whistleblower report undeliverable: #{e.message}")
    flash.now[:error] =
      "We couldn't deliver this to everyone you picked, so we didn't send it at all. " \
      'Please tell an admin, and try picking a different group.'
    render_index
  rescue StandardError => e
    # No `user:`, and params are scrubbed of `report` in the Rollbar
    # initializer — a failure here must not become a record of who said what.
    Rails.logger.error("Whistleblower report failed: #{e.class}")
    Rollbar.error(e, user: nil)
    flash.now[:error] = 'Our system has encountered an error. Please try again.'
    render_index
  end

  def sent
    @sent = flash[:report_sent]
    redirect_to(whistleblowers_path) if @sent.blank?
  end

  private

  def render_index
    index
    render(:index)
  end

  def recipient_options
    User.whistleblower_recipients.map do |user|
      {
        id: user.id,
        name: user.full_name,
        initials: user.initials,
        detail: recipient_detail(user)
      }
    end
  end

  # Role and section, the only descriptors that exist. The design drew
  # hand-written ones ("runs dues"); there's no field for those, and a last name
  # already does most of the work of telling two people apart.
  def recipient_detail(user)
    season_id = current_season && current_season['id']
    row = season_id && user.seasons_users.find { |su| su.season_id == season_id }
    [row&.role&.capitalize, row&.section].compact_blank.join(' · ').presence
  end
end
