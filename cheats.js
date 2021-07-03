const cheats = {};
const cheatState = {
	teleports: false,
	quickref: false,
	tickets: false,
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
}

function setupOptionsListAccountProxy() {
	const bEngine = this['com.stencyl.Engine'].engine;
	
	const optionsListAccount = bEngine.getGameAttribute('OptionsListAccount');
	const handler = {
		get: function(obj, prop) {
			if (cheatState.quickref && Number(prop) === 34) {
				return 0;
			}
			return Reflect.get(...arguments);
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

registerCheat('cheats', function () {
	return Object.keys(cheats).join('\n');
});