# Auditions Package Cleanup Plan

## Current Pain Points

After analyzing the `app/services/auditions/` code, several maintenance and reliability issues are evident:

### 1. **Tight Coupling & Hard-coded Values**
- Product names are hard-coded in constants (`Registration::PRODUCT_NAMES`, `Packet::PRODUCT_NAMES`) requiring annual updates
- Squarespace field mappings are brittle (`FIELD_TO_SYMBOL`, `TYPE_MAP`)
- Date ranges hard-coded in `SquarespaceApi` (`ORDER_START_DATE`, `ORDER_END_DATE`)

### 2. **Poor Error Handling**
- No validation of API responses or custom field parsing
- Silent failures when expected fields are missing
- No logging or debugging information

### 3. **Complex Data Flow**
- `SpreadsheetService` orchestrates everything but logic is scattered
- Data transformation happens in multiple places with no clear boundaries
- `PacketAndRegistrationWriterService` has massive methods doing too much

### 4. **No Testing**
- Critical business logic has no test coverage
- External API dependencies make testing difficult
- Complex data transformations are untestable in current form

### 5. **Hard to Debug**
- No logging when things break
- Data transformations happen in nested loops
- Sheet formatting mixed with data preparation

## Proposed Solution

### Phase 1: Extract Configuration (Low Risk)

**Goal**: Make year-to-year updates easier and more reliable.

1. **Create Configuration System**
   ```ruby
   # app/services/auditions/configuration.rb
   class Auditions::Configuration
     def self.current_year
       @current_year ||= ENV.fetch('AUDITIONS_YEAR', Date.current.year.to_s)
     end
   
     def self.product_mappings
       @product_mappings ||= YAML.load_file(Rails.root.join('config', 'auditions', "#{current_year}.yml"))
     end
   
     def self.date_range
       config = product_mappings
       {
         start_date: config['date_range']['start'],
         end_date: config['date_range']['end']
       }
     end
   end
   ```

2. **Create YAML Configuration Files**
   ```yaml
   # config/auditions/2026.yml
   date_range:
     start: "2025-08-14T12:00:00Z"
     end: "2025-11-01T12:30:00Z"
   
   products:
     packets:
       "Cap City 2026 Battery Audition Packet": "Battery Packet"
       "Cap City 2026 Cymbal Audition Packet": "Cymbal Packet"
       "Cap City 2026 Front Ensemble Audition Packet": "Front Ensemble Packet"
       "Cap City 2026 Visual Ensemble Audition Packet": "Visual Ensemble Packet"
   
     registrations:
       "CC26 Music Ensemble Audition Registration": "Music Registration"
       "CC26 Visual Ensemble Audition Registration": "Visual Registration"
   
   field_mappings:
     packet:
       name_field: "Name"
       city_field: "City"
       state_field: "State"
       instrument_field: "Instrument"
     registration:
       first_name_field: "First Name"
       last_name_field: "Last Name"
       # ... etc
   ```

3. **Update Models to Use Configuration**
   ```ruby
   # app/services/auditions/packet.rb
   def self.product_names
     Configuration.product_mappings['products']['packets'].keys
   end
   ```

### Phase 2: Add Error Handling & Logging (Medium Risk)

1. **Create Result Objects**
   ```ruby
   # app/services/auditions/result.rb
   class Auditions::Result
     attr_reader :success, :data, :errors
   
     def initialize(success:, data: nil, errors: [])
       @success = success
       @data = data
       @errors = Array(errors)
     end
   
     def success?
       success
     end
   
     def failure?
       !success
     end
   end
   ```

2. **Add Validation & Error Handling**
   ```ruby
   # app/services/auditions/data_validator.rb
   class Auditions::DataValidator
     def self.validate_order(order)
       errors = []
       errors << "Missing customer email" unless order['customerEmail'].present?
       errors << "Missing line items" unless order['lineItems'].present?
       
       Result.new(success: errors.empty?, errors: errors)
     end
   end
   ```

3. **Add Structured Logging**
   ```ruby
   # app/services/auditions/logger.rb
   class Auditions::Logger
     def self.info(message, context = {})
       Rails.logger.info("[AUDITIONS] #{message}: #{context.to_json}")
     end
   
     def self.error(message, error = nil, context = {})
       Rails.logger.error("[AUDITIONS] #{message}: #{context.to_json}")
       Rails.logger.error(error.full_message) if error
     end
   end
   ```

### Phase 3: Refactor Architecture (Higher Risk)

1. **Break Down Monolithic Services**
   ```ruby
   # app/services/auditions/data_fetcher.rb
   class Auditions::DataFetcher
     def call
       Logger.info("Starting data fetch")
       
       orders_result = fetch_orders
       return orders_result if orders_result.failure?
       
       parse_result = parse_orders(orders_result.data)
       return parse_result if parse_result.failure?
       
       Logger.info("Data fetch completed", {
         packets: parse_result.data[:packets].size,
         registrations: parse_result.data[:registrations].size
       })
       
       parse_result
     end
   end
   
   # app/services/auditions/sheet_writer.rb
   class Auditions::PacketsAndRegistrationsWriter
     def initialize(sheet_formatter: SheetFormatter.new)
       @sheet_formatter = sheet_formatter
     end
   
     def write_packets(packets)
       Logger.info("Writing packets to sheet", count: packets.size)
       # Focused responsibility
     end
   end
   
   # app/services/auditions/profile_builder.rb
   class Auditions::ProfileBuilder
     def build_from_data(packets:, registrations:)
       # Single responsibility: build profiles from raw data
     end
   end
   ```

2. **Improve Data Flow**
   ```ruby
   # app/services/auditions/orchestrator.rb
   class Auditions::Orchestrator
     def call
       step :fetch_data, DataFetcher.new
       step :build_profiles, ProfileBuilder.new
       step :write_sheets, PacketsAndRegistrationsWriter.new
       step :update_recruitment, RecruitmentUpdater.new
     end
     
     private
   
     def step(name, service)
       Logger.info("Starting step: #{name}")
       result = service.call(@context)
       
       if result.failure?
         Logger.error("Step failed: #{name}", context: result.errors)
         return result
       end
       
       @context = result.data
       result
     end
   end
   ```

### Phase 4: Add Comprehensive Testing

1. **Unit Tests for Each Service**
   ```ruby
   # spec/services/auditions/data_fetcher_spec.rb
   RSpec.describe Auditions::DataFetcher do
     let(:mock_api) { instance_double(External::SquarespaceApi) }
     
     before do
       allow(External::SquarespaceApi).to receive(:new).and_return(mock_api)
     end
   
     context "when API returns valid data" do
       it "parses orders correctly" do
         allow(mock_api).to receive(:orders).and_return([sample_order])
         
         result = subject.call
         
         expect(result).to be_success
         expect(result.data[:packets]).to have(1).item
       end
     end
   
     context "when API fails" do
       it "returns failure result" do
         allow(mock_api).to receive(:orders).and_raise(Faraday::TimeoutError)
         
         result = subject.call
         
         expect(result).to be_failure
         expect(result.errors).to include(/timeout/i)
       end
     end
   end
   ```

2. **Integration Tests**
   ```ruby
   # spec/services/auditions/integration_spec.rb
   RSpec.describe "Auditions Integration" do
     it "processes sample data end-to-end" do
       VCR.use_cassette("auditions/full_flow") do
         result = Auditions::Orchestrator.new.call
         
         expect(result).to be_success
         expect(GoogleSheetsApi).to have_received(:write_sheet).twice
       end
     end
   end
   ```

3. **Mock External Dependencies**
   ```ruby
   # spec/support/auditions_helpers.rb
   module AuditionsHelpers
     def mock_squarespace_orders
       [
         {
           'customerEmail' => 'test@example.com',
           'createdOn' => '2025-09-01T12:00:00Z',
           'lineItems' => [sample_line_item]
         }
       ]
     end
   end
   ```

### Phase 5: Add Monitoring & Observability

1. **Health Checks**
   ```ruby
   # app/services/auditions/health_checker.rb
   class Auditions::HealthChecker
     def call
       checks = [
         check_squarespace_connection,
         check_google_sheets_access,
         check_configuration_valid
       ]
       
       Result.new(
         success: checks.all?(&:success?),
         data: checks,
         errors: checks.flat_map(&:errors)
       )
     end
   end
   ```

2. **Metrics Collection**
   ```ruby
   # Track processing metrics
   def process_orders
     start_time = Time.current
     
     result = yield
     
     StatsD.timing('auditions.processing_time', Time.current - start_time)
     StatsD.increment('auditions.orders_processed', result.data.size)
     
     result
   end
   ```

## Migration Strategy

1. **Week 1-2**: Phase 1 (Configuration) - No behavior changes, just externalize config
2. **Week 3-4**: Phase 2 (Error Handling) - Add safety nets without changing core logic  
3. **Week 5-7**: Phase 4 (Testing) - Build comprehensive test suite for current behavior
4. **Week 8-10**: Phase 3 (Refactoring) - Break apart monoliths with tests as safety net
5. **Week 11**: Phase 5 (Monitoring) - Add observability

## Benefits

- **Easier Annual Updates**: Configuration files instead of code changes
- **Better Debugging**: Structured logging and error messages  
- **Higher Reliability**: Comprehensive error handling and validation
- **Maintainable**: Smaller, focused services with clear responsibilities
- **Testable**: Full test coverage with mocked dependencies
- **Observable**: Health checks and metrics for proactive monitoring

## Risks & Mitigation

- **Risk**: Breaking existing functionality during refactor
  **Mitigation**: Comprehensive test suite before major refactoring, gradual migration

- **Risk**: New configuration system fails
  **Mitigation**: Keep old constants as fallbacks, validate config on startup

- **Risk**: Added complexity makes debugging harder  
  **Mitigation**: Excellent logging and simple, focused service boundaries