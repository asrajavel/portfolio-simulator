# Allocation Transition (Glide Path) Feature - Requirements

## Feature Overview
Allow SIP portfolios to gradually transition from starting allocations to target end allocations over a specified period, using annual adjustments on anniversary dates.

---

## Business Rules

### 1. Transition Window
- User specifies "Last N years" of the rolling period for transition
- Example: 7-year rolling period, "Last 2 years" means transition happens in years 6-7
- First adjustment occurs at the START of the transition window (e.g., start of year 6)

### 2. Adjustment Timing
- Adjustments occur ONLY on anniversary dates (relative to SIP start date)
- Anniversary = same month and day as SIP start date (e.g., if SIP starts Feb 1, 2010, anniversaries are Feb 1 of each year)
- Number of adjustments = transition years count
- Example: 2 transition years = 2 adjustment points (year 6 start, year 7 start)

### 3. Allocation Progression
- Linear interpolation between start and end allocations
- Progress = (anniversaries completed in transition window) / (total transition years)
- Example with 2 transition years (50-50 → 100-0):
  - Year 1-5: 50-50 (no transition yet)
  - Year 6 start (1st adjustment): 50% progress → 75-25
  - Year 7 start (2nd adjustment): 100% progress → 100-0

### 4. Transaction Type
- New transaction type: `'annual_adjustment'`
- Separate from regular `'rebalance'` transactions
- Only created on anniversary dates when in transition window
- Skip transactions for funds already at target (same as rebalancing logic)

### 5. Interaction with Regular Rebalancing
- Allocation transition and regular rebalancing are INDEPENDENT features
- Both can be enabled simultaneously
- On anniversary dates that trigger annual_adjustment: SKIP regular rebalancing check
- Regular rebalancing uses the CURRENT target allocation (which changes during transition)

---

## SIP Date Processing Order

### Normal SIP Date
1. Buy SIP with current target allocation
2. Check regular rebalancing (if enabled and drift > threshold)

### Anniversary SIP Date (in transition window)
1. Perform annual_adjustment to new target allocation
2. Buy SIP with new target allocation
3. Skip regular rebalancing check

---

## UI Requirements

### Controls
- Checkbox: "Allocation Transition (Glide Path)"
- Disabled when ≤1 asset selected
- Text: "Transition in last [N] years (annual adjustments)"

### Transition Years Dropdown
- Only shown when checkbox enabled
- Format: "Last 1 year", "Last 2 years", "Last 3 years", etc.
- Maximum: (rolling period years - 1)
- Example: 5-year rolling period → options are "Last 1 year" through "Last 4 years"
- Default: 10 years (capped to max if rolling period < 10)

### Allocation Display
- Show both start and end allocations when enabled
- Format: Start % → End %
- Visual arrow between allocations
- Both must sum to 100% (validated same as start allocations)

### Chart Invalidation
- Any change to transition settings invalidates charts (triggers recalculation)

---

## Data Model

### SipPortfolio Type
```typescript
{
  // ... existing fields ...
  allocationTransitionEnabled: boolean;
  endAllocations: number[];          // Must sum to 100%
  transitionYears: number;            // Range: 1 to (rollingYears - 1)
}
```

### Transaction Type
- Add `'annual_adjustment'` to transaction type enum
- Used for portfolio adjustments on anniversary dates during transition

---

## Calculation Logic

### Current Target Allocation Function
```
Input: sipDate, startDate, rollingYears, transitionYears, startAllocs, endAllocs
Output: Current target allocation percentages

Logic:
1. Calculate years elapsed since startDate
2. Determine transition start year = rollingYears - transitionYears
3. If yearsElapsed < transitionStartYear: return startAllocations
4. Calculate anniversaries completed in transition window
5. Progress = min(anniversaries / transitionYears, 1.0)
6. Interpolate: startAllocs + (endAllocs - startAllocs) * progress
7. Return interpolated allocations
```

### Anniversary Detection
```
Input: currentDate, startDate
Output: boolean

Logic:
Return currentDate.month === startDate.month 
    && currentDate.day === startDate.day
```

### Annual Adjustment Execution
```
Conditions:
- allocationTransitionEnabled === true
- isAnniversaryDate(sipDate, startDate) === true
- yearsElapsed >= transitionStartYear
- yearsElapsed < rollingYears

Action:
- Calculate new target allocation for this anniversary
- Rebalance entire portfolio to new target
- Create transactions with type: 'annual_adjustment'
- Skip transactions for funds already at target
```

---

## Query Parameters

### URL Format Extension
Extend existing portfolio format:
```
...| transitionFlag | endAlloc1,endAlloc2 | transitionYears

Example:
portfolios=mf:120716:50,mf:120197:50|1|5|0|5|1|75,25|2
                                      ↑ ↑ ↑ ↑ ↑ ↑ ↑    ↑
                                      │ │ │ │ │ │ │    └─ transition years
                                      │ │ │ │ │ │ └────── end allocations
                                      │ │ │ │ │ └──────── transition enabled
                                      │ │ │ │ └────────── stepup %
                                      │ │ │ └──────────── stepup enabled
                                      │ │ └────────────── rebalancing threshold
                                      │ └──────────────── rebalancing enabled
                                      └────────────────── (from existing format)
```

### Backward Compatibility
- Old URLs without transition params: default to disabled
- Default endAllocations: copy from startAllocations
- Default transitionYears: 10 (capped to rolling years - 1)

---

## Validation Rules

1. **End Allocations:**
   - Must sum to exactly 100%
   - Must have same length as assets array
   - Each value: 0 ≤ value ≤ 100

2. **Transition Years:**
   - Minimum: 1
   - Maximum: rollingYears - 1
   - Must be positive integer

3. **Enable Conditions:**
   - Requires ≥ 2 assets
   - Cannot enable if only inflation asset exists

4. **Add/Remove Assets:**
   - When adding asset: add corresponding endAllocation (split evenly)
   - When removing asset: remove corresponding endAllocation

---

## Edge Cases

### Case 1: Transition Years = Rolling Years
- Not allowed - dropdown excludes this option
- Maximum transition years = rolling years - 1

### Case 2: Rolling Period Changed
- If new rolling period < (1 + transitionYears):
  - Cap transitionYears to (newRollingPeriod - 1)
  - Update UI dropdown options

### Case 3: Mid-Transition Rolling Window
- When calculating rolling return for date X:
  - Look back N years to start date
  - Each SIP in that window uses allocation appropriate for its date
  - SIPs may span multiple target allocations

### Case 4: Anniversary + Regular Rebalancing
- Skip regular rebalancing on anniversary dates
- Annual adjustment takes precedence

---

## Testing Considerations

### Unit Tests Needed
1. getCurrentTargetAllocation function
   - Before transition window
   - During transition (each anniversary)
   - After transition complete

2. isAnniversaryDate function
   - Exact match
   - Different month/day
   - Leap years

3. Progress calculation
   - 1 transition year
   - 2 transition years  
   - Multiple transition years

### Integration Tests Needed
1. Complete SIP with transition enabled
2. Transition + rebalancing both enabled
3. Transition + step-up both enabled
4. All three features enabled
5. URL params serialization/deserialization

---

## Implementation Phases

### Phase 1: Foundation ✅ (COMPLETED)
- Type definitions
- State management
- Query params serialization
- URL persistence

### Phase 2: UI ✅ (COMPLETED)
- Checkbox and dropdown
- End allocation inputs
- Visual arrow display
- Chart invalidation

### Phase 3: Calculation Logic ✅ (COMPLETED)
- getCurrentTargetAllocation utility
- isAnniversaryDate utility
- Thread parameters through calculation chain
- Update buy transaction logic
- Create annual_adjustment transactions
- Skip rebalancing on anniversary dates

### Phase 4: Testing ✅ (COMPLETED)
- Unit tests for utilities
- Integration tests for full flow
- Edge case validation

---

## Success Criteria

1. ✅ User can enable allocation transition in UI
2. ✅ User can set different end allocations
3. ✅ User can choose transition years from dropdown
4. ✅ Settings persist in URL params
5. ✅ Calculations correctly use current target allocation
6. ✅ Annual adjustments occur only on anniversaries
7. ✅ Transaction modal shows annual_adjustment transactions
8. ✅ Charts display correct rolling returns with transition
9. ✅ Feature works with rebalancing enabled/disabled
10. ✅ All tests pass (94 tests including 17 new allocation transition tests)

