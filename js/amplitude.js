/**
 * Amplitude Analytics Helper Module
 * ==================================
 * 
 * Provides a centralized interface for tracking events with Amplitude.
 * 
 * Features:
 * - Event queue: Events tracked before SDK loads are queued and sent once ready
 * - Retry logic: Failed events are retried with exponential backoff (6.2.4)
 * - Property enrichment: Adds common properties (page_url, UTM params) to all events
 * - Error handling: Graceful degradation if SDK fails to load
 * 
 * Usage:
 *   window.amplitudeHelper.track('Event Name', { property: 'value' });
 *   window.amplitudeHelper.setUserProperty('property_name', 'value');
 */

(function() {
  'use strict';

  // ==========================================================================
  // Named Constants
  // ==========================================================================
  
  var CONSTANTS = {
    // Queue settings
    MAX_QUEUE_SIZE: 100,
    
    // Retry settings (6.2.4)
    MAX_SEND_RETRIES: 3,
    INITIAL_RETRY_DELAY_MS: 1000,
    RETRY_BACKOFF_MULTIPLIER: 2,
    
    // Debounce settings
    USER_PROPS_DEBOUNCE_MS: 50,
    
    // Breakpoints
    MOBILE_BREAKPOINT: 768,
    TABLET_BREAKPOINT: 1024
  };

  // ==========================================================================
  // State
  // ==========================================================================
  
  var state = {
    initialized: false,
    sdkReady: false,
    originalTrack: null,
    debug: false
  };

  var eventQueue = [];
  var failedEvents = []; // For retry logic (6.2.4)

  // ==========================================================================
  // Single Gatekeeper Function
  // ==========================================================================

  /**
   * Check if SDK is ready - SINGLE source of truth for SDK readiness
   * All functions should use this instead of inline checks
   */
  function isSDKReady() {
    return state.sdkReady && 
           state.originalTrack !== null &&
           typeof amplitude !== 'undefined' && 
           amplitude !== null;
  }

  /**
   * Check if amplitude object exists (for user properties before full setup)
   */
  function hasAmplitudeObject() {
    return typeof amplitude !== 'undefined' && amplitude !== null;
  }

  // ==========================================================================
  // Error Logging - Always log errors, debug gates verbose info
  // ==========================================================================

  function logError(message, error, context) {
    // Always log errors in production (6.2.5)
    console.error('Amplitude:', message, error || '');
    if (context && state.debug) {
      console.error('Amplitude: Context:', context);
    }
  }

  function logWarn(message) {
    // Warnings only in debug mode
    if (state.debug) {
      console.warn('Amplitude:', message);
    }
  }

  function logInfo(message, data) {
    // Info only in debug mode
    if (state.debug) {
      console.log('Amplitude:', message, data || '');
    }
  }

  // ==========================================================================
  // Event Queue
  // ==========================================================================

  function queueEvent(eventName, properties) {
    if (eventQueue.length >= CONSTANTS.MAX_QUEUE_SIZE) {
      eventQueue.shift();
      logWarn('Event queue full, dropped oldest event');
    }
    
    eventQueue.push({
      eventName: eventName,
      properties: properties,
      timestamp: Date.now()
    });
    
    logInfo('Event queued:', eventName + ' (queue size: ' + eventQueue.length + ')');
  }

  function flushQueue() {
    if (!isSDKReady()) {
      logWarn('Cannot flush queue, SDK not ready');
      return;
    }

    if (eventQueue.length === 0) {
      return;
    }

    logInfo('Flushing ' + eventQueue.length + ' queued events');

    while (eventQueue.length > 0) {
      var event = eventQueue.shift();
      var enrichedProps = Object.assign({}, event.properties, {
        _queued: true,
        _queued_at: event.timestamp,
        _queue_delay_ms: Date.now() - event.timestamp
      });
      
      sendToSDKWithRetry(event.eventName, enrichedProps, 0);
    }
  }

  // ==========================================================================
  // Send to SDK with Retry Logic
  // ==========================================================================

  /**
   * Send event to SDK with exponential backoff retry
   */
  function sendToSDKWithRetry(eventName, properties, attempt) {
    if (attempt >= CONSTANTS.MAX_SEND_RETRIES) {
      logError('Event failed after ' + CONSTANTS.MAX_SEND_RETRIES + ' retries:', eventName);
      // Store in failed events for potential manual retry
      failedEvents.push({ eventName: eventName, properties: properties, failedAt: Date.now() });
      return;
    }

    try {
      if (!isSDKReady()) {
        // SDK not ready, queue instead of retry
        queueEvent(eventName, properties);
        return;
      }

      // Use stored original track method
      state.originalTrack(eventName, properties);
      logInfo('Event sent:', eventName);
      
    } catch (error) {
      logError('Error sending event (attempt ' + (attempt + 1) + '):', error, { eventName: eventName });
      
      // Retry with exponential backoff
      var delay = CONSTANTS.INITIAL_RETRY_DELAY_MS * Math.pow(CONSTANTS.RETRY_BACKOFF_MULTIPLIER, attempt);
      
      setTimeout(function() {
        sendToSDKWithRetry(eventName, properties, attempt + 1);
      }, delay);
    }
  }

  // ==========================================================================
  // Property Enrichment
  // ==========================================================================

  function enrichProperties(properties) {
    var enriched = Object.assign({}, properties || {}, {
      page_url: window.location.href,
      page_path: window.location.pathname
    });

    // Add session context (3.1)
    try {
      var sessionStart = parseInt(sessionStorage.getItem('amplitude_session_start_time') || '0');
      var sessionPageNum = parseInt(sessionStorage.getItem('amplitude_session_page_number') || '1');
      
      if (sessionStart > 0) {
        enriched.time_in_session_seconds = Math.round((Date.now() - sessionStart) / 1000);
      }
      enriched.session_page_number = sessionPageNum;
    } catch (e) { /* sessionStorage not available */ }

    // Add UTM parameters
    var utmParams = getUTMParameters();
    if (utmParams) {
      Object.assign(enriched, utmParams);
    }

    return enriched;
  }

  // ==========================================================================
  // Public API: Track
  // ==========================================================================

  function track(eventName, eventProperties) {
    // Validate
    if (!eventName || typeof eventName !== 'string' || eventName.length === 0) {
      logWarn('Invalid event name');
      return;
    }

    var properties = enrichProperties(eventProperties);
    logInfo('track() called:', eventName);

    // Queue if SDK not ready
    if (!isSDKReady()) {
      queueEvent(eventName, properties);
      return;
    }

    // Send with retry logic
    sendToSDKWithRetry(eventName, properties, 0);
  }

  // ==========================================================================
  // Public API: User Properties
  // ==========================================================================

  function setUserProperty(propertyName, propertyValue) {
    if (!hasAmplitudeObject()) {
      logWarn('SDK not loaded, cannot set user property');
      return;
    }

    if (!propertyName || typeof propertyName !== 'string') {
      logWarn('Invalid property name');
      return;
    }

    try {
      if (typeof amplitude.setUserProperties === 'function') {
        amplitude.setUserProperties({ [propertyName]: propertyValue });
      } else if (typeof amplitude.identify === 'function') {
        amplitude.identify({ [propertyName]: propertyValue });
      }
    } catch (error) {
      logError('Error setting user property:', error);
    }
  }

  // Debounce timer for setUserProperties
  var userPropsDebounceTimer = null;

  function setUserProperties(properties) {
    if (!hasAmplitudeObject()) {
      logWarn('SDK not loaded, cannot set user properties');
      return;
    }

    if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
      logWarn('Invalid properties object');
      return;
    }

    var cleanedProperties = cleanProperties(properties);
    if (Object.keys(cleanedProperties).length === 0) {
      return;
    }

    // Debounce
    if (userPropsDebounceTimer) {
      clearTimeout(userPropsDebounceTimer);
    }

    userPropsDebounceTimer = setTimeout(function() {
      userPropsDebounceTimer = null;
      
      try {
        if (typeof amplitude.setUserProperties === 'function') {
          amplitude.setUserProperties(cleanedProperties);
        } else if (typeof amplitude.identify === 'function') {
          amplitude.identify(cleanedProperties);
        }
      } catch (error) {
        logError('Error setting user properties:', error);
      }
    }, CONSTANTS.USER_PROPS_DEBOUNCE_MS);
  }

  function cleanProperties(properties) {
    var cleaned = {};
    
    for (var key in properties) {
      if (!properties.hasOwnProperty(key)) continue;
      
      var value = properties[key];
      if (value === undefined || value === null) continue;
      
      if (Array.isArray(value)) {
        var validArray = value.filter(function(item) {
          return item !== undefined && item !== null && item !== '';
        });
        if (validArray.length > 0) {
          cleaned[key] = validArray;
        }
      } else if (typeof value === 'string' && value.length > 0) {
        cleaned[key] = value;
      } else if (typeof value === 'number' && !isNaN(value)) {
        cleaned[key] = value;
      } else if (typeof value === 'boolean') {
        cleaned[key] = value;
      } else if (typeof value === 'object') {
        var hasValidValues = Object.values(value).some(function(v) {
          return v !== undefined && v !== null;
        });
        if (hasValidValues) {
          cleaned[key] = value;
        }
      }
    }
    
    return cleaned;
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  function init() {
    if (state.initialized) return;

    if (hasAmplitudeObject()) {
      state.initialized = true;
      
      // Defer non-critical work
      var defer = window.requestIdleCallback || function(cb) { setTimeout(cb, 0); };
      defer(function() {
        setInitialUserProperties();
        extractUTMParameters();
      }, { timeout: 500 });
    }
  }

  function setInitialUserProperties() {
    // Only set once per session
    try {
      if (sessionStorage.getItem('amplitude_props_set')) return;
      sessionStorage.setItem('amplitude_props_set', 'true');
    } catch (e) { /* sessionStorage not available */ }

    var properties = {
      device_type: getDeviceType(),
      browser: getBrowser(),
      screen_width: window.screen ? window.screen.width : 0,
      screen_height: window.screen ? window.screen.height : 0,
      viewport_width: window.innerWidth || 0,
      viewport_height: window.innerHeight || 0
    };

    try {
      var firstVisit = localStorage.getItem('amplitude_first_visit');
      if (!firstVisit) {
        properties.first_visit_date = new Date().toISOString();
        properties.returning_visitor = false;
        localStorage.setItem('amplitude_first_visit', new Date().toISOString());
      } else {
        properties.returning_visitor = true;
        properties.first_visit_date = firstVisit;
      }
    } catch (e) { /* localStorage not available */ }

    setUserProperties(properties);
  }

  // ==========================================================================
  // UTM Parameters
  // ==========================================================================

  function extractUTMParameters() {
    try {
      var urlParams = new URLSearchParams(window.location.search);
      var utmParams = {};
      var utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

      utmKeys.forEach(function(param) {
        var value = urlParams.get(param);
        if (value) utmParams[param] = value;
      });

      if (Object.keys(utmParams).length > 0) {
        sessionStorage.setItem('amplitude_utm_params', JSON.stringify(utmParams));
      }
    } catch (e) { /* Error extracting UTM params */ }
  }

  function getUTMParameters() {
    try {
      var stored = sessionStorage.getItem('amplitude_utm_params');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  function getDeviceType() {
    var width = window.innerWidth;
    if (width < CONSTANTS.MOBILE_BREAKPOINT) return 'mobile';
    if (width < CONSTANTS.TABLET_BREAKPOINT) return 'tablet';
    return 'desktop';
  }

  function getBrowser() {
    var ua = navigator.userAgent;
    // Check in correct order (more specific first)
    if (ua.indexOf('Edg/') > -1) return 'Edge';
    if (ua.indexOf('OPR/') > -1 || ua.indexOf('Opera') > -1) return 'Opera';
    if (ua.indexOf('Chrome/') > -1) return 'Chrome';
    if (ua.indexOf('Safari/') > -1) return 'Safari';
    if (ua.indexOf('Firefox/') > -1) return 'Firefox';
    return 'Unknown';
  }

  // ==========================================================================
  // Debug Functions
  // ==========================================================================

  function enableDebug() {
    state.debug = true;
    console.log('Amplitude: Debug mode enabled');
    console.log('Amplitude: Queue size:', eventQueue.length);
    console.log('Amplitude: Failed events:', failedEvents.length);
    console.log('Amplitude: SDK ready:', isSDKReady());
  }

  function disableDebug() {
    state.debug = false;
  }

  // ==========================================================================
  // SDK Setup (called by amplitude-init.js)
  // ==========================================================================

  function setup() {
    if (state.sdkReady) return true;

    if (!hasAmplitudeObject() || typeof amplitude.track !== 'function') {
      logWarn('SDK not ready for setup');
      return false;
    }

    // Store original track method
    state.originalTrack = amplitude.track.bind(amplitude);
    state.sdkReady = true;

    logInfo('Setup complete, SDK ready');

    // Flush queued events
    flushQueue();

    return true;
  }

  // ==========================================================================
  // Export Public API
  // ==========================================================================

  window.amplitudeHelper = window.amplitudeHelper || {};
  window.amplitudeHelper.setup = setup;
  window.amplitudeHelper.init = init;
  window.amplitudeHelper.track = track;
  window.amplitudeHelper.setUserProperty = setUserProperty;
  window.amplitudeHelper.setUserProperties = setUserProperties;
  window.amplitudeHelper.enableDebug = enableDebug;
  window.amplitudeHelper.disableDebug = disableDebug;
  window.amplitudeHelper.getQueueSize = function() { return eventQueue.length; };
  window.amplitudeHelper.getFailedCount = function() { return failedEvents.length; };
  window.amplitudeHelper.isReady = isSDKReady;

})();
