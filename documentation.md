# How I Built a Vulnerability Scanner to check NPM packages

The npm ecosystem is both a blessing and a curse for JavaScript developers. With over 2 million packages, it's incredibly powerful, but it's also a prime target for supply chain attacks. Incidents like the [`ua-parser-js`](https://www.npmjs.com/package/ua-parser-js), more recently [`chalk` packages](https://www.aikido.dev/blog/npm-debug-and-chalk-packages-compromised) compromise, malicious typosquatting packages, and countless prototype pollution vulnerabilities have made one thing clear: **trusting npm packages blindly is no longer an option**.

As JavaScript projects grow, keeping track of your dependencies becomes crucial not just for maintenance, but for security. While npm provides basic tools, the modern threat landscape demands more detailed insights into your dependency ecosystem. That's where Google's [deps.dev](http://deps.dev) API comes in handy.

Thanks to some feedback from the community I decided to try and build a custom dependency scanner that provides rich information about npm packages in my projects, including release dates, vulnerability data, and comprehensive reporting, giving me some level of visibility. This is by no means fool proof, its heavily reliant on data pulled from [deps.dev](http://deps.dev) There are tools out there that can scan for malware and run further checks constantly so its worth looking into whats on offer. Never the less this is a fun project and makes an excellent first level of checking and help understand some of the issues.

> **🚀 Want to try it right now?** Check out the [Quick Start Guide -](https://github.com/cyberdesserts/npm-scanner/blob/main/README.md) [README.MD](http://README.MD) to get the scanner running in under 2 minutes with the included test project!

## The npm Security Challenge

Recent supply chain attacks have made the npm ecosystem's vulnerabilities painfully clear. This reactive approach isn't sustainable.

The problems are multifaceted:

* **Supply chain attacks** are increasing, with attackers compromising maintainer accounts
    
* **Malicious packages** can exfiltrate credentials, create backdoors, or mine cryptocurrency
    
* **Transitive dependencies** create blind spots, one package pulls in dozens of others
    
* **Abandoned packages** may not receive security updates
    
* **Zero-day vulnerabilities** in popular packages can affect thousands of projects instantly
    

Traditional `npm audit` only scratches the surface, checking against npm's vulnerability database after vulnerabilities are already known and reported. But what about:

* Newly published malicious packages?
    
* Recently compromised legitimate packages?
    
* Package age and maintenance status?
    
* Behavioral analysis of suspicious packages?
    

The cybersecurity community is actively seeking better tooling and processes to address these gaps.

## Why [deps.dev](http://deps.dev) API?

The [deps.dev](http://deps.dev) [API](https://docs.deps.dev/api/) aggregates data from multiple sources including npm, GitHub, and various security databases. Unlike npm's built-in tools, it provides:

* **Comprehensive vulnerability data** from multiple security databases
    
* **Release date information** for tracking dependency freshness and potential abandonment
    
* **Version history and metadata** for understanding maintenance patterns
    
* **No authentication required** - completely free to use
    
* **Multiple package ecosystem support** (npm, PyPI, Maven, etc.)
    
* **Broader coverage** that may catch vulnerabilities missed by npm's database
    

## Setting Up my Scanner

I created a simple but effective dependency scanner as an npm script in this example project.

### Step 1: Get the Scanner

The main scanner is a single JavaScript file that parses your dependencies and queries the [deps.dev](http://deps.dev) API. You can grab it from the GitHub repo and start playing with it straight away to scan the example application included:

```bash
# Clone the complete project with test setup
git clone https://github.com/cyberdesserts/npm-scanner.git
cd npm-scanner/weather-cli-test
npm install

# Or just download the scanner file to your project
curl -o dependency-scanner.js https://raw.githubusercontent.com/cyberdesserts/npm-scanner/main/weather-cli-test/dependency-scanner.js
```

### Step 2: The Scanner Implementation

The scanner will:

1. Parse `package.json` to extract dependencies
    
2. Query the [deps.dev](http://deps.dev) API for each package
    
3. Collect vulnerability and release date information
    
4. Generate a comprehensive report
    

The core functionality involves three main API endpoints from devs.deps:

```javascript
// Get version information and release dates
GET /v3/systems/npm/packages/{package}/versions/{version}

// Get vulnerability advisories
GET /v3/systems/npm/packages/{package}/versions/{version}/advisories

// Get all available versions (optional)
GET /v3/systems/npm/packages/{package}/versions
```

### Step 3: Running the Scanner in your projects

Add this to the `package.json`:

```json
{
  "scripts": {
    "scan-deps": "node scripts/dependency-scanner.js"
  }
}
```

Then run it:

```bash
npm run scan-deps
```

## Sample Scan Report

Here's what a typical scan report might look like:

```plaintext
Scanning 8 dependencies...
Scanning express@4.18.0...
Scanning lodash@4.17.19...
Scanning moment@2.29.4...
Scanning axios@0.27.2...
Scanning jsonwebtoken@8.5.1...
Scanning bcrypt@5.1.0...
Scanning cors@2.8.5...
Scanning helmet@6.0.1...

=== DEPENDENCY SCAN REPORT ===

Total packages scanned: 8
Packages with vulnerabilities: 2

⚠️  VULNERABLE PACKAGES:

📦 lodash@4.17.19
   Published: 2020-02-20T17:27:44.065Z
   Vulnerabilities: 2
   - Prototype Pollution (High severity)
     Lodash versions prior to 4.17.21 are vulnerable to Prototype Pollution
   - Command Injection (Moderate severity)
     ReDoS vulnerability in lodash

📦 jsonwebtoken@8.5.1
   Published: 2019-04-16T14:32:18.123Z
   Vulnerabilities: 1
   - Timing Attack (Low severity)
     JWT signature verification vulnerable to timing attacks

📅 OLDEST DEPENDENCIES:
   jsonwebtoken@8.5.1 - 2019-04-16T14:32:18.123Z (1,614 days old)
   lodash@4.17.19 - 2020-02-20T17:27:44.065Z (1,337 days old)
   cors@2.8.5 - 2020-07-04T15:45:32.789Z (1,173 days old)

✅ SECURE PACKAGES:
   express@4.18.0 - No vulnerabilities found
   axios@0.27.2 - No vulnerabilities found
   bcrypt@5.1.0 - No vulnerabilities found

Results saved to dependency-scan.json
```

## What This Report Tells Us

From this example scan, I can immediately identify several security concerns:

* **Immediate Action Required**: The high severity prototype pollution in lodash needs immediate attention, this is a classic vulnerability that's been exploited in the wild
    
* **Age Red Flags**: Dependencies over 1000 days old may be abandoned or poorly maintained
    
* **Attack Surface**: 2 out of 8 packages having vulnerabilities shows how quickly risk accumulates
    
* **Maintenance Debt**: Old packages like jsonwebtoken from 2019 are prime targets for supply chain attacks
    

This visibility give me some useful insights:

* Which updates are security-critical vs. nice-to-have
    
* Whether to find alternative packages for abandoned dependencies
    
* Risk assessment for compliance and security reviews
    

## Automating Scans (Further development)

I can run this scanner periodically using:

### GitHub Actions

```yaml
name: Dependency Scan
on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm run scan-deps
```

### Local Cron Job

```bash
# Daily scan at 9 AM
0 9 * * * cd /path/to/project && npm run scan-deps >> scan.log 2>&1
```

## Benefits Over Basic npm Tools

The [deps.dev](http://deps.dev) scanner provides several advantages:

1. **Richer Data Sources**: Aggregates from multiple vulnerability databases
    
2. **Historical Context**: Shows package age and release patterns
    
3. **Custom Reporting**: Tailor the output to your team's needs
    
4. **Broader Coverage**: May catch vulnerabilities missed by npm's database
    
5. **No Rate Limits**: Free API with generous usage limits
    

## Beyond Basic Scanning: A Layered Security Approach

While the [deps.dev](http://deps.dev) scanner provides excellent vulnerability visibility, the cybersecurity community has identified several complementary strategies for npm package security:

### 1\. **Version Pinning and Lock File Management**

*"Lock versions in your package.json and only update on a cadence."*

```json
{
  "dependencies": {
    "express": "4.18.0",  // Exact version, not "^4.18.0"
    "lodash": "4.17.21"   // No semver ranges
  }
}
```

**Best practices:**

* Use `npm install --save-exact` for new packages
    
* Always commit `package-lock.json`
    
* Use `npm ci` in production, never `npm install`
    
* Make package updates separate PRs for scrutiny
    

### 2\. **Time-Based Safety Measures**

Several organisations implement "cooldown periods" before adopting new packages:

* **JFrog Curation** policies requiring packages to be published for X days
    
* **Internal registries** with delayed mirroring from npm
    
* **Manual review processes** for new dependencies
    

This approach helps catch malicious packages that are quickly identified and removed.

### 3\. **Private Registry Solutions**

According to feedback from DevSecOps engineers using tools like:

* **Artifactory** with private repositories and package approval workflows
    
* **Nexus Firewall** for vetted internal repositories
    
* **Proxy registries** with security scanning integration
    

### 4\. **Integration with npm audit for Immediate Action**

```json
{
  "scripts": {
    "scan-deps": "node scripts/dependency-scanner.js",
    "security-check": "npm audit && npm run scan-deps",
    "fix-and-scan": "npm audit fix && npm run scan-deps",
    "security-full": "npm audit fix --force && npm run scan-deps"
  }
}
```

**Important**: Use `npm audit fix --force` cautiously, it may introduce breaking changes, but sometimes security trumps compatibility.

### 5\. **Runtime and Development Environment Protection**

**Developer workstation security:**

* Remove admin rights from developers (as one CISO noted: *"No great solution outside of hoping your AV picks it up"*)
    
* Use password managers for environment variables instead of plaintext files
    
* Implement tools like **Aikido Safechain** to block malware installation
    

**Pipeline and production:**

* **SBOM scanning** on every build and deployment
    
* **eBPF monitoring** to spot zero-day exploits in runtime
    
* Never run `npm install` in production pipelines, use `npm ci` only
    
* Use `--ignore-scripts` judiciously (opt-out rather than opt-in)
    

### 6\. **Proactive Detection and Response**

Modern security approaches focus on rapid detection rather than perfect prevention:

* **Frequent vulnerability feeds** (hourly updates vs daily)
    
* **Behavioral analysis** of packages for suspicious activity
    
* **Automated alerting** via Slack/email for new threats
    
* **Malware detection** integrated into CI/CD pipelines
    

## Conclusion

The consensus is clear: *"You can't protect preemptively. But you can be aware as quickly as possible."* The [deps.dev](http://deps.dev) scanner addresses this need for awareness and rapid detection but its only a starting point.

**Key takeaways :**

1. **Accept the reactive reality**: Perfect prevention isn't possible, so focus on rapid detection and response
    
2. **Layer your defenses**: No single tool solves npm security, combine scanning, private registries, time delays, and process controls
    
3. **Automate what you can**: Manual reviews don't scale, but automated scanning and alerting do
    
4. **Make security frictionless**: If security tools are too painful, developers will work around them
    

**The** [**deps.dev**](http://deps.dev) **advantage**: Unlike commercial solutions, this approach gives you:

* **Full visibility** into the scanning logic and criteria
    
* **Customisable alerting** and reporting for your team's workflow
    
* **No vendor lock-in** or licensing costs
    
* **Integration flexibility** with your existing CI/CD pipeline
    

Building on this foundation, you can add:

* **Slack/email notifications** for critical vulnerabilities
    
* **CI/CD integration** to fail builds on high-risk dependencies
    
* **Custom scoring** based on your organisation's risk tolerance
    
* **Historical trending** to track your security posture over time
    
* **Multi-project dashboards** for portfolio-wide visibility
    

The npm supply chain security challenge isn't solved by any single tool, it requires a comprehensive approach combining technology, process, and culture. hopefully my [deps.dev](http://deps.dev) scanner gives you the visibility foundation to build that approach.

I'd love feedback on this implementation! Feel free to reach out, contribute improvements, or fork the project to adapt it for your specific needs.


cyberdesserts.com/npm-scanner