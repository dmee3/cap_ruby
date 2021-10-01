# frozen_string_literal: true

Rails.application.routes.draw do
  devise_for :users, path: '', path_names: { sign_in: 'login', sign_out: 'logout' }

  root to: 'home#index'

  get '/auditions-spreadsheet', to: 'auditions#index'
  get '/auditions-spreadsheet-generate', to: 'auditions#update'

  post 'change-season', to: 'home#change_season'

  namespace :api do
    namespace :admin do
      resources :conflicts, only: %i[index]
      resources :payments, only: %i[index]
      resources :users, only: %i[index]
      resources :seasons, only: %i[index]
    end

    namespace :inventory do
      resources :categories, only: %i[index create update] do
        resources :items, only: %i[create update show]
      end
    end

    resources :files, only: %i[index show]
  end

  namespace :admin do
    get '/', to: 'dashboard#index', as: 'home'

    resources :calendars, only: :index

    get 'conflicts/upcoming', to: 'conflicts#upcoming_conflicts'
    get 'conflicts/statuses', to: 'conflicts#statuses'
    resources :conflicts, except: %i[show destroy]

    resources :files, only: %i[index]

    get 'payments/upcoming', to: 'payments#upcoming_payments'
    get 'payments/behind-members', to: 'payments#behind_members'
    get 'payments/burndown-chart', to: 'payments#burndown_chart'
    get 'payments/recent', to: 'payments#recent_payments'
    put 'payments/restore/:id', to: 'payments#restore'
    resources :payments

    resources :users

    delete 'payment_schedules/remove-entry', to: 'payment_schedules#remove_entry'
    post 'payment_schedules/add-entry', to: 'payment_schedules#add_entry'
    resources :payment_schedules, except: %i[new edit destroy]
  end

  namespace :members do
    resources :calendars, only: %i[index]

    resources :conflicts, only: %i[new create]

    resources :payments, only: %i[new]
    post 'charge', to: 'payments#charge'
  end

  namespace :inventory do
    resources :categories, only: %i[index new create] do
      resources :items, only: %i[new create show]
    end
  end

  get 'settings', to: 'settings#index'
  post 'settings', to: 'settings#update'

  get 'rhythm-converter', to: 'tools#rhythm_converter'

  resources :whistleblowers, only: %i[index create]
end
