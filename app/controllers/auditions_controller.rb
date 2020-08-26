class AuditionsController < ApplicationController
  before_action :logout_if_unauthorized

  def generate
    respond_to do |format|
      format.html { render 'auditions/home' }
      format.xlsx do
        @data = AuditionsProcessor.run
        render xlsx: 'registrations_and_packets', template: 'auditions/registrations_and_packets.xlsx.axlsx'
      end
    end
  end
end
