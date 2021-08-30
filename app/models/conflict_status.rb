# frozen_string_literal: true

# == Schema Information
#
# Table name: conflict_statuses
#
#  id         :integer          not null, primary key
#  name       :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class ConflictStatus < ApplicationRecord
end
