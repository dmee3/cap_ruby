# frozen_string_literal: true

module Auditions
  class Logger
    class << self
      def info(message, context = {})
        Rails.logger.info(format_message(message, context))
      end

      def warn(message, context = {})
        Rails.logger.warn(format_message(message, context))
      end

      def error(message, error = nil, context = {})
        Rails.logger.error(format_message(message, context))

        if error.respond_to?(:full_message)
          Rails.logger.error(error.full_message)
        elsif error.respond_to?(:message)
          Rails.logger.error("Error details: #{error.message}")
          Rails.logger.error(error.backtrace&.join("\n")) if error.respond_to?(:backtrace)
        elsif error
          Rails.logger.error("Error details: #{error}")
        end
      end

      def debug(message, context = {})
        Rails.logger.debug(format_message(message, context))
      end

      # Log the start and completion of a major step
      def step(step_name, context = {})
        info("Starting #{step_name}", context)
        start_time = Time.current

        result = yield

        duration = Time.current - start_time
        if result.respond_to?(:success?) && result.success?
          info("Completed #{step_name}", context.merge(duration_ms: (duration * 1000).round(2)))
        else
          error("Failed #{step_name}", nil, context.merge(duration_ms: (duration * 1000).round(2)))
        end

        result
      rescue StandardError => e
        duration = Time.current - start_time
        error("Failed #{step_name} with exception", e,
              context.merge(duration_ms: (duration * 1000).round(2)))
        raise
      end

      private

      def format_message(message, context)
        base = "[AUDITIONS] #{message}"
        return base if context.empty?

        "#{base}: #{context.to_json}"
      end
    end
  end
end
