---
title: Petmate
---

# Petmate

Petmate is a cross-platform C64 PETSCII image editor, drawing inspiration from the [PETSCII](http://www.kameli.net/marq/?page_id=2717) editor.

Petmate runs locally on a Mac/Windows/Linux machine and doesn't require an internet connection.

![Screenshot](img/screenshot1.png)

## Download Petmate
{:.downloads}
* MacOS: <a href='http://nurpax.com/petmate/releases/mac/Petmate-0.2.0.dmg'>Petmate-0.2.0.dmg</a>
* Windows: <a href='http://nurpax.com/petmate/releases/win/Petmate%20Setup%200.2.0.exe'>Petmate Setup 0.2.0.exe</a>
* Linux: <a href='http://nurpax.com/petmate/releases/linux/petmate_0.2.0_amd64.deb'>petmate_0.2.0_amd64.deb</a> (untested!)

## Features

- Commodore 64 standard character mode graphics with the uppercase system ROM character set
- Drawing operations: draw character, colorize a character, select brush, draw with brush
- Undo/redo stack
- Multiple screens (each with their own undo stack)
- Save/load workspace as a .petmate file (.petmate is the native file format for this editor)
- Export and import other common PETSCII file formats:
  - Bitmap .png (export)
  - PETSCII .c format (import, export)
  - Executable .prg (export)

This project is work-in-progress.  You can view [github issues](https://github.com/nurpax/petmate/issues) for upcoming features/fixes.

## Keyboard shortcuts

- `ESC` - reset brush selection
- `a`, `s`, `d`, `w` - move left/down/right/up in the character selector.
- `Left/right arrows` - move to previous/next screen
- `Start drawing while holding SHIFT` - lock vertical or horizontal movement for drawing straight lines.
- `q`, `e`: Select prev/next color.
- `⌘1-4 / Ctrl+1-4`: Switch between palettes.  Use the Preferences pane to configure palettes.
- `h`, `v`: Flip brush horizontally/vertically
- `x`, `c`, `b`: Select tool (draw, colorize, brush)
- `1`, `2`, `3`: Same as x, c, b.

Open/Save/Save As: use platform shortcuts (e.g., Save is `Ctrl+S` on Windows, `⌘S` on Mac).

Undo/Redo: use platform shortcuts (e.g., `⌘Z` and `⌘⇧Z` on Mac).

## Preferences

The settings are saved in the following location:

- macOS: `~/Library/Application\ Support/Petmate/Settings`
- Windows: `%APPDATA%/Petmate/Settings`
- Linux: `$XDG_CONFIG_HOME/Petmate` or `~/.config/Petmate`

## Release history

Petmate 0.2.3 (2018-08-07)
- Add keyboard shortcuts for choosing the current tool ('x'-draw, 'c'-colorize, 'b'-select brush, the same are mapped to '1', '2' and '3' too.) ([#54](https://github.com/nurpax/petmate/issues/54))
- Fix png export bug introduced in 0.2.2

Petmate 0.2.2 (2018-08-06)

- Color palette selection (vice, colodore, etc.) ([#21](https://github.com/nurpax/petmate/issues/21))
- Add application icon ([#73](https://github.com/nurpax/petmate/issues/73))
- BUGS in this version: color palette selection breaks .png export.

Petmate 0.2.1 (2018-08-05)
- Add "smart" vertical and horizontal mirroring ([#62](https://github.com/nurpax/petmate/issues/62))
- Show border color on screen thumbnails ([#69](https://github.com/nurpax/petmate/issues/69))
- Add a Preferences item in the app menu (macOS only), close preferences with ESC
- Use 'q', 'e' instead of COMMAND-left/right to cycle currently selected color ([#58](https://github.com/nurpax/petmate/issues/58))
- Remove secondary icon for brushes ([#53](https://github.com/nurpax/petmate/issues/53))
- Fix shift axis locking bug ([#68](https://github.com/nurpax/petmate/issues/68))
- Draw a line between current and previous drag position ([#68](https://github.com/nurpax/petmate/issues/68))

Petmate 0.2.0 (2018-08-03)
- Multiple, customizable palettes (saved in Preferences) ([#58](https://github.com/nurpax/petmate/issues/58))
- Added keyboard shortcuts for selecting next/prev color and shortcuts to switch between color palettes.
- Added automatic switching to character drawing when the user selects a character or a color ([#64](https://github.com/nurpax/petmate/issues/64))
- Inherit previous screen colors when adding a new screen ([#63](https://github.com/nurpax/petmate/issues/63))


Petmate 0.1.1 (2018-07-31)
- Fix [mouse drawing drag end doesn't always get detected correctly](https://github.com/nurpax/petmate/issues/45)
- Implement [Hold down SHIFT while drawing for straight lines](https://github.com/nurpax/petmate/issues/9)

Petmate 0.1.0 (2018-07-29)

