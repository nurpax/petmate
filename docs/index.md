---
title: Petmate
---

# Petmate

Petmate is a cross-platform C64 PETSCII image editor, drawing inspiration from the [PETSCII](http://www.kameli.net/marq/?page_id=2717) editor.

Petmate runs locally on a Mac/Windows/Linux machine and doesn't require an internet connection.

![Screenshot](img/screenshot1.png)

## Download Petmate
{:.downloads}
* MacOS: <a href='http://nurpax.com/petmate/releases/mac/Petmate-0.1.0.dmg'>Petmate-0.1.0.dmg</a>
* Windows: <a href='http://nurpax.com/petmate/releases/win/Petmate%20Setup%200.1.0.exe'>Petmate Setup 0.1.0.exe</a>
* Linux: <a href='http://nurpax.com/petmate/releases/linux/petmate_0.1.0_amd64.deb'>petmate_0.1.0_amd64.deb</a> (untested!)

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

Open/Save/Save As: use platform shortcuts (e.g., Save is `Ctrl+S` on Windows, `⌘S` on Mac).

Undo/Redo: use platform shortcuts (e.g., `⌘Z` and `⌘⇧Z` on Mac).

## Release history

Petmate 0.1.0 (2018-07-29)

