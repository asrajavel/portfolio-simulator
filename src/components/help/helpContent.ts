export interface HelpTopic {
  title: string;
  content: string;
}

export const helpContent: Record<string, HelpTopic> = {
  // Getting Started
  'getting-started': {
    title: 'Getting Started',
    content: `An investment analysis tool for Indian markets that lets you simulate and compare investment strategies using historical data.

**Features:**
- Lumpsum investment simulation
- SIP (Systematic Investment Plan) simulation
- Historical NAV comparison

**Use it to:**
- Backtest investment strategies
- Compare instruments (mutual funds, indices, etc.)
- Understand rolling returns and volatility`,
  },

  'strategies-instruments': {
    title: 'Strategies & Instruments',
    content: `**Instrument:**
A single investable asset — a mutual fund, an index, a stock, etc.

**Strategy:**
A combination of one or more instruments with allocation percentages.

**Examples:**
- Single-instrument strategy: 100% NIFTY 50
- Multi-instrument strategy: 70% Equity Fund + 30% Debt Fund

**Why strategies?**
You can compare different approaches side by side:
- Strategy 1: Pure equity (100% NIFTY 50)
- Strategy 2: Balanced (70% equity + 30% debt)
- Strategy 3: Diversified (60% equity + 30% debt + 10% gold)

Each strategy appears as a separate line on the chart.

**Important:** Allocations within a strategy must add up to exactly 100%. The app shows a warning if they don't.`,
  },

  'xirr-explained': {
    title: 'What is XIRR?',
    content: `XIRR (Extended Internal Rate of Return) is the annualized return that accounts for irregular cash flows.

**Why XIRR over CAGR?**
- CAGR works for lumpsum (single investment, single redemption)
- XIRR handles multiple investments at different times (like SIP)

**Example:**
If you invested ₹10,000/month for 5 years and your corpus is ₹8,50,000, XIRR tells you the effective annual return considering each monthly investment date.`,
  },

  'why-rolling': {
    title: 'Why Rolling Returns?',
    content: `Most websites show only a few return values: 1Y, 3Y, 5Y returns from today.

**The problem:**
These are just single data points. An instrument showing 15% 5Y return today might have shown 8% last year and 22% the year before. You're seeing a snapshot, not the full picture.

**Rolling returns show everything:**
Instead of one 5-year return, you see ALL possible 5-year returns the instrument has generated. Every point on the chart is a return for a different start date.

**What you can learn:**
- **Consistency:** Is the instrument reliably good, or just lucky timing?
- **Range:** What's the best and worst case?
- **Probability:** How often did the instrument beat X%?

**Example:**
An instrument's 5Y return today is 12%. But rolling returns show it ranged from 6% to 18% over the last decade. Now you know what to realistically expect.`,
  },

  'url-sharing': {
    title: 'URL Sharing',
    content: `Your entire setup is automatically saved to the URL.

**What's saved:**
- All strategies and their instruments
- Allocation percentages
- Investment amount and duration
- Settings like step-up, rebalancing, log scale

**How to use:**
- Just copy the URL from your browser's address bar
- Share it with anyone — they'll see your exact setup
- Bookmark it to save your analysis for later

No login or account needed. The URL is your saved state.`,
  },

  // Lumpsum Simulator
  'lumpsum-simulator': {
    title: 'Lumpsum Simulator',
    content: `Simulates a one-time investment over historical periods.

**How to use:**
1. Add strategies (each can have multiple instruments with allocations)
2. Select instruments (mutual funds, indices, etc.)
3. Set investment amount and period (years)
4. Click "Plot" to see results

**Reading the chart (example: 3-year, point on 10-Jan-2023):**
You invested ₹x once on 10-Jan-2020.
- **XIRR View:** Point = annualized return (CAGR) for this period
- **Corpus View:** Point = final strategy value in ₹

Shows all possible returns/values for any 3-year lumpsum in this strategy.

**Multi-instrument strategies:**
Allocate across multiple instruments (e.g., 70% equity, 30% debt) to see combined performance.

**Transaction Details:**
Click any point on the chart to see the complete transaction history — every buy with date, NAV, units, and amount.`,
  },

  // SIP Simulator
  'sip-simulator': {
    title: 'SIP Simulator',
    content: `Simulates monthly SIP investments over historical periods.

**How to use:**
1. Add strategies with instrument allocations
2. Enable step-up or rebalancing if needed
3. Select period and click "Plot"

**Reading the chart (example: 3-year, point on 10-Jan-2023):**
You invested ₹x monthly from 10-Jan-2020 to 10-Dec-2022 (36 investments).
- **XIRR View:** Point = XIRR return of this SIP
- **Corpus View:** Point = final strategy value in ₹

Shows all possible returns/values for any 3-year SIP in this strategy.

**Multi-instrument SIP:**
Your monthly amount is split across instruments based on allocation percentages.

**Transaction Details:**
Click any point on the chart to see complete transaction history — all monthly investments, rebalances (if enabled), with dates, NAV, units, and amounts.`,
  },

  'sip-stepup': {
    title: 'Step-up SIP',
    content: `Increases your monthly SIP amount by a fixed percentage every year.

**Example (10% step-up, SIP started 15-Mar-2020):**
- Mar 2020 to Feb 2021: ₹10,000/month
- Mar 2021 to Feb 2022: ₹11,000/month (increased on 15-Mar-2021)
- Mar 2022 to Feb 2023: ₹12,100/month (increased on 15-Mar-2022)

Step-up kicks in on each year anniversary of your SIP start date.

**Why use it?**
- Matches income growth
- Accelerates wealth building
- Combats inflation`,
  },

  'sip-rebalancing': {
    title: 'Rebalancing',
    content: `Rebalancing restores your strategy to target allocations when they drift beyond a threshold.

**When does it happen?**
Checked on each SIP date (monthly), after your regular SIP investment is made.

**Order of operations on each SIP date:**
1. Regular SIP buy happens first (split by allocation %)
2. Strategy is checked for drift
3. If any instrument drifts beyond threshold → rebalance triggers

**Example (70:30 target, 5% threshold):**
- After SIP, equity is at 76%, debt at 24%
- Drift = 6% (exceeds 5% threshold)
- System sells equity, buys debt to restore 70:30

**Note:**
Only relevant for multi-instrument strategies. Disabled for single-instrument strategies.`,
  },

  // Historical Values
  'historical-values': {
    title: 'Historical Values',
    content: `View and compare historical NAV of instruments on a single chart.

**Use it to:**
- Check raw NAV values of any instrument
- Find when an instrument started (first available date)
- Compare growth of multiple instruments over time

**How to use:**
1. Add instruments you want to view/compare
2. Select instrument type and specific instrument
3. Click "Plot Historical Values"

**Logarithmic Scale:**
Enable log scale when comparing instruments with different absolute values.

Example:
- Instrument A: ₹10 → ₹100 (10x growth, 900% return)
- Instrument B: ₹1000 → ₹2000 (2x growth, 100% return)

On a linear chart, B looks like it grew more (₹1000 increase vs ₹90).
On a log chart, A correctly appears as the bigger winner.

Use log scale to compare actual performance, not just absolute values.`,
  },

  // Supported Instruments
  'data-sources': {
    title: 'Supported Instruments',
    content: `**Mutual Funds:**
All AMFI-registered Indian mutual funds.
Source: [MFAPI](https://mfapi.in), updated daily.

**Index Funds:**
NIFTY 50, SENSEX, and other indices.
Primary source: [NSE India](https://www.niftyindices.com/reports/historical-data). Since the official site can sometimes be unreliable, index data is periodically backed up to [this repository](https://github.com/asrajavel/mf-index-data) (updated quarterly).

**Yahoo Finance:**
Any ticker available on Yahoo Finance — stocks, global indices, ETFs.

**Fixed Return:**
Synthetic benchmark showing a fixed annual return (e.g., 8% p.a.).
Useful for comparing against guaranteed return instruments.

**Inflation:**
CPI-based data showing how money loses value over time.
Source: [World Bank](https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=IN) (Consumer Price Index).
Use to understand real (inflation-adjusted) returns.

---

Note: NAV data is only available on trading days. For weekends/holidays, the next available NAV is used to fill the gap, ensuring continuous date coverage for calculations.`,
  },

  'yahoo-tickers': {
    title: 'Common Yahoo Finance Tickers',
    content: `**Indian Stocks:**
TCS.NS -> Tata Consultancy Services (NSE)
RELIANCE.BO -> Reliance Industries (BSE)
HDFCBANK.NS -> HDFC Bank (NSE)

**US Stocks (USD):**
AAPL -> Apple Inc.
TSLA -> Tesla
MSFT -> Microsoft

**Indices:**
^NSEI -> NIFTY 50 (INR)
^BSESN -> SENSEX (INR)
^GSPC -> S&P 500 (USD)
^IXIC -> NASDAQ Composite (USD)
^N225 -> Nikkei 225 (JPY)

**Currency:**
USDINR=X -> USD to INR
EURUSD=X -> Euro to USD

**Crypto:**
BTC-USD -> Bitcoin in USD
ETH-USD -> Ethereum in USD

**Commodities:**
GC=F -> Gold Futures (USD)
GOLDBEES.BO -> Gold ETF (INR)

**Finding tickers:**
Google "[stock/index name] yahoo finance" and use the symbol shown in the page.

---

**Note on currency:** This tool does not perform currency conversion. Each ticker is displayed in its native currency (e.g., AAPL in USD, TCS.NS in INR). Please verify the currency on the Yahoo Finance page before comparing instruments across different currencies.`,
  },

  // Understanding Charts section
  'understanding-charts': {
    title: 'Understanding Charts',
    content: `The simulators generate several charts to help you analyze performance. These charts work the same for both Lumpsum and SIP.

**Rolling Returns Chart:**
Shows returns for every possible investment window. Each point = return if you ended on that date.

**Distribution Histogram:**
Groups rolling returns into 20 buckets. Shows what % of returns fell in each range (per strategy).

**Volatility Chart:**
Shows annualized volatility (%) for each rolling period — how risky the investment was.`,
  },

  'rolling-xirr': {
    title: 'Rolling Returns Chart',
    content: `Shows returns for every possible investment window of the selected duration.

**What each point means:**
"If my investment ended on this date after X years, what would my return be?"

**What to look for:**
- **Consistency:** Flat line = stable returns across time
- **Range:** Gap between best and worst = risk indicator
- **Trends:** Upward/downward patterns over market cycles

Helps answer: "What's the probability of achieving X% returns?"`,
  },

  'histogram': {
    title: 'Distribution Histogram',
    content: `Groups all rolling returns into 20 buckets and shows what percentage fell in each range.

**How to read it:**
- X-axis: Return ranges (buckets are auto-calculated based on min/max)
- Y-axis: Percentage of returns in that range
- For each strategy, its bars add up to 100%
- Taller bar = more common outcome for that strategy

**What to look for:**
- **Peak location:** Where most returns cluster (expected outcome)
- **Spread:** Wide = unpredictable, narrow = consistent
- **Left tail:** What % of returns were negative/low

**Example:**
If Strategy A's 10-12% bar shows 25%, it means 25% of all historical returns for Strategy A fell in 10-12%.

**Note:** The distribution is only meaningful if you have enough data points. If the date range is short, you'll have fewer rolling periods, making the distribution less reliable. For example, a 5-year rolling analysis on 6 years of data gives very few data points.`,
  },

  'volatility': {
    title: 'Volatility Chart',
    content: `Shows annualized volatility (%) for each rolling period — a measure of risk.

**How it's calculated:**
1. Take daily portfolio values during the investment period
2. Calculate daily returns (% change each day)
3. On SIP days, cash flow is excluded so only market movement counts
4. Weekends/holidays are skipped (no artificial zero returns)
5. Standard deviation of daily returns × √(~252 trading days/year) = annualized volatility

**What each point means:**
"If my investment ended on this date, how volatile was the ride?"

**Reading the chart:**
- Higher % = more volatile = riskier
- Lower % = steadier = less risky
- Compare strategies to see which had a smoother ride

**Use it to:**
- Understand the risk you'd have experienced
- Compare risk profiles of different strategies
- See if volatility changed over market cycles`,
  },
};

// Structure for navigation - categories can now be clickable
export const getTopicsByCategory = () => ({
  'Getting Started': {
    topicId: 'getting-started',
    subTopics: ['strategies-instruments', 'xirr-explained', 'why-rolling', 'url-sharing'],
  },
  'Supported Instruments': {
    topicId: 'data-sources',
    subTopics: ['yahoo-tickers'],
  },
  'Understanding Charts': {
    topicId: 'understanding-charts',
    subTopics: ['rolling-xirr', 'histogram', 'volatility'],
  },
  'Lumpsum Simulator': {
    topicId: 'lumpsum-simulator',
    subTopics: [],
  },
  'SIP Simulator': {
    topicId: 'sip-simulator',
    subTopics: ['sip-stepup', 'sip-rebalancing'],
  },
  'Historical Values': {
    topicId: 'historical-values',
    subTopics: [],
  },
});
