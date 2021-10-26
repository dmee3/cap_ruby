# frozen_string_literal: true

# == Schema Information
#
# Table name: bot_sayings
#
#  id         :integer          not null, primary key
#  saying     :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class BotSaying < ApplicationRecord
end
