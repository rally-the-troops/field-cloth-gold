#!/bin/bash
pngtopnm tools/rock_overlay@2x.png | pnmnorm | pgmtoppm "#606060-#696969" | ppmquant 2 | pnmtopng > background.png
zopflipng -y background.png background.png
