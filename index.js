// Put your JavaScript in this file.
'use strict';   // Enable "strict mode".  Note: This *must* be the first statement in the script.
                // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode


      var PLAYER_ONE_SYMBOL = "X";
      var PLAYER_TWO_SYMBOL = "O";

      // define constant vars to represent game status
      var GAME_CONTINUE = 0;
      var GAME_WINNER = 1;
      var GAME_TIE = 2;

      var gameCount = 0;
      var mySymbol;
  //    var currentPlayer = PLAYER_ONE_SYMBOL;
      var numberOfMoves = 0; // if numberOfMoves reaches 9 and there is no winner, it's a tie!

      // retrieve the screen elements into global variables
      var board = document.getElementById("board");  // only 1 board, use ID
      var replayButton = document.getElementById("replayButton");
      var resetDataButton = document.getElementById("resetDataButton");

      var results = document.getElementById("resultsText");
      results.innerHTML = "";
      var foundWinner = false;  // simple boolen for use in loop

// --------------Firestore stuff --------------------

// Initialize Firebase
  var config = {
    apiKey: "AIzaSyAogQtXZ70CAljvjn7NG9Xq3vxG20hffZ8",
    authDomain: "assassin2-80047.firebaseapp.com",
    databaseURL: "https://assassin2-80047.firebaseio.com",
    projectId: "assassin2-80047",
    storageBucket: "assassin2-80047.appspot.com",
    messagingSenderId: "868573980926"
  };

  firebase.initializeApp(config);
  var db = firebase.firestore();

  // retrieve data from firestore and store in global vars, add listeners
  var gameStartedRef = db.collection("Status").doc("gameStarted");
  var gameStarted = "";

  // Initial get on gameStarted.  Only run once
  gameStartedRef.get().then(function(doc) {
      if (doc.exists)
      {
          console.log("Document data here:", doc.data());
          gameStarted = doc.data().val;

          if (gameStarted == false)
          {
              console.log("Within the Get Here - looking for this - how early");

              var zz;
              for (zz=0;zz<9;zz++)
              {
                db.collection("Squares").doc(String(zz)).set({val:""});
              }

              db.collection("Status").doc("gameStarted").set({val:true});

              console.log("Within the Get Here - but after the next set");

              mySymbol = PLAYER_ONE_SYMBOL;

          } // end if gameStarted == false
          else
          {
              mySymbol = PLAYER_TWO_SYMBOL;
              gameCount++;
              console.log("Looking here - xxx - how early");

              //initializeGame = true;
          }  // end else gameStarted == false

        } // emd of doc.exists
        else {
          // doc.data() will be undefined in this case
          console.log("No such document!");
      }
  }).catch(function(error) {
      console.log("Error getting document:", error);
  });

// ---- gameStarted listener  -----------

gameStartedRef.onSnapshot(function(doc)
{
  var gameStartedFromDB = doc.data().val;

  if (gameStartedFromDB == false)
  {

    console.log("Within the Snapshot Here");

    // reset turn to player 1 and reset global vars
    currentPlayer = PLAYER_ONE_SYMBOL;
    numberOfMoves = 0; // if numberOfMoves reaches 9 and there is no winner, it's a tie!
    console.log("number of moves after restart game : " + numberOfMoves);
    foundWinner = false;  // reset var

    // reset results area
    results.innerHTML = "You are " + mySymbol + "s.   " + currentPlayer + "s Turn.";
    // results.innerHTML = currentPlayer + "s Turn.";

    replayButton.style.visibility = "hidden";

    if (gameCount > 0)
      db.collection("Status").doc("gameStarted").set({val:true});

    gameCount++;

  }

});

// --------  end gameStarted listener  -----------

  var currentPlayerRef = db.collection("Status").doc("currentPlayer");
  var currentPlayer = "";

  currentPlayerRef.get().then(function(doc) {
        if (doc.exists) {
            console.log("Document data:", doc.data());
            currentPlayer = doc.data().val;
        } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
        }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });

    currentPlayerRef.onSnapshot(function(doc)
    {
      currentPlayer = doc.data().val;

      // increment move counter if other guy moved
      if ((currentPlayer == mySymbol) && ((numberOfMoves != 0) || (mySymbol == PLAYER_TWO_SYMBOL)))
      {
        numberOfMoves++;
        console.log("Move number snapshot : " + numberOfMoves);
      }
      results.innerHTML = "You are " + mySymbol + "s.   " + currentPlayer + "s Turn.";
      // document.getElementById("playerName").innerHTML = myData.first;
    });


  // get refs to the 9 squares
  var dbSquareRef = new Array; // global array storing values in DB
  // var docRef = db.collection("Players").doc("FquLRhCjkzwRZnP0sj8h");

  var zz;
  for (zz=0;zz<9;zz++)
  {
    dbSquareRef.push(db.collection("Squares").doc(String(zz)));

    // add the listener

    dbSquareRef[zz].onSnapshot(function(doc)
    {
      const myData = doc.data();
      const myID = doc.id;

      var allSquares = document.querySelectorAll('.square');

      allSquares[myID].innerHTML = myData.val;

      var check = checkForWinner();  // function returns 1 of 3 game statuses - Continue, Tie, or Win

      // 3 possible status options:
      switch (check)
      {
        case GAME_CONTINUE:  // Do nothing
          break;

        case GAME_TIE:
          results.innerHTML = "Game ended in a tie!";
          console.log ("Game ended in a tie!");
          replayButton.style.visibility = "visible";  // make the button visible
          break;

        default:    // GAME_WINNER
            results.innerHTML = currentPlayer + " Won!";
            console.log (currentPlayer + " Won!");
            replayButton.style.visibility = "visible";  // make the button visible

      } // end switch

    });

  }

// -------------------- end Firestore stuff  ----------

// --- Click event on a board, but the actual event is on a square
      board.addEventListener('click', function(e)
      {
    //      if (initializeGame == false)
    //        initializeTheGame();

        // don't allow user to click on an occupied square or an empty square after the game is already over
        if ((e.target.innerHTML != "") || (foundWinner == true))
        {
          return;  // return immediately
        }

        // check if its my turn
        if (currentPlayer != mySymbol)
          return;

        // update square to current turn's symbol - legal play
        e.target.innerHTML = currentPlayer;

        numberOfMoves++;  // increase only if valid move

        console.log("My own turn Move number : " + numberOfMoves);
        // update database
        //alert("Square id = " + e.target.id);

        db.collection("Squares").doc(String(e.target.id)).set({val:currentPlayer});

        var check = checkForWinner();  // function returns 1 of 3 game statuses - Continue, Tie, or Win

        // 3 possible status options:
        switch (check)
        {
          case GAME_CONTINUE:  // No winner, flip turn and continue game

            // flip the currentPlayer variable to the next player using the ternery operator
            if (currentPlayer == PLAYER_ONE_SYMBOL)
            {
              currentPlayer = PLAYER_TWO_SYMBOL;
              db.collection("Status").doc("currentPlayer").set({val:PLAYER_TWO_SYMBOL});
            }
            else
            {
              currentPlayer = PLAYER_ONE_SYMBOL;
              db.collection("Status").doc("currentPlayer").set({val:PLAYER_ONE_SYMBOL});
            }

            break;

          case GAME_TIE:
            results.innerHTML = "Game ended in a tie!";
            console.log ("Game ended in a tie!");
            replayButton.style.visibility = "visible";  // make the button visible
            break;

          default:    // GAME_WINNER
              results.innerHTML = currentPlayer + " Won!";
              console.log (currentPlayer + " Won!");
              replayButton.style.visibility = "visible";  // make the button visible

        } // end switch

      });  // end of the board eventlistener

// --- Click event on the reset data button -------------------
      resetDataButton.addEventListener('click', function(e)
      {

        db.collection("Status").doc("currentPlayer").set({val:PLAYER_ONE_SYMBOL});
        db.collection("Status").doc("gameStarted").set({val:false});

        var zz;
        for (zz=0;zz<9;zz++)
        {
          db.collection("Squares").doc(String(zz)).set({val:""});
        }

        gameCount = 0;

        // currentPlayer = PLAYER_ONE_SYMBOL;
        results.innerHTML = "";
        // numberOfMoves = 0;

      });  // end reset data button listener function

// ----------------------------

      replayButton.addEventListener('click', function(e)
      {

        db.collection("Status").doc("currentPlayer").set({val:PLAYER_ONE_SYMBOL});
        db.collection("Status").doc("gameStarted").set({val:false});


          // update database to blanks
          var zz;
          for (zz=0;zz<9;zz++)
          {
            db.collection("Squares").doc(String(zz)).set({val:""});
          }

          results.innerHTML = "You are " + mySymbol + "s.   " + currentPlayer + "s Turn.";

      });  // end replay button listener function

// ---- Begin - Check for Winner function, returns true if a winner is found

      function checkForWinner()
      {
        // initialize variables, retrieve array of squares
        var squares = document.querySelectorAll('.square');
        var winningCombos =  [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
        var i = 0;  // i will be used to iterate through the array of winningCombos

        // loop until either a winner is found or you reach the end of the winning combos array
        while ((foundWinner == false) && (i < winningCombos.length))
        {
          // take an extra step to store winning combo numbers
          // individually for easier reading
          var firstNum = winningCombos[i][0];  // first position (remember arrays start at 0)
          var secondNum = winningCombos[i][1]; // second position
          var thirdNum = winningCombos[i][2];  // third position

          // console.log ("Current winningCombo we're checking: " + winningCombos[i]);
          // console.log ("First symbol: " + squares[firstNum].innerHTML);
          // console.log ("Second symbol: " + squares[secondNum].innerHTML);
          // console.log ("Third symbol: " + squares[secondNum].innerHTML);

          // if all 3 places in the winning combo match the current turn, you found a winner
          if( (squares[firstNum].innerHTML == currentPlayer) && (squares[secondNum].innerHTML == currentPlayer) && (squares[thirdNum].innerHTML == currentPlayer))
          {
            foundWinner = true;  // this will cause the loop to end at the next while statement
          }

          i++;  // move to the next winning combo, loop will end if we reach end of winning combos and no winner found

        }  //  end while loop

        // check for Tie

        var tieFound = true;

        for (i=0; i<squares.length;i++)
        {
            if (squares[i].innerHTML == "")
              tieFound = false;
        }

        if ((foundWinner == false) && (tieFound == true))
          return GAME_TIE;

        if (foundWinner == true)
          return GAME_WINNER;
        else
          return GAME_CONTINUE;

      }  // End Check for Winner function -----------------------------------------
