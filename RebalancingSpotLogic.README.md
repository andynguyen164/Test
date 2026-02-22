# 📋 Rebalancing Spot Bot - Configuration Parameters

## Overview
Rebalancing Bot automatically maintains target portfolio allocations by periodically buying and selling assets when deviations occur due to market movements.

---

## 🔧 Configuration Parameters

### 1. Brokerage Name
- Key: bot-rebalancing-spot-brokerage-name
- Type: string (enum)
- Default: "Binance"
- Required: ✅ Yes
- Options: Binance, Coinbase, Kraken, Bybit, OKX
- Description: The cryptocurrency exchange where trades will be executed.

Validation:
- Must be a supported brokerage in QuantConnect
- Account must be configured with API keys
- Spot trading must be enabled

UI Suggestions:

Input Type: Dropdown
Options: Binance, Coinbase, Kraken, Bybit, OKX
Default: Binance
Hint: "Choose your preferred exchange"

Example:

Brokerage Name: Binance
→ Bot will execute trades on Binance Spot market

---

### 2. Initial Cash
- Key: bot-rebalancing-spot-cash
- Type: decimal
- Default: 10000.0
- Required: ✅ Yes
- Unit: USDT
- Description: Initial capital amount for the portfolio.

Validation:
- Must be > 0
- Should be within available balance
- Recommended: 1000 - 100000 USDT

UI Suggestions:

Input Type: Number (decimal, 2 decimals)
Min Value: 100
Placeholder: "e.g. 10000.00"
Hint: "Initial portfolio capital in USDT"
Step: 100

Example:

Initial Cash: 10000 USDT
→ Portfolio starts with $10,000 capital

---

### 3. Portfolio Composition
- Key: bot-rebalancing-spot-portfolio
- Type: Array of PortfolioTargetInput
- Default: [{"Symbol": "BTCUSDT", "Weight": 0.5}, {"Symbol": "ETHUSDT", "Weight": 0.5}]
- Required: ✅ Yes
- Description: List of assets and their target weight allocations.

Validation:
- At least 2 assets required
- Total weights must sum to exactly 1.0 (100%)
- Each weight must be > 0 and < 1
- Symbols must be valid trading pairs

UI Suggestions:

Input Type: Dynamic List with Add/Remove buttons
Each Asset Row:
- Symbol: Dropdown/Autocomplete (BTCUSDT, ETHUSDT, BNBUSDT, etc.)
- Weight: Number (decimal, 4 decimals) with slider 0-1
- Remove button

Hint: "Total allocation must equal 100%"

Example:

Portfolio:
[
  {"Symbol": "BTCUSDT", "Weight": 0.40},  // 40% BTC
  {"Symbol": "ETHUSDT", "Weight": 0.30},  // 30% ETH
  {"Symbol": "BNBUSDT", "Weight": 0.20},  // 20% BNB
  {"Symbol": "SOLUSDT", "Weight": 0.10}   // 10% SOL
]

Total Weight: 1.0 ✅

---

### 4. Schedule Rule
- Key: bot-rebalancing-spot-schedule-rule
- Type: ScheduleRuleBase object
- Default: {"Type": "EveryScheduleRule", "DateRule": "EveryDay", "Interval": "24:00:00"}
- Required: ✅ Yes
- Description: When the bot should check and potentially execute rebalancing.

#### Option A: Every Schedule Rule (Regular Intervals)
- Type: EveryScheduleRule
- DateRule: EveryDay, Monday, Tuesday, etc.
- Interval: TimeSpan (e.g., "06:00:00" = 6 hours)

Validation:
- Interval must be > 0
- DateRule must be valid DayOfWeek or EveryDay

Example:

Every Day, Every 6 Hours:
```json
{
  "Type": "EveryScheduleRule",
  "DateRule": "EveryDay",
  "Interval": "06:00:00"
}
```

#### Option B: At Schedule Rule (Specific Times)
- Type: AtScheduleRule
- DateRule: EveryDay, Monday, etc.
- Times: Array of TimeSpan (e.g., ["09:00:00", "21:00:00"])

Validation:
- At least 1 time required
- Times must be valid TimeSpan format
- DateRule must be valid

Example:

Every Day at 9:00 AM and 9:00 PM UTC:
```json
{
  "Type": "AtScheduleRule",
  "DateRule": "EveryDay",
  "Times": ["09:00:00", "21:00:00"]
}
```

UI Suggestions:

Input Type: Radio buttons for Schedule Type
For Every Schedule:
- Date Rule: Dropdown (Every Day, Monday, Tuesday, etc.)
- Interval: Time input (HH:MM:SS) or presets (1h, 6h, 12h, 24h, 7d)

For At Schedule:
- Date Rule: Dropdown (Every Day, Monday, etc.)
- Times: Multi-select time picker or add/remove time inputs

---

### 5. Resolution
- Key: bot-rebalancing-spot-resolution
- Type: string (enum)
- Default: "Minute"
- Required: ✅ Yes
- Options: Tick, Second, Minute, Hour, Daily
- Description: Data resolution for market data and algorithm execution.

Validation:
- Must be valid Resolution enum
- For live trading: Tick recommended
- For backtesting: Minute or Hour faster

UI Suggestions:

Input Type: Dropdown
Options:
  - Tick (Real-time, most accurate for live)
  - Minute (Balanced, good for backtest)
  - Hour (Long-term strategies)
  - Daily (Position trading)
Default: Minute
Hint: "Tick for live trading, Minute for backtesting"

Example:

Resolution: Minute
→ Algorithm receives price updates every minute
→ Good balance of accuracy and speed

---

### 6. Start Date
- Key: bot-rebalancing-spot-start-date
- Type: DateTime
- Default: Current date
- Required: ✅ Yes
- Description: When the algorithm should start running.

Validation:
- Must be valid DateTime
- Cannot be in the past for live trading
- Should be within supported date range

UI Suggestions:

Input Type: Date picker
Default: Today
Min Date: Today (for live)
Hint: "Algorithm start date"

---

### 7. End Date
- Key: bot-rebalancing-spot-end-date
- Type: DateTime
- Default: 1 year from start
- Required: ✅ Yes
- Description: When the algorithm should stop running.

Validation:
- Must be after Start Date
- Should be reasonable timeframe

UI Suggestions:

Input Type: Date picker
Default: 1 year from start
Min Date: Start Date
Hint: "Algorithm end date (leave empty for indefinite)"

---

### 8. Leverage
- Key: bot-rebalancing-spot-leverage
- Type: decimal
- Default: 1.0
- Required: ✅ Yes
- Description: Leverage multiplier for spot trading (usually 1.0 for spot).

Validation:
- Must be >= 1.0
- For spot trading, should be 1.0
- For margin trading, can be > 1.0

UI Suggestions:

Input Type: Number (decimal, 1 decimal)
Min Value: 1.0
Max Value: 5.0 (recommended max for spot)
Default: 1.0
Hint: "Leverage (1.0 = no leverage for spot)"

---

### 9. Telegram Chat ID
- Key: bot-rebalancing-spot-telegram-chat-id
- Type: string
- Default: ""
- Required: ❌ Optional
- Description: Telegram chat ID for notifications.

Validation:
- Must be valid Telegram chat ID if provided
- Should start with "-" for groups or be numeric for users

UI Suggestions:

Input Type: Text input
Placeholder: "e.g. 123456789"
Hint: "Your Telegram chat ID for notifications"
Optional indicator: (Optional)

---

### 10. Telegram Bot Token
- Key: bot-rebalancing-spot-telegram-bot-token
- Type: string
- Default: ""
- Required: ❌ Optional
- Description: Telegram bot token for sending notifications.

Validation:
- Must be valid Telegram bot token format if provided
- Should start with "bot" prefix

UI Suggestions:

Input Type: Text input
Placeholder: "e.g. 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
Hint: "Your Telegram bot token"
Optional indicator: (Optional)

---

## 📊 UI Layout Suggestion

```
┌─────────────────────────────────────────────────────────────────┐
│                    Rebalancing Spot Bot                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                BASIC SETTINGS                              │ │
│  │                                                            │ │
│  │  Brokerage          [Binance          ▼]                  │ │
│  │  Initial Cash       [10,000.00        ] USDT              │ │
│  │  Resolution         [Minute           ▼]                  │ │
│  │  Leverage           [1.0              ] x                 │ │
│  │                                                            │ │
│  │  ┌─────────────────────┐  ┌─────────────────────┐         │ │
│  │  │  Start Date        │  │  End Date           │         │ │
│  │  │  [2025-01-01]      │  │  [2025-12-31]       │         │ │
│  │  └─────────────────────┘  └─────────────────────┘         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                PORTFOLIO TARGETS                           │ │
│  │                                                            │ │
│  │  ┌───────────────────────────────────────────────────────┐ │ │
│  │  │  Asset 1: BTC/USDT  Weight: [0.4000 ▂▃▅▆█ ] 40.00%   │ │ │
│  │  │  Asset 2: ETH/USDT  Weight: [0.3000 ▂▃▅▆▃ ] 30.00%   │ │ │
│  │  │  Asset 3: BNB/USDT  Weight: [0.2000 ▂▃▅▄▃ ] 20.00%   │ │ │
│  │  │  Asset 4: SOL/USDT  Weight: [0.1000 ▂▃▃▃▂ ] 10.00%   │ │ │
│  │  │                                                       │ │ │
│  │  │  ➕ Add Asset                                          │ │ │
│  │  │                                                       │ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                SCHEDULING                                  │ │
│  │                                                            │ │
│  │  (•) Regular Intervals                                     │ │
│  │      Date Rule: [Every Day         ▼]                      │ │
│  │      Interval:  [24:00:00         ] HH:MM:SS               │ │
│  │                                                            │ │
│  │  ( ) Specific Times                                        │ │
│  │      Date Rule: [Every Day         ▼]                      │ │
│  │      Times:                                                │ │
│  │      [09:00:00]  [21:00:00]  ➕ Add Time                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                NOTIFICATIONS (Optional)                    │ │
│  │                                                            │ │
│  │  Telegram Chat ID    [                    ]               │ │
│  │  Telegram Bot Token  [                    ]               │ │
│  │                                                            │ │
│  │  ⓘ Get your bot token from @BotFather on Telegram        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                CAPITAL REQUIREMENT                         │ │
│  │                                                            │ │
│  │  Required Capital: $10,000.00 USDT                        │ │
│  │  Your Balance:     $25,000.00 USDT ✅                      │ │
│  │  Remaining After:  $15,000.00 USDT                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│         [Reset to Default]  [Save Configuration]                │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Validation Rules (for UI)

```javascript
function validateConfig(config) {
  const errors = [];

  // 1. Brokerage Name
  if (!config.brokerageName) {
    errors.push("Brokerage name is required");
  }

  // 2. Initial Cash
  if (!config.cash || config.cash <= 0) {
    errors.push("Initial cash must be greater than 0");
  }

  // 3. Portfolio
  if (!config.portfolio || config.portfolio.length < 2) {
    errors.push("Portfolio must have at least 2 assets");
  }

  const totalWeight = config.portfolio.reduce((sum, asset) => sum + asset.Weight, 0);
  if (Math.abs(totalWeight - 1.0) > 0.0001) {
    errors.push(`Portfolio weights must sum to 100% (currently ${totalWeight * 100}%)`);
  }

  config.portfolio.forEach((asset, index) => {
    if (asset.Weight <= 0 || asset.Weight >= 1) {
      errors.push(`Asset ${index + 1} weight must be between 0 and 1`);
    }
  });

  // 4. Schedule Rule
  if (!config.scheduleRule) {
    errors.push("Schedule rule is required");
  }

  // 5. Resolution
  const validResolutions = ['Tick', 'Second', 'Minute', 'Hour', 'Daily'];
  if (!validResolutions.includes(config.resolution)) {
    errors.push("Invalid resolution. Must be one of: " + validResolutions.join(', '));
  }

  // 6. Dates
  if (!config.startDate) {
    errors.push("Start date is required");
  }

  if (config.endDate && config.startDate >= config.endDate) {
    errors.push("End date must be after start date");
  }

  // 7. Leverage
  if (!config.leverage || config.leverage < 1.0) {
    errors.push("Leverage must be at least 1.0");
  }

  return errors;
}
```

---

## 📱 Example Configurations

### Conservative Strategy (Long-term HODL)
```json
{
  "bot-rebalancing-spot-brokerage-name": "Binance",
  "bot-rebalancing-spot-cash": 50000,
  "bot-rebalancing-spot-portfolio": [
    {"Symbol": "BTCUSDT", "Weight": 0.6},
    {"Symbol": "ETHUSDT", "Weight": 0.4}
  ],
  "bot-rebalancing-spot-schedule-rule": {
    "Type": "EveryScheduleRule",
    "DateRule": "EveryDay",
    "Interval": "168:00:00"
  },
  "bot-rebalancing-spot-resolution": "Minute",
  "bot-rebalancing-spot-start-date": "2025-01-01T00:00:00Z",
  "bot-rebalancing-spot-end-date": "2025-12-31T00:00:00Z",
  "bot-rebalancing-spot-leverage": 1.0,
  "bot-rebalancing-spot-telegram-chat-id": "",
  "bot-rebalancing-spot-telegram-bot-token": ""
}
```

Profile:
- Capital: $50,000 (high for stability)
- Assets: BTC + ETH only (conservative)
- Rebalance: Weekly (reduce fees)
- Notifications: Disabled

---

### Aggressive Strategy (Frequent Trading)
```json
{
  "bot-rebalancing-spot-brokerage-name": "Binance",
  "bot-rebalancing-spot-cash": 10000,
  "bot-rebalancing-spot-portfolio": [
    {"Symbol": "BTCUSDT", "Weight": 0.25},
    {"Symbol": "ETHUSDT", "Weight": 0.25},
    {"Symbol": "BNBUSDT", "Weight": 0.25},
    {"Symbol": "ADAUSDT", "Weight": 0.25}
  ],
  "bot-rebalancing-spot-schedule-rule": {
    "Type": "EveryScheduleRule",
    "DateRule": "EveryDay",
    "Interval": "06:00:00"
  },
  "bot-rebalancing-spot-resolution": "Tick",
  "bot-rebalancing-spot-start-date": "2025-01-01T00:00:00Z",
  "bot-rebalancing-spot-end-date": "2025-12-31T00:00:00Z",
  "bot-rebalancing-spot-leverage": 1.0,
  "bot-rebalancing-spot-telegram-chat-id": "123456789",
  "bot-rebalancing-spot-telegram-bot-token": "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
}
```

Profile:
- Capital: $10,000 (lower for agility)
- Assets: 4 altcoins (high diversification)
- Rebalance: Every 6 hours (frequent)
- Resolution: Tick (real-time)
- Notifications: Enabled

---

### Market Hours Strategy (Trading Hours Only)
```json
{
  "bot-rebalancing-spot-brokerage-name": "Binance",
  "bot-rebalancing-spot-cash": 25000,
  "bot-rebalancing-spot-portfolio": [
    {"Symbol": "BTCUSDT", "Weight": 0.4},
    {"Symbol": "ETHUSDT", "Weight": 0.3},
    {"Symbol": "BNBUSDT", "Weight": 0.2},
    {"Symbol": "SOLUSDT", "Weight": 0.1}
  ],
  "bot-rebalancing-spot-schedule-rule": {
    "Type": "AtScheduleRule",
    "DateRule": "EveryDay",
    "Times": ["09:00:00", "15:00:00", "21:00:00"]
  },
  "bot-rebalancing-spot-resolution": "Minute",
  "bot-rebalancing-spot-start-date": "2025-01-01T00:00:00Z",
  "bot-rebalancing-spot-end-date": "2025-12-31T00:00:00Z",
  "bot-rebalancing-spot-leverage": 1.0,
  "bot-rebalancing-spot-telegram-chat-id": "",
  "bot-rebalancing-spot-telegram-bot-token": ""
}
```

Profile:
- Capital: $25,000 (balanced)
- Assets: Major + Altcoin mix
- Rebalance: 9 AM, 3 PM, 9 PM UTC (market hours)
- Notifications: Disabled (quiet)

---

## 🎯 Strategy Examples

### 1. Buy & Hold Benchmark
**No rebalancing** - Traditional passive investment
- Best for: Strong bull markets, low volatility
- Risk: Drift from target allocation over time
- Cost: No trading fees

### 2. Monthly Rebalancing
**Conservative approach** - Rebalance once per month
- Best for: Long-term investors, tax efficiency
- Benefits: Low fees, steady returns
- Drawback: Slow reaction to market changes

### 3. Weekly Rebalancing
**Balanced approach** - Rebalance every week
- Best for: Medium-term, moderate activity
- Benefits: Good risk control, reasonable fees
- Drawback: Some market timing risk

### 4. Daily Rebalancing
**Active approach** - Rebalance daily
- Best for: Short-term traders, high conviction
- Benefits: Tight risk control, volatility harvesting
- Drawback: Higher fees, potential over-trading

### 5. Intra-day Rebalancing
**Ultra-active** - Multiple times per day
- Best for: Professional traders, high-frequency
- Benefits: Maximum precision, real-time adaptation
- Drawback: Very high fees, requires constant monitoring

---

## ⚠️ Risk Warnings

### 1. Transaction Costs
**Problem:** Frequent rebalancing increases trading fees
```
Fee Impact Calculation:
Annual Fee Drag = (Trades per Year × Fee per Trade) / Capital

Example:
- Daily rebalance: 365 trades/year
- $1 fee per trade: $365 annual drag
- On $10,000 capital: 3.65% annual fee drag ⚠️
```

**Solutions:**
- Use longer intervals (weekly/monthly)
- Check minimum trade sizes
- Monitor fee impact

### 2. Market Impact
**Problem:** Large trades affect market prices
```
Slippage Risk:
- Small portfolio (< $10k): Usually fine
- Medium portfolio ($10k-$100k): Some slippage
- Large portfolio (>$100k): Significant impact
```

**Solutions:**
- Trade during high liquidity periods
- Split large orders
- Use limit orders instead of market orders

### 3. Tax Implications
**Problem:** Rebalancing triggers capital gains tax
```
Tax Events:
- Selling winners: Realized gains (taxable)
- Buying losers: Creates new cost basis
- Frequency matters: Daily = annual tax events
```

**Solutions:**
- Consider tax-advantaged accounts
- Plan rebalancing around tax seasons
- Consult tax professional

### 4. Black Swan Events
**Problem:** Extreme volatility can cause execution issues
```
Flash Crash Scenario:
- Price drops 20% in minutes
- Bot tries to buy more
- May exhaust capital quickly
- Liquidation risk if using leverage
```

**Solutions:**
- Set maximum position limits
- Implement circuit breakers
- Add volatility filters

### 5. Over-optimization
**Problem:** Curve fitting to historical data
```
Backtesting Bias:
- Perfect historical rebalancing
- Ignores real-world frictions
- May fail in different market conditions
```

**Solutions:**
- Use out-of-sample testing
- Include realistic fees and slippage
- Paper trade new strategies first

---

## 📝 API Response Format

```json
{
  "success": true,
  "botId": "rebalancing_spot_btc_eth_1234567890",
  "config": {
    "brokerageName": "Binance",
    "cash": 10000,
    "portfolio": [
      {"symbol": "BTCUSDT", "weight": 0.5, "qcSymbol": "BTCUSDT"},
      {"symbol": "ETHUSDT", "weight": 0.5, "qcSymbol": "ETHUSDT"}
    ],
    "scheduleRule": {
      "type": "EveryScheduleRule",
      "dateRule": "EveryDay",
      "interval": "24:00:00"
    },
    "resolution": "Minute",
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-12-31T00:00:00Z",
    "leverage": 1.0,
    "telegramChatId": "",
    "telegramBotToken": ""
  },
  "calculated": {
    "requiredCapital": 10000,
    "targetAllocations": {
      "BTCUSDT": 0.5,
      "ETHUSDT": 0.5
    },
    "nextRebalance": "2025-01-02T00:00:00Z"
  },
  "status": "initialized"
}
```

---

*Last Updated: 2025-01-20*
*Version: 2.0*
*Contact: Support team for configuration assistance*
