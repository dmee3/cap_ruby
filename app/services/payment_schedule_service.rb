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
      },
      '2024' => {
        'World' => {
          'Music' => {
            'Vet' => {
              '10/22/23' => 500,
              '11/24/23' => 310,
              '12/26/23' => 310,
              '1/19/24' => 310,
              '2/16/24' => 310,
              '3/15/24' => 310
            },
            'Rookie' => {
              '10/22/23' => 500,
              '11/24/23' => 350,
              '12/26/23' => 350,
              '1/19/24' => 350,
              '2/16/24' => 350,
              '3/15/24' => 350
            }
          },
          'Visual' => {
            'Vet' => {
              '10/22/23' => 400,
              '11/24/23' => 270,
              '12/26/23' => 270,
              '1/19/24' => 270,
              '2/16/24' => 270,
              '3/15/24' => 270
            },
            'Rookie' => {
              '10/22/23' => 400,
              '11/24/23' => 290,
              '12/26/23' => 290,
              '1/19/24' => 290,
              '2/16/24' => 290,
              '3/15/24' => 290
            }
          }
        },
        'CC2' => {
          'Music' => {
            'Vet' => {
              '10/22/23' => 400,
              '11/24/23' => 250,
              '12/26/23' => 250,
              '1/19/24' => 250,
              '2/16/24' => 250,
              '3/15/24' => 250
            },
            'Rookie' => {
              '10/22/23' => 400,
              '11/24/23' => 290,
              '12/26/23' => 290,
              '1/19/24' => 290,
              '2/16/24' => 290,
              '3/15/24' => 290
            }
          },
          'Visual' => {
            'Vet' => {
              '10/22/23' => 300,
              '11/24/23' => 220,
              '12/26/23' => 220,
              '1/19/24' => 220,
              '2/16/24' => 220,
              '3/15/24' => 220
            },
            'Rookie' => {
              '10/22/23' => 300,
              '11/24/23' => 240,
              '12/26/23' => 240,
              '1/19/24' => 240,
              '2/16/24' => 240,
              '3/15/24' => 240
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
