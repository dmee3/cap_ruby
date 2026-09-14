# frozen_string_literal: true
# typed: true

class PaymentScheduleService
  extend T::Sig

  class << self
    extend T::Sig

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
              '3/18/23' => 100
            },
            'Rookie' => {
              '10/23/22' => 300,
              '11/19/22' => 300,
              '12/17/22' => 200,
              '1/14/23' => 200,
              '2/18/23' => 200,
              '3/18/23' => 200
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
      },
      '2025' => {
        'World' => {
          'Music' => {
            'Vet' => {
              '10/20/24' => 500,
              '11/22/24' => 340,
              '12/20/24' => 340,
              '1/17/25' => 340,
              '2/21/25' => 340,
              '3/21/25' => 340
            },
            'Rookie' => {
              '10/20/24' => 500,
              '11/22/24' => 380,
              '12/20/24' => 380,
              '1/17/25' => 380,
              '2/21/25' => 380,
              '3/21/25' => 380
            }
          },
          'Visual' => {
            'Vet' => {
              '10/20/24' => 500,
              '11/22/24' => 280,
              '12/20/24' => 280,
              '1/17/25' => 280,
              '2/21/25' => 280,
              '3/21/25' => 280
            },
            'Rookie' => {
              '10/20/24' => 500,
              '11/22/24' => 320,
              '12/20/24' => 320,
              '1/17/25' => 320,
              '2/21/25' => 320,
              '3/21/25' => 320
            }
          }
        },
        'CC2' => {
          'Music' => {
            'Vet' => {
              '10/20/24' => 500,
              '11/22/24' => 290,
              '12/20/24' => 290,
              '1/17/25' => 290,
              '2/21/25' => 290,
              '3/21/25' => 290
            },
            'Rookie' => {
              '10/20/24' => 500,
              '11/22/24' => 330,
              '12/20/24' => 330,
              '1/17/25' => 330,
              '2/21/25' => 330,
              '3/21/25' => 330
            }
          },
          'Visual' => {
            'Vet' => {
              '10/20/24' => 500,
              '11/22/24' => 230,
              '12/20/24' => 230,
              '1/17/25' => 230,
              '2/21/25' => 230,
              '3/21/25' => 230
            },
            'Rookie' => {
              '10/20/24' => 500,
              '11/22/24' => 270,
              '12/20/24' => 270,
              '1/17/25' => 270,
              '2/21/25' => 270,
              '3/21/25' => 270
            }
          }
        }
      },
      '2026' => {
        'World' => {
          'Music' => {
            'Vet' => {
              '10/17/25' => 500,
              '11/14/25' => 360,
              '12/12/25' => 360,
              '1/09/26' => 360,
              '2/06/26' => 360,
              '3/06/26' => 360
            },
            'Rookie' => {
              '10/17/25' => 500,
              '11/14/25' => 400,
              '12/12/25' => 400,
              '1/09/26' => 400,
              '2/06/26' => 400,
              '3/06/26' => 400
            }
          },
          'Visual' => {
            'Vet' => {
              '10/17/25' => 500,
              '11/14/25' => 300,
              '12/12/25' => 300,
              '1/09/26' => 300,
              '2/06/26' => 300,
              '3/06/26' => 300
            },
            'Rookie' => {
              '10/17/25' => 500,
              '11/14/25' => 340,
              '12/12/25' => 340,
              '1/09/26' => 340,
              '2/06/26' => 340,
              '3/06/26' => 340
            }
          }
        },
        'CC2' => {
          'Music' => {
            'Vet' => {
              '10/17/25' => 500,
              '11/14/25' => 300,
              '12/12/25' => 300,
              '1/09/26' => 300,
              '2/06/26' => 300,
              '3/06/26' => 300
            },
            'Rookie' => {
              '10/17/25' => 500,
              '11/14/25' => 340,
              '12/12/25' => 340,
              '1/09/26' => 340,
              '2/06/26' => 340,
              '3/06/26' => 340
            }
          },
          'Visual' => {
            'Vet' => {
              '10/17/25' => 500,
              '11/14/25' => 240,
              '12/12/25' => 240,
              '1/09/26' => 240,
              '2/06/26' => 240,
              '3/06/26' => 240
            },
            'Rookie' => {
              '10/17/25' => 500,
              '11/14/25' => 280,
              '12/12/25' => 280,
              '1/09/26' => 280,
              '2/06/26' => 280,
              '3/06/26' => 280
            }
          }
        }
      }
    }.freeze

    # Every member season the user is on gets a schedule, populated from the
    # per-year default where one exists.
    #
    # Idempotent in two senses, both of which matter because the admin user form
    # calls this on every save: a season that already has a schedule is skipped
    # entirely, and a schedule that already has entries is never added to. A
    # double submit therefore cannot double anyone's dues.
    #
    # A season with no default row (DEFAULT_PAYMENT_SCHEDULES currently stops at
    # 2026) still gets its empty schedule, exactly as before — the UI says so
    # rather than pretending a schedule was built.
    sig { params(user: User).void }
    def ensure_payment_schedules_for_user(user)
      user.seasons_users.each do |su|
        next if su.role != 'member' || user.payment_schedule_for(su.season_id).present?

        schedule = PaymentSchedule.create(user_id: user.id, season_id: su.season_id)
        populate_from_default(schedule, su.season)
      end
    end

    # Write the default's entries onto a schedule that has none. Returns the
    # number of entries created (0 when there is no default for this
    # year/ensemble/section/vet-status, or when the schedule is already
    # populated).
    sig { params(schedule: PaymentSchedule, season: Season).returns(Integer) }
    def populate_from_default(schedule, season)
      return 0 if schedule.entries.any?

      default = default_schedule_for(schedule.user, season.attributes)
      return 0 if default.nil?

      PaymentSchedule.transaction do
        default_entries(default).each do |entry|
          schedule.entries.create!(pay_date: entry[:pay_date], amount: entry[:amount_cents])
        end
      end
      default.size
    end

    # The default hash is keyed by 'm/d/yy' strings and holds DOLLARS; entries
    # are stored in CENTS. Same conversion Admin::ScheduleDefault makes.
    sig { params(default: T::Hash[String, Integer]).returns(T::Array[T::Hash[Symbol, T.untyped]]) }
    def default_entries(default)
      default.map do |day, dollars|
        { pay_date: Date.strptime(day, '%m/%d/%y'), amount_cents: dollars * 100 }
      end
    end

    sig do
      params(
        user: User,
        season: T.any(Season, T::Hash[String, T.untyped])
      ).returns(T.nilable(T::Hash[String, Integer]))
    end
    def default_schedule_for(user, season)
      all_roles = user.seasons_users
      role = all_roles.select { |su| su.season_id == season['id'] }.first
      return nil unless role.present?

      vet_status = if all_roles.any? do |su|
        su.season.year.to_i < role.season.year.to_i
      end
                     'Vet'
                   else
                     'Rookie'
                   end
      section = role.section == 'Visual' ? 'Visual' : 'Music'

      DEFAULT_PAYMENT_SCHEDULES.dig(role.season.year, role.ensemble, section, vet_status)
    end
  end
end
