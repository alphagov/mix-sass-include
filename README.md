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

### Difference between `@use` and `@import`

Custom properties get duplicated, appearing both at the start of GOV.UK Frontend and HMRC Frontend. It's only an issue if between `@use "pkg:govuk-frontend"` and `@use "pkg:@ministryofjustice/frontend"` there's another library redefining the custom properties, as the duplicates from MoJ would override the redefinitions.

Things break down for HMRC's use of [`@extend` with `.govuk-link`](https://github.com/hmrc/hmrc-frontend/blob/5ef16a3f442621563476598d61592963cfff9411/src/components/status-tags-in-task-list-pages/_status-tags-in-task-list-pages.scss#L31): Sass doesn't generate the correct `.govuk-link, .app-task-list__task-name > a` selector, only `.govuk-link`. Same goes with the [extension of `%govuk-heading-m`](https://github.com/hmrc/hmrc-frontend/blob/5ef16a3f442621563476598d61592963cfff9411/src/components/timeline/_timeline.scss#L26) in the timeline component.

We get some duplication from the typography selectors as well, due to HMRC explicitely `@import`ing GOV.UK Frontend's `core/typography` modules.

### Applying configuration with the current version of GOV.UK Frontend

#### With `@import`

Things seem to work as expected

- brand colour seems applied OK to both MoJ and HMRC Frontend
- MoJ keeps the `"GDS Transport", arial, sans-serif` font family. This is expected as [GOV.UK Frontend is re-configured](https://github.com/ministryofjustice/moj-frontend/blob/5403390cee829b1b5f7392f0a01e760ffc1ee3a8/src/moj/vendor/govuk-frontend/_index.scss#L19) with the [value of `$moj-font-family`](https://github.com/ministryofjustice/moj-frontend/blob/5403390cee829b1b5f7392f0a01e760ffc1ee3a8/src/moj/settings/_typography.scss#L9) and MoJ Frontend doesn't account for `$govuk-font-family` being already set when being loaded. Something to make MoJ Frontend aware of, but not due to GOV.UK Frontend's structure.
- It seems only GOV.UK Frontend uses `$govuk-asset-url` and `$govuk-font-url-function` variables.

#### With `@use`

Beyond the behaviour witnessed without configuration, with `@use`, MoJ Frontend does not get the configured brand colour. Thinking this is due to the fact that GOV.UK Frontend `@import`s base where MoJ Frontend `@use`s it:

```scss
@use 'pkg:govuk-frontend'
//  @import 'base'
@use 'pkg:@ministryofjustice/frontend'
// @use 'pkg:govuk-frontend/dist/govuk/base' 
```

## TODO

- [ ] Raise an issue on MoJ Frontend repository to let them know of issues resolving `govuk-frontend` when the library is hoisted by npm. Recommendation would be to use `pkg:` URLs, but it's likely a breaking change.


