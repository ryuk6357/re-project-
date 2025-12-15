import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"
import { getDatabase, ref, set, update, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js"

/* Firebase */
const firebaseConfig={
  apiKey:"AIzaSyCXpP9X2KSEWK-KGshCTEBvFSmA4pK-mS8",
  databaseURL:"https://e-protocol-spin-the-bottle-default-rtdb.firebaseio.com"
}

const app=initializeApp(firebaseConfig)
const db=getDatabase(app)

/* Common */
const truths=[
  "Sach batao sabse risky decision kya liya",
  "Kis cheez se darte ho",
  "Kabhi instant regret hua",
  "Truth ya Dare kya pasand"
]

const dares=[
  "10 second freeze",
  "Naam ulta likho",
  "Serious face 5 second",
  "Next round ka hype banao"
]

let players=[]
let turn=0
let rotation=0
let myName=""
let roomId=""
let mode=""

/* UI helpers */
window.showNormal=()=>{
  mode="normal"
  home.classList.add("hidden")
  normal.classList.remove("hidden")
}

window.showMulti=()=>{
  mode="multi"
  home.classList.add("hidden")
  multi.classList.remove("hidden")
}

/* Normal Mode */
window.addNormal=()=>{
  const n=nName.value.trim()
  if(!n)return
  players.push(n)
  nName.value=""
  nList.innerText=players.join(", ")
}

window.startNormal=()=>{
  if(players.length<2)return
  startGame()
}

/* Multiplayer */
window.createRoom=()=>{
  roomId=Math.random().toString(36).slice(2,8).toUpperCase()
  set(ref(db,"rooms/"+roomId),{
    players:[],
    turn:0
  })
  openLobby()
}

window.joinRoom=()=>{
  roomId=roomInput.value.toUpperCase()
  openLobby()
}

function openLobby(){
  multi.classList.add("hidden")
  lobby.classList.remove("hidden")
  roomCode.innerText=roomId

  onValue(ref(db,"rooms/"+roomId),(s)=>{
    const d=s.val()
    if(!d)return
    players=d.players||[]
    turn=d.turn||0
    playersList.innerText=players.join(", ")
    if(players.length>=2 && myName) startGame()
  })
}

window.joinGame=()=>{
  myName=playerName.value.trim()
  if(!myName)return
  if(players.includes(myName))return
  players.push(myName)
  update(ref(db,"rooms/"+roomId),{players})
}

/* Game */
function startGame(){
  lobby.classList.add("hidden")
  normal.classList.add("hidden")
  game.classList.remove("hidden")
  updateTurn()
}

function updateTurn(){
  turnInfo.innerText="Turn "+players[turn]
  bottle.onclick=()=>{
    if(mode==="multi" && players[turn]!==myName)return
    spin()
  }
}

function spin(){
  const i=Math.floor(Math.random()*players.length)
  if(mode==="multi"){
    update(ref(db,"rooms/"+roomId),{turn:(turn+1)%players.length})
  }
  animateSpin(i)
}

function animateSpin(i){
  spinSound.currentTime=0
  spinSound.play()
  const angle=360/players.length*i+90
  rotation+=360*4+angle
  bottle.style.transform=`translate(-50%,-50%) rotate(${rotation}deg)`
  result.innerText="Selected "+players[i]
  tdBox.classList.remove("hidden")
}

window.pickTruth=()=>{
  question.innerText="Truth: "+truths[Math.floor(Math.random()*truths.length)]
  tdBox.classList.add("hidden")
  turn=(turn+1)%players.length
  updateTurn()
}

window.pickDare=()=>{
  question.innerText="Dare: "+dares[Math.floor(Math.random()*dares.length)]
  tdBox.classList.add("hidden")
  turn=(turn+1)%players.length
  updateTurn()
    }
