"use strict"

const RED = "Red"
const BLUE = "Blue"

var states = {}
var game = null
var view = null

exports.scenarios = [ "Standard" ]

exports.roles = [ RED, BLUE ]

const SECRECY_PER_ROW = [ 1, 2, 2, 3, 0 ]
const GOLD_PER_ROW = [ 3, 3, 2, 1, 1, 1, 1, 1, 1, 1 ]

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

const TILE_NONE = -1
const TILE_GOLD = 0
const TILE_BLUE = 12
const TILE_WHITE = 24
const TILE_RED = 36
const TILE_GREEN = 48
const TILE_UNKNOWN = 60

function space_name(s) {
	switch (s) {
	case S_DRAGON_1: return "Dragon"
	case S_DARKNESS: return "Secrecy"
	case S_GOLD: return "Cloth of Gold"
	case S_BLUE: return "Banquets & Feasts"
	case S_WHITE: return "Godliness & Piety"
	case S_RED: return "Tournaments"
	case S_PURPLE: return "Collections"
	default: return "off board"
	}
}

const TILE_NAME_CODE = [ "G", "B", "W", "R", "J", "K" ]
const TILE_NAME_CODE_X = [ [], [], [], [], [], [] ]

for (let k = 0; k < 6; ++k)
	for (let i = 0; i < 12; ++i)
		TILE_NAME_CODE_X[k][i] = Array(i).fill(TILE_NAME_CODE[k]).join(" ")

function tile_type(tile) {
	return (tile / 12 | 0) * 12
}

function tile_name_count(tile, n) {
	if (tile >= 0)
		return TILE_NAME_CODE_X[tile / 12 | 0][n]
	return "None"
}

function tile_name(tile) {
	if (tile >= 0)
		return TILE_NAME_CODE[tile / 12 | 0]
	return "none"
}

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

function gen_action_square(space) {
	gen_action("square", space)
}

function gen_action_score_red() {
	gen_action("score", 1)
}

function gen_action_score_blue() {
	gen_action("score", 2)
}

function gen_action_score() {
	if (game.active === RED)
		gen_action("score", 1)
	else
		gen_action("score", 2)
}

function gen_action_score_rival() {
	if (game.active !== RED)
		gen_action("score", 1)
	else
		gen_action("score", 2)
}

function prompt_score(space, score, tail = ".") {
	if (score === 0)
		view.prompt = space + ": Score no points" + tail
	else if (score === 1)
		view.prompt = space + ": Score one point" + tail
	else
		view.prompt = space + ": Score " + score + " points" + tail
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
		darkness: game.darkness.length,
		red_hand: game.red_hand.length,
		blue_hand: game.blue_hand.length,
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
		view.prompt = `Waiting for ${game.active} \u2014 ${inactive}.`
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
			goto_game_over(BLUE, RED + " resigned.")
		if (player === BLUE)
			goto_game_over(RED, BLUE + " resigned.")
	}
	return game
}

function goto_game_over(result, victory) {
	game.state = "game_over"
	game.active = "None"
	game.result = result
	game.victory = victory
	log("")
	log(game.victory)
	return false
}

states.game_over = {
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

	for (let i = 0; i < TILE_GREEN; ++i)
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

function rival_hand() {
	if (game.active === RED)
		return game.blue_hand
	return game.red_hand
}

function own_hand() {
	if (game.active === RED)
		return game.red_hand
	return game.blue_hand
}

function rival_score() {
	if (game.active === RED)
		return game.blue_score
	return game.red_score
}

function own_score() {
	if (game.active === RED)
		return game.red_score
	return game.blue_score
}

function is_oval_space_empty(s) {
	for (let i = FIRST_SPACE; i <= LAST_OVAL_SPACE; ++i)
		if (game.tokens[i] === s)
			return false
	return true
}

function gift_tile_in_space(to) {
	// Gift associated tile to rival.
	if (to <= LAST_TILE_SPACE) {
		let tile = game.squares[to]
		log("Gift " + tile_name(tile))
		game.squares[to] = TILE_NONE
		rival_court().push(tile)
	}
}

function score_points(who, n, reason = ".") {
	if (n > 0) {
		log(who + " scores +" + n + reason)
		if (who === RED)
			game.red_score += n
		else
			game.blue_score += n
	}
}

function score_own_points(n) {
	if (n > 0) {
		log("Score +" + n)
		if (game.active === RED)
			game.red_score += n
		else
			game.blue_score += n
	}
}

function score_rival_points(n) {
	if (n > 0) {
		log("Score +" + n + " for rival")
		if (game.active === RED)
			game.blue_score += n
		else
			game.red_score += n
	}
}

function count_tiles(list, type) {
	let n = 0
	for (let tile of list)
		if (tile >= type && tile < type + 12)
			++n
	return n
}

function has_tile_in_list(type, list) {
	for (let tile of list)
		if (tile >= type && tile < type + 12)
			return true
	return false
}

function gen_tile_in_list(type, list) {
	for (let tile of list)
		if (tile >= type && tile < type + 12)
			gen_action_tile(tile)
}

function log_reveal_tiles_into_court(type) {
	let n = count_tiles(own_hand(), type)
	if (n > 0)
		log("Reveal " + tile_name_count(type, n))
}

function log_remove_tiles_from_court(type) {
	let n = count_tiles(own_court(), type)
	if (n > 0)
		log("Remove " + tile_name_count(type, n))
}

function log_remove_tiles_from_rival_court(type) {
	let n = count_tiles(rival_court(), type)
	if (n > 0)
		log("Remove " + tile_name_count(type, n) + " from rival")
}

function can_reveal_tiles_into_court(type) {
	return has_tile_in_list(type, own_hand())
}

function gen_reveal_tiles_into_court(type) {
	gen_tile_in_list(type, own_hand())
}

function can_remove_tiles_from_court(type) {
	return has_tile_in_list(type, own_court())
}

function gen_remove_tiles_from_court(type) {
	gen_tile_in_list(type, own_court())
}

function can_remove_tiles_from_rival_court(type) {
	return has_tile_in_list(type, rival_court())
}

function gen_remove_tiles_from_rival_courts(type) {
	gen_tile_in_list(type, rival_court())
}

function reveal_tile_into_court(tile) {
	array_remove_item(own_hand(), tile)
	own_court().push(tile)
}

function remove_tile_from_court(tile) {
	array_remove_item(own_court(), tile)
}

function remove_tile_from_rival_court(tile) {
	array_remove_item(rival_court(), tile)
}

// === FLOW OF PLAY ===

states.move_token = {
	inactive: "to move one of their tokens to an oval space",
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
	inactive: "to move one of their tokens to an oval space",
	prompt() {
		view.prompt = "Move one of your tokens to an oval space."
		view.selected_token = game.selected_token
		for (let i = FIRST_SPACE; i <= LAST_OVAL_SPACE; ++i)
			if (is_oval_space_empty(i))
				gen_action_space(i)
		gen_action_token(game.selected_token)
	},
	space(to) {
		// Remember whence we came.
		game.from = game.tokens[game.selected_token]

		if (game.active === RED)
			log(".r O" + to + " " + space_name(to))
		else
			log(".b O" + to + " " + space_name(to))

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
			return goto_collections()
		}
	},
	token(_) {
		pop_undo()
	},
}

function is_end_of_the_contest() {
	if (game.darkness.length === 0)
		return true
	if ((game.red_score >= 30) || (game.blue_score >= 30))
		return true
	return false
}

function end_turn() {
	// Game End triggered?
	if (is_end_of_the_contest())
		return goto_end_of_the_contest()

	// Return Dragon if needed.
	if (is_oval_space_empty(S_DRAGON_1) && game.tokens[TOKEN_DRAGON] !== S_DRAGON_2) {
		game.state = "return_dragon"
		return
	}

	goto_refill_tiles()
}

states.return_dragon = {
	inactive: "to move the Dragon back to its space",
	prompt() {
		view.prompt = "Move the Dragon back to its space."
		gen_action_token(TOKEN_DRAGON)
	},
	token(_) {
		log("Return CW")
		game.tokens[TOKEN_DRAGON] = S_DRAGON_2
		goto_refill_tiles()
	},
}

function must_refill_tiles() {
	for (let i = FIRST_SPACE; i <= LAST_TILE_SPACE; ++i)
		if (is_oval_space_empty(i) && game.squares[i] === TILE_NONE)
			return true
	return false
}

function goto_refill_tiles() {
	if (must_refill_tiles())
		game.state = "refill_tiles"
	else
		pass_play_to_rival()
}

states.refill_tiles = {
	inactive: "to draw and place a new tile",
	prompt() {
		view.prompt = "Draw and place a new tile."
		for (let i = FIRST_SPACE; i <= LAST_TILE_SPACE; ++i)
			if (is_oval_space_empty(i) && game.squares[i] === TILE_NONE)
				gen_action_square(i)
	},
	square(i) {
		clear_undo()
		let tile = game.darkness.pop()
		log("Place " + tile_name(tile) + " at O" + i)
		game.squares[i] = tile
		if (game.darkness.length === 0)
			return goto_end_of_the_contest()
		goto_refill_tiles()
	},
}

function pass_play_to_rival() {
	clear_undo()

	// Play passes to the rival player.
	if (game.active === RED)
		game.active = BLUE
	else
		game.active = RED
	game.state = "move_token"
}

// === THE ACTIONS: DRAGON ===

function goto_dragon() {
	game.state = "dragon"
}

states.dragon = {
	inactive: "Dragon",
	prompt() {
		view.prompt = "Dragon: Move the Dragon to an oval space."
		view.selected_token = TOKEN_DRAGON
		for (let i = FIRST_SPACE; i <= LAST_OVAL_SPACE; ++i)
			if (i !== game.from && is_oval_space_empty(i))
				gen_action_space(i)
	},
	space(to) {
		log("Move CW to O" + to)
		game.tokens[TOKEN_DRAGON] = to
		gift_tile_in_space(to)
		end_turn()
	},
}

// === THE ACTIONS: SECRECY ===

function gain_tiles_from_darkness(n) {
	for (let i = 0; i < n; ++i)
		own_hand().push(game.darkness.pop())
}

function gain_tiles_from_darkness_rival(n) {
	for (let i = 0; i < n; ++i)
		rival_hand().push(game.darkness.pop())
}

function gain_secrecy_tiles() {
	let n = Math.min(SECRECY_PER_ROW[own_score() / 8 | 0], game.darkness.length)
	log("Gain " + tile_name_count(TILE_UNKNOWN, n))
	gain_tiles_from_darkness(n)
}

function gain_secrecy_tiles_rival() {
	let n = Math.min(SECRECY_PER_ROW[rival_score() / 8 | 0], game.darkness.length)
	log("Gain " + tile_name_count(TILE_UNKNOWN, n) + " to rival")
	gain_tiles_from_darkness_rival(n)
}

function goto_secrecy() {
	game.state = "secrecy"
}

states.secrecy = {
	inactive: "Secrecy",
	prompt() {
		view.prompt = "Secrecy: Gain tiles from the Darkness to your Hand."
		view.actions.darkness = 1
	},
	darkness() {
		clear_undo()
		gain_secrecy_tiles()
		end_turn()
	},
}

// === THE ACTIONS: CLOTH OF GOLD ===

function calc_cloth_of_gold_score() {
	let own = count_tiles(own_court(), TILE_GOLD)
	let rival = count_tiles(rival_court(), TILE_GOLD)
	if (own > rival)
		return 2
	return 0
}

function goto_cloth_of_gold() {
	log_reveal_tiles_into_court(TILE_GOLD)
	if (can_reveal_tiles_into_court(TILE_GOLD))
		game.state = "cloth_of_gold_reveal"
	else
		goto_cloth_of_gold_score()
}

function goto_cloth_of_gold_score() {
	if (calc_cloth_of_gold_score())
		game.state = "cloth_of_gold_score"
	else
		end_turn()
}

states.cloth_of_gold_reveal = {
	inactive: "Cloth of Gold",
	prompt() {
		view.prompt = "Cloth of Gold: Reveal all Gold tiles from your Hand."
		gen_reveal_tiles_into_court(TILE_GOLD)
	},
	tile(tile) {
		reveal_tile_into_court(tile)
		if (!can_reveal_tiles_into_court(TILE_GOLD))
			goto_cloth_of_gold_score()
	},
}

states.cloth_of_gold_score = {
	inactive: "Cloth of Gold",
	prompt() {
		prompt_score("Cloth of Gold", calc_cloth_of_gold_score())
		gen_action_score()
	},
	score() {
		score_own_points(calc_cloth_of_gold_score())
		end_turn()
	}
}

// === THE ACTIONS: BANQUETS AND FEASTS  ===

function calc_banquets_and_feasts_score() {
	let n = count_tiles(own_court(), TILE_BLUE)
	if (n === 0)
		return 0
	if (n === 1)
		return 1
	if (n === 2)
		return 3
	return 6
}

function goto_banquets_and_feasts() {
	log_reveal_tiles_into_court(TILE_BLUE)
	if (can_reveal_tiles_into_court(TILE_BLUE))
		game.state = "banquets_and_feasts_reveal"
	else
		goto_banquets_and_feasts_score()
}

function goto_banquets_and_feasts_score() {
	if (calc_banquets_and_feasts_score())
		game.state = "banquets_and_feasts_score"
	else
		goto_banquets_and_feasts_remove()
}

function goto_banquets_and_feasts_remove() {
	log_remove_tiles_from_court(TILE_BLUE)
	if (can_remove_tiles_from_court(TILE_BLUE))
		game.state = "banquets_and_feasts_remove"
	else
		end_turn()
}

states.banquets_and_feasts_reveal = {
	inactive: "Banquets & Feasts",
	prompt() {
		view.prompt = "Banquets & Feasts: Reveal all Blue tiles from your Hand."
		gen_reveal_tiles_into_court(TILE_BLUE)
	},
	tile(tile) {
		reveal_tile_into_court(tile)
		if (!can_reveal_tiles_into_court(TILE_BLUE))
			goto_banquets_and_feasts_score()
	},
}

states.banquets_and_feasts_score = {
	inactive: "Banquets & Feasts",
	prompt() {
		prompt_score("Banquets & Feasts", calc_banquets_and_feasts_score())
		gen_action_score()
	},
	score() {
		score_own_points(calc_banquets_and_feasts_score())
		if (is_end_of_the_contest())
			return goto_end_of_the_contest()
		goto_banquets_and_feasts_remove()
	},
}

states.banquets_and_feasts_remove = {
	inactive: "Banquets & Feasts",
	prompt() {
		view.prompt = "Banquets & Feasts: Remove all Blue tiles from your Court."
		gen_remove_tiles_from_court(TILE_BLUE)
	},
	tile(tile) {
		remove_tile_from_court(tile)
		if (!can_remove_tiles_from_court(TILE_BLUE))
			end_turn()
	},
}

// === THE ACTIONS: GODLINESS AND PIETY ===

function calc_godliness_and_piety_score() {
	return count_tiles(own_court(), TILE_WHITE)
}

function goto_godliness_and_piety() {
	log_reveal_tiles_into_court(TILE_WHITE)
	if (can_reveal_tiles_into_court(TILE_WHITE))
		game.state = "godliness_and_piety_reveal"
	else
		goto_godliness_and_piety_score()
}

function goto_godliness_and_piety_score() {
	if (calc_godliness_and_piety_score())
		game.state = "godliness_and_piety_score"
	else
		goto_godliness_and_piety_remove()
}

function goto_godliness_and_piety_remove() {
	log_remove_tiles_from_court(TILE_WHITE)
	if (can_remove_tiles_from_court(TILE_WHITE))
		game.state = "godliness_and_piety_remove"
	else
		end_turn()
}

states.godliness_and_piety_reveal = {
	inactive: "Godliness & Piety",
	prompt() {
		view.prompt = "Godliness & Piety: Reveal all White tiles from your Hand."
		gen_reveal_tiles_into_court(TILE_WHITE)
	},
	tile(tile) {
		reveal_tile_into_court(tile)
		if (!can_reveal_tiles_into_court(TILE_WHITE))
			goto_godliness_and_piety_score()
	},
}

states.godliness_and_piety_score = {
	inactive: "Godliness & Piety",
	prompt() {
		view.prompt = "Godliness & Piety: Score " + calc_godliness_and_piety_score() + " points."
		prompt_score("Godliness & Piety", calc_godliness_and_piety_score())
		gen_action_score()
	},
	score() {
		score_own_points(calc_godliness_and_piety_score())
		if (is_end_of_the_contest())
			return goto_end_of_the_contest()
		goto_godliness_and_piety_remove()
	},
}

states.godliness_and_piety_remove = {
	inactive: "Godliness & Piety",
	prompt() {
		view.prompt = "Godliness & Piety: Remove all White tiles from your Court."
		gen_remove_tiles_from_court(TILE_WHITE)
	},
	tile(tile) {
		remove_tile_from_court(tile)
		if (!can_remove_tiles_from_court(TILE_WHITE))
			end_turn()
	},
}

// === THE ACTIONS: TOURNAMENTS ===

function calc_tournaments_score() {
	return count_tiles(own_court(), TILE_RED)
}

function calc_tournaments_rival_score() {
	return count_tiles(rival_court(), TILE_RED)
}

function goto_tournaments() {
	log_reveal_tiles_into_court(TILE_RED)
	if (can_reveal_tiles_into_court(TILE_RED))
		game.state = "tournaments_reveal"
	else
		goto_tournaments_score_own()
}

function goto_tournaments_score_own() {
	if (calc_tournaments_score())
		game.state = "tournaments_score_own"
	else
		goto_tournaments_remove_own()
}

function goto_tournaments_remove_own() {
	log_remove_tiles_from_court(TILE_RED)
	if (can_remove_tiles_from_court(TILE_RED))
		game.state = "tournaments_remove_own"
	else
		goto_tournaments_score_rival()
}

function goto_tournaments_score_rival() {
	if (calc_tournaments_rival_score())
		game.state = "tournaments_score_rival"
	else
		goto_tournaments_remove_rival()
}

function goto_tournaments_remove_rival() {
	log_remove_tiles_from_rival_court(TILE_RED)
	if (can_remove_tiles_from_rival_court(TILE_RED))
		game.state = "tournaments_remove_rival"
	else
		game.state = "tournaments_secrecy"
}

states.tournaments_reveal = {
	inactive: "Tournaments",
	prompt() {
		view.prompt = "Tournaments: Reveal all Red tiles from your Hand."
		gen_reveal_tiles_into_court(TILE_RED)
	},
	tile(tile) {
		reveal_tile_into_court(tile)
		if (!can_reveal_tiles_into_court(TILE_RED))
			goto_tournaments_score_own()
	},
}

states.tournaments_score_own = {
	inactive: "Tournaments",
	prompt() {
		view.prompt = "Tournaments: Score " + calc_tournaments_score() + " points."
		prompt_score("Tournaments", calc_tournaments_score())
		gen_action_score()
	},
	score() {
		score_own_points(calc_tournaments_score())
		if (is_end_of_the_contest())
			return goto_end_of_the_contest()
		goto_tournaments_remove_own()
	},
}

states.tournaments_remove_own = {
	inactive: "Tournaments",
	prompt() {
		view.prompt = "Tournaments: Remove all Red tiles from your Court."
		gen_remove_tiles_from_court(TILE_RED)
	},
	tile(tile) {
		remove_tile_from_court(tile)
		if (!can_remove_tiles_from_court(TILE_RED))
			goto_tournaments_score_rival()
	},
}

states.tournaments_score_rival = {
	inactive: "Tournaments",
	prompt() {
		prompt_score("Tournaments", calc_tournaments_rival_score(), " for your rival.")
		gen_action_score_rival()
	},
	score() {
		score_rival_points(calc_tournaments_rival_score())
		if (is_end_of_the_contest())
			return goto_end_of_the_contest()
		goto_tournaments_remove_rival()
	},
}

states.tournaments_remove_rival = {
	inactive: "Tournaments",
	prompt() {
		view.prompt = "Tournaments: Remove all Red tiles from rival Court."
		gen_remove_tiles_from_rival_courts(TILE_RED)
	},
	tile(tile) {
		remove_tile_from_rival_court(tile)
		if (!can_remove_tiles_from_rival_court(TILE_RED))
			game.state = "tournaments_secrecy"
	},
}

states.tournaments_secrecy = {
	inactive: "Tournaments",
	prompt() {
		view.prompt = "Tournaments: Gain tiles from the Darkness for you and your rival."
		view.actions.darkness = 1
	},
	darkness() {
		clear_undo()
		gain_secrecy_tiles()
		gain_secrecy_tiles_rival()
		end_turn()
	},
}

// === THE ACTIONS: COLLECTIONS ===

function calc_collections_score() {
	let x1 = count_tiles(own_court(), TILE_GOLD)
	let x2 = count_tiles(own_court(), TILE_BLUE)
	let x3 = count_tiles(own_court(), TILE_WHITE)
	let x4 = count_tiles(own_court(), TILE_RED)
	return Math.min(x1, x2, x3, x4) * 2
}

function goto_collections() {
	log_reveal_tiles_into_court(TILE_GOLD)
	log_reveal_tiles_into_court(TILE_BLUE)
	log_reveal_tiles_into_court(TILE_WHITE)
	log_reveal_tiles_into_court(TILE_RED)
	log_reveal_tiles_into_court(TILE_GREEN)
	if (own_hand().length > 0)
		game.state = "collections_reveal"
	else
		goto_collections_score()
}

function goto_collections_score() {
	if (calc_collections_score())
		game.state = "collections_score"
	else
		end_turn()
}

states.collections_reveal = {
	inactive: "Collections",
	prompt() {
		view.prompt = "Collections: Reveal all tiles from your Hand."
		for (let tile of own_hand())
			gen_action_tile(tile)
	},
	tile(tile) {
		reveal_tile_into_court(tile)
		if (own_hand().length === 0)
			goto_collections_score()
	},
}

states.collections_score = {
	inactive: "Collections",
	prompt() {
		view.prompt = "Collections: Score " + calc_collections_score() + " points."
		prompt_score("Collections", calc_collections_score())
		gen_action_score()
	},
	score() {
		score_own_points(calc_collections_score())
		end_turn()
	}
}

// === END OF THE CONTEST ===

function calc_jewel_score(court) {
	let n = count_tiles(court, TILE_GREEN)
	return n * n
}

function calc_gold_score(score, court) {
	let n = count_tiles(court, TILE_GOLD)
	return n * GOLD_PER_ROW[score / 8 | 0]
}

function goto_end_of_the_contest() {
	log(".x End of the Contest")
	goto_end_of_the_contest_jewels_1()
}

function goto_end_of_the_contest_jewels_1() {
	if (calc_jewel_score(game.red_court))
		game.state = "end_of_the_contest_jewels_1"
	else
		goto_end_of_the_contest_jewels_2()
}

function goto_end_of_the_contest_jewels_2() {
	if (calc_jewel_score(game.blue_court))
		game.state = "end_of_the_contest_jewels_2"
	else
		goto_end_of_the_contest_gold_1()
}

function goto_end_of_the_contest_gold_1() {
	if (calc_gold_score(game.red_score, game.red_court))
		game.state = "end_of_the_contest_gold_1"
	else
		goto_end_of_the_contest_gold_2()
}

function goto_end_of_the_contest_gold_2() {
	if (calc_gold_score(game.blue_score, game.blue_court))
		game.state = "end_of_the_contest_gold_2"
	else
		goto_victory()
}

states.end_of_the_contest_jewels_1 = {
	inactive: "End of the Contest",
	prompt() {
		prompt_score("End of the Contest", calc_jewel_score(game.red_court), " for Red's Jewels.")
		gen_action_score_red()
	},
	score() {
		score_points(RED, calc_jewel_score(game.red_court), " for J")
		goto_end_of_the_contest_jewels_2()
	},
}

states.end_of_the_contest_jewels_2 = {
	inactive: "End of the Contest",
	prompt() {
		prompt_score("End of the Contest", calc_jewel_score(game.blue_court), " for Blue's Jewels.")
		gen_action_score_blue()
	},
	score() {
		score_points(BLUE, calc_jewel_score(game.blue_court), " for J")
		goto_end_of_the_contest_gold_1()
	},
}

states.end_of_the_contest_gold_1 = {
	inactive: "End of the Contest",
	prompt() {
		prompt_score("End of the Contest", calc_gold_score(game.red_score, game.red_court), " for Red's Gold.")
		gen_action_score_red()
	},
	score() {
		score_points(RED, calc_gold_score(game.red_score, game.red_court), " for G")
		goto_end_of_the_contest_gold_2()
	},
}

states.end_of_the_contest_gold_2 = {
	inactive: "End of the Contest",
	prompt() {
		prompt_score("End of the Contest", calc_gold_score(game.blue_score, game.blue_court), " for Blue's Gold.")
		gen_action_score_blue()
	},
	score() {
		score_points(BLUE, calc_gold_score(game.blue_score, game.blue_court), " for G")
		goto_victory()
	},
}

function victory_check(red, blue) {
	if (red > blue)
		return goto_game_over(RED, RED + " wins the game!")
	if (blue > red)
		return goto_game_over(BLUE, BLUE + " wins the game!")
	return true
}

function goto_victory() {

	log("")
	log(RED + " achieves a score of " + game.red_score + ".")
	log(BLUE + " achieves a score of " + game.blue_score + ".")

	if (victory_check(game.red_score, game.blue_score))
		if (victory_check(count_tiles(game.red_court, TILE_WHITE), count_tiles(game.blue_court, TILE_WHITE)))
			if (victory_check(game.red_court.length), game.blue_court.length)
				goto_game_over("Shared", "The two majesties do share victory!")
}

// === COMMON LIBRARY ===

function log(msg) {
	game.log.push(msg)
}

function clear_undo() {
	game.undo.length = 0
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
