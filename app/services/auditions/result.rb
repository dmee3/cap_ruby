# frozen_string_literal: true

module Auditions
  class Result
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

    def self.success(data = nil)
      new(success: true, data: data)
    end

    def self.failure(errors)
      new(success: false, errors: errors)
    end

    # Allow chaining of results - if current result is failure, return it
    # Otherwise, execute the block and return its result
    def and_then
      return self if failure?

      yield(data)
    end

    def to_s
      if success?
        "Success(#{data})"
      else
        "Failure(#{errors.join(', ')})"
      end
    end
  end
end
