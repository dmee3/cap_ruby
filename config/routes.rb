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
    get 'conflicts/upcoming', to: 'conflicts#upcoming_conflicts'
    get 'conflicts/statuses', to: 'conflicts#statuses'
    resources :conflicts, except: %i[show destroy]

    get 'payments/upcoming', to: 'payments#upcoming_payments'
    get 'payments/behind-members', to: 'payments#behind_members'
    get 'payments/burndown-chart', to: 'payments#burndown_chart'
    get 'payments/recent', to: 'payments#recent_payments'
    resources :payments, except: %i[destroy]

    resources :users do
      resources :nine_volts, only: %i[create destroy]
    end

    resources :nine_volts, only: %i[index]

    delete 'payment_schedules/remove-entry', to: 'payment_schedules#remove_entry'
    post 'payment_schedules/add-entry', to: 'payment_schedules#add_entry'
    resources :payment_schedules, except: %i[new edit destroy]
  end

  namespace :members do
    resources :conflicts, only: %i[new create]

    resources :payments, only: %i[new]
    post 'charge', to: 'payments#charge'
  end

  get 'settings', to: 'home#settings'
  post 'settings', to: 'home#update_settings'
  post 'settings-password', to: 'home#change_password'

  resources :whistleblowers, only: %i[index create]
end
