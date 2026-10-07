# frozen_string_literal: true

# Moves each season's default payment schedules out of a hardcoded hash in
# PaymentScheduleService and into a table an admin can edit.
#
# The hash is copied here verbatim, as it stood when it was deleted, so the
# 2023-2026 defaults are imported rather than lost and stay reproducible from
# history. Its amounts are DOLLARS and its dates 'm/d/yy'; the table holds
# cents and real dates. A season missing from this database (a fresh dev or
# test database) is skipped.
class CreateDefaultScheduleEntries < ActiveRecord::Migration[7.2]
  DEFAULTS = {
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

  def up
    create_table :default_schedule_entries do |t|
      t.references :season, null: false, foreign_key: true
      t.string :ensemble, null: false
      t.string :section_group, null: false
      t.string :vet_status, null: false
      t.date :pay_date, null: false
      t.integer :amount_cents, null: false
      t.timestamps
    end

    add_index :default_schedule_entries,
              %i[season_id ensemble section_group vet_status pay_date],
              unique: true,
              name: 'index_default_schedule_entries_on_combination_and_date'

    import_defaults
  end

  def down
    drop_table :default_schedule_entries
  end

  private

  def import_defaults
    now = Time.current
    rows = DEFAULTS.flat_map do |year, ensembles|
      season_id = select_value("SELECT id FROM seasons WHERE year = #{connection.quote(year)}")
      next [] if season_id.nil?

      ensembles.flat_map do |ensemble, groups|
        groups.flat_map do |section_group, statuses|
          statuses.flat_map do |vet_status, days|
            days.map do |day, dollars|
              {
                season_id: season_id, ensemble: ensemble, section_group: section_group,
                vet_status: vet_status, pay_date: Date.strptime(day, '%m/%d/%y'),
                amount_cents: dollars * 100, created_at: now, updated_at: now
              }
            end
          end
        end
      end
    end

    DefaultScheduleEntryImport.insert_all!(rows) if rows.any?
  end

  class DefaultScheduleEntryImport < ActiveRecord::Base
    self.table_name = 'default_schedule_entries'
  end
end
