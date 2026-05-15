# `@use` and `@import` interactions in real life

Explore how `@use` and `@import` mix with each other using real life libraries:
- `govuk-frontend` which supports both `@use` and `@import`
- `hmrc-frontend` which loads stylesheets with `@import`
- `@ministryofjustice/frontend` which loads stylesheets with `@use`

## Usage

Install the dependencies of the project: `npm install`

The project has two scripts to build CSS:
- `build:import` to build a file that includes the libraries with `@import`
- `build:use` to build a file that includes the libraries with `@use`

Run your chosen command with `npm run` to see the output in the console.

There's also a snapshot test to compare the output with the current compilation against the stable version of GOV.UK Frontend, which you can run with `npm test`.

## Findings

### With the stable version

Let's start simple and just install the current packages to see what happens out of the box.

Whether building the file including stylesheets with `@import` or `@use`, the compilation fails with the following:

```
Error: Can't find stylesheet to import.
  ╷
1 │ @forward "node_modules/govuk-frontend/dist/govuk/base" with ($govuk-suppressed-warnings: ());
  │ ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  ╵
  node_modules/@ministryofjustice/frontend/moj/vendor/govuk-frontend/_base.scss 1:1   @forward
  node_modules/@ministryofjustice/frontend/moj/vendor/govuk-frontend/_index.scss 8:1  @forward
  node_modules/@ministryofjustice/frontend/moj/_base.scss 5:1                         @forward
  node_modules/@ministryofjustice/frontend/moj/all.scss 1:1                           @import
  import.scss 3:9                        
```

MoJ Frontend loads GOV.UK Frontend itself, looking it up inside its `node_modules` folder. `govuk-frontend` is however hoisted in the project's `node_modules` (both because `govuk-frontend` is an explicit dependency of the project, and because it's a dependency of `hmrc-frontend`).

### Resolving govuk-frontend from @ministryofjustice/frontend

Using patch-package, updating the URL used to load GOV.UK Frontend to a pkg: URL enables compilation with build:import.

## TODO

- [ ] Raise an issue on MoJ Frontend repository to let them know of issues resolving `govuk-frontend` when the library is hoisted by npm. Recommendation would be to use `pkg:` URLs, but it's likely a breaking change.


