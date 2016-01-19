'use strict';

angular.module('clueApp')
	.controller('MainCtrl', function ($scope, game, $q) {
		$(document).ready(function(){
			setTimeout(function () { $(".sheet img").tooltip({ placement : 'top' }); }, 1000);
		});

		/*Start game work flow */
		$scope.setupStep = 4;

		$scope.moveToNextStep = function() 
		{
			$scope.setupStep = $scope.setupStep + 1;			
		}

		/* Data to be entered on start of game */
		$scope.activePlayerIndex = 0;
		var yourCards = [game.createCard(0,1), game.createCard(1,3), game.createCard(2,5)];
		$scope.players = [
			{index: 0, name: 'David', icon: 'images/icons/suspects/plum.png'},
			{index: 1, name: 'Mom', icon: 'images/icons/suspects/peacock.png'},
			{index: 2, name: 'Dad', icon: 'images/icons/suspects/mustard.png'},
			{index: 3, name: 'Jackie', icon: 'images/icons/suspects/scarlet.png'},
			{index: 4, name: 'Steph', icon: 'images/icons/suspects/green.png'},
			{index: 5, name: 'Mike', icon: 'images/icons/suspects/white.png'}
		];

		/* Static Data */
		$scope.suspectCards = game.suspectCards;
		$scope.weaponCards = game.weaponCards;
		$scope.roomCards = game.roomCards;

		$scope.suspectIndex = game.suspectIndex;
		$scope.weaponIndex = game.weaponIndex;
		$scope.roomIndex = game.roomIndex;

		/* Game Data */
		$scope.turns = [];

		/* UI Methods */
		$scope.gameStarted = true;
    	$scope.startGame = function () {
    		game. startGame($scope.activePlayerIndex, $scope.players, yourCards);
    	};

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

    	//Temp for testing
		game.startGame($scope.activePlayerIndex, $scope.players, yourCards);
		//game.makeGuess(game.createGuess(0,0,2,1), undefined, undefined);

		$scope.prepareNextTurn();
  	});