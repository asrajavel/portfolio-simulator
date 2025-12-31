/**
 * Allocation Transition (Glide Path) Utilities
 * 
 * Handles logic for gradually transitioning portfolio allocations
 * over a specified period using annual adjustments on anniversary dates.
 */

/**
 * Check if a given date is an anniversary of the start date
 * Anniversary = same month and day as start date
 */
export function isAnniversaryDate(currentDate: Date, startDate: Date): boolean {
  return currentDate.getMonth() === startDate.getMonth() 
      && currentDate.getDate() === startDate.getDate();
}

/**
 * Calculate years elapsed between two dates
 * Used for determining transition progress
 */
function calculateYearsElapsed(currentDate: Date, startDate: Date): number {
  return currentDate.getFullYear() - startDate.getFullYear() +
    (currentDate.getMonth() - startDate.getMonth()) / 12 +
    (currentDate.getDate() - startDate.getDate()) / 365;
}

/**
 * Calculate the current target allocation based on transition progress
 * 
 * @param sipDate - Current SIP date
 * @param startDate - First SIP date in the rolling period
 * @param rollingYears - Total rolling period in years
 * @param transitionYears - Number of years for transition (e.g., "last 2 years")
 * @param startAllocations - Starting allocation percentages
 * @param endAllocations - Target end allocation percentages
 * @returns Current target allocation percentages for this date
 */
export function getCurrentTargetAllocation(
  sipDate: Date,
  startDate: Date,
  rollingYears: number,
  transitionYears: number,
  startAllocations: number[],
  endAllocations: number[]
): number[] {
  const yearsElapsed = calculateYearsElapsed(sipDate, startDate);
  const transitionStartYear = rollingYears - transitionYears;
  
  // If we haven't reached transition window yet, use start allocations
  if (yearsElapsed < transitionStartYear) {
    return startAllocations;
  }
  
  // If past the entire rolling period, use end allocations
  if (yearsElapsed >= rollingYears) {
    return endAllocations;
  }
  
  // We're in the transition window - calculate progress
  // Count how many complete years have passed since transition started
  // For transition starting at year 5:
  //   - At year 5.0: 0 complete years -> 0% progress
  //   - At year 6.0: 1 complete year -> 50% progress (for 2-year transition)
  //   - At year 7.0: 2 complete years -> 100% progress
  const completeYearsInTransition = Math.floor(yearsElapsed - transitionStartYear);
  
  // Progress = completed years / total transition years
  // Clamped between 0 and 1
  const progress = Math.min(completeYearsInTransition / transitionYears, 1);
  
  // Linear interpolation: start + (end - start) * progress
  return startAllocations.map((startAlloc, idx) => {
    const endAlloc = endAllocations[idx] !== undefined ? endAllocations[idx] : startAlloc;
    return startAlloc + (endAlloc - startAlloc) * progress;
  });
}

/**
 * Check if current date should trigger an annual adjustment
 * 
 * Conditions:
 * - Must be an anniversary date
 * - Must be within the transition window
 * - Must not have already completed transition
 */
export function shouldPerformAnnualAdjustment(
  sipDate: Date,
  startDate: Date,
  rollingYears: number,
  transitionYears: number,
  allocationTransitionEnabled: boolean
): boolean {
  if (!allocationTransitionEnabled || !isAnniversaryDate(sipDate, startDate)) {
    return false;
  }
  
  const yearsElapsed = calculateYearsElapsed(sipDate, startDate);
  const transitionStartYear = rollingYears - transitionYears;
  
  // Must be in transition window
  // For a 7-year rolling period with 2-year transition:
  //   - Year 5 anniversary: trigger (first adjustment)
  //   - Year 6 anniversary: trigger (second adjustment)
  //   - Year 7+ anniversary: don't trigger (outside window)
  return yearsElapsed >= transitionStartYear && yearsElapsed < rollingYears;
}

