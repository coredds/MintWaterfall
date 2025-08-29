# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2025-08-28

### Added
- **📈 Trend Line Overlays**: Complete trend analysis system with linear, moving average, and polynomial options
- **🔄 Enhanced Data Loading**: CSV, JSON, TSV format support with HTTP URL loading and automatic format detection
- **🖼️ High-DPI PNG Export**: 2x scaling support with enhanced image quality and comprehensive error handling
- **♿ Modern Accessibility**: Forced Colors Mode support with CSS system colors, deprecated `-ms-high-contrast` removed
- **🧪 Comprehensive Testing**: 27 new test cases covering trend lines, data loading, and export functionality (206 total tests)
- **🎨 Interactive Demo Integration**: Trend line demonstration integrated into main demo with live controls and styling options
- **⚙️ Real-time Configuration**: Dynamic trend line styling with color, width, style, and algorithm parameter controls
- **📚 Educational Information**: Contextual explanations for each trend type with technical details

### Fixed
- **ESLint Compliance**: All linting issues resolved with modern code standards
- **Deprecated API**: Removed legacy accessibility detection methods in favor of W3C Forced Colors Mode standard
- **Code Quality**: Unused variables properly handled with appropriate ESLint disable comments for future-use functions

### Changed
- **Accessibility System**: Enhanced with automatic CSS injection for forced colors mode support
- **Export System**: Improved PNG generation with high-DPI support and better error handling
- **Demo Experience**: Consolidated trend line features into main demonstration page for unified user experience

## [0.5.6] - 2025-08-22

### Added
- **Enhanced D3.js v7 compatibility**: Full scale system support for band, linear, ordinal, and time scales
- **Advanced interactive features**: Brush system for data filtering and selection
- **Staggered animations**: Enhanced visual feedback with progressive reveal animations
- **Scale switching capabilities**: Dynamic switching between different scale types
- **Utility functions**: `getBarWidth()` and `getBarPosition()` for cross-scale compatibility

### Fixed
- **Brush system errors**: Resolved `scale.invert is not a function` for band scales
- **Scale bandwidth errors**: Fixed `xScale.bandwidth is not a function` when switching scale types
- **D3 v7 API compatibility**: Removed deprecated `cornerRadius()` and `handleSize()` brush methods
- **Animation toggling**: Enhanced staggered animation toggle for immediate visual feedback

### Changed
- **Test coverage**: Increased from 121 to 168 comprehensive test cases
- **Code organization**: Improved scale handling with dedicated utility functions
- **Performance**: Optimized rendering for different scale types
- **Documentation**: Updated API documentation with new advanced features

### Technical Details
- All 168 tests passing with 51% code coverage
- Zero lint issues maintained
- Production-ready status achieved
- Enhanced error handling and debugging capabilities

## [0.5.5] - 2025-08-XX

### Added
- **Comprehensive testing**: 121 test cases with 57% code coverage
- **Enhanced functionality**: Fixed normalize/bounce buttons, improved UI/UX
- **Visual improvements**: 1100px wide charts, centered layouts, visual feedback system
- **Complete CI/CD pipeline**: Automated testing, security audits, deployment
- **Documentation**: Updated README, API docs, and examples

### Changed
- **Code quality**: Achieved zero lint issues, professional codebase standards
- **Performance**: Optimized bundle size and rendering efficiency

## [0.5.4] - 2025-08-XX

### Added
- Initial production release
- Basic waterfall and stacked chart functionality
- D3.js integration
- Animation system
- Theme support

### Technical
- Core chart rendering engine
- Data processing pipeline
- Event handling system
- Basic test suite setup

---

## Versioning Guidelines

- **Major version** (X.0.0): Breaking changes, major API overhauls
- **Minor version** (0.X.0): New features, enhancements, non-breaking changes
- **Patch version** (0.0.X): Bug fixes, documentation updates, maintenance

## Support

For questions about specific versions or upgrade paths, please:
- Check the [API documentation](API.md)
- View [examples](mintwaterfall-example.html)
- File an [issue](https://github.com/coredds/MintWaterfall/issues)
