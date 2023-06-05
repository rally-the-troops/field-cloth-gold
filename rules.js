"use strict"

const RED = "Red"
const BLUE = "Blue"

var states = {}
var game = null
var view = null

exports.scenarios = [ "Standard" ]

exports.roles = [ RED, BLUE ]

const TOKEN_DRAGON = 0
const TOKEN_RED_1 = 1
const TOKEN_RED_2 = 2
const TOKEN_BLUE_1 = 3
const TOKEN_BLUE_2 = 4

const FIRST_SPACE = 0
const S_DARKNESS = 0
const S_GOLD = 1
const S_BLUE = 2
const S_WHITE = 3
const S_RED = 4
const S_PURPLE = 5
const LAST_TILE_SPACE = 5
const S_DRAGON_1 = 6
const LAST_OVAL_SPACE = 6

const S_DRAGON_2 = 7
const S_OFF_BOARD_1 = 8
const S_OFF_BOARD_2 = 9
const S_OFF_BOARD_3 = 10
const S_OFF_BOARD_4 = 11

const FIRST_TILE = 1
const TILE_NONE = 0
const TILE_BLUE = 1
const TILE_RED = 13
const TILE_GOLD = 25
const TILE_WHITE = 37
const TILE_GREEN = 49
const LAST_TILE = 54

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
	else if (action === "undo" && game.undo && game.undo.length > 0)
		pop_undo()
	else
		throw new Error("Invalid action: " + action)
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

function goto_game_over(result, victory) {
	game.state = "game_over"
	game.active = "None"
	game.result = result
	game.victory = victory
	log_br()
	log(game.victory)
}

states.game_over = {
	get inactive() {
		return game.victory
	},
	prompt() {
		view.prompt = game.victory
	},
}

// === PREPARATION ===

exports.setup = function (seed, scenario, options) {
	game = {
		seed: seed,
		state: null,
		log: [],
		undo: [],

		red_score: 0,
		blue_score: 0,
		tokens: [ S_DRAGON_2, S_OFF_BOARD_1, S_OFF_BOARD_2, S_OFF_BOARD_3, S_OFF_BOARD_4 ],
		squares: [ TILE_NONE, TILE_NONE, TILE_NONE, TILE_NONE, TILE_NONE, TILE_NONE ],
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

	for (let i = FIRST_SPACE; i <= LAST_TILE_SPACE; ++i)
		game.squares[i] = game.darkness.pop()

	if (random(2) === 0)
		game.active = RED
	else
		game.active = BLUE

	game.state = "move_token"

	return game
}

// === HANDS AND COURTS ===

function rival_court() {
	if (game.active === RED)
		return game.blue_court
	return game.red_court
}

function own_court() {
	if (game.active === RED)
		return game.red_court
	return game.blue_court
}

function own_hand() {
	if (game.active === RED)
		return game.red_hand
	return game.blue_hand
}

function own_score() {
	if (game.active === RED)
		return game.red_score
	return game.blue_score
}

function gift_tile_in_space(to) {
	// Gift associated tile to rival.
	if (to <= LAST_TILE_SPACE) {
		let tile = game.squares[to]
		log("Gifted " + tile)
		game.squares[to] = TILE_NONE
		rival_court().push(tile)
	}
}

function score_own_points(n) {
	log("Scored " + n)
	if (game.active === RED)
		game.red_score += n
	if (game.active === BLUE)
		game.blue_score += n
	return (game.red_score >= 30) || (game.blue_score >= 30)
}

function count_tiles(list, type) {
	let n = 0
	for (let tile of list)
		if (tile >= type && tile < type + 12)
			++n
	return n
}

function reveal_tiles_into_court(type) {
	let hand = own_hand()
	let court = own_court()
	for (let i = 0; i < hand.length;) {
		let tile = hand[i]
		if (tile >= type && tile < type + 12) {
			logi("Revealed " + tile)
			array_remove(hand, i)
			court.push(tile)
		} else {
			++i
		}
	}
}

function remove_tiles_from_court(type) {
	let court = own_court()
	for (let i = 0; i < court.length;) {
		let tile = court[i]
		if (tile >= type && tile < type + 12) {
			logi("Removed " + tile)
			array_remove(court, i)
		} else {
			++i
		}
	}
}

function is_oval_space_empty(s) {
	for (let i = FIRST_SPACE; i <= LAST_OVAL_SPACE; ++i)
		if (game.tokens[i] === s)
			return false
	return true
}

// === FLOW OF PLAY ===

states.move_token = {
	prompt() {
		view.prompt = "Move one of your tokens to an oval space."
		if (game.active === RED) {
			if (game.tokens[TOKEN_RED_1] >= S_OFF_BOARD_1) {
				gen_action_token(TOKEN_RED_1)
			} else if (game.tokens[TOKEN_RED_2] >= S_OFF_BOARD_1) {
				gen_action_token(TOKEN_RED_2)
			} else {
				gen_action_token(TOKEN_RED_1)
				gen_action_token(TOKEN_RED_2)
			}
		} else {
			if (game.tokens[TOKEN_BLUE_1] >= S_OFF_BOARD_1) {
				gen_action_token(TOKEN_BLUE_1)
			} else if (game.tokens[TOKEN_BLUE_2] >= S_OFF_BOARD_1) {
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

states.move_token_to = {
	prompt() {
		view.prompt = "Move your token to an oval space."
		view.selected_token = game.selected_token
		for (let i = FIRST_SPACE; i <= LAST_OVAL_SPACE; ++i)
			if (is_oval_space_empty(i))
				gen_action_space(i)
		gen_action_token(game.selected_token)
	},
	space(to) {
		// Remember whence we came.
		game.from = game.tokens[game.selected_token]

		log_h2(game.active + " MOVED TO " + to)

		// Move the token.
		game.tokens[game.selected_token] = to

		// Gift associated tile to rival.
		gift_tile_in_space(to)

		// Take action.
		switch (to) {
			case S_DRAGON_1:
				return goto_dragon()
			case S_DARKNESS:
				return goto_secrecy()
			case S_GOLD:
				return goto_cloth_of_gold()
			case S_BLUE:
				return goto_banquets_and_feasts()
			case S_WHITE:
				return goto_godliness_and_piety()
			case S_RED:
				return goto_tournaments()
			case S_PURPLE:
				return goto_purple()
		}
	},
	token(t) {
		pop_undo()
	},
}

function end_turn() {
	clear_undo()

	// Return Dragon if needed.
	if (is_oval_space_empty(S_DRAGON_1))
		game.tokens[TOKEN_DRAGON] = S_DRAGON_2

	// Refill Tiles if needed.
	for (let i = FIRST_SPACE; i <= LAST_TILE_SPACE; ++i) {
		if (is_oval_space_empty(i) && game.squares[i] === 0) {
			let tile = game.darkness.pop()
			game.squares[i] = tile
			if (game.darkness.length === 0)
				return goto_end_of_the_contest()
		}
	}

	// Play passes to the rival player.
	if (game.active === RED)
		game.active = BLUE
	else
		game.active = RED
	game.state = "move_token"
}

// === THE ACTIONS: DRAGON ===

function goto_dragon() {
	log("Dragon")
	game.state = "dragon"
}

states.dragon = {
	prompt() {
		view.selected_token = TOKEN_DRAGON
		for (let i = FIRST_SPACE; i <= LAST_OVAL_SPACE; ++i)
			if (i !== game.from && is_oval_space_empty(i))
				gen_action_space(i)
	},
	space(to) {
		game.tokens[TOKEN_DRAGON] = to
		gift_tile_in_space(to)
		end_turn()
	},
}

// === THE ACTIONS: SECRECY ===

const SECRECY_PER_ROW = [ 1, 2, 2, 3, 0 ]

function gain_tile_from_darkness() {
	let tile = game.darkness.pop()
	own_hand().push(tile)
	return game.darkness.length === 0
}

function goto_secrecy() {
	log("Secrecy")
	let score = own_score()
	let row = (score >> 8)
	let n = SECRECY_PER_ROW[row]
	for (let i = 0; i < n; ++i) {
		log("Gained Tile from Darkness.")
		if (gain_tile_from_darkness()) {
			return goto_end_of_the_contest()
		}
	}
	end_turn()
}

// === THE ACTIONS: CLOTH OF GOLD ===

function goto_cloth_of_gold() {
	log("Cloth of Gold")
	reveal_tiles_into_court(TILE_GOLD)
	let own = count_tiles(own_court(), TILE_GOLD)
	let rival = count_tiles(rival_court(), TILE_GOLD)
	if (own > rival) {
		if (score_own_points(2))
			return goto_end_of_the_contest()
	}
	end_turn()
}

// === THE ACTIONS: BANQUETS AND FEASTS  ===

function goto_banquets_and_feasts() {
	log("Banquets & Feasts")
	reveal_tiles_into_court(TILE_BLUE)
	let own = count_tiles(own_court(), TILE_BLUE)
	let score = 0
	if (own === 1)
		score = 1
	else if (own === 2)
		score = 3
	else if (own >= 3)
		score = 6
	remove_tiles_from_court(TILE_BLUE)
	if (score_own_points(score))
		return goto_end_of_the_contest()
	end_turn()
}

// === THE ACTIONS: GODLINESS AND PIETY ===

function goto_godliness_and_piety() {
	end_turn()
}

// === THE ACTIONS: TOURNAMENTS ===

function goto_tournaments() {
	end_turn()
}

// === THE ACTIONS: COLLECTIONS ===

function goto_purple() {
	end_turn()
}

// === END OF THE CONTEST ===

// === COMMON LIBRARY ===

function log(msg) {
	game.log.push(msg)
}

function log_br() {
	if (game.log.length > 0 && game.log[game.log.length - 1] !== "")
		game.log.push("")
}

function logi(msg) {
	game.log.push(">" + msg)
}

function log_h1(msg) {
	log_br()
	log(".h1 " + msg)
	log_br()
}

function log_h2(msg) {
	log_br()
	log(".h2 " + msg)
	log_br()
}

function clear_undo() {
	if (game.undo) {
		game.undo.length = 0
	}
}

function push_undo() {
	if (game.undo) {
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
}

function pop_undo() {
	if (game.undo) {
		let save_log = game.log
		let save_undo = game.undo
		game = save_undo.pop()
		save_log.length = game.log
		game.log = save_log
		game.undo = save_undo
	}
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
