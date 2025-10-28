# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Whistleblowers', type: :request do
  let(:season) { create(:season, year: Date.today.year) }
  let(:user) { create(:user) }
  let(:admin1) { create(:user) }
  let(:admin2) { create(:user) }
  let(:admin3) { create(:user) }

  before do
    create(:seasons_user, user: user, season: season, role: 'member')
    create(:seasons_user, user: admin1, season: season, role: 'admin')
    create(:seasons_user, user: admin2, season: season, role: 'admin')
    create(:seasons_user, user: admin3, season: season, role: 'admin')
  end

  describe 'GET /whistleblowers' do
    context 'when not authenticated' do
      it 'redirects to login' do
        get '/whistleblowers'
        expect(response).to redirect_to(new_user_session_path)
      end
    end

    context 'when authenticated' do
      before do
        sign_in user
        cookies[:cap_season_id] = season.id
      end

      it 'renders the whistleblower form' do
        get '/whistleblowers'
        expect(response).to have_http_status(:success)
      end
    end
  end

  describe 'POST /whistleblowers' do
    context 'when not authenticated' do
      it 'redirects to login' do
        post '/whistleblowers', params: {
          email: 'reporter@example.com',
          report: 'Test report',
          recipients: [admin1.id, admin2.id, admin3.id]
        }
        expect(response).to redirect_to(new_user_session_path)
      end
    end

    context 'when authenticated' do
      before do
        sign_in user
        cookies[:cap_season_id] = season.id
      end

      context 'with valid parameters' do
        it 'sends email and redirects with success message' do
          allow(EmailService).to receive(:send_whistleblower_email)

          post '/whistleblowers', params: {
            email: 'reporter@example.com',
            report: 'This is a test report about an issue.',
            recipients: [admin1.id, admin2.id, admin3.id]
          }

          expect(EmailService).to have_received(:send_whistleblower_email).with(
            'reporter@example.com',
            'This is a test report about an issue.',
            [admin1.id.to_s, admin2.id.to_s, admin3.id.to_s]
          )
          expect(response).to redirect_to(root_path)
          expect(flash[:success]).to include('Report submitted')
        end

        it 'works without optional email contact' do
          allow(EmailService).to receive(:send_whistleblower_email)

          post '/whistleblowers', params: {
            email: '',
            report: 'Anonymous report',
            recipients: [admin1.id, admin2.id, admin3.id]
          }

          expect(EmailService).to have_received(:send_whistleblower_email)
          expect(response).to redirect_to(root_path)
          expect(flash[:success]).to be_present
        end
      end

      context 'with fewer than 3 recipients' do
        it 'shows error when no recipients selected' do
          post '/whistleblowers', params: {
            email: 'reporter@example.com',
            report: 'Test report',
            recipients: nil
          }

          expect(response).to have_http_status(:success)
          expect(flash[:error]).to include('at least 3 administrators')
        end

        it 'shows error when only 1 recipient selected' do
          post '/whistleblowers', params: {
            email: 'reporter@example.com',
            report: 'Test report',
            recipients: [admin1.id]
          }

          expect(response).to have_http_status(:success)
          expect(flash[:error]).to include('at least 3 administrators')
        end

        it 'shows error when only 2 recipients selected' do
          post '/whistleblowers', params: {
            email: 'reporter@example.com',
            report: 'Test report',
            recipients: [admin1.id, admin2.id]
          }

          expect(response).to have_http_status(:success)
          expect(flash[:error]).to include('at least 3 administrators')
        end
      end

      context 'when EmailService raises an error' do
        before do
          allow(EmailService).to receive(:send_whistleblower_email).and_raise(StandardError.new('Email error'))
          allow(Rails.logger).to receive(:error)
          allow(Rollbar).to receive(:error)
        end

        it 'handles the error gracefully' do
          post '/whistleblowers', params: {
            email: 'reporter@example.com',
            report: 'Test report',
            recipients: [admin1.id, admin2.id, admin3.id]
          }

          expect(Rails.logger).to have_received(:error)
          expect(Rollbar).to have_received(:error)
          expect(response).to have_http_status(:success)
          expect(flash[:error]).to include('system has encountered an error')
        end
      end
    end

    context 'available to all roles' do
      it 'allows staff to submit reports' do
        staff_user = create(:user)
        create(:seasons_user, user: staff_user, season: season, role: 'staff')
        sign_in staff_user
        cookies[:cap_season_id] = season.id

        allow(EmailService).to receive(:send_whistleblower_email)

        post '/whistleblowers', params: {
          email: 'staff@example.com',
          report: 'Staff report',
          recipients: [admin1.id, admin2.id, admin3.id]
        }

        expect(EmailService).to have_received(:send_whistleblower_email)
        expect(response).to redirect_to(root_path)
      end

      it 'allows coordinators to submit reports' do
        coordinator = create(:user)
        create(:seasons_user, user: coordinator, season: season, role: 'coordinator')
        sign_in coordinator
        cookies[:cap_season_id] = season.id

        allow(EmailService).to receive(:send_whistleblower_email)

        post '/whistleblowers', params: {
          email: 'coordinator@example.com',
          report: 'Coordinator report',
          recipients: [admin1.id, admin2.id, admin3.id]
        }

        expect(EmailService).to have_received(:send_whistleblower_email)
        expect(response).to redirect_to(root_path)
      end

      it 'allows admins to submit reports' do
        admin = create(:user)
        create(:seasons_user, user: admin, season: season, role: 'admin')
        sign_in admin
        cookies[:cap_season_id] = season.id

        allow(EmailService).to receive(:send_whistleblower_email)

        post '/whistleblowers', params: {
          email: 'admin@example.com',
          report: 'Admin report',
          recipients: [admin1.id, admin2.id, admin3.id]
        }

        expect(EmailService).to have_received(:send_whistleblower_email)
        expect(response).to redirect_to(root_path)
      end
    end
  end
end
