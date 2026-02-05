# Shift Calendar - Daniel & Michael

A modern, mobile-first shift calendar with integrated vacation planning for a 4 ON / 4 OFF shift schedule.

## Features

### 📅 Shift Schedule
- **4 ON / 4 OFF pattern**: Displays Daniel's 12-hour work shifts and Michael's rest days
- **Automatic calculation**: Shift pattern is calculated automatically based on the reference date
- **Color-coded display**: 
  - Red for Daniel's shifts (ON days)
  - Blue for Michael's days (OFF days)
  - Purple for vacation periods
  - Green indicator for today

### 🏖️ Vacation Planning
- **Add vacations**: Click any day to add a vacation period
- **Date ranges**: Support for single-day or multi-day vacations
- **Custom labels**: Name your vacations (e.g., "Summer Holiday", "Trip to Paris")
- **Optional notes**: Add additional details to any vacation
- **Edit & delete**: Manage existing vacations easily
- **Visual override**: Vacations are prominently displayed on the calendar
- **Local storage**: All vacation data persists in your browser

### 📱 Mobile-First Design
- **Responsive layout**: Optimized for phones, tablets, and desktop
- **Touch-friendly**: All buttons meet 44px minimum touch target size
- **Swipe gestures**: Swipe left/right to navigate months (mobile)
- **Bottom sheet modal**: Native mobile-style day details view
- **Smooth animations**: Respects `prefers-reduced-motion` setting
- **Dark mode support**: Automatically adapts to system color scheme

### ⌨️ Keyboard Navigation
- **Arrow keys**: Navigate between months
- **Enter/Space**: Open day details
- **ESC**: Close modal

### ♿ Accessibility
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- High contrast colors
- Focus visible indicators

## Usage

### Navigation
1. **Previous/Next Month**: Use the ◀ and ▶ buttons
2. **Today**: Click the "Today" button to jump to current month
3. **Swipe** (mobile): Swipe left for next month, right for previous month

### Adding a Vacation
1. Click on any day in the calendar
2. Click "Add Vacation" in the modal
3. Fill in the vacation details:
   - Name (required)
   - Start date (required)
   - End date (required)
   - Notes (optional)
4. Click "Save Vacation"

### Viewing Vacation Details
- Click on any day that has a vacation
- The modal will show vacation name, date range, and notes
- You can delete the vacation from this view

### Deleting a Vacation
1. Click on a day with a vacation
2. Click "Delete Vacation"
3. Confirm the deletion

## Technical Details

### Shift Calculation
The calendar uses a deterministic algorithm to calculate the 4 ON / 4 OFF pattern:
- Reference date: Tomorrow from today
- Cycle length: 8 days (4 ON + 4 OFF)
- Daniel works days 0-3 of each cycle
- Michael has rest days 4-7 of each cycle

### Data Storage
- Vacations are stored in browser `localStorage`
- Data persists across sessions
- No backend required
- Storage key: `shift_calendar_vacations`

### Vacation Data Model
```javascript
{
  id: string,              // Unique identifier
  startDate: "YYYY-MM-DD", // Start date
  endDate: "YYYY-MM-DD",   // End date
  label: string,           // Vacation name
  notes: string,           // Optional notes
  createdAt: number        // Timestamp
}
```

### Overlap Handling
When multiple vacations overlap on the same date, the most recently created vacation is displayed.

## Browser Compatibility

- Modern browsers with ES6+ support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## File Structure

```
Calendar-BCA/
├── index.html           # Main HTML with embedded CSS
├── shift-calendar.js    # Calendar logic and vacation management
└── README.md            # This file
```

## Deployment

### GitHub Pages
1. Push files to your repository
2. Go to Settings → Pages
3. Select branch and folder
4. Your calendar will be live at `https://username.github.io/Calendar-BCA`

### Local Development
Simply open `index.html` in a modern web browser. No build process or server required.

## Design System

### Color Palette
- **Daniel (Red)**: `#dc2626` - Work shifts
- **Michael (Blue)**: `#3b82f6` - Rest days
- **Vacation (Purple)**: `#9333ea` - Vacation periods
- **Today (Green)**: `#10b981` - Current day indicator

### Spacing Scale
- 1: 4px
- 2: 8px
- 3: 12px
- 4: 16px
- 5: 24px
- 6: 32px
- 8: 48px

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## Performance

- **Efficient rendering**: Only updates affected calendar cells
- **Lazy loading**: Vacation data loaded once on initialization
- **Event delegation**: Optimized event handling for day cells
- **Minimal DOM updates**: Smart diffing for vacation changes

## License

Free to use for personal and commercial projects.

## Credits

Built with vanilla JavaScript - no frameworks required.
