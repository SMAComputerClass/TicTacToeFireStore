// Put your JavaScript in this file.
'use strict';   // Enable "strict mode".  Note: This *must* be the first statement in the script.
                // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode


      var PLAYER_ONE_SYMBOL = "X";
      var PLAYER_TWO_SYMBOL = "O";

      // define constant vars to represent game status
      var GAME_CONTINUE = 0;
      var GAME_WINNER = 1;
      var GAME_TIE = 2;

      var mySymbol;
  //    var currentPlayer = PLAYER_ONE_SYMBOL;
      var numberOfMoves = 0; // if numberOfMoves reaches 9 and there is no winner, it's a tie!

      // retrieve the screen elements into global variables
      var board = document.getElementById("board");  // only 1 board, use ID
      var replayButton = document.getElementById("replayButton");
      var results = document.getElementById("resultsText");
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

  var initializeGame = false;

  // retrieve data from firestore and store in global vars, add listeners
  var gameStartedRef = db.collection("Status").doc("gameStarted");
  var gameStarted = "";

  gameStartedRef.get().then(function(doc) {
      if (doc.exists)
      {
          console.log("Document data:", doc.data());
          gameStarted = doc.data().val;

          if (gameStarted == false)
          {
              var zz;
              for (zz=0;zz<9;zz++)
              {
                db.collection("Squares").doc(String(zz)).set({val:""});
              }

              db.collection("Status").doc("gameStarted").set({val:true});
              mySymbol = PLAYER_ONE_SYMBOL;
          } // end if gameStarted == false
          else
          {
              mySymbol = PLAYER_TWO_SYMBOL;
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
      // document.getElementById("playerName").innerHTML = myData.first;
    });


  // get refs to the 9 squares
  var dbSquareRef = new Array; // global array storing values in DB
  var docRef = db.collection("Players").doc("FquLRhCjkzwRZnP0sj8h");

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
      //document.getElementById("playerName").innerHTML = myData.first;
      // myData.val should equal X or O.
      // alert ("On change, incoming value is : " + myData.id + " data is " + myData.val);
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

// --- Click event on the replay button -------------------
      replayButton.addEventListener('click', function(e)
      {

        // reset turn to player 1
        currentPlayer = PLAYER_ONE_SYMBOL;
        db.collection("Status").doc("currentPlayer").set({val:PLAYER_ONE_SYMBOL});

        numberOfMoves = 0; // if numberOfMoves reaches 9 and there is no winner, it's a tie!
        foundWinner = false;  // reset var

        // blank out all squares
        var squares = document.querySelectorAll('.square');

        var i;

        // for (i=0; i<squares.length; i++)
        // {
        //   squares[i].innerHTML = ""; // set the square text to empty string
        // }

          var zz;
          for (zz=0;zz<9;zz++)
          {
            db.collection("Squares").doc(String(zz)).set({val:""});
          }

        // reset results area
        results.innerHTML = "";
        replayButton.style.visibility = "hidden";

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

        if ((foundWinner == false) && (numberOfMoves == 9))
          return GAME_TIE;

        if (foundWinner == true)
          return GAME_WINNER;
        else
          return GAME_CONTINUE;

      }  // End Check for Winner function -----------------------------------------


      function getRealtimeUpdates()
      {
        var docRef = db.collection("Players").doc("FquLRhCjkzwRZnP0sj8h");

        docRef.onSnapshot(function(doc)
        {
          const myData = doc.data();
          document.getElementById("playerName").innerHTML = myData.first;
        });
      }

function initializeTheGame()
{
    if (gameStarted == false)
    {
      db.collection("Status").doc("gameStarted").set({val:true});
      mySymbol = PLAYER_ONE_SYMBOL;
      initializeGame = true;
    }
    else
    {
      mySymbol = PLAYER_TWO_SYMBOL;
      initializeGame = true;
    }
}
