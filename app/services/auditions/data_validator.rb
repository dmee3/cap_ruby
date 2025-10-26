# frozen_string_literal: true

module Auditions
  class DataValidator
    class << self
      def validate_orders_structure(orders)
        return Result.failure(['Orders data is nil']) if orders.nil?
        return Result.failure(['Orders must be an array']) unless orders.is_a?(Array)

        Logger.warn('No orders found - this may be expected if no orders exist in date range') if orders.empty?

        Result.success(orders)
      end

      def validate_orders(orders)
        errors = []

        return Result.failure(['Orders data is nil']) if orders.nil?

        return Result.failure(['Orders must be an array']) unless orders.is_a?(Array)

        if orders.empty?
          Logger.warn('No orders found - this may be expected if no orders exist in date range')
          return Result.success(orders)
        end

        orders.each.with_index do |order, index|
          order_errors = validate_single_order(order, index)
          errors.concat(order_errors)
        end

        if errors.any?
          Result.failure(errors)
        else
          Result.success(orders)
        end
      end

      def validate_single_order(order, index = nil)
        errors = []
        order_prefix = index ? "Order ##{index + 1}" : 'Order'

        return ["#{order_prefix}: must be a hash"] unless order.is_a?(Hash)

        # Required fields
        errors << "#{order_prefix}: missing customer email" if order['customerEmail'].blank?

        if order['lineItems'].blank?
          errors << "#{order_prefix}: missing line items"
        elsif !order['lineItems'].is_a?(Array)
          errors << "#{order_prefix}: line items must be an array"
        end

        if order['createdOn'].blank?
          errors << "#{order_prefix}: missing created date"
        else
          begin
            DateTime.parse(order['createdOn'])
          rescue ArgumentError, TypeError
            errors << "#{order_prefix}: invalid created date format"
          end
        end

        # Validate line items if present
        if order['lineItems'].is_a?(Array)
          order['lineItems'].each.with_index do |item, item_index|
            item_errors = validate_line_item(item, "#{order_prefix} item ##{item_index + 1}")
            errors.concat(item_errors)
          end
        end

        errors
      end

      def validate_line_item(item, prefix)
        errors = []

        return ["#{prefix}: must be a hash"] unless item.is_a?(Hash)

        errors << "#{prefix}: missing product name" if item['productName'].blank?

        # Skip further validation if this is not a configured packet or registration item
        return errors unless configured_product?(item['productName'])

        if item['customizations'].blank?
          Logger.error(item)
          errors << "#{prefix}: missing customizations"
        elsif !item['customizations'].is_a?(Array)
          errors << "#{prefix}: customizations must be an array"
        end

        errors
      end

      def configured_product?(product_name)
        return false if product_name.blank?

        packet_names = Configuration.packet_product_names
        registration_names = Configuration.registration_product_names

        packet_names.include?(product_name) || registration_names.include?(product_name)
      rescue StandardError => e
        Logger.warn("Failed to check if product is configured: #{e.message}")
        false
      end

      def validate_custom_fields(custom_fields, required_fields, context = 'Custom fields')
        errors = []

        return Result.failure(["#{context}: must be an array"]) unless custom_fields.is_a?(Array)

        field_labels = custom_fields.map { |field| field['label'] }.compact

        required_fields.each do |field_name|
          errors << "#{context}: missing required field '#{field_name}'" unless field_labels.include?(field_name)
        end

        custom_fields.each.with_index do |field, index|
          unless field.is_a?(Hash)
            errors << "#{context} field ##{index + 1}: must be a hash"
            next
          end

          errors << "#{context} field ##{index + 1}: missing label" if field['label'].blank?

          errors << "#{context} field ##{index + 1} (#{field['label']}): missing value" if field['value'].blank?
        end

        if errors.any?
          Result.failure(errors)
        else
          Result.success(custom_fields)
        end
      end

      def validate_profiles(profiles)
        errors = []

        return Result.failure(['Profiles must be an array']) unless profiles.is_a?(Array)

        if profiles.empty?
          Logger.warn('No profiles generated - this may indicate no matching products were found')
          return Result.success(profiles)
        end

        profiles.each.with_index do |profile, index|
          profile_errors = validate_profile(profile, index)
          errors.concat(profile_errors)
        end

        if errors.any?
          Result.failure(errors)
        else
          Result.success(profiles)
        end
      end

      def validate_profile(profile, index = nil)
        errors = []
        prefix = index ? "Profile ##{index + 1}" : 'Profile'

        unless profile.respond_to?(:first_name) && profile.respond_to?(:last_name) && profile.respond_to?(:email)
          return ["#{prefix}: missing required methods (first_name, last_name, email)"]
        end

        errors << "#{prefix}: missing first name" if profile.first_name.blank?

        errors << "#{prefix}: missing last name" if profile.last_name.blank?

        errors << "#{prefix}: missing email" if profile.email.blank?

        errors
      end
    end
  end
end
