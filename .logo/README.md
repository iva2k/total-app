# Icon Files Creation

This folder is for vector graphics source files. SVG files can be created in free software, such as [Inkscape](https://inkscape.org).

## Files

Place the following SVG files in this directory:

- logo.svg - small logo for favicon, typically without text and square, targeting 16x16px to 48x48px sizes
- icon.svg - used for app icons, typically larger and can contain some text, targeting up to 512x512px size
- icon_bg.svg - used for app icons on Apple, same as icon.svg but should have no transparency, targeting up to 180x180px size

## Install Software

For image conversion & generation script install the following software:

- Python 3 : Visit <https://www.python.org> to install.
- Scour : Visit <https://github.com/scour-project/scour> to install. Run `pip install scour`.
- Inkscape : Visit <https://inkscape.org> to install.
- OptiPNG : Visit <https://optipng.sourceforge.net> to install.
- ImageMagick : Visit <https://imagemagick.org> to install.

## Generate

All app graphics assets (favicon, logo, app icons) can be automatically generated with command:

```bash
pnpm icons:build
```

## Other

To compress SVG files (e.g. remove editor metadata), use SVGO <https://github.com/svg/svgo>:

```bash
pnpm -g install svgo
# Processing single files:
svgo logo.svg -o logo.min.svg
```

TODO: (when needed): Update 'scripts/icon-generator.sh' to use SVGO.
