module InventoryEmailRuleHelper
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
end
