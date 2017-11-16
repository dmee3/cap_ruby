Rails.application.routes.draw do
  root to: 'home#index'
  get '/documents', to: 'home#documents'

  get 'login', to: 'sessions#new'
  post 'login', to: 'sessions#create'
  get 'logout', to: 'sessions#destroy'

  resources :conflicts

  resources :payments, only: %i[index new create]
  post 'charge', to: 'payments#charge'
  get 'payments/differential-chart', to: 'payments#differential_chart'
  get 'payments/upcoming-payments', to: 'payments#upcoming_payments'
  get 'payments/burndown-chart', to: 'payments#burndown_chart'

  resources :users, except: %i[show]
  get 'settings', to: 'users#settings'
  post 'settings', to: 'users#change_settings'

  resources :payment_schedules, except: %i[index new edit destroy]
  delete 'payment_schedules/remove-entry', to: 'payment_schedules#remove_entry'
  post 'payment_schedules/add-entry', to: 'payment_schedules#add_entry'
end
