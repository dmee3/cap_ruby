# frozen_string_literal: true

module ApplicationHelper
  def flash_color(type)
    case type.to_sym
    when :alert, :error
      'flash-error'
    when :success
      'flash-success'
    when :info
      'flash-info'
    else
      'flash-default'
    end
  end
end
