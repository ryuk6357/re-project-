// MOBILE ONLY
if (window.innerWidth > 600) {
  document.body.innerHTML = "<h2 style='color:white'>Open on mobile</h2>"
  throw new Error()
}

// FIREBASE
firebase.initializeApp({
  apiKey:"AIzaSyCXpP9X2KSEWK-KGshCTEBvFSmA4pK-mS8",
  databaseURL:"https://e-protocol-spin-the-bottle-default-rtdb.firebaseio.com"
})
const db = firebase.database()

// DEVICE ID
let myId = localStorage.getItem("pid")
if (!myId) {
  myId = "p_" + Math.random().toString(36).slice(2)
  localStorage.setItem("pid", myId)
}

// DATA
const truths = ["Truth 1","Truth 2","Truth 3"]
const dares = ["Dare 1","Dare 2","Dare 3"]

let players=[]
let myName=""
let roomId=""
let isHost=false
let selectedIndex=null
let rotation=0

// UI
function showNormal(){
  home.classList.add("hidden")
  normal.classList.remove("hidden")
}

function showMulti(){
  home.classList.add("hidden")
  multi.classList.remove("hidden")
}

// NORMAL
function addNormal(){
  if(!nName.value)return
  players.push(nName.value)
  nName.value=""
  nList.innerText=players.join(", ")
}

function startNormal(){
  if(players.length<2)return
  startGame()
}

// MULTI
function createRoom(){
  roomId=Math.random().toString(36).slice(2,8).toUpperCase()
  isHost=true
  db.ref("rooms/"+roomId).set({
    host:myId,
    players:{},
    turn:0,
    spin:null,
    action:null
  })
  openLobby()
}

function joinRoom(){
  roomId=roomInput.value.toUpperCase()
  openLobby()
}

function openLobby(){
  multi.classList.add("hidden")
  lobby.classList.remove("hidden")
  roomCode.innerText=roomId

  db.ref("rooms/"+roomId).on("value",snap=>{
    const d=snap.val()
    if(!d)return
    players=Object.values(d.players||{})
    playersList.innerText=players.join(", ")

    if(d.spin!==null) animateSpin(d.spin)
    if(d.action){
      question.innerText=d.action
      tdBox.classList.add("hidden")
    }
    turnInfo.innerText="Turn "+players[d.turn]
  })
}

function joinGame(){
  myName=playerName.value
  if(!myName)return
  db.ref("rooms/"+roomId+"/players/"+myId).set(myName)
}

function startMultiGame(){
  db.ref("rooms/"+roomId).once("value",snap=>{
    if(snap.val().host!==myId)return
    db.ref("rooms/"+roomId).update({turn:0,spin:null,action:null})
    startGame()
  })
}

// GAME
function startGame(){
  lobby.classList.add("hidden")
  normal.classList.add("hidden")
  game.classList.remove("hidden")
  renderPlayers()
  bottle.onclick=spin
}

function renderPlayers(){
  area.querySelectorAll(".player").forEach(e=>e.remove())
  const c=160,r=130,step=360/players.length
  players.forEach((p,i)=>{
    const a=(step*i-90)*Math.PI/180
    const d=document.createElement("div")
    d.className="player"
    d.style.left=c+r*Math.cos(a)+"px"
    d.style.top=c+r*Math.sin(a)+"px"
    d.innerText=p
    area.appendChild(d)
  })
}

// SPIN
function spin(){
  if(!roomId){
    const i=Math.floor(Math.random()*players.length)
    animateSpin(i)
    return
  }
  db.ref("rooms/"+roomId).once("value",snap=>{
    const d=snap.val()
    if(players[d.turn]!==myName)return
    const i=Math.floor(Math.random()*players.length)
    db.ref("rooms/"+roomId).update({
      spin:i,
      turn:(d.turn+1)%players.length
    })
  })
}

function animateSpin(i){
  selectedIndex=i
  rotation+=360*5+(360/players.length)*i
  bottle.style.transform=`translate(-50%,-50%) rotate(${rotation}deg)`
  result.innerText="Selected "+players[i]

  if(players[i]===myName){
    tdBox.classList.remove("hidden")
  }else{
    tdBox.classList.add("hidden")
  }
}

// TD
function pickTruth(){
  sendAction("Truth: "+truths[Math.floor(Math.random()*truths.length)])
}

function pickDare(){
  sendAction("Dare: "+dares[Math.floor(Math.random()*dares.length)])
}

function sendAction(text){
  if(players[selectedIndex]!==myName)return
  tdBox.classList.add("hidden")
  if(roomId){
    db.ref("rooms/"+roomId).update({action:text})
  }else{
    question.innerText=text
  }
        }
