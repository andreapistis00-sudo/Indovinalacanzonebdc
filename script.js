const RESET_PIN = "1234"; // 🔐 CAMBIA QUI IL PIN

const SONGS_DB = [
  {
    title: "Bohemian Rhapsody",
    artist: "Queen",
    hints: ["Rock leggendario", "Parte operistica", "Freddie Mercury"]
  },
  {
    title: "Imagine",
    artist: "John Lennon",
    hints: ["Canzone pacifista", "Ex Beatles", "Mondo senza confini"]
  },
  {
    title: "Smells Like Teen Spirit",
    artist: "Nirvana",
    hints: ["Grunge", "Anni 90", "Kurt Cobain"]
  }
];

let settings = {};
let state = {
  round: 0,
  song: null,
  hintIndex: 0,
  time: 0,
  timer: null,
  turnIndex: 0
};

let players = [];
let leaderboard = JSON.parse(localStorage.getItem("bdc_lb") || "[]");

/* ---------- UI ---------- */

function showScreen(id){
  ["screenStart","screenGame","screenLeaderboard"].forEach(s=>{
    document.getElementById(s).hidden = s !== id;
  });
}

function normalize(s){
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^\w\s]/g,"")
    .trim();
}

/* ---------- START ---------- */

modeSelect.onchange = () => {
  soloBox.hidden = modeSelect.value !== "solo";
  teamsBox.hidden = modeSelect.value !== "teams";
};

addTeamBtn.onclick = () => {
  const name = teamNameInput.value.trim();
  if(!name || players.includes(name)) return;
  players.push(name);
  teamNameInput.value = "";
  renderTeams();
};

function renderTeams(){
  teamsList.innerHTML = "";
  players.forEach((t,i)=>{
    const li = document.createElement("li");
    li.innerHTML = `${t} <button class="btn ghost">✖</button>`;
    li.querySelector("button").onclick = ()=>{
      players.splice(i,1);
      renderTeams();
    };
    teamsList.appendChild(li);
  });
}

/* ---------- GAME ---------- */

function startGame(){
  settings.mode = modeSelect.value;
  settings.rounds = +roundsSelect.value;
  settings.timer = timerToggle.checked;
  settings.seconds = +timerSeconds.value;

  if(settings.mode === "solo"){
    const name = playerNameInput.value.trim();
    if(!name) return alert("Inserisci il nome");
    players = [name];
  } else {
    if(players.length < 2) return alert("Inserisci almeno 2 squadre");
  }

  state.round = 0;
  state.turnIndex = 0;

  showScreen("screenGame");
  nextRound();
}

function nextRound(){
  if(state.round >= settings.rounds){
    saveScores();
    renderLeaderboard();
    showScreen("screenLeaderboard");
    return;
  }

  state.round++;
  state.hintIndex = 0;
  state.song = SONGS_DB[Math.floor(Math.random()*SONGS_DB.length)];

  roundMeta.textContent = `Round ${state.round}/${settings.rounds}`;
  hudPlayer.textContent = players[state.turnIndex];
  hudScore.textContent = getScore(players[state.turnIndex]);
  cluesList.innerHTML = "";
  feedback.textContent = "";
  answerInput.value = "";

  if(settings.timer) startTimer();
}

function startTimer(){
  clearInterval(state.timer);
  state.time = settings.seconds;
  hudTime.textContent = state.time;

  state.timer = setInterval(()=>{
    state.time--;
    hudTime.textContent = state.time;
    if(state.time <= 0){
      clearInterval(state.timer);
      feedback.textContent = `⏰ Era: ${state.song.title}`;
      nextTurn();
    }
  },1000);
}

/* ---------- ACTIONS ---------- */

confirmBtn.onclick = ()=>{
  clearInterval(state.timer);
  const ok = normalize(answerInput.value)
    .includes(normalize(state.song.title));

  if(ok){
    addScore(players[state.turnIndex], 100 + state.time);
    feedback.textContent = "✅ Corretto!";
  } else {
    feedback.textContent = `❌ Era: ${state.song.title}`;
  }
  nextTurn();
};

hintBtn.onclick = ()=>{
  if(state.hintIndex < state.song.hints.length){
    const li = document.createElement("li");
    li.textContent = state.song.hints[state.hintIndex++];
    cluesList.appendChild(li);
  }
};

skipBtn.onclick = ()=>{
  clearInterval(state.timer);
  feedback.textContent = `⏭️ Era: ${state.song.title}`;
  nextTurn();
};

function nextTurn(){
  state.turnIndex = (state.turnIndex + 1) % players.length;
  setTimeout(nextRound, 1200);
}

/* ---------- 🔐 RESET SICURO ---------- */

function secureReset(){
  const pin = prompt("Inserisci PIN per resettare la partita:");
  if(pin !== RESET_PIN){
    alert("PIN errato");
    return;
  }

  clearInterval(state.timer);
  players = [];
  state.round = 0;
  state.turnIndex = 0;

  alert("Partita resettata");
  showScreen("screenStart");
}

resetGameBtn.onclick = secureReset;

/* ---------- LEADERBOARD ---------- */

function getScore(name){
  const e = leaderboard.find(p => p.name === name);
  return e ? e.score : 0;
}

function addScore(name, pts){
  let e = leaderboard.find(p => p.name === name);
  if(!e){
    e = { name, score: 0 };
    leaderboard.push(e);
  }
  e.score += pts;
  localStorage.setItem("bdc_lb", JSON.stringify(leaderboard));
}

function saveScores(){
  localStorage.setItem("bdc_lb", JSON.stringify(leaderboard));
}

function renderLeaderboard(){
  lbBody.innerHTML = "";
  leaderboard
    .sort((a,b)=>b.score-a.score)
    .forEach((p,i)=>{
      lbBody.innerHTML += `
        <tr>
          <td>${i+1}</td>
          <td>${p.name}</td>
          <td>${p.score}</td>
        </tr>`;
    });
}

/* ---------- NAV ---------- */

startBtn.onclick = startGame;
toLeaderboard.onclick = ()=>{ renderLeaderboard(); showScreen("screenLeaderboard"); };
goLeaderboardBtn.onclick = ()=>{ renderLeaderboard(); showScreen("screenLeaderboard"); };
backToStart.onclick = ()=> showScreen("screenStart");

answerInput.addEventListener("keydown",e=>{
  if(e.key==="Enter") confirmBtn.click();
});
document.addEventListener("DOMContentLoaded", () => {

  const resetBtn = document.getElementById("resetGameBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", secureReset);
  }

});
