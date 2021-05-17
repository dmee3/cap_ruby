class Admin::CalendarsController < AdminController
  def index
    @total = donations.sum(&:donation_date)
    @donations_by_person = donations.group_by { |d| d.user.full_name }
  end

  private

  def donations
    @donations ||= Calendar::Donation.all
  end
end
