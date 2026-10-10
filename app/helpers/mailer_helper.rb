# frozen_string_literal: true

# Email clients drop <style> blocks and CSS variables, so everything a mailer
# view styles goes through these inline values instead of the app's tokens.
module MailerHelper
  EMAIL_COLORS = {
    raspberry: '#CC2F44',
    ocean: '#386374',
    moss: '#8B9556',
    jet: '#1D1E20',
    flash: '#E9EBEC'
  }.freeze

  EMAIL_FONT = "Figtree, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"

  # Served from public/ rather than through Vite: a sent email keeps pointing
  # at this URL for years, and Vite's fingerprinted paths change every deploy.
  def email_wordmark_url
    URI.join(root_url, '/images/email/wordmark.png').to_s
  end

  # A table cell carries the background because Outlook ignores padding and
  # background on a bare <a>.
  def email_button(label, url)
    link = link_to(label, url, style: 'display: inline-block; padding: 12px 24px; color: #ffffff; ' \
                                      "font-family: #{EMAIL_FONT}; font-size: 16px; font-weight: 600; " \
                                      'text-decoration: none;')

    tag.table(role: 'presentation', cellspacing: 0, cellpadding: 0, border: 0, style: 'margin: 24px 0;') do
      tag.tr do
        tag.td(link, style: "background-color: #{EMAIL_COLORS[:ocean]}; border-radius: 4px;")
      end
    end
  end
end
