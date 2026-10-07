# frozen_string_literal: true

module DefaultSchedules
  # One of a season's eight defaults: an ensemble, a section group and a vet
  # status. Addressed in URLs by its slug, "world-music-vet".
  Combination = Struct.new(:ensemble, :section_group, :vet_status) do
    def self.all
      SeasonsUser::ENSEMBLES.product(DefaultScheduleEntry::SECTION_GROUPS, DefaultScheduleEntry::VET_STATUSES)
                            .map { |parts| new(*parts) }
    end

    def self.from_slug(slug)
      all.find { |combination| combination.slug == slug }
    end

    def self.for_member(user, season_id)
      new(
        user.ensemble_for(season_id),
        DefaultScheduleEntry.section_group_for(user.section_for(season_id)),
        DefaultScheduleEntry.vet_status_for(user.vet_in?(season_id))
      )
    end

    def slug
      to_a.join('-').downcase
    end

    def label
      to_a.join(' · ')
    end

    def entries_in(season_id)
      DefaultScheduleEntry.where(season_id: season_id, **to_h)
    end
  end
end
