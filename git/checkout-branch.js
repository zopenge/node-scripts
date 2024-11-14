const { execSync } = require('child_process');

function getMainBranch(cwd) {
    try {
        // get remote branches and find master/main
        const branches = execSync('git branch -r', { cwd, encoding: 'utf8' });
        const mainBranch = branches.split('\n')
            .map(b => b.trim())
            .map(b => b.replace(/HEAD -> /, ''))
            .find(b => b.match(/origin\/(master|main)/));
        
        return mainBranch ? mainBranch.replace('origin/', '') : null;
    } catch (error) {
        console.error(`Error getting branches in ${cwd}:`, error.message);
        return null;
    }
}

function checkoutBranch(branch, cwd) {
    try {
        // fetch latest changes
        execSync('git fetch', { cwd, encoding: 'utf8' });
        
        // checkout to specified branch
        execSync(`git checkout ${branch}`, { cwd, encoding: 'utf8' });
        
        // pull latest changes
        execSync('git pull', { cwd, encoding: 'utf8' });
        
        console.log(`Switched to ${branch} and pulled latest changes in ${cwd}`);
        return true;
    } catch (error) {
        console.log(`Failed to switch to ${branch} in ${cwd}:`, error.message);
        return false;
    }
}

// checkout main repo
const mainBranch = getMainBranch(process.cwd());
if (mainBranch) {
    checkoutBranch(mainBranch, process.cwd());
}

// checkout submodules with specified branch priority
try {
    execSync('git submodule foreach git fetch', { stdio: 'inherit' });
    
    // handle branch parameter like 'main|master'
    const branchParam = process.argv[2] || 'main|master';
    const branches = branchParam.split('|');
    
    // create checkout command with fallback branches
    const checkoutCommand = branches
        .map(branch => `git checkout ${branch}`)
        .join(' || ');
        
    execSync(`git submodule foreach "${checkoutCommand} || echo No matching branch found"`, { 
        stdio: 'inherit',
        shell: true 
    });
} catch (error) {
    console.error('Error processing submodules:', error.message);
}