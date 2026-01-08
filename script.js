const RESET_PIN = "1234";

const SONGS_DB = [
  { title: "Bohemian Rhapsody", hints: ["Queen", "Opera rock"] },
  { title: "Imagine", hints: ["John Lennon", "Peace"] },
  { title: "Smells Like Teen Spirit", hints: ["Nirvana", "Grunge"] }
];

let mode = "solo";
let players = [];
let scores = {};
let round = 0;
let maxRounds = 10;
let currentSong = null;
let hintIndex = 0;

const screens = {
  start: document.getElementById("screenStart"),
  game: document.getElementById("screenGame"),
  lb: document.getElementById("screenLeaderboard")
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.hidden = true);
  screens[name].hidden = false;
}

function normalize(s) {
  return s.toLowerCase().replace(/[^\w]/g, "");
}

document.getElementById("modeSelect").onchange = e => {
  mode = e.target.value;
  soloBox.hidden = mode !== "solo";
  teamsBox.hidden = mode !== "teams";
};

document.getElementById("addTeamBtn").onclick = () => {
  const name = teamNameInput.value.trim();
  if (!name || players.includes(name)) return;
  players.push(name);
  scores[name] = 0;
  teamNameInput.value = "";
  renderTeams();
};

function renderTeams() {
  teamsList.innerHTML = "";
  players.forEach(t => {
    const li = document.createElement("li");
    li.textContent = t;
    teamsList.appendChild(li);
  });
}

document.getElementById("startBtn").onclick = () => {
  players = [];
  scores = {};
  round = 0;

  maxRounds = +roundsSelect.value;

  if (mode === "solo") {
    const name = playerNameInput.value.trim();
    if (!name) return alert("Inserisci nome");
    players = [name];
    scores[name] = 0;
  } else {
    if (players.length < 2) return alert("Aggiungi almeno 2 squadre");
  }

  showScreen("game");
  nextRound();
};

function nextRound() {
  if (round >= maxRounds) {
    saveLeaderboard();
    renderLeaderboard();
    showScreen("lb");
    return;
  }

  round++;
  hintIndex = 0;
  currentSong = SONGS_DB[Math.floor(Math.random() * SONGS_DB.length)];

  roundMeta.textContent = `Round ${round}/${maxRounds}`;
  hudPlayer.textContent = players[(round - 1) % players.length];
  hudScore.textContent = scores[hudPlayer.textContent];
  cluesList.innerHTML = "";
  answerInput.value = "";
}

confirmBtn.onclick = () => {
  const player = hudPlayer.textContent;
  if (normalize(answerInput.value).includes(normalize(currentSong.title))) {
    scores[player] += 100;
    alert("Corretto!");
  } else {
    alert("Sbagliato! Era: " + currentSong.title);
  }
  nextRound();
};

hintBtn.onclick = () => {
  if (hintIndex < currentSong.hints.length) {
    const li = document.createElement("li");
    li.textContent = currentSong.hints[hintIndex++];
    cluesList.appendChild(li);
  }
};

skipBtn.onclick = nextRound;

/* 🔐 RESET PROTETTO */
document.getElementById("resetGameBtn").onclick = () => {
  const pin = prompt("Inserisci PIN:");
  if (pin !== RESET_PIN) return alert("PIN errato");
  showScreen("start");
};

/* CLASSIFICA */
function saveLeaderboard() {
  const lb = JSON.parse(localStorage.getItem("bdc_lb") || "[]");
  Object.keys(scores).forEach(name => {
    const e = lb.find(p => p.name === name);
    if (e) e.score += scores[name];
    else lb.push({ name, score: scores[name] });
  });
  localStorage.setItem("bdc_lb", JSON.stringify(lb));
}

function renderLeaderboard() {
  const lb = JSON.parse(localStorage.getItem("bdc_lb") || "[]");
  lbBody.innerHTML = "";
  lb.sort((a,b)=>b.score-a.score).forEach((p,i)=>{
    lbBody.innerHTML += `<tr><td>${i+1}</td><td>${p.name}</td><td>${p.score}</td></tr>`;
  });
}

document.getElementById("toLeaderboard").onclick = () => {
  renderLeaderboard();
  showScreen("lb");
};

document.getElementById("backToStart").onclick = () => showScreen("start");
