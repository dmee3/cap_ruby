Rails.application.routes.draw do
  root to: 'home#index'

  get 'login', to: 'sessions#new'
  post 'login', to: 'session#create'
  get 'logout', to: 'session#destroy'

  resources :conflicts, only: [:index, :create, :new, :show]

  scope 'admin' do
    resources :conflicts, only: [:edit, :update, :delete]
    resources :users, except: [:show]
  end
end
