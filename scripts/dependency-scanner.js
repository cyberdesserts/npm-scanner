import fs from 'fs';

class DependencyScanner {
  constructor() {
    this.baseUrl = 'https://api.deps.dev';
  }

  // Parse package.json to get dependencies
  getDependencies(packageJsonPath = './package.json') {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
    } catch (error) {
      throw new Error(`Failed to read package.json: ${error.message}`);
    }
  }

  // Get version information including release date
  async getVersionInfo(packageName, version) {
    const cleanVersion = version.replace(/[\^~]/, ''); // Remove semver prefixes
    const url = `${this.baseUrl}/v3/systems/npm/packages/${encodeURIComponent(packageName)}/versions/${encodeURIComponent(cleanVersion)}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to get version info for ${packageName}@${version}:`, error.message);
      return null;
    }
  }

  // Get vulnerability advisories for a specific version
  async getVulnerabilities(packageName, version) {
    const cleanVersion = version.replace(/[\^~]/, '');
    const url = `${this.baseUrl}/v3/systems/npm/packages/${encodeURIComponent(packageName)}/versions/${encodeURIComponent(cleanVersion)}/advisories`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          return []; // No vulnerabilities found
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.advisories || [];
    } catch (error) {
      console.error(`Failed to get vulnerabilities for ${packageName}@${version}:`, error.message);
      return [];
    }
  }

  // Get all available versions of a package
  async getAllVersions(packageName) {
    const url = `${this.baseUrl}/v3/systems/npm/packages/${encodeURIComponent(packageName)}/versions`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.versions || [];
    } catch (error) {
      console.error(`Failed to get versions for ${packageName}:`, error.message);
      return [];
    }
  }

  // Main scanning function
  async scanDependencies(packageJsonPath = './package.json') {
    const dependencies = this.getDependencies(packageJsonPath);
    const results = [];

    console.log(`Scanning ${Object.keys(dependencies).length} dependencies...`);

    for (const [packageName, version] of Object.entries(dependencies)) {
      console.log(`Scanning ${packageName}@${version}...`);
      
      const versionInfo = await this.getVersionInfo(packageName, version);
      const vulnerabilities = await this.getVulnerabilities(packageName, version);
      
      const result = {
        package: packageName,
        currentVersion: version,
        publishedAt: versionInfo?.publishedAt || 'Unknown',
        isDefault: versionInfo?.isDefault || false,
        vulnerabilities: vulnerabilities.map(vuln => ({
          id: vuln.id,
          title: vuln.title,
          severity: vuln.severity,
          cvss: vuln.cvss,
          summary: vuln.summary
        })),
        vulnerabilityCount: vulnerabilities.length
      };

      results.push(result);
      
      // Add small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  // Generate a report
  generateReport(results) {
    const vulnerablePackages = results.filter(r => r.vulnerabilityCount > 0);
    
    console.log('\n=== DEPENDENCY SCAN REPORT ===\n');
    console.log(`Total packages scanned: ${results.length}`);
    console.log(`Packages with vulnerabilities: ${vulnerablePackages.length}`);
    
    if (vulnerablePackages.length > 0) {
      console.log('\n⚠️  VULNERABLE PACKAGES:');
      vulnerablePackages.forEach(pkg => {
        console.log(`\n📦 ${pkg.package}@${pkg.currentVersion}`);
        console.log(`   Published: ${pkg.publishedAt}`);
        console.log(`   Vulnerabilities: ${pkg.vulnerabilityCount}`);
        
        pkg.vulnerabilities.forEach(vuln => {
          console.log(`   - ${vuln.title} (${vuln.severity || 'Unknown severity'})`);
          if (vuln.summary) {
            console.log(`     ${vuln.summary.substring(0, 100)}...`);
          }
        });
      });
    } else {
      console.log('\n✅ No vulnerabilities found!');
    }

    // Show oldest packages
    const sortedByDate = results
      .filter(r => r.publishedAt !== 'Unknown')
      .sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));

    if (sortedByDate.length > 0) {
      console.log('\n📅 OLDEST DEPENDENCIES:');
      sortedByDate.slice(0, 5).forEach(pkg => {
        console.log(`   ${pkg.package}@${pkg.currentVersion} - ${pkg.publishedAt}`);
      });
    }
  }

  // Save results to JSON file
  saveResults(results, filename = 'dependency-scan.json') {
    const report = {
      scanDate: new Date().toISOString(),
      totalPackages: results.length,
      vulnerablePackages: results.filter(r => r.vulnerabilityCount > 0).length,
      results: results
    };

    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\nResults saved to ${filename}`);
  }
}

// Usage example
async function main() {
  const scanner = new DependencyScanner();
  
  try {
    const results = await scanner.scanDependencies();
    scanner.generateReport(results);
    scanner.saveResults(results);
  } catch (error) {
    console.error('Scan failed:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default DependencyScanner;