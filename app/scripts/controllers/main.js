'use strict';

angular.module('clueApp')
	.controller('MainCtrl', function ($scope, game) {
		/*Start game work flow */
		$scope.setupStep = 1;

		$scope.moveToNextStep = function() 
		{
			$scope.setupStep = $scope.setupStep + 1;

            if ($scope.setupStep == 4)
            {
                var yourCards = $scope.cards.yourCards.map(function (card) { return game.createCard(card.category, card.index)});

                game.startGame($scope.activePlayerIndex, $scope.players, yourCards);
                
                $scope.prepareNextTurn();
            }
		}

        $scope.setupPlayers = function()
        {
            $scope.players = $scope.playerInput
                .filter(function(item) { return item.active; })
                .map(function (item, index)
                {
                    return {index: index, name: item.name, icon: item.icon, extraCard: false};
                });
            $scope.activePlayerIndex = $scope.players.filter(function(player) { return player.icon == $scope.startupForm.activePlayer.icon; })[0].index;

            $scope.moveToNextStep();
        };

        $scope.startupForm = {};
        $scope.validInputPlayers = function () 
        {
            if (!$scope.startupForm.activePlayer)
                return false;

            if ($scope.playerInput.filter(function (item) { return item.active && item.name; }).length < 3)
                return false

            return true;
        }

        $scope.playerInput = [
            {name: undefined, icon: 'images/icons/suspects/plum.png', piece: 'Professor Plum', active: true },
            {name: undefined, icon: 'images/icons/suspects/peacock.png', piece: 'Miss Peacock', active: true },
            {name: undefined, icon: 'images/icons/suspects/mustard.png', piece: 'Colonel Mustard', active: true },
            {name: undefined, icon: 'images/icons/suspects/scarlet.png', piece: 'Miss Scarlet' },
            {name: undefined, icon: 'images/icons/suspects/green.png', piece: 'Mr. Green' },
            {name: undefined, icon: 'images/icons/suspects/white.png', piece: 'Mrs. White' }
        ];

        $scope.cardsValid = function () 
        {
            if ($scope.players.length == 4 && $scope.players.count(function (player) { return player.extraCard; }) != 2)
                return false;

            if ($scope.players.length == 5 && $scope.players.count(function (player) { return player.extraCard; }) != 3)
                return false;
                
            if (game.getPlayerNumberOfCards($scope.activePlayerIndex, $scope.players) != $scope.cards.yourCards.length)
                return false;

            return true;
        }

		/* Static Data */
		$scope.suspectCards = game.suspectCards;
		$scope.weaponCards = game.weaponCards;
		$scope.roomCards = game.roomCards;

		$scope.suspectIndex = game.suspectIndex;
		$scope.weaponIndex = game.weaponIndex;
		$scope.roomIndex = game.roomIndex;

        $scope.cards =
        {
            availableCards: getCardGroupForSelection(0, $scope.suspectCards).concat(getCardGroupForSelection(1, $scope.weaponCards)).concat(getCardGroupForSelection(2, $scope.roomCards)),
            yourCards: []
        }

        function getCardGroupForSelection(category, suspects)
        {
            var categories = ['Susepcts', 'Weapons', 'Rooms'];
            
            var groupStart = [{ name: "<strong>" + categories[category] + "</strong>", msGroup: true }];
            var groupEnd = [{ msGroup: false }];

            return groupStart.concat(suspects.map(function (card) { return formatCardForSelection(category, card); })).concat(groupEnd);
        }

        function formatCardForSelection(category, card)
        {
            return {icon: "<img  src=" + card.icon + " />", name: card.name, category: category, index: card.index };
        }

		/* Game Data */
		$scope.turns = [];

		/* UI Methods */
		$scope.getPlayerName = function (playerIndex)
		{
			 return player.index == activePlayerIndex ? 'You' : players[playerIndex].name;
		}

    	$scope.getCellClass = function(category, indexInCategory, playerIndex)
    	{
    		var itemStatus = game.getCardStatusForPlayer(category, indexInCategory, playerIndex);

    		if (itemStatus == 1)
    			return "sheet-cell-have";
    		else if (itemStatus == 0)
    			return "sheet-cell-have-not";
    		else if (Array.isArray(itemStatus))
    			return 'sheet-cell-maybe';

			return 'sheet-cell-unknown';
    	}

    	$scope.showncard = { category: undefined, suspectShown: false, weaponShown: false, roomShown: false };
    	$scope.shownCardChanged = function (category) 
    	{
    		$scope.showncard.category = category;

    		if (category == $scope.suspectIndex)
    		{
				$scope.showncard.category = $scope.showncard.suspectShown ? $scope.suspectIndex : undefined;

    			$scope.showncard.weaponShown = false;
    			$scope.showncard.roomShown = false;
    		}
    		else if (category == $scope.weaponIndex)
    		{
    			$scope.showncard.category = $scope.showncard.weaponShown ? $scope.weaponIndex : undefined;

				$scope.showncard.suspectShown = false;
    			$scope.showncard.roomShown = false;
    		}
    		else if (category == $scope.roomIndex)
    		{
    			$scope.showncard.category = $scope.showncard.roomShown ? $scope.roomIndex : undefined;

    			$scope.showncard.suspectShown = false;
    			$scope.showncard.weaponShown = false;	
    		}
    	}

    	$scope.getShowers = function () 
    	{
    		var options = $scope.players.filter(function(player)
    			{
    				return player.index != $scope.activeTurn.player.index;
    			}).map(function(player)
    			{
    				var player = Object.clone(player);

    				if (player.index == $scope.activePlayerIndex)
    					player.name = 'You';

    				return player;
    			});

			options.add({index: undefined, name: 'No One'});

    		return options;
    	}

    	$scope.showerIsPicked = function () 
    	{
    		if ($scope.activePlayerIndex != $scope.activeTurn.player.index)
    			return true;

			if ($scope.formInput.shower.index != undefined && $scope.showncard.category == undefined)
    			return false;

    		if ($scope.formInput.shower.index == undefined && $scope.showncard.category != undefined)
    			return false;

    		return true;
    	}

    	$scope.enterGuess = function (player, suspect, weapon, room, shower, shownCardCategory) 
    	{
    		var guess = game.createGuess(player, suspect, weapon, room);

    		if (player == $scope.activePlayerIndex)
    		{
    			var shownCard;
    			if (shownCardCategory == $scope.suspectIndex)
    				shownCard = game.createCard($scope.suspectIndex, suspect);
    			else if (shownCardCategory == $scope.weaponIndex)
    				shownCard = game.createCard($scope.weaponIndex, weapon);
    			else if (shownCardCategory == $scope.roomIndex)
    				shownCard = game.createCard($scope.roomIndex, room);

    			game.makeGuess(guess, shower, shownCard);
    		}
    		else
    		{
    			game.trackGuess(guess, shower);
    		}
    		
    		$scope.endTurn();
    	};

    	$scope.endTurn = function()
    	{
			$scope.prepareNextTurn();

			$scope.verdict = game.getVerdict();

    		resetForm();
    	}

    	$scope.prepareNextTurn = function()
    	{
    		var turn = {player: $scope.players[getNextTurnPlayerIndex()]};

    		$scope.activeTurn = turn;
    		$scope.turns.add(turn);
    	}

    	function getNextTurnPlayerIndex() 
    	{
    		if ($scope.turns.length == 0)
    			return 0;

			var lastTurnPlayerIndex = $scope.turns[$scope.turns.length-1].player.index;
			var nextTurnPlayerIndex = (lastTurnPlayerIndex == $scope.players.length - 1) ? 0 : lastTurnPlayerIndex + 1;

			return nextTurnPlayerIndex;
    	}

    	$scope.getThisTurnDisplay = function () 
    	{
    		if ($scope.activeTurn.player.index == $scope.activePlayerIndex)
    			return 'Enter your guess';

    		return "Enter " + $scope.players[$scope.activeTurn.player.index].name + "'s guess"; 
    	}

    	$scope.formInput = {suspect: undefined, weapon: undefined, room: undefined, shower: undefined};
    	function resetForm()
    	{
    		$scope.formInput.suspect = undefined;
    		$scope.formInput.weapon =  undefined;
    		$scope.formInput.room =  undefined;
    		$scope.formInput.shower =  undefined;

    		$scope.showncard.category = undefined;
    		$scope.showncard.suspectShown = false;
    		$scope.showncard.weaponShown = false;
    		$scope.showncard.roomShown = false;
    	}
  	});