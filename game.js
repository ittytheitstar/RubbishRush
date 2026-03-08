'use strict';

/* ── CONFIG ──────────────────────────────────────────────────────── */
const CFG = {
  startTime:            60,
  trainingStartTime:    45,   // training mode starts with less time
  correctSortBonus:      4,   // seconds (reduced from 5)
  wrongSortPenalty:      7,
  missingActionPenalty:  5,   // per missing required action (normal mode); halved in training
  bonusActionReward:     2,
  wrongActionPenalty:    3,
  correctPoints:        10,
  wrongPoints:          -5,
  actionPoints:          3,
  comboMultiplier:       2,   // extra points per combo level (reduced from 3)
  urgency1:             25,   // orange warning threshold
  urgency2:             12,   // red danger threshold
  urgency3:              5,   // panic threshold
  // Timer acceleration: real-time for first 20s, then +5% every 5s – no cap
  speedupStartTime:     20,   // seconds of real elapsed time before acceleration begins
  speedupStepInterval:   5,   // seconds between each speed increase
  speedupStepAmount:  0.05,   // 5% per step (no maximum cap)
  comboMilestoneInterval: 5, // combo streak interval that triggers a bonus (every Nth streak)
  trainingMultiplier:    0.5, // training mode: halve points & penalties
  // Bin layout (must match CSS clamp values in .bin { width/height })
  binSizeMax:          148,   // px – max bin dimension (CSS clamp max)
  binSizeMin:          100,   // px – min bin dimension (CSS clamp min)
  binSizeVw:          0.23,   // fraction of viewport width for mid-range clamp
};

/* ── ITEMS DATABASE ──────────────────────────────────────────────── */
// bin: 'red' | 'yellow' | 'green' | 'blue'
// required: action ids that MUST be done first (penalty if skipped)
// bonus: action ids that give bonus time
const ITEMS = [
  /* ---- RED BIN — General Waste ---- */
  { id:'greasy_pizza',    name:'Greasy Pizza Box',       emoji:'🍕', bin:'red',    required:[], bonus:[],           hint:'Greasy cardboard cannot be recycled – red bin!' },
  { id:'nappy',           name:'Used Nappy',             emoji:'🧷', bin:'red',    required:[], bonus:[],           hint:'Nappies always go in the red general waste bin' },
  { id:'plastic_bag',     name:'Plastic Bag',            emoji:'🛍️', bin:'red',    required:[], bonus:[],           hint:'Soft plastics go in the red bin – not yellow!' },
  { id:'coffee_cup',      name:'Takeaway Coffee Cup',    emoji:'☕', bin:'red',    required:[], bonus:[],           hint:'Takeaway cups have a plastic lining – not recyclable, red bin!' },
  { id:'polystyrene',     name:'Polystyrene Container',  emoji:'🥡', bin:'red',    required:[], bonus:[],           hint:'Polystyrene foam is not accepted in NZ kerbside recycling' },
  { id:'broken_glass',    name:'Broken Glass',           emoji:'🪟', bin:'red',    required:[], bonus:[],           hint:'Broken glass is dangerous – wrap & red bin it! (Not the blue glass bin)' },
  { id:'dog_poo',         name:'Dog Poo Bag',            emoji:'💩', bin:'red',    required:[], bonus:[],           hint:'Bag it, bin it – general waste only' },
  { id:'battery',         name:'Dead Battery',           emoji:'🔋', bin:'orange', required:[], bonus:[],           hint:'Batteries are hazardous – take to a Resource Recovery centre!' },
  { id:'chip_packet',     name:'Chip Packet',            emoji:'🍟', bin:'red',    required:[], bonus:[],           hint:'Foil & plastic wrappers go in the red bin' },
  { id:'noodles_dirty',   name:'Dirty Noodle Container', emoji:'🍜', bin:'red',    required:[], bonus:[],           hint:'Dirty food containers cannot be recycled' },
  { id:'cling_wrap',      name:'Cling Wrap',             emoji:'🥗', bin:'red',    required:[], bonus:[],           hint:'Cling wrap is a soft plastic – red bin' },
  { id:'disposable_cup',  name:'Disposable Cutlery',     emoji:'🥄', bin:'red',    required:[], bonus:[],           hint:'Disposable cutlery is generally not recyclable' },
  { id:'bubble_wrap',     name:'Bubble Wrap',            emoji:'🫧', bin:'red',    required:[], bonus:[],           hint:'Bubble wrap is a soft plastic – cannot be recycled kerbside' },
  { id:'juice_bottle',    name:'Juice Carton',           emoji:'🧃', bin:'red',    required:[], bonus:[],           hint:'Juice cartons (tetra pak) cannot be recycled kerbside – red rubbish bin!' },
  { id:'aerosol_can',     name:'Aerosol Can',            emoji:'💨', bin:'red',    required:[], bonus:[],           hint:'Aerosol cans are NOT accepted in the yellow recycling bin – red bin!' },
  { id:'broken_crockery', name:'Broken Crockery',        emoji:'🍽️', bin:'red',    required:[], bonus:[],           hint:'Broken ceramics & crockery cannot be recycled – wrap safely & red bin' },
  { id:'drinking_glass',  name:'Broken Drinking Glass',  emoji:'🥃', bin:'red',    required:[], bonus:[],           hint:'Drinking glasses go in the red bin – NOT the blue glass recycling bin!' },

  /* ---- YELLOW BIN — Mixed Recycling (plastics, cans, paper & cardboard) ---- */
  { id:'water_bottle',    name:'Water Bottle',           emoji:'💧', bin:'yellow', required:['removeLid'], bonus:['rinse'],              hint:'Remove the lid first, then pop in the yellow bin!' },
  { id:'coke_bottle',     name:'Coke Bottle',            emoji:'🥤', bin:'yellow', required:['removeLid'], bonus:['rinse'],              hint:'Plastic PET bottles – lid off, rinse, yellow bin' },
  { id:'milk_bottle',     name:'Milk Bottle',            emoji:'🥛', bin:'yellow', required:['removeLid'], bonus:['rinse'],              hint:'HDPE milk bottles are recyclable – lid off, rinse, yellow bin' },
  { id:'beer_can',        name:'Beer Can',               emoji:'🍺', bin:'yellow', required:[],            bonus:['rinse','removeLabel'],        hint:'Aluminium cans – rinse before recycling in the yellow bin' },
  { id:'tin_can',         name:'Tin Can',                emoji:'🥫', bin:'yellow', required:[],            bonus:['rinse','removeLabel','clean'], hint:'Steel cans are recyclable – give them a rinse!' },
  { id:'shampoo_bottle',  name:'Shampoo Bottle',         emoji:'🧴', bin:'yellow', required:['removeLid'], bonus:['rinse'],              hint:'Plastic bottles (grade 2) – lid off, rinse, yellow recycling!' },
  { id:'lp_bottle',       name:'L&P Bottle',             emoji:'🍋', bin:'yellow', required:['removeLid'], bonus:['rinse'],              hint:'Kiwi classic – plastic bottle, lid off, yellow bin!' },
  { id:'milo_tin',        name:'Milo Tin',               emoji:'🫙', bin:'yellow', required:[],            bonus:['rinse','removeLabel','clean'], hint:'Steel tins are fully recyclable – Kiwi favourite!' },
  { id:'paint_tin_empty', name:'Empty Paint Tin',        emoji:'🪣', bin:'yellow', required:[],            bonus:['clean'],              hint:'Completely empty, dry metal tins can go in yellow bin' },
  { id:'newspaper',       name:'Newspaper',              emoji:'📰', bin:'yellow', required:[], bonus:[],           hint:'Paper & newspapers go in the yellow recycling bin' },
  { id:'cardboard_box',   name:'Large Cardboard Box',    emoji:'📦', bin:'yellow', required:['cut'], bonus:['flatten'],  hint:'Large cardboard must be cut down & flattened before recycling!' },
  { id:'printer_paper',   name:'Printer Paper',          emoji:'📄', bin:'yellow', required:[], bonus:[],           hint:'Clean paper is recyclable – yellow bin!' },
  { id:'magazine',        name:'Old Magazine',           emoji:'📚', bin:'yellow', required:[], bonus:[],           hint:'Magazines & glossy paper go in the yellow recycling bin' },
  { id:'cereal_box',      name:'Weetbix Box',            emoji:'🥣', bin:'yellow', required:[], bonus:['flatten'],  hint:'Flatten the cardboard box and put in the yellow recycling!' },
  { id:'toilet_roll',     name:'Toilet Roll Tube',       emoji:'🧻', bin:'yellow', required:[], bonus:[],           hint:'Cardboard tubes are recyclable – yellow bin!' },
  { id:'junk_mail',       name:'Junk Mail',              emoji:'📬', bin:'yellow', required:[], bonus:[],           hint:'Paper junk mail goes in the yellow recycling bin' },
  { id:'gift_wrap',       name:'Clean Gift Wrap',        emoji:'🎁', bin:'yellow', required:[], bonus:[],           hint:'Non-foil gift wrap is paper – yellow recycling bin!' },
  { id:'egg_carton',      name:'Egg Carton',             emoji:'🥚', bin:'yellow', required:[], bonus:['flatten'],  hint:'Clean & dry egg cartons are cardboard – flatten & yellow bin!' },
  { id:'book',            name:'Old Paperback Book',     emoji:'📖', bin:'yellow', required:[], bonus:[],           hint:'Books & paper go in the yellow recycling bin' },

  /* ---- GREEN BIN — Organics ---- */
  { id:'apple_core',      name:'Apple Core',             emoji:'🍎', bin:'green',  required:[], bonus:[],           hint:'All food scraps go in the green organics bin' },
  { id:'banana_peel',     name:'Banana Peel',            emoji:'🍌', bin:'green',  required:[], bonus:[],           hint:'Fruit peels are great for the green organics bin' },
  { id:'veg_peels',       name:'Vegetable Peels',        emoji:'🥕', bin:'green',  required:[], bonus:[],           hint:'Veggie scraps are composted from the green bin' },
  { id:'egg_shells',      name:'Egg Shells',             emoji:'🪺', bin:'green',  required:[], bonus:[],           hint:'Egg shells are 100% compostable – green bin!' },
  { id:'fish_bones',      name:'Fish Bones',             emoji:'🐟', bin:'green',  required:[], bonus:[],           hint:'Meat, fish & bones all go in the green bin' },
  { id:'tea_bag',         name:'Used Tea Bag',           emoji:'🍵', bin:'green',  required:[], bonus:[],           hint:'Tea bags & coffee grounds are compostable' },
  { id:'garden_clip',     name:'Garden Clippings',       emoji:'🌿', bin:'green',  required:[], bonus:['cut'],      hint:'Chop clippings smaller for easier composting' },
  { id:'bread',           name:'Stale Bread',            emoji:'🍞', bin:'green',  required:[], bonus:[],           hint:'Old food goes in the green organics bin' },
  { id:'coffee_grounds',  name:'Coffee Grounds',         emoji:'🫘', bin:'green',  required:[], bonus:[],           hint:'Coffee grounds are excellent in the compost!' },
  { id:'weet_bix',        name:'Half-eaten Weetbix',     emoji:'🌾', bin:'green',  required:[], bonus:[],           hint:'Soggy cereal – food waste to the green bin' },
  { id:'avocado',         name:'Avocado',                emoji:'🥑', bin:'green',  required:[], bonus:[],           hint:'Avocado skin and pit are organic – green bin!' },
  { id:'meat_scraps',     name:'Meat Scraps',            emoji:'🥩', bin:'green',  required:[], bonus:[],           hint:'Meat, bones & leftover food go in the green organics bin' },

  /* ---- BLUE BIN — Glass Bottles & Jars ---- */
  { id:'wine_bottle',      name:'Wine Bottle',           emoji:'🍷', bin:'blue',   required:[],            bonus:['rinse','removeLabel'], hint:'Glass wine bottles – rinse and recycle in the blue glass bin!' },
  { id:'pasta_jar',        name:'Pasta Sauce Jar',       emoji:'🫙', bin:'blue',   required:['removeLid'], bonus:['rinse','clean'],        hint:'Glass jars – remove lid, rinse out, blue glass bin!' },
  { id:'champagne_bottle', name:'Champagne Bottle',      emoji:'🍾', bin:'blue',   required:[],            bonus:['rinse','removeLabel'],  hint:'Glass champagne bottles go in the blue glass recycling bin!' },
  { id:'honey_jar',        name:'Honey Jar',             emoji:'🍯', bin:'blue',   required:['removeLid'], bonus:['rinse','clean'],        hint:'Glass honey jars – remove lid, rinse, blue glass bin!' },
  { id:'glass_beer_bottle',name:'Glass Beer Bottle',     emoji:'🍶', bin:'blue',   required:[],            bonus:['rinse','removeLabel'],  hint:'Glass bottles belong in the blue glass recycling bin – not cans!' },

  /* ---- ORANGE BIN — Resource Recovery (Hazardous) ---- */
  { id:'cfl_bulb',        name:'CFL Light Bulb',         emoji:'💡', bin:'orange', required:[], bonus:[],           hint:'Fluorescent & CFL bulbs contain mercury – Resource Recovery only!' },
  { id:'paint_leftover',  name:'Leftover Paint',         emoji:'🎨', bin:'orange', required:[], bonus:[],           hint:'Partially-used paint is hazardous – take to Resource Recovery!' },
  { id:'medication',      name:'Old Medication',         emoji:'💊', bin:'orange', required:[], bonus:[],           hint:'Old pills & medication go to a pharmacy or Resource Recovery centre' },
  { id:'motor_oil',       name:'Used Motor Oil',         emoji:'🛢️', bin:'orange', required:[], bonus:[],           hint:'Used oil is hazardous – Resource Recovery centre only!' },
  { id:'ewaste',          name:'Old Electronics',        emoji:'📱', bin:'orange', required:[], bonus:[],           hint:'E-waste contains hazardous materials – Resource Recovery!' },
  { id:'spray_chemical',  name:'Chemical Spray Bottle',  emoji:'🧪', bin:'orange', required:[], bonus:[],           hint:'Household chemicals are hazardous – Resource Recovery centre!' },
  { id:'smoke_detector',  name:'Old Smoke Detector',     emoji:'🔔', bin:'orange', required:[], bonus:[],           hint:'Smoke detectors contain radioactive material – Resource Recovery!' },
  { id:'car_battery',     name:'Car Battery',            emoji:'🚗', bin:'orange', required:[], bonus:[],           hint:'Car batteries are highly hazardous – Resource Recovery centre only!' },
];

/* ── BIN DEFINITIONS ─────────────────────────────────────────────── */
const BINS = {
  green:  { name:'Organics',          color:'#2ecc71' },
  yellow: { name:'Recycling',         color:'#f1c40f' },
  red:    { name:'General Waste',     color:'#e74c3c' },
  blue:   { name:'Glass',             color:'#3498db' },
  orange: { name:'Resource Recovery', color:'#e67e22' },
};

/* ── ACTION DEFINITIONS ──────────────────────────────────────────── */
const ACTIONS = {
  rinse:       { name:'Rinse',         emoji:'🚿' },
  removeLid:   { name:'Remove Lid',    emoji:'🔩' },
  removeLabel: { name:'Remove Label',  emoji:'🏷️' },
  flatten:     { name:'Flatten',       emoji:'📐' },
  cut:         { name:'Cut Up',        emoji:'✂️' },
  clean:       { name:'Clean',         emoji:'🧹' },
};

/* ── AUDIO ENGINE ────────────────────────────────────────────────── */
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTone(freq, duration, type='sine', gainVal=0.18, delay=0) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.01);
  } catch(e) { /* silent fail */ }
}
function sfxCorrect() {
  playTone(523, 0.12, 'triangle', 0.2);
  playTone(659, 0.12, 'triangle', 0.2, 0.12);
  playTone(784, 0.2,  'triangle', 0.2, 0.24);
}
function sfxWrong() {
  playTone(220, 0.15, 'sawtooth', 0.15);
  playTone(185, 0.15, 'sawtooth', 0.15, 0.15);
  playTone(147, 0.3,  'sawtooth', 0.15, 0.30);
}
function sfxAction() {
  playTone(880, 0.08, 'triangle', 0.12);
}
function sfxActionBad() {
  playTone(160, 0.18, 'sawtooth', 0.14);
}
function sfxCombo() {
  [523,659,784,1047].forEach((f,i) => playTone(f, 0.12, 'triangle', 0.22, i*0.1));
}
function sfxComboMilestone() {
  // Triumphant 5-note arpeggio, louder than regular combo
  [523,659,784,1047,1319].forEach((f,i) => playTone(f, 0.15, 'triangle', 0.28, i*0.08));
}
function sfxGameOver() {
  [440,370,311,261].forEach((f,i) => playTone(f, 0.25, 'sawtooth', 0.18, i*0.22));
}
let panicBeepInterval = null;
function startPanicBeep() {
  stopPanicBeep();
  panicBeepInterval = setInterval(() => playTone(880, 0.06, 'square', 0.1), 400);
}
function stopPanicBeep() {
  if (panicBeepInterval) { clearInterval(panicBeepInterval); panicBeepInterval = null; }
}

/* ── GAME STATE ──────────────────────────────────────────────────── */
let state = 'start'; // 'start' | 'playing' | 'gameover'
let trainingMode = false;
let score = 0;
let highScore = parseInt(localStorage.getItem('rrHighScore') || '0');
let timer = CFG.startTime;
let timerMax = CFG.startTime;
let rafId = null;
let lastTimestamp = null;
let currentItem = null;
let actionsApplied = new Set();
let itemsSelected = false; // tap-to-select on mobile
let combo = 0;
let comboBonus = 0;   // extra pts per correct sort; +1 for every 5× combo milestone
let totalSorted = 0;
let correctSorted = 0;
let gameElapsed = 0;     // real seconds elapsed since game started (for speed ramp)
let timerSpeed = 1.0;    // current timer countdown multiplier

/* ── DOM REFS ────────────────────────────────────────────────────── */
const $startScreen    = document.getElementById('startScreen');
const $gameScreen     = document.getElementById('gameScreen');
const $gameOverScreen = document.getElementById('gameOverScreen');
const $timerDisplay   = document.getElementById('timerDisplay');
const $timerFill      = document.getElementById('timerFill');
const $scoreDisplay   = document.getElementById('scoreDisplay');
const $highScoreDisplay = document.getElementById('highScoreDisplay');
const $hintBar        = document.getElementById('hintBar');
const $itemCard       = document.getElementById('itemCard');
const $itemEmoji      = document.getElementById('itemEmoji');
const $itemImgWrapper = document.getElementById('itemImgWrapper');
const $itemImage      = document.getElementById('itemImage');
const $dragGhostImgWrapper = document.getElementById('dragGhostImgWrapper');
const $dragGhostImage = document.getElementById('dragGhostImage');
const $itemName       = document.getElementById('itemName');
const $reqBadges      = document.getElementById('requiredBadges');
const $edgeGlow       = document.getElementById('edgeGlow');
const $dragGhost      = document.getElementById('dragGhost');
const $dragGhostEmoji = document.getElementById('dragGhostEmoji');
const $comboBanner    = document.getElementById('comboBanner');
const $comboBonusHud  = document.getElementById('comboBonusHud');
const $comboBonusVal  = document.getElementById('comboBonusVal');
const $startHs        = document.getElementById('startHs');
const $goScore        = document.getElementById('goScore');
const $goBest         = document.getElementById('goBest');
const $goItems        = document.getElementById('goItems');
const $goNewRecord    = document.getElementById('goNewRecord');
const $statsLine      = document.getElementById('statsLine');
const $actionsBar     = document.getElementById('actionsBar');
const $trainingToggle    = document.getElementById('trainingToggle');
const $goTrainingToggle  = document.getElementById('goTrainingToggle');
const $loadingDisplay    = document.getElementById('loadingDisplay');
const $startReady        = document.getElementById('startReady');
const $loadingHintText   = document.getElementById('loadingHintText');
const $loadingProgress   = document.getElementById('loadingProgress');
const $regionSelect      = document.getElementById('regionSelect');

/* ── SHUFFLE UTIL ────────────────────────────────────────────────── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
let itemQueue = [];
function nextItemFromQueue() {
  const pool = (enrichedItems ?? ITEMS);
  if (itemQueue.length === 0) itemQueue = shuffle(pool);
  return itemQueue.pop();
}

/* ── LOADING HINTS ───────────────────────────────────────────────── */
// 40 hints derived from the NZ kerbside collection brochure
const LOADING_HINTS = [
  '🟢 All food waste – including meat, fish, bones and bread – goes in the GREEN organics bin.',
  '🟡 Only plastics labelled 1, 2 or 5 are accepted in the YELLOW recycling bin. Check the number in the triangle!',
  '🔵 Glass bottles and jars go in the BLUE glass recycling bin – NOT the yellow recycling bin.',
  '🔴 Aerosol cans are NOT recyclable kerbside – put them in the RED rubbish bin.',
  '🔴 Soft plastics (bags, cling wrap, bubble wrap) cannot be recycled kerbside – RED bin.',
  '🟠 ALL batteries – including car batteries – must go to a Resource Recovery centre.',
  '🟡 Always rinse and clean containers before putting them in the yellow recycling bin.',
  '🟡 Recycling must be LOOSE – never bag it in the yellow bin.',
  '🟡 Remove lids and caps from bottles before recycling. Lids go in the RED rubbish bin.',
  '🔵 Remove lids from glass jars and bottles. Rinse them before placing in the blue glass bin.',
  '🔴 Drinking glasses, mirrors and windscreen glass are NOT accepted in the blue glass bin.',
  '🔴 Broken glass is dangerous – wrap it safely before putting it in the RED bin.',
  '🟡 Flatten cardboard boxes before recycling to save space in the bin.',
  '🟡 Clean, dry egg cartons are cardboard – flatten them and pop in the yellow recycling bin.',
  '🔴 Juice cartons and tetra paks cannot be recycled kerbside – they go in the RED bin.',
  '🟢 Garden waste and clippings belong in the GREEN organics bin – the composting system handles weeds and seeds!',
  "🟢 Don't stomp or compact waste in the green organics bin – place materials loosely so it empties fully.",
  '🔴 Ashes must cool for 7 days before going in the RED bin – or cool them in a metal bucket away from buildings.',
  '🔴 Extra rubbish left next to or on top of your bin will NOT be collected.',
  '🟠 Old paint is hazardous – never put it in any household bin. Take it to a Resource Recovery centre.',
  '🟠 E-waste (phones, electronics, appliances) contains hazardous materials – Resource Recovery only!',
  '🟠 CFL and fluorescent light bulbs contain mercury – take them to a Resource Recovery centre.',
  '🟠 Old medications go to a pharmacy or Resource Recovery centre – never in household bins.',
  '🟠 Used motor oil can be dropped off at any transfer station.',
  '🔵 Glass jars can be sterilised and reused for preserves! A great way to reduce waste.',
  '🟡 Steel and aluminium cans are fully recyclable – give them a rinse first!',
  '🟡 Paper and cardboard (newspapers, magazines, toilet rolls) all go in the yellow recycling bin.',
  '🟢 Coffee grounds and tea bags are great for composting – green organics bin!',
  '🔴 Biodegradable plastic bags do NOT go in the recycling bin – RED bin only.',
  '🔴 Polystyrene foam is not accepted in NZ kerbside recycling – RED bin.',
  '🔴 Disposable nappies and sanitary items always go in the RED rubbish bin.',
  '🔴 Takeaway coffee cups have a plastic lining – they cannot be recycled. RED bin.',
  '⚠️ Contaminated recycling goes to landfill. Rinse containers well before recycling!',
  '📅 The GREEN organics bin is collected WEEKLY. Yellow recycling and red rubbish alternate fortnightly.',
  '⚖️ Maximum bin weight is 80kg – bins heavier than this will be stickered and left behind!',
  '🕕 Put your bins out before 6am on collection day, close to the kerb.',
  '📏 Keep at least 0.5 metres between bins at the kerb so workers can stand between them.',
  '🔴 Bamboo, cabbage tree leaves, flax and palm leaves do NOT go in the green organics bin – RED bin.',
  '🟢 Meat scraps and fish bones are fine in the green organics bin – the industrial composting handles them.',
  '♻️ Putting rubbish in the yellow recycling bin will contaminate all the recyclables – they will all end up in landfill!',
];

/* ── LOADING HINT ROTATOR ────────────────────────────────────────── */
const HINT_FADE_MS = 400; // must match the CSS `transition: opacity 0.4s` on #loadingHintText
let _hintIdx = 0;
let _hintTimer = null;
let _activeHints = [];

function _showLoadingHint(idx) {
  $loadingHintText.classList.add('fade-out');
  setTimeout(() => {
    $loadingHintText.textContent = _activeHints[idx % _activeHints.length];
    $loadingHintText.classList.remove('fade-out');
  }, HINT_FADE_MS + 20);
}

function startLoadingHints() {
  // Shuffle fresh each call so repeated visits see a different order
  _activeHints = shuffle(LOADING_HINTS);
  _hintIdx = 0;
  _showLoadingHint(_hintIdx);
  _hintTimer = setInterval(() => {
    _hintIdx = (_hintIdx + 1) % _activeHints.length;
    _showLoadingHint(_hintIdx);
  }, 4000);
}

function stopLoadingHints() {
  if (_hintTimer) { clearInterval(_hintTimer); _hintTimer = null; }
}

/* ── IMAGE MANIFEST ──────────────────────────────────────────────── */
// Dynamically discovers and preloads available photo assets for each item.
// Tries assets/{id}.jpg, assets/{id}_1.jpg … assets/{id}_5.jpg.
// Fires onImagesReady() once all probes are settled so the game can start.
const IMAGE_MANIFEST = {};
let _imgTasksTotal = ITEMS.length;
let _imgTasksDone  = 0;

function _onAllImagesSettled() {
  stopLoadingHints();
  $loadingDisplay.classList.add('hidden');
  $startReady.classList.remove('hidden');
}

(function probeImages() {
  const MAX_VARIANTS = 5;
  ITEMS.forEach(item => {
    const paths = [`assets/${item.id}.jpg`];
    for (let i = 1; i <= MAX_VARIANTS; i++) paths.push(`assets/${item.id}_${i}.jpg`);
    const loadedImgs = [];   // store Image objects so decoded frames stay in memory
    const imgs = [];
    let pending = paths.length;
    function done() {
      if (!--pending) {
        IMAGE_MANIFEST[item.id] = loadedImgs;  // array of Image objects
        _imgTasksDone++;
        $loadingProgress.textContent = `${_imgTasksDone} / ${_imgTasksTotal} items checked`;
        if (_imgTasksDone >= _imgTasksTotal) _onAllImagesSettled();
      }
    }
    paths.forEach(path => {
      const img = new Image();
      imgs.push(img);
      img.onload = () => { loadedImgs.push(img); done(); };
      img.onerror = done;
      img.src = path;
    });
  });
})();

function randomItemImage(id) {
  const imgs = IMAGE_MANIFEST[id];
  return imgs && imgs.length ? imgs[Math.floor(Math.random() * imgs.length)].src : null;
}

/* ── TIMER ───────────────────────────────────────────────────────── */
function startTimer() {
  lastTimestamp = null;
  rafId = requestAnimationFrame(timerLoop);
}
function timerLoop(ts) {
  if (state !== 'playing') return;
  if (lastTimestamp === null) lastTimestamp = ts;
  const delta = (ts - lastTimestamp) / 1000;
  lastTimestamp = ts;

  // Gradually increase timer speed after the first 20 real seconds – no cap
  gameElapsed += delta;
  if (gameElapsed > CFG.speedupStartTime) {
    const steps = Math.floor((gameElapsed - CFG.speedupStartTime) / CFG.speedupStepInterval);
    timerSpeed = 1.0 + steps * CFG.speedupStepAmount;
  }

  timer = Math.max(0, timer - delta * timerSpeed);
  updateTimerUI();
  if (timer <= 0) { endGame(); return; }
  rafId = requestAnimationFrame(timerLoop);
}
function adjustTimer(delta, originEl) {
  const oldTimer = timer;
  timer = Math.max(0, Math.min(timer + delta, timerMax + 30));
  // Floating feedback
  if (originEl) {
    const rect = originEl.getBoundingClientRect();
    showTimePop(delta, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }
  updateTimerUI();
}
function updateTimerUI() {
  const secs = Math.ceil(timer);
  $timerDisplay.textContent = secs;
  const pct = Math.min(100, (timer / timerMax) * 100);
  $timerFill.style.width = pct + '%';

  const gs = $gameScreen;
  $timerDisplay.classList.remove('warn','danger');
  $timerFill.classList.remove('warn','danger');
  $edgeGlow.className = '';
  gs.classList.remove('urgency1','urgency2','urgency3');

  if (timer <= CFG.urgency3) {
    $timerDisplay.classList.add('danger');
    $timerFill.classList.add('danger');
    $edgeGlow.classList.add('panic');
    gs.classList.add('urgency3');
    if (!panicBeepInterval) startPanicBeep();
  } else if (timer <= CFG.urgency2) {
    $timerDisplay.classList.add('danger');
    $timerFill.classList.add('danger');
    $edgeGlow.classList.add('danger');
    gs.classList.add('urgency2');
    stopPanicBeep();
  } else if (timer <= CFG.urgency1) {
    $timerDisplay.classList.add('warn');
    $timerFill.classList.add('warn');
    $edgeGlow.classList.add('warn');
    gs.classList.add('urgency1');
    stopPanicBeep();
  } else {
    stopPanicBeep();
  }
}

/* ── SCORE ───────────────────────────────────────────────────────── */
function addScore(pts) {
  score = Math.max(0, score + pts);
  $scoreDisplay.textContent = score;
}

/* ── ITEMS ───────────────────────────────────────────────────────── */
function showNextItem() {
  currentItem = nextItemFromQueue();
  actionsApplied = new Set();
  itemsSelected = false;
  $itemCard.classList.remove('selected', 'dragging');

  $itemEmoji.textContent = currentItem.emoji;
  $itemName.textContent  = currentItem.name;

  // Show photo asset if available, otherwise fall back to emoji
  const imgSrc = randomItemImage(currentItem.id);
  if (imgSrc) {
    $itemImage.style.opacity = '0';
    $itemImage.onload = () => { $itemImage.style.opacity = '1'; };
    $itemImage.src = imgSrc;
    $itemImage.alt = currentItem.name;
    // If already decoded from cache, show immediately without waiting for onload
    if ($itemImage.complete && $itemImage.naturalWidth > 0) {
      $itemImage.onload = null;
      $itemImage.style.opacity = '1';
    }
    $itemImgWrapper.style.display = 'inline-flex';
    $itemEmoji.style.display = 'none';
  } else {
    $itemImgWrapper.style.display = 'none';
    $itemEmoji.style.display = '';
  }

  // Hint bar – only in training mode
  if (trainingMode) {
    const effectiveBin = currentItem.effectiveBin || currentItem.bin;
    const effectiveHint = currentItem.effectiveHint || currentItem.hint;
    const bin = BINS[effectiveBin];
    $hintBar.textContent = `🗑️ ${bin.name} bin: ${effectiveHint}`;
    $hintBar.dataset.bin = effectiveBin;
    $hintBar.classList.remove('hidden');
  } else {
    $hintBar.classList.add('hidden');
  }

  // Required action badges – only in training mode
  $reqBadges.innerHTML = '';
  if (trainingMode && currentItem.required.length > 0) {
    currentItem.required.forEach(aid => {
      const span = document.createElement('span');
      span.className = 'req-badge';
      span.dataset.action = aid;
      span.textContent = ACTIONS[aid].emoji + ' ' + ACTIONS[aid].name;
      $reqBadges.appendChild(span);
    });
  }

  // Reset action buttons; dim those not applicable to this item
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.classList.remove('flash-good','flash-bad','used');
    const applicable = currentItem.required.includes(btn.dataset.action) ||
                       currentItem.bonus.includes(btn.dataset.action);
    btn.classList.toggle('dim', !applicable);
  });

  // Appear animation
  $itemCard.classList.remove('appear');
  void $itemCard.offsetWidth; // reflow
  $itemCard.classList.add('appear');
}

/* ── SORT ITEM ───────────────────────────────────────────────────── */
function sortItem(binColor, binEl) {
  if (!currentItem || state !== 'playing') return;
  cancelDrag();

  const effectiveBin = currentItem.effectiveBin || currentItem.bin;
  const alternatives = currentItem.alternatives || [];
  const isCorrect = binColor === effectiveBin;
  const altEntry = !isCorrect ? alternatives.find(a => a.bin === binColor) : null;
  const isAllowedAlt = !!altEntry;

  totalSorted++;

  // Required-action penalties: apply in both modes; training mode halves the penalty
  const missing = currentItem.required.filter(a => !actionsApplied.has(a));
  const penaltyPerMissing = trainingMode ? CFG.missingActionPenalty * CFG.trainingMultiplier : CFG.missingActionPenalty;
  const timePenalty = missing.length * penaltyPerMissing;

  if (isCorrect) {
    correctSorted++;
    // In normal mode missing a required action is harsh: lose combo; training mode keeps combo
    if (!trainingMode && missing.length > 0) {
      combo = 0;
      comboBonus = 0;
      $comboBonusHud.classList.add('hidden');
    } else {
      combo++;
    }
    const timeBonus = CFG.correctSortBonus - timePenalty;
    adjustTimer(timeBonus, binEl);
    const rawPts = CFG.correctPoints + combo * CFG.comboMultiplier + comboBonus;
    addScore(trainingMode ? Math.round(rawPts * CFG.trainingMultiplier) : rawPts);
    flashBin(binEl, 'flash-correct');
    sfxCorrect();
    // Every Nth combo milestone: special bonus
    if (combo > 0 && combo % CFG.comboMilestoneInterval === 0) {
      comboBonus++;
      $comboBonusHud.classList.remove('hidden');
      $comboBonusVal.textContent = comboBonus;
      sfxComboMilestone();
      showComboMilestone(combo, comboBonus);
    } else if (combo >= 3) {
      showCombo(combo);
    }
    if (missing.length > 0) {
      showTimePop(-timePenalty, binEl ? binEl.getBoundingClientRect().left + 20 : window.innerWidth/2,
                                binEl ? binEl.getBoundingClientRect().top + 20 : 100);
    }
  } else if (isAllowedAlt) {
    // Alternative bin – partial credit based on multiplier
    const mult = altEntry.multiplier;
    const doComboReset = altEntry.comboReset || mult === 0.0;

    correctSorted++; // counts as "sorted" not "wrong"
    if (doComboReset) {
      combo = 0; comboBonus = 0;
      $comboBonusHud.classList.add('hidden');
    } else {
      combo++;
    }

    if (mult > 0) {
      const timeBonus = Math.round(CFG.correctSortBonus * mult - timePenalty);
      if (timeBonus !== 0) adjustTimer(timeBonus, binEl);
      const rawPts = Math.round(
        (CFG.correctPoints + (doComboReset ? 0 : combo * CFG.comboMultiplier + comboBonus)) * mult
      );
      addScore(trainingMode ? Math.round(rawPts * CFG.trainingMultiplier) : rawPts);
      flashBin(binEl, 'flash-correct');
      sfxCorrect();
    } else {
      // 0 multiplier: no points, no time change, wrong-style feedback
      flashBin(binEl, 'flash-wrong');
      sfxWrong();
      if (trainingMode) {
        const effectiveHint = currentItem.effectiveHint || currentItem.hint;
        $hintBar.textContent = '⚠️ Allowed but 0 pts! Better: ' + BINS[effectiveBin].name + ' | ' + effectiveHint;
        $hintBar.dataset.bin = effectiveBin;
      }
    }
  } else {
    // Wrong bin
    combo = 0;
    comboBonus = 0;
    $comboBonusHud.classList.add('hidden');
    const wrongPenalty = trainingMode ? CFG.wrongSortPenalty * CFG.trainingMultiplier : CFG.wrongSortPenalty;
    adjustTimer(-wrongPenalty, binEl);
    const wrongPts = trainingMode ? Math.round(CFG.wrongPoints * CFG.trainingMultiplier) : CFG.wrongPoints;
    addScore(wrongPts);
    flashBin(binEl, 'flash-wrong');
    sfxWrong();
    // Flash the correct bin
    const correctBinEl = document.querySelector(`.bin[data-color="${effectiveBin}"]`);
    if (correctBinEl) flashBin(correctBinEl, 'flash-correct');
    if (trainingMode) {
      const effectiveHint = currentItem.effectiveHint || currentItem.hint;
      $hintBar.textContent = '❌ Wrong! → ' + BINS[effectiveBin].name + ' | ' + effectiveHint;
    }
  }

  setTimeout(() => showNextItem(), 250);
}

function flashBin(el, cls) {
  if (!el) return;
  el.classList.remove('flash-correct','flash-wrong');
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 600);
}

/* ── ACTIONS ─────────────────────────────────────────────────────── */
function applyAction(actionId, btnEl) {
  if (!currentItem || state !== 'playing') return;
  if (actionsApplied.has(actionId)) return; // already applied

  const isRequired = currentItem.required.includes(actionId);
  const isBonus    = currentItem.bonus.includes(actionId);
  const isApplicable = isRequired || isBonus;

  if (isApplicable) {
    actionsApplied.add(actionId);
    adjustTimer(CFG.bonusActionReward, btnEl);
    addScore(trainingMode ? Math.round(CFG.actionPoints * CFG.trainingMultiplier) : CFG.actionPoints);
    flashBtn(btnEl, 'flash-good');
    btnEl.classList.add('used');
    sfxAction();
    // Update required badge if applicable
    const badge = $reqBadges.querySelector(`[data-action="${actionId}"]`);
    if (badge) badge.classList.add('done');
  } else {
    const wrongActionPenalty = trainingMode ? CFG.wrongActionPenalty * CFG.trainingMultiplier : CFG.wrongActionPenalty;
    adjustTimer(-wrongActionPenalty, btnEl);
    flashBtn(btnEl, 'flash-bad');
    sfxActionBad();
  }
}

function flashBtn(el, cls) {
  el.classList.remove('flash-good','flash-bad');
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 450);
}

/* ── COMBO BANNER ────────────────────────────────────────────────── */
function showCombo(n) {
  const msgs = {3:'🔥 Triple!', 4:'⚡ Quad!', 5:'🌟 Awesome!', 6:'💥 Unstoppable!', 7:'🚀 Legend!'};
  const msg = msgs[n] || (n + 'x Combo! 🎉');
  $comboBanner.textContent = msg;
  $comboBanner.classList.remove('show');
  void $comboBanner.offsetWidth;
  $comboBanner.classList.add('show');
  sfxCombo();
  setTimeout(() => $comboBanner.classList.remove('show'), 1400);
}

function showComboMilestone(n, bonus) {
  $comboBanner.textContent = `🌟 ${n}× Streak! +${bonus} bonus pts/sort!`;
  $comboBanner.classList.remove('show');
  void $comboBanner.offsetWidth;
  $comboBanner.classList.add('show');
  setTimeout(() => $comboBanner.classList.remove('show'), 1800);
}

/* ── TIME FEEDBACK POPUP ─────────────────────────────────────────── */
function showTimePop(delta, x, y) {
  const el = document.createElement('div');
  el.className = 'time-pop';
  el.textContent = delta > 0 ? `+${delta}s` : `${delta}s`;
  el.style.color  = delta > 0 ? '#2ecc71' : '#e74c3c';
  el.style.left   = x + 'px';
  el.style.top    = y + 'px';
  el.style.transform = 'translate(-50%,-50%)';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

/* ── DRAG & DROP ─────────────────────────────────────────────────── */
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let dragOffX = 0, dragOffY = 0;
const TAP_THRESHOLD = 10; // px — movement within this = tap, not drag

function initDrag() {
  $itemCard.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup',   onPointerUp);
  // pointercancel fires on iOS when the system takes over (e.g. notification, scroll)
  document.addEventListener('pointercancel', () => { if (isDragging) cancelDrag(); });
}

function onPointerDown(e) {
  if (state !== 'playing' || !currentItem) return;
  e.preventDefault();
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  const rect = $itemCard.getBoundingClientRect();
  dragOffX = e.clientX - (rect.left + rect.width / 2);
  dragOffY = e.clientY - (rect.top  + rect.height / 2);
  $itemCard.classList.add('dragging');
  // Show matching image or emoji in the drag ghost
  if ($itemImgWrapper.style.display !== 'none' && $itemImage.src) {
    $dragGhostImage.src = $itemImage.src;
    $dragGhostImage.alt = currentItem.name;
    $dragGhostImgWrapper.style.display = 'block';
    $dragGhostEmoji.style.display = 'none';
  } else {
    $dragGhostEmoji.textContent = currentItem.emoji;
    $dragGhostEmoji.style.display = '';
    $dragGhostImgWrapper.style.display = 'none';
  }
  $dragGhost.style.left = (e.clientX - 30) + 'px';
  $dragGhost.style.top  = (e.clientY - 40) + 'px';
  $dragGhost.classList.add('active');
}

function onPointerMove(e) {
  if (!isDragging) return;
  e.preventDefault();
  $dragGhost.style.left = (e.clientX - 30) + 'px';
  $dragGhost.style.top  = (e.clientY - 40) + 'px';
  // Highlight hovered bin or action button
  document.querySelectorAll('.bin').forEach(b => b.classList.remove('drag-over'));
  document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('drag-over'));
  const target = document.elementFromPoint(e.clientX, e.clientY);
  const bin = target && target.closest('.bin');
  const actionBtn = !bin && target && target.closest('.action-btn');
  if (bin) bin.classList.add('drag-over');
  else if (actionBtn) actionBtn.classList.add('drag-over');
}

function onPointerUp(e) {
  if (!isDragging) return;
  isDragging = false;
  $dragGhost.classList.remove('active');
  $itemCard.classList.remove('dragging');
  document.querySelectorAll('.bin').forEach(b => b.classList.remove('drag-over'));
  document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('drag-over'));

  const dx = Math.abs(e.clientX - dragStartX);
  const dy = Math.abs(e.clientY - dragStartY);
  const target = document.elementFromPoint(e.clientX, e.clientY);
  const bin = target && target.closest('.bin');
  const actionBtn = !bin && target && target.closest('.action-btn');

  if (bin) {
    sortItem(bin.dataset.color, bin);
  } else if (actionBtn) {
    // Drag onto action button – apply that action (any drag distance works)
    applyAction(actionBtn.dataset.action, actionBtn);
  } else {
    // Distinguish tap from drag using actual start/end distance
    const onCard = e.target && e.target.closest('#itemCard');
    if (onCard && dx < TAP_THRESHOLD && dy < TAP_THRESHOLD) {
      // Tap on card = toggle select for subsequent tap-to-sort
      itemsSelected = !itemsSelected;
      $itemCard.classList.toggle('selected', itemsSelected);
    }
  }
}

function cancelDrag() {
  isDragging = false;
  $dragGhost.classList.remove('active');
  $itemCard.classList.remove('dragging','selected');
  document.querySelectorAll('.bin').forEach(b => b.classList.remove('drag-over'));
}

/* ── BIN LAYOUT ──────────────────────────────────────────────────── */
// Pentagon layout when 5 bins visible; 2×2 grid when 4 bins (glass bin hidden).
function positionBins() {
  requestAnimationFrame(() => {
    const area = document.getElementById('gameArea');
    const W = area.clientWidth;
    const H = area.clientHeight;
    if (!W || !H) {
      requestAnimationFrame(positionBins);
      return;
    }
    const centerX = W / 2;
    const centerY = H / 2;
    const binW = Math.min(CFG.binSizeMax, Math.max(CFG.binSizeMin, window.innerWidth * CFG.binSizeVw));
    const binH = binW;

    // Only position visible bins
    const visibleBins = Array.from(document.querySelectorAll('.bin'))
      .filter(b => !b.classList.contains('hidden'));

    if (visibleBins.length === 4) {
      // 2×2 grid layout:
      // [Top-Left: Organics]          [Top-Right: Recycling]
      //            [CENTER: Item Card]
      // [Bottom-Left: Resource Recovery]  [Bottom-Right: General Waste]
      const gx = Math.min(W * 0.30, 158);
      const gy = Math.min(H * 0.32, 145);
      const positions = [
        { x: centerX - gx - binW/2, y: centerY - gy - binH/2 },
        { x: centerX + gx - binW/2, y: centerY - gy - binH/2 },
        { x: centerX - gx - binW/2, y: centerY + gy - binH/2 },
        { x: centerX + gx - binW/2, y: centerY + gy - binH/2 },
      ];
      visibleBins.forEach((bin, i) => {
        const pos = positions[i];
        bin.style.left = Math.max(0, Math.min(pos.x, W - binW)) + 'px';
        bin.style.top  = Math.max(0, Math.min(pos.y, H - binH)) + 'px';
      });
    } else {
      // Pentagon layout (5 bins), clockwise from top
      const r = Math.min(W, H) * 0.43;
      const angles = [-90, -18, 54, 126, 198];
      visibleBins.forEach((bin, i) => {
        const rad = angles[i] * (Math.PI / 180);
        const x = centerX + r * Math.cos(rad) - binW / 2;
        const y = centerY + r * Math.sin(rad) - binH / 2;
        bin.style.left = Math.max(0, Math.min(x, W - binW)) + 'px';
        bin.style.top  = Math.max(0, Math.min(y, H - binH)) + 'px';
      });
    }
  });
}

/* ── GAME FLOW ───────────────────────────────────────────────────── */
function startGame() {
  // Read training mode from whichever toggle is currently on the visible screen
  trainingMode = $trainingToggle.checked;
  // Sync the other toggle so they always agree
  $goTrainingToggle.checked = trainingMode;

  // Enrich items for selected region
  const selectedRegion = $regionSelect ? $regionSelect.value : '';
  enrichedItems = enrichItemsForRegion(selectedRegion);
  const ruleSet = getEffectiveRuleSet(selectedRegion);

  state = 'playing';
  score = 0;
  const startTime = trainingMode ? CFG.trainingStartTime : CFG.startTime;
  timer = startTime;
  timerMax = startTime;
  combo = 0;
  comboBonus = 0;
  totalSorted = 0;
  correctSorted = 0;
  gameElapsed = 0;
  timerSpeed = 1.0;
  itemQueue = shuffle(enrichedItems);

  $scoreDisplay.textContent = '0';
  $highScoreDisplay.textContent = highScore;
  $gameScreen.classList.remove('urgency1','urgency2','urgency3');
  $edgeGlow.className = '';
  $comboBonusHud.classList.add('hidden');

  // Apply glass bin visibility/styling based on region rule set
  applyGlassBinForRegion(ruleSet);

  // Show/hide action buttons and hint bar based on mode
  $actionsBar.classList.remove('hidden');

  showScreen($gameScreen);
  positionBins();
  updateTimerUI();
  showNextItem();
  startTimer();
}

function endGame() {
  state = 'gameover';
  stopPanicBeep();
  if (rafId) cancelAnimationFrame(rafId);
  // Clear any urgency effects so they don't bleed into the end screen
  $edgeGlow.className = '';
  $gameScreen.classList.remove('urgency1','urgency2','urgency3');
  sfxGameOver();

  const isNew = score > highScore;
  if (isNew) {
    highScore = score;
    localStorage.setItem('rrHighScore', highScore);
  }
  $startHs.textContent = highScore;

  $goScore.textContent = score;
  $goBest.textContent  = highScore;
  $goItems.textContent = correctSorted;
  $goNewRecord.style.display = isNew ? 'block' : 'none';
  const acc = totalSorted > 0 ? Math.round((correctSorted / totalSorted) * 100) : 0;
  $statsLine.textContent = `${totalSorted} items attempted · ${acc}% accuracy${trainingMode ? ' · Training Mode' : ''}`;

  // Sync end-screen training toggle to match the mode that was just played
  $goTrainingToggle.checked = trainingMode;

  // Reset screenshot canvas so a fresh one is captured for this game's end screen
  resetEndScreenCanvas();

  showScreen($gameOverScreen);
}

/* ── SCREEN MANAGER ──────────────────────────────────────────────── */
function showScreen(el) {
  [$startScreen, $gameScreen, $gameOverScreen].forEach(s => s.classList.add('hidden'));
  el.classList.remove('hidden');
}

/* ── EVENT LISTENERS ─────────────────────────────────────────────── */
document.getElementById('btnPlay').addEventListener('click', () => startGame());
document.getElementById('btnAgain').addEventListener('click', () => {
  // Read training mode from the end-screen toggle and sync to start-screen
  trainingMode = $goTrainingToggle.checked;
  $trainingToggle.checked = trainingMode;
  startGame();
});
document.getElementById('btnHome').addEventListener('click', () => {
  // Sync start-screen toggle from end-screen toggle before going home
  $trainingToggle.checked = $goTrainingToggle.checked;
  $edgeGlow.className = '';    // ensure no edge glow on start screen
  stopPanicBeep();
  state = 'start';
  showScreen($startScreen);
});

// Keep both training toggles in sync
$trainingToggle.addEventListener('change', () => { $goTrainingToggle.checked = $trainingToggle.checked; });
$goTrainingToggle.addEventListener('change', () => { $trainingToggle.checked = $goTrainingToggle.checked; });

// Bin tap (for tap-to-sort)
document.querySelectorAll('.bin').forEach(bin => {
  bin.addEventListener('pointerup', (e) => {
    if (isDragging) return; // handled by drag system
    if (state !== 'playing' || !currentItem) return;
    if (itemsSelected) {
      sortItem(bin.dataset.color, bin);
    }
  });
  // Also allow direct click without prior select
  bin.addEventListener('click', (e) => {
    if (isDragging || !itemsSelected) return;
    if (state !== 'playing') return;
    sortItem(bin.dataset.color, bin);
  });
});

// Action buttons
document.querySelectorAll('.action-btn').forEach(btn => {
  btn.addEventListener('pointerup', (e) => {
    e.stopPropagation();
    applyAction(btn.dataset.action, btn);
  });
});

// Init drag
initDrag();

// Reposition bins when window is resized
window.addEventListener('resize', () => {
  if (state === 'playing') positionBins();
});

// Prevent context menu on long-press
document.addEventListener('contextmenu', e => e.preventDefault());

/* ── SHARE ────────────────────────────────────────────────────────── */
function buildShareText() {
  const newRecord = score >= highScore && score > 0;
  const emoji = newRecord ? '🏆' : '🗑️';
  return `${emoji} I scored ${score} points in Rubbish Rush – the NZ recycling game! My best is ${highScore}. Can you beat it? #RubbishRush`;
}

// Show native share button only if the Web Share API is available
if (navigator.share) {
  document.getElementById('btnShareNative').classList.remove('hidden');
}

document.getElementById('btnShareX').addEventListener('click', async () => {
  const btn = document.getElementById('btnShareX');
  const origHTML = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '⏳';
  // Try to generate screenshot first; if it works offer download
  const canvas = await generateEndScreenCanvas();
  btn.disabled = false; btn.innerHTML = origHTML;
  const text = encodeURIComponent(buildShareText());
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener,noreferrer');
  // If screenshot available, offer download after tweet popup opens
  if (canvas) {
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'rubbish-rush-score.png';
      a.click();
    }, 800);
  }
});

document.getElementById('btnShareFb').addEventListener('click', () => {
  const text = encodeURIComponent(buildShareText());
  window.open(`https://www.facebook.com/sharer/sharer.php?quote=${text}&u=${encodeURIComponent(location.href)}`, '_blank', 'noopener,noreferrer');
});

document.getElementById('btnShareNative').addEventListener('click', async () => {
  const btn = document.getElementById('btnShareNative');
  const origHTML = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '⏳ Sharing…';
  const text = buildShareText();
  const canvas = await generateEndScreenCanvas();
  btn.disabled = false; btn.innerHTML = origHTML;
  if (canvas) {
    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'rubbish-rush-score.png', { type: 'image/png' });
      try {
        await navigator.share({ files: [file], text, url: location.href });
      } catch {
        // File sharing not supported – fall back to text-only share
        try { await navigator.share({ text, url: location.href }); } catch {}
      }
    });
  } else {
    navigator.share({ text, url: location.href }).catch(() => {});
  }
});

document.getElementById('btnShareCopy').addEventListener('click', () => {
  const text = buildShareText();
  const btn = document.getElementById('btnShareCopy');
  const copiedHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
  function showCopied() {
    const original = btn.innerHTML;
    btn.innerHTML = copiedHTML;
    setTimeout(() => { btn.innerHTML = original; }, 2000);
  }
  navigator.clipboard.writeText(text).then(showCopied).catch(() => {
    // Legacy fallback for browsers without the Clipboard API (deprecated but widely supported)
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); // eslint-disable-line no-restricted-globals
    document.body.removeChild(ta);
    showCopied();
  });
});

// Screenshot download button
document.getElementById('btnScreenshot').addEventListener('click', () => downloadScreenshot());

/* ── INITIAL RENDER ──────────────────────────────────────────────── */
$startHs.textContent = highScore;
showScreen($startScreen);
startLoadingHints();
loadGameData(); // fetch data.json and populate region select

/* ── GAME DATA (Regional Rules) ──────────────────────────────────── */
let GAME_DATA = null;
let enrichedItems = null; // items enriched for current region, set at game start

async function loadGameData() {
  try {
    const r = await fetch('data.json');
    GAME_DATA = await r.json();
    populateRegionSelect();
  } catch(e) {
    console.warn('Could not load data.json:', e);
    if ($regionSelect) $regionSelect.disabled = true;
  }
}

function populateRegionSelect() {
  if (!GAME_DATA || !$regionSelect) return;
  // First option: NZ Standard Default
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = '🇳🇿 NZ Standard Default';
  $regionSelect.appendChild(defaultOpt);
  GAME_DATA.regions.forEach(reg => {
    const opt = document.createElement('option');
    opt.value = reg.region;
    opt.textContent = reg.region;
    $regionSelect.appendChild(opt);
  });
}

function getEffectiveRuleSet(regionName) {
  const fallback = {
    has_glass_bin: true, bin_color_overrides: [],
    material_overrides: [], material_hint_overrides: [], alternative_bins: [],
  };
  if (!GAME_DATA) return fallback;
  if (!regionName) return GAME_DATA.rule_sets['NZ_STANDARD_DEFAULT'] || fallback;
  const region = GAME_DATA.regions.find(reg => reg.region === regionName);
  if (!region) return GAME_DATA.rule_sets['NZ_STANDARD_DEFAULT'] || fallback;
  const ruleSetName = region.metadata.inheritsFromRuleSet;
  return GAME_DATA.rule_sets[ruleSetName] || GAME_DATA.rule_sets['NZ_STANDARD_DEFAULT'] || fallback;
}

function enrichItemsForRegion(regionName) {
  const ruleSet = getEffectiveRuleSet(regionName);
  return ITEMS.map(item => {
    // Look up material from GAME_DATA if available (items in game.js don't carry material)
    let material = item.material;
    if (!material && GAME_DATA && GAME_DATA.defaults && GAME_DATA.defaults.items) {
      const dataItem = GAME_DATA.defaults.items.find(d => d.id === item.id);
      if (dataItem) material = dataItem.material;
    }

    let effectiveBin = item.bin;
    let effectiveHint = item.hint;
    let alternatives = [];

    // Apply material overrides for primary bin
    if (material && ruleSet.material_overrides) {
      const mo = ruleSet.material_overrides.find(m => m.material === material);
      if (mo && mo.primary_bin) effectiveBin = mo.primary_bin;
    }

    // Build alternatives list from rule set
    if (material && ruleSet.alternative_bins) {
      const altEntry = ruleSet.alternative_bins.find(a => a.material === material);
      if (altEntry) alternatives = altEntry.alternatives.map(a => ({ ...a }));
    }

    // Global rule: all non-red/non-orange items can go in red with 0 multiplier
    if (effectiveBin !== 'red' && effectiveBin !== 'orange' &&
        !alternatives.find(a => a.bin === 'red')) {
      alternatives.push({ bin: 'red', multiplier: 0.0, comboReset: true });
    }

    // Apply hint overrides
    if (material && ruleSet.material_hint_overrides) {
      const mho = ruleSet.material_hint_overrides.find(m => m.material === material);
      if (mho && mho.hint) effectiveHint = mho.hint;
    }

    return { ...item, effectiveBin, effectiveHint, alternatives, _ruleSet: ruleSet };
  });
}

/* ── GLASS BIN REGION HANDLER ────────────────────────────────────── */
function applyGlassBinForRegion(ruleSet) {
  const binBlue = document.getElementById('binBlue');
  if (!binBlue) return;
  const binBlueName = binBlue.querySelector('.bin-name');
  const binBlueSub  = binBlue.querySelector('.bin-sub');

  binBlue.classList.remove('glass-green-region');

  if (!ruleSet.has_glass_bin) {
    binBlue.classList.add('hidden');
  } else {
    binBlue.classList.remove('hidden');
    const hasGreenOverride = ruleSet.bin_color_overrides &&
      ruleSet.bin_color_overrides.some(o => o.blue === 'green');
    if (hasGreenOverride) {
      binBlue.classList.add('glass-green-region');
      if (binBlueName) binBlueName.textContent = 'Glass (Green Bin)';
    } else {
      if (binBlueName) binBlueName.textContent = 'Glass';
    }
    if (binBlueSub) binBlueSub.textContent = 'Bottles & Jars';
  }
}

/* ── SCREENSHOT / SHARE ──────────────────────────────────────────── */
let _endScreenCanvas = null;

function resetEndScreenCanvas() {
  _endScreenCanvas = null;
}

async function generateEndScreenCanvas() {
  if (_endScreenCanvas) return _endScreenCanvas;
  if (typeof html2canvas === 'undefined') return null;
  try {
    _endScreenCanvas = await html2canvas(document.getElementById('gameOverScreen'), {
      backgroundColor: '#1a0000',
      scale: Math.min(window.devicePixelRatio || 1, 2),
      useCORS: true,
    });
    return _endScreenCanvas;
  } catch(e) {
    console.warn('html2canvas failed:', e);
    return null;
  }
}

async function downloadScreenshot() {
  const btn = document.getElementById('btnScreenshot');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Capturing…'; }
  const canvas = await generateEndScreenCanvas();
  if (canvas) {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'rubbish-rush-score.png';
    a.click();
  }
  if (btn) { btn.disabled = false; btn.textContent = '📸 Download Screenshot'; }
}
