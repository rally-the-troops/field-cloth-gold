"use strict"

/* global view, player, send_action, action_button, scroll_with_middle_mouse */

let opt_sort_tiles = window.localStorage['field-cloth-gold/sort'] | 0
check_menu("sort_tiles_menu", opt_sort_tiles === 1)

function check_menu(id, x) {
        document.getElementById(id).className = x ? "menu_item checked" : "menu_item unchecked"
}

function toggle_sort() {
	opt_sort_tiles = 1 - opt_sort_tiles
	check_menu("sort_tiles_menu", opt_sort_tiles === 1)
	window.localStorage['field-cloth-gold/sort'] = opt_sort_tiles
	on_update()
}

const TILE_NONE = -1
const TILE_GOLD = 0
const TILE_BLUE = 12
const TILE_WHITE = 24
const TILE_RED = 36
const TILE_GREEN = 48

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
	[75,638-50],
	[175,638-50],
	[125,638-50],
	[225,638-50],
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
const SCORE_DY = (LAYOUT_SCORE_39[1] - LAYOUT_SCORE_0[1]) / 4
const SCORE_DXDY = -1

let ui = {
	board: document.getElementById("map"),
	court1: document.getElementById("court1"),
	court2: document.getElementById("court2"),
	darkness_label: document.getElementById("darkness_label"),
	darkness_button: document.getElementById("darkness_button"),
	red_hand_size: document.getElementById("red_hand_size"),
	blue_hand_size: document.getElementById("blue_hand_size"),
	red_score: null,
	blue_score: null,
	oval_spaces: [],
	square_spaces: [],
	tokens: [],
	tiles: [ null ],
	tile_was_visible: Array(54).fill(0),
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

function create_item(p) {
	let e = create("div", p)
	ui.board.appendChild(e)
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

	ui.red_score = create_item({ className: "token red", my_action: "score", my_id: 1 })
	ui.blue_score = create_item({ className: "token blue", my_action: "score", my_id: 2 })

	ui.tokens[0] = create_item({ className: "token white", my_action: "token", my_id: 0 })
	ui.tokens[1] = create_item({ className: "token red", my_action: "token", my_id: 1 })
	ui.tokens[2] = create_item({ className: "token red", my_action: "token", my_id: 2 })
	ui.tokens[3] = create_item({ className: "token blue", my_action: "token", my_id: 3 })
	ui.tokens[4] = create_item({ className: "token blue", my_action: "token", my_id: 4 })

	ui.darkness_button.onclick = function () { send_action("darkness") }

	for (let i = TILE_BLUE; i < TILE_BLUE + 12; ++i)
		ui.tiles[i] = create_item({ className: "tile blue", my_action: "tile", my_id: i })
	for (let i = TILE_RED; i < TILE_RED + 12; ++i)
		ui.tiles[i] = create_item({ className: "tile red", my_action: "tile", my_id: i })
	for (let i = TILE_GOLD; i < TILE_GOLD + 12; ++i)
		ui.tiles[i] = create_item({ className: "tile gold", my_action: "tile", my_id: i })
	for (let i = TILE_WHITE; i < TILE_WHITE + 12; ++i)
		ui.tiles[i] = create_item({ className: "tile white", my_action: "tile", my_id: i })
	for (let i = TILE_GREEN; i < TILE_GREEN + 6; ++i)
		ui.tiles[i] = create_item({ className: "tile green", my_action: "tile", my_id: i })
}

function cmp_tile(a, b) {
	a = ((a / 12 | 0) + 1) % 5
	b = ((b / 12 | 0) + 1) % 5
	return a - b
}

function on_update() {
	on_init()

	ui.red_hand_size.textContent = view.red_hand + " in Hand"
	ui.blue_hand_size.textContent = view.blue_hand + " in Hand"
	ui.darkness_label.textContent = view.darkness + " in Darkness"

	ui.darkness_button.classList.toggle("action", is_action("darkness"))

	let hand = view.hand
	let red_court = view.red_court
	let blue_court = view.blue_court
	if (opt_sort_tiles) {
		if (hand)
			hand = hand.slice().sort(cmp_tile)
		red_court = red_court.slice().sort(cmp_tile)
		blue_court = blue_court.slice().sort(cmp_tile)
	}

	for (let i = 0; i < 54; ++i) {
		if ((hand && hand.includes(i)) || red_court.includes(i) || blue_court.includes(i) || view.squares.includes(i)) {
			ui.tiles[i].style.opacity = 1
			ui.tile_was_visible[i] = 1
		} else {
			ui.tiles[i].style.opacity = 0
			if (ui.tile_was_visible[i]) {
				ui.tiles[i].style.top = "674px" // 104 + 638 - 12 - 56
				ui.tiles[i].style.left = "757px" // 825 - 12 - 56
			} else {
				ui.tiles[i].style.top = "674px" // 104 + 638 - 12 - 56
				ui.tiles[i].style.left = "12px"
			}
			ui.tiles[i].style.zIndex = 0
			ui.tile_was_visible[i] = 0
		}
	}

	for (let i = 0; i < 6; ++i) {
		let k = view.squares[i]
		if (k !== TILE_NONE) {
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
		court1 = blue_court
		court2 = red_court
	} else {
		ui.court1.className = "red court"
		ui.court2.className = "blue court"
		court1 = red_court
		court2 = blue_court
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

	if (hand) {
		tile_space = calc_tile_spacing(hand.length)
		for (let i = 0; i < hand.length; ++i) {
			let k = hand[i]
			let x = HAND_X + tile_space * i
			let y = HAND_Y
			ui.tiles[k].style.left = x + "px"
			ui.tiles[k].style.top = y + "px"
			ui.tiles[k].style.zIndex = i + 100
		}
	}

	let rs = view.red_score
	let bs = view.blue_score
	let rs_x = rs % 8
	let bs_x = bs % 8
	let rs_y = rs >> 3
	let bs_y = bs >> 3

	ui.red_score.style.left = (SCORE_X0 + SCORE_DX * rs_x + SCORE_DXDY * rs_y) + "px"
	ui.blue_score.style.left = (SCORE_X0 + SCORE_DX * bs_x + SCORE_DXDY * bs_y) + "px"
	if (rs === bs) {
		ui.red_score.style.top = (SCORE_Y0 + SCORE_DY * rs_y - 21) + "px"
		ui.blue_score.style.top = (SCORE_Y0 + SCORE_DY * bs_y + 8) + "px"
	} else {
		ui.red_score.style.top = (SCORE_Y0 + SCORE_DY * rs_y) + "px"
		ui.blue_score.style.top = (SCORE_Y0 + SCORE_DY * bs_y) + "px"
	}

	for (let e of action_register)
		e.classList.toggle("action", is_action(e.my_action, e.my_id))

	//action_button("darkness", "Darkness")
	action_button("done", "Done")
	action_button("undo", "Undo")
}

const IMG_G = '<span class="t gold"></span>'
const IMG_B = '<span class="t blue"></span>'
const IMG_R = '<span class="t red"></span>'
const IMG_W = '<span class="t white"></span>'
const IMG_J = '<span class="t green"></span>'
const IMG_K = '<span class="t black"></span>'

const IMG_OD = '<span class="c white"></span>'
const IMG_OS = '<span class="o secrecy"></span>'
const IMG_OG = '<span class="o gold"></span>'
const IMG_OB = '<span class="o blue"></span>'
const IMG_OR = '<span class="o red"></span>'
const IMG_OW = '<span class="o white"></span>'
const IMG_OP = '<span class="o purple"></span>'

const IMG_CW = '<span class="c white"></span>'
const IMG_CR = '<span class="c red"></span>'
const IMG_CB = '<span class="c blue"></span>'

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

	text = text.replace(/\bG\b/g, IMG_G)
	text = text.replace(/\bB\b/g, IMG_B)
	text = text.replace(/\bR\b/g, IMG_R)
	text = text.replace(/\bW\b/g, IMG_W)
	text = text.replace(/\bJ\b/g, IMG_J)
	text = text.replace(/\bK\b/g, IMG_K)

	text = text.replace(/\bCR\b/g, IMG_CR)
	text = text.replace(/\bCB\b/g, IMG_CB)
	text = text.replace(/\bCW\b/g, IMG_CW)

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

	text = text.replace(/\bO0\b/g, IMG_OS)
	text = text.replace(/\bO1\b/g, IMG_OG)
	text = text.replace(/\bO2\b/g, IMG_OB)
	text = text.replace(/\bO3\b/g, IMG_OW)
	text = text.replace(/\bO4\b/g, IMG_OR)
	text = text.replace(/\bO5\b/g, IMG_OP)
	text = text.replace(/\bO6\b/g, IMG_OD)

	p.innerHTML = text
	return p
}
