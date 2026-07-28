/**
 * Default quality for site imagery.
 *
 * `@astrojs/vercel`'s image service falls back to `quality = 100` when nothing
 * is specified, which produces multi-megabyte files and makes Vercel skip WebP
 * conversion entirely at large widths (you get a giant JPEG instead). 75 is the
 * normal range for web photography — visually near-identical, ~14x smaller.
 */
export const IMAGE_QUALITY = 75;

/** Widths the Vercel image service is configured to serve (see astro.config.mjs). */
export const GALLERY_THUMB_WIDTH = 640;
export const GALLERY_FULL_WIDTH = 1920;
