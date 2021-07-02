const cheats = {};

function registerCheat(command, fn) {
	cheats[command] = fn;
}

function cheat(action) {
	try {
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