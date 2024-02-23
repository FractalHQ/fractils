# fractils

## 3.1.3

### Patch Changes

-   [fix] add wildcard exports ([`11c4c0083ee2afbf95c305c4a71e9c2171645de9`](https://github.com/FractalHQ/fractils/commit/11c4c0083ee2afbf95c305c4a71e9c2171645de9))

## 3.1.2

### Patch Changes

-   [fix] a11y warnings / import.meta usage ([`6ef7e5f`](https://github.com/FractalHQ/fractils/commit/6ef7e5f1d69952c2a5fb263e25bfb208a97b1fea))

## 3.1.1

### Patch Changes

-   fix action types & event.d error ([#17](https://github.com/FractalHQ/fractils/pull/17))

## 3.1.0

### Minor Changes

-   [fix] Themetoggle a11y warnings ([`4108daf`](https://github.com/FractalHQ/fractils/commit/4108dafb784152fa9f116689d40f8b35a7bb4437))

## 3.0.2

### Patch Changes

-   [fix] more reliable browser checks ([`d1f9702`](https://github.com/FractalHQ/fractils/commit/d1f97029948836572ee5b304fc94fb22c81f098e))

## 3.0.1

### Patch Changes

-   [fix] log() not firing in dev ([`74cd14b`](https://github.com/FractalHQ/fractils/commit/74cd14b23cd6066f43b77e0d09e92a79f405404e))

## 3.0.0

### Major Changes

-   [release] major v3.0.0 ([`f5c4a5a`](https://github.com/FractalHQ/fractils/commit/f5c4a5af43a50ed411eefb39ad26948e8546151a))

    -   new visibility action API - now prefixed with 'v' (i.e. 'f-change' -> 'v-change') - 'f-leave' is now 'v-exit'
    -   separate sync/async localStorageStores - the old localStorageStore is now 'asyncLocalStorageStore' - localStorageStore is a simpler syncronous version
    -   updated to the latest sveltekit / vite
    -   now publishing build to github
    -   better action types
    -   fixed some examples

### Minor Changes

-   New clamp util + docs improvements. ([`76beda0`](https://github.com/FractalHQ/fractils/commit/76beda07c574a0ba09df072ca6ad21aff26cde57))

## 2.0.3

### Patch Changes

-   [fix] export mobileThreshold and clickOutside types ([`bb4cd8c`](https://github.com/FractalHQ/fractils/commit/bb4cd8ca0693ff2b628088e8bf5b09e055bcb4cc))

*   [fix] duplicate export ([`0052396`](https://github.com/FractalHQ/fractils/commit/005239692f4015dc7e52afbb5ce9155c12336120))

## 2.0.2

### Patch Changes

-   [fix] path to types ([`2f7fb10`](https://github.com/FractalHQ/fractils/commit/2f7fb10a8db83b71d2f6330705432a3d1dc77692))

## 2.0.1

### Patch Changes

-   [fix] file path ([`a36e2f8`](https://github.com/FractalHQ/fractils/commit/a36e2f837870a1463b6b0edfbb9a53f0f8ab0221))

## 2.0.0

### Major Changes

-   remove old event names from visibility ([#7](https://github.com/FractalHQ/fractils/pull/7))

*   [feat] Refactor clickOutside ([#7](https://github.com/FractalHQ/fractils/pull/7))

    -   No longer takes a callback as an argument.
    -   Now takes an optional { whitelist: [] } param
    -   Callback should now be passed to the on:outclick event.

### Patch Changes

-   [fix] add types / fix color ([#7](https://github.com/FractalHQ/fractils/pull/7))

*   [fix] visibility types ([#7](https://github.com/FractalHQ/fractils/pull/7))
