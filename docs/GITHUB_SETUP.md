# GitHub setup

The project is prepared for a repository named `sql-flight-school`.

1. Create the repository in the intended GitHub account and choose its visibility. GitHub Pages with GitHub Free requires a public repository; eligible paid plans support private repositories as well.
2. Push this project folder as the repository root, with `main` as its default branch. Include `.github/workflows/website.yml`.
3. In repository Settings → Pages, choose **GitHub Actions** as the publishing source.
4. Run **Test and publish Flight School** from the Actions tab, or push an update to `main`.

Pull requests run tests without publishing. Updates to `main` run tests and publish only if they pass. The deployment stages only index.html, src and vendor; it does not publish the source brief, tests, launcher, or other project documentation as website files. Repository visibility separately controls access to all source files.

No personal access token is embedded in the project. Publishing uses GitHub's temporary workflow token. GitHub sign-in and account authorization are required before creating or pushing the repository.

The eventual site address is `https://YOUR-USERNAME.github.io/sql-flight-school/`. This is a placeholder, not a deployed site. Hosting does not add cross-device progress synchronization.
