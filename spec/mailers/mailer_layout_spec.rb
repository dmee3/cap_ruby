# frozen_string_literal: true

require 'rails_helper'

# The layout owns the HTML document, so a view that brings its own <html> nests
# a second one inside it.
RSpec.describe 'Mailer layout' do
  let(:user) { create(:user) }

  def inventory_mail(operator)
    category = Inventory::Category.create!(name: 'Sticks')
    item = Inventory::Item.create!(name: 'Snare sticks', quantity: 4, category: category)
    rule = Inventory::EmailRule.create!(inventory_item: item, mail_to_user_id: user.id, threshold: 5,
                                        operator: operator)
    InventoryMailer.with(user_id: user.id, item_name: item.name, rule_id: rule.id).inventory_email
  end

  let(:mails) do
    {
      welcome: UserMailer.with(user: user).welcome_email,
      calendar: CalendarMailer.with(user_id: user.id, donation_dates: [3, 4], donor_name: 'Ana').calendar_email,
      download: CalendarMailer.with(user_name: 'Iris').download_email,
      inventory: inventory_mail('lt')
    }
  end

  it 'renders exactly one branded HTML document for every mailer' do
    mails.each do |name, mail|
      html = mail.html_part.body.to_s

      expect(html.scan(/<html/i).size).to eq(1), "#{name} rendered #{html.scan(/<html/i).size} <html> elements"
      expect(html).to include('/images/email/wordmark.png'), "#{name} is missing the header"
    end
  end

  it 'points the wordmark at a file that exists' do
    expect(Rails.public_path.join('images/email/wordmark.png')).to exist
  end

  it 'gives a gt_eq inventory rule its own sentence' do
    expect(inventory_mail('gt_eq').text_part.body.to_s).to include('has reached 5')
  end
end
