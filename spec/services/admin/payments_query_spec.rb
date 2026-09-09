# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::PaymentsQuery do
  let(:season) { create(:season, year: '2026') }
  let(:other_season) { create(:season, year: '2025') }
  let(:cash) { create(:payment_type, name: 'Cash') }
  let(:venmo) { create(:payment_type, name: 'Venmo') }

  let(:anna) { create(:user, first_name: 'Anna', last_name: 'Zimmer') }
  let(:beto) { create(:user, first_name: 'Beto', last_name: 'Alvarez') }

  def payment(attrs)
    create(:payment, { season: season, payment_type: cash, user: anna }.merge(attrs))
  end

  describe '#call' do
    it 'returns the season rows newest-first by default with cents shapes' do
      old = payment(date_paid: Date.new(2026, 1, 1), amount: 10_000, user: beto, payment_type: venmo, notes: 'x')
      new = payment(date_paid: Date.new(2026, 3, 1), amount: 25_000)
      payment(date_paid: Date.new(2026, 2, 1), amount: 5000, season: other_season)

      result = described_class.new(season.id).call

      expect(result[:payments].map { |p| p[:id] }).to eq([new.id, old.id])
      expect(result[:payments].first).to include(
        id: new.id, amount_cents: 25_000, date_paid: '2026-03-01',
        payment_type: { id: cash.id, name: 'Cash' }, deleted: false
      )
      expect(result[:payments].first[:user]).to eq(id: anna.id, name: 'Anna Zimmer')
      expect(result[:total_count]).to eq(2)
      expect(result[:total_cents]).to eq(35_000)
      expect(result[:deleted_count]).to eq(0)
    end

    describe 'sorting' do
      before do
        payment(date_paid: Date.new(2026, 1, 10), amount: 30_000, user: anna, payment_type: venmo)
        payment(date_paid: Date.new(2026, 2, 10), amount: 10_000, user: beto, payment_type: cash)
      end

      it 'sorts by member last name' do
        result = described_class.new(season.id, sort: 'member', dir: 'asc').call
        expect(result[:payments].map { |p| p[:user][:name] }).to eq(['Beto Alvarez', 'Anna Zimmer'])
      end

      it 'sorts by amount' do
        result = described_class.new(season.id, sort: 'amount', dir: 'asc').call
        expect(result[:payments].map { |p| p[:amount_cents] }).to eq([10_000, 30_000])
      end

      it 'sorts by payment type name' do
        result = described_class.new(season.id, sort: 'type', dir: 'asc').call
        expect(result[:payments].map { |p| p[:payment_type][:name] }).to eq(%w[Cash Venmo])
      end

      it 'ignores an unknown sort key and falls back to date' do
        result = described_class.new(season.id, sort: 'evil; DROP TABLE payments').call
        expect(result[:payments].map { |p| p[:date_paid] }).to eq(%w[2026-02-10 2026-01-10])
      end
    end

    describe 'filtering' do
      before do
        payment(date_paid: Date.new(2026, 1, 15), amount: 10_000, user: anna, payment_type: cash)
        payment(date_paid: Date.new(2026, 2, 15), amount: 20_000, user: beto, payment_type: venmo)
        payment(date_paid: Date.new(2026, 3, 15), amount: 30_000, user: beto, payment_type: cash)
      end

      it 'filters by member name (case-insensitive, partial)' do
        result = described_class.new(season.id, q: 'alva').call
        expect(result[:payments].map { |p| p[:user][:name] }.uniq).to eq(['Beto Alvarez'])
        expect(result[:total_count]).to eq(2)
        expect(result[:total_cents]).to eq(50_000)
      end

      it 'filters by payment type' do
        result = described_class.new(season.id, type_id: venmo.id).call
        expect(result[:payments].map { |p| p[:amount_cents] }).to eq([20_000])
      end

      it 'filters by date range' do
        result = described_class.new(season.id, start_date: '2026-02-01', end_date: '2026-02-28').call
        expect(result[:payments].map { |p| p[:date_paid] }).to eq(['2026-02-15'])
      end
    end

    describe 'deleted scope' do
      let!(:live) { payment(date_paid: Date.new(2026, 1, 1), amount: 10_000) }
      let!(:gone) do
        p = payment(date_paid: Date.new(2026, 2, 1), amount: 40_000)
        p.destroy
        p
      end

      it 'hides deleted rows by default but still counts them' do
        result = described_class.new(season.id).call
        expect(result[:payments].map { |p| p[:id] }).to eq([live.id])
        expect(result[:deleted_count]).to eq(1)
      end

      it 'shows deleted rows when scope is with_deleted' do
        result = described_class.new(season.id, scope: 'with_deleted').call
        expect(result[:payments].map { |p| p[:id] }).to contain_exactly(live.id, gone.id)
        expect(result[:payments].find { |p| p[:id] == gone.id }[:deleted]).to be(true)
      end

      it 'shows only deleted rows when scope is deleted_only' do
        result = described_class.new(season.id, scope: 'deleted_only').call
        expect(result[:payments].map { |p| p[:id] }).to eq([gone.id])
      end

      it 'never includes deleted rows in the totals regardless of scope' do
        %w[active with_deleted deleted_only].each do |scope|
          result = described_class.new(season.id, scope: scope).call
          expect(result[:total_count]).to eq(1)
          expect(result[:total_cents]).to eq(10_000)
        end
      end
    end

    describe 'pagination' do
      before do
        (1..25).each { |n| payment(date_paid: Date.new(2026, 1, n), amount: 1000) }
      end

      it 'defaults to 20 rows and reports has_more' do
        result = described_class.new(season.id).call
        expect(result[:returned]).to eq(20)
        expect(result[:has_more]).to be(true)
        expect(result[:total_count]).to eq(25)
      end

      it 'honors limit and offset' do
        result = described_class.new(season.id, limit: 10, offset: 20).call
        expect(result[:returned]).to eq(5)
        expect(result[:has_more]).to be(false)
      end
    end
  end
end
