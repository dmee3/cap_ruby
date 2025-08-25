# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auditions::Result do
  describe '.success' do
    it 'creates a successful result with data' do
      result = described_class.success('test data')

      expect(result).to be_success
      expect(result.data).to eq('test data')
      expect(result.errors).to be_empty
    end

    it 'creates a successful result with nil data' do
      result = described_class.success

      expect(result).to be_success
      expect(result.data).to be_nil
    end
  end

  describe '.failure' do
    it 'creates a failed result with single error' do
      result = described_class.failure('error message')

      expect(result).to be_failure
      expect(result.errors).to eq(['error message'])
      expect(result.data).to be_nil
    end

    it 'creates a failed result with multiple errors' do
      result = described_class.failure(['error 1', 'error 2'])

      expect(result).to be_failure
      expect(result.errors).to eq(['error 1', 'error 2'])
    end
  end

  describe '#success?' do
    it 'returns true for successful results' do
      result = described_class.success('data')
      expect(result.success?).to be true
    end

    it 'returns false for failed results' do
      result = described_class.failure('error')
      expect(result.success?).to be false
    end
  end

  describe '#failure?' do
    it 'returns false for successful results' do
      result = described_class.success('data')
      expect(result.failure?).to be false
    end

    it 'returns true for failed results' do
      result = described_class.failure('error')
      expect(result.failure?).to be true
    end
  end

  describe '#and_then' do
    it 'executes block for successful results' do
      result = described_class.success('initial data')

      chained = result.and_then do |data|
        described_class.success(data.upcase)
      end

      expect(chained).to be_success
      expect(chained.data).to eq('INITIAL DATA')
    end

    it 'returns self for failed results without executing block' do
      result = described_class.failure('error')
      block_executed = false

      chained = result.and_then do |_data|
        block_executed = true
        described_class.success('should not execute')
      end

      expect(chained).to be_failure
      expect(chained.errors).to eq(['error'])
      expect(block_executed).to be false
    end

    it 'can chain multiple operations' do
      result = described_class.success(5)
                              .and_then { |n| described_class.success(n * 2) }
                              .and_then { |n| described_class.success(n + 3) }

      expect(result).to be_success
      expect(result.data).to eq(13)
    end

    it 'stops chain on first failure' do
      result = described_class.success(5)
                              .and_then { |n| described_class.success(n * 2) }
                              .and_then { |_n| described_class.failure('stop here') }
                              .and_then { |_n| described_class.success('should not execute') }

      expect(result).to be_failure
      expect(result.errors).to eq(['stop here'])
    end
  end

  describe '#to_s' do
    it 'formats successful results' do
      result = described_class.success('test data')
      expect(result.to_s).to eq('Success(test data)')
    end

    it 'formats failed results' do
      result = described_class.failure(['error 1', 'error 2'])
      expect(result.to_s).to eq('Failure(error 1, error 2)')
    end
  end
end
