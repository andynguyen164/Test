# 📋 Trend Following EMA-ADX-MACD Bot - Configuration Parameters

## Overview
Trend Following Bot uses three technical indicators (EMA, ADX, MACD) to identify and follow strong market trends. It enters positions when all indicators confirm a trend and exits when the trend weakens.

**Strategy**: Enter when trend is strong → Ride the trend → Exit when trend reverses

---

## 🔧 Configuration Parameters

### 1. Symbol (Trading Pair)
- Key: `symbol`
- Type: string
- Default: "BTCUSDT"
- Required: ✅ Yes
- Description: The cryptocurrency pair to trade (e.g., BTCUSDT, ETHUSDT).

**Validation:**
- Must be a valid futures contract symbol

**UI Suggestions:**
```
Input Type: Dropdown or Autocomplete
Options: BTCUSDT, ETHUSDT, BNBUSDT, etc.
Placeholder: "Select symbol"
Hint: "Choose the cryptocurrency pair to trade"
```

**Example:**
```
Symbol: BTCUSDT
→ Bot will trade Bitcoin perpetual futures
```

---

### 2. Resolution (Data Resolution)
- Key: `resolution`
- Type: string (enum)
- Default: "Minute"
- Required: ✅ Yes
- Options: Tick, Second, Minute, Hour, Daily
- Description: The data resolution/granularity for the algorithm.

**Validation:**
- Must be a valid Resolution enum value
- For live trading, Tick is recommended
- For backtesting, Minute or Hour is faster

**UI Suggestions:**
```
Input Type: Dropdown
Options: 
  - Tick (Real-time, most accurate)
  - Second (High frequency)
  - Minute (Recommended for backtesting)
  - Hour (Long-term strategies)
  - Daily (Position trading)
Default: Minute
Hint: "Choose data resolution (Tick for live, Minute for backtest)"
```

---

### 3. Trading Direction
- Key: `direction`
- Type: string (enum)
- Default: "Long"
- Required: ✅ Yes
- Options: Neutral, Long, Short

**Description:** The trading direction of the bot.

#### Option A: Long (Bullish Only)
**When to use:** You expect uptrends only

**How it works:**
- Entry: BUY when all indicators show uptrend
- Exit: SELL when trend weakens

**Example:**
```
Direction: Long
Price: $100,000

Indicators align for LONG:
  EMA: Short > Medium > Long ✅
  ADX: 25 (> 20 threshold) ✅
  MACD: 150 > Signal ✅

→ ENTER LONG @ $100,000

Price rises to $102,000...
Then EMA_short crosses below EMA_medium ❌

→ EXIT LONG @ $102,000
→ Profit: +2% ✅
```

#### Option B: Short (Bearish Only)
**When to use:** You expect downtrends only

**How it works:**
- Entry: SELL when all indicators show downtrend
- Exit: BUY when trend weakens

**Example:**
```
Direction: Short
Price: $100,000

Indicators align for SHORT:
  EMA: Short < Medium < Long ✅
  ADX: 25 (> 20 threshold) ✅
  MACD: -150 < Signal ✅

→ ENTER SHORT @ $100,000

Price drops to $98,000...
Then EMA_short crosses above EMA_medium ❌

→ EXIT SHORT @ $98,000
→ Profit: +2% ✅
```

#### Option C: Neutral (Both Directions)
**When to use:** You want to catch trends in both directions

**How it works:**
- Trades both long and short based on market conditions
- Most flexible option

**Example:**
```
Direction: Neutral

Morning: Uptrend detected
→ LONG @ $100,000
→ Exit @ $102,000 (+2%)

Afternoon: Downtrend detected
→ SHORT @ $102,000
→ Exit @ $100,000 (+2%)

Total profit: +4% ✅
```

**UI Suggestions:**
```
Input Type: Radio buttons with icons

( ) Neutral 🔄 "Trade both long and short trends"
    Best for: All market conditions

( ) Long 📈 "Only take long positions"
    Best for: Bullish market expectations

( ) Short 📉 "Only take short positions"
    Best for: Bearish market expectations
```

---

### 4. EMA Short Period
- Key: `emaShortPeriod`
- Type: integer
- Default: 15
- Required: ✅ Yes
- Description: Period for fast-moving Exponential Moving Average.

**Validation:**
- Must be > 0
- Must be < EMA Medium Period
- Recommended: 10 - 50

**How it works:**
```
EMA Short = Fast-reacting price average

Period 15: Responds quickly to price changes
Period 50: Responds slower, smoother line

For trend following:
- Shorter period (10-20): More signals, more noise
- Longer period (30-50): Fewer signals, more reliable
```

**UI Suggestions:**
```
Input Type: Number (integer)
Min Value: 5
Max Value: 100
Default: 15
Placeholder: "e.g. 15"
Hint: "Fast EMA period (must be < medium)"
```

**Example:**
```
EMA Short Period: 15
→ Calculates 15-period EMA
→ Quick to detect trend changes
```

---

### 5. EMA Medium Period
- Key: `emaMediumPeriod`
- Type: integer
- Default: 80
- Required: ✅ Yes
- Description: Period for medium-speed Exponential Moving Average.

**Validation:**
- Must be > EMA Short Period
- Must be < EMA Long Period
- Recommended: 50 - 200

**UI Suggestions:**
```
Input Type: Number (integer)
Min Value: 20
Max Value: 300
Default: 80
Placeholder: "e.g. 80"
Hint: "Medium EMA period (short < medium < long)"
```

---

### 6. EMA Long Period
- Key: `emaLongPeriod`
- Type: integer
- Default: 480
- Required: ✅ Yes
- Description: Period for slow-moving Exponential Moving Average (trend filter).

**Validation:**
- Must be > EMA Medium Period
- Recommended: 200 - 500

**UI Suggestions:**
```
Input Type: Number (integer)
Min Value: 100
Max Value: 1000
Default: 480
Placeholder: "e.g. 480"
Hint: "Slow EMA period (defines main trend)"
```

**EMA Relationship Example:**
```
Short Period: 15 bars  → Fast, reactive
Medium Period: 80 bars → Moderate speed
Long Period: 480 bars  → Slow, trend direction

Uptrend Signal:
  EMA_15 > EMA_80 > EMA_480
  Price is above all EMAs ✅

Downtrend Signal:
  EMA_15 < EMA_80 < EMA_480
  Price is below all EMAs ✅
```

---

### 7. ADX Period
- Key: `adxPeriod`
- Type: integer
- Default: 10
- Required: ✅ Yes
- Description: Period for Average Directional Index calculation.

**What is ADX?**
```
ADX = Trend Strength Indicator

Value: 0 - 100
- 0-20: Weak trend (choppy, ranging)
- 20-25: Developing trend
- 25-50: Strong trend ✅
- 50+: Very strong trend ✅✅
```

**Validation:**
- Must be > 0
- Recommended: 7 - 14

**UI Suggestions:**
```
Input Type: Number (integer)
Min Value: 5
Max Value: 50
Default: 10
Placeholder: "e.g. 10"
Hint: "ADX period (measures trend strength)"
```

**Example:**
```
ADX Period: 10
→ Calculates 10-bar ADX
→ More responsive to trend changes

ADX Period: 20
→ Calculates 20-bar ADX
→ Smoother, less responsive
```

---

### 8. ADX Threshold
- Key: `adxThreshold`
- Type: decimal
- Default: 20
- Required: ✅ Yes
- Unit: ADX Value (0-100)
- Description: Minimum ADX value required to enter trades.

**Validation:**
- Must be > 0
- Recommended: 15 - 30

**How it works:**
```
ADX Threshold = Trend Strength Filter

Threshold: 20
→ Only trade when ADX > 20
→ Avoids weak/choppy markets

ADX = 15: No trade (weak trend) ❌
ADX = 25: Trade allowed (strong trend) ✅
ADX = 35: Trade allowed (very strong) ✅✅
```

**UI Suggestions:**
```
Input Type: Number (decimal, 0 decimals)
Min Value: 10
Max Value: 50
Default: 20
Placeholder: "e.g. 20"
Hint: "Minimum trend strength to trade"
```

**Strategy Guide:**
```
Conservative (High Threshold):
  Threshold: 25-30
  → Only trades very strong trends
  → Fewer trades, higher quality

Moderate (Medium Threshold):
  Threshold: 20-25
  → Balanced approach
  → Reasonable number of trades

Aggressive (Low Threshold):
  Threshold: 15-20
  → Trades weaker trends
  → More trades, more noise
```

---

### 9. MACD Fast Period
- Key: `macdFast`
- Type: integer
- Default: 12
- Required: ✅ Yes
- Description: Fast EMA period for MACD calculation.

**What is MACD?**
```
MACD = Moving Average Convergence Divergence
      = EMA(Fast) - EMA(Slow)

Measures momentum and trend direction
```

**Validation:**
- Must be > 0
- Must be < MACD Slow Period
- Recommended: 8 - 20

**UI Suggestions:**
```
Input Type: Number (integer)
Min Value: 5
Max Value: 50
Default: 12
Placeholder: "e.g. 12"
Hint: "MACD fast period (standard: 12)"
```

---

### 10. MACD Slow Period
- Key: `macdSlow`
- Type: integer
- Default: 20
- Required: ✅ Yes
- Description: Slow EMA period for MACD calculation.

**Validation:**
- Must be > MACD Fast Period
- Recommended: 20 - 35

**UI Suggestions:**
```
Input Type: Number (integer)
Min Value: 15
Max Value: 100
Default: 20
Placeholder: "e.g. 20"
Hint: "MACD slow period (standard: 26)"
```

---

### 11. MACD Signal Period
- Key: `macdSignal`
- Type: integer
- Default: 7
- Required: ✅ Yes
- Description: Signal line EMA period for MACD.

**Validation:**
- Must be > 0
- Recommended: 7 - 12

**UI Suggestions:**
```
Input Type: Number (integer)
Min Value: 3
Max Value: 20
Default: 7
Placeholder: "e.g. 7"
Hint: "MACD signal period (standard: 9)"
```

**MACD Complete Example:**
```
MACD Settings:
  Fast: 12
  Slow: 20
  Signal: 7

Calculation:
  MACD Line = EMA(12) - EMA(20)
  Signal Line = EMA(7) of MACD Line

Long Signal:
  MACD Line > Signal Line ✅
  (Bullish momentum)

Short Signal:
  MACD Line < Signal Line ✅
  (Bearish momentum)
```

---

### 12. Order Quantity
- Key: `orderQuantity`
- Type: decimal
- Default: 5
- Required: ✅ Yes
- Unit: Contracts or Coins
- Description: Size of each trade order.

**Validation:**
- Must be > 0
- Must respect minimum order size
- Should be within risk limits

**UI Suggestions:**
```
Input Type: Number (decimal, 8 decimals)
Min Value: 0.001
Placeholder: "e.g. 5"
Hint: "Trade size per signal"
```

**Example:**
```
For BTCUSDT Spot:
  Order Quantity: 0.01 BTC
  Price: $100,000
  → Order Value: 0.01 × $100,000 = $1,000

For BTCUSDT Futures:
  Order Quantity: 5 contracts
  → 5 contracts of BTC futures
```

**Risk Management:**
```
Conservative: 1-2% of portfolio per trade
Moderate: 2-5% of portfolio per trade
Aggressive: 5-10% of portfolio per trade

Example (Portfolio: $10,000):
  Conservative: $100-200 per trade
  Moderate: $200-500 per trade
  Aggressive: $500-1000 per trade
```

---

### 13. Consolidator Period
- Key: `consolidatorPeriod`
- Type: integer
- Default: 5
- Required: ✅ Yes
- Unit: Minutes
- Description: Time period to consolidate price bars before updating indicators.

**What is Consolidator?**
```
Consolidator = Aggregates smaller bars into larger bars

Resolution: Minute (1-min bars)
Consolidator: 5
→ Creates 5-minute bars from 1-minute data

Benefits:
✅ Reduces noise
✅ Faster processing
✅ Better signal quality
```

**Validation:**
- Must be > 0
- Recommended: 1 - 60

**UI Suggestions:**
```
Input Type: Number (integer)
Min Value: 1
Max Value: 1440 (1 day)
Default: 5
Placeholder: "e.g. 5"
Hint: "Aggregate bars period in minutes"
Suffix: "min"
```

**Examples:**
```
Consolidator: 1 min
→ Process every minute
→ More signals, more noise

Consolidator: 5 min
→ Process every 5 minutes
→ Balanced approach (recommended)

Consolidator: 15 min
→ Process every 15 minutes
→ Fewer signals, smoother

Consolidator: 60 min (1 hour)
→ Process every hour
→ Long-term trend following
```

---

### 14. Leverage
- Key: `leverage`
- Type: integer
- Default: 5
- Required: ✅ Yes
- Description: Leverage multiplier for futures trading.

**Validation:**
- Must be >= 1
- Must be <= exchange maximum (usually 125x)
- Recommended: 1 - 10

**UI Suggestions:**
```
Input Type: Slider or Number
Min Value: 1
Max Value: 20 (recommended max)
Default: 5
Placeholder: "e.g. 5"
Hint: "Higher leverage = higher risk"
```

**Risk Warning:**
```
⚠️ LEVERAGE RISK WARNING ⚠️

Leverage amplifies BOTH profits AND losses!

Example with 10x leverage:
- 1% price move = 10% portfolio change
- 5% price move = 50% portfolio change
- 10% adverse move = LIQUIDATION

Recommendations:
- Beginners: 2-3x
- Intermediate: 5x
- Advanced: 10x
- Expert only: 20x+
```

---

## 📊 Complete Strategy Logic

### Entry Conditions

**LONG Entry (Buy):**
```
ALL must be true:
1. EMA: Short > Medium > Long ✅
   (Uptrend alignment)

2. ADX > Threshold ✅
   (Strong trend)

3. MACD Line > Signal Line ✅
   (Bullish momentum)

4. Direction: Long or Neutral ✅

→ ENTER LONG
```

**SHORT Entry (Sell):**
```
ALL must be true:
1. EMA: Short < Medium < Long ✅
   (Downtrend alignment)

2. ADX > Threshold ✅
   (Strong trend)

3. MACD Line < Signal Line ✅
   (Bearish momentum)

4. Direction: Short or Neutral ✅

→ ENTER SHORT
```

### Exit Conditions

**Exit LONG Position (when quantity > 0):**
```
ANY of these:
1. EMA: Short < Medium ❌
   (Trend weakening)

2. MACD Line < Signal Line ❌
   (Momentum turning bearish)

3. ADX < Threshold ❌
   (Trend losing strength)

→ EXIT LONG
```

**Exit SHORT Position (when quantity < 0):**
```
ANY of these:
1. EMA: Short > Medium ❌
   (Trend weakening)

2. MACD Line > Signal Line ❌
   (Momentum turning bullish)

3. ADX < Threshold ❌
   (Trend losing strength)

→ EXIT SHORT
```

---

## 📱 Example Configurations

### Scalping (Short-term)
```json
{
  "symbol": "BTCUSDT",
  "direction": "Neutral",
  "emaShortPeriod": 10,
  "emaMediumPeriod": 30,
  "emaLongPeriod": 100,
  "adxPeriod": 7,
  "adxThreshold": 15,
  "macdFast": 8,
  "macdSlow": 17,
  "macdSignal": 5,
  "orderQuantity": 10,
  "consolidatorPeriod": 1,
  "leverage": 10
}
```

**Profile:**
- Fast indicators (quick reactions)
- Lower ADX threshold (more trades)
- 1-minute bars
- Higher leverage
- Best for: High volatility, quick profits

---

### Swing Trading (Medium-term) ⭐ Recommended
```json
{
  "symbol": "ETHUSDT",
  "direction": "Long",
  "emaShortPeriod": 15,
  "emaMediumPeriod": 80,
  "emaLongPeriod": 480,
  "adxPeriod": 10,
  "adxThreshold": 20,
  "macdFast": 12,
  "macdSlow": 20,
  "macdSignal": 7,
  "orderQuantity": 5,
  "consolidatorPeriod": 5,
  "leverage": 5
}
```

**Profile:**
- Balanced indicators
- Standard settings
- 5-minute bars
- Moderate leverage
- Best for: Most market conditions

---

### Position Trading (Long-term)
```json
{
  "symbol": "BTCUSDT",
  "direction": "Neutral",
  "emaShortPeriod": 50,
  "emaMediumPeriod": 200,
  "emaLongPeriod": 800,
  "adxPeriod": 14,
  "adxThreshold": 25,
  "macdFast": 20,
  "macdSlow": 35,
  "macdSignal": 10,
  "orderQuantity": 3,
  "consolidatorPeriod": 60,
  "leverage": 3
}
```

**Profile:**
- Slow indicators (major trends only)
- Higher ADX threshold (strong trends only)
- 1-hour bars
- Lower leverage
- Best for: Patient traders, major trends

---

## ⚠️ Risk Warnings

### 1. False Signals
```
⚠️ No indicator is 100% accurate!

Trend following performs well in:
✅ Strong trending markets
✅ Clear directional moves

Trend following performs poorly in:
❌ Ranging/choppy markets
❌ High volatility sideways action

Risk: Multiple small losses during ranging periods
```

### 2. Whipsaw Risk
```
⚠️ Whipsaw = Quick reversals after entry

Example:
  Enter LONG @ $100,000
  Price drops immediately to $99,500
  Exit LONG @ $99,500 (-0.5%)
  
  Price then rallies to $102,000
  Missed the move! 😢

Solution: Use proper ADX threshold to filter weak trends
```

### 3. Late Entry/Exit
```
⚠️ Trend following enters AFTER trend starts

You'll never catch:
- The exact bottom (long entries)
- The exact top (short entries)

You'll always exit:
- After the peak (long exits)
- After the trough (short exits)

This is normal and expected!
Trend following captures the MIDDLE of trends.
```

### 4. Overnight Risk
```
⚠️ Positions may be held overnight

Overnight gaps can:
- Skip past your exit signals
- Create unexpected losses
- Trigger liquidations

Consider: Closing positions before major news events
```

---

## ✅ Validation Rules (for UI)

```javascript
function validateConfig(config) {
  const errors = [];
  
  // 1. EMA Periods
  if (config.emaShortPeriod <= 0) {
    errors.push("EMA short period must be > 0");
  }
  
  if (config.emaShortPeriod >= config.emaMediumPeriod) {
    errors.push("EMA periods must be: short < medium < long");
  }
  
  if (config.emaMediumPeriod >= config.emaLongPeriod) {
    errors.push("EMA periods must be: short < medium < long");
  }
  
  // 2. ADX
  if (config.adxPeriod <= 0) {
    errors.push("ADX period must be > 0");
  }
  
  if (config.adxThreshold <= 0) {
    errors.push("ADX threshold must be > 0");
  }
  
  if (config.adxThreshold > 50) {
    errors.push("⚠️ Warning: ADX threshold > 50 will rarely trigger trades");
  }
  
  // 3. MACD
  if (config.macdFast <= 0 || config.macdSlow <= 0 || config.macdSignal <= 0) {
    errors.push("MACD periods must be > 0");
  }
  
  if (config.macdFast >= config.macdSlow) {
    errors.push("MACD fast must be < MACD slow");
  }
  
  // 4. Order Quantity
  if (config.orderQuantity <= 0) {
    errors.push("Order quantity must be > 0");
  }
  
  // 5. Consolidator
  if (config.consolidatorPeriod <= 0) {
    errors.push("Consolidator period must be > 0");
  }
  
  // 6. Leverage
  if (config.leverage < 1 || config.leverage > 125) {
    errors.push("Leverage must be between 1 and 125");
  }
  
  if (config.leverage > 20) {
    errors.push("⚠️ Warning: Leverage > 20x is extremely risky!");
  }
  
  return errors;
}
```

---

## 🎯 Performance Expectations

### What to Expect:
```
✅ Win Rate: 40-50% (typical for trend following)
✅ Average Win: 3-10% per trade
✅ Average Loss: 0.5-2% per trade
✅ Profit Factor: 1.5-2.5 (profitable)

Key: Large winners offset small losers!
```

### Best Market Conditions:
```
✅ Strong trending markets (up or down)
✅ Clear directional moves
✅ High ADX values (25+)
```

### Worst Market Conditions:
```
❌ Ranging/choppy markets
❌ Low ADX values (< 20)
❌ High volatility sideways action
```

---

Last Updated: 2025-01-15  
Version: 1.0  
Contact: Support team for questions

