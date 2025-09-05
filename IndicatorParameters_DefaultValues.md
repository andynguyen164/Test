# Indicator Parameters with Default Values

## Overview
This document provides a comprehensive list of all indicator parameters that have default values defined in the BeeAlgo trading system. These default values are automatically applied when parameters are not explicitly specified by users.

## Base Class (IndicatorParameters)
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| TargetType | ComparisonTargetType.ActualValue | Specifies which aspect of the indicator to use as numerical output |

## Technical Indicators with Default Values

### 1. Relative Strength Index (RSI)
**Class:** `RelativeStrengthIndexParameters`
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| MovingAverageType | MovingAverageType.Wilders | Type of moving average calculation method |

### 2. Moving Average Convergence Divergence (MACD)
**Class:** `MovingAverageConvergenceDivergenceParameters`
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| Type | MovingAverageType.Exponential | Moving average type for MACD calculation |

### 3. Bollinger Bands
**Class:** `BollingerBandsParameters`
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| MovingAverageType | MovingAverageType.Simple | Moving average type for center line calculation |

### 4. Parabolic Stop and Reverse (PSAR)
**Class:** `ParabolicStopAndReverseParameters`
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| AfStart | 0.02m | Initial acceleration factor |
| AfIncrement | 0.02m | Acceleration factor increment step |
| AfMax | 0.2m | Maximum acceleration factor |

### 5. Stochastic Relative Strength Index (StochRSI)
**Class:** `StochasticRelativeStrengthIndexParameters`
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| MovingAverageType | MovingAverageType.Simple | Moving average type for smoothing |

### 6. SuperTrend
**Class:** `SuperTrendParameters`
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| MovingAverageType | MovingAverageType.Wilders | Moving average type for ATR calculation |

### 7. True Strength Index (TSI)
**Class:** `TrueStrengthIndexParameters`
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| LongTermPeriod | 25 | Long-term smoothing period |
| ShortTermPeriod | 13 | Short-term smoothing period |
| SignalPeriod | 7 | Signal line period |

### 8. Schaff Trend Cycle (STC)
**Class:** `SchaffTrendCycleParameters`
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| MovingAverageType | MovingAverageType.Exponential | Moving average type for MACD calculation |

### 9. Acceleration Bands
**Class:** `AccelerationBandsParameters`
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| Width | 4 | Band width multiplier |
| MovingAverageType | MovingAverageType.Simple | Moving average type for center line |

### 10. Alpha (Risk-Adjusted Performance)
**Class:** `AlphaParameters`
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| AlphaPeriod | 1 | Period for alpha calculation |
| BetaPeriod | 252 | Period for beta calculation (typically 1 year) |

### 11. Arnaud Legoux Moving Average (ALMA)
**Class:** `ArnaudLegouxMovingAverageParameters`
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| Sigma | 6 | Smoothing parameter |
| Offset | 0.85m | Phase offset (0-1, where 0=past, 1=future) |

### 12. Chande Kroll Stop
**Class:** `ChandeKrollStopParameters`
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| MovingAverageType | MovingAverageType.Wilders | Moving average type for ATR calculation |

### 13. Coppock Curve
**Class:** `CoppockCurveParameters`
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| ShortRocPeriod | 11 | Short-term rate of change period |
| LongRocPeriod | 14 | Long-term rate of change period |
| LwmaPeriod | 10 | Linear weighted moving average period |

### 14. Ease of Movement Value (EMV)
**Class:** `EaseOfMovementValueParameters`
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| Period | 1 | Calculation period |
| Scale | 10000 | Scaling factor for readability |

### 15. Keltner Channels
**Class:** `KeltnerChannelsParameters`
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| MovingAverageType | MovingAverageType.Simple | Moving average type for center line |

### 16. Mass Index
**Class:** `MassIndexParameters`
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| EmaPeriod | 9 | Exponential moving average period |
| SumPeriod | 25 | Summation period for mass index |

### 17. McClellan Oscillator
**Class:** `McClellanOscillatorParameters`
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| FastPeriod | 19 | Fast exponential moving average period |
| SlowPeriod | 39 | Slow exponential moving average period |

### 18. Pivot Points High Low
**Class:** `PivotPointsHighLowParameters`
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| LastStoredValues | 100 | Number of recent pivot points to store |

### 19. Relative Daily Volume (RDV)
**Class:** `RelativeDailyVolumeParameters`
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| Period | 2 | Comparison period |
| Resolution | Resolution.Daily | Time resolution for calculation |

## Statistical Summary

### Default Value Distribution
- **Moving Average Types**: 8 indicators use MovingAverageType defaults
- **Numeric Values**: 11 indicators have numeric default values
- **Enum Values**: 9 indicators have enum-based defaults

### Most Common Default Values
1. **MovingAverageType.Simple**: 4 indicators
2. **MovingAverageType.Wilders**: 3 indicators  
3. **MovingAverageType.Exponential**: 2 indicators

### Indicators with Multiple Defaults
1. **ParabolicStopAndReverse**: 3 default values
2. **TrueStrengthIndex**: 3 default values
3. **CoppockCurve**: 3 default values
4. **Alpha**: 2 default values
5. **ArnaudLegouxMovingAverage**: 2 default values

## Implementation Notes

### Design Patterns
- All indicators inherit from `IndicatorParameters` base class
- Default values are set using C# property initializers (`= value`)
- JSON serialization respects default values through attributes
- `DefaultValueHandling.Populate` ensures defaults are included in JSON

### Usage Guidelines
- Default values provide sensible starting points for indicator configuration
- Users can override any default value by explicitly setting the parameter
- Some defaults are based on common industry standards (e.g., McClellan periods)
- Mathematical indicators often use proven academic defaults

### Maintenance
- Default values should be reviewed periodically for market relevance
- New indicators should include appropriate default values where applicable
- Documentation should be updated when defaults change

## Technical Reference
- **Total Indicators Analyzed**: 68 files
- **Indicators with Defaults**: 19 + 1 base class
- **File Location**: `V2/IndicatorParams/`
- **Generated**: From source code analysis of parameter classes
