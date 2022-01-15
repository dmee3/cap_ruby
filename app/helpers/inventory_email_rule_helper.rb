# frozen_string_literal: true

module InventoryEmailRuleHelper
  # rubocop:disable Style/HashLikeCase
  def display_operator(operator)
    case operator.to_sym
    when :eq
      '='
    when :lt
      '<'
    when :lt_eq
      '<='
    when :gt
      '>'
    when :gt_eq
      '>='
    end
  end
  # rubocop:enable Style/HashLikeCase
end
