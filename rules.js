"use strict"

const RED = "Red"
const BLUE = "Blue"

const states = {}

var game, view

exports.scenarios = [ "Standard" ]

exports.roles = [ RED, BLUE ]

const TOKEN_DRAGON = 0
const TOKEN_RED_1 = 1
const TOKEN_RED_2 = 2
const TOKEN_BLUE_1 = 3
const TOKEN_BLUE_2 = 4

const S_DARKNESS = 0
const S_GOLD = 1
const S_BLUE = 2
const S_WHITE = 3
const S_RED = 4
const S_PURPLE = 5
const S_DRAGON = 6
const S_OFF_BOARD = 7

const TILE_NONE = 0
const FIRST_TILE = 1
const TILE_BLUE = 1
const TILE_RED = 13
const TILE_GOLD = 25
const TILE_WHITE = 37
const TILE_GREEN = 49
const LAST_TILE = 55

function gen_action(action, argument) {
	if (!(action in view.actions))
		view.actions[action] = []
	view.actions[action].push(argument)
}

function gen_action_token(token) {
	gen_action("token", token)
}

function gen_action_tile(tile) {
	gen_action("tile", tile)
}

function gen_action_space(space) {
	gen_action("space", space)
}

exports.action = function (state, player, action, arg) {
	game = state
	let S = states[game.state]
	if (action in S)
		S[action](arg, player)
	else
		throw new Error("Invalid action: " + action)
	return game
}

exports.resign = function (state, player) {
	game = state
	if (game.state !== 'game_over') {
		if (player === RED)
			goto_game_over(BLUE, "Red resigned.")
		if (player === BLUE)
			goto_game_over(RED, "Blue resigned.")
	}
	return game
}

exports.view = function(state, player) {
	game = state

	view = {
		log: game.log,
		prompt: null,
		tokens: game.tokens,
		squares: game.squares,
		red_score: game.red_score,
		blue_score: game.blue_score,
		red_court: game.red_court,
		blue_court: game.blue_court,

		selected_token: -1,
		selected_tile: 0,
	}

	if (player === RED)
		view.hand = game.red_hand

	if (player === BLUE)
		view.hand = game.blue_hand

	if (game.state === "game_over") {
		view.prompt = game.victory
	} else if (player !== game.active) {
		let inactive = states[game.state].inactive || game.state
		view.prompt = `Waiting for ${game.active} \u2014 ${inactive}...`
	} else {
		view.actions = {}
		states[game.state].prompt()
		if (game.undo && game.undo.length > 0)
			view.actions.undo = 1
		else
			view.actions.undo = 0
	}

	return view;
}

exports.setup = function (seed, scenario, options) {
	game = {
		seed: seed,
		state: null,
		log: [],
		undo: [],

		red_score: 0,
		blue_score: 0,
		tokens: [ S_DRAGON, S_OFF_BOARD, S_OFF_BOARD, S_OFF_BOARD, S_OFF_BOARD ],
		squares: [ 0, 0, 0, 0, 0, 0 ],
		darkness: [],
		red_court: [],
		blue_court: [],
		red_hand: [],
		blue_hand: [],
	}

	for (let i = FIRST_TILE; i < TILE_GREEN; ++i)
		game.darkness.push(i)

	shuffle(game.darkness)

	game.red_hand.push(game.darkness.pop())
	game.red_hand.push(game.darkness.pop())

	game.blue_hand.push(game.darkness.pop())
	game.blue_hand.push(game.darkness.pop())

	for (let i = TILE_GREEN; i < TILE_GREEN + 6; ++i)
		game.darkness.push(i)

	shuffle(game.darkness)

	for (let i = 0; i < 6; ++i)
		game.squares[i] = game.darkness.pop()

	if (random(2) === 0)
		game.active = RED
	else
		game.active = BLUE

	game.state = "move_token"

	return game
}

// === FLOW OF PLAY ===

states.move_token = {
	prompt() {
		view.prompt = "Move one of your tokens to an oval space."
		if (game.active === RED) {
			if (game.tokens[TOKEN_RED_1] === S_OFF_BOARD) {
				gen_action_token(TOKEN_RED_1)
			} else if (game.tokens[TOKEN_RED_2] === S_OFF_BOARD) {
				gen_action_token(TOKEN_RED_2)
			} else {
				gen_action_token(TOKEN_RED_1)
				gen_action_token(TOKEN_RED_2)
			}
		} else {
			if (game.tokens[TOKEN_BLUE_1] === S_OFF_BOARD) {
				gen_action_token(TOKEN_BLUE_1)
			} else if (game.tokens[TOKEN_BLUE_2] === S_OFF_BOARD) {
				gen_action_token(TOKEN_BLUE_2)
			} else {
				gen_action_token(TOKEN_BLUE_1)
				gen_action_token(TOKEN_BLUE_2)
			}
		}
	},
	token(token) {
		push_undo()
		game.selected_token = token
		game.state = "move_token_to"
	},
}

function is_oval_space_empty(s) {
	for (let i = 0; i < 5; ++i)
		if (game.tokens[i] === s)
			return false
	return true
}

states.move_token_to = {
	prompt() {
		view.prompt = "Move your token to an oval space."
		view.selected_token = game.selected_token
		for (let i = 0; i < 7; ++i)
			if (is_oval_space_empty(i))
				gen_action_space(i)
	},
	space(space) {
		game.tokens[game.selected_token] = space
		// take action!
	}
}

// === THE ACTIONS: DRAGON ===
// === THE ACTIONS: SECRECY ===
// === THE ACTIONS: CLOTH OF GOLD ===
// === THE ACTIONS: BANQUETS AND FEASTS  ===
// === THE ACTIONS: GODLINESS AND PIETY ===
// === THE ACTIONS: TOURNAMENTS ===
// === THE ACTIONS: COLLECTIONS ===
// === END OF THE CONTEST ===

// === COMMON LIBRARY ===

function clear_undo() {
	if (game.undo.length > 0)
		game.undo = []
}

function push_undo() {
	let copy = {}
	for (let k in game) {
		let v = game[k]
		if (k === "undo")
			continue
		else if (k === "log")
			v = v.length
		else if (typeof v === "object" && v !== null)
			v = object_copy(v)
		copy[k] = v
	}
	game.undo.push(copy)
}

function pop_undo() {
	let save_log = game.log
	let save_undo = game.undo
	game = save_undo.pop()
	save_log.length = game.log
	game.log = save_log
	game.undo = save_undo
}

function random(range) {
	// An MLCG using integer arithmetic with doubles.
	// https://www.ams.org/journals/mcom/1999-68-225/S0025-5718-99-00996-5/S0025-5718-99-00996-5.pdf
	// m = 2**35 − 31
	return (game.seed = game.seed * 200105 % 34359738337) % range
}

function shuffle(list) {
	// Fisher-Yates shuffle
	for (let i = list.length - 1; i > 0; --i) {
		let j = random(i + 1)
		let tmp = list[j]
		list[j] = list[i]
		list[i] = tmp
	}
}

// Fast deep copy for objects without cycles
function object_copy(original) {
	if (Array.isArray(original)) {
		let n = original.length
		let copy = new Array(n)
		for (let i = 0; i < n; ++i) {
			let v = original[i]
			if (typeof v === "object" && v !== null)
				copy[i] = object_copy(v)
			else
				copy[i] = v
		}
		return copy
	} else {
		let copy = {}
		for (let i in original) {
			let v = original[i]
			if (typeof v === "object" && v !== null)
				copy[i] = object_copy(v)
			else
				copy[i] = v
		}
		return copy
	}
}

// Array remove and insert (faster than splice)

function array_remove(array, index) {
	let n = array.length
	for (let i = index + 1; i < n; ++i)
		array[i - 1] = array[i]
	array.length = n - 1
}

function array_remove_item(array, item) {
	let n = array.length
	for (let i = 0; i < n; ++i)
		if (array[i] === item)
			return array_remove(array, i)
}

function array_insert(array, index, item) {
	for (let i = array.length; i > index; --i)
		array[i] = array[i - 1]
	array[index] = item
}
