document.addEventListener("DOMContentLoaded", function() {
  'use strict';

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
    menuToggle.classList.toggle("is-open");
    menuList.classList.toggle("is-visible");
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
  function searchOpen() {
    search.classList.add("is-visible");
    body.classList.add("search-is-visible");
    globalWrap.classList.add("is-active");
    menuToggle.classList.remove("is-open");
    menuList.classList.remove("is-visible");
    setTimeout(function () {
      searchInput.focus();
    }, 250);
  }

  function searchClose() {
    search.classList.remove("is-visible");
    body.classList.remove("search-is-visible");
    globalWrap.classList.remove("is-active");
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
      if (isDarkMode) {
        setTheme("light");
        localStorage.setItem("theme", "light");
      } else {
        setTheme("dark");
        localStorage.setItem("theme", "dark");
      }
    });
  }


  // Blog List View
  function viewToggle() {
    if (html.classList.contains('view-list')) {
      html.classList.remove('view-list');
      localStorage.removeItem("classView");
      document.documentElement.removeAttribute("list");
    } else {
      html.classList.add('view-list');
      localStorage.setItem("classView", "list");
      document.documentElement.setAttribute("list", "");
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
  SimpleJekyllSearch({
    searchInput: document.getElementById("js-search-input"),
    resultsContainer: document.getElementById("js-results-container"),
    json: "/search.json",
    searchResultTemplate: '{article}',
    noResultsText: '<div class="no-results">No results found...</div>',
    keys: ['title', 'excerpt', 'content']
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
          const galleryImage = image.closest('.gallery__image, .logos__image');
          const description = galleryImage?.querySelector('.gallery__image__caption')?.textContent || '';
          imagesOverlay.classList.add('active');

          imagesOverlay.innerHTML = '';
          imagesOverlay.appendChild(createImageElement(image.src));

          if (description) {
            imagesOverlay.appendChild(createDescriptionElement(description));
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
      navigator.clipboard.writeText(code);
      button.innerText = 'Copied!';
      setTimeout(function () {
        button.blur();
        button.innerText = copyText;
      }, 2e3);
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
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth"
      })
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

});