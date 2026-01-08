/* ==========================================================
   INDOVINA LA CANZONE AL BDC
   script.js
   Vanilla JS - No backend - GitHub Pages ready
   ========================================================== */

/* =========================
   DATABASE CANZONI
   =========================
   Aggiungi facilmente nuove entry seguendo lo stesso formato
*/
const SONGS_DB = [
  {
    title: "Bohemian Rhapsody",
    artist: "Queen",
    year: 1975,
    difficulty: "facile",
    hints: [
      "È una delle canzoni rock più famose di sempre",
      "Contiene una sezione operistica",
      "Il cantante è Freddie Mercury"
    ]
  },
  {
    title: "Imagine",
    artist: "John Lennon",
    year: 1971,
    difficulty: "facile",
    hints: [
      "È una canzone pacifista",
      "L'autore faceva parte dei Beatles",
      "Parla di un mondo senza confini"
    ]
  },
  {
    title: "Smells Like Teen Spirit",
    artist: "Nirvana",
    year: 1991,
    difficulty: "media",
    hints: [
      "È un inno del grunge",
      "La band è di Seattle",
      "Il cantante è Kurt Cobain"
    ]
  },
  {
    title: "Vita spericolata",
    artist: "Vasco Rossi",
    year: 1983,
    difficulty: "facile",
    hints: [
      "Rock italiano",
      "Il cantante è Vasco",
      "Parla di una vita fuori dagli schemi"
    ]
  },
  {
    title: "Nel blu dipinto di blu",
    artist: "Domenico Modugno",
    year: 1958,
    difficulty: "facile",
    hints: [
      "È conosciuta anche come 'Volare'",
      "Ha vinto Sanremo",
      "È un classico italiano"
    ]
  }
  // 👉 aggiungine altre liberamente
];

/* =========================
   STATO GLOBALE
   ========================= */
let gameSettings = {
  mode: "single",        // single | teams
  rounds: 10,
  difficulty: "all",     // facile | media | difficile | all
  timerEnabled: true,
  roundTime: 30
};

let gameState = {
  currentRound: 0,
  score: 0,
  correctAnswers: 0,
  totalTime: 0,
  usedHints: 0,
  currentSong: null,
  timer: null,
  timeLeft: 0
};

let leaderboard = [];

/* =========================
   UTILITIES
   ========================= */

/**
 * Normalizza stringhe per confronto risposte
 * - minuscole
 * - rimuove accenti
 * - rimuove punteggiatura
 * - rimuove articoli comuni
 */
function normalizeString(str) {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\b(il|lo|la|i|gli|le|un|uno|una|the|a|an)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fuzzy match semplice:
 * accetta se una stringa contiene l'altra
 */
function fuzzyMatch(input, target) {
  const a = normalizeString(input);
  const b = normalizeString(target);
  return a.includes(b) || b.includes(a);
}

/* =========================
   LOCAL STORAGE
   ========================= */

function saveLeaderboard() {
  localStorage.setItem("bdc_leaderboard", JSON.stringify(leaderboard));
}

function loadLeaderboard() {
  const data = localStorage.getItem("bdc_leaderboard");
  leaderboard = data ? JSON.parse(data) : [];
}

/* =========================
   LEADERBOARD
   ========================= */

function addParticipant(name) {
  leaderboard.push({
    name,
    score: 0,
    correct: 0,
    time: 0
  });
  saveLeaderboard();
  renderLeaderboard();
}

function removeParticipant(index) {
  leaderboard.splice(index, 1);
  saveLeaderboard();
  renderLeaderboard();
}

function renderLeaderboard() {
  const list = document.getElementById("leaderboardList");
  if (!list) return;

  list.innerHTML = "";

  leaderboard
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.correct !== a.correct) return b.correct - a.correct;
      return a.time - b.time;
    })
    .forEach((p, i) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${i + 1}. ${p.name}</strong>
        <span>${p.score} pt</span>
      `;
      list.appendChild(li);
    });
}

/* =========================
   GAME LOGIC
   ========================= */

function startGame(settings) {
  gameSettings = settings;
  gameState.currentRound = 0;
  gameState.score = 0;
  gameState.correctAnswers = 0;
  gameState.totalTime = 0;

  nextRound();
}

function nextRound() {
  if (gameState.currentRound >= gameSettings.rounds) {
    endGame();
    return;
  }

  gameState.currentRound++;
  gameState.usedHints = 0;

  const availableSongs = SONGS_DB.filter(song => {
    if (gameSettings.difficulty === "all") return true;
    return song.difficulty === gameSettings.difficulty;
  });

  gameState.currentSong =
    availableSongs[Math.floor(Math.random() * availableSongs.length)];

  showRoundUI();
  if (gameSettings.timerEnabled) startTimer();
}

function showRoundUI() {
  document.getElementById("roundNumber").textContent =
    `Round ${gameState.currentRound} / ${gameSettings.rounds}`;

  document.getElementById("hintBox").textContent = "Premi 'Mostra indizio'";
  document.getElementById("answerInput").value = "";
  document.getElementById("feedback").textContent = "";
}

/* =========================
   TIMER
   ========================= */

function startTimer() {
  gameState.timeLeft = gameSettings.roundTime;
  const timerEl = document.getElementById("timer");

  timerEl.textContent = gameState.timeLeft;

  gameState.timer = setInterval(() => {
    gameState.timeLeft--;
    timerEl.textContent = gameState.timeLeft;

    if (gameState.timeLeft <= 0) {
      clearInterval(gameState.timer);
      failRound("⏰ Tempo scaduto!");
    }
  }, 1000);
}

function stopTimer() {
  if (gameState.timer) clearInterval(gameState.timer);
}

/* =========================
   AZIONI GIOCATORE
   ========================= */

function submitAnswer() {
  stopTimer();

  const input = document.getElementById("answerInput").value;
  const song = gameState.currentSong;

  const correct =
    fuzzyMatch(input, song.title) ||
    fuzzyMatch(input, `${song.title} ${song.artist}`);

  if (correct) {
    successRound();
  } else {
    failRound("❌ Risposta sbagliata");
  }
}

function successRound() {
  const basePoints = 100;
  const timeBonus = gameSettings.timerEnabled ? gameState.timeLeft * 2 : 0;
  const hintPenalty = gameState.usedHints * 20;

  const roundPoints = Math.max(
    0,
    basePoints + timeBonus - hintPenalty
  );

  gameState.score += roundPoints;
  gameState.correctAnswers++;

  document.getElementById("feedback").textContent =
    `✅ Corretto! +${roundPoints} punti`;

  setTimeout(nextRound, 1500);
}

function failRound(message) {
  document.getElementById("feedback").textContent =
    `${message} | Era: "${gameState.currentSong.title}"`;

  setTimeout(nextRound, 2000);
}

function showHint() {
  const hints = gameState.currentSong.hints;
  if (gameState.usedHints < hints.length) {
    document.getElementById("hintBox").textContent =
      hints[gameState.usedHints];
    gameState.usedHints++;
  }
}

function skipRound() {
  stopTimer();
  failRound("⏭️ Round saltato");
}

function surrender() {
  stopTimer();
  failRound("🏳️ Ti sei arreso");
}

/* =========================
   FINE PARTITA
   ========================= */

function endGame() {
  document.getElementById("gameScreen").classList.add("hidden");
  document.getElementById("endScreen").classList.remove("hidden");

  document.getElementById("finalScore").textContent =
    `Punteggio finale: ${gameState.score}`;

  // Salva automaticamente in classifica (single player)
  leaderboard.push({
    name: "Giocatore",
    score: gameState.score,
    correct: gameState.correctAnswers,
    time: gameState.totalTime
  });

  saveLeaderboard();
  renderLeaderboard();
}

/* =========================
   EXPORT / IMPORT JSON
   ========================= */

function exportLeaderboard() {
  const data = JSON.stringify(leaderboard, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "classifica_bdc.json";
  a.click();

  URL.revokeObjectURL(url);
}

function importLeaderboard(file) {
  const reader = new FileReader();
  reader.onload = e => {
    leaderboard = JSON.parse(e.target.result);
    saveLeaderboard();
    renderLeaderboard();
  };
  reader.readAsText(file);
}

/* =========================
   EVENTI GLOBALI
   ========================= */

document.addEventListener("DOMContentLoaded", () => {
  loadLeaderboard();
  renderLeaderboard();

  // Invio per confermare risposta
  const input = document.getElementById("answerInput");
  if (input) {
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") submitAnswer();
    });
  }
});
