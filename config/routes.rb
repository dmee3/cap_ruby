Rails.application.routes.draw do
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

  root to: 'home#index'

  # get '/auditions-spreadsheet', to: 'auditions#index'
  # get '/auditions-spreadsheet-generate', to: 'auditions#update'

  get '/documents', to: 'home#documents'
  #get '/feed', to: 'home#feed'

  post 'change-season', to: 'home#change_season'

  get 'login', to: 'sessions#new'
  post 'login', to: 'sessions#create'
  get 'logout', to: 'sessions#destroy'

  namespace :admin do
    resources :calendars, only: :index

    get 'conflicts/upcoming', to: 'conflicts#upcoming_conflicts'
    get 'conflicts/statuses', to: 'conflicts#statuses'
    resources :conflicts, except: %i[show destroy]

    get 'payments/upcoming', to: 'payments#upcoming_payments'
    get 'payments/behind-members', to: 'payments#behind_members'
    get 'payments/burndown-chart', to: 'payments#burndown_chart'
    get 'payments/recent', to: 'payments#recent_payments'
    put 'payments/restore/:id', to: 'payments#restore'
    resources :payments

    resources :users do
      resources :nine_volts, only: %i[create destroy]
    end

    resources :nine_volts, only: %i[index]

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
    resources :categories, only: %i[index show new create edit update] do
      resources :items, only: %i[new create edit update show]
    end
  end

  get 'settings', to: 'settings#index'
  post 'settings', to: 'settings#update'
  post 'settings-password', to: 'settings#change_password'
  get 'forgot', to: 'settings#forgot_password'
  post 'forgot', to: 'settings#initiate_reset'
  get 'reset', to: 'settings#reset_password'
  post 'reset', to: 'settings#complete_reset'

  get 'rhythm-converter', to: 'tools#rhythm_converter'

  resources :whistleblowers, only: %i[index create]
end
