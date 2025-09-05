# Danh sách Indicator Parameters - BeeAlgo V2

## Tổng quan
Danh sách chi tiết tất cả các Technical Indicators và các parameter tương ứng trong hệ thống BeeAlgo V2.

**Tất cả indicators đều có các parameter chung từ base class `IndicatorParameters`:**
- `Symbol` (string): Mã chứng khoán
- `Name` (IndicatorType): Tên indicator
- `Period` (int): Chu kỳ tính toán
- `Resolution` (Resolution): Độ phân giải thời gian
- `TargetType` (ComparisonTargetType): Loại target output
- `OutputSelector` (string): Chọn output cụ thể

---

## 🔍 DANH SÁCH CHI TIẾT CÁC INDICATORS

### 1. **AbsolutePriceOscillator**
**Parameters riêng:**
- `FastPeriod` (int): Chu kỳ nhanh
- `SlowPeriod` (int): Chu kỳ chậm
- `MovingAverageType` (MovingAverageType): Loại MA

### 2. **AccelerationBands**
**Parameters riêng:**
- `Width` (decimal): Độ rộng bands (default: 4)
- `MovingAverageType` (MovingAverageType): Loại MA (default: Simple)

### 3. **AccumulationDistributionOscillator**
**Parameters riêng:**
- `FastPeriod` (int): Chu kỳ nhanh
- `SlowPeriod` (int): Chu kỳ chậm

### 4. **Alpha** (Greek)
**Parameters riêng:**
- `Target` (string): Tài sản target
- `Reference` (string): Tài sản reference
- `AlphaPeriod` (int): Chu kỳ alpha (default: 1)
- `BetaPeriod` (int): Chu kỳ beta (default: 252)
- `RiskFreeRate` (decimal?): Lãi suất phi rủi ro

### 5. **ArmsIndex** (TRIN)
**Parameters riêng:** Không có (chỉ dùng base parameters)

### 6. **AroonOscillator**
**Parameters riêng:**
- `UpPeriod` (int): Chu kỳ Aroon Up
- `DownPeriod` (int): Chu kỳ Aroon Down

### 7. **ArnaudLegouxMovingAverage**
**Parameters riêng:**
- `Sigma` (int): Hệ số sigma (default: 6)
- `Offset` (decimal): Độ lệch (default: 0.85)

### 8. **AugenPriceSpike**
**Parameters riêng:**
- `Period` (int): Chu kỳ (default: 3)

### 9. **AutoRegressiveIntegratedMovingAverage** (ARIMA)
**Parameters riêng:**
- `ArOrder` (int): Order của AR
- `DiffOrder` (int): Order của differencing
- `MaOrder` (int): Order của MA

### 10. **AverageTrueRange** (ATR)
**Parameters riêng:**
- `Type` (MovingAverageType): Loại MA (default: Simple)

### 11. **AwesomeOscillator**
**Parameters riêng:**
- `FastPeriod` (int): Chu kỳ nhanh
- `SlowPeriod` (int): Chu kỳ chậm
- `Type` (MovingAverageType): Loại MA

### 12. **Beta** (Greek)
**Parameters riêng:**
- `Target` (string): Tài sản target
- `Reference` (string): Tài sản reference

### 13. **BollingerBands**
**Parameters riêng:**
- `K` (decimal): Hệ số độ lệch chuẩn
- `MovingAverageType` (MovingAverageType): Loại MA (default: Simple)

### 14. **ChandeKrollStop**
**Parameters riêng:**
- `AtrPeriod` (int): Chu kỳ ATR
- `AtrMult` (decimal): Multiplier ATR
- `MovingAverageType` (MovingAverageType): Loại MA (default: Wilders)

### 15. **CommodityChannelIndex** (CCI)
**Parameters riêng:**
- `MovingAverageType` (MovingAverageType): Loại MA (default: Simple)

### 16. **CoppockCurve**
**Parameters riêng:**
- `ShortRocPeriod` (int): Chu kỳ ROC ngắn (default: 11)
- `LongRocPeriod` (int): Chu kỳ ROC dài (default: 14)
- `LwmaPeriod` (int): Chu kỳ LWMA (default: 10)

### 17. **Correlation**
**Parameters riêng:**
- `Target` (string): Tài sản target
- `Reference` (string): Tài sản reference
- `CorrelationType` (CorrelationType): Loại correlation (default: Pearson)

### 18. **DeltaD** (Greek)
**Parameters riêng:**
- `MirrorOption` (string): Mirror option
- `RiskFreeRate` (decimal?): Lãi suất phi rủi ro
- `DividendYield` (decimal?): Tỷ suất cổ tức
- `OptionModel` (OptionPricingModelType): Model định giá (default: BlackScholes)

### 19. **DeltaΔ** (Greek)
**Parameters riêng:**
- `MirrorOption` (string): Mirror option
- `RiskFreeRate` (decimal?): Lãi suất phi rủi ro
- `DividendYield` (decimal?): Tỷ suất cổ tức
- `OptionModel` (OptionPricingModelType): Model định giá (default: BlackScholes)

### 20. **DeMarkerIndicator**
**Parameters riêng:**
- `Type` (MovingAverageType): Loại MA

### 21. **DerivativeOscillator**
**Parameters riêng:**
- `RsiPeriod` (int): Chu kỳ RSI
- `SmoothingRsiPeriod` (int): Chu kỳ smoothing RSI
- `DoubleSmoothingRsiPeriod` (int): Chu kỳ double smoothing RSI
- `SignalLinePeriod` (int): Chu kỳ signal line

### 22. **DonchianChannel**
**Parameters riêng:**
- `UpperPeriod` (int): Chu kỳ upper band
- `LowerPeriod` (int): Chu kỳ lower band

### 23. **EaseOfMovementValue**
**Parameters riêng:**
- `Period` (int): Chu kỳ (default: 1)
- `Scale` (int): Hệ số scale (default: 10000)

### 24. **ExponentialMovingAverage** (EMA)
**Parameters riêng:**
- `SmoothingFactor` (decimal): Hệ số smoothing

### 25. **FilteredIdentity**
**Parameters riêng:**
- `FieldName` (string): Tên field cần filter

### 26. **ForceIndex**
**Parameters riêng:**
- `Type` (MovingAverageType): Loại MA (default: Exponential)

### 27. **FractalAdaptiveMovingAverage**
**Parameters riêng:**
- `LongPeriod` (int): Chu kỳ dài (default: 198)

### 28. **Gamma** (Greek)
**Parameters riêng:**
- `MirrorOption` (string): Mirror option
- `RiskFreeRate` (decimal?): Lãi suất phi rủi ro
- `DividendYield` (decimal?): Tỷ suất cổ tức
- `OptionModel` (OptionPricingModelType): Model định giá (default: BlackScholes)

### 29. **HilbertTransform**
**Parameters riêng:**
- `Length` (int): Độ dài
- `InPhaseMultiplicationFactor` (decimal): Hệ số nhân in-phase
- `QuadratureMultiplicationFactor` (decimal): Hệ số nhân quadrature

### 30. **IchimokuKinkoHyo**
**Parameters riêng:**
- `TenkanPeriod` (int): Chu kỳ Tenkan
- `KijunPeriod` (int): Chu kỳ Kijun
- `SenkouAPeriod` (int): Chu kỳ Senkou A
- `SenkouBPeriod` (int): Chu kỳ Senkou B
- `SenkouADelayPeriod` (int): Delay Senkou A
- `SenkouBDelayPeriod` (int): Delay Senkou B

### 31. **Identity**
**Parameters riêng:**
- `FieldName` (string): Tên field

### 32. **ImpliedVolatility**
**Parameters riêng:**
- `MirrorOption` (string): Mirror option
- `RiskFreeRate` (decimal?): Lãi suất phi rủi ro
- `DividendYield` (decimal?): Tỷ suất cổ tức

### 33. **KaufmanAdaptiveMovingAverage**
**Parameters riêng:**
- `FastEmaPeriod` (int): Chu kỳ EMA nhanh
- `SlowEmaPeriod` (int): Chu kỳ EMA chậm

### 34. **KaufmanEfficiencyRatio**
**Parameters riêng:**
- `Period` (int): Chu kỳ (default: 2)

### 35. **KeltnerChannels**
**Parameters riêng:**
- `K` (decimal): Hệ số K
- `MovingAverageType` (MovingAverageType): Loại MA (default: Simple)

### 36. **MassIndex**
**Parameters riêng:**
- `EmaPeriod` (int): Chu kỳ EMA (default: 9)
- `SumPeriod` (int): Chu kỳ tổng (default: 25)

### 37. **McClellanOscillator**
**Parameters riêng:**
- `FastPeriod` (int): Chu kỳ nhanh (default: 19)
- `SlowPeriod` (int): Chu kỳ chậm (default: 39)

### 38. **McClellanSummationIndex**
**Parameters riêng:**
- `FastPeriod` (int): Chu kỳ nhanh (default: 19)
- `SlowPeriod` (int): Chu kỳ chậm (default: 39)

### 39. **MomersionIndicator**
**Parameters riêng:**
- `MinPeriod` (int): Chu kỳ tối thiểu
- `FullPeriod` (int): Chu kỳ đầy đủ

### 40. **MovingAverageConvergenceDivergence** (MACD)
**Parameters riêng:**
- `FastPeriod` (int): Chu kỳ nhanh
- `SlowPeriod` (int): Chu kỳ chậm
- `SignalPeriod` (int): Chu kỳ signal
- `Type` (MovingAverageType): Loại MA (default: Exponential)

### 41. **ParabolicStopAndReverse** (PSAR)
**Parameters riêng:**
- `AfStart` (decimal): AF start (default: 0.02)
- `AfIncrement` (decimal): AF increment (default: 0.02)
- `AfMax` (decimal): AF max (default: 0.2)

### 42. **PercentagePriceOscillator** (PPO)
**Parameters riêng:**
- `FastPeriod` (int): Chu kỳ nhanh
- `SlowPeriod` (int): Chu kỳ chậm
- `MovingAverageType` (MovingAverageType): Loại MA

### 43. **PivotPointsHighLow**
**Parameters riêng:**
- `LengthHigh` (int): Độ dài high
- `LengthLow` (int): Độ dài low
- `LastStoredValues` (int): Số giá trị lưu trữ (default: 100)

### 44. **RegressionChannel**
**Parameters riêng:**
- `K` (decimal): Hệ số K

### 45. **RelativeDailyVolume**
**Parameters riêng:**
- `Period` (int): Chu kỳ (default: 2)
- `Resolution` (Resolution): Độ phân giải (default: Daily)

### 46. **RelativeStrengthIndex** (RSI)
**Parameters riêng:**
- `MovingAverageType` (MovingAverageType): Loại MA (default: Wilders)

### 47. **RelativeVigorIndex**
**Parameters riêng:**
- `MovingAverageType` (MovingAverageType): Loại MA (default: Simple)

### 48. **Rho** (Greek)
**Parameters riêng:**
- `MirrorOption` (string): Mirror option
- `RiskFreeRate` (decimal?): Lãi suất phi rủi ro
- `DividendYield` (decimal?): Tỷ suất cổ tức
- `OptionModel` (OptionPricingModelType): Model định giá (default: BlackScholes)

### 49. **SchaffTrendCycle**
**Parameters riêng:**
- `CyclePeriod` (int): Chu kỳ cycle
- `FastPeriod` (int): Chu kỳ nhanh
- `SlowPeriod` (int): Chu kỳ chậm
- `MovingAverageType` (MovingAverageType): Loại MA (default: Exponential)

### 50. **SharpeRatio**
**Parameters riêng:**
- `SharpePeriod` (int): Chu kỳ Sharpe
- `RiskFreeRate` (decimal?): Lãi suất phi rủi ro

### 51. **SmoothedOnBalanceVolume**
**Parameters riêng:**
- `Type` (MovingAverageType): Loại MA (default: Simple)

### 52. **SortinoRatio**
**Parameters riêng:**
- `SortinoPeriod` (int): Chu kỳ Sortino
- `MinimumAcceptableReturn` (double): Lợi nhuận tối thiểu chấp nhận

### 53. **Stochastic**
**Parameters riêng:**
- `KPeriod` (int): Chu kỳ K
- `DPeriod` (int): Chu kỳ D

### 54. **StochasticRelativeStrengthIndex** (Stoch RSI)
**Parameters riêng:**
- `RsiPeriod` (int): Chu kỳ RSI
- `StochPeriod` (int): Chu kỳ Stochastic
- `KSmoothingPeriod` (int): Chu kỳ smoothing K
- `DSmoothingPeriod` (int): Chu kỳ smoothing D
- `MovingAverageType` (MovingAverageType): Loại MA (default: Simple)

### 55. **SuperTrend**
**Parameters riêng:**
- `Multiplier` (decimal): Hệ số nhân
- `MovingAverageType` (MovingAverageType): Loại MA (default: Wilders)

### 56. **SwissArmyKnife**
**Parameters riêng:**
- `Delta` (double): Delta
- `Tool` (SwissArmyKnifeTool): Công cụ

### 57. **T3MovingAverage**
**Parameters riêng:**
- `VolumeFactor` (decimal): Hệ số volume (default: 0.7)

### 58. **TargetDownsideDeviation**
**Parameters riêng:**
- `MinimumAcceptableReturn` (double): Lợi nhuận tối thiểu chấp nhận

### 59. **ThetaT** (Greek)
**Parameters riêng:**
- `MirrorOption` (string): Mirror option
- `RiskFreeRate` (decimal?): Lãi suất phi rủi ro
- `DividendYield` (decimal?): Tỷ suất cổ tức
- `OptionModel` (OptionPricingModelType): Model định giá (default: BlackScholes)

### 60. **ThetaΘ** (Greek)
**Parameters riêng:**
- `MirrorOption` (string): Mirror option
- `RiskFreeRate` (decimal?): Lãi suất phi rủi ro
- `DividendYield` (decimal?): Tỷ suất cổ tức
- `OptionModel` (OptionPricingModelType): Model định giá (default: BlackScholes)

### 61. **TimeProfile**
**Parameters riêng:**
- `Period` (int): Chu kỳ (default: 2)
- `ValueAreaVolumePercentage` (decimal): % volume value area (default: 0.70)
- `PriceRangeRoundOff` (decimal): Làm tròn price range (default: 0.05)
- `Resolution` (Resolution): Độ phân giải (default: Daily)

### 62. **TrueStrengthIndex** (TSI)
**Parameters riêng:**
- `LongTermPeriod` (int): Chu kỳ dài hạn (default: 25)
- `ShortTermPeriod` (int): Chu kỳ ngắn hạn (default: 13)
- `SignalPeriod` (int): Chu kỳ signal (default: 7)

### 63. **UltimateOscillator**
**Parameters riêng:**
- `Period1` (int): Chu kỳ 1
- `Period2` (int): Chu kỳ 2
- `Period3` (int): Chu kỳ 3

### 64. **ValueAtRisk** (VaR)
**Parameters riêng:**
- `ConfidenceLevel` (double): Mức độ tin cậy

### 65. **VolumeProfile**
**Parameters riêng:**
- `Period` (int): Chu kỳ (default: 2)
- `ValueAreaVolumePercentage` (decimal): % volume value area (default: 0.70)
- `PriceRangeRoundOff` (decimal): Làm tròn price range (default: 0.05)
- `Resolution` (Resolution): Độ phân giải (default: Daily)

### 66. **WilderAccumulativeSwingIndex**
**Parameters riêng:**
- `LimitMove` (decimal): Giới hạn chuyển động

### 67. **WilderSwingIndex**
**Parameters riêng:**
- `LimitMove` (decimal): Giới hạn chuyển động

---

## 📊 THỐNG KÊ TỔNG HỢP

### Phân loại theo số lượng parameters:
- **Không có parameters riêng**: 1 indicator (ArmsIndex)
- **1 parameter riêng**: 13 indicators
- **2 parameters riêng**: 17 indicators  
- **3 parameters riêng**: 15 indicators
- **4+ parameters riêng**: 21 indicators

### Loại parameters phổ biến:
- **MovingAverageType**: 15 indicators sử dụng
- **FastPeriod/SlowPeriod**: 8 indicators sử dụng
- **RiskFreeRate**: 8 indicators (Options Greeks)
- **DividendYield**: 8 indicators (Options Greeks)
- **MirrorOption**: 8 indicators (Options Greeks)

### Indicators có default values:
- Hầu hết các indicators đều có default values cho parameters riêng
- Các Options Greeks thường có default OptionModel = BlackScholes
- Volume-related indicators thường có default Resolution = Daily

---

## 🔧 GHI CHÚ KỸ THUẬT

1. **Tất cả indicators** đều kế thừa từ `IndicatorParameters`
2. **JSON Serialization** được hỗ trợ thông qua Newtonsoft.Json
3. **Unique Key Generation** cho mỗi indicator configuration
4. **Default Values** được thiết lập hợp lý cho từng indicator
5. **Type Safety** thông qua enum types và strongly-typed parameters
