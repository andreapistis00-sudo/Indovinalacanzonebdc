const SONGS_DB = [
  {
    title: "Bohemian Rhapsody",
    artist: "Queen",
    hints: [
      "Rock leggendario",
      "Parte operistica",
      "Freddie Mercury"
    ]
  },
  {
    title: "Imagine",
    artist: "John Lennon",
    hints: [
      "Canzone pacifista",
      "Ex Beatles",
      "Mondo senza confini"
    ]
  }
];

let settings = {};
let state = {
  round: 0,
  score: 0,
  song: null,
  hintIndex: 0,
  time: 0,
  timer: null
};

function normalize(s){
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^\w\s]/g,"")
    .trim();
}

function startGame(){
  settings.rounds = +roundsSelect.value;
  settings.timer = timerToggle.checked;
  settings.seconds = +timerSeconds.value;

  screenStart.hidden = true;
  screenGame.hidden = false;

  nextRound();
}

function nextRound(){
  if(state.round >= settings.rounds){
    alert("Fine partita! Punti: " + state.score);
    location.reload();
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

startBtn.onclick = startGame;

answerInput.addEventListener("keydown",e=>{
  if(e.key==="Enter") confirmBtn.click();
});
