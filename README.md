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

### Installing `govuk-frontend@6.2.0-beta.0`

Installing the beta of GOV.UK Frontend requires a little `overrides` in the `package.json`. Without it `npm` complains of conflicting required versions for `govuk-frontend`:

```sh
npm error code ERESOLVE
npm error ERESOLVE could not resolve
npm error
npm error While resolving: @ministryofjustice/frontend@9.0.0
npm error Found: govuk-frontend@6.2.0-beta.0
npm error node_modules/govuk-frontend
npm error   govuk-frontend@"^6.2.0-beta.0" from the root project
npm error
npm error Could not resolve dependency:
npm error peer govuk-frontend@"^6.0.0" from @ministryofjustice/frontend@9.0.0
npm error node_modules/@ministryofjustice/frontend
npm error   @ministryofjustice/frontend@"^9.0.0" from the root project
npm error
npm error Conflicting peer dependency: govuk-frontend@6.1.0
npm error node_modules/govuk-frontend
npm error   peer govuk-frontend@"^6.0.0" from @ministryofjustice/frontend@9.0.0
npm error   node_modules/@ministryofjustice/frontend
npm error     @ministryofjustice/frontend@"^9.0.0" from the root project
npm error
npm error Fix the upstream dependency conflict, or retry this command with --force or --legacy-peer-deps to accept an incorrect (and potentially broken) dependency resolution.
npm error
npm error
npm error For a full report see:
npm error /Users/romaric.pascal/.npm/_logs/2026-05-15T14_46_37_711Z-eresolve-report.txt
npm error A complete log of this run can be found in: /Users/romaric.pascal/.npm/_logs/2026-05-15T14_46_37_711Z-debug-0.log
```

Installing only `govuk-frontend` and `hmrc-frontend` shows some warnings, but not an error.

```sh
npm install govuk-frontend@next hmrc-frontend 
npm warn ERESOLVE overriding peer dependency
npm warn While resolving: @ministryofjustice/frontend@9.0.0
npm warn Found: govuk-frontend@6.2.0-beta.0
npm warn node_modules/govuk-frontend
npm warn   govuk-frontend@"6.2.0-beta.0" from the root project
npm warn
npm warn Could not resolve dependency:
npm warn peer govuk-frontend@"^6.0.0" from @ministryofjustice/frontend@9.0.0
npm warn node_modules/@ministryofjustice/frontend
npm warn
npm warn Conflicting peer dependency: govuk-frontend@6.1.0
npm warn node_modules/govuk-frontend
npm warn   peer govuk-frontend@"^6.0.0" from @ministryofjustice/frontend@9.0.0
npm warn   node_modules/@ministryofjustice/frontend

removed 1 package, changed 2 packages, and audited 18 packages in 4s

5 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

Note that installing with `yarn` doesn't run into any issues.

### Compiling

`npm run build:import` is successful, however the snapshot does not match that of 6.1.0. It shows quite a few occurences of `govuk-functional-colour` function calls. Did we forget to `@forward` it?

When including stylesheets with `@use`, Sass compilation fails because the `base` module from `govuk-frontend` is [being configured by `@ministryofjustice/frontend`](https://github.com/ministryofjustice/moj-frontend/blob/4843606f47dd44b8eae78643c7925a11a3eaf3d7/src/moj/vendor/govuk-frontend/_base.scss) after having been included already by `govuk-frontend`.


```sh
Error: This module was already loaded, so it can't be configured using "with".
  ┌──> node_modules/@ministryofjustice/frontend/moj/vendor/govuk-frontend/_base.scss
1 │ @forward "pkg:govuk-frontend/dist/govuk/base" with ($govuk-suppressed-warnings: ());
  │ ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ new load
  ╵
  ┌──> node_modules/govuk-frontend/dist/govuk/index.scss
1 │ @forward "base";
  │ ━━━━━━━━━━━━━━━ original load
  ╵
  node_modules/@ministryofjustice/frontend/moj/vendor/govuk-frontend/_base.scss 1:1   @forward
  node_modules/@ministryofjustice/frontend/moj/vendor/govuk-frontend/_index.scss 8:1  @forward
  node_modules/@ministryofjustice/frontend/moj/_base.scss 5:1                         @forward
  node_modules/@ministryofjustice/frontend/moj/all.scss 1:1                           @use
  use.scss 3:1                  
```

### Enabling compilation

Removing the `with` clause configuring `govuk-frontend` in `@ministryofjustice/frontend`'s `vendor/govuk-frontend/_base.scss` solves the error... but compilation still breaks because `vendor/govuk-frontend/_base.scss` tries to configure the `base` module as well.

```sh
Error: This module was already loaded, so it can't be configured using "with".
   ┌──> node_modules/@ministryofjustice/frontend/moj/vendor/govuk-frontend/_base.scss
1  │   @forward "pkg:govuk-frontend/base";
   │   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ new load
   ╵
   ┌──> node_modules/govuk-frontend/dist/govuk/index.scss
1  │   @forward "base";
   │   ━━━━━━━━━━━━━━━ original load
   ╵
   ┌──> node_modules/@ministryofjustice/frontend/moj/vendor/govuk-frontend/_index.scss
8  │ ┌ @forward "base" with (
9  │ │   // Assets override
10 │ │   $govuk-assets-path: $moj-assets-path,
11 │ │   $govuk-images-path: $moj-images-path,
12 │ │   $govuk-fonts-path: $moj-fonts-path,
13 │ │ 
14 │ │   // Measurements override
15 │ │   $govuk-gutter: $moj-gutter,
16 │ │   $govuk-page-width: $moj-page-width,
17 │ │ 
18 │ │   // Typography override
19 │ │   $govuk-font-family: $moj-font-family,
20 │ │   $govuk-include-default-font-face: $moj-include-default-font-face
21 │ │ );
   │ └─^ configuration
   ╵
  node_modules/@ministryofjustice/frontend/moj/vendor/govuk-frontend/_base.scss 1:1   @forward
  node_modules/@ministryofjustice/frontend/moj/vendor/govuk-frontend/_index.scss 8:1  @forward
  node_modules/@ministryofjustice/frontend/moj/_base.scss 5:1                         @forward
  node_modules/@ministryofjustice/frontend/moj/all.scss 1:1                           @use
  use.scss 3:1                                                                        
```

To fix that one, we need to update how GOV.UK Frontend can be configured, allowing not only to do `@use ... with`, but also to call a `govuk-configure` mixin for late configuration after `govuk-frontend` has already been loaded.

In case of what MoJ Frontend was configuring:

```scss
@include govuk-configure((
  // Assets override
  assets-path: $moj-assets-path,
  images-path: $moj-images-path,
  fonts-path: $moj-fonts-path,

  // Measurements override
  gutter: $moj-gutter,
  page-width: $moj-page-width,

  // Typography override
  font-family: $moj-font-family,
  include-default-font-face: $moj-include-default-font-face
))
```

Unfortunately, Sass doesn't make our job easy there, as it [doesn't have a dynamic way to assign values to variables (see 'Heads up')](https://sass-lang.com/documentation/variables/#advanced-variable-functions). So we'll either need to:
1. manually maintain the variables that can be assigned through the mixin, which facilitates configuration with `@use ... with` but be tricky to maintain

    ```scss
    @use "settings" as *;

    /// Only configure the variables set by MoJ Frontend
    /// We may also want to use `meta.keywords` to have 
    /// a clearer mapping between the names of our internal settings
    /// and the arguments of the function
    /// https://sass-lang.com/documentation/modules/meta/#keywords
    @mixin govuk-configure($settings) {
        // Assets override
        $govuk-assets-path: map.get($settings,assets-path) !global;
        $govuk-images-path: map.get($settings, images-path) !global;
        $govuk-fonts-path: map.get($settings,fonts-path) !global;

        // Measurements override
        $govuk-gutter: map.get($settings,gutter) !global;
        $govuk-page-width: map.get($settings,page-width) !global;

        // Typography override
        $govuk-font-family: map.get($settings, font-family) !global;
        $govuk-include-default-font-face: map.get($settings, include-default-font-face) !global;
    }
    ```
2. move to organising our settings in a map, which would facilitate the configuration through the mixin (because we could easily `map.set` from the settings we receive) but make `@use ... with` a little more verbose and less standard.

Another thing to consider is what happens to user configuration. For example if someone does the following:

```scss
@use 'pkg:govuk-frontend' with (
    $govuk-page-width: 1400px
);
@use 'pkg:@ministryofjustice/frontend'; // Which also configures page-width
```

How would MoJ Frontend understand that GOV.UK Frontend has already been configured? We may need:
- an API for other Design Systems to understand whether GOV.UK Frontend has already been configured
- preventing configuration of variables with Sass' `@use ... with` in favour of late configuration through the mixin

    ```scss
    @use 'pkg:govuk-frontend' as *;
    @use 'pkg:@ministryofjustice/frontend';

    @include govuk-configure((
        page-width: 1400px
    ));
    ```

Both approach are not incompatible with each other. If `@use ... with` configured a `$govuk-settings` `Map` variable rather than individual setting variables, we could support both:

- early configuration, as it'd be easy for later libraries to check if `$govuk-settings` has a specific key
- late configuration through the mixin, which would also be used to apply the configuration from `$govuk-settings`

This requires a deeper discussion 😊

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

HMRC Frontend does not get the configured values either. Thinking this is due to HMRC Frontend `@import`ing GOV.UK Frontend internally, leading to Sass re-loading an unconfigured stylesheets from GOV.UK Frontend when HMRC Frontend is loaded as a module.

```scss
@use 'pkg:govuk-frontend'
//  @import 'base'
@use 'pkg:hmrc-frontend'
// @import "../../../../govuk-frontend/dist/govuk/helpers/links"; 
```

## TODO

- [ ] Raise an issue on MoJ Frontend repository to let them know of issues resolving `govuk-frontend` when the library is hoisted by npm. Recommendation would be to use `pkg:` URLs, but it's likely a breaking change.
- [ ] Investigate what will happen when we publish 6.2.0. Will there be errors in Prototype Kit projects running MoJ and GOV.UK Frontend in parallel?
- [ ] What's happening to `govuk-functional-colour` when used with `@import`? Are other functions affected?
- [ ] Check with MoJ why they're clearing the list of suppressed warning in their library when loading `govuk-frontend`'s base
    - [ ] Devise a way to restore the feature if necessary
- [ ] Decide how to let libraries configure GOV.UK Frontend while allowing the configuration to be overriden by users.
