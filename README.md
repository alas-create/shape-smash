# Shape Smash

A physics slingshot game. Drag the orb back, let go, and smash every shape on the field.

## How to play

- Drag the orb back and release to launch it. The dotted line shows the rough path.
- Tap or click while the orb is flying (or press Space) to slam it down.
- Impacts smash shapes. Diamonds take three hits. Stars blast the shapes around them.
- Clear every shape before you run out of shots. Unused shots earn a bonus.
- Pause with the II button or Esc / P. Restart with R. Mute with M.

## Two themes

When you press Play, the game asks "Are you Daelan Revv?"

- **Yes:** the claymation theme, with soft plasticine shapes and pop messages.
- **No:** the riso print theme.

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

Progress and best scores are saved in the browser's localStorage.

## Tech

Single HTML file with inline CSS and JavaScript, using Matter.js (loaded from cdnjs) and the Canvas 2D API. Fonts: Archivo and Archivo Black, plus Fredoka, from Google Fonts.

## Credits

Game ni Daelan. A Daelan original.

## License

MIT
