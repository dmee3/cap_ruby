# frozen_string_literal: true

module ApplicationHelper
  def flash_color(type)
    case type.to_sym
    when :alert, :error
      'red'
    when :success
      'green'
    when :info
      'blue'
    else
      'gray'
    end
  end
end
