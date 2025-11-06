import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { execSync } from 'child_process';

const commitDateRaw = execSync('git log -1 --format=%cI').toString().trimEnd();
const commitDate = new Date(commitDateRaw).toDateString();
const commitHash = execSync('git rev-parse HEAD').toString().trimEnd();
const commitHashShort = commitHash.substring(0, 7);
const repoUrl = execSync('git config --get remote.origin.url')
	.toString()
	.trimEnd()
	.replace(/\.git$/, '')
	.replace(':', '/')
	.replace(/^git@/, 'https://');

export default defineConfig({
	define: {
		__COMMIT_DATE__: JSON.stringify(commitDate),
		__COMMIT_HASH__: JSON.stringify(commitHash),
		__COMMIT_HASH_SHORT__: JSON.stringify(commitHashShort),
		__REPO_URL__: JSON.stringify(repoUrl)
	},
	plugins: [sveltekit(), tailwindcss()]
});
