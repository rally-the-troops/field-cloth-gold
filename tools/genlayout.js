const fs = require("fs")

const { round, floor, ceil } = Math

let boxes = {}
let mode, name, x, y, w, h, cx, cy, rx, ry
let scale = 0.75

function flush() {
	if (mode === 'rect') {
		boxes[name] = [ x * scale |0, y * scale |0, w * scale |0, h * scale |0 ]
	}
	if (mode === 'circle') {
		x = cx - rx
		y = cy - ry
		w = rx * 2
		h = ry * 2
		boxes[name] = [ x * scale |0, y * scale |0, w * scale |0, h * scale |0 ]
	}
	x = y = w = h = cx = cy = rx = ry = 0
	name = null
}

for (let line of fs.readFileSync("tools/layout.svg", "utf-8").split("\n")) {
	line = line.trim()
	if (line.startsWith("<rect")) {
		flush()
		mode = "rect"
		x = y = w = h = 0
	} else if (line.startsWith("<ellipse")) {
		flush()
		mode = "circle"
		cx = cy = rx = ry = 0
	} else if (line.startsWith('x="'))
		x = round(Number(line.split('"')[1]))
	else if (line.startsWith('y="'))
		y = round(Number(line.split('"')[1]))
	else if (line.startsWith('width="'))
		w = round(Number(line.split('"')[1]))
	else if (line.startsWith('height="'))
		h = round(Number(line.split('"')[1]))
	else if (line.startsWith('cx="'))
		cx = round(Number(line.split('"')[1]))
	else if (line.startsWith('cy="'))
		cy = round(Number(line.split('"')[1]))
	else if (line.startsWith('rx="'))
		rx = round(Number(line.split('"')[1]))
	else if (line.startsWith('ry="'))
		ry = round(Number(line.split('"')[1]))
	else if (line.startsWith('inkscape:label="'))
		name = line.split('"')[1]
}

flush()

console.log("const boxes = {")
for (let key in boxes)
	console.log("\t\"" + key + "\": " + JSON.stringify(boxes[key]) + ",")
console.log("}")
