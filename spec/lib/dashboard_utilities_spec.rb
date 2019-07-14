require 'rails_helper'

RSpec.describe DashboardUtilities do
  context 'payment_sums_by_week' do
    let!(:season1) { create(:season) }
    let!(:season2) { create(:season) }
    let!(:vet) { create(:user, seasons: [season1, season2]) }
    let!(:rookie) { create(:user, seasons: [season2]) }
    let(:payment_type) { create(:payment_type) }

    subject { DashboardUtilities.payment_sums_by_week(season2.id) }

    before do
      10.times do
        s = [true, true, false].sample ? season2 : season1
        u = [true, false].sample ? vet : rookie
        u = vet if s.id == season1.id
        create(
          :payment,
          payment_type: payment_type,
          season: s,
          user: u
        )
      end
    end

    it 'returns a 2d array of days and amounts' do
      expect(subject.class).to be(Array)
      expect(subject[0].class).to be(Array)
      expect(subject[0][0].class).to be(Date)
      expect(subject[0][1].class).to be(Float)
    end
  end
end
