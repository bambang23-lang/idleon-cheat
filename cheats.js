const cheats = {};
const cheatState = {
	teleports: false,
	quickref: false,
	tickets: false,
	stampcost: false,
	minigames: false,
	minigame: {
		mining: false,
		catching: false,
		fishing: false,
		choppin: false,
	}
};
let setupDone = false;

function registerCheat(command, fn) {
	cheats[command] = fn;
}

function isGameReady() {
	let result = true;

	// Check for engine
	result = !!this['com.stencyl.Engine'];

	return result;
}

function setup() {
	setupDone = true;
	
	// setup proxies
	setupOptionsListAccountProxy.call(this);
	setupCurrenciesOwnedProxy.call(this);
	setupStampCostProxy.call(this);
}

function setupOptionsListAccountProxy() {
	const bEngine = this['com.stencyl.Engine'].engine;
	
	const optionsListAccount = bEngine.getGameAttribute('OptionsListAccount');
	const handler = {
		get: function(obj, prop) {
			if (cheatState.quickref && Number(prop) === 34) {
				return 0;
			}
			if (cheatState.minigames && Number(prop) === 33) {
				return obj[33] || 1;
			}
			return Reflect.get(...arguments);
		},
		set: function(obj, prop, value) {
			if (cheatState.minigames && Number(prop) === 33) {
				if (obj[33] < value) obj[33] = value;
				return true;
			}
			return Reflect.set(...arguments);
		}
	};
	const proxy = new Proxy(optionsListAccount, handler);
	bEngine.setGameAttribute('OptionsListAccount', proxy);
}

function setupCurrenciesOwnedProxy() {
	const bEngine = this['com.stencyl.Engine'].engine;
	const currencies = bEngine.getGameAttribute("CurrenciesOwned").h;
	const handler = {
		get: function(obj, prop) {
			if (cheatState.teleports && prop === 'WorldTeleports') {
				return obj.WorldTeleports || 1;
			}
			if (cheatState.tickets && prop === 'ColosseumTickets') {
				return obj.ColosseumTickets || 1;
			}
			return Reflect.get(...arguments);
		},
		set: function(obj, prop, value) {
			if (cheatState.teleports && prop === 'WorldTeleports') {
				// Do nothing
				return true;
			}
			if (cheatState.tickets && prop === 'ColosseumTickets') {
				if (obj.ColosseumTickets < value) obj.ColosseumTickets = value;
				return true;
			}
			return Reflect.set(...arguments);
		}
	};
	const proxy = new Proxy(currencies, handler);
	bEngine.getGameAttribute('CurrenciesOwned').h = proxy;
}

function setupStampCostProxy() {
	const bEngine = this['com.stencyl.Engine'].engine;
	const actorEvents124 = this['scripts.ActorEvents_124'];
	const stampCostFn = actorEvents124._customBlock_StampCostss;
	const handler = {
		apply: function(originalFn, context, argumentsList) {
			if (cheatState.stampcost) {
				const tab = argumentsList[0];
				const index = argumentsList[1];
				const currentStampLevel = bEngine.getGameAttribute("StampLevel")[tab][index];
				const maxStampLevel = bEngine.getGameAttribute("StampLevelMAX")[tab][index];
				if (currentStampLevel < maxStampLevel) {
					return ['Money', 0];
				}
				return ['PremiumGem', 0];
			}
			return Reflect.apply(originalFn, context, argumentsList);
		}
	};
	const proxy = new Proxy(stampCostFn, handler);
	actorEvents124._customBlock_StampCostss = proxy;
}

function setupMinigameProxy() {
	const bEngine = this['com.stencyl.Engine'].engine;

	const miningGameOver = bEngine.getGameAttribute("PixelHelperActor")[4].getValue('ActorEvents_229', '_customEvent_MiningGameOver');
	const handlerMining = {
		apply: function(originalFn, context, argumentsList) {
			if (cheatState.minigame.mining) {
				return;
			}
			return Reflect.apply(originalFn, context, argumentsList);
		}
	};
	const proxyMining = new Proxy(miningGameOver, handlerMining);	
	bEngine.getGameAttribute("PixelHelperActor")[4].setValue('ActorEvents_229', '_customEvent_MiningGameOver', proxyMining);

	const fishingGameOver = bEngine.getGameAttribute("PixelHelperActor")[4].getValue('ActorEvents_229', '_customEvent_FishingGameOver');
	const handlerFishing = {
		apply: function(originalFn, context, argumentsList) {
			if (cheatState.minigame.fishing) {
				return;
			}
			return Reflect.apply(originalFn, context, argumentsList);
		}
	};
	const proxyFishing = new Proxy(fishingGameOver, handlerFishing);
	bEngine.getGameAttribute("PixelHelperActor")[4].setValue('ActorEvents_229', '_customEvent_FishingGameOver', proxyFishing);

	const catchingGameOver = bEngine.getGameAttribute("PixelHelperActor")[4].getValue('ActorEvents_229', '_customEvent_CatchingGameOver');
	const handlerCatching = {
		apply: function(originalFn, context, argumentsList) {
			if (cheatState.minigame.catching) {
				return;
			}
			return Reflect.apply(originalFn, context, argumentsList);
		}
	};
	const proxyCatching = new Proxy(catchingGameOver, handlerCatching);
	bEngine.getGameAttribute("PixelHelperActor")[4].setValue('ActorEvents_229', '_customEvent_CatchingGameOver', proxyCatching);
}

function cheat(action) {
	try {
		if (!isGameReady.call(this)) return 'Game is not ready.';
		if (!setupDone) setup.call(this);
		const [command, ...params] = action.split(' ');
		const foundCheat = cheats[command];
		if (foundCheat) {
			const result = foundCheat.call(this, params);
			return result ?? 'Done.';
		} else {
			return `${command} is not a valid option.`;
		}
	} catch (error) {
		return `Error: ${error}`;
	}
}

registerCheat('drop', function (params) {
	const bEngine = this['com.stencyl.Engine'].engine;
	const itemDefs = this['scripts.ItemDefinitions'].itemDefs.h;
	const actorEvents189 = this['scripts.ActorEvents_189'];

	const character = bEngine.getGameAttribute('OtherPlayers').h[bEngine.getGameAttribute('UserInfo')[0]];

	const item = params[0];
	const amount = params[1] || 1;
	try {
		const itemDefinition = itemDefs[item];
		if (itemDefinition) {
			let x = character.getXCenter()
			let y = character.getValue('ActorEvents_20', '_PlayerNode');
			actorEvents189._customBlock_DropSomething(item, amount, 0, 0, 2, y, 0, x, y);
			return `Dropped ${itemDefinition.h.displayName.replace(/_/g, ' ')}. (x${amount})`;
		} else {
			return `No item found for '${item}'`;
		}
	} catch (err) {
		return `Error: ${err}`;
	}
});

registerCheat('search', function (params) {
	const itemDefs = this['scripts.ItemDefinitions'].itemDefs.h;

	const query = params && params.length ? params.join(' ').toLowerCase() : undefined;
	if (query) {
		const foundItems = [];
		for (const [key, value] of Object.entries(itemDefs)) {
			const itemName = value.h.displayName.replace(/_/g, ' ').toLowerCase();
			if (itemName.includes(query)) {
				foundItems.push(`${key} - ${itemName}`);
			}
		}
		if (foundItems.length > 0) {
			return foundItems.join('\n');
		} else {
			return `No item found for '${query}'`;
		}
	}
});

registerCheat('quickref', function () {
	cheatState.quickref = !cheatState.quickref;
	return `${cheatState.quickref ? 'Activated' : 'Deactived'} quickref.`
});

registerCheat('teleports', function () {
	cheatState.teleports = !cheatState.teleports;
	return `${cheatState.teleports ? 'Activated' : 'Deactived'} teleports.`
});

registerCheat('tickets', function () {
	cheatState.tickets = !cheatState.tickets;
	return `${cheatState.tickets ? 'Activated' : 'Deactived'} tickets.`
});

registerCheat('stampcost', function () {
	cheatState.stampcost = !cheatState.stampcost;
	return `${cheatState.stampcost ? 'Activated' : 'Deactived'} stampcost.`
});

registerCheat('minigame', function (params) {
	// setup needs to be repeated, because currently swapping players would break the setup.
	setupMinigameProxy.call(this);
	if (!params || params.length === 0) {
		cheatState.minigames = !cheatState.minigames;
		return `${cheatState.minigames ? 'Activated' : 'Deactived'} unlimited minigames.`
	}
	if (params && params[0] === 'mining') {
		cheatState.minigame.mining = !cheatState.minigame.mining;
		return `${cheatState.minigame.mining ? 'Activated' : 'Deactived'} minigame mining.`
	}
	if (params && params[0] === 'fishing') {
		cheatState.minigame.fishing = !cheatState.minigame.fishing;
		return `${cheatState.minigame.fishing ? 'Activated' : 'Deactived'} minigame fishing.`
	}
	if (params && params[0] === 'catching') {
		// cheatState.minigame.catching = !cheatState.minigame.catching;
		// return `${cheatState.minigame.catching ? 'Activated' : 'Deactived'} minigame catching.`
		return 'TODO.';
	}
	if (params && params[0] === 'choppin') {
		// cheatState.minigame.choppin = !cheatState.minigame.choppin;
		// return `${cheatState.minigame.choppin ? 'Activated' : 'Deactived'} minigame choppin.`
		return 'TODO.';
	}
	return `${params ? params[0] : ''} not supported.`;
});

registerCheat('cheats', function () {
	return Object.keys(cheats).join('\n');
});