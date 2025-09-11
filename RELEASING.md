# Releasing @qvlt/service-orchestrator

This document describes the release process for @qvlt/service-orchestrator.

## Prerequisites

- NPM token with publish permissions for @qvlt scope
- Git configured with your name and email
- pnpm installed (version 10.15.0 or later)

## Release Process

The release process is simple and consists of two steps:

1. **Update version manually** in `package.json`
2. **Create and push git tag** using the release script

### Step 1: Update Version

Edit `package.json` and update the version field:

```json
{
  "version": "0.0.2"
}
```

### Step 2: Create Release Tag

Run the release script to create and push the git tag:

```bash
pnpm run release:tag
```

This script will:

- Verify you're on the `main` branch
- Read the version from `package.json`
- Create a git tag with the format `v{version}`
- Push the tag to the remote repository

## Automated Publishing

Once the tag is pushed, GitHub Actions will automatically:

1. **Verify the release**:
   - Check that the tag version matches `package.json`
   - Run all tests and linting
   - Build the package
   - Verify the package can be packed

2. **Publish to npm**:
   - Check if the version already exists
   - Publish the package to npm registry
   - Use npm provenance for supply chain security

3. **Create GitHub Release**:
   - Create a GitHub release with installation instructions
   - Include changelog and documentation links

4. **Sync branches**:
   - Automatically create a PR to sync `main` → `dev`
   - Attempt to merge the sync PR immediately

## Example Workflow

```bash
# 1. Update version in package.json
# Edit package.json: "version": "0.0.2"

# 2. Commit the version change
git add package.json
git commit -m "chore: bump version to 0.0.2"

# 3. Push to main
git push origin main

# 4. Create and push release tag
pnpm run release:tag

# 5. GitHub Actions takes over from here
```

## Troubleshooting

### Version Already Exists

If you get an error that the version already exists on npm:

1. Check the current version on npm: `npm view @qvlt/service-orchestrator version`
2. Update to a new version in `package.json`
3. Try the release process again

### Tag Already Exists

If the git tag already exists:

1. Delete the local tag: `git tag -d v0.0.2`
2. Delete the remote tag: `git push origin :refs/tags/v0.0.2`
3. Try the release process again

### Workflow Failures

If the GitHub Actions workflow fails:

1. Check the workflow logs for specific errors
2. Fix any issues (usually test failures or linting errors)
3. Create a new tag with the same version: `pnpm run release:tag`

## Branch Strategy

- **main**: Production releases only
- **dev**: Development branch for new features
- **feature/\***: Feature branches created from `dev`

## Manual Testing

You can test the release process locally:

```bash
# Test the package build
pnpm run build

# Test the package pack
pnpm pack --dry-run

# Test the example project
cd example
pnpm install
pnpm start
```

## Security

- All releases are signed with npm provenance
- NPM token is stored securely in GitHub Secrets
- Only maintainers can trigger releases
