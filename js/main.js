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
let currentTurn = 0

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
   NORMAL MODE
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
    players: [],
    started: false,
    turn: 0,
    spinIndex: null,
    lastAction: null
  })

  openLobby()
}

window.joinRoom = () => {
  const code = roomInput.value.trim().toUpperCase()
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

  // players realtime
  db.ref("rooms/" + roomId + "/players")
    .on("value", snap => {
      players = snap.val() || []
      playersList.innerText = players.join(", ")
    })

  // room state
  db.ref("rooms/" + roomId)
    .on("value", snap => {
      const data = snap.val()
      if (!data) return

      if (data.started) {
        lobby.classList.add("hidden")
        startGame()
        listenSpin()
        updateTurn(data.turn)
      }
    })

  // truth dare sync
  db.ref("rooms/" + roomId + "/lastAction")
    .on("value", snap => {
      const a = snap.val()
      if (!a) return

      result.innerText = a.by + " chose " + a.type
      question.innerText = a.type + ": " + a.text
      tdBox.classList.add("hidden")
    })
}

window.joinGame = () => {
  myName = playerName.value.trim()
  if (!myName) return

  const ref = db.ref("rooms/" + roomId + "/players")

  ref.once("value", snap => {
    const list = snap.val() || []
    if (list.includes(myName)) {
      alert("Name already taken")
      return
    }
    list.push(myName)
    ref.set(list)
  })
}

window.startMultiGame = () => {
  if (!isHost) {
    alert("Only host can start")
    return
  }

  if (players.length < 2) {
    alert("2 players needed")
    return
  }

  db.ref("rooms/" + roomId).update({
    started: true,
    turn: 0,
    spinIndex: null,
    lastAction: null
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
   RENDER PLAYERS (CIRCLE LOGIC)
================================ */
function renderPlayers() {
  const area = document.querySelector(".game-area")
  area.innerHTML = '<div class="bottle" id="bottle"></div>'

  const r = 140
  const c = 180
  const step = 360 / players.length

  players.forEach((p, i) => {
    const angle = (step * i - 90) * Math.PI / 180
    const x = c + r * Math.cos(angle)
    const y = c + r * Math.sin(angle)

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
  currentTurn = t
  turnInfo.innerText = "🔴 " + players[t] + "'s Turn"

  bottle.style.pointerEvents =
    players[t] === myName ? "auto" : "none"

  tdBox.style.display =
    players[t] === myName ? "block" : "none"
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
  db.ref("rooms/" + roomId + "/spinIndex")
    .on("value", snap => {
      const i = snap.val()
      if (i === null) return
      animateSpin(i)
    })

  db.ref("rooms/" + roomId + "/turn")
    .on("value", snap => {
      updateTurn(snap.val())
    })
}

/* ===============================
   SMOOTH SPIN ANIMATION
================================ */
function animateSpin(i) {
  spinSound.currentTime = 0
  spinSound.play()

  const angle =
    (360 / players.length) * i + 90 + 360 * 4

  bottle.style.transform =
    `translate(-50%,-50%) rotate(${angle}deg)`

  result.innerText = "Selected " + players[i]
}

/* ===============================
   TRUTH / DARE (SYNCED)
================================ */
window.pickTruth = () => {
  if (players[currentTurn] !== myName) return

  const q = truths[Math.floor(Math.random() * truths.length)]

  db.ref("rooms/" + roomId + "/lastAction").set({
    by: myName,
    type: "Truth",
    text: q
  })
}

window.pickDare = () => {
  if (players[currentTurn] !== myName) return

  const q = dares[Math.floor(Math.random() * dares.length)]

  db.ref("rooms/" + roomId + "/lastAction").set({
    by: myName,
    type: "Dare",
    text: q
  })
}
