/* ===============================
   FIREBASE INIT v8
================================ */
var firebaseConfig = {
  apiKey: "AIzaSyCXpP9X2KSEWK-KGshCTEBvFSmA4pK-mS8",
  databaseURL: "https://e-protocol-spin-the-bottle-default-rtdb.firebaseio.com"
}
firebase.initializeApp(firebaseConfig)
var db = firebase.database()

/* ===============================
   DEVICE ID (one device one player)
================================ */
let myId = localStorage.getItem("playerId")
if (!myId) {
  myId = "p_" + Math.random().toString(36).slice(2, 10)
  localStorage.setItem("playerId", myId)
}

/* ===============================
   GAME DATA
================================ */
const truths = [
  "Sach batao sabse risky decision kya liya",
  "Kis cheez se darte ho",
  "Kabhi instant regret hua",
  "Truth ya Dare kya pasand",
  "Aaj ka sabse bada secret"
]

const dares = [
  "10 second freeze",
  "Naam ulta likho",
  "Serious face 5 second",
  "Next round ka hype banao",
  "Camera ke saamne clap karo"
]

let roomId = ""
let myName = ""
let players = []
let playerIds = []

let currentTurn = 0
let selectedPlayerIndex = null
let spinLocked = false
let visualRotation = 0

/* ===============================
   UI MODE
================================ */
window.showNormal = () => {
  home.classList.add("hidden")
  normal.classList.remove("hidden")
}

window.showMulti = () => {
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

  db.ref("rooms/" + roomId).set({
    hostId: myId,
    started: false,
    turn: 0,
    spinIndex: null,
    lastAction: null,
    players: {}
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

/* ===============================
   LOBBY
================================ */
function openLobby() {
  multi.classList.add("hidden")
  lobby.classList.remove("hidden")
  roomCode.innerText = roomId

  db.ref("rooms/" + roomId + "/players").on("value", snap => {
    const data = snap.val() || {}
    playerIds = Object.keys(data)
    players = playerIds.map(id => data[id].name)
    playersList.innerText = players.join(", ")
    if (!game.classList.contains("hidden")) renderPlayers()
  })

  db.ref("rooms/" + roomId).on("value", snap => {
    const data = snap.val()
    if (!data) return
    if (data.started) {
      lobby.classList.add("hidden")
      startGame()
      attachGameListeners()
      updateTurn(data.turn)
    }
  })

  db.ref("rooms/" + roomId + "/lastAction").on("value", snap => {
    const a = snap.val()
    if (!a) return
    result.innerText = a.by + " chose " + a.type
    question.innerText = a.type + ": " + a.text
    tdBox.style.display = "none"
    spinLocked = false
  })
}

/* ===============================
   JOIN GAME
================================ */
window.joinGame = () => {
  myName = playerName.value.trim()
  if (!myName) return

  const ref = db.ref("rooms/" + roomId + "/players/" + myId)
  ref.once("value", snap => {
    if (snap.exists()) {
      alert("Already joined")
      return
    }
    ref.set({ name: myName })
  })
}

window.startMultiGame = () => {
  db.ref("rooms/" + roomId).once("value", snap => {
    const data = snap.val()
    if (!data) return
    if (data.hostId !== myId) {
      alert("Only host can start")
      return
    }
    if (players.length < 2) {
      alert("Minimum 2 players needed")
      return
    }
    db.ref("rooms/" + roomId).update({
      started: true,
      turn: 0,
      spinIndex: null,
      lastAction: null
    })
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
  area.innerHTML = ""

  const bottleDiv = document.createElement("div")
  bottleDiv.className = "bottle"
  bottleDiv.id = "bottle"
  area.appendChild(bottleDiv)

  const count = players.length
  const center = 180
  const radius = count === 2 ? 155 : count === 3 ? 140 : 125
  const step = 360 / count

  players.forEach((p, i) => {
    const a = (step * i - 90) * Math.PI / 180
    const x = center + radius * Math.cos(a)
    const y = center + radius * Math.sin(a)

    const d = document.createElement("div")
    d.className = "player"
    d.style.left = x + "px"
    d.style.top = y + "px"
    d.innerText = p
    area.appendChild(d)
  })

  bottle = bottleDiv
  bottle.onclick = spin
}

/* ===============================
   TURN UPDATE
================================ */
function updateTurn(t) {
  currentTurn = t
  selectedPlayerIndex = null
  spinLocked = false
  turnInfo.innerText = players[t] + " turn"
  bottle.style.pointerEvents =
    playerIds[t] === myId ? "auto" : "none"
}

/* ===============================
   SPIN
================================ */
function spin() {
  if (spinLocked) return

  db.ref("rooms/" + roomId).once("value", snap => {
    const data = snap.val()
    if (!data) return
    if (playerIds[data.turn] !== myId) return

    spinLocked = true
    const i = Math.floor(Math.random() * players.length)

    db.ref("rooms/" + roomId).update({
      spinIndex: i,
      turn: (data.turn + 1) % players.length
    })
  })
}

/* ===============================
   LISTENERS
================================ */
function attachGameListeners() {
  db.ref("rooms/" + roomId + "/spinIndex").on("value", snap => {
    const i = snap.val()
    if (i !== null) animateSpin(i)
  })

  db.ref("rooms/" + roomId + "/turn").on("value", snap => {
    updateTurn(snap.val())
  })
}

/* ===============================
   SMOOTH SPIN
================================ */
function animateSpin(i) {
  spinSound.currentTime = 0
  spinSound.play()

  selectedPlayerIndex = i
  const slice = 360 / players.length
  visualRotation += 6 * 360 + slice * i + 90

  bottle.style.transition =
    "transform 4.5s cubic-bezier(0.15,0.85,0.25,1)"
  bottle.style.transform =
    `translate(-50%,-50%) rotate(${visualRotation}deg)`

  result.innerText = "Selected " + players[i]

  if (players[i] === myName) {
    tdBox.style.display = "block"
  } else {
    tdBox.style.display = "none"
  }
}

/* ===============================
   TRUTH / DARE
================================ */
window.pickTruth = () => {
  if (players[selectedPlayerIndex] !== myName) return
  const q = truths[Math.floor(Math.random() * truths.length)]
  db.ref("rooms/" + roomId + "/lastAction").set({
    by: players[selectedPlayerIndex],
    type: "Truth",
    text: q
  })
}

window.pickDare = () => {
  if (players[selectedPlayerIndex] !== myName) return
  const q = dares[Math.floor(Math.random() * dares.length)]
  db.ref("rooms/" + roomId + "/lastAction").set({
    by: players[selectedPlayerIndex],
    type: "Dare",
    text: q
  })
  }
