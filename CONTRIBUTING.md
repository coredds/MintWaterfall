# Contributing to MintWaterfall

We welcome contributions to MintWaterfall! This document provides guidelines for contributing to the project.

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
   npm run dev
   ```

4. **Run linting**
   ```bash
   npm run lint
   ```

## Project Structure

```
MintWaterfall/
├── mintwaterfall-chart.js      # Main chart component
├── mintwaterfall-tooltip.js    # Tooltip functionality
├── mintwaterfall-themes.js     # Theme system
├── mintwaterfall-example.html  # Live examples
├── API.md                      # API documentation
├── README.md                   # Project overview
├── package.json               # Dependencies and scripts
└── .github/
    └── workflows/
        └── basic-checks.yml   # CI/CD pipeline
```

## Development Guidelines

### Code Style

- Use ES6+ features and modules
- Follow D3.js conventions and patterns
- Use method chaining for API design
- Include JSDoc comments for public methods
- Maintain consistent indentation (2 spaces)

### Commit Messages

Use conventional commit format:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for code style changes
- `refactor:` for code refactoring
- `test:` for test-related changes

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
   - Linting checks pass
   - No console errors in examples
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
- [ ] Events fire correctly
- [ ] Responsive behavior works
- [ ] Console shows no errors

### Browser Testing

Test in:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Documentation

### API Documentation

- Keep API.md up to date with all public methods
- Include examples for complex features
- Document all parameters and return values
- Explain common use cases

### Code Documentation

- Use JSDoc comments for public methods
- Explain complex algorithms or calculations
- Document any D3.js-specific patterns used
- Include usage examples in comments

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create GitHub release
4. Update live demo
5. Announce in README

## Community

- Be respectful and constructive
- Help others with issues and questions
- Share examples and use cases
- Contribute to documentation improvements

## Getting Help

- Check existing issues and documentation
- Ask questions in issue comments
- Reference D3.js documentation for general D3 questions
- Look at the example file for usage patterns

Thank you for contributing to MintWaterfall!
