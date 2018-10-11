Rails.application.routes.draw do
  root to: 'home#index'
  get '/documents', to: 'home#documents'
  #get '/feed', to: 'home#feed'

  get 'login', to: 'sessions#new'
  post 'login', to: 'sessions#create'
  get 'logout', to: 'sessions#destroy'

  resources :conflicts

  resources :payments, only: %i[index new create]
  post 'charge', to: 'payments#charge'
  get 'payments/behind-members', to: 'payments#behind_members'
  get 'payments/burndown-chart', to: 'payments#burndown_chart'
  get 'payments/differential-chart', to: 'payments#differential_chart'
  get 'payments/upcoming-payments', to: 'payments#upcoming_payments'

  resources :users, except: %i[show]
  get 'settings', to: 'users#settings'
  post 'settings', to: 'users#update_settings'
  post 'settings-password', to: 'users#change_password'

  resources :payment_schedules, except: %i[index new edit destroy]
  delete 'payment_schedules/remove-entry', to: 'payment_schedules#remove_entry'
  post 'payment_schedules/add-entry', to: 'payment_schedules#add_entry'
end
