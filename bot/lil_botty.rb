$:.unshift File.dirname(__FILE__)
require 'points'

Thread.abort_on_exception = true

Thread.new do
  SlackRubyBot::App.instance.run
end