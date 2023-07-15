function rgb_to_hsl(rgb, add=0, scale=1) {
	if (typeof rgb === "string") {
		if (rgb[0] === "#")
			rgb = rgb.substring(1)
		rgb = parseInt(rgb, 16)
	}

	let r = ((rgb >> 16) & 255) / 255
	let g = ((rgb >> 8) & 255) / 255
	let b = ((rgb) & 255) / 255
	let cmin = Math.min(r, g, b)
	let cmax = Math.max(r, g, b)
	let delta = cmax - cmin
	let h = 0, s = 0, l = 0

	if (delta == 0)
		h = 0
	else if (cmax == r)
		h = ((g - b) / delta) % 6
	else if (cmax == g)
		h = (b - r) / delta + 2
	else
		h = (r - g) / delta + 4

	h = Math.round(h * 60)

	if (h < 0)
		h += 360

	l = (cmax + cmin) / 2

	s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

	l = Math.max(0, Math.min(1, l * scale + add))

	s = Math.round(s * 100)
	l = Math.round(l * 100)

	return "hsl(" + h + "," + s + "%," + l + "%)"
}

function foo(sel, rgb) {
	let bg = rgb_to_hsl(rgb, 0.00, 1.00)
	let hi = rgb_to_hsl(rgb, 0.15, 1.00)
	let sh = rgb_to_hsl(rgb, -0.15, 1.00)
	let bd = rgb_to_hsl(rgb, 0.00, 0.33)
	console.log(sel + ` { background-color: ${bg}; border-color: ${hi} ${sh} ${sh} ${hi}; box-shadow: 0 0 0 1px ${bd}, 0px 1px 4px #0008; }`)
}

foo(".tile.red", "ef0d0e")
foo(".tile.white", "efefef")
foo(".tile.blue", "1895d7")
foo(".tile.gold", "ebce42")
foo(".tile.green", "426545")

