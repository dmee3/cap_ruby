# == Schema Information
#
# Table name: inventory_categories
#
#  id         :integer          not null, primary key
#  name       :string           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class Inventory::Category < ApplicationRecord
  validates :name, presence: true
  has_many :items, class_name: 'Inventory::Item', foreign_key: :inventory_category_id
end
