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
  score: 0,
  song: null,
  hintIndex: 0,
  time: 0,
  timer: null,
  player: ""
};

let leaderboard = JSON.parse(localStorage.getItem("bdc_lb") || "[]");

/* ---------- UTIL ---------- */

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

/* ---------- GAME ---------- */

function startGame(){
  const name = playerNameInput.value.trim();
  if(!name){
    alert("Inserisci il nome del giocatore");
    return;
  }

  state.player = name;
  settings.rounds = +roundsSelect.value;
  settings.timer = timerToggle.checked;
  settings.seconds = +timerSeconds.value;

  state.round = 0;
  state.score = 0;

  hudPlayer.textContent = state.player;
  showScreen("screenGame");
  nextRound();
}

function nextRound(){
  if(state.round >= settings.rounds){
    saveScore();
    renderLeaderboard();
    showScreen("screenLeaderboard");
    return;
  }

  state.round++;
  state.hintIndex = 0;
  state.song = SONGS_DB[Math.floor(Math.random()*SONGS_DB.length)];

  roundMeta.textContent = `Round ${state.round}/${settings.rounds}`;
  hudScore.textContent = state.score;
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
      setTimeout(nextRound,1500);
    }
  },1000);
}

/* ---------- ACTIONS ---------- */

confirmBtn.onclick = ()=>{
  clearInterval(state.timer);
  const ok = normalize(answerInput.value)
    .includes(normalize(state.song.title));

  if(ok){
    state.score += 100 + state.time;
    feedback.textContent = "✅ Corretto!";
  }else{
    feedback.textContent = `❌ Era: ${state.song.title}`;
  }
  setTimeout(nextRound,1500);
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
  setTimeout(nextRound,1000);
};

/* ---------- LEADERBOARD ---------- */

function saveScore(){
  const existing = leaderboard.find(p => p.name === state.player);
  if(existing){
    existing.score += state.score;
  }else{
    leaderboard.push({ name: state.player, score: state.score });
  }
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
