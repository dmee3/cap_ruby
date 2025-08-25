# frozen_string_literal: true

module AuditionsHelpers
  def sample_packet_order
    {
      'customerEmail' => 'packet.user@example.com',
      'createdOn' => '2025-09-01T12:00:00Z',
      'lineItems' => [
        {
          'productName' => 'Cap City 2026 Battery Audition Packet',
          'customizations' => [
            { 'label' => 'Name', 'value' => 'John Doe' },
            { 'label' => 'City', 'value' => 'Columbus' },
            { 'label' => 'State', 'value' => 'OH' },
            { 'label' => 'Instrument', 'value' => 'Snare' }
          ]
        }
      ]
    }
  end

  def sample_registration_order
    {
      'customerEmail' => 'registration.user@example.com',
      'createdOn' => '2025-09-01T15:30:00Z',
      'lineItems' => [
        {
          'productName' => 'CC26 Music Ensemble Audition Registration',
          'customizations' => [
            { 'label' => 'First Name', 'value' => 'Jane' },
            { 'label' => 'Last Name', 'value' => 'Smith' },
            { 'label' => 'City', 'value' => 'Toledo' },
            { 'label' => 'State', 'value' => 'Ohio' },
            { 'label' => 'Primary Instrument', 'value' => 'Marimba' },
            { 'label' => 'Preferred Pronouns', 'value' => 'she/her' },
            { 'label' => 'Shoe Size', 'value' => '8' },
            { 'label' => 'Shirt Size', 'value' => 'M' },
            { 'label' => 'Birthdate', 'value' => '2000-05-15' },
            { 'label' => 'Experience', 'value' => '3 years high school' },
            { 'label' => 'Known Conflicts', 'value' => 'Work on weekends' }
          ]
        }
      ]
    }
  end

  def sample_invalid_order
    {
      'customerEmail' => '',
      'createdOn' => '2025-09-01T12:00:00Z',
      'lineItems' => []
    }
  end

  def sample_orders
    [sample_packet_order, sample_registration_order]
  end

  def mock_squarespace_api_with_success(orders = sample_orders)
    allow(External::SquarespaceApi).to receive(:orders).and_return(orders)
  end

  def mock_squarespace_api_with_failure(error_class = Faraday::TimeoutError)
    allow(External::SquarespaceApi).to receive(:orders).and_raise(error_class.new('Test error'))
  end

  def mock_google_sheets_api
    allow(External::GoogleSheetsApi).to receive(:clear_sheet)
    allow(External::GoogleSheetsApi).to receive(:format_sheet)
    allow(External::GoogleSheetsApi).to receive(:write_sheet)
    allow(External::GoogleSheetsApi).to receive(:read_sheet).and_return([])
  end

  def with_test_auditions_year(year = '2026')
    old_year = ENV.fetch('AUDITIONS_YEAR', nil)
    ENV['AUDITIONS_YEAR'] = year

    # Reset configuration cache
    Auditions::Configuration.reset!

    yield
  ensure
    if old_year
      ENV['AUDITIONS_YEAR'] = old_year
    else
      ENV.delete('AUDITIONS_YEAR')
    end
    Auditions::Configuration.reset!
  end

  def capture_logs
    logs = []
    original_logger = Rails.logger

    # Create a spy logger that captures calls
    test_logger = spy('TestLogger')
    allow(test_logger).to receive(:info) { |msg| logs << { level: :info, message: msg } }
    allow(test_logger).to receive(:warn) { |msg| logs << { level: :warn, message: msg } }
    allow(test_logger).to receive(:error) { |msg| logs << { level: :error, message: msg } }
    allow(test_logger).to receive(:debug) { |msg| logs << { level: :debug, message: msg } }

    allow(Rails).to receive(:logger).and_return(test_logger)

    yield test_logger
  ensure
    allow(Rails).to receive(:logger).and_return(original_logger)
  end

  # Matcher for testing Result objects
  RSpec::Matchers.define :be_success do
    match do |result|
      result.respond_to?(:success?) && result.success?
    end

    failure_message do |result|
      "expected #{result} to be a success, but got errors: #{if result.respond_to?(:errors)
                                                               result.errors
                                                             end}"
    end
  end

  RSpec::Matchers.define :be_failure do
    match do |result|
      result.respond_to?(:failure?) && result.failure?
    end

    failure_message do |result|
      "expected #{result} to be a failure"
    end
  end

  RSpec::Matchers.define :have_error_containing do |text|
    match do |result|
      result.respond_to?(:errors) &&
        result.errors.any? { |error| error.include?(text) }
    end

    failure_message do |result|
      "expected result to have error containing '#{text}', but got errors: #{if result.respond_to?(:errors)
                                                                               result.errors
                                                                             end}"
    end
  end
end
