const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

function run(cmd, silent = false) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: silent ? 'pipe' : 'pipe' }).trim();
  } catch (err) {
    if (!silent) {
      console.error(`Command failed: ${cmd}\n${err.message}`);
    }
    return null;
  }
}

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function parseSemver(versionStr) {
  if (!versionStr) return null;
  const match = versionStr.match(/^v?(\d+)\.(\d+)\.(\d+)(.*)$/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || '',
  };
}

async function main() {
  console.log('========================================================');
  console.log('       Universal Trading Calculator - Release Manager');
  console.log('========================================================\n');

  // Step 1: Fetch tags from GitHub remote
  process.stdout.write('Fetching latest tags from GitHub remote... ');
  run('git fetch --tags --force', true);
  console.log('Done!\n');

  // Step 2: Get sorted tags
  const tagsOutput = run('git tag -l "v*" --sort=-v:refname', true) || '';
  const allTags = tagsOutput.split(/\r?\n/).map((t) => t.trim()).filter(Boolean);

  let currentSemver = null;
  let currentTag = null;

  for (const tag of allTags) {
    const parsed = parseSemver(tag);
    if (parsed) {
      currentSemver = parsed;
      currentTag = tag;
      break;
    }
  }

  // Fallback to package.json if no tags found
  if (!currentSemver) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
      currentSemver = parseSemver(pkg.version);
      currentTag = `v${pkg.version}`;
    } catch {
      currentSemver = { major: 1, minor: 0, patch: 0, prerelease: '' };
      currentTag = 'v1.0.0';
    }
  }

  const { major, minor, patch } = currentSemver;
  const nextPatch = `v${major}.${minor}.${patch + 1}`;
  const nextMinor = `v${major}.${minor + 1}.0`;
  const nextMajor = `v${major + 1}.0.0`;

  console.log(`Latest release version detected: \x1b[36m${currentTag}\x1b[0m\n`);
  console.log('Select the release bump type:');
  console.log(`  [1] \x1b[32mPatch\x1b[0m : ${nextPatch}  (Bug fixes, minor tweaks) [Default]`);
  console.log(`  [2] \x1b[33mMinor\x1b[0m : ${nextMinor}  (New features, enhancements)`);
  console.log(`  [3] \x1b[35mMajor\x1b[0m : ${nextMajor}  (Major overhaul or breaking change)`);
  console.log('  [4] Custom: Enter a specific version manually');
  console.log('  [5] Cancel\n');

  const choice = await prompt('Enter your choice [1-5] (default 1): ');

  let targetTag = '';

  if (!choice || choice === '1') {
    targetTag = nextPatch;
  } else if (choice === '2') {
    targetTag = nextMinor;
  } else if (choice === '3') {
    targetTag = nextMajor;
  } else if (choice === '4') {
    const custom = await prompt('\nEnter custom version (e.g. 1.0.10 or v1.0.10): ');
    if (!custom) {
      console.log('\n[CANCELLED] Version cannot be empty.');
      return;
    }
    targetTag = custom.startsWith('v') ? custom : `v${custom}`;
  } else if (choice === '5') {
    console.log('\n[CANCELLED] Release aborted by user.');
    return;
  } else {
    console.log('\n[ERROR] Invalid choice.');
    return;
  }

  console.log('\n--------------------------------------------------------');
  console.log(`Selected Version: \x1b[32m${targetTag}\x1b[0m`);
  console.log('--------------------------------------------------------\n');

  const confirm = await prompt(`Are you sure you want to create & push '${targetTag}' to GitHub? (Y/n): `);
  if (confirm && confirm.toLowerCase() !== 'y') {
    console.log('\n[CANCELLED] Operation aborted.');
    return;
  }

  console.log(`\n[1/2] Creating git tag ${targetTag}...`);
  try {
    execSync(`git tag -a "${targetTag}" -m "Release ${targetTag}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`\n[ERROR] Failed to create git tag ${targetTag}. It might already exist.`);
    process.exit(1);
  }

  console.log(`\n[2/2] Pushing ${targetTag} to origin...`);
  try {
    execSync(`git push origin "${targetTag}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`\n[ERROR] Failed to push tag ${targetTag} to GitHub.`);
    process.exit(1);
  }

  console.log('\n========================================================');
  console.log(`[SUCCESS] Tag \x1b[32m${targetTag}\x1b[0m pushed to GitHub successfully!`);
  console.log('\nThe GitHub Actions APK release workflow is now running:');
  console.log('https://github.com/riyazpanarwala/trading-calculator/actions');
  console.log('========================================================\n');
}

main().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});
