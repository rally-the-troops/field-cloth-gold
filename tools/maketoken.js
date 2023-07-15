const fs = require("node:fs")

function print_cylinder(output, w, h, tall, color) {
	let xoff = 1.5
	let yoff = 1.5

	let total_w = w + xoff * 2
	let total_h = h + tall + yoff * 2

	let cx = xoff + w / 2
	let cy = yoff + h / 2

	let rx = w / 2
	let ry = h / 2

	let svg = []
	svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${total_w}" height="${total_h}">`)

	svg.push(`<linearGradient id="g">`)
	svg.push(`<stop offset="0%" stop-color="${color[2]}"/>`)
	svg.push(`<stop offset="20%" stop-color="${color[3]}"/>`)
	svg.push(`<stop offset="50%" stop-color="${color[4]}"/>`)
	svg.push(`<stop offset="80%" stop-color="${color[3]}"/>`)
	svg.push(`<stop offset="100%" stop-color="${color[2]}"/>`)
	svg.push(`</linearGradient>`)

	let path = []
	path.push("M", xoff, cy)
	path.push("v", tall)
	path.push("a", rx, ry, 0, 0, 0, w, 0)
	path.push("v", -tall)

	svg.push(`<path stroke-width="1" fill="url(#g)" stroke="${color[0]}" d="${path.join(" ")}"/>`)
	svg.push(`<ellipse stroke-width="1" fill="${color[1]}" stroke="${color[0]}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`)

	svg.push('</svg>')

	fs.writeFileSync(output, svg.join("\n") + "\n")
}

let WHITE = [ 'hsl(0,0%,30%)', 'hsl(0,0%,90%)', 'hsl(0,0%,70%)', 'hsl(0,0%,80%)', 'hsl(0,0%,83%)' ]
let RED = [ 'hsl(359,85%,20%)', 'hsl(359,85%,50%)', 'hsl(359,85%,35%)', 'hsl(359,85%,45%)', 'hsl(359,85%,48%)' ]
let BLUE = [ 'hsl(220,85%,25%)', 'hsl(220,85%,55%)', 'hsl(220,85%,40%)', 'hsl(220,85%,50%)', 'hsl(220,85%,53%)' ]

// let W = 50, H = 33, T = 22
let W = 38, H = 25, T = 16

print_cylinder("images/token_white.svg", W, H, T, WHITE)
print_cylinder("images/token_red.svg", W, H, T, RED)
print_cylinder("images/token_blue.svg", W, H, T, BLUE)
