Rails.application.routes.draw do
  root to: 'home#index'

  get 'login', to: 'sessions#new'
  post 'login', to: 'sessions#create'
  get 'logout', to: 'sessions#destroy'

  resources :conflicts

  resources :payments, only: %i[index new create]
  post 'charge', to: 'payments#charge'

  resources :users, except: %i[show]
  get 'settings', to: 'users#settings'
  post 'settings', to: 'users#change_settings'
end
