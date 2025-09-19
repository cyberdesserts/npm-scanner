# Weather CLI - Dependency Scanner Test Project [Blog Article](https://cyberdesserts.com/npm-scanner)

A simple Node.js weather CLI application designed to test the custom dependency scanner built with the deps.dev API.

## Project Overview

This Weather CLI tool serves as a perfect test case for the dependency scanner because it includes:

- **Single file application** (`weather.js` - ~44 lines)
- **Mix of utility and HTTP packages** (4 direct dependencies)
- **Complex dependency tree** (31 total packages including transitive dependencies)
- **Real-world dependencies** that everyone understands
- **Simple, testable functionality**

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Test the Weather CLI
```bash
# Show help
node weather.js --help

# Test without API key (shows expected error)
node weather.js London

# Test with API key (create .env file first)
cp .env.example .env
# Edit .env and add your OpenWeatherMap API key
node weather.js London
```

### 3. Run Dependency Scanner
```bash
# Basic scan using npm script
npm run scan-deps

# Or run directly
node dependency-scanner.js

# Scan with custom package.json path
node dependency-scanner.js ./package.json
```

## Dependencies

### Direct Dependencies (4)
| Package | Version | Purpose | Release Date |
|---------|---------|---------|--------------|
| `axios` | ^1.12.2 | HTTP client for weather API calls | 2025-09-14 |
| `chalk` | ^4.1.2 | Terminal colors and formatting | 2021-07-30 |
| `commander` | ^14.0.1 | CLI argument parsing | 2025-09-12 |
| `dotenv` | ^17.2.2 | Environment variable loading | 2025-09-02 |

### Transitive Dependencies (27)
The scanner also analyzes all transitive dependencies including:
- **axios dependencies**: follow-redirects, form-data, proxy-from-env, etc.
- **chalk dependencies**: ansi-styles, color-convert, supports-color, etc.
- **Various utility packages**: hasown, function-bind, delayed-stream, etc.

**Total installed packages**: 31 (4 direct + 27 transitive)

## Dependency Scanner Testing

### Basic Usage

The dependency scanner can be tested with this project in several ways:

```bash
# From the weather-cli-test directory
npm run scan-deps
# or
node dependency-scanner.js
```

### Scanner Class Methods

The scanner provides several methods for different use cases:

#### 1. `getDependencies(packageJsonPath)`
Extracts all dependencies from package.json:
```javascript
import DependencyScanner from './dependency-scanner.js';

const scanner = new DependencyScanner();
const deps = scanner.getDependencies('./package.json');
console.log(deps);
// Output: { axios: '^1.12.2', chalk: '^4.1.2', ... }
```

#### 2. `getVersionInfo(packageName, version)`
Gets detailed version information including release date:
```javascript
const versionInfo = await scanner.getVersionInfo('axios', '^1.12.2');
console.log(versionInfo.publishedAt); // 2025-09-14T12:59:27Z
```

#### 3. `getVulnerabilities(packageName, version)`
Checks for security vulnerabilities:
```javascript
const vulns = await scanner.getVulnerabilities('axios', '^1.12.2');
console.log(vulns.length); // Number of vulnerabilities found
```

#### 4. `getAllVersions(packageName)`
Lists all available versions of a package:
```javascript
const versions = await scanner.getAllVersions('axios');
console.log(versions.map(v => v.versionKey));
```

#### 5. `scanDependencies(packageJsonPath, includeTransitive)`
Performs complete scan of dependencies:
```javascript
// Scan all dependencies including transitive (default)
const results = await scanner.scanDependencies('./package.json', true);

// Scan only direct dependencies
const directOnly = await scanner.scanDependencies('./package.json', false);
```

#### 6. `getAllInstalledPackages(packageLockPath)`
Extracts all packages from package-lock.json:
```javascript
const allPackages = scanner.getAllInstalledPackages('./package-lock.json');
console.log(Object.keys(allPackages).length); // 31 packages
```

#### 7. `getDependencyTypes(packageJsonPath)`
Classifies dependencies as direct or transitive:
```javascript
const types = scanner.getDependencyTypes('./package.json');
console.log(types['axios']); // 'direct'
console.log(types['ansi-styles']); // 'transitive'
```

#### 8. `generateReport(results)`
Outputs formatted console report:
```javascript
scanner.generateReport(results);
```

#### 9. `saveResults(results, filename)`
Saves detailed JSON report:
```javascript
scanner.saveResults(results, 'my-scan-results.json');
```

### Custom Scanning Examples

#### Scan Specific Package
```javascript
import DependencyScanner from './dependency-scanner.js';

const scanner = new DependencyScanner();

// Check just axios
const axiosVulns = await scanner.getVulnerabilities('axios', '1.12.2');
const axiosInfo = await scanner.getVersionInfo('axios', '1.12.2');

console.log(`Axios vulnerabilities: ${axiosVulns.length}`);
console.log(`Axios published: ${axiosInfo.publishedAt}`);
```

#### Custom Report Format
```javascript
const scanner = new DependencyScanner();
const results = await scanner.scanDependencies();

// Custom filtering
const oldPackages = results.filter(pkg => {
  const publishDate = new Date(pkg.publishedAt);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return publishDate < oneYearAgo;
});

console.log(`Packages older than 1 year: ${oldPackages.length}`);
```

## Expected Scanner Output

When running the scanner on this project, you should see:

```
Scanning 31 dependencies (including transitive)...
Scanning ansi-styles@4.3.0...
Scanning asynckit@0.4.0...
Scanning axios@1.12.2...
[... scanning all 31 packages ...]

=== DEPENDENCY SCAN REPORT ===

Total packages scanned: 31
  - Direct dependencies: 4
  - Transitive dependencies: 27
Packages with vulnerabilities: 0

✅ No vulnerabilities found!

📊 VULNERABILITY BREAKDOWN:
   Direct dependencies with vulnerabilities: 0/4
   Transitive dependencies with vulnerabilities: 0/27

📅 OLDEST DEPENDENCIES:
   🔗 delayed-stream@1.0.0 - 2015-04-30T22:10:29Z
   🔗 asynckit@0.4.0 - 2016-06-14T18:29:05Z
   🔗 color-name@1.1.4 - 2018-09-21T10:48:56Z
   🎯 chalk@4.1.2 - 2021-07-30T12:02:52Z
   🔗 combined-stream@1.0.8 - 2019-05-12T17:49:45Z

Results saved to dependency-scan.json
```

## Scanner Output Files

### dependency-scan.json
Contains detailed JSON results with enhanced summary:
```json
{
  "scanDate": "2025-09-19T...",
  "summary": {
    "totalPackages": 31,
    "directDependencies": 4,
    "transitiveDependencies": 27,
    "vulnerablePackages": 0,
    "vulnerableDirect": 0,
    "vulnerableTransitive": 0
  },
  "results": [
    {
      "package": "axios",
      "currentVersion": "1.12.2",
      "dependencyType": "direct",
      "publishedAt": "2025-09-14T12:59:27Z",
      "isDefault": true,
      "vulnerabilities": [],
      "vulnerabilityCount": 0
    },
    {
      "package": "ansi-styles",
      "currentVersion": "4.3.0",
      "dependencyType": "transitive",
      "publishedAt": "2020-10-04T19:18:25Z",
      "vulnerabilities": [],
      "vulnerabilityCount": 0
    }
  ]
}
```

## Testing Different Scenarios

### 1. Test with Vulnerable Packages
To test vulnerability detection, temporarily add older vulnerable packages:
```bash
npm install lodash@4.17.19  # Known prototype pollution vulnerability
npm run scan-deps
# Should detect vulnerabilities in both direct and transitive dependencies
```

### 2. Test with Missing package.json
```bash
node dependency-scanner.js ./nonexistent.json
# Should show error: Failed to read package.json
```

### 3. Test API Rate Limiting
The scanner processes 31 packages and includes a 100ms delay between requests. Full scans take ~3-4 minutes to complete.

### 4. Test Custom Package.json Path
```bash
# Test with explicit path
node dependency-scanner.js ./package.json

# Test from different directory
cd ..
node weather-cli-test/dependency-scanner.js weather-cli-test/package.json
```

## Integration Examples

### CI/CD Integration
```yaml
# .github/workflows/security-scan.yml
name: Dependency Security Scan
on: [push, pull_request]
jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run scan-deps
      - name: Upload scan results
        uses: actions/upload-artifact@v3
        with:
          name: dependency-scan
          path: dependency-scan.json
```

### npm Scripts Integration
Add to package.json:
```json
{
  "scripts": {
    "scan-deps": "node dependency-scanner.js",
    "security-check": "npm audit && npm run scan-deps",
    "scan-and-report": "npm run scan-deps && cat dependency-scan.json"
  }
}
```

## API Endpoints Used

The scanner utilizes these deps.dev API endpoints:

1. **Version Info**: `GET /v3/systems/npm/packages/{package}/versions/{version}`
2. **Vulnerabilities**: `GET /v3/systems/npm/packages/{package}/versions/{version}/advisories`
3. **All Versions**: `GET /v3/systems/npm/packages/{package}/versions`

## Error Handling

The scanner handles various error conditions:

- **Network failures**: Logs error and continues with next package
- **404 responses**: Treats as "no vulnerabilities found"
- **Invalid package.json**: Exits with clear error message
- **Rate limiting**: Built-in delays prevent overwhelming the API

## Best Practices

1. **Run regularly**: Set up automated daily scans
2. **Version pinning**: Use exact versions in production
3. **Monitor old packages**: Pay attention to packages >1 year old
4. **Act on vulnerabilities**: Investigate and update vulnerable packages promptly
5. **Save results**: Archive scan results for compliance and trending

## Troubleshooting

### Common Issues

1. **"Cannot find module" or ES module errors**
   - Ensure `package.json` has `"type": "module"`
   - The scanner uses ES modules (import/export syntax)
   - Run from the weather-cli-test directory where both files are located

2. **"Failed to read package.json"**
   - Ensure you're in the correct directory
   - Check file permissions
   - Verify package.json exists and is valid JSON

3. **Network timeouts**
   - Check internet connection
   - deps.dev API may be temporarily unavailable
   - Try again after a few minutes

4. **No vulnerabilities detected for known vulnerable package**
   - deps.dev may not have the latest vulnerability data
   - Cross-reference with `npm audit`
   - Some vulnerabilities may not be in deps.dev database yet

### Getting Help

- Check the main documentation.md for detailed scanner implementation
- Review the DependencyScanner class methods in dependency-scanner.js
- Test with this simple weather CLI project first before using on larger codebases
- The scanner and weather CLI are now self-contained in this directory
- [Blog Article https://cyberdesserts.com/npm-scanner](https://cyberdesserts.com/npm-scanner)
