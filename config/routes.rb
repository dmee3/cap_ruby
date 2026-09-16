# frozen_string_literal: true

Rails.application.routes.draw do
  devise_for :users,
             path: '',
             path_names: { sign_in: 'login', sign_out: 'logout' },
             controllers: { sessions: 'users/sessions', passwords: 'users/passwords' }

  devise_scope :user do
    get 'password/sent',    to: 'users/passwords#sent',    as: :sent_password
    get 'password/expired', to: 'users/passwords#expired', as: :expired_password
  end

  root to: 'home#index'

  get '/auditions-spreadsheet', to: 'auditions#index'
  get '/auditions-spreadsheet-generate', to: 'auditions#update'

  post 'change-season', to: 'home#change_season'

  namespace :api do
    namespace :admin do
      resources :payments, only: %i[index create]
      get 'payments/collected', to: 'payments#collected'
      get 'payments/upcoming', to: 'payments#upcoming'
      get 'payments/latest_venmo', to: 'payments#latest_venmo'

      resources :payment_schedules, only: %i[show update]
      get 'payment_schedules/:payment_schedule_id/default-preview', to: 'payment_schedules#default_preview'
      post 'payment_schedules/apply-default', to: 'payment_schedules#apply_default'
      post 'payment_schedules/create-default', to: 'payment_schedules#apply_default'
      delete 'payment_schedules/remove-entry', to: 'payment_schedules#remove_entry'
      post 'payment_schedules/add-entry', to: 'payment_schedules#add_entry'

      resources :users, only: %i[index show]

      # What a schedule *would* be for a combination that doesn't exist yet —
      # the add/edit user form reads this while the admin is still typing.
      get 'schedule-forecast', to: 'schedule_forecasts#show'

      resources :seasons, only: %i[index]
    end

    namespace :inventory do
      resources :categories, only: %i[index create update destroy] do
        resources :items, only: %i[create update show destroy]
      end
    end

    namespace :members do
      resources :payment_intents, only: %i[create]
      resources :calendars, only: %i[index]
    end

    # Public fundraiser (Flow 7), unauthenticated. Performers are addressed by
    # their opaque public_token, never by id.
    namespace :fundraiser do
      # `update` attaches the donor's name to an intent already created: the
      # Payment Element needs the intent to exist before it can render, so the
      # name is captured afterwards.
      resources :payment_intents, only: %i[create update]
      get 'performers', to: 'performers#index'
      get 'performers/:token/dates', to: 'performers#dates'
    end

    # One triage endpoint for both admins and coordinators (Flow 5).
    put 'conflicts/bulk', to: 'conflicts#bulk_update'
    resources :conflicts, only: %i[index update]

    resources :conflict_statuses, only: %i[index]
    resources :files, only: %i[index show]
  end

  namespace :admin do
    get '/', to: 'dashboard#index', as: 'home'

    resources :calendars, only: :index

    resources :conflicts, except: %i[show destroy]

    get 'payments/upcoming', to: 'payments#upcoming_payments'
    get 'payments/behind-members', to: 'payments#behind_members'
    get 'payments/burndown-chart', to: 'payments#burndown_chart'
    get 'payments/recent', to: 'payments#recent_payments'
    put 'payments/restore/:id', to: 'payments#restore'
    resources :payments

    # Admin-triggered password reset. Devise's own flow is user-initiated, and
    # the welcome email only links to it, so nothing ever set
    # reset_password_sent_at before this.
    post 'users/:id/send-reset', to: 'users#send_reset', as: 'send_reset_admin_user'

    resources :users

    resources :payment_schedules, only: %i[edit]

    resource :season, only: %i[edit update], controller: 'seasons'
  end

  namespace :coordinators do
    get '/', to: 'dashboard#index', as: 'home'
    resources :conflicts, except: %i[show destroy]
  end

  namespace :staff do
    get '/', to: 'dashboard#index', as: 'home'
  end

  namespace :members do
    get '/', to: 'dashboard#index', as: 'home'

    resources :calendars, only: %i[index]
    get 'calendars/download', to: 'calendars#download'

    # Members may also edit their own conflict, but only while it's Pending —
    # Members::ConflictsController enforces both halves of that server-side.
    resources :conflicts, only: %i[index new create edit update]

    resources :payments, only: %i[new]
    get 'payments/post_processing', to: 'payments#post_processing'
  end

  namespace :inventory do
    resources :categories, only: %i[index new create destroy] do
      resources :items, only: %i[new create show destroy]
    end

    resources :email_rules, except: %i[show]
  end

  resources :files, only: %i[index]

  get 'settings', to: 'settings#index'
  post 'settings', to: 'settings#update'
  post 'settings-password', to: 'settings#change_password'

  get 'rhythm-converter', to: 'tools#rhythm_converter'
  get 'tarp-grid-tool', to: 'tools#tarp_grid_tool'

  # The public calendar fundraiser (Flow 7). Four screens: pick a performer,
  # pick dates, pay, confirmation.
  get 'fundraiser', to: 'fundraiser#index', as: 'fundraiser'
  get 'fundraiser/thanks', to: 'fundraiser#thanks', as: 'fundraiser_thanks'
  get 'fundraiser/:token', to: 'fundraiser#show', as: 'performer_fundraiser'
  get 'fundraiser/:token/checkout', to: 'fundraiser#checkout', as: 'performer_fundraiser_checkout'

  # The short share link a performer sends to relatives.
  get 'f/:token', to: 'fundraiser#show', as: 'share_fundraiser'

  # The old donate URLs are on refrigerators and in group texts, so they
  # redirect rather than 404. `/calendars/new` had no performer in it, so it
  # can only land on the picker.
  get 'calendars/new', to: redirect('/fundraiser')
  get 'calendars/payment-confirmed', to: redirect { |_, request| "/fundraiser/thanks?#{request.query_string}" }

  resources :whistleblowers, only: %i[index create]

  post 'stripe/webhook', to: 'stripe#webhook'
end
