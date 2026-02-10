/**
 * Shift Calendar with Vacation Planning
 * 4 ON / 4 OFF shift pattern with vacation management
 */

(() => {
  'use strict';

  // ============================================
  // CONSTANTS & CONFIGURATION
  // ============================================
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const STORAGE_KEY = 'shift_calendar_vacations';
  const SHIFT_CYCLE_LENGTH = 8; // 4 ON + 4 OFF

  // ============================================
  // DOM ELEMENTS
  // ============================================
  const elements = {
    // Calendar
    monthTitle: document.getElementById('monthTitle'),
    weekdaysContainer: document.getElementById('weekdaysContainer'),
    calendarGrid: document.getElementById('calendarGrid'),
    calendarContainer: document.querySelector('.calendar-container'),
    prevMonth: document.getElementById('prevMonth'),
    nextMonth: document.getElementById('nextMonth'),
    todayBtn: document.getElementById('todayBtn'),

    // Modal
    modalOverlay: document.getElementById('modalOverlay'),
    dayModal: document.getElementById('dayModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalSubtitle: document.getElementById('modalSubtitle'),
    dayShiftInfo: document.getElementById('dayShiftInfo'),
    
    // Vacation sections
    existingVacationSection: document.getElementById('existingVacationSection'),
    existingVacationLabel: document.getElementById('existingVacationLabel'),
    existingVacationDates: document.getElementById('existingVacationDates'),
    existingVacationNotes: document.getElementById('existingVacationNotes'),
    
    // Form
    vacationFormSection: document.getElementById('vacationFormSection'),
    formSectionTitle: document.getElementById('formSectionTitle'),
    vacationForm: document.getElementById('vacationForm'),
    vacationId: document.getElementById('vacationId'),
    vacationLabel: document.getElementById('vacationLabel'),
    vacationStart: document.getElementById('vacationStart'),
    vacationEnd: document.getElementById('vacationEnd'),
    vacationNotes: document.getElementById('vacationNotes'),
    
    // Buttons
    modalActions: document.getElementById('modalActions'),
    formActions: document.getElementById('formActions'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    addVacationBtn: document.getElementById('addVacationBtn'),
    deleteVacationBtn: document.getElementById('deleteVacationBtn'),
    cancelVacationBtn: document.getElementById('cancelVacationBtn'),
    saveVacationBtn: document.getElementById('saveVacationBtn'),
  };

  // Validate all required elements exist
  const missingElements = Object.entries(elements)
    .filter(([_, el]) => !el)
    .map(([key]) => key);
  
  if (missingElements.length > 0) {
    console.error('Missing DOM elements:', missingElements);
    return;
  }

  // ============================================
  // STATE
  // ============================================
  let state = {
    displayMonth: new Date(),
    selectedDate: null,
    vacations: [],
    editingVacationId: null,
  };

  // ============================================
  // MOBILE KEYBOARD FIX (Visual Viewport API)
  // ============================================
  
  /**
   * Robust mobile keyboard handling for vacation modal
   * Ensures form inputs remain visible when keyboard appears
   * Works on iOS Safari and Android Chrome
   */
  const initializeViewportHandling = () => {
    const root = document.documentElement;
    let scrollPosition = 0;
    let previousInnerHeight = window.innerHeight;
    let viewportListenersActive = false;
    
    // Track if animations should be reduced
    const prefersReducedMotion = () => 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /**
     * Update CSS variables based on Visual Viewport API
     * Handles keyboard appearance on mobile devices
     */
    const updateViewportVariables = () => {
      if (window.visualViewport) {
        // Use Visual Viewport API (iOS 13+, Android Chrome 70+)
        const vvH = window.visualViewport.height;
        const vvTop = window.visualViewport.offsetTop;
        
        // Set viewport height
        root.style.setProperty('--vvh', `${vvH}px`);
        
        // Calculate keyboard height: innerHeight - (visual viewport height + offset)
        const keyboardHeight = Math.max(0, window.innerHeight - (vvH + vvTop));
        root.style.setProperty('--kbd', `${keyboardHeight}px`);
      } else {
        // Fallback for older browsers
        // Estimate keyboard by comparing innerHeight changes
        const currentHeight = window.innerHeight;
        const heightDifference = Math.max(0, previousInnerHeight - currentHeight);
        
        root.style.setProperty('--vvh', `${currentHeight}px`);
        root.style.setProperty('--kbd', `${heightDifference}px`);
        
        previousInnerHeight = currentHeight;
      }
    };

    /**
     * Scroll focused input into view within modal content area
     * Only scrolls the modal, not the background page
     */
    const handleFormInputFocus = (event) => {
      const input = event.target;
      
      // Only handle inputs/textareas inside the modal
      if (!elements.dayModal.contains(input)) return;
      if (!input.matches('input, textarea')) return;

      // Use RAF + timeout to ensure keyboard has started animating
      requestAnimationFrame(() => {
        setTimeout(() => {
          const modalBody = elements.dayModal.querySelector('.modal__body');
          if (!modalBody) return;

          const inputRect = input.getBoundingClientRect();
          const containerRect = modalBody.getBoundingClientRect();
          
          // Calculate if input is fully visible in scrollable container
          const inputTop = inputRect.top - containerRect.top + modalBody.scrollTop;
          const inputBottom = inputTop + inputRect.height;
          const visibleTop = modalBody.scrollTop;
          const visibleBottom = visibleTop + containerRect.height;
          
          // Check if input needs scrolling
          const isFullyVisible = inputTop >= visibleTop && inputBottom <= visibleBottom;
          
          if (!isFullyVisible) {
            // Scroll container so input is centered in visible area
            // This avoids scrolling the background page
            const targetScroll = inputTop - (containerRect.height / 2) + (inputRect.height / 2);
            
            if (modalBody.scrollTo && !prefersReducedMotion()) {
              // Smooth scroll if supported and not reduced motion
              modalBody.scrollTo({
                top: Math.max(0, targetScroll),
                behavior: 'smooth'
              });
            } else {
              // Instant scroll
              modalBody.scrollTop = Math.max(0, targetScroll);
            }
          }
        }, 60); // 60ms allows keyboard animation to start
      });
    };

    /**
     * Add viewport listeners when modal opens
     */
    const attachViewportListeners = () => {
      if (viewportListenersActive) return;
      
      updateViewportVariables();
      
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateViewportVariables);
        window.visualViewport.addEventListener('scroll', updateViewportVariables);
      }
      
      window.addEventListener('resize', updateViewportVariables);
      document.addEventListener('focusin', handleFormInputFocus);
      
      viewportListenersActive = true;
    };

    /**
     * Remove viewport listeners when modal closes
     */
    const detachViewportListeners = () => {
      if (!viewportListenersActive) return;
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportVariables);
        window.visualViewport.removeEventListener('scroll', updateViewportVariables);
      }
      
      window.removeEventListener('resize', updateViewportVariables);
      document.removeEventListener('focusin', handleFormInputFocus);
      
      // Reset CSS variables
      root.style.setProperty('--vvh', '100vh');
      root.style.setProperty('--kbd', '0px');
      
      viewportListenersActive = false;
    };

    /**
     * Lock body scroll and save position
     */
    const lockBodyScroll = () => {
      scrollPosition = window.scrollY || document.documentElement.scrollTop;
      document.body.classList.add('modal-open');
      document.body.style.top = `-${scrollPosition}px`;
    };

    /**
     * Restore body scroll to saved position
     */
    const unlockBodyScroll = () => {
      document.body.classList.remove('modal-open');
      document.body.style.top = '';
      window.scrollTo(0, scrollPosition);
    };

    // Initialize viewport height on load
    updateViewportVariables();

    return {
      lockBodyScroll,
      unlockBodyScroll,
      attachViewportListeners,
      detachViewportListeners,
      updateViewportVariables,
    };
  };

  const viewportHandler = initializeViewportHandling();

  // ============================================
  // DATE UTILITIES
  // ============================================
  
  /**
   * Convert date to UTC midnight timestamp
   */
  const toUtcMidnight = (date) =>
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

  /**
   * Add days to a date
   */
  const addDays = (date, days) => {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  };

  /**
   * Format date as YYYY-MM-DD
   */
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * Parse YYYY-MM-DD to Date object
   */
  const parseDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  /**
   * Format date for display
   */
  const formatDateDisplay = (date) => {
    return date.toLocaleDateString(undefined, { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * Format date range for display
   */
  const formatDateRange = (startDate, endDate) => {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    
    if (startDate === endDate) {
      return formatDateDisplay(start);
    }
    
    const startStr = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    
    return `${startStr} - ${endStr}`;
  };

  /**
   * Format month title
   */
  const formatMonthTitle = (date) =>
    date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  /**
   * Check if two dates are the same day
   */
  const isSameDay = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  // ============================================
  // SHIFT CALCULATION (PRESERVED LOGIC)
  // ============================================

  /**
   * Get reference start date (tomorrow from today)
   * This preserves the existing shift calculation logic
   */
  const getReferenceStart = (today) => addDays(today, 1);

  /**
   * Calculate shift state for a given date
   * Preserves the exact 4 ON / 4 OFF cycle logic
   */
  const getShiftStatus = (targetDate, referenceDate) => {
    const diffDays = Math.floor(
      (toUtcMidnight(targetDate) - toUtcMidnight(referenceDate)) / MS_PER_DAY
    );
    const cycleIndex = ((diffDays % SHIFT_CYCLE_LENGTH) + SHIFT_CYCLE_LENGTH) % SHIFT_CYCLE_LENGTH;
    return cycleIndex <= 3 ? 'on' : 'off';
  };

  // ============================================
  // VACATION MANAGEMENT
  // ============================================

  /**
   * Load vacations from localStorage
   */
  const loadVacations = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading vacations:', error);
      return [];
    }
  };

  /**
   * Save vacations to localStorage
   */
  const saveVacations = (vacations) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vacations));
      state.vacations = vacations;
    } catch (error) {
      console.error('Error saving vacations:', error);
      alert('Failed to save vacation. Storage may be full.');
    }
  };

  /**
   * Get vacation for a specific date
   * Returns the most recently created vacation if multiple overlap
   */
  const getVacationForDate = (dateString) => {
    const matchingVacations = state.vacations.filter(vacation => {
      return dateString >= vacation.startDate && dateString <= vacation.endDate;
    });

    if (matchingVacations.length === 0) return null;
    
    // Return most recently created vacation
    return matchingVacations.sort((a, b) => b.createdAt - a.createdAt)[0];
  };

  /**
   * Create vacation map for current month (for efficient rendering)
   */
  const getVacationMapForMonth = (year, month) => {
    const map = new Map();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const firstDateStr = formatDate(firstDay);
    const lastDateStr = formatDate(lastDay);

    state.vacations.forEach(vacation => {
      // Check if vacation overlaps with current month
      if (vacation.endDate >= firstDateStr && vacation.startDate <= lastDateStr) {
        // Add each day in the vacation range
        const start = parseDate(vacation.startDate);
        const end = parseDate(vacation.endDate);
        
        let current = new Date(start);
        while (current <= end) {
          const dateStr = formatDate(current);
          
          // Only add if in current month
          if (current >= firstDay && current <= lastDay) {
            const existing = map.get(dateStr);
            // Keep most recently created
            if (!existing || vacation.createdAt > existing.createdAt) {
              map.set(dateStr, vacation);
            }
          }
          
          current = addDays(current, 1);
        }
      }
    });

    return map;
  };

  /**
   * Validate vacation dates
   */
  const validateVacation = (startDate, endDate, label) => {
    if (!label || label.trim().length === 0) {
      return { valid: false, error: 'Vacation name is required' };
    }

    if (!startDate || !endDate) {
      return { valid: false, error: 'Start and end dates are required' };
    }

    if (startDate > endDate) {
      return { valid: false, error: 'End date must be on or after start date' };
    }

    return { valid: true };
  };

  /**
   * Add or update a vacation
   */
  const saveVacation = (vacationData) => {
    const validation = validateVacation(
      vacationData.startDate,
      vacationData.endDate,
      vacationData.label
    );

    if (!validation.valid) {
      alert(validation.error);
      return false;
    }

    let vacations = [...state.vacations];

    if (vacationData.id) {
      // Update existing
      const index = vacations.findIndex(v => v.id === vacationData.id);
      if (index !== -1) {
        vacations[index] = { ...vacations[index], ...vacationData };
      }
    } else {
      // Create new
      const newVacation = {
        id: `vac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...vacationData,
        createdAt: Date.now(),
      };
      vacations.push(newVacation);
    }

    saveVacations(vacations);
    return true;
  };

  /**
   * Delete a vacation
   */
  const deleteVacation = (vacationId) => {
    if (!confirm('Are you sure you want to delete this vacation?')) {
      return false;
    }

    const vacations = state.vacations.filter(v => v.id !== vacationId);
    saveVacations(vacations);
    return true;
  };

  // ============================================
  // CALENDAR RENDERING
  // ============================================

  /**
   * Render weekday headers
   */
  const renderWeekdays = () => {
    elements.weekdaysContainer.innerHTML = WEEKDAYS
      .map(day => `<div class="calendar__weekday">${day}</div>`)
      .join('');
  };

  /**
   * Render calendar for the current display month
   */
  const renderCalendar = () => {
    const today = new Date();
    const referenceStart = getReferenceStart(today);
    
    const year = state.displayMonth.getFullYear();
    const month = state.displayMonth.getMonth();

    // Update title
    elements.monthTitle.textContent = formatMonthTitle(state.displayMonth);

    // Calculate calendar grid
    const firstOfMonth = new Date(year, month, 1);
    const startWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Get vacation map for efficient lookup
    const vacationMap = getVacationMapForMonth(year, month);

    const totalCells = 42; // 6 weeks
    const cells = [];

    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - startWeekday + 1;
      const isOutside = dayNumber < 1 || dayNumber > daysInMonth;
      
      const date = isOutside
        ? new Date(
            year,
            month + (dayNumber < 1 ? -1 : 1),
            dayNumber < 1 ? prevMonthDays + dayNumber : dayNumber - daysInMonth
          )
        : new Date(year, month, dayNumber);

      const dateStr = formatDate(date);
      const isToday = isSameDay(date, today);
      const shiftState = getShiftStatus(date, referenceStart);
      const isDaniel = shiftState === 'on';
      const vacation = vacationMap.get(dateStr);

      // Determine cell class
      let cellClass = 'calendar__day';
      if (vacation) {
        cellClass += ' calendar__day--vacation';
      } else if (isDaniel) {
        cellClass += ' calendar__day--daniel';
      } else {
        cellClass += ' calendar__day--michael';
      }
      
      if (isToday) cellClass += ' calendar__day--today';
      if (isOutside) cellClass += ' calendar__day--outside';

      // Build cell content
      let content = `<div class="calendar__day-number">${date.getDate()}</div>`;
      
      if (vacation) {
        content += `<span class="chip chip--vacation">${vacation.label}</span>`;
        content += `<div class="calendar__day-info">${isDaniel ? 'Daniel' : 'Michael'} shift</div>`;
      } else {
        content += `<span class="chip chip--${isDaniel ? 'daniel' : 'michael'}">${isDaniel ? 'Daniel' : 'Michael'}</span>`;
        content += `<div class="calendar__day-info">${isDaniel ? '12h shift' : 'Rest'}</div>`;
      }

      cells.push(
        `<div class="${cellClass}" data-date="${dateStr}" tabindex="0" role="button" aria-label="${formatDateDisplay(date)}">
          ${content}
        </div>`
      );
    }

    elements.calendarGrid.innerHTML = cells.join('');
    attachDayClickHandlers();
  };

  /**
   * Attach click handlers to day cells (event delegation alternative)
   */
  const attachDayClickHandlers = () => {
    const dayCells = elements.calendarGrid.querySelectorAll('.calendar__day');
    dayCells.forEach(cell => {
      cell.addEventListener('click', handleDayClick);
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleDayClick(e);
        }
      });
    });
  };

  /**
   * Handle day cell click
   */
  const handleDayClick = (event) => {
    const cell = event.currentTarget;
    const dateStr = cell.dataset.date;
    
    if (!dateStr) return;
    
    state.selectedDate = dateStr;
    openDayModal(dateStr);
  };

  // ============================================
  // MODAL MANAGEMENT
  // ============================================

  /**
   * Open day details modal
   */
  const openDayModal = (dateStr) => {
    const date = parseDate(dateStr);
    const today = new Date();
    const referenceStart = getReferenceStart(today);
    const shiftState = getShiftStatus(date, referenceStart);
    const isDaniel = shiftState === 'on';
    const vacation = getVacationForDate(dateStr);

    // Update modal header
    elements.modalTitle.textContent = formatDateDisplay(date);
    elements.modalSubtitle.textContent = dateStr;

    // Update shift info
    elements.dayShiftInfo.innerHTML = `
      <div style="display: flex; gap: 8px; align-items: center;">
        <span class="chip chip--${isDaniel ? 'daniel' : 'michael'}">${isDaniel ? 'Daniel' : 'Michael'}</span>
        <span>${isDaniel ? '12 hour shift' : 'Rest day'}</span>
      </div>
    `;

    // Handle existing vacation
    if (vacation) {
      elements.existingVacationSection.style.display = 'block';
      elements.existingVacationLabel.textContent = vacation.label;
      elements.existingVacationDates.textContent = formatDateRange(vacation.startDate, vacation.endDate);
      elements.existingVacationNotes.textContent = vacation.notes || '';
      elements.existingVacationNotes.style.display = vacation.notes ? 'block' : 'none';
      
      elements.addVacationBtn.style.display = 'none';
      elements.deleteVacationBtn.style.display = 'inline-flex';
      elements.deleteVacationBtn.onclick = () => handleDeleteVacation(vacation.id);
    } else {
      elements.existingVacationSection.style.display = 'none';
      elements.addVacationBtn.style.display = 'inline-flex';
      elements.deleteVacationBtn.style.display = 'none';
    }

    // Hide form initially
    elements.vacationFormSection.style.display = 'none';
    elements.modalActions.style.display = 'flex';
    elements.formActions.style.display = 'none';

    // Show modal
    elements.modalOverlay.classList.add('modal-overlay--visible');
    elements.dayModal.classList.add('modal--visible');
    
    // Apply mobile keyboard fixes
    viewportHandler.lockBodyScroll();
    viewportHandler.attachViewportListeners();
    
    // Focus first button
    setTimeout(() => elements.closeModalBtn.focus(), 100);
  };

  /**
   * Close modal
   */
  const closeModal = () => {
    elements.modalOverlay.classList.remove('modal-overlay--visible');
    elements.dayModal.classList.remove('modal--visible');
    
    // Reset form
    elements.vacationForm.reset();
    state.editingVacationId = null;
    elements.vacationFormSection.style.display = 'none';
    elements.modalActions.style.display = 'flex';
    elements.formActions.style.display = 'none';
    
    // Cleanup mobile keyboard listeners and restore scroll
    viewportHandler.detachViewportListeners();
    viewportHandler.unlockBodyScroll();
  };

  /**
   * Show vacation form
   */
  const showVacationForm = (editVacation = null) => {
    elements.vacationFormSection.style.display = 'block';
    elements.modalActions.style.display = 'none';
    elements.formActions.style.display = 'flex';

    if (editVacation) {
      // Edit mode
      elements.formSectionTitle.textContent = 'Edit Vacation';
      elements.vacationId.value = editVacation.id;
      elements.vacationLabel.value = editVacation.label;
      elements.vacationStart.value = editVacation.startDate;
      elements.vacationEnd.value = editVacation.endDate;
      elements.vacationNotes.value = editVacation.notes || '';
      state.editingVacationId = editVacation.id;
    } else {
      // Add mode
      elements.formSectionTitle.textContent = 'Add Vacation';
      elements.vacationForm.reset();
      elements.vacationId.value = '';
      elements.vacationStart.value = state.selectedDate;
      elements.vacationEnd.value = state.selectedDate;
      state.editingVacationId = null;
    }

    // Focus first input
    setTimeout(() => elements.vacationLabel.focus(), 100);
  };

  /**
   * Hide vacation form
   */
  const hideVacationForm = () => {
    elements.vacationFormSection.style.display = 'none';
    elements.modalActions.style.display = 'flex';
    elements.formActions.style.display = 'none';
    elements.vacationForm.reset();
    state.editingVacationId = null;
  };

  /**
   * Handle vacation form submit
   */
  const handleVacationSubmit = (event) => {
    event.preventDefault();

    const vacationData = {
      id: elements.vacationId.value || null,
      label: elements.vacationLabel.value.trim(),
      startDate: elements.vacationStart.value,
      endDate: elements.vacationEnd.value,
      notes: elements.vacationNotes.value.trim(),
    };

    if (saveVacation(vacationData)) {
      renderCalendar();
      closeModal();
    }
  };

  /**
   * Handle delete vacation
   */
  const handleDeleteVacation = (vacationId) => {
    if (deleteVacation(vacationId)) {
      renderCalendar();
      closeModal();
    }
  };

  // ============================================
  // NAVIGATION
  // ============================================

  /**
   * Change display month
   */
  const changeMonth = (offset) => {
    state.displayMonth = new Date(
      state.displayMonth.getFullYear(),
      state.displayMonth.getMonth() + offset,
      1
    );
    renderCalendar();
  };

  /**
   * Go to today
   */
  const goToToday = () => {
    state.displayMonth = new Date();
    renderCalendar();
  };

  // ============================================
  // TOUCH GESTURES (for mobile swipe)
  // ============================================

  const SWIPE_DISTANCE = 50;
  const SWIPE_RESTRAINT = 30;
  const SWIPE_DEBOUNCE_MS = 350;

  let swipeStartX = 0;
  let swipeStartY = 0;
  let swipeEndX = 0;
  let swipeEndY = 0;
  let lastSwipeAt = 0;

  const shouldHandleSwipe = (deltaX, deltaY) =>
    Math.abs(deltaX) > SWIPE_DISTANCE && Math.abs(deltaY) < SWIPE_RESTRAINT;

  const tryHandleSwipe = (deltaX, deltaY) => {
    if (!shouldHandleSwipe(deltaX, deltaY)) return;
    if (elements.dayModal.classList.contains('modal--visible')) return;

    const now = Date.now();
    if (now - lastSwipeAt < SWIPE_DEBOUNCE_MS) return;
    lastSwipeAt = now;

    if (deltaX < 0) {
      changeMonth(1); // Swipe left = next month
    } else {
      changeMonth(-1); // Swipe right = prev month
    }
  };

  const onPointerDown = (event) => {
    if (!event.isPrimary) return;
    swipeStartX = event.clientX;
    swipeStartY = event.clientY;
  };

  const onPointerUp = (event) => {
    if (!event.isPrimary) return;
    swipeEndX = event.clientX;
    swipeEndY = event.clientY;
    tryHandleSwipe(swipeEndX - swipeStartX, swipeEndY - swipeStartY);
  };

  const onTouchStart = (event) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    swipeStartX = touch.clientX;
    swipeStartY = touch.clientY;
  };

  const onTouchEnd = (event) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    swipeEndX = touch.clientX;
    swipeEndY = touch.clientY;
    tryHandleSwipe(swipeEndX - swipeStartX, swipeEndY - swipeStartY);
  };

  if (window.PointerEvent) {
    elements.calendarContainer.addEventListener('pointerdown', onPointerDown, { passive: true });
    elements.calendarContainer.addEventListener('pointerup', onPointerUp, { passive: true });
    elements.calendarContainer.addEventListener('pointercancel', onPointerUp, { passive: true });
  } else {
    elements.calendarContainer.addEventListener('touchstart', onTouchStart, { passive: true });
    elements.calendarContainer.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  // Navigation
  elements.prevMonth.addEventListener('click', () => changeMonth(-1));
  elements.nextMonth.addEventListener('click', () => changeMonth(1));
  elements.todayBtn.addEventListener('click', goToToday);

  // Modal controls
  elements.modalOverlay.addEventListener('click', closeModal);
  elements.closeModalBtn.addEventListener('click', closeModal);
  elements.addVacationBtn.addEventListener('click', () => showVacationForm());
  elements.cancelVacationBtn.addEventListener('click', hideVacationForm);

  // Form
  elements.vacationForm.addEventListener('submit', handleVacationSubmit);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // ESC to close modal
    if (e.key === 'Escape' && elements.dayModal.classList.contains('modal--visible')) {
      closeModal();
    }
    
    // Arrow keys for month navigation (only when modal is closed)
    if (!elements.dayModal.classList.contains('modal--visible')) {
      if (e.key === 'ArrowLeft') {
        changeMonth(-1);
      } else if (e.key === 'ArrowRight') {
        changeMonth(1);
      }
    }
  });

  // ============================================
  // INITIALIZATION
  // ============================================

  const init = () => {
    // Load vacations from storage
    state.vacations = loadVacations();

    // Render calendar
    renderWeekdays();
    renderCalendar();

    console.log('Shift Calendar initialized');
    console.log(`Loaded ${state.vacations.length} vacation(s)`);
  };

  // Start the app
  init();

})();
