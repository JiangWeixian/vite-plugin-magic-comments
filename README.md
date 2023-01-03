# vite-plugin-magic-comments
> Similar works like https://webpack.js.org/api/module-methods/#magic-comments

Most codes inspired from <https://github.com/CaptainLiao/vite-plugin-webpackchunkname>

Support follow magic comments:

- `webpackChunkName` or `chunkName` - define chunk name
- `webpackPrefetch` or `prefetch` - transform `index.html`, add prefetch link into html meta
- `webpackPreload` or `preload` - transform `index.html`, add preload link into html meta

## usage

```ts
import(
  /* webpackChunkName: my-chunk-name */
  /* webpackPreload: true */
  /* webpackPrefetch: true */
  "module"
)
```
