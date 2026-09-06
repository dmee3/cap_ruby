# frozen_string_literal: true

module Admin
  class SeasonsController < AdminController
    def edit
      @season = current_season
    end

    def update
      if current_season.update(season_params)
        flash[:success] = 'Season updated'
        redirect_to(edit_admin_season_path)
      else
        flash.now[:error] = current_season.errors.full_messages.to_sentence
        @season = current_season
        render(:edit)
      end
    end

    private

    def season_params
      params.require(:season).permit(:conflict_submission_open)
    end
  end
end
