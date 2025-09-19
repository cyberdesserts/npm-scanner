# npm-scanner

A comprehensive dependency scanner that analyzes both **direct** and **transitive** dependencies using the deps.dev API to provide complete visibility into your npm package security.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
- [Blog Article](https://cyberdesserts.com/npm-scanner)

## 🚀 Quick Start

### Option 1: Use the Test Project (Recommended)
```bash
# Clone and test with included weather CLI
git clone https://github.com/cyberdesserts/npm-scanner.git
cd npm-scanner/weather-cli-test
npm install
npm run scan-deps
```

### Option 2: Use in Your Project
```bash
# Copy the scanner to your project
curl -o dependency-scanner.js https://raw.githubusercontent.com/cyberdesserts/npm-scanner/main/weather-cli-test/dependency-scanner.js

# Run full scan (including transitive dependencies)
node dependency-scanner.js
```

## 🔍 Why This Scanner?

Traditional tools like `npm audit` only scratch the surface. This scanner provides:

- **Complete dependency tree analysis** (direct + transitive)
- **deps.dev API integration** for comprehensive vulnerability data
- **87% more coverage** - reveals hidden transitive dependencies
- **Release date tracking** to identify abandoned packages
- **No authentication required** - completely free to use

## 📊 What You Get

### Before: Traditional Scanning
```
Scanning 4 dependencies...
✅ No vulnerabilities found!
```

### After: Complete Analysis
```
Scanning 31 dependencies (including transitive)...

=== DEPENDENCY SCAN REPORT ===

Total packages scanned: 31
  - Direct dependencies: 4
  - Transitive dependencies: 27
Packages with vulnerabilities: 0

📊 VULNERABILITY BREAKDOWN:
   Direct dependencies with vulnerabilities: 0/4
   Transitive dependencies with vulnerabilities: 0/27

📅 OLDEST DEPENDENCIES:
   🔗 delayed-stream@1.0.0 - 2015-04-30T22:10:29Z
   🔗 asynckit@0.4.0 - 2016-06-14T18:29:05Z
   🎯 chalk@4.1.2 - 2021-07-30T12:02:52Z
```

## 🏗️ Project Structure

```
npm-scanner/
├── scripts/
│   └── dependency-scanner.js      # Original scanner
├── weather-cli-test/              # Complete test project
│   ├── dependency-scanner.js      # Enhanced scanner
│   ├── weather.js                 # Test CLI app
│   ├── package.json               # With 4 direct dependencies
│   ├── package-lock.json          # With 31 total packages
│   └── README.md                  # Detailed testing guide
└── documentation.md               # Background & implementation details
```

## 🧪 Test Project: Weather CLI

The included Weather CLI serves as the perfect test case:

- **4 direct dependencies**: axios, chalk, commander, dotenv
- **31 total packages**: Including all transitive dependencies
- **Real-world complexity**: Mix of utility and HTTP packages
- **Easy to understand**: Simple weather lookup functionality

### Testing Different Scenarios

```bash
cd weather-cli-test

# Test full scanning
npm run scan-deps

# Test with vulnerable package
npm install lodash@4.17.19
npm run scan-deps

# Test the actual CLI
npm start London
```

## 🔧 Scanner Features

### Core Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `scanDependencies()` | Full scan with transitive deps | `scanner.scanDependencies()` |
| `getDependencies()` | Direct dependencies only | `scanner.getDependencies()` |
| `getAllInstalledPackages()` | Parse package-lock.json | `scanner.getAllInstalledPackages()` |
| `getVulnerabilities()` | Check specific package | `scanner.getVulnerabilities('axios', '1.12.2')` |
| `generateReport()` | Console output | `scanner.generateReport(results)` |
| `saveResults()` | JSON export | `scanner.saveResults(results)` |

### Advanced Usage

```javascript
import DependencyScanner from './dependency-scanner.js';

const scanner = new DependencyScanner();

// Scan only direct dependencies
const directOnly = await scanner.scanDependencies('./package.json', false);

// Full scan including transitive
const fullScan = await scanner.scanDependencies('./package.json', true);

// Custom analysis
const allPackages = scanner.getAllInstalledPackages();
console.log(`Total installed packages: ${Object.keys(allPackages).length}`);

// Generate reports
scanner.generateReport(fullScan);
scanner.saveResults(fullScan, 'security-scan.json');
```

## 🚨 Security Benefits

### Supply Chain Attack Protection

- **Transitive dependency scanning** catches hidden vulnerabilities
- **Package age analysis** identifies abandoned dependencies
- **Complete attack surface visibility** beyond package.json

### Real-World Impact

In the test project:
- **Only 13% of packages** are in package.json (4 out of 31)
- **87% are transitive** and previously invisible
- **Oldest package** dates to 2015 (would never be detected otherwise)

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
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
      - uses: actions/upload-artifact@v3
        with:
          name: dependency-scan
          path: dependency-scan.json
```

### npm Scripts
```json
{
  "scripts": {
    "scan-deps": "node dependency-scanner.js",
    "security-check": "npm audit && npm run scan-deps",
    "presecurity": "npm run scan-deps"
  }
}
```

## 📈 Output Formats

### Console Report
- Vulnerability breakdown by dependency type
- Oldest package identification
- Direct vs transitive classification

### JSON Export
```json
{
  "scanDate": "2025-09-19T...",
  "summary": {
    "totalPackages": 31,
    "directDependencies": 4,
    "transitiveDependencies": 27,
    "vulnerablePackages": 0
  },
  "results": [...detailed package info...]
}
```

## 🛡️ Best Practices

1. **Run regular scans** including transitive dependencies
2. **Monitor package age** - packages >2 years need review
3. **Focus on transitive vulnerabilities** - harder to track and fix
4. **Automate scanning** in CI/CD pipelines
5. **Archive scan results** for compliance and trending

## 🔗 API Coverage

The scanner uses these deps.dev endpoints:

- `GET /v3/systems/npm/packages/{package}/versions/{version}` - Package info
- `GET /v3/systems/npm/packages/{package}/versions/{version}/advisories` - Vulnerabilities
- `GET /v3/systems/npm/packages/{package}/versions` - Version history

## 🤝 Contributing

1. Fork the repository
2. Test with the weather-cli-test project
3. Add new features to the scanner
4. Update documentation
5. Submit a pull request

## 📝 License

MIT - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- **deps.dev API** for comprehensive dependency data
- **npm ecosystem** for package management
- **Security community** for supply chain attack awareness

---

**Start securing your dependencies today**: The question isn't whether you'll encounter a supply chain attack—it's whether you'll detect it quickly enough to minimize impact.

- [Blog Article https://cyberdesserts.com/npm-scanner](https://cyberdesserts.com/npm-scanner)