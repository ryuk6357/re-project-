/* ===============================
   FIREBASE INIT (v8 compatible)
================================ */
alert("main.js loaded")
var firebaseConfig = {
  apiKey: "AIzaSyCXpP9X2KSEWK-KGshCTEBvFSmA4pK-mS8",
  databaseURL: "https://e-protocol-spin-the-bottle-default-rtdb.firebaseio.com"
}
firebase.initializeApp(firebaseConfig)
var db = firebase.database()

/* ===============================
   GAME DATA
================================ */
const truths = [
  "Sach batao sabse risky decision kya liya",
  "Kis cheez se darte ho",
  "Kabhi instant regret hua",
  "Truth ya Dare kya pasand"
]

const dares = [
  "10 second freeze",
  "Naam ulta likho",
  "Serious face 5 second",
  "Next round ka hype banao"
]

let mode = ""
let players = []
let myName = ""
let roomId = ""
let isHost = false
let rotation = 0

/* ===============================
   UI MODE SWITCH
================================ */
window.showNormal = () => {
  mode = "normal"
  home.classList.add("hidden")
  normal.classList.remove("hidden")
}

window.showMulti = () => {
  mode = "multi"
  home.classList.add("hidden")
  multi.classList.remove("hidden")
}

/* ===============================
   NORMAL MODE (unchanged)
================================ */
window.addNormal = () => {
  const n = nName.value.trim()
  if (!n) return
  players.push(n)
  nName.value = ""
  nList.innerText = players.join(", ")
}

window.startNormal = () => {
  if (players.length < 2) return
  startGame()
}

/* ===============================
   MULTIPLAYER
================================ */
window.createRoom = () => {
  roomId = Math.random().toString(36).slice(2, 8).toUpperCase()
  isHost = true

  db.ref("rooms/" + roomId).set({
    host: "",
    players: [],
    started: false,
    turn: 0,
    spinIndex: null
  })

  openLobby()
}

window.joinRoom = () => {
  const code = roomInput.value.toUpperCase()
  if (!code) return

  db.ref("rooms/" + code).once("value", snap => {
    if (!snap.exists()) {
      alert("Room not found")
      return
    }
    roomId = code
    openLobby()
  })
}

function openLobby() {
  multi.classList.add("hidden")
  lobby.classList.remove("hidden")
  roomCode.innerText = roomId

  db.ref("rooms/" + roomId).on("value", snap => {
    const data = snap.val()
    if (!data) return

    players = data.players || []
    playersList.innerText = players.join(", ")

    if (data.started) {
      lobby.classList.add("hidden")
      startGame()
      listenSpin()
      updateTurn(data.turn)
    }
  })
}

window.joinGame = () => {
  myName = playerName.value.trim()
  if (!myName) return

  db.ref("rooms/" + roomId).once("value", snap => {
    const data = snap.val()
    if (!data) return

    if (data.players.includes(myName)) {
      alert("Name already taken")
      return
    }

    const updatedPlayers = [...data.players, myName]

    db.ref("rooms/" + roomId).update({
      players: updatedPlayers,
      host: data.players.length === 0 ? myName : data.host
    })

    if (data.players.length === 0) isHost = true
  })
}

window.startMultiGame = () => {
  if (!isHost) {
    alert("Only host can start")
    return
  }

  if (players.length < 2) {
    alert("Need at least 2 players")
    return
  }

  db.ref("rooms/" + roomId).update({
    started: true,
    turn: 0,
    spinIndex: null
  })
}

/* ===============================
   GAME START
================================ */
function startGame() {
  normal.classList.add("hidden")
  game.classList.remove("hidden")
  renderPlayers()
}

/* ===============================
   RENDER PLAYERS
================================ */
function renderPlayers() {
  const area = document.querySelector(".game-area")
  area.innerHTML = '<div class="bottle" id="bottle"></div>'

  const r = 140
  const c = 180
  const step = 360 / players.length

  players.forEach((p, i) => {
    const a = (step * i - 90) * Math.PI / 180
    const x = c + r * Math.cos(a)
    const y = c + r * Math.sin(a)

    const d = document.createElement("div")
    d.className = "player"
    d.style.left = x + "px"
    d.style.top = y + "px"
    d.innerText = p
    area.appendChild(d)
  })

  bottle.onclick = spin
}

/* ===============================
   TURN + SPIN SYNC
================================ */
function updateTurn(t) {
  turnInfo.innerText = "Turn " + players[t]
  bottle.style.pointerEvents =
    players[t] === myName ? "auto" : "none"
}

function spin() {
  db.ref("rooms/" + roomId).once("value", snap => {
    const data = snap.val()
    if (!data) return

    if (players[data.turn] !== myName) return

    const i = Math.floor(Math.random() * players.length)

    db.ref("rooms/" + roomId).update({
      spinIndex: i,
      turn: (data.turn + 1) % players.length
    })
  })
}

function listenSpin() {
  db.ref("rooms/" + roomId + "/spinIndex").on("value", snap => {
    const i = snap.val()
    if (i === null) return
    animateSpin(i)
  })

  db.ref("rooms/" + roomId + "/turn").on("value", snap => {
    updateTurn(snap.val())
  })
}

/* ===============================
   SPIN ANIMATION
================================ */
function animateSpin(i) {
  spinSound.currentTime = 0
  spinSound.play()

  const angle = 360 / players.length * i + 90
  rotation += 360 * 4 + angle

  bottle.style.transform =
    `translate(-50%,-50%) rotate(${rotation}deg)`

  result.innerText = "Selected " + players[i]
  tdBox.classList.remove("hidden")
}

/* ===============================
   TRUTH / DARE
================================ */
window.pickTruth = () => {
  question.innerText =
    "Truth: " + truths[Math.floor(Math.random() * truths.length)]
  tdBox.classList.add("hidden")
}

window.pickDare = () => {
  question.innerText =
    "Dare: " + dares[Math.floor(Math.random() * dares.length)]
  tdBox.classList.add("hidden")
  }
