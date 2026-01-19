/**
 * Amplitude Initialization Module
 * ================================
 * 
 * This file handles all Amplitude SDK initialization.
 * It runs AFTER the SDK loads (both use 'defer').
 * 
 * Order of execution:
 * 1. Inline script sets window.AMPLITUDE_PAGE_DATA (Jekyll injects page info)
 * 2. Amplitude SDK loads (defer)
 * 3. This file runs (defer, listed after SDK)
 * 4. amplitude.js runs (defer, listed after this)
 */

(function() {
  'use strict';

  // Configuration
  var CONFIG = {
    maxRetries: 10,
    initialDelay: 50,
    maxDelay: 800
  };

  // State
  var state = {
    initialized: false,
    retryCount: 0
  };

  /**
   * Check if SDK is ready
   */
  function isSDKReady() {
    return typeof amplitude !== 'undefined' && 
           amplitude !== null && 
           typeof amplitude.track === 'function';
  }

  /**
   * Get page data from the inline script or detect from URL
   */
  function getPageData() {
    // Use data set by inline script in default.html
    if (window.AMPLITUDE_PAGE_DATA) {
      return window.AMPLITUDE_PAGE_DATA;
    }

    // Fallback: detect from URL
    var pagePath = window.location.pathname;
    var pageType = 'page';

    if (pagePath === '/') {
      pageType = 'home';
    } else if (pagePath.indexOf('/projects/') !== -1) {
      pageType = 'project';
    } else if (pagePath.indexOf('/about/') !== -1) {
      pageType = 'about';
    } else if (pagePath.indexOf('/resume/') !== -1) {
      pageType = 'resume';
    } else if (pagePath.indexOf('/contact/') !== -1) {
      pageType = 'contact';
    } else if (pagePath.indexOf('/archive/') !== -1) {
      pageType = 'archive';
    } else if (pagePath.indexOf('/tags/') !== -1) {
      pageType = 'tags';
    } else if (pagePath.indexOf('/gallery/') !== -1) {
      pageType = 'gallery';
    } else if (pagePath.indexOf('/videos/') !== -1) {
      pageType = 'videos';
    }

    return {
      pageType: pageType,
      pageTitle: document.title,
      pagePath: pagePath,
      pageUrl: window.location.href
    };
  }

  /**
   * Get previous page and update session page number (1.4)
   */
  function getPreviousPageData() {
    var data = {
      previous_page: 'direct',
      session_page_number: 1
    };
    
    try {
      // Get previous page
      var storedPrevious = sessionStorage.getItem('amplitude_previous_page');
      if (storedPrevious) {
        data.previous_page = storedPrevious;
      }
      
      // Get and increment session page number
      var pageNum = parseInt(sessionStorage.getItem('amplitude_session_page_number') || '0') + 1;
      data.session_page_number = pageNum;
      
      // Store current page as previous for next navigation
      sessionStorage.setItem('amplitude_previous_page', window.location.pathname);
      sessionStorage.setItem('amplitude_session_page_number', pageNum.toString());
    } catch (e) {
      // sessionStorage not available
    }
    
    return data;
  }

  /**
   * Get and update page sequence (2.1)
   */
  function getPageSequence(pageType) {
    var sequenceData = {
      page_sequence_length: 1,
      pages_visited_types: [pageType]
    };
    
    try {
      var sequence = JSON.parse(sessionStorage.getItem('amplitude_page_sequence') || '[]');
      
      // Add current page
      sequence.push({
        path: window.location.pathname,
        type: pageType,
        time: Date.now()
      });
      
      // Keep last 10 pages only
      if (sequence.length > 10) {
        sequence = sequence.slice(-10);
      }
      
      // Store updated sequence
      sessionStorage.setItem('amplitude_page_sequence', JSON.stringify(sequence));
      
      // Extract unique page types visited
      var typesVisited = [];
      sequence.forEach(function(page) {
        if (typesVisited.indexOf(page.type) === -1) {
          typesVisited.push(page.type);
        }
      });
      
      sequenceData.page_sequence_length = sequence.length;
      sequenceData.pages_visited_types = typesVisited;
    } catch (e) {
      // sessionStorage not available
    }
    
    return sequenceData;
  }

  /**
   * Build page view properties
   */
  function buildPageViewProperties(pageData) {
    var properties = {
      page_type: pageData.pageType,
      page_title: pageData.pageTitle,
      page_url: pageData.pageUrl || window.location.href,
      page_path: pageData.pagePath || window.location.pathname,
      referrer: document.referrer || 'direct'
    };

    // Add referrer domain
    try {
      if (document.referrer) {
        properties.referrer_domain = new URL(document.referrer).hostname;
      } else {
        properties.referrer_domain = 'direct';
      }
    } catch (e) {
      properties.referrer_domain = 'invalid';
    }

    // Add previous page tracking (1.4)
    var prevPageData = getPreviousPageData();
    properties.previous_page = prevPageData.previous_page;
    properties.session_page_number = prevPageData.session_page_number;

    // Add page sequence tracking (2.1)
    var sequenceData = getPageSequence(pageData.pageType);
    properties.page_sequence_length = sequenceData.page_sequence_length;
    properties.pages_visited_types = sequenceData.pages_visited_types;

    // Add post-specific properties if available
    if (pageData.postTags && pageData.postTags.length > 0) {
      properties.post_tags = pageData.postTags;
    }
    if (pageData.postDate) {
      properties.post_date = pageData.postDate;
    }
    if (pageData.postCategory) {
      properties.post_category = pageData.postCategory;
    }

    return properties;
  }

  /**
   * Track initial page view
   */
  function trackPageView(pageData) {
    if (!isSDKReady()) {
      console.warn('Amplitude Init: SDK not ready for page view');
      return;
    }

    var properties = buildPageViewProperties(pageData);

    try {
      amplitude.track('Page Viewed', properties);
    } catch (error) {
      console.error('Amplitude Init: Error tracking page view', error);
    }
  }

  /**
   * Setup and initialize the amplitude helper module
   * This is the SINGLE entry point for all initialization
   */
  function initializeHelper() {
    if (!window.amplitudeHelper) {
      console.warn('Amplitude Init: Helper module not loaded');
      return;
    }

    // Step 1: Setup the helper (stores SDK reference, flushes queue)
    if (typeof window.amplitudeHelper.setup === 'function') {
      window.amplitudeHelper.setup();
    }

    // Step 2: Initialize user properties and UTM (deferred, non-critical)
    if (typeof window.amplitudeHelper.init === 'function') {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(function() {
          window.amplitudeHelper.init();
        }, { timeout: 1000 });
      } else {
        setTimeout(function() {
          window.amplitudeHelper.init();
        }, 0);
      }
    }
  }

  /**
   * Main initialization function
   */
  function initialize() {
    if (state.initialized) {
      return; // Prevent double initialization
    }

    if (!isSDKReady()) {
      // SDK not ready, retry with exponential backoff
      state.retryCount++;
      if (state.retryCount < CONFIG.maxRetries) {
        var delay = Math.min(CONFIG.initialDelay * Math.pow(2, state.retryCount), CONFIG.maxDelay);
        setTimeout(initialize, delay);
      } else {
        console.error('Amplitude Init: SDK failed to load after ' + CONFIG.maxRetries + ' attempts');
      }
      return;
    }

    state.initialized = true;

    // Get page data
    var pageData = getPageData();

    // Track page view immediately (SDK is confirmed ready)
    // Track page view immediately (SDK is confirmed ready)
    trackPageView(pageData);

    // Initialize helper module (sets up queue flush, user properties)
    initializeHelper();
  }

  /**
   * Start initialization
   * Since this script has 'defer', it runs after DOM parsing
   * and after any scripts listed before it (like the SDK)
   */
  function start() {
    // Small delay to let SDK complete its own initialization
    setTimeout(initialize, CONFIG.initialDelay);
  }

  // Start when this script runs
  // With 'defer', the DOM is already parsed and SDK should be loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // Fallback: Also try on window load
  window.addEventListener('load', function() {
    if (!state.initialized) {
      initialize();
    }
  });

})();

