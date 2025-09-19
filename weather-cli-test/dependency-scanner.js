import fs from 'fs';

class DependencyScanner {
  constructor() {
    this.baseUrl = 'https://api.deps.dev';
  }

  // Parse package.json to get direct dependencies
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

  // Parse package-lock.json to get ALL installed packages (including transitive)
  getAllInstalledPackages(packageLockPath = './package-lock.json') {
    try {
      const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
      const allPackages = {};

      // Extract all packages from the packages object
      for (const [packagePath, packageInfo] of Object.entries(packageLock.packages || {})) {
        // Skip the root package (empty string key)
        if (packagePath === '') continue;

        // Extract package name from node_modules path
        const packageName = packagePath.replace('node_modules/', '');
        // Handle scoped packages (@scope/package)
        const normalizedName = packageName.includes('/') && !packageName.startsWith('@')
          ? packageName.split('/').pop()
          : packageName;

        if (packageInfo.version) {
          allPackages[normalizedName] = packageInfo.version;
        }
      }

      return allPackages;
    } catch (error) {
      console.warn(`Warning: Could not read package-lock.json: ${error.message}`);
      console.warn('Falling back to package.json dependencies only');
      return this.getDependencies();
    }
  }

  // Get dependency type (direct or transitive)
  getDependencyTypes(packageJsonPath = './package.json') {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const directDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      const allDeps = this.getAllInstalledPackages();
      const dependencyTypes = {};

      for (const [packageName, version] of Object.entries(allDeps)) {
        dependencyTypes[packageName] = directDeps[packageName] ? 'direct' : 'transitive';
      }

      return dependencyTypes;
    } catch (error) {
      throw new Error(`Failed to analyze dependency types: ${error.message}`);
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
  async scanDependencies(packageJsonPath = './package.json', includeTransitive = true) {
    const dependencies = includeTransitive
      ? this.getAllInstalledPackages()
      : this.getDependencies(packageJsonPath);

    const dependencyTypes = includeTransitive ? this.getDependencyTypes(packageJsonPath) : {};
    const results = [];

    console.log(`Scanning ${Object.keys(dependencies).length} dependencies (${includeTransitive ? 'including transitive' : 'direct only'})...`);

    for (const [packageName, version] of Object.entries(dependencies)) {
      console.log(`Scanning ${packageName}@${version}...`);

      const versionInfo = await this.getVersionInfo(packageName, version);
      const vulnerabilities = await this.getVulnerabilities(packageName, version);

      const result = {
        package: packageName,
        currentVersion: version,
        dependencyType: dependencyTypes[packageName] || 'direct',
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
    const directPackages = results.filter(r => r.dependencyType === 'direct');
    const transitivePackages = results.filter(r => r.dependencyType === 'transitive');

    console.log('\n=== DEPENDENCY SCAN REPORT ===\n');
    console.log(`Total packages scanned: ${results.length}`);
    console.log(`  - Direct dependencies: ${directPackages.length}`);
    console.log(`  - Transitive dependencies: ${transitivePackages.length}`);
    console.log(`Packages with vulnerabilities: ${vulnerablePackages.length}`);

    if (vulnerablePackages.length > 0) {
      console.log('\n⚠️  VULNERABLE PACKAGES:');
      vulnerablePackages.forEach(pkg => {
        const depType = pkg.dependencyType === 'direct' ? '🎯 DIRECT' : '🔗 TRANSITIVE';
        console.log(`\n📦 ${pkg.package}@${pkg.currentVersion} (${depType})`);
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

    // Show breakdown by dependency type
    if (transitivePackages.length > 0) {
      const vulnerableTransitive = vulnerablePackages.filter(r => r.dependencyType === 'transitive');
      const vulnerableDirect = vulnerablePackages.filter(r => r.dependencyType === 'direct');

      console.log('\n📊 VULNERABILITY BREAKDOWN:');
      console.log(`   Direct dependencies with vulnerabilities: ${vulnerableDirect.length}/${directPackages.length}`);
      console.log(`   Transitive dependencies with vulnerabilities: ${vulnerableTransitive.length}/${transitivePackages.length}`);
    }

    // Show oldest packages
    const sortedByDate = results
      .filter(r => r.publishedAt !== 'Unknown')
      .sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));

    if (sortedByDate.length > 0) {
      console.log('\n📅 OLDEST DEPENDENCIES:');
      sortedByDate.slice(0, 5).forEach(pkg => {
        const depType = pkg.dependencyType === 'direct' ? '🎯' : '🔗';
        console.log(`   ${depType} ${pkg.package}@${pkg.currentVersion} - ${pkg.publishedAt}`);
      });
    }
  }

  // Save results to JSON file
  saveResults(results, filename = 'dependency-scan.json') {
    const vulnerablePackages = results.filter(r => r.vulnerabilityCount > 0);
    const directPackages = results.filter(r => r.dependencyType === 'direct');
    const transitivePackages = results.filter(r => r.dependencyType === 'transitive');

    const report = {
      scanDate: new Date().toISOString(),
      summary: {
        totalPackages: results.length,
        directDependencies: directPackages.length,
        transitiveDependencies: transitivePackages.length,
        vulnerablePackages: vulnerablePackages.length,
        vulnerableDirect: vulnerablePackages.filter(r => r.dependencyType === 'direct').length,
        vulnerableTransitive: vulnerablePackages.filter(r => r.dependencyType === 'transitive').length
      },
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