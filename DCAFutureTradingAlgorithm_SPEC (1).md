# DCA Futures Trading Algorithm - Technical Specification

## Overview
DCA (Dollar Cost Averaging) Futures Trading Bot là một thuật toán giao dịch tự động sử dụng chiến lược DCA để phân bổ vốn đầu tư vào nhiều mức giá khác nhau.

**Version:** DCAFuture-v1

## Mô tả hoạt động

### Luồng hoạt động chính:
1. **Khởi tạo vị thế**: Đặt lệnh Base Order ở giá thị trường hiện tại
2. **DCA Orders**: Tự động đặt các lệnh DCA theo cấp độ (level) khi lệnh trước đó được khớp
3. **Quản lý rủi ro**: Tự động chốt lời (Take Profit) hoặc cắt lỗ (Stop Loss)
4. **Tự động lặp lại**: Sau khi đóng vị thế, bot tự động bắt đầu chu kỳ mới

### Cơ chế DCA:
- **Long Direction**: Các lệnh DCA được đặt ở mức giá GIẢM DẦN (mua khi giá giảm)
- **Short Direction**: Các lệnh DCA được đặt ở mức giá TĂNG DẦN (bán khi giá tăng)

---

## Configuration Parameters

### 1. Trading Symbol
**Parameter:** `bot-dca-future-symbol`
- **Type:** String
- **Default:** `"BTCUSDT"`
- **Description:** Symbol của cặp giao dịch futures
- **Examples:** 
  - `"BTCUSDT"` - Bitcoin/USDT
  - `"ETHUSDT"` - Ethereum/USDT
  - `"BNBUSDT"` - Binance Coin/USDT

---

### 2. Trading Direction
**Parameter:** `bot-dca-future-direction`
- **Type:** String (Enum)
- **Default:** `"Long"`
- **Valid Values:** 
  - `"Long"` - Mở vị thế Long (mua)
  - `"Short"` - Mở vị thế Short (bán)
- **Description:** Hướng giao dịch của bot
- **Impact:**
  - **Long**: DCA orders đặt ở giá thấp hơn, Take Profit ở giá cao hơn
  - **Short**: DCA orders đặt ở giá cao hơn, Take Profit ở giá thấp hơn

---

### 3. Base Order Quantity
**Parameter:** `bot-dca-future-base-order-quantity`
- **Type:** Decimal
- **Default:** `0.01`
- **Unit:** Contract/Coin quantity
- **Validation:** Must be > 0
- **Description:** Số lượng của lệnh đầu tiên (Base Order)
- **Example:** 
  - `0.01` BTC cho BTCUSDT
  - `0.1` ETH cho ETHUSDT

---

### 4. DCA Order Quantity
**Parameter:** `bot-dca-future-dca-order-quantity`
- **Type:** Decimal
- **Default:** `0.01`
- **Unit:** Contract/Coin quantity
- **Validation:** Must be > 0
- **Description:** Số lượng của mỗi lệnh DCA (từ Level 1 trở đi)
- **Note:** Có thể khác với Base Order Quantity để điều chỉnh chiến lược

---

### 5. Maximum DCA Orders
**Parameter:** `bot-dca-future-max-dca-orders`
- **Type:** Integer
- **Default:** `10`
- **Range:** >= 0
- **Description:** Số lượng tối đa các lệnh DCA (không bao gồm Base Order)
- **Total Orders:** Base Order (1) + DCA Orders (max-dca-orders)
- **Example:**
  - `max-dca-orders = 10` → Tổng cộng 11 lệnh (1 base + 10 DCA)
  - `max-dca-orders = 0` → Chỉ có Base Order, không có DCA

---

### 6. Price Deviation
**Parameter:** `bot-dca-future-price-deviation`
- **Type:** Decimal
- **Default:** `0.1`
- **Unit:** Percentage (%)
- **Validation:** Must be > 0
- **Description:** Khoảng cách % giữa các mức giá DCA
- **Formula:**
  - **Long**: Next DCA Price = Previous Price × (1 - deviation/100)
  - **Short**: Next DCA Price = Previous Price × (1 + deviation/100)
- **Examples:**
  - `0.1` = 0.1% khoảng cách giữa các level
  - `0.5` = 0.5% khoảng cách
  - `1.0` = 1% khoảng cách
- **Impact:** 
  - Giá trị nhỏ → DCA levels gần nhau → Dễ kích hoạt
  - Giá trị lớn → DCA levels xa nhau → Khó kích hoạt hơn

---

### 7. Take Profit
**Parameter:** `bot-dca-future-take-profit`
- **Type:** Decimal
- **Default:** `0.2`
- **Unit:** Percentage (%)
- **Validation:** Must be > 0
- **Description:** Mức chốt lời khi giá đạt mục tiêu
- **Formula:**
  - **Long**: Take Profit Price = Average Entry Price × (1 + takeprofit/100)
  - **Short**: Take Profit Price = Average Entry Price × (1 - takeprofit/100)
- **Examples:**
  - `0.2` = Chốt lời khi lời 0.2%
  - `1.0` = Chốt lời khi lời 1%
  - `5.0` = Chốt lời khi lời 5%
- **Behavior:** Tự động đóng toàn bộ vị thế khi đạt mục tiêu

---

### 8. Stop Loss
**Parameter:** `bot-dca-future-stop-loss`
- **Type:** Decimal
- **Default:** `0.3`
- **Unit:** Percentage (%)
- **Validation:** Must be > 0
- **Description:** Mức cắt lỗ để bảo vệ vốn
- **Formula:**
  - **Long**: Stop Loss Price = Average Entry Price × (1 - stoploss/100)
  - **Short**: Stop Loss Price = Average Entry Price × (1 + stoploss/100)
- **Examples:**
  - `0.3` = Cắt lỗ khi lỗ 0.3%
  - `2.0` = Cắt lỗ khi lỗ 2%
  - `10.0` = Cắt lỗ khi lỗ 10%
- **Important:** Stop Loss CHỈ kích hoạt SAU KHI tất cả DCA orders đã được đặt
- **Behavior:** Tự động đóng toàn bộ vị thế khi đạt mức cắt lỗ

---

### 9. Leverage
**Parameter:** `bot-dca-future-leverage`
- **Type:** Integer
- **Default:** `5`
- **Range:** Depends on exchange (typically 1-125x)
- **Description:** Đòn bẩy giao dịch futures
- **Examples:**
  - `1` = Không đòn bẩy (1x)
  - `5` = Đòn bẩy 5x
  - `10` = Đòn bẩy 10x
  - `20` = Đòn bẩy 20x
- **Warning:** Đòn bẩy cao → Rủi ro thanh lý cao
- **Impact:** Ảnh hưởng đến margin requirement và khả năng thanh lý

---

### 10. Brokerage
**Parameter:** `brokerage-name`
- **Type:** String (Enum)
- **Default:** `"OKXFutures"`
- **Valid Values:** 
  - `"OKXFutures"`
  - Other brokerages (depends on system support)
- **Description:** Sàn giao dịch sử dụng

---

### 11. Initial Cash
**Parameter:** From `AlgorithmUserConfig.Cash`
- **Type:** Decimal
- **Unit:** USDT
- **Description:** Số vốn ban đầu để giao dịch
- **Important:** Phải đủ để cover tất cả DCA orders và margin requirements

---

### 12. Telegram Notifications
**Parameters:**
- `telegram-chat-id`
  - **Type:** String
  - **Default:** `"@testbsx"`
  - **Description:** Chat ID hoặc username của Telegram channel/user
  
- `telegram-bot-token`
  - **Type:** String
  - **Default:** `"1922257387:AAEQy9nY1IuItZXT8oqfKrCLGibTzA8o8vQ"`
  - **Description:** Bot token từ BotFather để gửi thông báo

---

## Calculation Examples

### Example 1: Long Position with 3 DCA Orders

**Configuration:**
- Symbol: BTCUSDT
- Direction: Long
- Current Price: $50,000
- Base Order Quantity: 0.01 BTC
- DCA Order Quantity: 0.01 BTC
- Max DCA Orders: 3
- Price Deviation: 1% (0.01)

**Calculated Levels:**
- **Level 0 (Base)**: $50,000 × 0.01 BTC = $500 USDT
- **Level 1 (DCA)**: $49,500 × 0.01 BTC = $495 USDT (50,000 × 0.99)
- **Level 2 (DCA)**: $49,005 × 0.01 BTC = $490 USDT (49,500 × 0.99)
- **Level 3 (DCA)**: $48,515 × 0.01 BTC = $485 USDT (49,005 × 0.99)

**Total Capital Required:** ~$1,970 USDT (excluding leverage)

**If all levels filled:**
- Average Entry: $48,755
- Total Quantity: 0.04 BTC
- Take Profit (0.2%): $48,852.51
- Stop Loss (0.3%): $48,608.74

---

### Example 2: Short Position with 5 DCA Orders

**Configuration:**
- Symbol: ETHUSDT
- Direction: Short
- Current Price: $3,000
- Base Order Quantity: 0.1 ETH
- DCA Order Quantity: 0.1 ETH
- Max DCA Orders: 5
- Price Deviation: 0.5% (0.005)

**Calculated Levels:**
- **Level 0 (Base)**: $3,000 × 0.1 ETH = $300 USDT
- **Level 1 (DCA)**: $3,015 × 0.1 ETH = $301.50 USDT (3,000 × 1.005)
- **Level 2 (DCA)**: $3,030 × 0.1 ETH = $303 USDT (3,015 × 1.005)
- **Level 3 (DCA)**: $3,045 × 0.1 ETH = $304.50 USDT
- **Level 4 (DCA)**: $3,060 × 0.1 ETH = $306 USDT
- **Level 5 (DCA)**: $3,075 × 0.1 ETH = $307.50 USDT

**Total Capital Required:** ~$1,822 USDT (excluding leverage)

**If all levels filled:**
- Average Entry: $3,037.50
- Total Quantity: 0.6 ETH (Short)
- Take Profit (0.2%): $3,031.43 (price goes DOWN)
- Stop Loss (0.3%): $3,046.62 (price goes UP)

---

## Risk Management

### Stop Loss Behavior
⚠️ **Important:** Stop Loss chỉ được kích hoạt SAU KHI tất cả DCA orders đã được đặt.

**Reason:** Cho phép tất cả DCA levels có cơ hội được khớp trước khi cắt lỗ.

### Insufficient Funds Detection
Bot tự động phát hiện lỗi "insufficient funds" và:
1. Gửi cảnh báo qua Telegram
2. Log chi tiết lỗi
3. **Dừng algorithm ngay lập tức** để tránh lỗi thêm

### Position Reset
Sau khi đóng vị thế (Take Profit hoặc Stop Loss):
- Tất cả pending orders bị cancel
- State được reset
- Bot tự động bắt đầu chu kỳ mới

---

## Monitoring & Notifications

Bot gửi thông báo Telegram cho các sự kiện:

1. ✅ **Algorithm Started** - Khởi động thành công
2. 📊 **DCA Levels Initialized** - Các mức DCA đã được tính toán
3. 📌 **Order Placed** - Đặt lệnh mới
4. ✅ **Order Filled** - Lệnh được khớp
5. 🟢/🔴 **Order Filled Details** - Chi tiết lệnh khớp
6. ✅/❌ **Take Profit/Stop Loss** - Đóng vị thế với PnL
7. ♻️ **Cycle Restart** - Bắt đầu chu kỳ mới
8. ❌ **Insufficient Funds** - Cảnh báo không đủ vốn

---

## Performance Metrics

Bot track các metrics:
- **Completed Cycles**: Số chu kỳ hoàn thành
- **DCA Orders Used**: Số lệnh DCA đã sử dụng trong mỗi cycle
- **Average Entry Price**: Giá trung bình vào lệnh
- **PnL**: Lời/lỗ của mỗi cycle (USDT và %)
- **Portfolio Value**: Giá trị portfolio hiện tại

---

## UI Requirements Suggestions

### Configuration Panel
- [ ] Dropdown cho Symbol (popular symbols)
- [ ] Radio buttons cho Direction (Long/Short)
- [ ] Number input với validation cho quantities
- [ ] Slider cho Price Deviation (0.01% - 5%)
- [ ] Slider cho Take Profit (0.1% - 10%)
- [ ] Slider cho Stop Loss (0.1% - 20%)
- [ ] Slider cho Leverage (1x - 20x) với warning
- [ ] Number input cho Max DCA Orders (0-20)

### Dashboard Display
- [ ] Current Position status
- [ ] Active DCA levels visualization (table/chart)
- [ ] Real-time PnL
- [ ] Completed cycles counter
- [ ] Portfolio value chart
- [ ] Recent trades history
- [ ] Telegram notification log

### Visual Calculator
- [ ] Real-time calculation của DCA levels based on inputs
- [ ] Total capital required estimate
- [ ] Risk/Reward visualization
- [ ] Max drawdown estimation

---

## Testing Scenarios

### Scenario 1: Successful Long Cycle
1. Price = $50,000
2. Base order filled at $50,000
3. Price drops to $49,500 → DCA 1 filled
4. Price drops to $49,000 → DCA 2 filled
5. Price recovers to $50,100 → Take Profit triggered
6. Bot resets and starts new cycle

### Scenario 2: Stop Loss Triggered
1. All DCA orders placed
2. Price continues moving against position
3. Stop Loss price reached
4. Position closed automatically
5. Bot resets and starts new cycle

### Scenario 3: Insufficient Funds
1. Bot tries to place DCA order
2. Not enough margin
3. Order rejected with error
4. Bot sends alert and stops

---

## API Contract (for UI Integration)

### Configuration Object
```json
{
  "symbol": "BTCUSDT",
  "direction": "Long",
  "baseOrderQuantity": 0.01,
  "dcaOrderQuantity": 0.01,
  "maxDcaOrders": 10,
  "priceDeviation": 0.1,
  "takeProfit": 0.2,
  "stopLoss": 0.3,
  "leverage": 5,
  "brokerage": "OKXFutures",
  "telegramChatId": "@testbsx",
  "telegramBotToken": "xxx"
}
```

### Status Response
```json
{
  "isActive": true,
  "currentPrice": 50000.00,
  "position": {
    "quantity": 0.04,
    "averagePrice": 48755.00,
    "unrealizedPnL": 49.80,
    "unrealizedPnLPercent": 0.10
  },
  "dcaLevels": [
    {
      "level": 0,
      "price": 50000.00,
      "quantity": 0.01,
      "isBaseOrder": true,
      "status": "Filled"
    },
    {
      "level": 1,
      "price": 49500.00,
      "quantity": 0.01,
      "isBaseOrder": false,
      "status": "Filled"
    }
  ],
  "completedCycles": 5,
  "portfolioValue": 10249.80
}
```

---

## FAQ

**Q: Điều gì xảy ra nếu giá không bao giờ chạm đến DCA levels?**
A: Chỉ có Base Order được fill, bot sẽ chờ Take Profit. Không có Stop Loss cho đến khi tất cả DCA orders được đặt.

**Q: Bot có thể chạy nhiều symbol cùng lúc không?**
A: Hiện tại không. Mỗi instance bot chỉ trade 1 symbol. Cần chạy nhiều instances cho nhiều symbols.

**Q: Làm sao biết bot đã hết vốn?**
A: Bot tự động phát hiện "insufficient funds" error và dừng lại, gửi alert qua Telegram.

**Q: DCA orders được đặt ngay từ đầu hay đặt dần?**
A: Đặt dần (sequential). Chỉ khi Level N filled thì Level N+1 mới được đặt.

**Q: Base Order có phải là Market Order không?**
A: Không, Base Order cũng là Limit Order ở giá hiện tại để đảm bảo giá tốt.

---

## Version History

**v1 (Current)**
- Initial release
- Support Long/Short
- Sequential DCA order placement
- Take Profit & Stop Loss
- Telegram notifications
- Insufficient funds detection
- Auto cycle restart

---

## Contact & Support

For technical questions or issues, contact the development team.

Last Updated: 2025-10-12

