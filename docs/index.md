---
title: Petmate
---

# Petmate

Petmate is a cross-platform C64 PETSCII image editor.

Petmate runs locally on a Mac/Windows/Linux machine and doesn't require an internet connection.

![Petmate screenshot w/ PETSCII by Manuel Vio](img/screenshot1.png)

## Download Petmate
{:.downloads}
* MacOS: <a href='http://nurpax.com/petmate/releases/mac/Petmate-0.8.3.dmg'>Petmate-0.8.3.dmg</a>
* Windows: <a href='http://nurpax.com/petmate/releases/win/Petmate%20Setup%200.8.3.exe'>Petmate Setup 0.8.3.exe</a>
* Linux: <a href='http://nurpax.com/petmate/releases/linux/petmate_0.8.3_amd64.deb'>petmate_0.8.3_amd64.deb</a>

## Features

- Commodore 64 standard character mode graphics with the upper/lower case system ROM character sets and custom .64c charsets.
- Drawing operations: draw character, colorize a character, select brush, draw with brush
- Undo/redo stack
- Multiple screens (each with their own undo stack)
- Save/load workspace as a .petmate file (.petmate is the native file format for this editor)
- Export and import other common PETSCII file formats:
  - Bitmap .png (import, export)
  - PETSCII .c format (import, export)
  - Executable .prg (export)
  - Assembler .asm (export for KickAssembler, 64tass and ACME)
  - Dir art .d64 (import)

You can view [github issues](https://github.com/nurpax/petmate/issues) for upcoming features/fixes.

## Keyboard shortcuts

General:

- `ESC`: Reset brush selection
- `a`, `s`, `d`, `w`: Move left/down/right/up in the character selector
- `q`, `e`: Select prev/next color
- `f`: Select the inverted version of the currently selected char.
- `h`, `v`: Flip brush horizontally/vertically
- `r`: Rotate current brush or character counterclockwise
- `x`, `c`, `3`, `b`, `z`: Select tool (draw/colorize/char-only draw/brush/pan+zoom)
- `1`, `2`, `3`, `4`, `5`, `6`: Select tool (draw/colorize/char-only draw/brush/text/pan+zoom)
- `g`: Toggle grid
- `Alt-Left Click`: Select character and color under cursor
- `Start drawing while holding SHIFT`: Lock vertical or horizontal movement for drawing straight lines
- `⌘1-4 / Ctrl+1-4`: Switch between palettes.  Use the Preferences pane to configure palettes
- `Left/right arrows`: Move to previous/next screen
- `Alt-left/right/up/down`: Shift the whole screen left/right/up/down
- `⌘T/Ctrl-T`: Add a new screen.

Pan/zoom (new in Petmate 0.7):
- When in pan/zoom mode: `mousedrag` to pan the PETSCII canvas
- When in pan/zoom mode: `Alt-mousewheel` to zoom in/out
- When in pan/zoom mode: `doubleclick` to reset zoom/pan position.
- `Spacebar-mousedrag`: Pan the PETSCII canvas (if zoomed in) in all modes except text input mode
- `Alt-mousewheel`: Zoom in/out in all modes except text input mode

Open/Save/Save As: use platform shortcuts (e.g., Save is `Ctrl+S` on Windows, `⌘S` on Mac).

Undo/Redo: use platform shortcuts (e.g., `⌘Z` and `⌘⇧Z` on Mac).

Custom fonts/charsets: Use the `File/Fonts` menu.

## Using Petmate to edit Dir Art

Petmate 0.7.0 adds experimental support for editing directory art in C64 .d64 disk image files.

The process of making directory art with Petmate is as follows:

1. Create a 16xN screen in Petmate.  (Or alternatively, load in a .d64 that already contains several directory entries.)
2. Export the 16xN screen as a .json file.
3. Use [c1541js](https://www.npmjs.com/package/c1541) to patch your art into a .d64 file.  The .d64 file must contain an appropriate amount of directory entries, you can use f.ex. VICE's `c1541` tool to author such .d64 files.

A command line example for step #3:

Let's say you have a .d64 file called `demo1.d64` and your dir art is exported into a file called `dirart.json`.  Run the following command:

```
# Patch in dirart using demo1.d64 as the source and write
# the result into demo1-result.d64:

c1541js --json dirart.json demo1.d64 demo1-result.d64
```

At the time of writing (2019-03-16), Petmate doesn't validate that the contents of your dir art make sense as directory entries.  It will just write whatever screencodes you used in your Petmate screen.  The special character control codes will be shown more prominently in future Petmate versions.

## Processing PETSCII content

Petmate 0.7 adds a new .json export format.  It is intended to stay unchanged across Petmate versions and its intended to be easy to consume by content processing scripts written in say Python or JavaScript.

The structure of Petmate's .json export format is pretty simple:

```
{
    "version": 1,
    "framebufs": [
        {
            "width": 16,
            "height": 14,
            "backgroundColor": 6,
            "borderColor": 14,
            "charset": "upper",
            "name": "screen_003",
            "screencodes": [ ... ],   # a flat array of width*height screencodes
            "colors": [ ... ],        # a flat array of width*height colors
        }
    ]
}
```

## Importing PETSCII from PNG image files

As of version 0.6.0, Petmate supports importing PETSCII from PNG images.  This import feature matches pixel data against the C64 ROM charsets (upper and lower case fonts).  There is no "fuzzy" machine vision style matching, the code doing the import is looking for a pixel perfect match.  This means images that have been scaled (double pixeled or other scale ratio) cannot currently be imported.  The PNG importer also expects the image dimensions and borders to match those of VICE:

- 320x200 for borderless images
- 384x272 for images with border (left and right border width 32 pixels, top border 35 pixels, bottom 37 pixels).

Colors are matched by quantizing the input pixels into indexed color by looking at the closest mean square error against all the color palettes supported by Petmate, and picking the match that has the smallest mean square error.  If the input image contains colors that are wildly different from the Petmate prebaked palettes, some colors may come out wrong.  Please report any problems via [GitHub issues](https://github.com/nurpax/petmate/issues).

## Preferences

The settings are saved in the following location:

- macOS: `~/Library/Application\ Support/Petmate/Settings`
- Windows: `%APPDATA%/Petmate/Settings`
- Linux: `$XDG_CONFIG_HOME/Petmate` or `~/.config/Petmate`

## Release history

Petmate 0.8.3 (2021-01-27)
- Thank you [https://github.com/manuelvio](https://github.com/manuelvio) for .pet export and grid changes!
- Add .pet export format ([#204](https://github.com/nurpax/petmate/issues/204))
- Show grid uses different blend mode that works better against diffrent background colors ([#199](https://github.com/nurpax/petmate/issues/199))
- Use simpler assembler syntax in .asm output to make it compile on CBM prg Studio ([#195](https://github.com/nurpax/petmate/issues/195))

Petmate 0.8.2 (2020-02-11)
- Add an integer scale PNG export option for allowing to scale width/height up by an integer.  Previously only doubling width and height was supported.  Thank you [https://github.com/Krad23](https://github.com/Krad23) for the pull request! ([#187](https://github.com/nurpax/petmate/issues/187))
- Custom fonts are now supported in PRG export ([#183](https://github.com/nurpax/petmate/issues/183))
- Add an about menu item for Linux and Windows.  Handy for looking up the current Petmate version. ([#186](https://github.com/nurpax/petmate/issues/186))
- Upgrade to Electron 8.0.

Petmate 0.8.1 (2020-01-04)
- Add support for setting up custom fonts when exporting a stand-alone assembly file.
- Add CA65 and c64jasm support for assembly export ([#166](https://github.com/nurpax/petmate/issues/166))
- Fix gif export bug with more than 64 frame gif anims ([#166](https://github.com/nurpax/petmate/issues/166))

Petmate 0.8.0 (2019-12-17)
- Add custom charsets ([#174](https://github.com/nurpax/petmate/issues/174)).  You can load .64c font files from [http://kofler.dot.at/c64/font_01.html](http://kofler.dot.at/c64/font_01.html).  Fonts cannot be edited within Petmate -- but this will probably get added in later releases.
- Increase the size of gif Frame delay input width ([#165](https://github.com/nurpax/petmate/issues/165))
- Choose different outline color for a defined brush opposed to an empty one ([#163](https://github.com/nurpax/petmate/issues/163))

Petmate 0.7.1 (2019-06-03)
- Add SEQ file format import and export.  Thanks [@sixofdloc](https://github.com/sixofdloc) and [@manuelvio](https://github.com/manuelvio) for your contribution!
- Fix a bug that caused most keyboard shortcuts from not working when loading a file.  Affected platforms: Windows and Linux.  This was a mega irritating bug that was possible to work-around by switching to another app and then back to Petmate.  ([#161](https://github.com/nurpax/petmate/issues/161))

Petmate 0.7.0 (2019-03-16)
- Arbitrary sized PETSCII canvas (edit the 40x25 text below the new screen + button and hit +) ([#20](https://github.com/nurpax/petmate/issues/20))
- Pan/zoom the PETSCII canvas
- A new .json export format intended to be easy to consume by content processing scripts.
- Prompt for cancel/quit if unsaved changes when closing the main window or quitting. ([#33](https://github.com/nurpax/petmate/issues/33))
- Support importing Dir art from .d64 files.
- Register recently opened/saved .petmate to the OS to make recently edited .petmate files show up on macOS Dock or Windows JumpList. ([#133](https://github.com/nurpax/petmate/issues/133))
- Add comments in exported .asm files that explain the exported PETSCII memory layout ([#143](https://github.com/nurpax/petmate/issues/143))
- Make open/save dialogs modal ([#136](https://github.com/nurpax/petmate/issues/136))
- Display decimal value of a char in addition to hex. ([#141](https://github.com/nurpax/petmate/issues/141))
- Bug fix: disable GPU rendering.  This caused slowdown with larger than 40x25 canvases and forced bilinear filtering instead of nearest-neighbor for scaled canvas.

Petmate 0.6.1 (2019-02-12)
- Bug fix: PNG export crashed Petmate on Windows.  Fixed by upgrading Electron to version 4.0.4.
- Bug fix: screen name editing only ever updated the currently selected screen name.  ([#128](https://github.com/nurpax/petmate/issues/128))

Petmate 0.6.0 (2019-01-01)
- Import PETSCII from PNG.  Please see above docs for limitations.  ([#92](https://github.com/nurpax/petmate/issues/92))
- Add an "include border" in PNG and GIF export ([#109](https://github.com/nurpax/petmate/issues/109))
- Add click-to-open a .petmate file in Windows Explorer and macOS Finder ([#48](https://github.com/nurpax/petmate/issues/48)).  Not tested on Linux so probably doesn't work there.
- Make backspace do something reasonable in text mode ([#108](https://github.com/nurpax/petmate/issues/108))
- Remove screen name validation pattern ([#124](https://github.com/nurpax/petmate/issues/124))
- Port all code to TypeScript.  This was a really big change -- found and fixed some bugs but may have introduced new ones.  Please report any findings!

Petmate 0.5.0 (2018-11-23)
- Upgrade to Electron 2.0.2 to Electron 3.0.9.  This should make Petmate work on the latest Ubuntu released.
- Add shift tool that can be used to move the whole PETSCII canvas around with `Alt-left/right/up/down`.  ([#81](https://github.com/nurpax/petmate/issues/81))
- Add a "new screen" menu item in the application.  This also adds a keyboard shortcut `⌘T/Ctrl-T` for the same.
- Fix keyboard shortcuts when the capslock is on ([#119](https://github.com/nurpax/petmate/issues/119))
- Dragging a .petmate file on top of the application window will open it in Petmate. ([#48](https://github.com/nurpax/petmate/issues/48))
- Supper lowercase/uppercase charsets in .prg/.asm/.bas export ([#110](https://github.com/nurpax/petmate/issues/110))
- Completely new Electron build.  Removed some MAJOR cruft from the project structure by switching to a simple Create React App based build using just CRA and electron-builder.

Petmate 0.4.1 (2018-09-04)
- Add 32-bit build for Windows.
- Fix several keyboard shortcut related bugs: [#112](https://github.com/nurpax/petmate/issues/112), [#111](https://github.com/nurpax/petmate/issues/111), [#105](https://github.com/nurpax/petmate/issues/105), [#97](https://github.com/nurpax/petmate/issues/97)

Petmate 0.4.0 (2018-09-02)
- Re-order screens by dragging.  Assign names to screens that get output to exported .asm file symbol names.
- Text input tool.
- Upper/lower case font support.
- Resize painting canvas relative to window size.  Check the Settings pane for options related to this.
- Improved performance.

Petmate 0.3.2 (2018-08-21)
- Layout changes: change the size and position of the color picker ([#93](https://github.com/nurpax/petmate/issues/93)) and make the top thumbnails bigger ([#91](https://github.com/nurpax/petmate/issues/91))
- Add 'find the inverted version of the current char' feature.  This is bound to the 'f' key
- Bug fix: The Alt key (or Ctrl on macOS) would get stuck in down state when tabbing in and out of Petmate ([#94](https://github.com/nurpax/petmate/issues/94))

Petmate 0.3.1 (2018-08-16)
- Display current mouse x,y character coordinates and screencode under cursor ([#88](https://github.com/nurpax/petmate/issues/88))
- Fix a bug where exporting a PETSCII screen in BASIC or asm would pick the border and background colors from the first screen and not the currently active screen ([#78](https://github.com/nurpax/petmate/issues/78))
- Default to 'inverted space' (e.g., 8x8 block) character on application init ([#83](https://github.com/nurpax/petmate/issues/83))
- UI layout clean up ([#77](https://github.com/nurpax/petmate/issues/77), [#76](https://github.com/nurpax/petmate/issues/76))


Petmate 0.3.0 (2018-08-11)
- Add brush rotation ([#70](https://github.com/nurpax/petmate/issues/70))
- Add "character only" drawing mode (e.g., change screencode but leave color untouched) ([#50](https://github.com/nurpax/petmate/issues/50))
- Add t64ass and ACME .asm export ([#13](https://github.com/nurpax/petmate/issues/13))
- Add BASIC export (w/ BASIC display code from @Esshahn) ([#14](https://github.com/nurpax/petmate/issues/14))
- Add togglable grid on top of painting canvas ([#16](https://github.com/nurpax/petmate/issues/16))

Petmate 0.2.5 (2018-08-09)
- New export options for PNG ([#55](https://github.com/nurpax/petmate/issues/55))
  - Double width & height for PNG export
  - Add transparent pixel to prevent Twitter from transcoding a PNG to JPEG
- Add support for exporting to assembly listing (KickAssembler only in this version) ([#13](https://github.com/nurpax/petmate/issues/13))
- Import all screens from a .c PETSCII file (not just the first one) ([#15](https://github.com/nurpax/petmate/issues/15))
- Work-in-progress BASIC listing export ([#14](https://github.com/nurpax/petmate/issues/14))
- Alt-leftclick will select the draw mode if used when the brush mode is active.  Similarly, switch to draw mode from brush or colorize modes when the user selects a new screencode from the character select pane.

Petmate 0.2.4 (2018-08-08)
- Add "pick character and color under cursor" with alt-left-click ([#8](https://github.com/nurpax/petmate/issues/8), [#54](https://github.com/nurpax/petmate/issues/54))

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
