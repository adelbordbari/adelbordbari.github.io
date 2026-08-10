# frozen_string_literal: true

require 'dotenv/load'
require 'posthog'

module PostHogJekyll
  class << self
    attr_reader :client

    def initialize!
      return @client if defined?(@initialized)

      @initialized = true
      project_token = ENV['POSTHOG_PROJECT_TOKEN']
      host = ENV['POSTHOG_HOST']

      if project_token.to_s.empty? || host.to_s.empty?
        warn_missing_configuration(project_token, host)
        return
      end

      @client = PostHog::Client.new(api_key: project_token, host: host)
    end

    def capture_uncaught_exception(exception)
      return unless @client
      return if exception.is_a?(SystemExit) || exception.is_a?(SignalException)

      @client.capture_exception(exception, 'jekyll_build')
    rescue StandardError => capture_error
      warn "PostHog exception capture failed: #{capture_error.message}"
    end

    def shutdown
      @client&.shutdown
    end

    private

    def warn_missing_configuration(project_token, host)
      return if ENV.fetch('JEKYLL_ENV', 'development') == 'production'

      missing_variable = project_token.to_s.empty? ? 'POSTHOG_PROJECT_TOKEN' : 'POSTHOG_HOST'
      raise "#{missing_variable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once #{missing_variable} is configured"
    end
  end
end

Jekyll::Hooks.register :site, :after_init do
  PostHogJekyll.initialize!
end

at_exit { PostHogJekyll.shutdown }
at_exit { PostHogJekyll.capture_uncaught_exception($!) if $! }
