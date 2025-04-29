# GitHub Actions & Branch Protection Setup

This project is configured with GitHub Actions to run tests automatically on pull requests and pushes to the main branch.

## Test Workflow

The test workflow (`test.yml`) does the following:
- Runs on every push to `main` and on every pull request to `main`
- Sets up Node.js
- Installs dependencies
- Runs tests with `npm test`
- Uploads test results as artifacts

## Setting Up Branch Protection Rules

To make passing tests a requirement for merging pull requests:

1. Go to your GitHub repository
2. Click on "Settings"
3. Click on "Branches" in the left sidebar
4. Under "Branch protection rules", click "Add rule"
5. In "Branch name pattern", enter `main`
6. Check "Require status checks to pass before merging"
7. In the search box, search for and select "test" (the job name from our workflow)
8. Optionally, check other protections you want:
   - "Require pull request reviews before merging"
   - "Require signed commits"
9. Click "Create" or "Save changes"

After setting up these rules, pull requests cannot be merged into the main branch unless the tests pass.

## Running Tests Locally

- Run tests once: `npm test`
- Run tests in watch mode: `npm run test:watch`
