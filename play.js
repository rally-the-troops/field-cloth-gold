"use strict"

const FIRST_TILE = 1
const TILE_BLUE = 1
const TILE_RED = 13
const TILE_GOLD = 25
const TILE_WHITE = 37
const TILE_GREEN = 49
const LAST_TILE = 54

const TILE_W = 56
const TILE_SPACE = TILE_W + 12

function calc_tile_spacing(n) {
	if (n > 12)
		return 744 / (n-1)
	return TILE_SPACE
}

const BOARD_X = 0
const BOARD_Y = 0 + (12 + 80 + 12)

const COURT1_X = 12
const COURT1_Y = 12 + (12)
const COURT2_X = 12
const COURT2_Y = 12 + (12 + 80 + 12 + 638 + 12)
const HAND_X = 12
const HAND_Y = 12 + (12 + 80 + 12 + 638 + 12 + 80 + 12)

const TOKEN_DX = 3
const TOKEN_DY = -5
const TILE_DX = 3
const TILE_DY = 3

const LAYOUT_OVAL = [
	[156,165,46,46],
	[262,165,46,46],
	[369,165,46,46],
	[475,165,46,46],
	[582,165,46,46],
	[688,165,46,46],
	[66,164,46,46],

	// dragon at home
	[67,106,46,46],

	// off-board
	[10,638-50],
	[110,638-50],
	[60,638-50],
	[160,638-50],
]

const LAYOUT_SQUARE = [
	[147,224,62,62],
	[253,224,62,62],
	[360,225,62,62],
	[466,225,62,62],
	[573,225,62,62],
	[679,225,62,62],
]

const LAYOUT_SCORE_0 = [358,332,46,46]
const LAYOUT_SCORE_39 = [748,547,46,46]

const SCORE_X0 = LAYOUT_SCORE_0[0] + TOKEN_DX + BOARD_X
const SCORE_Y0 = LAYOUT_SCORE_0[1] + TOKEN_DY + BOARD_Y
const SCORE_DX = (LAYOUT_SCORE_39[0] - LAYOUT_SCORE_0[0] + 4) / 7
const SCORE_DY = (LAYOUT_SCORE_39[1] - LAYOUT_SCORE_0[1] + 0) / 4

let ui = {
	board: document.getElementById("map"),
	court1: document.getElementById("court1"),
	court2: document.getElementById("court2"),
	red_score: null,
	blue_score: null,
	oval_spaces: [],
	square_spaces: [],
	tokens: [],
	tiles: [ null ],
}

let action_register = []

function register_action(e, action, id) {
	e.my_action = action
	e.my_id = id
	e.onmousedown = on_click_action
	action_register.push(e)
}

function on_click_action(evt) {
	if (evt.button === 0)
		if (send_action(evt.target.my_action, evt.target.my_id))
			evt.stopPropagation()
}

function is_action(action, arg) {
	if (arg === undefined)
		return !!(view.actions && view.actions[action] === 1)
	return !!(view.actions && view.actions[action] && view.actions[action].includes(arg))
}

function create(t, p, ...c) {
	let e = document.createElement(t)
	Object.assign(e, p)
	e.append(c)
	if (p.my_action)
		register_action(e, p.my_action, p.my_id)
	return e
}

function create_token(p) {
	let e = create("div", p)
	ui.board.appendChild(e)
	return e
}

function create_tile(p) {
	let e = create("div", p)
	return e
}

let on_init_once = false

function on_init() {
	if (on_init_once)
		return
	on_init_once = true

	for (let i = 0; i < 8; ++i) {
		ui.oval_spaces[i] = create("div", { className: "oval space", my_action: "space", my_id: i })
		ui.oval_spaces[i].style.left = (BOARD_X + LAYOUT_OVAL[i][0]) + "px"
		ui.oval_spaces[i].style.top = (BOARD_Y + LAYOUT_OVAL[i][1]) + "px"
		ui.oval_spaces[i].style.width = LAYOUT_OVAL[i][2] + "px"
		ui.oval_spaces[i].style.height = LAYOUT_OVAL[i][3] + "px"
		ui.board.append(ui.oval_spaces[i])
	}

	for (let i = 0; i < 6; ++i) {
		ui.square_spaces[i] = create("div", { className: "square space", my_action: "square", my_id: i })
		ui.square_spaces[i].style.left = (BOARD_X + LAYOUT_SQUARE[i][0]) + "px"
		ui.square_spaces[i].style.top = (BOARD_Y + LAYOUT_SQUARE[i][1]) + "px"
		ui.square_spaces[i].style.width = LAYOUT_SQUARE[i][2] + "px"
		ui.square_spaces[i].style.height = LAYOUT_SQUARE[i][3] + "px"
		ui.board.append(ui.square_spaces[i])
	}

	ui.red_score = create_token({ className: "token red", my_action: "score", my_id: 1 })
	ui.blue_score = create_token({ className: "token blue", my_action: "score", my_id: 2 })

	ui.tokens[0] = create_token({ className: "token white", my_action: "token", my_id: 0 })
	ui.tokens[1] = create_token({ className: "token red", my_action: "token", my_id: 1 })
	ui.tokens[2] = create_token({ className: "token red", my_action: "token", my_id: 2 })
	ui.tokens[3] = create_token({ className: "token blue", my_action: "token", my_id: 3 })
	ui.tokens[4] = create_token({ className: "token blue", my_action: "token", my_id: 4 })

	for (let i = TILE_BLUE; i < TILE_BLUE + 12; ++i)
		ui.tiles[i] = create_tile({ className: "tile blue", my_action: "tile", my_id: i })
	for (let i = TILE_RED; i < TILE_RED + 12; ++i)
		ui.tiles[i] = create_tile({ className: "tile red", my_action: "tile", my_id: i })
	for (let i = TILE_GOLD; i < TILE_GOLD + 12; ++i)
		ui.tiles[i] = create_tile({ className: "tile gold", my_action: "tile", my_id: i })
	for (let i = TILE_WHITE; i < TILE_WHITE + 12; ++i)
		ui.tiles[i] = create_tile({ className: "tile white", my_action: "tile", my_id: i })
	for (let i = TILE_GREEN; i < TILE_GREEN + 6; ++i)
		ui.tiles[i] = create_tile({ className: "tile green", my_action: "tile", my_id: i })
}

function show(elt) {
	if (elt.parentElement !== ui.board)
		ui.board.appendChild(elt)
}

function hide(elt) {
	if (elt.parentElement === ui.board)
		elt.remove()
}

function on_update() {
	on_init()

	for (let i = 1; i <= 54; ++i) {
		if ((view.hand && view.hand.includes(i)) || view.red_court.includes(i) || view.blue_court.includes(i) || view.squares.includes(i))
			show(ui.tiles[i])
		else
			hide(ui.tiles[i])
	}

	for (let i = 0; i < 6; ++i) {
		let k = view.squares[i]
		if (k > 0) {
			let x = LAYOUT_SQUARE[i][0] + TILE_DX + BOARD_X
			let y = LAYOUT_SQUARE[i][1] + TILE_DY + BOARD_Y
			ui.tiles[k].style.left = x + "px"
			ui.tiles[k].style.top = y + "px"
		}
	}

	for (let i = 0; i < 5; ++i) {
		let s = view.tokens[i]
		let x = LAYOUT_OVAL[s][0] + TOKEN_DX + BOARD_X
		let y = LAYOUT_OVAL[s][1] + TOKEN_DY + BOARD_Y
		ui.tokens[i].style.left = x + "px"
		ui.tokens[i].style.top = y + "px"
		ui.tokens[i].classList.toggle("selected", i === view.selected_token)
	}

	let court1, court2
	if (player !== "Blue") {
		ui.court1.className = "blue court"
		ui.court2.className = "red court"
		court1 = view.blue_court
		court2 = view.red_court
	} else {
		ui.court1.className = "red court"
		ui.court2.className = "blue court"
		court1 = view.red_court
		court2 = view.blue_court
	}

	let tile_space = calc_tile_spacing(court1.length)
	for (let i = 0; i < court1.length; ++i) {
		let k = court1[i]
		let x = COURT1_X + tile_space * i
		let y = COURT1_Y
		ui.tiles[k].style.left = x + "px"
		ui.tiles[k].style.top = y + "px"
		ui.tiles[k].style.zIndex = i
	}

	tile_space = calc_tile_spacing(court2.length)
	for (let i = 0; i < court2.length; ++i) {
		let k = court2[i]
		let x = COURT2_X + tile_space * i
		let y = COURT2_Y
		ui.tiles[k].style.left = x + "px"
		ui.tiles[k].style.top = y + "px"
		ui.tiles[k].style.zIndex = i
	}

	if (view.hand) {
		tile_space = calc_tile_spacing(view.hand.length)
		for (let i = 0; i < view.hand.length; ++i) {
			let k = view.hand[i]
			let x = HAND_X + tile_space * i
			let y = HAND_Y
			ui.tiles[k].style.left = x + "px"
			ui.tiles[k].style.top = y + "px"
			ui.tiles[k].style.zIndex = i
		}
	}

	let rs = view.red_score
	let bs = view.blue_score
	let rs_x = rs % 8
	let bs_x = bs % 8
	let rs_y = rs >> 3
	let bs_y = bs >> 3

	ui.red_score.style.left = (SCORE_X0 + SCORE_DX * rs_x) + "px"
	ui.blue_score.style.left = (SCORE_X0 + SCORE_DX * bs_x) + "px"
	if (rs === bs) {
		ui.red_score.style.top = (SCORE_Y0 + SCORE_DY * rs_y - 21) + "px"
		ui.blue_score.style.top = (SCORE_Y0 + SCORE_DY * bs_y + 8) + "px"
	} else {
		ui.red_score.style.top = (SCORE_Y0 + SCORE_DY * rs_y) + "px"
		ui.blue_score.style.top = (SCORE_Y0 + SCORE_DY * bs_y) + "px"
	}

	for (let e of action_register)
		e.classList.toggle("action", is_action(e.my_action, e.my_id))

	action_button("darkness", "Darkness")
	action_button("done", "Done")
	action_button("undo", "Undo")
}

function on_log(text) {
	let p = document.createElement("div")
	if (text.match(/^\.r /)) {
		text = text.substring(3)
		p.className = 'h1 r'
	}
	else if (text.match(/^\.b /)) {
		text = text.substring(3)
		p.className = 'h1 b'
	}
	else if (text.match(/^\.x /)) {
		text = text.substring(3)
		p.className = 'h1 x'
	}

	if (text.match(/^Dragon$/))
		p.classList.add("dragon")
	if (text.match(/^Secrecy$/))
		p.classList.add("secrecy")
	if (text.match(/^Cloth of Gold$/))
		p.classList.add("gold")
	if (text.match(/^Banquets/))
		p.classList.add("blue")
	if (text.match(/^Godliness/))
		p.classList.add("white")
	if (text.match(/^Tournaments$/))
		p.classList.add("red")
	if (text.match(/^Collections$/))
		p.classList.add("purple")

	p.textContent = text
	return p
}

scroll_with_middle_mouse("main")
