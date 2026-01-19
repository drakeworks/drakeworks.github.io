/**
 * Projects Page JavaScript
 * =======================
 * 
 * Handles all interactive functionality for the projects/portfolio page:
 * - Client-side search with debouncing
 * - Multi-tag filtering (AND behavior)
 * - Sorting by featured/date
 * - Modal preview system with focus trap
 * - Keyboard navigation
 * - Analytics tracking
 * 
 * Features:
 * - Progressive enhancement (works without JS)
 * - Accessibility compliant
 * - Performance optimized
 * - Vanilla JavaScript (no dependencies)
 */

(function() {
  'use strict';
  


  // Configuration
  const CONFIG = {
    searchDebounceMs: 200,
    keyboardNavigation: {
      arrowKeys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
      escape: 'Escape',
      enter: 'Enter',
      space: ' '
    },
    analytics: {
      enabled: false, // Set to true and replace with your analytics
      trackEvent: function(action, label) {
        if (this.enabled) {
          // Replace with your analytics implementation
          // Example: gtag('event', action, { event_label: label });
        }
      }
    }
  };

  // State management
  let state = {
    searchQuery: '',
    activeFilters: new Set(),
    sortBy: 'featured',
    projects: [],
    visibleProjects: [],
    focusedProjectIndex: -1,
    modalOpen: false,
    initialLoadComplete: false
  };

  // DOM elements
  let elements = {
    searchInput: null,
    filterTags: [],
    sortSelect: null,
    sortTrigger: null,
    sortDropdown: null,
    sortOptions: [],
    projectCards: [],
    modal: null,
    modalBackdrop: null,
    modalContainer: null,
    modalClose: null,
    projectsGrid: null
  };

  /**
   * Initialize the projects page functionality
   */
  function init() {
    try {
      if (!document.querySelector('.projects-grid')) {
        return; // Not on projects page
      }

      initializeElements();
      initializeEventListeners();
      initializeProjects();
      updateVisibleProjects();
    } catch (error) {
      console.error('Error in init function:', error);
    }
  }

  /**
   * Initialize DOM element references
   */
  function initializeElements() {
    elements.searchInput = document.querySelector('.projects-search');
    elements.filterTags = Array.from(document.querySelectorAll('.filter-tag'));
    elements.sortSelect = document.getElementById('projects-sort-container');
    elements.sortTrigger = document.getElementById('projects-sort-trigger');
    elements.sortDropdown = document.getElementById('projects-sort-dropdown');
    elements.sortOptions = Array.from(document.querySelectorAll('.custom-select__option'));
    elements.projectCards = Array.from(document.querySelectorAll('.project-card'));
    elements.modal = document.getElementById('project-modal');
    elements.modalBackdrop = document.querySelector('.project-modal__backdrop');
    elements.modalContainer = document.querySelector('.project-modal__container');
    elements.modalClose = document.querySelector('.project-modal__close');
    elements.projectsGrid = document.querySelector('.projects-grid__container');
  }

  /**
   * Initialize event listeners
   */
  function initializeEventListeners() {
    // Search functionality
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', debounce(handleSearch, CONFIG.searchDebounceMs));
    }

    // Filter functionality
    elements.filterTags.forEach(tag => {
      tag.addEventListener('click', handleFilterClick);
    });

    // Sort functionality
    if (elements.sortTrigger) {
      elements.sortTrigger.addEventListener('click', handleSortToggle);
      elements.sortTrigger.addEventListener('keydown', handleSortKeydown);
      elements.sortOptions.forEach(option => {
        option.addEventListener('click', handleSortOptionClick);
        option.addEventListener('keydown', handleSortOptionKeydown);
      });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', handleOutsideClick);

    // Project card interactions
    elements.projectCards.forEach(card => {
      card.addEventListener('click', handleProjectClick);
      card.addEventListener('keydown', handleProjectKeydown);
    });

    // Modal functionality
    if (elements.modal) {
      elements.modalBackdrop.addEventListener('click', function() {
        // Track modal closed via outside click
        if (modalOpenTime && window.amplitudeHelper && window.amplitudeHelper.track) {
          const timeOpen = Math.round((Date.now() - modalOpenTime) / 1000);
          const projectTitle = document.getElementById('modal-title')?.textContent?.trim() || 'Unknown';
          
          try {
            window.amplitudeHelper.track('Project Modal Closed', {
              project_title: projectTitle,
              time_open: timeOpen,
              close_method: 'outside_click'
            });
          } catch (error) {
            console.error('Amplitude: Error tracking modal closed', error);
          }
        }
        modalOpenTime = null;
        closeModal();
      });
      elements.modalClose.addEventListener('click', function() {
        // Track modal closed via close button
        if (modalOpenTime && window.amplitudeHelper && window.amplitudeHelper.track) {
          const timeOpen = Math.round((Date.now() - modalOpenTime) / 1000);
          const projectTitle = document.getElementById('modal-title')?.textContent?.trim() || 'Unknown';
          
          try {
            window.amplitudeHelper.track('Project Modal Closed', {
              project_title: projectTitle,
              time_open: timeOpen,
              close_method: 'button'
            });
          } catch (error) {
            console.error('Amplitude: Error tracking modal closed', error);
          }
        }
        modalOpenTime = null;
        closeModal();
      });
      elements.modal.addEventListener('keydown', handleModalKeydown);
    }

    // Keyboard navigation
    document.addEventListener('keydown', handleGlobalKeydown);
  }

  /**
   * Initialize projects data from DOM
   */
  function initializeProjects() {
    state.projects = elements.projectCards.map(card => {
      const project = {
        element: card,
        title: card.querySelector('.project-card__title')?.textContent || '',
        summary: card.querySelector('.project-card__summary')?.textContent || '',
        modalSummary: card.dataset.summary || card.querySelector('.project-card__summary')?.textContent || '',
        tags: card.dataset.tags ? card.dataset.tags.split(',') : [],
        businessSkills: card.dataset.businessSkills ? card.dataset.businessSkills.split(',') : [],
        tools: card.dataset.tools ? card.dataset.tools.split(',') : [],
        date: card.dataset.date || '',
        featured: card.dataset.featured === 'true',
        featureRank: parseInt(card.dataset.featureRank) || 999, // Default high rank for non-featured projects
        role: card.dataset.role || '',
        metric: card.dataset.metric || '',
        metricIcon: card.dataset.metricIcon || 'fas fa-chart-line',
        figmaUrl: card.dataset.figmaUrl || '',
        demoUrl: card.dataset.demoUrl || '',
        githubUrl: card.dataset.githubUrl || '',
        caseStudyUrl: card.dataset.caseStudyUrl || '',
        miroUrl: card.dataset.miroUrl || '',
        imageSrc: card.querySelector('.project-card__image img')?.src || '',
        imageAlt: card.querySelector('.project-card__image img')?.alt || ''
      };
      
      return project;
    });
    
    // Populate project card business skills
    state.projects.forEach(project => {
      const toolsContainer = project.element.querySelector('.project-card__tools');
      if (toolsContainer && project.businessSkills.length > 0) {
        toolsContainer.innerHTML = project.businessSkills.map(skill => 
          `<span class="project-chip">${skill.trim()}</span>`
        ).join('');
      }
    });
  }

  /**
   * Handle search input
   */
  function handleSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    state.searchQuery = query;
    
    // Track search if query is not empty
    if (query && window.amplitudeHelper && window.amplitudeHelper.track) {
      try {
        window.amplitudeHelper.track('Project Search Performed', {
          search_query: query,
          query_length: query.length,
          results_count: 0, // Will be updated after filtering
          search_location: 'projects_page'
        });
      } catch (error) {
        console.error('Amplitude: Error tracking project search', error);
      }
    }
    
    showLoadingState();
    updateVisibleProjects();
    
    // Update results count after filtering
    if (query && window.amplitudeHelper && window.amplitudeHelper.track) {
      setTimeout(function() {
        try {
          window.amplitudeHelper.track('Project Search Performed', {
            search_query: query,
            query_length: query.length,
            results_count: state.visibleProjects.length,
            search_location: 'projects_page'
          });
        } catch (error) {
          // Silently fail
        }
      }, 600);
    }
  }

  /**
   * Handle filter tag clicks
   */
  function handleFilterClick(event) {
    const tag = event.target;
    const tagValue = tag.dataset.tag;
    
    // Check if this tag is already selected
    if (state.activeFilters.has(tagValue)) {
      // If it was already selected, deselect it
      state.activeFilters.delete(tagValue);
      tag.setAttribute('aria-pressed', 'false');
    } else {
      // Clear all other active filters first
      state.activeFilters.clear();
      elements.filterTags.forEach(filterTag => {
        filterTag.setAttribute('aria-pressed', 'false');
      });
      
      // Select only this tag
      state.activeFilters.add(tagValue);
      tag.setAttribute('aria-pressed', 'true');
    }
    
    // Track filter applied
    if (window.amplitudeHelper && window.amplitudeHelper.track) {
      try {
        window.amplitudeHelper.track('Project Filter Applied', {
          filter_type: 'tag',
          filter_value: tagValue,
          active_filters: Array.from(state.activeFilters),
          results_count: 0 // Will be updated after filtering
        });
      } catch (error) {
        console.error('Amplitude: Error tracking project filter', error);
      }
    }
    
    showLoadingState();
    updateVisibleProjects();
    
    // Update results count after filtering
    if (window.amplitudeHelper && window.amplitudeHelper.track) {
      setTimeout(function() {
        try {
          window.amplitudeHelper.track('Project Filter Applied', {
            filter_type: 'tag',
            filter_value: tagValue,
            active_filters: Array.from(state.activeFilters),
            results_count: state.visibleProjects.length
          });
        } catch (error) {
          // Silently fail
        }
      }, 600);
    }
  }

  /**
   * Handle sort selection (legacy)
   */
  function handleSortChange(event) {
    state.sortBy = event.target.value;
    showLoadingState();
    updateVisibleProjects();
  }

  /**
   * Handle custom sort dropdown toggle
   */
  function handleSortToggle(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const isOpen = elements.sortSelect.classList.contains('is-open');
    
    if (isOpen) {
      closeSortDropdown();
    } else {
      openSortDropdown();
    }
  }

  /**
   * Handle custom sort option selection
   */
  function handleSortOptionClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const option = event.currentTarget;
    const value = option.dataset.value;
    const text = option.textContent.trim();
    
    // Track sort change
    if (window.amplitudeHelper && window.amplitudeHelper.track) {
      try {
        window.amplitudeHelper.track('Project Sort Changed', {
          sort_by: value,
          sort_direction: value.includes('asc') ? 'asc' : (value.includes('desc') ? 'desc' : 'none'),
          results_count: state.visibleProjects.length
        });
      } catch (error) {
        console.error('Amplitude: Error tracking project sort', error);
      }
    }
    
    // Update state
    state.sortBy = value;
    
    // Update UI
    elements.sortSelect.querySelector('.custom-select__selected').textContent = text;
    
    // Update aria attributes
    elements.sortOptions.forEach(opt => opt.setAttribute('aria-selected', 'false'));
    option.setAttribute('aria-selected', 'true');
    
    // Close dropdown
    closeSortDropdown();
    
    // Update projects
    showLoadingState();
    updateVisibleProjects();
  }

  /**
   * Handle clicks outside the dropdown
   */
  function handleOutsideClick(event) {
    if (elements.sortSelect && !elements.sortSelect.contains(event.target)) {
      closeSortDropdown();
    }
  }

  /**
   * Open sort dropdown
   */
  function openSortDropdown() {
    elements.sortSelect.classList.add('is-open');
    elements.sortTrigger.setAttribute('aria-expanded', 'true');
    elements.sortDropdown.setAttribute('aria-hidden', 'false');
  }

  /**
   * Close sort dropdown
   */
  function closeSortDropdown() {
    elements.sortSelect.classList.remove('is-open');
    elements.sortTrigger.setAttribute('aria-expanded', 'false');
    elements.sortDropdown.setAttribute('aria-hidden', 'true');
  }

  /**
   * Handle sort trigger keyboard events
   */
  function handleSortKeydown(event) {
    if (event.key === CONFIG.keyboardNavigation.enter || event.key === CONFIG.keyboardNavigation.space) {
      event.preventDefault();
      handleSortToggle(event);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      openSortDropdown();
      focusFirstOption();
    }
  }

  /**
   * Handle sort option keyboard events
   */
  function handleSortOptionKeydown(event) {
    const currentOption = event.currentTarget;
    const currentIndex = elements.sortOptions.indexOf(currentOption);
    
    switch (event.key) {
      case CONFIG.keyboardNavigation.enter:
      case CONFIG.keyboardNavigation.space:
        event.preventDefault();
        handleSortOptionClick(event);
        break;
      case 'ArrowDown':
        event.preventDefault();
        focusNextOption(currentIndex);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusPrevOption(currentIndex);
        break;
      case CONFIG.keyboardNavigation.escape:
        event.preventDefault();
        closeSortDropdown();
        elements.sortTrigger.focus();
        break;
    }
  }

  /**
   * Focus first option in dropdown
   */
  function focusFirstOption() {
    if (elements.sortOptions.length > 0) {
      elements.sortOptions[0].focus();
    }
  }

  /**
   * Focus next option in dropdown
   */
  function focusNextOption(currentIndex) {
    const nextIndex = (currentIndex + 1) % elements.sortOptions.length;
    elements.sortOptions[nextIndex].focus();
  }

  /**
   * Focus previous option in dropdown
   */
  function focusPrevOption(currentIndex) {
    const prevIndex = currentIndex <= 0 ? elements.sortOptions.length - 1 : currentIndex - 1;
    elements.sortOptions[prevIndex].focus();
  }

  /**
   * Handle project card clicks
   */
  function handleProjectClick(event) {
    // Don't open modal if clicking on links
    if (event.target.closest('.project-link')) {
      return;
    }

    const card = event.currentTarget;
    const visibleProjectIndex = state.visibleProjects.findIndex(p => p.element === card);
    
    if (visibleProjectIndex !== -1) {
      const project = state.visibleProjects[visibleProjectIndex];
      
      // Track project card clicked
      if (window.amplitudeHelper && window.amplitudeHelper.track) {
        try {
          // Helper: Get current scroll depth
          const scrollDepth = Math.min(100, Math.round(
            (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100
          ));
          
          window.amplitudeHelper.track('Project Card Clicked', {
            project_title: project.title,
            project_tags: project.tags || [],
            project_type: project.type || 'unknown',
            card_position: visibleProjectIndex + 1,
            click_location: 'projects_page',
            scroll_depth_at_action: scrollDepth
          });
        } catch (error) {
          console.error('Amplitude: Error tracking project card click', error);
        }
      }
      
      openModal(visibleProjectIndex);
      CONFIG.analytics.trackEvent('project_modal_open', project.title);
    }
  }

  /**
   * Handle project card keyboard events
   */
  function handleProjectKeydown(event) {
    if (event.key === CONFIG.keyboardNavigation.enter || event.key === CONFIG.keyboardNavigation.space) {
      event.preventDefault();
      event.currentTarget.click();
    }
  }

  /**
   * Handle global keyboard navigation
   */
  function handleGlobalKeydown(event) {
    if (state.modalOpen) {
      return; // Modal handles its own keyboard events
    }

    if (CONFIG.keyboardNavigation.arrowKeys.includes(event.key)) {
      event.preventDefault();
      navigateProjects(event.key);
    }
  }

  /**
   * Navigate between visible projects with arrow keys
   */
  function navigateProjects(key) {
    const visibleCards = state.visibleProjects.map(p => p.element);
    if (visibleCards.length === 0) return;

    let nextIndex = state.focusedProjectIndex;

    switch (key) {
      case 'ArrowRight':
        nextIndex = (state.focusedProjectIndex + 1) % visibleCards.length;
        break;
      case 'ArrowLeft':
        nextIndex = state.focusedProjectIndex <= 0 ? visibleCards.length - 1 : state.focusedProjectIndex - 1;
        break;
      case 'ArrowDown':
        // Approximate column-based navigation
        const columns = Math.floor(window.innerWidth / 400); // Rough estimate
        nextIndex = (state.focusedProjectIndex + columns) % visibleCards.length;
        break;
      case 'ArrowUp':
        const columnsUp = Math.floor(window.innerWidth / 400);
        nextIndex = state.focusedProjectIndex - columnsUp;
        if (nextIndex < 0) {
          nextIndex = visibleCards.length + nextIndex;
        }
        break;
    }

    if (nextIndex !== state.focusedProjectIndex) {
      state.focusedProjectIndex = nextIndex;
      visibleCards[nextIndex].focus();
    }
  }

  /**
   * Update visible projects based on search, filters, and sort
   */
  function updateVisibleProjects() {
    let filtered = state.projects.filter(project => {
      // Search filter
      if (state.searchQuery) {
        const searchText = `${project.title} ${project.summary} ${project.tools.join(' ')} ${project.tags.join(' ')}`.toLowerCase();
        if (!searchText.includes(state.searchQuery)) {
          return false;
        }
      }

      // Tag filters (AND behavior)
      if (state.activeFilters.size > 0) {
        const projectTags = new Set(project.tags);
        for (const filterTag of state.activeFilters) {
          if (!projectTags.has(filterTag)) {
            return false;
          }
        }
      }

      return true;
    });

    // Sort projects
    filtered.sort((a, b) => {
      switch (state.sortBy) {
        case 'featured':
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          if (a.featured && b.featured) {
            // Sort featured projects by feature rank (lower rank = higher priority)
            return a.featureRank - b.featureRank;
          }
          return new Date(b.date) - new Date(a.date);
        case 'date-desc':
          return new Date(b.date) - new Date(a.date);
        case 'date-asc':
          return new Date(a.date) - new Date(b.date);
        default:
          return 0;
      }
    });

    state.visibleProjects = filtered;
    updateProjectVisibility();
  }

  /**
   * Show loading state for user interactions
   */
  function showLoadingState() {
    const loadingElement = document.getElementById('projects-loading');
    const containerElement = document.querySelector('.projects-grid__container');
    
    if (loadingElement && containerElement) {
      loadingElement.style.display = 'flex';
      containerElement.style.opacity = '0';
    }
  }

  /**
   * Update project card visibility in DOM
   */
  function updateProjectVisibility() {
    // Hide all projects first
    state.projects.forEach(project => {
      project.element.style.display = 'none';
    });

    // Show visible projects
    state.visibleProjects.forEach((project, index) => {
      project.element.style.display = 'block';
      project.element.style.order = index;
    });

    // Update focus index
    if (state.focusedProjectIndex >= state.visibleProjects.length) {
      state.focusedProjectIndex = Math.max(0, state.visibleProjects.length - 1);
    }

    // Hide loading and show results after a brief delay for user interactions
    setTimeout(() => {
      const loadingElement = document.getElementById('projects-loading');
      const containerElement = document.querySelector('.projects-grid__container');
      
      if (loadingElement && containerElement) {
        loadingElement.style.display = 'none';
        containerElement.style.opacity = '1';
      }
    }, 500); // 500ms delay for user interactions
  }

  /**
   * Open project modal
   */
  let modalOpenTime = null;
  function openModal(projectIndex) {
    const project = state.visibleProjects[projectIndex];
    if (!project) return;
    
    modalOpenTime = Date.now();
    


    // Populate modal content
    document.getElementById('modal-title').textContent = project.title;
    document.querySelector('.project-modal__role').textContent = project.role;
    
    // Format and display date
    const dateElement = document.querySelector('.project-modal__date');
    if (project.date) {
      const date = new Date(project.date);
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      });
      dateElement.textContent = formattedDate;
    } else {
      dateElement.textContent = '';
    }
    
    document.getElementById('modal-description').textContent = project.modalSummary;
    document.getElementById('modal-metric').textContent = project.metric;
    
    // Update the metric icon
    const metricIcon = document.querySelector('.project-modal__metric i');
    if (metricIcon) {
      metricIcon.className = project.metricIcon;
    }
    document.getElementById('modal-image').src = project.imageSrc;
    document.getElementById('modal-image').alt = project.imageAlt;

    // Populate business skills
    const businessSkillsContainer = document.getElementById('modal-business-skills');
    businessSkillsContainer.innerHTML = project.businessSkills.map(skill => 
      `<span class="project-chip">${skill.trim()}</span>`
    ).join('');

    // Populate technical tools
    const technicalToolsContainer = document.getElementById('modal-technical-tools');
    technicalToolsContainer.innerHTML = project.tools.map(tool => 
      `<span class="project-chip">${tool.trim()}</span>`
    ).join('');

    // Populate embeds
    const embedsContainer = document.getElementById('modal-embeds');
    embedsContainer.innerHTML = '';



    if (project.miroUrl) {
      const miroEmbed = createEmbed('Miro Board', project.miroUrl, 'miro');
      embedsContainer.appendChild(miroEmbed);
    }

    // Populate links
    const linksContainer = document.getElementById('modal-links');
    linksContainer.innerHTML = '';

    if (project.demoUrl) {
      const demoLink = createLink('View Live Demo', project.demoUrl, 'fas fa-external-link-alt');
      linksContainer.appendChild(demoLink);
    }

    if (project.githubUrl) {
      const githubLink = createLink('View Source Code', project.githubUrl, 'fab fa-github');
      linksContainer.appendChild(githubLink);
    }

    if (project.figmaUrl) {
      const figmaLink = createLink('View Figma', project.figmaUrl, 'fab fa-figma');
      linksContainer.appendChild(figmaLink);
    }

    if (project.miroUrl) {
      const miroLink = createLink('View Miro Board', project.miroUrl, 'fas fa-chalkboard');
      linksContainer.appendChild(miroLink);
    }

    if (project.caseStudyUrl) {
      const caseStudyLink = createLink('Read Case Study', project.caseStudyUrl, 'fas fa-file-alt');
      linksContainer.appendChild(caseStudyLink);
    }

    // Track modal opened
    if (window.amplitudeHelper && window.amplitudeHelper.track) {
      try {
        window.amplitudeHelper.track('Project Modal Opened', {
          project_title: project.title,
          project_url: project.url || '',
          trigger: 'card_click'
        });
      } catch (error) {
        console.error('Amplitude: Error tracking modal opened', error);
      }
    }

    // Show modal
    elements.modal.setAttribute('aria-hidden', 'false');
    elements.modal.setAttribute('aria-modal', 'true');
    state.modalOpen = true;

    // Focus trap
    trapFocus(elements.modalContainer);

    // Focus close button
    elements.modalClose.focus();
  }

  /**
   * Close project modal
   */
  function closeModal() {
    // Track modal closed
    if (modalOpenTime && window.amplitudeHelper && window.amplitudeHelper.track) {
      const timeOpen = Math.round((Date.now() - modalOpenTime) / 1000);
      const projectTitle = document.getElementById('modal-title')?.textContent?.trim() || 'Unknown';
      
      try {
        window.amplitudeHelper.track('Project Modal Closed', {
          project_title: projectTitle,
          time_open: timeOpen,
          close_method: 'button' // Could be enhanced to detect outside click vs button
        });
      } catch (error) {
        console.error('Amplitude: Error tracking modal closed', error);
      }
    }
    
    modalOpenTime = null;
    elements.modal.setAttribute('aria-hidden', 'true');
    elements.modal.setAttribute('aria-modal', 'false');
    state.modalOpen = false;

    // Restore focus to the last focused project card
    if (state.focusedProjectIndex >= 0 && state.visibleProjects[state.focusedProjectIndex]) {
      state.visibleProjects[state.focusedProjectIndex].element.focus();
    }
  }

  /**
   * Handle modal keyboard events
   */
  function handleModalKeydown(event) {
    if (event.key === CONFIG.keyboardNavigation.escape) {
      closeModal();
    }
  }

  /**
   * Create embed element
   */
  function createEmbed(title, url, type) {
    const embedDiv = document.createElement('div');
    embedDiv.className = 'project-modal__embed';
    
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.title = title;
    iframe.loading = 'lazy';
    iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox';
    
    embedDiv.appendChild(iframe);
    return embedDiv;
  }

  /**
   * Create link element
   */
  function createLink(text, url, iconClass) {
    const link = document.createElement('a');
    link.href = url;
    link.className = 'project-link';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.innerHTML = `<i class="${iconClass}"></i>${text}`;
    
    link.addEventListener('click', function() {
      // Track project link clicked
      if (window.amplitudeHelper && window.amplitudeHelper.track) {
        const projectTitle = document.getElementById('modal-title')?.textContent?.trim() || 'Unknown';
        try {
          window.amplitudeHelper.track('Project Link Clicked', {
            project_title: projectTitle,
            link_type: text.toLowerCase().includes('github') ? 'github' : 
                      (text.toLowerCase().includes('demo') ? 'demo' : 
                      (text.toLowerCase().includes('case') ? 'case_study' : 'external')),
            link_url: this.href || '',
            link_location: 'project_modal'
          });
        } catch (error) {
          console.error('Amplitude: Error tracking project link click', error);
        }
      }
      
      CONFIG.analytics.trackEvent('project_link_click', text);
    });
    
    return link;
  }



  /**
   * Focus trap for modal
   */
  function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    element.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    });
  }

  /**
   * Debounce function for search
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Analytics tracking function
   */
  function trackEvent(action, label) {
    CONFIG.analytics.trackEvent(action, label);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      init();
    });
  } else {
    init();
  }

  // Expose analytics function globally
  window.trackEvent = trackEvent;

})();
