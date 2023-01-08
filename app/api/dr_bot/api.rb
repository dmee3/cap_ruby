module DrBot
  class Api < Grape::API
    format :json
    mount SlackRubyBotServer::Api::Endpoints::RootEndpoint
  end
end
