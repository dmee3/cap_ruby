# frozen_string_literal: true

module InventoryEmailRuleHelper
  # The wording is the UI's only vocabulary for an operator: a rule reads as a
  # sentence, so "lt_eq" must never surface.
  OPERATOR_LABELS = {
    'eq' => 'is exactly',
    'lt' => 'is below',
    'lt_eq' => 'is at or below',
    'gt' => 'is above',
    'gt_eq' => 'is at or above'
  }.freeze

  def operator_label(operator)
    OPERATOR_LABELS.fetch(operator.to_s, operator.to_s)
  end

  def operator_options
    OPERATOR_LABELS.map { |value, label| [label, value] }
  end
end
