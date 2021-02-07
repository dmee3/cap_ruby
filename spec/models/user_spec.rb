# == Schema Information
#
# Table name: users
#
#  id              :integer          not null, primary key
#  deleted_at      :datetime
#  email           :string
#  first_name      :string
#  last_name       :string
#  password_digest :string
#  phone           :string
#  reset_key       :string
#  username        :string
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  role_id         :integer
#
# Indexes
#
#  index_users_on_deleted_at  (deleted_at)
#  index_users_on_email       (email) UNIQUE
#  index_users_on_role_id     (role_id)
#  index_users_on_username    (username) UNIQUE
#
require 'rails_helper'

RSpec.describe User, type: :model do
  context 'validations' do
    let(:user2) { create(:user) }

    subject { create(:user) }

    it { is_expected.to be_valid }

    it 'requires an email' do
      subject.email = nil
      expect(subject).to_not be_valid
    end

    it 'requires a unique email' do
      subject.email = user2.email
      expect(subject).to_not be_valid
    end

    it 'requires a first name' do
      subject.first_name = nil
      expect(subject).to_not be_valid
    end

    it 'requires a last name' do
      subject.last_name = nil
      expect(subject).to_not be_valid
    end

    it 'requires a password' do
      subject.password = nil
      expect(subject).to_not be_valid
    end

    it 'requires a password of length >= 6' do
      subject.password = '12345'
      expect(subject).to_not be_valid
    end

    it 'requires a password confirmation matching password' do
      subject.password_confirmation = "#{subject.password}abc"
      expect(subject).to_not be_valid
    end

    it 'requires a role' do
      subject.role_id = nil
      expect(subject).to_not be_valid
    end

    it 'requires a username' do
      subject.username = nil
      expect(subject).to_not be_valid
    end

    it 'requires a unique username' do
      subject.username = user2.username
      expect(subject).to_not be_valid
    end
  end

  context 'scopes' do
    let(:season) { create(:season, year: '2019') }
    let(:last_season) { create(:season, year: '2018') }
    let!(:current_user) { create(:user, seasons: [season]) }
    let!(:old_user) { create(:user, seasons: [last_season]) }
    let(:admin_role) { create(:role, name: 'admin') }
    let!(:admin_user) { create(:user, role: admin_role) }

    context 'for_season' do
      it 'returns users for the given season' do
        expect(described_class.for_season(season.id)).to eq([current_user])
      end
    end

    context 'with_role' do
      it 'returns users of the given role' do
        expect(described_class.with_role('admin')).to eq([admin_user])
      end
    end
  end

  context 'instance methods' do
    let(:season) { create(:season) }
    let(:user) { build(:user, seasons: [season]) }

    context 'full_name' do
      subject { user.full_name }

      context 'with first and last name' do
        it { is_expected.to eq("#{user.first_name} #{user.last_name}") }
      end

      context 'with only first name' do
        before { user.last_name = nil }
        it { is_expected.to eq(user.first_name) }
      end
    end

    context 'dues_status_okay?' do
      subject { user.dues_status_okay?(season.id) }

      let(:schedule) do
        create(:payment_schedule).tap do |s|
          s.entries << create(
            :payment_schedule_entry,
            amount: dues_amount,
            pay_date: Date.yesterday,
            payment_schedule: s
          )
        end
      end

      before do
        allow(user).to receive(:payment_schedule_for).and_return(schedule)
        allow(user).to receive(:amount_paid_for).and_return(100)
      end

      context 'who are caught-up' do
        let(:dues_amount) { 50 }
        it { is_expected.to be(true) }
      end

      context 'who are behind' do
        let(:dues_amount) { 250 }
        it { is_expected.to be(false) }
      end
    end

    context 'amount_paid_for' do
      let!(:season) { create(:season) }
      let!(:user) { create(:user, seasons: [season]) }
      let!(:payment1) { create(:payment, season: season, user: user) }
      let!(:payment2) { create(:payment, season: season, user: user) }

      subject { user.amount_paid_for(season.id) }

      it { is_expected.to eq(payment1.amount + payment2.amount) }
    end

    context 'payment_schedule_for' do
      let!(:season) { create(:season) }
      let!(:user) { create(:user, seasons: [season]) }

      subject { user.payment_schedule_for(season.id) }

      it { is_expected.to eq(user.payment_schedules[0]) }
    end

    context 'total_dues_for' do
      let!(:season) { create(:season) }
      let!(:user) { create(:user, seasons: [season]) }

      before { user.payment_schedules << PaymentSchedule.create(user_id: user.id, season_id: season.id) }

      subject { user.total_dues_for(season.id) }

      it { is_expected.to eq(user.payment_schedule_for(season.id).entries.sum(&:amount)) }
    end

    context 'is?' do
      let(:user) { build(:user) }

      subject { user.is?(role_name) }

      context 'when role matches' do
        let(:role_name) { user.role.name.to_s }
        it { is_expected.to be(true) }
      end

      context 'when role does not match' do
        let(:role_name) { "#{user.role.name}banana" }
        it { is_expected.to be(false) }
      end
    end
  end

  context 'save hooks' do
    context 'before save' do
      let(:email) { 'ABC@DEF.GHI' }
      let(:username) { 'BSAMPSON' }
      let(:user) { build(:user, email: email, username: username) }

      it 'forces email to lower case' do
        user.save
        expect(user.email).to eq(email.downcase)
      end

      it 'forces username to lower case' do
        user.save
        expect(user.username).to eq(username.downcase)
      end
    end
  end
end
