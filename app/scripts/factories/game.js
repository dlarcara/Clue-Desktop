'use strict';

angular.module('clueApp')
	.factory('game', function () {
		/* Static Data */
		var suspectIndex = 0;
		var weaponIndex = 1;
		var roomIndex = 2;

		var suspectCards = [
			{index: 0, name: 'Professor Plum', icon: 'images/icons/suspects/plum.png', card: 'images/cards/suspects/plum.png' },
			{index: 1, name: 'Miss Scarlet', icon: 'images/icons/suspects/scarlet.png', card: 'images/cards/suspects/scarlet.png' },
			{index: 2, name: 'Mrs. White', icon: 'images/icons/suspects/white.png', card: 'images/cards/suspects/white.png' },
			{index: 3, name: 'Mr. Green', icon: 'images/icons/suspects/green.png', card: 'images/cards/suspects/green.png' },
			{index: 4, name: 'Mrs. Peacock', icon: 'images/icons/suspects/peacock.png', card: 'images/cards/suspects/peacock.png' },
			{index: 5, name: 'Colonel Mustard',  icon: 'images/icons/suspects/mustard.png', card: 'images/cards/suspects/mustard.png' }
		];
		var weaponCards = [
			{index: 0, name: 'Candlestick', icon: 'images/icons/weapons/candlestick.png', card: 'images/cards/weapons/candlestick.png' },
			{index: 1, name: 'Knife', icon: 'images/icons/weapons/knife.png', card: 'images/cards/weapons/knife.png' },
			{index: 2, name: 'Lead Pipe', icon: 'images/icons/weapons/leadpipe.png', card: 'images/cards/weapons/leadpipe.png' },
			{index: 3, name: 'Revolver', icon: 'images/icons/weapons/revolver.png', card: 'images/cards/weapons/revolver.png' },
			{index: 4, name: 'Rope', icon: 'images/icons/weapons/rope.png', card: 'images/cards/weapons/rope.png' },
			{index: 5, name: 'Wrench',  icon: 'images/icons/weapons/wrench.png', card: 'images/cards/weapons/wrench.png' }
		];
		var roomCards = [
			{index: 0, name: 'Conservatory', icon: 'images/icons/rooms/conservatory.png', card: 'images/cards/rooms/conservatory.png' },
			{index: 1, name: 'Lounge', icon: 'images/icons/rooms/lounge.png', card: 'images/cards/rooms/lounge.png' },
			{index: 2, name: 'Kitchen', icon: 'images/icons/rooms/kitchen.png', card: 'images/cards/rooms/kitchen.png' },
			{index: 3, name: 'Library', icon: 'images/icons/rooms/library.png', card: 'images/cards/rooms/library.png' },
			{index: 4, name: 'Hall', icon: 'images/icons/rooms/hall.png', card: 'images/cards/rooms/hall.png' },
			{index: 5, name: 'Study', icon: 'images/icons/rooms/study.png', card: 'images/cards/rooms/study.png' },
			{index: 6, name: 'Ballroom', icon: 'images/icons/rooms/ballroom.png', card: 'images/cards/rooms/ballroom.png' },
			{index: 7, name: 'Dining Room', icon: 'images/icons/rooms/diningroom.png', card: 'images/cards/rooms/diningroom.png' },
			{index: 8, name: 'Billiard Room', icon: 'images/icons/rooms/billiardroom.png', card: 'images/cards/rooms/billiardroom.png' }
		];

		/* Game Specific Data */
		var players;
		var sheet;
		var unknownShows = [];
		var verdict = new verdict();

		/* Starting Game */
		function startGame(you, playerNames, yourCards) {
			players = playerNames;

			sheet = [
				suspectCards.map(function (item) { return new Array(players.length); }), 
				weaponCards.map(function (item) { return new Array(players.length); }),
				roomCards.map(function (item) { return new Array(players.length); })
			];

			yourCards.each(function (card) { markCardAsHad(you, card)});
		}

		/* Taking Turns */
		function makeGuess(guess, shower, card)
		{
			fillInNoShowsFromTurn(guess, shower);

			if (shower != undefined && card != undefined)
				markCardAsHad(shower, card);

			reconcileSheet();

			checkForVerdict();
		}

		function trackGuess(guess, shower)
		{
			fillInNoShowsFromTurn(guess, shower);

			if (shower != undefined)
				enterUnknownShow(guess, shower);

			reconcileSheet();

			checkForVerdict();
		}

		function fillInNoShowsFromTurn(guess, shower)
		{
			var endOfTurn = (shower == undefined) ? guess.player : shower;
			var playerIndex = getNextPlayerIndex(guess.player);
			
			while(playerIndex != endOfTurn)
			{ 
				markCardAsNotHad(playerIndex, new card(suspectIndex, guess.suspect));
				markCardAsNotHad(playerIndex, new card(weaponIndex, guess.weapon));
				markCardAsNotHad(playerIndex, new card(roomIndex, guess.room));

				playerIndex = getNextPlayerIndex(playerIndex);
			}
		}

		function getNextPlayerIndex(currentPlayerIndex)
		{
			return (currentPlayerIndex == (players.length - 1)) ? 0 : currentPlayerIndex + 1;
		}

		/* Card Tracking */
		function markCardAsHad(player, card)
		{
			console.info('Marking player ' + player + ' as having card ' + card.category + ',' + card.index);

			sheet[card.category][card.index][player] = 1;
			
			markOtherPlayersAsNotHavingCard(player, card);

			markPlayerAsNotHavingOtherCardsIfAllTheirCardsAreKnown(player);
		}

		function markOtherPlayersAsNotHavingCard(player, card)
		{
			players.each(function (item, index) { 
				if (index != player)
					markCardAsNotHad(index, card); 
			});
		}

		function markPlayerAsNotHavingOtherCardsIfAllTheirCardsAreKnown(player)
		{
			var totalPlayerCards = ((suspectCards.length + weaponCards.length + roomCards.length) / players.length).floor();
			var knownCards = getCardsPlayerHas(player);
			
			if (totalPlayerCards == knownCards.length)
			{
				fillOutCategoryForPlayerWithDontHaves(player, suspectIndex);
				fillOutCategoryForPlayerWithDontHaves(player, weaponIndex);
				fillOutCategoryForPlayerWithDontHaves(player, roomIndex);
			}
		}

		function fillOutCategoryForPlayerWithDontHaves(player, categoryIndex)
		{
			sheet[categoryIndex].each(function (value, index) {
				if (value[player] != 1)
					markCardAsNotHad(player, new card(categoryIndex, index));
			});
		}

		function markCardAsNotHad(player, card)
		{
			console.info('Marking player ' + player + ' as not having card ' + card.category + ',' + card.index);

			sheet[card.category][card.index][player] = 0;
		}

		function markCardAsVerdict(card)
		{
			if (verdictIsKnown(card.category))
				return;

			setVerdict(card);

			players.each(function (playerName, index) { 
				markCardAsNotHad(index, card);
			});
		}

		function setVerdict(card)
		{
			if (card.category == suspectIndex)
				verdict.suspect = card.index;
			else if (card.category == weaponIndex)
				verdict.weapon = card.index;
			else if (card.category == roomIndex)
				verdict.room = card.index;
		}

		/* Card Utility Methods */
		function getCardStatusForPlayer(categoryIndex, indexInCategory, player)
		{
			var status = sheet[categoryIndex][indexInCategory][player];
			
			if (status != undefined)
				return status;

			var unknownShowsForPlayerAndCard = unknownShows.filter(function (show)
			{
				if (show.player != player)
					return false;

				if (categoryIndex == suspectIndex && show.suspect == indexInCategory)
					return true;
				else if (categoryIndex == weaponIndex && show.weapon == indexInCategory)
					return true;
				else if (categoryIndex == roomIndex && show.room == indexInCategory)
					return true;

				return false;
			});

			if (unknownShowsForPlayerAndCard.length > 0)
				return unknownShowsForPlayerAndCard;

			return undefined;
		}

		function getCardsPlayerDoesNotHave(player)
		{
			return getCardsPlayerDoesNotHaveForCategory(player, suspectIndex)
						.add(getCardsPlayerDoesNotHaveForCategory(player, weaponIndex))
						.add(getCardsPlayerDoesNotHaveForCategory(player, roomIndex));
		}

		function getCardsPlayerDoesNotHaveForCategory(player, categoryIndex)
		{
			return sheet[categoryIndex]
						.map(function(value, index) { 
							if (value[player] == 0)
								return new card(categoryIndex, index); 

							return undefined;
						})
						.compact();
		}

		function getCardsPlayerHas(player)
		{
			return getCardsPlayerHasForCategory(player, suspectIndex)
						.add(getCardsPlayerHasForCategory(player, weaponIndex))
						.add(getCardsPlayerHasForCategory(player, roomIndex));
		}

		function getCardsPlayerHasForCategory(player, categoryIndex)
		{
			return sheet[categoryIndex]
						.map(function(value, index) { 
							if (value[player] == 1)
								return new card(categoryIndex, index); 

							return undefined;
						})
						.compact();
		}

		/* Checking Previous Guesses */
		function enterUnknownShow(guess, shower) {
			unknownShows.add(new show(shower, guess.suspect, guess.weapon, guess.room));
		}

		function reconcileSheet()
		{
			var resolvedUnknownShowCount = clearResolvedUnknownShows();

			var categoryResolved = resolveFullyKnownCategories();

			if (resolvedUnknownShowCount > 0 || categoryResolved)
				reconcileSheet();
		}

		function clearResolvedUnknownShows()
		{
			var resolvedCount = 0;
			unknownShows.each(function(show)
			{
				var cardFromShowPlayerMustHave = getCardFromShowPlayerHas(show);

				if (cardFromShowPlayerMustHave)
				{
					markCardAsHad(show.player, cardFromShowPlayerMustHave);
					unknownShows.remove(show);
					resolvedCount++;
				}
			});

			return resolvedCount;
		}

		function getCardFromShowPlayerHas(show)
		{
			var cardsFromShowPlayerDoesNotHave = getCardsFromShowPlayerDoesNotHave(show);

			var cardsFromShow = [new card(suspectIndex, show.suspect), new card(weaponIndex, show.weapon), new card(roomIndex, show.room)];
			var cardsTheyMayHave = cardsFromShow.filter(function (card)
			{
				return !cardsFromShowPlayerDoesNotHave.any(function (item) 
				{ 
					return item.index == card.index && item.category == card.category;
				});
			});

			if (cardsTheyMayHave.length == 1)
				return cardsTheyMayHave[0];

			return undefined;
		}

		function getCardsFromShowPlayerDoesNotHave(show)
		{
			var cardsPlayerDoesNotHave = getCardsPlayerDoesNotHave(show.player);

			return cardsPlayerDoesNotHave.filter(function (card)
			{
				return (card.category == suspectIndex && show.suspect == card.index) ||
					   (card.category == weaponIndex && show.weapon == card.index) ||
					   (card.category == roomIndex && show.room == card.index);
			});
		}

		function resolveFullyKnownCategories()
		{
			var suspectResolved = resolveFullyKnownCategory(suspectIndex, suspectCards.length);
			var weaponResolved = resolveFullyKnownCategory(weaponIndex, weaponCards.length);
			var roomResolved = resolveFullyKnownCategory(roomIndex, roomCards.length);

			return suspectResolved || weaponResolved || roomResolved;
		}

		function resolveFullyKnownCategory(categoryIndex, totalCount)
		{
			if (verdictIsKnown(categoryIndex))
				return false;

			var knownCardsForCategory = sheet[categoryIndex].filter(function (list)
			{
				return list.any(function (value) {
					return value == 1;
				})
			});

			if (knownCardsForCategory.length == totalCount - 1)
			{
				var verdictCard = sheet[categoryIndex].map(function (list, index)
									{
										if (list.none(function (value) { return value == 1; }))
											return new card(categoryIndex, index);

										return undefined;
									}).compact()[0];

				
				markCardAsVerdict(verdictCard);
			}

			return false;
		}

		/* Checking for a verdict */
		function checkForVerdict()
		{
			var suspect = checkCategoryForVerdict(suspectIndex);
			var weapon = checkCategoryForVerdict(weaponIndex);
			var room = checkCategoryForVerdict(roomIndex);

			console.info("Suspect: " + suspect + " - Weapon: " + weapon + " - Room: " + room);
		}

		function checkCategoryForVerdict(categoryIndex)
		{
			var foundIndex = undefined;
			sheet[categoryIndex].each(function (list, index)
			{
				if (list.count(function (value) { return value == 0; }) == players.length)
				{
					foundIndex = index;
					return;
				}
			});

			if (foundIndex != undefined)
				markCardAsVerdict(new card(categoryIndex, foundIndex));

			return foundIndex;
		}

		function verdictIsKnown(categoryIndex)
		{
			if (categoryIndex == suspectIndex)
				return verdict.suspect != undefined;
			else if (categoryIndex == weaponIndex)
				return verdict.weapon != undefined;
			else if (categoryIndex == roomIndex)
				return verdict.room != undefined;

			return false;
		}

		/* Data Objects */
		function card(category, index)
		{
			this.category = category;
			this.index = index;
		}

		function guess(player, suspect, weapon, room)
		{
			this.player = player;
			this.suspect = suspect;
			this.weapon = weapon;
			this.room = room;
		}

		function show(player, suspect, weapon, room)
		{
			this.player = player;
			this.suspect = suspect;
			this.weapon = weapon;
			this.room = room;
		}

		function verdict(suspect, weapon, room)
		{
			this.suspect = suspect;
			this.weapon = weapon;
			this.room = room;
		}

		return {
			suspectCards: suspectCards,
			weaponCards: weaponCards,
			roomCards: roomCards,
			suspectIndex: suspectIndex,
			weaponIndex: weaponIndex,
			roomIndex: roomIndex,

			startGame: startGame,
			makeGuess: makeGuess,
			trackGuess: trackGuess,
			
			createCard: function (category, index) { return new card(category, index); },
			createGuess: function (player, suspect, weapon, room) { return new guess(player, suspect, weapon, room); },
			createShow: function (player, suspect, weapon, room) { return new show(player, suspect, weapon, room); },
			
			getCardStatusForPlayer: getCardStatusForPlayer,
			getVerdict: function () { return verdict; }
		};
	});