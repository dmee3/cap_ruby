# frozen_string_literal: true

Rails.application.routes.draw do
  devise_for :users, path: '', path_names: { sign_in: 'login', sign_out: 'logout' }

  root to: 'home#index'

  get '/auditions-spreadsheet', to: 'auditions#index'
  get '/auditions-spreadsheet-generate', to: 'auditions#update'

  post 'change-season', to: 'home#change_season'

  namespace :api do
    namespace :admin do
      resources :conflicts, only: %i[index update]

      resources :payments, only: %i[index]
      get 'payments/upcoming', to: 'payments#upcoming'
      get 'payments/latest_venmo', to: 'payments#latest_venmo'

      resources :payment_schedules, only: %i[show update]
      delete 'payment_schedules/remove-entry', to: 'payment_schedules#remove_entry'
      post 'payment_schedules/add-entry', to: 'payment_schedules#add_entry'

      resources :users, only: %i[index show]

      resources :seasons, only: %i[index]
    end

    namespace :coordinators do
      resources :conflicts, only: %i[index update]
    end

    namespace :inventory do
      resources :categories, only: %i[index create update] do
        resources :items, only: %i[create update show]
      end
    end

    namespace :members do
      resources :payment_intents, only: %i[create]
    end

    namespace :calendars do
      resources :payment_intents, only: %i[create]
    end

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

    resources :users

    resources :payment_schedules, only: %i[edit]
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

    resources :conflicts, only: %i[new create]

    resources :payments, only: %i[new]
    get 'payments/post_processing', to: 'payments#post_processing'
  end

  namespace :inventory do
    resources :categories, only: %i[index new create] do
      resources :items, only: %i[new create show]
    end

    resources :email_rules, except: %i[show destroy]
  end

  resources :files, only: %i[index]

  get 'settings', to: 'settings#index'
  post 'settings', to: 'settings#update'
  post 'settings-password', to: 'settings#change_password'

  get 'rhythm-converter', to: 'tools#rhythm_converter'

  resources :calendars, only: %i[index new create]
  get '/calendars/members', to: 'calendars#members'
  get '/calendars/payment-confirmed', to: 'calendars#confirm_payment'

  resources :whistleblowers, only: %i[index create]

  post 'stripe/webhook', to: 'stripe#webhook'
end
