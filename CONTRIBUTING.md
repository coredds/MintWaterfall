# Contributing to MintWaterfall

Contributions welcome! This document provides guidelines for contributing to the project.

## Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/coredds/MintWaterfall.git
   cd MintWaterfall
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm start
   ```

4. **Run type-checking and linting**
   ```bash
   npm run build:ts
   npm run lint
   ```

## Project Structure

```
MintWaterfall/
├── src/
│   ├── index.ts              # Entry point — re-exports all public API
│   ├── chart/
│   │   ├── config.ts         # Types, interfaces, defaults, utilities
│   │   ├── chart.ts          # Chart factory (getter/setters, rendering)
│   │   ├── render.ts         # Grid, axes, bars, connectors, trend lines
│   │   └── lifecycle.ts      # Data preparation, cumulative totals
│   ├── data/
│   │   ├── validation.ts     # Types, validateData(), getDataSummary()
│   │   ├── transforms.ts     # Aggregation, sorting, filtering, normalization
│   │   ├── advanced.ts       # D3 group/rollup/cross/index operations
│   │   └── pipeline.ts       # createDataProcessor(), standalone helpers
│   ├── statistics.ts         # Statistical analysis system
│   ├── accessibility.ts      # WCAG 2.1 compliance (ARIA, keyboard nav)
│   ├── themes.ts             # Theme system, color scales
│   ├── animations.ts         # Animation/transition system
│   ├── brush.ts              # Brush selection
│   ├── scales.ts             # Scale system (band, linear, ordinal, time)
│   ├── performance.ts        # Performance optimization + spatial indexing
│   ├── interactions.ts       # Drag, hover, force simulation
│   ├── layouts.ts            # Hierarchical + basic layouts
│   ├── export.ts             # SVG, PNG, JSON, CSV export
│   ├── tooltip.ts            # Tooltip system
│   ├── zoom.ts               # Zoom/pan
│   └── shapes.ts             # Shape generators
├── tests/                    # Test suites (Jest + jsdom)
├── docs/superpowers/         # Design specs and implementation plans
├── AGENTS.md                 # AI tooling conventions
├── README.md                 # Project overview
├── CONTRIBUTING.md           # This file
└── package.json              # Dependencies and scripts
```

## Development Guidelines

### Code Style

- **TypeScript** with strict mode — all new code must be `.ts`
- Use `.js` extension for relative TypeScript imports (ESM convention)
- Follow D3.js conventions and patterns
- Use method chaining for API design
- Double quotes, semicolons required
- File naming: `kebab-case.ts` for modules

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` for new features
- `fix:` for bug fixes
- `refactor:` for code refactoring
- `chore:` for build, deps, config
- `test:` for test-related changes
- `docs:` for documentation changes

Examples:

```
feat: add tooltip support for bar interactions
fix: resolve animation timing issues
docs: update API documentation with examples
```

### Pull Request Process

1. **Create feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit**

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

3. **Push branch and create PR**

   ```bash
   git push origin feature/your-feature-name
   ```

4. **Ensure CI passes**
   - TypeScript type-check passes (`npm run build:ts`)
   - Linting checks pass (`npm run lint`)
   - Tests pass (`npm test`)
   - Documentation is updated

## Feature Development

### Adding New Features

1. **Plan the feature**
   - Check existing issues and roadmap
   - Discuss approach in issue comments
   - Consider backward compatibility

2. **Implement the feature**
   - Add to main chart component
   - Update API documentation
   - Add example usage
   - Include error handling

3. **Test thoroughly**
   - Test with various data sets
   - Verify animations work smoothly
   - Check edge cases and error conditions
   - Test browser compatibility

### API Design Principles

- **Consistency**: Follow D3.js conventions
- **Chainability**: All setters return chart instance
- **Flexibility**: Support both simple and advanced use cases
- **Validation**: Validate inputs and provide helpful errors
- **Performance**: Optimize for smooth animations and updates

## Bug Reports

When reporting bugs, please include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser and D3.js version
- Code example demonstrating the issue

## Feature Requests

For feature requests, please:

- Check if feature already exists or is planned
- Describe the use case and benefit
- Provide examples of how it would be used
- Consider implementation complexity

## Testing

### Manual Testing Checklist

- [ ] Chart renders correctly with sample data
- [ ] Animations are smooth and complete
- [ ] Stacked/waterfall mode toggle works
- [ ] Data updates animate properly
- [ ] Error handling works for invalid data
- [ ] Events fire correctly (barClick, barMouseover, etc.)
- [ ] Console shows no errors

### Browser Testing

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Documentation

- Keep README.md up to date with current API
- Include TypeScript examples for new features
- Document all parameters and return values
- AGENTS.md covers development conventions for AI tooling

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v<version> && git push origin v<version>`
4. Tag triggers `publish.yml` — builds, tests, publishes to npm, creates GitHub Release
5. Update live demo if needed

## Community

- Be respectful and constructive
- Help others with issues and questions
- Share examples and use cases
- Contribute to documentation improvements

## Getting Help

- Check existing issues and documentation
- Ask questions in issue comments
- Reference D3.js documentation for general D3 questions
- See AGENTS.md for development conventions and commands

Thank you for contributing to MintWaterfall!
