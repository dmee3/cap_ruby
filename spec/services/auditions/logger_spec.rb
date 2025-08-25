# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auditions::Logger do
  include AuditionsHelpers

  describe '.info' do
    it 'logs info messages with AUDITIONS prefix' do
      capture_logs do |logs|
        described_class.info('Test message')

        expect(logs).to have_received(:info).with('[AUDITIONS] Test message')
      end
    end

    it 'logs info messages with context' do
      capture_logs do |logs|
        described_class.info('Test message', { key: 'value' })

        expect(logs).to have_received(:info).with('[AUDITIONS] Test message: {"key":"value"}')
      end
    end
  end

  describe '.warn' do
    it 'logs warning messages with AUDITIONS prefix' do
      capture_logs do |logs|
        described_class.warn('Warning message')

        expect(logs).to have_received(:warn).with('[AUDITIONS] Warning message')
      end
    end
  end

  describe '.error' do
    it 'logs error messages with AUDITIONS prefix' do
      capture_logs do |logs|
        described_class.error('Error message')

        expect(logs).to have_received(:error).with('[AUDITIONS] Error message')
      end
    end

    it 'logs exception details when provided' do
      capture_logs do |logs|
        error = StandardError.new('Test error')
        allow(error).to receive(:full_message).and_return('Full error message')

        described_class.error('Error occurred', error)

        expect(logs).to have_received(:error).with('[AUDITIONS] Error occurred')
        expect(logs).to have_received(:error).with('Full error message')
      end
    end

    it 'handles errors without full_message method' do
      capture_logs do |logs|
        error = double('CustomError', message: 'Test error')
        allow(error).to receive(:respond_to?).with(:full_message).and_return(false)
        allow(error).to receive(:respond_to?).with(:message).and_return(true)
        allow(error).to receive(:respond_to?).with(:backtrace).and_return(false)

        described_class.error('Error occurred', error, { context: 'test' })

        expect(logs).to have_received(:error).with('[AUDITIONS] Error occurred: {"context":"test"}')
        expect(logs).to have_received(:error).with('Error details: Test error')
      end
    end
  end

  describe '.debug' do
    it 'logs debug messages with AUDITIONS prefix' do
      capture_logs do |logs|
        described_class.debug('Debug message', { debug: true })

        expect(logs).to have_received(:debug).with('[AUDITIONS] Debug message: {"debug":true}')
      end
    end
  end

  describe '.step' do
    it 'logs step start and completion for successful results' do
      capture_logs do |logs|
        result = described_class.step('test operation') do
          Auditions::Result.success('completed')
        end

        expect(result).to be_success
        expect(result.data).to eq('completed')

        expect(logs).to have_received(:info).with('[AUDITIONS] Starting test operation')
        expect(logs).to have_received(:info).with(match(/\[AUDITIONS\] Completed test operation.*duration_ms/))
      end
    end

    it 'logs step failure for failed results' do
      capture_logs do |logs|
        result = described_class.step('test operation') do
          Auditions::Result.failure('operation failed')
        end

        expect(result).to be_failure

        expect(logs).to have_received(:info).with('[AUDITIONS] Starting test operation')
        expect(logs).to have_received(:error).with(match(/\[AUDITIONS\] Failed test operation.*duration_ms/))
      end
    end

    it 'logs step exception and re-raises' do
      capture_logs do |logs|
        expect do
          described_class.step('test operation') do
            raise StandardError, 'Something went wrong'
          end
        end.to raise_error(StandardError, 'Something went wrong')

        expect(logs).to have_received(:info).with('[AUDITIONS] Starting test operation')
        expect(logs).to have_received(:error).with(match(/\[AUDITIONS\] Failed test operation with exception.*duration_ms/))
      end
    end

    it 'includes context in step logging' do
      capture_logs do |logs|
        described_class.step('test operation', { user_id: 123 }) do
          'success'
        end

        expect(logs).to have_received(:info).with('[AUDITIONS] Starting test operation: {"user_id":123}')
      end
    end

    it 'measures execution time' do
      capture_logs do |logs|
        # Mock time to ensure consistent timing
        start_time = Time.current
        end_time = start_time + 0.5 # 500ms

        allow(Time).to receive(:current).and_return(start_time, end_time)

        described_class.step('test operation') do
          Auditions::Result.success('done')
        end

        expect(logs).to have_received(:info).with('[AUDITIONS] Completed test operation: {"duration_ms":500.0}')
      end
    end
  end

  describe 'private methods' do
    describe '.format_message' do
      it 'formats message without context' do
        message = described_class.send(:format_message, 'Test', {})
        expect(message).to eq('[AUDITIONS] Test')
      end

      it 'formats message with context as JSON' do
        message = described_class.send(:format_message, 'Test', { key: 'value' })
        expect(message).to eq('[AUDITIONS] Test: {"key":"value"}')
      end
    end
  end
end
