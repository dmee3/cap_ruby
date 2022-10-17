# frozen_string_literal: true

class PaymentScheduleService
  class << self
    DEFAULT_PAYMENT_SCHEDULES = {
      '2023' => {
        'World' => {
          'Music' => {
            'Vet' => {
              '10/23/22' => 400,
              '11/27/22' => 325,
              '12/30/22' => 325,
              '1/22/23' => 325,
              '2/19/23' => 325,
              '3/19/23' => 150
            },
            'Rookie' => {
              '10/23/22' => 400,
              '11/27/22' => 325,
              '12/30/22' => 325,
              '1/22/23' => 325,
              '2/19/23' => 325,
              '3/19/23' => 300
            }
          },
          'Visual' => {
            'Vet' => {
              '10/23/22' => 300,
              '11/19/22' => 300,
              '12/17/22' => 300,
              '1/14/23' => 300,
              '2/18/23' => 300,
              '3/18/23' => 100
            },
            'Rookie' => {
              '10/23/22' => 300,
              '11/19/22' => 300,
              '12/17/22' => 300,
              '1/14/23' => 300,
              '2/18/23' => 300,
              '3/18/23' => 200
            }
          }
        },
        'CC2' => {
          'Music' => {
            'Vet' => {
              '10/23/22' => 300,
              '11/27/22' => 300,
              '12/30/22' => 300,
              '1/22/23' => 300,
              '2/19/23' => 300,
              '3/19/23' => 50
            },
            'Rookie' => {
              '10/23/22' => 300,
              '11/27/22' => 300,
              '12/30/22' => 300,
              '1/22/23' => 300,
              '2/19/23' => 300,
              '3/19/23' => 150
            }
          },
          'Visual' => {
            'Vet' => {
              '10/23/22' => 300,
              '11/19/22' => 300,
              '12/17/22' => 200,
              '1/14/23' => 200,
              '2/18/23' => 200,
              '3/18/23' => 100,
            },
            'Rookie' => {
              '10/23/22' => 300,
              '11/19/22' => 300,
              '12/17/22' => 200,
              '1/14/23' => 200,
              '2/18/23' => 200,
              '3/18/23' => 200,
            }
          }
        }
      }
    }.freeze

    def ensure_payment_schedules_for_user(user)
      user.seasons_users.each do |su|
        next if su.role != 'member' || user.payment_schedule_for(su.season_id).present?

        PaymentSchedule.create(user_id: user.id, season_id: su.season_id)
      end
    end

    def default_schedule_for(user, season)
      all_roles = user.seasons_users
      role = all_roles.select { |su| su.season_id == season['id'] }.first
      return nil unless role.present?

      vet_status = all_roles.any? { |su| su.season.year.to_i < role.season.year.to_i } ? 'Vet' : 'Rookie'
      section = role.section == 'Visual' ? 'Visual' : 'Music'

      DEFAULT_PAYMENT_SCHEDULES.dig(role.season.year, role.ensemble, section, vet_status)
    end
  end
end
