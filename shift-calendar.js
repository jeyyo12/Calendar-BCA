(() => {
  const titleEl = document.getElementById("shiftTitle");
  const gridEl = document.getElementById("shiftGrid");
  const weekdaysEl = document.getElementById("shiftWeekdays");
  const prevBtn = document.getElementById("shiftPrev");
  const nextBtn = document.getElementById("shiftNext");
  const todayBtn = document.getElementById("shiftToday");

  if (!titleEl || !gridEl || !weekdaysEl || !prevBtn || !nextBtn || !todayBtn) {
    return;
  }

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const toUtcMidnight = (date) =>
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

  const addDays = (date, days) => {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  };

  const getReferenceStart = (today) => addDays(today, 1);

  const getShiftState = (targetDate, referenceDate) => {
    const diffDays = Math.floor((toUtcMidnight(targetDate) - toUtcMidnight(referenceDate)) / MS_PER_DAY);
    const cycleIndex = ((diffDays % 8) + 8) % 8; // handle negatives
    return cycleIndex <= 3 ? "on" : "off";
  };

  const formatMonthTitle = (date) =>
    date.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const buildWeekdays = () => {
    weekdaysEl.innerHTML = WEEKDAYS.map((day) => `<div class="shift-calendar__weekday">${day}</div>`).join("");
  };

  const renderCalendar = (displayDate) => {
    const today = new Date();
    const referenceStart = getReferenceStart(today);

    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();

    titleEl.textContent = formatMonthTitle(displayDate);

    const firstOfMonth = new Date(year, month, 1);
    const startWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevMonthDays = new Date(year, month, 0).getDate();

    const totalCells = 42; // 6 weeks
    const cells = [];

    for (let i = 0; i < totalCells; i += 1) {
      const dayNumber = i - startWeekday + 1;
      const isOutside = dayNumber < 1 || dayNumber > daysInMonth;
      const date = isOutside
        ? new Date(year, month + (dayNumber < 1 ? -1 : 1), dayNumber < 1 ? prevMonthDays + dayNumber : dayNumber - daysInMonth)
        : new Date(year, month, dayNumber);

      const isToday =
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();

      const shiftState = getShiftState(date, referenceStart);
      const isOn = shiftState === "on";

      cells.push(
        `<div class="shift-calendar__cell ${isOn ? "shift-calendar__cell--on" : "shift-calendar__cell--off"} ${
          isToday ? "shift-calendar__cell--today" : ""
        } ${isOutside ? "shift-calendar__cell--outside" : ""}">
          <div class="shift-calendar__date">${date.getDate()}</div>
          <div class="shift-calendar__label">${isOn ? "Daniel" : "Michael"}</div>
          <div class="shift-calendar__hours">${isOn ? "12h shift" : "Rest"}</div>
        </div>`
      );
    }

    gridEl.innerHTML = cells.join("");
  };

  const setDisplayMonth = (offset) => {
    displayMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + offset, 1);
    renderCalendar(displayMonth);
  };

  let displayMonth = new Date();

  buildWeekdays();
  renderCalendar(displayMonth);

  prevBtn.addEventListener("click", () => setDisplayMonth(-1));
  nextBtn.addEventListener("click", () => setDisplayMonth(1));
  todayBtn.addEventListener("click", () => {
    displayMonth = new Date();
    renderCalendar(displayMonth);
  });

  // Simple swipe gesture (mobile-friendly, no library)
  let touchStartX = 0;
  let touchEndX = 0;

  const handleSwipe = () => {
    const delta = touchEndX - touchStartX;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) {
      setDisplayMonth(1);
    } else {
      setDisplayMonth(-1);
    }
  };

  gridEl.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  });

  gridEl.addEventListener("touchend", (event) => {
    touchEndX = event.changedTouches[0].clientX;
    handleSwipe();
  });
})();
