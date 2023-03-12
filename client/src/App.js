import socketIO from "socket.io-client";
import React, { useState, useEffect } from "react";

const socket = socketIO.connect("http://localhost:3000");
let resulArr = [];

function App() {
  const [waitingPlayer, setWaitingPlayer] = useState(true);
  const [waitingTurn, setWaitingTurn] = useState(false);
  const [result, setResult] = useState();
  const [playerId, setPlayerId] = useState("");
  const [isPlayerOne, setIsPlayerOne] = useState(false);
  const [myChoice, setMyChoice] = useState("");
  const [componentChoice, setComponentChoice] = useState("");
  
  const winningRules = {
    rock: { scissors: "breaks", lizard: "crushes" },
    paper: { rock: "covers", spock: "disproves" },
    scissors: { paper: "cuts", lizard: "decapitates" },
    lizard: { paper: "eats", spock: "poisons" },
    spock: { scissors: "smashes", rock: "vaporizes" }
  };

  useEffect(() => {
    socket.on("connect", () => {
      setPlayerId(socket.id);
    });
  }, [playerId]);

  useEffect(() => {
    socket.on("new-user", (userData) => {
      if (userData.connectionCount === 1) {
        setIsPlayerOne(true);
      }
      if (userData.connectionCount === 2) {
        setWaitingPlayer(false);
      }
    });
  }, []);

  useEffect(() => {
    socket.on("rcv-msg", (msg) => {
      if (msg === 'gamereset') { // it it's a game reset
        resetGame(); 
      }
      else if (msg.res) {
        console.log("result", msg); // if it's the result
        if (msg.res === "tie") {
          // if It's a tie
          setWaitingTurn(false);
          setResult("tie");
        }
        else if (msg.res.playerId === playerId) {
          // if I win
          setWaitingTurn(false);
          setResult("win");
        } else {
          setWaitingTurn(false);
          setResult("loose");
        }
      } else if (msg.playerId){// if it's the weapon choice
        if (msg.playerId === playerId) {  
          setMyChoice(msg.weapon);
        } else if (msg.playerId !== playerId) {
          setComponentChoice(msg.weapon);
        }
        resulArr.push(msg);

        if (resulArr.length === 2) {
          compare(resulArr);
        }
      }
    });
    return () => {
      socket.off("rcv-msg");
    };
  });

  function compare(players) {
    if (players[0].weapon === players[1].weapon) {
      sendWinner("tie");
    }
    else {
      for (const [key, value] of Object.entries(winningRules)) {
        if (players[0].weapon === key) {
          let count = 0;
          for (const [key2] of Object.entries(value)) {

            if (players[1].weapon === key2) {
              sendWinner(players[0]);
              break;
            }
            else {
              if (count === Object.keys(value).length - 1) {
                sendWinner(players[1]);
              }

            }
            count++;
          }
          break;
        }

      }
    }

  }

function sendWinner(res) {
  if (isPlayerOne) {
    // only player one sends the result
    console.log(isPlayerOne, "emit", res);
    socket.emit("send-msg", { res: res });
  }
}

function selectWeapon(e) {
  setWaitingTurn(true);
  const weapon = e.currentTarget.id;
  socket.emit("send-msg", { playerId, weapon });
}

function sendResetGameMsg(){
  socket.emit("send-msg", "gamereset");
 }

function resetGame(){
 resulArr = [];
  setWaitingTurn(false);
  setMyChoice("");
  setComponentChoice("")
  setResult();
}

function WaitingPlayerScreen() {
  if (waitingTurn) {
    return <p style={{textAlign: "center"}}>Waiting for the other player choice</p>;
  }
}

function ChoiceScreen() {
  return (
    <div style={{textAlign: "center"}}>
      <h2>Choose your moove </h2>
      <div placeholder="Liste">
        <div id="rock" role="img" onClick={selectWeapon}  aria-label="🪨">
          🪨  Rock
        </div>
        <div onClick={selectWeapon} id="paper" role="img" aria-label="📃">
          📃  Paper
        </div>
        <div onClick={selectWeapon} id="scissors" role="img" aria-label="✂️">
          ✂️  Scissors
        </div>
       
        <div onClick={selectWeapon} id="lizard" role="img" aria-label="🦎">
          🦎  Lizard
        </div>
       
        <div onClick={selectWeapon} id="spock" role="img" aria-label="🖖">
          🖖  Spock
        </div>
      </div>
    </div>
  );
}
function ResultScreen() {
  if (result) {
    return (
      <div style={{textAlign: "center"}}>
        <div>You {result} </div>
        <div>Your choice {myChoice}</div>
        <div> Your component choice {componentChoice}</div>
        <button onClick={sendResetGameMsg}> Retry </button>
      </div>
    );
  }
}

// render
if (waitingPlayer) {
  return <h1>Waiting for the other player</h1>;
} else {
  return (
    <div>
      <h1 style={{textAlign: "center"}}>Rock Paper Scissors</h1>
      <ChoiceScreen />
      <ResultScreen />
      <WaitingPlayerScreen />
    </div>
  );
}
}

export default App;
