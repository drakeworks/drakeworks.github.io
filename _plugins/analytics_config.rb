# Jekyll Plugin: Analytics Config
# Reads environment variables and injects them into site config
# This allows us to use GitHub Secrets securely

Jekyll::Hooks.register :site, :after_init do |site|
  # Read Google Analytics ID from environment
  if ENV['GOOGLE_ANALYTICS_ID']
    site.config['google_analytics'] ||= {}
    site.config['google_analytics']['id'] = ENV['GOOGLE_ANALYTICS_ID']
  end

  # Read Amplitude API key from environment
  if ENV['AMPLITUDE_API_KEY']
    site.config['amplitude'] ||= {}
    site.config['amplitude']['api_key'] = ENV['AMPLITUDE_API_KEY']
  end
end

