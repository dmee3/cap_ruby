require 'rails_helper'

RSpec.describe PaymentSchedule, type: :model do
  context 'scopes' do
    context 'for_season' do
      let(:season) { create(:season) }
      let(:other_season) { create(:season) }
      let(:schedule) { create(:payment_schedule, season: season) }
      let(:other_schedule) { create(:payment_schedule, season: other_season) }

      it 'returns schedules for the given season' do
        expect(described_class.for_season(season.id)).to eq([schedule])
      end
    end
  end
end
