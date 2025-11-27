document.addEventListener("DOMContentLoaded", function() {
  'use strict';

  /* =======================================================
  // Helper: Get Current Scroll Depth (3.2)
  ======================================================= */
  function getCurrentScrollDepth() {
    if (!document.documentElement.scrollHeight) return 0;
    return Math.min(100, Math.round(
      (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100
    ));
  }

  const html = document.querySelector('html'),
    globalWrap = document.querySelector('.global-wrap'),
    body = document.querySelector('body'),
    menuToggle = document.querySelector(".hamburger"),
    menuList = document.querySelector(".main-nav"),
    searchOpenButton = document.querySelectorAll(".search-button, .hero__search"),
    searchCloseIcon = document.querySelector(".search__close"),
    searchOverlay = document.querySelector(".search__overlay"),
    searchInput = document.querySelector(".search__text"),
    search = document.querySelector(".search"),
    toggleTheme = document.querySelector(".toggle-theme"),
    blogViewButton = document.querySelector(".blog__toggle"),
    splides = document.querySelector(".logos"),
    imagesOverlay = document.querySelector('.images-overlay'),
    btnScrollToTop = document.querySelector(".top");


  /* =======================================================
  // Menu + Search + Theme Switcher + Blog List View
  ======================================================= */
  menuToggle.addEventListener("click", () => {
    menu();
  });

  searchOpenButton.forEach(button => {
    button.addEventListener("click", searchOpen);
  });

  searchCloseIcon.addEventListener("click", () => {
    searchClose();
  });

  searchOverlay.addEventListener("click", () => {
    searchClose();
  });

  if (blogViewButton) {
    blogViewButton.addEventListener("click", () => {
      viewToggle();
    });
  }


  // Menu
  function menu() {
    const isOpen = menuToggle.classList.contains("is-open");
    menuToggle.classList.toggle("is-open");
    menuList.classList.toggle("is-visible");
    
    // Track menu toggle
    if (window.amplitudeHelper && window.amplitudeHelper.track) {
      window.amplitudeHelper.track('Menu Toggled', {
        menu_state: isOpen ? 'closed' : 'opened',
        menu_location: 'header'
      });
    }
  }

  // Dropdown Menu
  document.querySelectorAll('.dropdown-toggle').forEach(function(toggle) {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();

      document.querySelectorAll('.dropdown-menu').forEach(function(menu) {
        if (menu !== toggle.nextElementSibling) {
          menu.classList.remove('is-visible');
        }
      });

      this.nextElementSibling.classList.toggle('is-visible');
    });
  });

  document.addEventListener('click', function(e) {
    if (!e.target.closest('.nav__item')) {
      document.querySelectorAll('.dropdown-menu').forEach(function(menu) {
        menu.classList.remove('is-visible');
      });
    }
  });


  // Search
  let searchOpenTime = null;
  let searchLocation = 'header'; // Default, will be updated based on trigger
  
  function searchOpen(event) {
    // Determine search location based on trigger
    const trigger = event && event.target ? event.target.closest('.search-button, .hero__search') : null;
    if (trigger) {
      searchLocation = trigger.classList.contains('hero__search') ? 'hero' : 'header';
    } else {
      // Fallback: check which button was clicked
      searchLocation = 'header'; // Default to header
    }
    
    searchOpenTime = Date.now();
    search.classList.add("is-visible");
    body.classList.add("search-is-visible");
    globalWrap.classList.add("is-active");
    menuToggle.classList.remove("is-open");
    menuList.classList.remove("is-visible");
    setTimeout(function () {
      searchInput.focus();
    }, 250);
    
    // Track search opened
    if (window.amplitudeHelper && window.amplitudeHelper.track) {
      window.amplitudeHelper.track('Search Opened', {
        search_location: searchLocation
      });
    }
  }

  function searchClose() {
    search.classList.remove("is-visible");
    body.classList.remove("search-is-visible");
    globalWrap.classList.remove("is-active");
    
    // Track search closed with duration
    if (window.amplitudeHelper && window.amplitudeHelper.track && searchOpenTime) {
      const searchDuration = Math.round((Date.now() - searchOpenTime) / 1000);
      window.amplitudeHelper.track('Search Closed', {
        search_duration: searchDuration,
        search_location: searchLocation
      });
      searchOpenTime = null;
    }
  }

  document.addEventListener('keydown', function(e){
    if (e.key == 'Escape') {
      searchClose();
    }
  });


  // Theme Switcher
  if (toggleTheme && isToggleEnabled) {
    toggleTheme.addEventListener("click", () => {
      const isDarkMode = html.classList.contains("dark-mode");
      const themeFrom = isDarkMode ? 'dark' : 'light';
      const themeTo = isDarkMode ? 'light' : 'dark';
      
      if (isDarkMode) {
        setTheme("light");
        localStorage.setItem("theme", "light");
      } else {
        setTheme("dark");
        localStorage.setItem("theme", "dark");
      }
      
      // Track theme toggle
      if (window.amplitudeHelper && window.amplitudeHelper.track) {
        window.amplitudeHelper.track('Theme Toggled', {
          theme_from: themeFrom,
          theme_to: themeTo,
          toggle_location: 'header'
        });
        
        // Update user property
        if (window.amplitudeHelper && window.amplitudeHelper.setUserProperty) {
          window.amplitudeHelper.setUserProperty('preferred_theme', themeTo);
        }
      }
    });
  }


  // Blog List View
  function viewToggle() {
    const isList = html.classList.contains('view-list');
    const viewType = isList ? 'grid' : 'list';
    
    if (isList) {
      html.classList.remove('view-list');
      localStorage.removeItem("classView");
      document.documentElement.removeAttribute("list");
    } else {
      html.classList.add('view-list');
      localStorage.setItem("classView", "list");
      document.documentElement.setAttribute("list", "");
    }
    
    // Track view toggle
    if (window.amplitudeHelper && window.amplitudeHelper.track) {
      window.amplitudeHelper.track('View Toggle Changed', {
        view_type: viewType,
        page_type: 'home'
      });
      
      // Update user property
      if (window.amplitudeHelper && window.amplitudeHelper.setUserProperty) {
        window.amplitudeHelper.setUserProperty('preferred_view', viewType);
      }
    }
  }


  /* ============================
  // Logos Slider
  ============================ */
  if (splides) {
    new Splide(splides, {
      direction: 'ltr',
      clones: 8,
      gap: 16,
      autoWidth: true,
      drag: true,
      arrows: false,
      pagination: false,
      type: 'loop',
      autoScroll: {
        autoStart: true,
        speed: 0.4,
        pauseOnHover: false,
        pauseOnFocus: false
      },
      intersection: {
        inView: {
          autoScroll: true,
        },
        outView: {
          autoScroll: false,
        }
      },
    }).mount(window.splide.Extensions);
  }


  /* ================================================================
  // Stop Animations During Window Resizing and Switching Theme Modes
  ================================================================ */
  let disableTransition;

  if (toggleTheme) {
    toggleTheme.addEventListener("click", () => {
      stopAnimation();
    });
  }

  window.addEventListener("resize", () => {
    stopAnimation();
  });

  function stopAnimation() {
    document.body.classList.add("disable-animation");
    clearTimeout(disableTransition);
    disableTransition = setTimeout(() => {
      document.body.classList.remove("disable-animation");
    }, 100);
  };


  // =====================
  // Simple Jekyll Search
  // =====================
  let lastSearchQuery = '';
  let searchDebounceTimer = null;
  
  SimpleJekyllSearch({
    searchInput: document.getElementById("js-search-input"),
    resultsContainer: document.getElementById("js-results-container"),
    json: "/search.json",
    searchResultTemplate: '{article}',
    noResultsText: '<div class="no-results">No results found...</div>',
    keys: ['title', 'excerpt', 'content'],
    templateMiddleware: function(prop, value, template) {
      return value;
    },
    success: function(data) {
      // Track search query (debounced)
      if (searchInput && searchInput.value && searchInput.value !== lastSearchQuery) {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(function() {
          const query = searchInput.value.trim();
          if (query && query.length > 0) {
            lastSearchQuery = query;
            
            // Count results
            const resultsContainer = document.getElementById("js-results-container");
            const resultsCount = resultsContainer ? resultsContainer.querySelectorAll('.article').length : 0;
            
            // Track search query
            if (window.amplitudeHelper && window.amplitudeHelper.track) {
              window.amplitudeHelper.track('Search Query Entered', {
                search_query: query,
                query_length: query.length,
                results_count: resultsCount
              });
            }
          }
        }, 500); // 500ms debounce
      }
    }
  });
  
  // Track search result clicks
  document.addEventListener('click', function(e) {
    const resultLink = e.target.closest('#js-results-container .article a, #js-results-container .article__title a');
    if (resultLink && searchInput && searchInput.value) {
      const resultTitle = resultLink.textContent.trim();
      const resultUrl = resultLink.href;
      
      // Find result position
      const resultsContainer = document.getElementById("js-results-container");
      const allResults = resultsContainer ? Array.from(resultsContainer.querySelectorAll('.article')) : [];
      const resultIndex = allResults.findIndex(result => result.contains(resultLink));
      const resultPosition = resultIndex >= 0 ? resultIndex + 1 : 0;
      
      // Track search result click
      if (window.amplitudeHelper && window.amplitudeHelper.track) {
        window.amplitudeHelper.track('Search Result Clicked', {
          result_title: resultTitle,
          result_type: 'post',
          result_position: resultPosition,
          search_query: searchInput.value.trim()
        });
      }
    }
  });


  /* =======================
  // Responsive Videos
  ======================= */
  reframe(".post__content iframe:not(.reframe-off), .page__content iframe:not(.reframe-off)");


  /* =======================
  // LazyLoad Images
  ======================= */
  var lazyLoadInstance = new LazyLoad({
    elements_selector: ".lazy"
  })


  /* =======================
  // Zoom Image
  ======================= */
  if (imagesOverlay) {
    const images = document.querySelectorAll('.post__content img, .page__content img, .gallery__image img, .logos__image img');
    let isDragging = false;
    let startX;
    let scrollLeft;

    const clearOverlay = () => {
      imagesOverlay.classList.remove('active');
      imagesOverlay.innerHTML = '';
    };

    const createImageElement = (src) => {
      const img = document.createElement('img');
      img.src = src;
      return img;
    };

    const createDescriptionElement = (description) => {
      const descriptionElem = document.createElement('p');
      descriptionElem.textContent = description;
      descriptionElem.classList.add('image-overlay__description');
      return descriptionElem;
    };

    images.forEach(image => {
      // Handle mouse events for drag detection
      image.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.pageX - image.parentElement.offsetLeft;
        scrollLeft = image.parentElement.scrollLeft;
      });

      image.addEventListener('mouseup', () => {
        isDragging = false;
      });

      image.addEventListener('mouseleave', () => {
        isDragging = false;
      });

      image.addEventListener('click', (e) => {
        // Only trigger zoom if we're not dragging
        if (!isDragging) {
          let description = '';
          // Prefer data-caption if present (for carousel images)
          if (image.hasAttribute('data-caption')) {
            description = image.getAttribute('data-caption');
          } else {
            // fallback for gallery images
            const galleryImage = image.closest('.gallery__image, .logos__image');
            description = galleryImage?.querySelector('.gallery__image__caption')?.textContent || '';
          }
          
          // Determine image location
          let imageLocation = 'post';
          if (image.closest('.gallery__image')) {
            imageLocation = 'gallery';
          } else if (image.closest('.logos__image')) {
            imageLocation = 'logos';
          } else if (image.closest('.project-card')) {
            imageLocation = 'project';
          }
          
          imagesOverlay.classList.add('active');

          imagesOverlay.innerHTML = '';
          imagesOverlay.appendChild(createImageElement(image.src));

          if (description) {
            imagesOverlay.appendChild(createDescriptionElement(description));
          }
          
          // Track image zoom
          if (window.amplitudeHelper && window.amplitudeHelper.track) {
            window.amplitudeHelper.track('Image Zoomed', {
              image_location: imageLocation,
              image_alt: image.alt || ''
            });
          }
        }
      });
    });

    imagesOverlay.addEventListener('click', clearOverlay);
  }


  // =====================
  // Copy Code Button
  // =====================
  document.querySelectorAll('.post__content pre.highlight, .page__content pre.highlight')
  .forEach(function (pre) {
    const button = document.createElement('button');
    const copyText = 'Copy';
    button.type = 'button';
    button.ariaLabel = 'Copy code to clipboard';
    button.innerText = copyText;
    button.addEventListener('click', function () {
      let code = pre.querySelector('code').innerText;
      try {
        code = code.trimEnd();
      } catch (e) {
        code = code.trim();
      }
      
      // Detect code language
      const codeElement = pre.querySelector('code');
      let codeLanguage = 'unknown';
      if (codeElement) {
        const classes = codeElement.className.split(' ');
        const langClass = classes.find(cls => cls.startsWith('language-'));
        if (langClass) {
          codeLanguage = langClass.replace('language-', '');
        }
      }
      
      navigator.clipboard.writeText(code);
      button.innerText = 'Copied!';
      setTimeout(function () {
        button.blur();
        button.innerText = copyText;
      }, 2e3);
      
      // Track code copy
      if (window.amplitudeHelper && window.amplitudeHelper.track) {
        window.amplitudeHelper.track('Code Copied', {
          code_language: codeLanguage,
          code_length: code.length
        });
      }
    });
    pre.appendChild(button);
  });


  // =====================
  // Load More Posts
  // =====================
  var load_posts_button=document.querySelector(".load-more-posts");

  load_posts_button&&load_posts_button.addEventListener("click",function(e){e.preventDefault();var t=load_posts_button.textContent;load_posts_button.classList.add("button--loading"),load_posts_button.textContent="Loading";var o=document.querySelector(".pagination"),n=pagination_next_url.split("/page")[0]+"/page/"+pagination_next_page_number+"/";fetch(n).then(function(e){if(e.ok)return e.text()}).then(function(e){var n=document.createElement("div");n.innerHTML=e;for(var a=document.querySelector(".grid"),i=n.querySelectorAll(".grid__post"),l=0;l<i.length;l++)a.appendChild(i.item(l));new LazyLoad({elements_selector:".lazy"}),pagination_next_page_number++,pagination_next_page_number>pagination_available_pages_number&&(o.style.display="none")}).finally(function(){load_posts_button.classList.remove("button--loading"),load_posts_button.textContent=t})});


  /* =======================
  // Scroll Top Button
  ======================= */
  window.addEventListener("scroll", function () {
  window.scrollY > window.innerHeight ? btnScrollToTop.classList.add("is-active") : btnScrollToTop.classList.remove("is-active");
  });

  btnScrollToTop.addEventListener("click", function () {
    if (window.scrollY != 0) {
      // Calculate scroll position percentage
      const scrollPosition = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth"
      });
      
      // Track scroll to top
      if (window.amplitudeHelper && window.amplitudeHelper.track) {
        window.amplitudeHelper.track('Scroll to Top Clicked', {
          scroll_position: scrollPosition
        });
      }
    }
  });


  /* =======================
  // Load More Gallery
  ======================= */
  const loadMoreGallery = document.querySelector('.load-more-gallery');
  const galleryLoadMore = document.getElementById('gallery-load-more');
  
  if (loadMoreGallery && galleryLoadMore) {
    let currentPage = 1;
    const itemsPerPage = 5;
    
    const createGalleryItem = (src, alt, caption, isLarge = false) => {
      const item = document.createElement('div');
      item.className = `gallery-page__item${isLarge ? ' gallery-page__item--large' : ''}`;
      
      item.innerHTML = `
        <figure class="gallery__image">
          <img class="lazy" data-src="${src}" alt="${alt}">
          <figcaption class="gallery__image__caption">${caption}</figcaption>
        </figure>
      `;
      
      return item;
    };
    
    const loadMoreItems = () => {
      // Simulate loading more items (replace with actual data loading)
      const newItems = [
        {
          src: '/images/gallery/coding-station.jpg',
          alt: 'Coding Station',
          caption: 'Where creativity meets technology.',
          isLarge: true
        },
        {
          src: '/images/gallery/daily-routine.jpg',
          alt: 'Daily Routine',
          caption: 'Finding beauty in everyday moments.'
        },
        {
          src: '/images/gallery/desk-setup.jpg',
          alt: 'Desk Setup',
          caption: 'A workspace that inspires.'
        },
        {
          src: '/images/gallery/tech-life.jpg',
          alt: 'Tech Life',
          caption: 'Living in the digital age.'
        },
        {
          src: '/images/gallery/gaming-setup.jpg',
          alt: 'Gaming Setup',
          caption: 'Where gaming dreams come alive.',
          isLarge: true
        }
      ];
      
      newItems.forEach(item => {
        const galleryItem = createGalleryItem(item.src, item.alt, item.caption, item.isLarge);
        galleryLoadMore.parentNode.insertBefore(galleryItem, galleryLoadMore);
      });
      
      // Initialize lazy loading for new images
      new LazyLoad({
        elements_selector: '.lazy'
      });
      
      currentPage++;
      
      // Hide load more button if we've reached the end
      if (currentPage >= 3) { // Example limit
        loadMoreGallery.style.display = 'none';
      }
    };
    
    loadMoreGallery.addEventListener('click', loadMoreItems);
  }

  /* =======================================================
  // Homepage-Specific Amplitude Tracking
  ======================================================= */

  // Track Hero CTA Button Click
  const heroCTA = document.querySelector('.hero__button[data-amplitude-track="hero-cta"]');
  if (heroCTA) {
    heroCTA.addEventListener('click', function() {
      if (window.amplitudeHelper && window.amplitudeHelper.track) {
        window.amplitudeHelper.track('Hero CTA Clicked', {
          cta_text: this.textContent.trim(),
          cta_location: 'hero',
          scroll_depth_at_action: getCurrentScrollDepth()
        });
      }
    });
  }

  // Track Header Navigation Clicks
  document.querySelectorAll('.main-nav .nav__link').forEach(function(navLink) {
    navLink.addEventListener('click', function() {
      if (window.amplitudeHelper && window.amplitudeHelper.track) {
        window.amplitudeHelper.track('Navigation Clicked', {
          nav_location: 'header',
          nav_item: this.textContent.trim(),
          nav_url: this.href
        });
      }
    });
  });

  // Track Dropdown Navigation Clicks
  document.querySelectorAll('.dropdown-menu .nav__link').forEach(function(navLink) {
    navLink.addEventListener('click', function() {
      if (window.amplitudeHelper && window.amplitudeHelper.track) {
        window.amplitudeHelper.track('Navigation Clicked', {
          nav_location: 'header',
          nav_item: this.textContent.trim(),
          nav_url: this.href,
          nav_type: 'dropdown'
        });
      }
    });
  });

  // Track Logo Click (home navigation)
  const logoLink = document.querySelector('.logo__link');
  if (logoLink) {
    logoLink.addEventListener('click', function() {
      if (window.amplitudeHelper && window.amplitudeHelper.track) {
        window.amplitudeHelper.track('Navigation Clicked', {
          nav_location: 'header',
          nav_item: 'Logo',
          nav_url: this.href
        });
      }
    });
  }

  // Track Blog Post Card Clicks (homepage grid)
  document.querySelectorAll('.section-blog .article').forEach(function(article, index) {
    const postLink = article.querySelector('.article__image, .article__title a');
    if (postLink) {
      postLink.addEventListener('click', function() {
        if (window.amplitudeHelper && window.amplitudeHelper.track) {
          const postTitle = article.querySelector('.article__title')?.textContent?.trim() || '';
          const postTags = Array.from(article.querySelectorAll('.article__tag')).map(tag => tag.textContent.trim());
          const postDate = article.querySelector('.article__date')?.getAttribute('datetime') || '';
          
          window.amplitudeHelper.track('Post Card Clicked', {
            post_title: postTitle,
            post_tags: postTags,
            post_date: postDate,
            card_position: index + 1,
            click_location: 'homepage_grid',
            scroll_depth_at_action: getCurrentScrollDepth()
          });
        }
      });
    }
  });

  // Track Blog Post Tag Clicks (homepage)
  document.querySelectorAll('.section-blog .article__tag').forEach(function(tagLink) {
    tagLink.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent triggering post card click
      
      if (window.amplitudeHelper && window.amplitudeHelper.track) {
        const article = this.closest('.article');
        const postTitle = article ? article.querySelector('.article__title')?.textContent?.trim() : '';
        
        window.amplitudeHelper.track('Post Tag Clicked', {
          tag_name: this.textContent.trim(),
          tag_color: this.style.backgroundColor || '',
          post_title: postTitle,
          click_location: 'homepage_grid'
        });
      }
    });
  });

  // Track Load More Posts Button
  const loadMoreButton = document.querySelector('.load-more-posts');
  if (loadMoreButton) {
    loadMoreButton.addEventListener('click', function() {
      if (window.amplitudeHelper && window.amplitudeHelper.track) {
        const currentPage = window.pagination_next_page_number || 1;
        const totalPages = window.pagination_available_pages_number || 1;
        
        window.amplitudeHelper.track('Load More Posts Clicked', {
          current_page: currentPage,
          total_pages: totalPages,
          posts_loaded: (currentPage - 1) * 4 // Assuming 4 posts per page
        });
      }
    });
  }

  // Track Featured Tag Image Clicks
  document.querySelectorAll('.section-tags .section-tags__image').forEach(function(tagImage) {
    tagImage.addEventListener('click', function() {
      if (window.amplitudeHelper && window.amplitudeHelper.track) {
        const tagName = this.querySelector('.section-tags__name')?.textContent?.trim() || '';
        const tagColor = this.querySelector('.section-tags__name')?.style?.background || '';
        
        window.amplitudeHelper.track('Featured Tag Clicked', {
          tag_name: tagName,
          tag_color: tagColor,
          click_location: 'homepage_tags'
        });
      }
    });
  });

  // Track Featured Tag Post Clicks
  document.querySelectorAll('.section-tags .section-tags__title a').forEach(function(postLink, index) {
    postLink.addEventListener('click', function() {
      if (window.amplitudeHelper && window.amplitudeHelper.track) {
        const tagSection = this.closest('.col');
        const tagName = tagSection ? tagSection.querySelector('.section-tags__name')?.textContent?.trim() : '';
        
        window.amplitudeHelper.track('Featured Tag Post Clicked', {
          tag_name: tagName,
          post_title: this.textContent.trim(),
          post_position: (index % 4) + 1 // Position within tag section (1-4)
        });
      }
    });
  });

  // Track Footer Navigation Clicks
  document.querySelectorAll('.footer-nav__link').forEach(function(footerLink) {
    footerLink.addEventListener('click', function() {
      if (window.amplitudeHelper && window.amplitudeHelper.track) {
        window.amplitudeHelper.track('Navigation Clicked', {
          nav_location: 'footer',
          nav_item: this.textContent.trim(),
          nav_url: this.href
        });
      }
    });
  });

  // Track Footer Social Links
  document.querySelectorAll('.footer__social__link').forEach(function(socialLink) {
    socialLink.addEventListener('click', function() {
      if (window.amplitudeHelper && window.amplitudeHelper.track) {
        const platform = this.getAttribute('aria-label')?.replace(' link', '') || 'unknown';
        
        window.amplitudeHelper.track('Social Link Clicked', {
          social_platform: platform,
          link_location: 'footer'
        });
      }
    });
  });

  // Track Footer Recent Post Clicks
  document.querySelectorAll('.footer__recent-content a').forEach(function(postLink, index) {
    postLink.addEventListener('click', function() {
      if (window.amplitudeHelper && window.amplitudeHelper.track) {
        const postTitle = this.closest('.footer__recent-content')?.querySelector('.footer__recent-title a')?.textContent?.trim() || '';
        const postDate = this.closest('.footer__recent-content')?.querySelector('.footer__recent-date')?.textContent?.trim() || '';
        
        window.amplitudeHelper.track('Footer Post Clicked', {
          post_title: postTitle,
          post_date: postDate,
          post_position: index + 1
        });
      }
    });
  });

  /* =======================================================
  // Resume Page-Specific Amplitude Tracking (Phase 4.0)
  ======================================================= */
  
  // Only run on resume page
  if (window.location.pathname.includes('/resume/')) {
    
    // Track Resume Page Viewed (enhanced version of page view)
    if (window.amplitudeHelper && window.amplitudeHelper.track) {
      window.amplitudeHelper.track('Resume Page Viewed', {
        page_type: 'resume',
        referrer: document.referrer || 'direct',
        referrer_domain: document.referrer ? new URL(document.referrer).hostname : 'direct'
      });
    }
    
    // Track Contact Button Click (CRITICAL conversion event)
    const resumeContactLink = document.querySelector('.resume-contact__link[href="/contact"]');
    if (resumeContactLink) {
      resumeContactLink.addEventListener('click', function() {
        const visibleSection = getVisibleResumeSection();
        trackResumeEvent('Resume Contact Clicked', {
          contact_method: 'email',
          click_location: 'resume_header',
          section_visible: visibleSection,
          scroll_depth_at_action: getCurrentScrollDepth(),
          sections_viewed_count: engagementData.sectionsViewed.size
        });
      });
    }
    
    // Track Social Links (LinkedIn, GitHub)
    const socialLinks = document.querySelectorAll('.resume-contact__link[target="_blank"]');
    socialLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        const href = this.getAttribute('href');
        let platform = 'unknown';
        
        if (href.includes('linkedin')) {
          platform = 'LinkedIn';
        } else if (href.includes('github')) {
          platform = 'GitHub';
        }
        
        const visibleSection = getVisibleResumeSection();
        trackResumeEvent('Resume Social Link Clicked', {
          social_platform: platform,
          click_location: 'resume_header',
          section_visible: visibleSection
        });
      });
    });
    
    // Resume Scroll Depth Tracking
    let scrollDepthTracked = {
      25: false,
      50: false,
      75: false,
      100: false
    };
    
    let resumeStartTime = Date.now();
    let maxScrollDepth = 0;
    let sectionsViewed = new Set();
    
    function trackScrollDepth() {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollPercentage = Math.round((scrollTop + windowHeight) / documentHeight * 100);
      
      // Update max scroll depth
      maxScrollDepth = Math.max(maxScrollDepth, scrollPercentage);
      
      // Track milestones
      [25, 50, 75, 100].forEach(function(depth) {
        if (scrollPercentage >= depth && !scrollDepthTracked[depth]) {
          scrollDepthTracked[depth] = true;
          const timeToDepth = Math.round((Date.now() - resumeStartTime) / 1000);
          
          trackResumeEvent('Resume Scroll Depth', {
            scroll_depth: depth,
            time_to_depth: timeToDepth,
            sections_viewed: Array.from(sectionsViewed)
          });
        }
      });
    }
    
    // Throttle scroll events
    let scrollTimeout;
    window.addEventListener('scroll', function() {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(trackScrollDepth, 100);
    }, { passive: true });
    
    // Track Section Visibility using Intersection Observer
    function trackSectionVisibility() {
      const sections = document.querySelectorAll('.resume-section, .resume-sidebar-section');
      
      if (!window.IntersectionObserver) {
        // Fallback for older browsers
        return;
      }
      
      const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            const sectionElement = entry.target;
            const sectionName = getSectionName(sectionElement);
            
            if (sectionName && !sectionsViewed.has(sectionName)) {
              sectionsViewed.add(sectionName);
              
              const timeToSection = Math.round((Date.now() - resumeStartTime) / 1000);
              const scrollDepth = Math.round((window.pageYOffset + window.innerHeight) / document.documentElement.scrollHeight * 100);
              
              trackResumeEvent('Resume Section Viewed', {
                section_name: sectionName,
                section_position: Array.from(sectionsViewed).length,
                time_to_section: timeToSection,
                scroll_depth_at_section: scrollDepth
              });
            }
          }
        });
      }, {
        threshold: 0.3, // Trigger when 30% of section is visible
        rootMargin: '-50px 0px' // Start tracking slightly before section enters viewport
      });
      
      sections.forEach(function(section) {
        observer.observe(section);
      });
    }
    
    // Track Work Experience Interactions
    function trackWorkExperience() {
      const experienceItems = document.querySelectorAll('.company-experience, .position-item');
      
      if (!window.IntersectionObserver) {
        return;
      }
      
      const experienceObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting && !entry.target.dataset.tracked) {
            entry.target.dataset.tracked = 'true';
            
            const companyElement = entry.target.closest('.company-experience');
            if (companyElement) {
              const companyName = companyElement.querySelector('.company-experience__name')?.textContent?.trim() || 'Unknown';
              const positionTitle = entry.target.querySelector('.position-item__title')?.textContent?.trim() || 'Unknown';
              const companyPeriod = companyElement.querySelector('.company-experience__period')?.textContent?.trim() || '';
              
              // Count position index
              const allPositions = Array.from(document.querySelectorAll('.position-item'));
              const positionIndex = allPositions.indexOf(entry.target) + 1;
              
              const timeToExperience = Math.round((Date.now() - resumeStartTime) / 1000);
              
              if (window.amplitudeHelper && window.amplitudeHelper.track) {
                try {
                  window.amplitudeHelper.track('Resume Experience Viewed', {
                    company_name: companyName,
                    position_title: positionTitle,
                    company_period: companyPeriod,
                    position_index: positionIndex,
                    time_to_experience: timeToExperience
                  });
                } catch (error) {
                  console.error('Amplitude: Error tracking experience viewed', error);
                }
              }
            }
          }
        });
      }, {
        threshold: 0.5,
        rootMargin: '-100px 0px'
      });
      
      experienceItems.forEach(function(item) {
        experienceObserver.observe(item);
      });
    }
    
    // Track Certification Link Clicks
    const certificationLinks = document.querySelectorAll('.certification-verify');
    certificationLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        const certificationItem = this.closest('.certification-item');
        const certName = certificationItem?.querySelector('h4')?.textContent?.trim() || 'Unknown';
        const certIssuer = certificationItem?.querySelector('p')?.textContent?.split('•')[0]?.trim() || 'Unknown';
        const certYear = certificationItem?.querySelector('p')?.textContent?.match(/\d{4}/)?.[0] || '';
        
        trackResumeEvent('Resume Certification Clicked', {
          certification_name: certName,
          certification_issuer: certIssuer,
          certification_year: certYear,
          verification_link_clicked: true
        });
      });
    });
    
    // Helper function to get section name
    function getSectionName(sectionElement) {
      const titleElement = sectionElement.querySelector('.resume-section__title, .resume-sidebar__title');
      if (titleElement) {
        const text = titleElement.textContent.trim();
        // Map to standardized names
        if (text.includes('Professional Summary')) return 'Professional Summary';
        if (text.includes('Key Achievements')) return 'Key Achievements';
        if (text.includes('Work Experience') || text.includes('Experience')) return 'Work Experience';
        if (text.includes('Education')) return 'Education';
        if (text.includes('Core Skills') || text.includes('Skills')) return 'Skills';
        if (text.includes('Certifications')) return 'Certifications';
        if (text.includes('Technical Skills')) return 'Technical Skills';
        if (text.includes('Technical Stack')) return 'Technical Stack';
        if (text.includes('Languages')) return 'Languages';
        return text;
      }
      return null;
    }
    
    // Helper function to get currently visible section
    function getVisibleResumeSection() {
      const sections = document.querySelectorAll('.resume-section, .resume-sidebar-section');
      const viewportTop = window.pageYOffset;
      const viewportBottom = viewportTop + window.innerHeight;
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;
        
        if (sectionTop <= viewportBottom && sectionBottom >= viewportTop) {
          return getSectionName(section) || 'Unknown';
        }
      }
      
      return 'Header';
    }
    
    // Track Time on Page and Engagement Summary
    let engagementData = {
      startTime: Date.now(),
      sectionsViewed: new Set(),
      maxScrollDepth: 0,
      contactClicked: false,
      socialLinksClicked: [],
      certificationsClicked: []
    };
    
    // Helper function to track events and update engagement data
    function trackResumeEvent(eventName, properties) {
      // Update engagement data BEFORE tracking
      if (eventName === 'Resume Contact Clicked') {
        engagementData.contactClicked = true;
      } else if (eventName === 'Resume Social Link Clicked' && properties.social_platform) {
        engagementData.socialLinksClicked.push(properties.social_platform);
      } else if (eventName === 'Resume Certification Clicked' && properties.certification_name) {
        engagementData.certificationsClicked.push(properties.certification_name);
      } else if (eventName === 'Resume Section Viewed' && properties.section_name) {
        engagementData.sectionsViewed.add(properties.section_name);
      } else if (eventName === 'Resume Scroll Depth' && properties.scroll_depth) {
        engagementData.maxScrollDepth = Math.max(engagementData.maxScrollDepth, properties.scroll_depth);
      }
      
      // Track the event
      if (window.amplitudeHelper && window.amplitudeHelper.track) {
        try {
          window.amplitudeHelper.track(eventName, properties);
        } catch (error) {
          console.error('Amplitude: Error tracking resume event', error);
        }
      }
    }
    
    // Track engagement summary on page unload or after 30 seconds
    let engagementSummaryTracked = false;
    function trackEngagementSummary() {
      if (engagementSummaryTracked) {
        return; // Prevent double tracking
      }
      engagementSummaryTracked = true;
      
      const totalTime = Math.round((Date.now() - engagementData.startTime) / 1000);
      
      // Calculate engagement score (0-100)
      let engagementScore = 0;
      engagementScore += Math.min(engagementData.sectionsViewed.size * 10, 40); // Max 40 points for sections
      engagementScore += Math.min(engagementData.maxScrollDepth, 30); // Max 30 points for scroll depth
      engagementScore += Math.min(totalTime / 10, 20); // Max 20 points for time (1 point per 10 seconds, max 200 seconds)
      if (engagementData.contactClicked) engagementScore += 10; // 10 points for contact click
      
      if (window.amplitudeHelper && window.amplitudeHelper.track) {
        try {
          window.amplitudeHelper.track('Resume Engagement Summary', {
            total_time_seconds: totalTime,
            sections_viewed: Array.from(engagementData.sectionsViewed),
            scroll_depth_max: engagementData.maxScrollDepth,
            companies_viewed_count: engagementData.sectionsViewed.has('Work Experience') ? 1 : 0,
            skills_viewed_count: engagementData.sectionsViewed.has('Skills') || engagementData.sectionsViewed.has('Technical Skills') ? 1 : 0,
            contact_clicked: engagementData.contactClicked,
            social_links_clicked: engagementData.socialLinksClicked,
            certifications_clicked: engagementData.certificationsClicked.length,
            engagement_score: Math.round(engagementScore)
          });
        } catch (error) {
          console.error('Amplitude: Error tracking engagement summary', error);
        }
      }
    }
    
    // Track on page unload
    window.addEventListener('beforeunload', trackEngagementSummary);
    
    // Also track after 30 seconds of engagement
    setTimeout(function() {
      if (engagementData.maxScrollDepth > 25 || engagementData.sectionsViewed.size > 0) {
        trackEngagementSummary();
      }
    }, 30000);
    
    // Initialize tracking
    trackSectionVisibility();
    trackWorkExperience();
    
    // Initial scroll depth check
    trackScrollDepth();
  }

  /* =======================================================
  // Blog Post Page-Specific Amplitude Tracking (Phase 4.1)
  ======================================================= */
  
  // Only run on blog post pages
  if (document.querySelector('.post__content')) {
    
    // Track Post Scroll Depth (25%, 50%, 75%, 100%)
    let postScrollDepthTracked = {
      25: false,
      50: false,
      75: false,
      100: false
    };
    
    let postStartTime = Date.now();
    const postContent = document.querySelector('.post__content');
    const postTitle = document.querySelector('.post-title')?.textContent?.trim() || '';
    const postUrl = window.location.href;
    
    // Calculate reading time estimate (words / 180 words per minute)
    function getReadingTime() {
      if (!postContent) return 0;
      const text = postContent.textContent || '';
      const words = text.trim().split(/\s+/).length;
      return Math.ceil(words / 180);
    }
    
    const readingTimeMinutes = getReadingTime();
    
    function trackPostScrollDepth() {
      if (!postContent) return;
      
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollPercentage = Math.round((scrollTop + windowHeight) / documentHeight * 100);
      
      // Track milestones
      [25, 50, 75, 100].forEach(function(depth) {
        if (scrollPercentage >= depth && !postScrollDepthTracked[depth]) {
          postScrollDepthTracked[depth] = true;
          const timeToDepth = Math.round((Date.now() - postStartTime) / 1000);
          
          if (window.amplitudeHelper && window.amplitudeHelper.track) {
            try {
              window.amplitudeHelper.track('Post Scroll Depth', {
                scroll_depth: depth,
                post_title: postTitle,
                post_url: postUrl,
                time_to_depth: timeToDepth,
                reading_time_minutes: readingTimeMinutes
              });
            } catch (error) {
              console.error('Amplitude: Error tracking post scroll depth', error);
            }
          }
        }
      });
    }
    
    // Throttle scroll events
    let postScrollTimeout;
    window.addEventListener('scroll', function() {
      if (postScrollTimeout) {
        clearTimeout(postScrollTimeout);
      }
      postScrollTimeout = setTimeout(trackPostScrollDepth, 100);
    }, { passive: true });
    
    // Initial check
    trackPostScrollDepth();
    
    // Track Post Tag Clicks (on post page, not homepage)
    const postPageTags = document.querySelectorAll('.post-tags .post-tag');
    postPageTags.forEach(function(tag) {
      tag.addEventListener('click', function() {
        if (window.amplitudeHelper && window.amplitudeHelper.track) {
          try {
            window.amplitudeHelper.track('Post Tag Clicked', {
              tag_name: this.textContent.trim(),
              tag_color: this.style.backgroundColor || '',
              post_title: postTitle,
              click_location: 'post_page'
            });
          } catch (error) {
            console.error('Amplitude: Error tracking post tag click', error);
          }
        }
      });
    });
    
    // Track Share Button Clicks
    const shareLinks = document.querySelectorAll('.share__link');
    shareLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        if (window.amplitudeHelper && window.amplitudeHelper.track) {
          let platform = 'unknown';
          const href = this.getAttribute('href') || '';
          
          if (href.includes('facebook')) {
            platform = 'Facebook';
          } else if (href.includes('twitter') || href.includes('x.com')) {
            platform = 'Twitter';
          } else if (href.includes('pinterest')) {
            platform = 'Pinterest';
          } else if (href.includes('linkedin')) {
            platform = 'LinkedIn';
          }
          
          try {
            window.amplitudeHelper.track('Post Shared', {
              share_platform: platform,
              post_title: postTitle,
              post_url: postUrl
            });
          } catch (error) {
            console.error('Amplitude: Error tracking post share', error);
          }
        }
      });
    });
    
    // Track Related Post Clicks
    const relatedPostLinks = document.querySelectorAll('.related-posts .article__title a, .related-posts .article__image');
    relatedPostLinks.forEach(function(link, index) {
      link.addEventListener('click', function() {
        if (window.amplitudeHelper && window.amplitudeHelper.track) {
          const relatedPostTitle = this.closest('.article')?.querySelector('.article__title a')?.textContent?.trim() || 
                                   this.closest('.article')?.querySelector('.article__title')?.textContent?.trim() || 'Unknown';
          const relatedPostUrl = this.href || this.closest('a')?.href || '';
          
          try {
            window.amplitudeHelper.track('Related Post Clicked', {
              post_title: postTitle,
              related_post_title: relatedPostTitle,
              related_post_url: relatedPostUrl,
              position: index + 1
            });
          } catch (error) {
            console.error('Amplitude: Error tracking related post click', error);
          }
        }
      });
    });
    
    // Track Disqus Comments Opened (if enabled)
    const disqusButton = document.getElementById('show-comments-button');
    if (disqusButton) {
      disqusButton.addEventListener('click', function() {
        if (window.amplitudeHelper && window.amplitudeHelper.track) {
          try {
            window.amplitudeHelper.track('Post Comments Opened', {
              post_title: postTitle,
              post_url: postUrl,
              comment_system: 'Disqus'
            });
          } catch (error) {
            console.error('Amplitude: Error tracking comments opened', error);
          }
        }
      });
    }
  }

  /* =======================================================
  // Contact Page-Specific Amplitude Tracking (Phase 4.3)
  ======================================================= */
  
  // Only run on contact page
  if (window.location.pathname.includes('/contact/')) {
    const contactForm = document.querySelector('.form');
    
    if (contactForm) {
      let formStartTime = null;
      let formFieldsInteracted = new Set();
      let formSubmissionAttempted = false;
      let lastFieldFocused = null;
      let formAbandoned = false;
      
      // Track form started (first input focus)
      const formInputs = contactForm.querySelectorAll('input, textarea');
      let formStarted = false;
      
      formInputs.forEach(function(input, index) {
        input.addEventListener('focus', function() {
          // Track last field for abandonment tracking
          lastFieldFocused = this.id || this.name || 'unknown';
          
          if (!formStarted) {
            formStarted = true;
            formStartTime = Date.now();
            
            if (window.amplitudeHelper && window.amplitudeHelper.track) {
              try {
                window.amplitudeHelper.track('Contact Form Started', {
                  form_location: 'contact_page'
                });
              } catch (error) {
                console.error('Amplitude: Error tracking form started', error);
              }
            }
          }
          
          // Track field focused (optional - for UX insights)
          const fieldName = this.id || this.name || 'unknown';
          if (!formFieldsInteracted.has(fieldName)) {
            formFieldsInteracted.add(fieldName);
            
            if (window.amplitudeHelper && window.amplitudeHelper.track) {
              try {
                window.amplitudeHelper.track('Contact Form Field Focused', {
                  field_name: fieldName,
                  field_position: index + 1,
                  form_location: 'contact_page'
                });
              } catch (error) {
                // Silently fail for field focus tracking
              }
            }
          }
        });
      });
      
      // Track form submission
      contactForm.addEventListener('submit', function(event) {
        formSubmissionAttempted = true;
        
        const formCompletionTime = formStartTime ? Math.round((Date.now() - formStartTime) / 1000) : 0;
        const fieldsCompleted = formFieldsInteracted.size;
        
        // Get form values (sanitized - no PII)
        const nameField = contactForm.querySelector('#form-name');
        const emailField = contactForm.querySelector('#form-email');
        const messageField = contactForm.querySelector('#form-text');
        
        const nameLength = nameField?.value?.length || 0;
        const emailLength = emailField?.value?.length || 0;
        const messageLength = messageField?.value?.length || 0;
        
        if (window.amplitudeHelper && window.amplitudeHelper.track) {
          try {
            window.amplitudeHelper.track('Contact Form Submitted', {
              form_location: 'contact_page',
              form_completion_time: formCompletionTime,
              fields_completed: fieldsCompleted,
              name_length: nameLength,
              email_length: emailLength,
              message_length: messageLength,
              submission_status: 'attempted',
              scroll_depth_at_action: getCurrentScrollDepth()
            });
          } catch (error) {
            console.error('Amplitude: Error tracking form submission', error);
          }
        }
        
        // Note: We can't easily track form success/failure with Formspree
        // as it redirects to a success page. The submission_status indicates intent.
      });
      
      // Track form validation errors (if any)
      formInputs.forEach(function(input) {
        input.addEventListener('invalid', function() {
          if (window.amplitudeHelper && window.amplitudeHelper.track) {
            try {
              window.amplitudeHelper.track('Contact Form Error', {
                error_type: 'validation',
                error_field: this.id || this.name || 'unknown',
                form_location: 'contact_page'
              });
            } catch (error) {
              // Silently fail
            }
          }
        });
      });
      
      // Track form abandonment (1.3)
      window.addEventListener('beforeunload', function() {
        if (formStarted && !formSubmissionAttempted && !formAbandoned) {
          formAbandoned = true;
          
          const timeSpent = formStartTime ? Math.round((Date.now() - formStartTime) / 1000) : 0;
          
          if (window.amplitudeHelper && window.amplitudeHelper.track) {
            window.amplitudeHelper.track('Form Abandoned', {
              form_location: 'contact_page',
              fields_completed: formFieldsInteracted.size,
              fields_completed_list: Array.from(formFieldsInteracted),
              time_spent: timeSpent,
              last_field: lastFieldFocused || 'unknown',
              scroll_depth_at_abandon: getCurrentScrollDepth()
            });
          }
        }
      });
    }
  }

  /* =======================================================
  // Archive Page Tracking (Phase 4.4)
  ======================================================= */
  
  if (window.location.pathname.includes('/archive/')) {
    // Track archive post clicks
    document.querySelectorAll('.archive__item a, .archive__post a').forEach(function(postLink, index) {
      postLink.addEventListener('click', function() {
        if (window.amplitudeHelper && window.amplitudeHelper.track) {
          const postTitle = this.textContent.trim() || '';
          const postDate = this.closest('.archive__item, .archive__post')?.querySelector('.archive__date, time')?.textContent?.trim() || '';
          const postYear = postDate.match(/\d{4}/)?.[0] || '';
          
          window.amplitudeHelper.track('Archive Post Clicked', {
            post_title: postTitle,
            post_date: postDate,
            post_year: postYear,
            post_position: index + 1
          });
        }
      });
    });
  }

  /* =======================================================
  // Tags Page Tracking (Phase 4.5)
  ======================================================= */
  
  if (window.location.pathname.includes('/tags/') && !document.querySelector('.post__content')) {
    // Track tag clicks on the tags listing page
    document.querySelectorAll('.tag-cloud a, .tags-list a, .tag a').forEach(function(tagLink) {
      tagLink.addEventListener('click', function() {
        if (window.amplitudeHelper && window.amplitudeHelper.track) {
          const tagName = this.textContent.trim() || '';
          const tagCount = this.querySelector('.tag-count, .count')?.textContent?.trim() || '';
          
          window.amplitudeHelper.track('Tag Page Tag Clicked', {
            tag_name: tagName,
            tag_post_count: tagCount ? parseInt(tagCount.replace(/[()]/g, '')) : 0,
            click_location: 'tags_page'
          });
        }
      });
    });

    // Track post clicks within tag sections
    document.querySelectorAll('.tag-posts a, .tagged-posts a').forEach(function(postLink, index) {
      postLink.addEventListener('click', function() {
        if (window.amplitudeHelper && window.amplitudeHelper.track) {
          const postTitle = this.textContent.trim() || '';
          const tagSection = this.closest('[data-tag], .tag-section');
          const tagName = tagSection?.getAttribute('data-tag') || tagSection?.querySelector('h2, h3')?.textContent?.trim() || '';
          
          window.amplitudeHelper.track('Tag Page Post Clicked', {
            post_title: postTitle,
            tag_name: tagName,
            post_position: index + 1
          });
        }
      });
    });
  }

  /* =======================================================
  // Gallery Page Tracking (Phase 4.6)
  ======================================================= */
  
  if (window.location.pathname.includes('/gallery/')) {
    // Track gallery image clicks
    document.querySelectorAll('.gallery__image, .gallery-item').forEach(function(image, index) {
      image.addEventListener('click', function() {
        if (window.amplitudeHelper && window.amplitudeHelper.track) {
          const imgElement = this.querySelector('img') || this;
          const imageAlt = imgElement.alt || '';
          const imageTitle = imgElement.title || this.querySelector('.gallery__image__caption, figcaption')?.textContent?.trim() || '';
          
          window.amplitudeHelper.track('Gallery Image Clicked', {
            image_alt: imageAlt,
            image_title: imageTitle,
            image_position: index + 1,
            gallery_type: 'main'
          });
        }
      });
    });
  }

  /* =======================================================
  // Videos Page Tracking (Phase 4.7)
  ======================================================= */
  
  if (window.location.pathname.includes('/videos/')) {
    // Track video clicks/plays
    document.querySelectorAll('.video-item, .video-card, [data-video-id]').forEach(function(videoItem, index) {
      videoItem.addEventListener('click', function() {
        if (window.amplitudeHelper && window.amplitudeHelper.track) {
          const videoTitle = this.querySelector('.video-title, h3, h4')?.textContent?.trim() || '';
          const videoUrl = this.querySelector('a')?.href || this.getAttribute('data-video-url') || '';
          let videoPlatform = 'unknown';
          
          if (videoUrl.includes('youtube')) videoPlatform = 'YouTube';
          else if (videoUrl.includes('vimeo')) videoPlatform = 'Vimeo';
          else if (videoUrl.includes('twitch')) videoPlatform = 'Twitch';
          
          window.amplitudeHelper.track('Video Clicked', {
            video_title: videoTitle,
            video_url: videoUrl,
            video_platform: videoPlatform,
            video_position: index + 1
          });
        }
      });
    });
    
    // Track video thumbnail clicks specifically
    document.querySelectorAll('.video-thumbnail, .video__thumbnail').forEach(function(thumbnail, index) {
      thumbnail.addEventListener('click', function() {
        if (window.amplitudeHelper && window.amplitudeHelper.track) {
          const videoItem = this.closest('.video-item, .video-card');
          const videoTitle = videoItem?.querySelector('.video-title, h3, h4')?.textContent?.trim() || '';
          
          window.amplitudeHelper.track('Video Thumbnail Clicked', {
            video_title: videoTitle,
            click_location: 'videos_page',
            thumbnail_position: index + 1
          });
        }
      });
    });
  }

  /* =======================================================
  // 404 Error Tracking (Phase 5.3)
  ======================================================= */
  
  // Track 404 errors - check if we're on a 404 page
  if (document.querySelector('.error-page, .page-404, [data-page-type="404"]') || 
      document.title.toLowerCase().includes('404') ||
      document.title.toLowerCase().includes('not found')) {
    
    if (window.amplitudeHelper && window.amplitudeHelper.track) {
      window.amplitudeHelper.track('404 Error', {
        requested_url: window.location.href,
        requested_path: window.location.pathname,
        referrer: document.referrer || 'direct',
        referrer_domain: document.referrer ? new URL(document.referrer).hostname : 'direct'
      });
    }
  }

  /* =======================================================
  // Session Tracking (Phase 5.1)
  ======================================================= */
  
  (function() {
    // Track session start (once per session)
    try {
      if (!sessionStorage.getItem('amplitude_session_started')) {
        sessionStorage.setItem('amplitude_session_started', 'true');
        sessionStorage.setItem('amplitude_session_start_time', Date.now().toString());
        
        if (window.amplitudeHelper && window.amplitudeHelper.track) {
          window.amplitudeHelper.track('Session Started', {
            referrer: document.referrer || 'direct',
            referrer_domain: document.referrer ? new URL(document.referrer).hostname : 'direct',
            landing_page: window.location.pathname,
            landing_page_type: window.AMPLITUDE_PAGE_DATA?.pageType || 'unknown'
          });
        }
      }
    } catch (e) { /* sessionStorage not available */ }
  })();

  /* =======================================================
  // Time on Page Tracking (Phase 5.1)
  ======================================================= */
  
  (function() {
    const pageStartTime = Date.now();
    let maxScrollDepth = 0;
    let interactionCount = 0;
    let timeOnPageTracked = false;
    
    // Track scroll depth for time on page
    window.addEventListener('scroll', function() {
      const scrollPercent = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
      maxScrollDepth = Math.max(maxScrollDepth, scrollPercent);
      interactionCount++;
    }, { passive: true });
    
    // Track clicks as interactions
    document.addEventListener('click', function() {
      interactionCount++;
    }, { passive: true });
    
    // Track time on page when user leaves
    function trackTimeOnPage() {
      if (timeOnPageTracked) return;
      timeOnPageTracked = true;
      
      const timeSpent = Math.round((Date.now() - pageStartTime) / 1000);
      
      // Only track if user spent meaningful time (> 5 seconds)
      if (timeSpent > 5 && window.amplitudeHelper && window.amplitudeHelper.track) {
        window.amplitudeHelper.track('Time on Page', {
          time_seconds: timeSpent,
          page_type: window.AMPLITUDE_PAGE_DATA?.pageType || 'unknown',
          page_path: window.location.pathname,
          scroll_depth_max: maxScrollDepth,
          interactions_count: interactionCount
        });
      }
    }
    
    // Track on page unload
    window.addEventListener('beforeunload', trackTimeOnPage);
    window.addEventListener('pagehide', trackTimeOnPage);
    
    // Also track after 60 seconds of engagement (for long sessions)
    setTimeout(function() {
      if (!timeOnPageTracked && maxScrollDepth > 25) {
        trackTimeOnPage();
      }
    }, 60000);
  })();

  /* =======================================================
  // User Properties Tracking (Phase 5.2)
  ======================================================= */
  
  (function() {
    if (!window.amplitudeHelper || !window.amplitudeHelper.setUserProperty) return;
    
    // Track preferred theme (already set on toggle, but ensure it's set on page load)
    try {
      const theme = localStorage.getItem('theme') || 'dark';
      window.amplitudeHelper.setUserProperty('preferred_theme', theme);
    } catch (e) { /* localStorage not available */ }
    
    // Track preferred view (grid/list)
    try {
      const view = localStorage.getItem('classView') || 'grid';
      window.amplitudeHelper.setUserProperty('preferred_view', view);
    } catch (e) { /* localStorage not available */ }
    
    // Track total posts viewed (increment counter)
    try {
      if (document.querySelector('.post__content')) {
        let postsViewed = parseInt(localStorage.getItem('amplitude_posts_viewed') || '0');
        postsViewed++;
        localStorage.setItem('amplitude_posts_viewed', postsViewed.toString());
        window.amplitudeHelper.setUserProperty('total_posts_viewed', postsViewed);
      }
    } catch (e) { /* localStorage not available */ }
    
    // returning_visitor and first_visit_date are already set in amplitude.js
  })();

  /* =======================================================
  // JavaScript Error Tracking (Phase 5.3)
  ======================================================= */
  
  window.addEventListener('error', function(event) {
    if (window.amplitudeHelper && window.amplitudeHelper.track) {
      // Don't track errors from extensions or third-party scripts
      const errorSource = event.filename || '';
      if (errorSource.includes('chrome-extension') || 
          errorSource.includes('moz-extension') ||
          errorSource.includes('safari-extension')) {
        return;
      }
      
      window.amplitudeHelper.track('JavaScript Error', {
        error_message: event.message || 'Unknown error',
        error_source: errorSource,
        error_line: event.lineno || 0,
        error_column: event.colno || 0,
        page_url: window.location.href,
        page_path: window.location.pathname
      });
    }
  });
  
  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    if (window.amplitudeHelper && window.amplitudeHelper.track) {
      window.amplitudeHelper.track('JavaScript Error', {
        error_message: event.reason?.message || event.reason || 'Unhandled Promise Rejection',
        error_type: 'unhandled_promise',
        page_url: window.location.href,
        page_path: window.location.pathname
      });
    }
  });

  /* =======================================================
  // Logo Carousel Tracking (Phase 3.8)
  ======================================================= */
  
  // Track logo carousel interactions (if Splide carousel exists)
  const logoCarousel = document.querySelector('.logos');
  if (logoCarousel && typeof Splide !== 'undefined') {
    // Track when carousel is manually dragged/navigated
    let carouselInteracted = false;
    
    logoCarousel.addEventListener('mousedown', function() {
      if (!carouselInteracted && window.amplitudeHelper && window.amplitudeHelper.track) {
        carouselInteracted = true;
        window.amplitudeHelper.track('Logo Carousel Interacted', {
          interaction_type: 'drag',
          carousel_location: 'homepage'
        });
      }
    });
    
    logoCarousel.addEventListener('touchstart', function() {
      if (!carouselInteracted && window.amplitudeHelper && window.amplitudeHelper.track) {
        carouselInteracted = true;
        window.amplitudeHelper.track('Logo Carousel Interacted', {
          interaction_type: 'touch',
          carousel_location: 'homepage'
        });
      }
    }, { passive: true });
  }

  /* =======================================================
  // Exit Intent Detection (1.2)
  ======================================================= */
  
  (function() {
    let exitIntentTracked = false;
    const pageStartTime = Date.now();
    let lastUserAction = 'page_load';
    
    // Track last user action for context
    document.addEventListener('click', function(e) {
      const target = e.target.closest('a, button, input, [data-action]');
      if (target) {
        lastUserAction = target.textContent?.trim().substring(0, 50) || target.className || 'click';
      }
    }, true);
    
    // Detect exit intent when mouse leaves viewport from top
    document.addEventListener('mouseleave', function(e) {
      if (e.clientY <= 0 && !exitIntentTracked) {
        exitIntentTracked = true;
        
        const timeOnPage = Math.round((Date.now() - pageStartTime) / 1000);
        const scrollDepth = Math.min(100, Math.round(
          (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100
        ));
        
        if (window.amplitudeHelper && window.amplitudeHelper.track) {
          window.amplitudeHelper.track('Exit Intent Detected', {
            page_type: window.AMPLITUDE_PAGE_DATA?.pageType || 'unknown',
            page_path: window.location.pathname,
            time_on_page: timeOnPage,
            scroll_depth: scrollDepth,
            last_action: lastUserAction
          });
        }
      }
    });
  })();

  /* =======================================================
  // Return Visit Tracking (2.2)
  ======================================================= */
  
  (function() {
    try {
      const lastVisitTimestamp = localStorage.getItem('amplitude_last_visit_time');
      let visitCount = parseInt(localStorage.getItem('amplitude_visit_count') || '0') + 1;
      
      // Update visit count and timestamp
      localStorage.setItem('amplitude_visit_count', visitCount.toString());
      localStorage.setItem('amplitude_last_visit_time', Date.now().toString());
      
      // Only track return visit if NOT first visit
      if (lastVisitTimestamp && visitCount > 1) {
        const daysSinceLastVisit = Math.floor(
          (Date.now() - parseInt(lastVisitTimestamp)) / (1000 * 60 * 60 * 24)
        );
        
        // Classify visitor type
        let visitorType = 'rare';
        if (daysSinceLastVisit <= 1) visitorType = 'daily';
        else if (daysSinceLastVisit <= 7) visitorType = 'weekly';
        else if (daysSinceLastVisit <= 30) visitorType = 'monthly';
        
        if (window.amplitudeHelper && window.amplitudeHelper.track) {
          window.amplitudeHelper.track('Return Visit', {
            days_since_last_visit: daysSinceLastVisit,
            total_visits: visitCount,
            visitor_type: visitorType,
            landing_page: window.location.pathname
          });
        }
        
        // Set user properties
        if (window.amplitudeHelper) {
          if (window.amplitudeHelper.setUserProperty) {
            window.amplitudeHelper.setUserProperty('total_site_visits', visitCount);
            window.amplitudeHelper.setUserProperty('visitor_type', visitorType);
          }
        }
      }
    } catch (e) { /* localStorage not available */ }
  })();

  /* =======================================================
  // Content Deep Dive Tracking (2.3)
  ======================================================= */
  
  if (document.querySelector('.post__content')) {
    (function() {
      try {
        // Get post count in session
        let postsInSession = parseInt(sessionStorage.getItem('amplitude_posts_this_session') || '0') + 1;
        sessionStorage.setItem('amplitude_posts_this_session', postsInSession.toString());
        
        // Get topics/tags explored
        let topicsExplored = JSON.parse(sessionStorage.getItem('amplitude_topics_explored') || '[]');
        const currentTags = window.AMPLITUDE_PAGE_DATA?.postTags || [];
        currentTags.forEach(function(tag) {
          if (!topicsExplored.includes(tag)) {
            topicsExplored.push(tag);
          }
        });
        sessionStorage.setItem('amplitude_topics_explored', JSON.stringify(topicsExplored));
        
        // Track deep dive at milestones (3, 5, 10 posts)
        if (postsInSession === 3 || postsInSession === 5 || postsInSession === 10) {
          if (window.amplitudeHelper && window.amplitudeHelper.track) {
            window.amplitudeHelper.track('Content Deep Dive', {
              posts_in_session: postsInSession,
              topics_explored: topicsExplored,
              topics_count: topicsExplored.length,
              milestone: postsInSession + '_posts'
            });
          }
          
          // Set user property for engaged readers at 3+ posts
          if (postsInSession >= 3 && window.amplitudeHelper && window.amplitudeHelper.setUserProperty) {
            window.amplitudeHelper.setUserProperty('engaged_reader', true);
          }
        }
      } catch (e) { /* sessionStorage not available */ }
    })();
  }

});