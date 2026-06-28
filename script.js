const Tone = window.Tone;

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const ROOT_OPTIONS = SHARP_NAMES.map((name, semitone) => ({ name, semitone }));
const ROLE_COLORS = {
  root: "#d84b4b",
  seventh: "#c88719",
  third: "#ff4fb8",
  fifth: "#d9649c",
  extension: "#28a87d",
  flat: "#3f7ee8",
  sharp: "#8d5cff",
};
const HAND_COLORS = {
  left: "#3f7ee8",
  right: "#28a87d",
};
const DEGREE_TO_SEMITONE = {
  "1": 0,
  "b2": 1,
  "b9": 1,
  "#1": 1,
  "2": 2,
  "9": 14,
  "#2": 3,
  "#9": 15,
  "b3": 3,
  "3": 4,
  "4": 5,
  "11": 17,
  "#4": 6,
  "#11": 18,
  "b5": 6,
  "5": 7,
  "#5": 8,
  "b6": 8,
  "b13": 20,
  "6": 9,
  "13": 21,
  "bb7": 9,
  "b7": 10,
  "7": 11,
};
const SCALES = {
  dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  major: [0, 2, 4, 5, 7, 9, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
};

const presets = [
  {
    id: "one-one",
    name: "B♭ maj7#11 - 1+1 arpeggio",
    technique: "Technique A",
    root: 10,
    quality: "major",
    scaleName: "B♭ Lydian",
    scale: "lydian",
    leftDegrees: ["3", "5", "1", "9"],
    rightDegrees: ["5", "1", "#11", "5"],
    order: "asc-desc",
    baseLeftMidi: 50,
    baseRightMidi: 65,
    summary: "One four-note shape in each hand, played as a wide two-hand intervallic line.",
  },
  {
    id: "two-by-three",
    name: "Two-by-three cluster",
    technique: "Technique C",
    root: 10,
    quality: "major",
    scaleName: "B♭ Lydian",
    scale: "lydian",
    leftDegrees: ["3", "5", "1", "9"],
    rightDegrees: ["5", "1+#11", "5", "9"],
    order: "asc",
    baseLeftMidi: 50,
    baseRightMidi: 65,
    summary: "Two notes in the left hand against three in the right, with a simultaneous upper pair.",
  },
  {
    id: "interval-connect",
    name: "Interval transpose connector",
    technique: "Technique B",
    root: 10,
    quality: "major",
    scaleName: "Chromatic interval sequence",
    scale: "lydian",
    leftDegrees: ["3", "5", "1", "9"],
    rightDegrees: ["5", "1", "#11", "5"],
    order: "asc-desc",
    transform: "connect",
    interval: 3,
    copies: 4,
    baseLeftMidi: 50,
    baseRightMidi: 65,
    summary: "Copies of the 1+1 shape connected by fixed melodic interval.",
  },
  {
    id: "dorian-walk",
    name: "F Dorian min9 walk",
    technique: "Technique D",
    root: 5,
    quality: "minor",
    scaleName: "F Dorian",
    scale: "dorian",
    walkShape: ["1", "5", "9", "b3", "b7"],
    leftDegrees: ["1", "5"],
    rightDegrees: ["9", "b3", "b7"],
    order: "asc",
    transform: "walk",
    baseLeftMidi: 41,
    baseRightMidi: 60,
    summary: "A min9 shape moved diatonically through F Dorian.",
  },
];

const state = {
  preset: presets[0],
  line: [],
  activeIndex: -1,
  playIndex: 0,
  isPlaying: false,
  handMode: "both",
  sampler: null,
  reverb: null,
  chart: null,
  activeTimers: [],
  activeNotes: [],
  playbackToken: 0,
  saved: loadSaved(),
};

const els = {
  presetSelect: document.querySelector("#presetSelect"),
  techniqueSelect: document.querySelector("#techniqueSelect"),
  lineSummary: document.querySelector("#lineSummary"),
  shapeLabel: document.querySelector("#shapeLabel"),
  keyboard: document.querySelector("#keyboard"),
  eventStrip: document.querySelector("#eventStrip"),
  playButton: document.querySelector("#playButton"),
  stopButton: document.querySelector("#stopButton"),
  stepButton: document.querySelector("#stepButton"),
  tempoInput: document.querySelector("#tempoInput"),
  tempoRange: document.querySelector("#tempoRange"),
  loopToggle: document.querySelector("#loopToggle"),
  rampToggle: document.querySelector("#rampToggle"),
  rampStep: document.querySelector("#rampStep"),
  rampCeiling: document.querySelector("#rampCeiling"),
  loopStart: document.querySelector("#loopStart"),
  loopEnd: document.querySelector("#loopEnd"),
  rootSelect: document.querySelector("#rootSelect"),
  qualitySelect: document.querySelector("#qualitySelect"),
  orderSelect: document.querySelector("#orderSelect"),
  intervalSelect: document.querySelector("#intervalSelect"),
  copyCount: document.querySelector("#copyCount"),
  walkPattern: document.querySelector("#walkPattern"),
  allKeysButton: document.querySelector("#allKeysButton"),
  connectButton: document.querySelector("#connectButton"),
  walkButton: document.querySelector("#walkButton"),
  leftDegrees: document.querySelector("#leftDegrees"),
  rightDegrees: document.querySelector("#rightDegrees"),
  applyShapeButton: document.querySelector("#applyShapeButton"),
  saveName: document.querySelector("#saveName"),
  saveButton: document.querySelector("#saveButton"),
  savedList: document.querySelector("#savedList"),
  activeEventLabel: document.querySelector("#activeEventLabel"),
  melodicInterval: document.querySelector("#melodicInterval"),
  harmonicInterval: document.querySelector("#harmonicInterval"),
  parentScale: document.querySelector("#parentScale"),
};

init();

function init() {
  els.presetSelect.replaceChildren(...presets.map((preset) => makeOption(preset.id, preset.name)));
  els.techniqueSelect.replaceChildren(...["Technique A", "Technique B", "Technique C", "Technique D"].map((name) => makeOption(name, name)));
  els.rootSelect.replaceChildren(...ROOT_OPTIONS.map((root) => makeOption(String(root.semitone), `Root: ${root.name}`)));
  bindEvents();
  loadPreset(presets[0]);
  renderSaved();
}

function bindEvents() {
  els.presetSelect.addEventListener("change", () => {
    const preset = presets.find((item) => item.id === els.presetSelect.value) || presets[0];
    loadPreset(preset);
  });
  els.techniqueSelect.addEventListener("change", () => {
    const preset = presets.find((item) => item.technique === els.techniqueSelect.value) || state.preset;
    loadPreset(preset);
  });
  els.playButton.addEventListener("click", playLoop);
  els.stopButton.addEventListener("click", () => stopActive());
  els.stepButton.addEventListener("click", stepOnce);
  els.tempoInput.addEventListener("input", syncTempoFromInput);
  els.tempoRange.addEventListener("input", syncTempoFromRange);
  els.rootSelect.addEventListener("change", regenerateFromControls);
  els.qualitySelect.addEventListener("change", regenerateFromControls);
  els.orderSelect.addEventListener("change", regenerateFromControls);
  els.applyShapeButton.addEventListener("click", regenerateFromControls);
  els.allKeysButton.addEventListener("click", generateAllKeys);
  els.connectButton.addEventListener("click", generateConnect);
  els.walkButton.addEventListener("click", generateDiatonicWalk);
  els.saveButton.addEventListener("click", saveCurrentLine);
  document.querySelectorAll("[data-hand]").forEach((button) => {
    button.addEventListener("click", () => setHandMode(button.dataset.hand));
  });
}

function makeOption(value, text) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  return option;
}

function loadPreset(preset) {
  stopActive();
  state.preset = { ...preset };
  els.presetSelect.value = preset.id;
  els.techniqueSelect.value = preset.technique;
  els.rootSelect.value = String(preset.root);
  els.qualitySelect.value = preset.quality;
  els.orderSelect.value = preset.order;
  els.leftDegrees.value = (preset.leftDegrees || []).join(" ");
  els.rightDegrees.value = (preset.rightDegrees || []).join(" ");
  if (preset.interval) els.intervalSelect.value = String(preset.interval);
  if (preset.copies) els.copyCount.value = String(preset.copies);

  if (preset.transform === "connect") {
    state.line = makeConnectedLine(preset, preset.interval || 3, preset.copies || 4);
  } else if (preset.transform === "walk") {
    state.line = makeDiatonicWalkLine(preset, [1]);
  } else {
    state.line = makeLine(preset);
  }
  state.playIndex = 0;
  render();
}

function regenerateFromControls() {
  const edited = {
    ...state.preset,
    root: Number(els.rootSelect.value),
    quality: els.qualitySelect.value,
    order: els.orderSelect.value,
    leftDegrees: parseDegreeInput(els.leftDegrees.value),
    rightDegrees: parseDegreeInput(els.rightDegrees.value),
    scaleName: `${SHARP_NAMES[Number(els.rootSelect.value)]} ${els.qualitySelect.value === "minor" ? "Dorian" : "Lydian"}`,
  };
  state.preset = edited;
  state.line = makeLine(edited);
  state.playIndex = 0;
  stopActive();
  render();
}

function parseDegreeInput(value) {
  return value.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean);
}

function makeLine(preset, rootOverride = preset.root, orderOverride = preset.order) {
  const root = Number(rootOverride);
  const baseLeftMidi = Number.isFinite(preset.baseLeftMidi) ? preset.baseLeftMidi + (root - preset.root) : midiFromSemitone(root, 2);
  const baseRightMidi = Number.isFinite(preset.baseRightMidi) ? preset.baseRightMidi + (root - preset.root) : midiFromSemitone(root, 4);
  const left = resolveHandDegrees(preset.leftDegrees || [], root, baseLeftMidi, preset.quality, "left");
  const right = resolveHandDegrees(preset.rightDegrees || [], root, baseRightMidi, preset.quality, "right");
  const count = Math.max(left.length, right.length);
  const ascending = Array.from({ length: count }, (_, index) => makeEvent(index, left[index], right[index], root));
  const events = applyOrder(ascending, orderOverride).map((event, index) => ({
    ...event,
    id: `${preset.id || "line"}-${root}-${index}`,
  }));
  return events;
}

function applyOrder(events, order) {
  if (order === "desc") return [...events].reverse();
  if (order === "asc-desc") return [...events, ...events.slice(0, -1).reverse()];
  return events;
}

function makeEvent(index, left, right, root) {
  const event = {
    index,
    root,
    left: left ? left.notes : [],
    right: right ? right.notes : [],
    leftDegrees: left ? left.degrees : [],
    rightDegrees: right ? right.degrees : [],
  };
  event.notes = [...event.left, ...event.right];
  event.melodic = "";
  event.harmonic = "";
  return event;
}

function resolveHandDegrees(degrees, root, baseMidi, quality, hand) {
  let previous = baseMidi - 1;
  return degrees.map((slot) => {
    const degreeList = String(slot).split("+").map(normalizeDegree);
    const notes = degreeList.map((degree) => {
      const semitoneOffset = degreeToSemitone(applyQuality(degree, quality));
      let midi = rootMidiNear(root, baseMidi) + semitoneOffset;
      while (midi <= previous) midi += 12;
      previous = midi;
      return {
        note: midiToNote(midi),
        midi,
        degree: displayDegree(degree),
        hand,
        color: degreeColor(degree, hand),
      };
    });
    return {
      notes,
      degrees: degreeList.map(displayDegree),
    };
  });
}

function applyQuality(degree, quality) {
  if (quality === "minor" && degree === "3") return "b3";
  if (quality === "dominant" && degree === "7") return "b7";
  return degree;
}

function normalizeDegree(degree) {
  return String(degree)
    .replaceAll("♭", "b")
    .replaceAll("♯", "#")
    .trim();
}

function displayDegree(degree) {
  return String(degree).replaceAll("b", "♭").replaceAll("#", "♯");
}

function degreeToSemitone(degree) {
  const normalized = normalizeDegree(degree);
  return DEGREE_TO_SEMITONE[normalized] ?? 0;
}

function degreeColor(degree, hand) {
  const normalized = normalizeDegree(degree);
  if (normalized === "1") return ROLE_COLORS.root;
  if (/^(b3|3|#3)$/.test(normalized)) return ROLE_COLORS.third;
  if (/^(5|b5|#5)$/.test(normalized)) return ROLE_COLORS.fifth;
  if (/^(bb7|b7|7)$/.test(normalized)) return ROLE_COLORS.seventh;
  if (normalized.includes("#")) return ROLE_COLORS.sharp;
  if (normalized.includes("b")) return ROLE_COLORS.flat;
  return HAND_COLORS[hand] || ROLE_COLORS.extension;
}

function generateAllKeys() {
  stopActive();
  const base = { ...state.preset, order: els.orderSelect.value };
  state.line = ROOT_OPTIONS.flatMap((root) => makeLine(base, root.semitone, base.order));
  state.playIndex = 0;
  els.lineSummary.textContent = `${base.name || "Shape"} through all 12 keys`;
  renderLineOnly();
}

function generateConnect() {
  stopActive();
  const interval = Number(els.intervalSelect.value);
  const copies = Number(els.copyCount.value);
  state.line = makeConnectedLine(state.preset, interval, copies);
  state.playIndex = 0;
  els.lineSummary.textContent = `Connected copies by ${intervalName(interval)}`;
  renderLineOnly();
}

function makeConnectedLine(preset, interval, copies) {
  return Array.from({ length: copies }, (_, copy) => {
    const root = normalizeSemitone(preset.root + copy * interval);
    const order = copy % 2 === 0 ? "asc" : "desc";
    return makeLine({ ...preset, order }, root, order);
  }).flat();
}

function generateDiatonicWalk() {
  stopActive();
  const steps = parseWalkSteps(els.walkPattern.value);
  state.line = makeDiatonicWalkLine(state.preset, steps);
  state.playIndex = 0;
  els.lineSummary.textContent = `${state.preset.scaleName || "Scale"} shape-walk: ${steps.map((step) => step > 0 ? `+${step}` : String(step)).join(", ")}`;
  renderLineOnly();
}

function makeDiatonicWalkLine(preset, steps) {
  const root = Number(preset.root);
  const scale = SCALES[preset.scale || "dorian"] || SCALES.dorian;
  const shape = preset.walkShape || [...(preset.leftDegrees || []), ...(preset.rightDegrees || [])];
  let degreeIndex = 0;
  const events = [];

  for (let repeat = 0; repeat < 8; repeat += 1) {
    shape.forEach((degree, index) => {
      const hand = index < 2 ? "left" : "right";
      const baseMidi = hand === "left" ? 41 : 60;
      const midi = scaleDegreeMidi(root, scale, degreeToScaleIndex(degree) + degreeIndex, baseMidi);
      const left = hand === "left" ? [makeNote(midi, degree, hand)] : [];
      const right = hand === "right" ? [makeNote(midi, degree, hand)] : [];
      events.push({
        id: `walk-${repeat}-${index}`,
        index: events.length,
        root,
        left,
        right,
        notes: [...left, ...right],
        leftDegrees: hand === "left" ? [displayDegree(degree)] : [],
        rightDegrees: hand === "right" ? [displayDegree(degree)] : [],
      });
    });
    degreeIndex += steps[repeat % steps.length];
  }

  return events;
}

function parseWalkSteps(value) {
  const steps = value.split(/[\s,]+/).map(Number).filter((step) => Number.isFinite(step) && step !== 0);
  return steps.length ? steps : [1];
}

function degreeToScaleIndex(degree) {
  const normalized = normalizeDegree(degree);
  const number = Number(normalized.replace(/^[b#]+/, ""));
  return Math.max(0, ((number - 1) % 7 + 7) % 7);
}

function scaleDegreeMidi(root, scale, index, baseMidi) {
  const octaveOffset = Math.floor(index / scale.length);
  const semitone = root + scale[((index % scale.length) + scale.length) % scale.length] + octaveOffset * 12;
  let midi = rootMidiNear(root, baseMidi) + (semitone - root);
  while (midi < baseMidi) midi += 12;
  return midi;
}

function makeNote(midi, degree, hand) {
  return {
    note: midiToNote(midi),
    midi,
    degree: displayDegree(degree),
    hand,
    color: degreeColor(degree, hand),
  };
}

function render() {
  els.lineSummary.textContent = state.preset.summary || "Two-hand intervallic lines trainer";
  els.shapeLabel.textContent = `${state.preset.technique}: LH ${els.leftDegrees.value} / RH ${els.rightDegrees.value}`;
  els.parentScale.textContent = state.preset.scaleName || "-";
  renderKeyboardForLine();
  renderLineOnly();
}

function renderLineOnly() {
  annotateIntervals(state.line);
  renderLoopOptions();
  renderEvents();
  renderTheory();
}

function renderKeyboardForLine() {
  const notes = state.line.flatMap((event) => event.notes || []);
  const noteColors = Object.fromEntries(notes.map((note) => [note.note, note.color]));
  state.chart = renderKeyboard(els.keyboard, notes.map((note) => note.note), noteColors);
}

function renderEvents() {
  els.eventStrip.replaceChildren(...state.line.map((event, index) => {
    const card = document.createElement("button");
    const top = document.createElement("div");
    const left = document.createElement("div");
    const right = document.createElement("div");

    card.type = "button";
    card.className = `event-card${index === state.activeIndex ? " is-active" : ""}`;
    card.addEventListener("click", () => {
      state.playIndex = index;
      playEvent(index);
    });

    top.className = "event-top";
    top.innerHTML = `<span>${index + 1}</span><span>${event.melodic || "-"}</span>`;
    left.className = "hand-line left-hand";
    right.className = "hand-line right-hand";
    left.innerHTML = `<span>LH</span><span class="degree-list">${formatHand(event.left, event.leftDegrees)}</span>`;
    right.innerHTML = `<span>RH</span><span class="degree-list">${formatHand(event.right, event.rightDegrees)}</span>`;
    card.append(top, left, right);
    return card;
  }));
}

function formatHand(notes, degrees) {
  if (!notes.length) return "-";
  return `${notes.map((note) => note.note).join("+")} · ${degrees.join("+")}`;
}

function renderLoopOptions() {
  const options = state.line.map((_, index) => makeOption(String(index), String(index + 1)));
  els.loopStart.replaceChildren(...options.map((option) => option.cloneNode(true)));
  els.loopEnd.replaceChildren(...options.map((option) => option.cloneNode(true)));
  els.loopStart.value = "0";
  els.loopEnd.value = String(Math.max(0, state.line.length - 1));
}

function renderTheory() {
  const event = state.line[state.activeIndex] || state.line[0];
  els.activeEventLabel.textContent = event ? `${event.notes.map((note) => note.note).join(" + ")} / ${[...event.leftDegrees, ...event.rightDegrees].join(" + ")}` : "Ready";
  els.melodicInterval.textContent = event?.melodic || "-";
  els.harmonicInterval.textContent = event?.harmonic || "-";
  els.parentScale.textContent = state.preset.scaleName || "-";
}

function annotateIntervals(line) {
  let previousMidi = null;
  line.forEach((event) => {
    const lead = event.right[0] || event.left[0];
    event.melodic = previousMidi !== null && lead ? intervalName(Math.abs(lead.midi - previousMidi)) : "start";
    previousMidi = lead ? lead.midi : previousMidi;
    event.harmonic = event.left[0] && event.right[0] ? intervalName(Math.abs(event.right[0].midi - event.left[0].midi)) : "-";
  });
}

async function playLoop() {
  await ensureSampler();
  stopActive(Tone.now(), false);
  state.isPlaying = true;
  els.playButton.classList.add("is-playing");
  state.playIndex = Number(els.loopStart.value || 0);
  scheduleNextEvent();
}

function scheduleNextEvent() {
  if (!state.isPlaying) return;
  const start = Number(els.loopStart.value || 0);
  const end = Number(els.loopEnd.value || state.line.length - 1);
  const index = Math.min(Math.max(state.playIndex, start), end);
  playEvent(index, true);
  state.playIndex = index + 1;

  const stepMs = (60 / Number(els.tempoInput.value || 84)) * 1000;
  state.activeTimers.push(window.setTimeout(() => {
    if (state.playIndex > end) {
      if (!els.loopToggle.checked) {
        stopActive();
        return;
      }
      if (els.rampToggle.checked) rampTempo();
      state.playIndex = start;
    }
    scheduleNextEvent();
  }, stepMs));
}

async function playEvent(index, fromLoop = false) {
  await ensureSampler();
  if (!fromLoop) stopActive(Tone.now(), false);
  const token = state.playbackToken + 1;
  state.playbackToken = token;
  const event = state.line[index];
  const now = Tone.now();
  const duration = Math.max(0.16, (60 / Number(els.tempoInput.value || 84)) * 0.82);
  const notes = playableNotes(event);

  state.activeIndex = index;
  state.activeNotes = notes.map((note) => note.note);
  renderEvents();
  renderTheory();
  state.chart.allUp();

  notes.forEach((note, noteIndex) => {
    const offset = noteIndex * 0.012;
    state.sampler.triggerAttackRelease(note.note, duration, now + offset, note.hand === "left" ? 0.68 : 0.76);
    scheduleKeyDown(note.note, offset, token);
    scheduleKeyUp(note.note, offset + duration, token);
  });
}

function playableNotes(event) {
  if (!event) return [];
  if (state.handMode === "left") return event.left;
  if (state.handMode === "right") return event.right;
  return [...event.left, ...event.right];
}

function stepOnce() {
  const start = Number(els.loopStart.value || 0);
  const end = Number(els.loopEnd.value || state.line.length - 1);
  const index = state.playIndex > end || state.playIndex < start ? start : state.playIndex;
  playEvent(index);
  state.playIndex = index >= end ? start : index + 1;
}

function setHandMode(mode) {
  state.handMode = mode;
  document.querySelectorAll("[data-hand]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.hand === mode);
  });
}

async function ensureSampler() {
  await Tone.start();
  if (state.sampler) {
    await Tone.loaded();
    return;
  }
  state.reverb = new Tone.Reverb({ decay: 1.3, wet: 0.16 }).toDestination();
  state.sampler = new Tone.Sampler({
    urls: {
      A0: "A0.mp3",
      C1: "C1.mp3",
      "D#1": "Ds1.mp3",
      "F#1": "Fs1.mp3",
      A1: "A1.mp3",
      C2: "C2.mp3",
      "D#2": "Ds2.mp3",
      "F#2": "Fs2.mp3",
      A2: "A2.mp3",
      C3: "C3.mp3",
      "D#3": "Ds3.mp3",
      "F#3": "Fs3.mp3",
      A3: "A3.mp3",
      C4: "C4.mp3",
      "D#4": "Ds4.mp3",
      "F#4": "Fs4.mp3",
      A4: "A4.mp3",
      C5: "C5.mp3",
    },
    release: 1.25,
    baseUrl: "https://tonejs.github.io/audio/salamander/",
  }).connect(state.reverb);
  await Tone.loaded();
}

function scheduleKeyDown(note, offsetSeconds, token) {
  state.activeTimers.push(window.setTimeout(() => {
    if (state.playbackToken !== token) return;
    state.chart.keyDown(note);
  }, offsetSeconds * 1000));
}

function scheduleKeyUp(note, offsetSeconds, token) {
  state.activeTimers.push(window.setTimeout(() => {
    if (state.playbackToken !== token) return;
    state.chart.keyUp(note);
  }, offsetSeconds * 1000));
}

function stopActive(time = Tone?.now?.() || 0, clearIndex = true) {
  state.isPlaying = false;
  state.playbackToken += 1;
  state.activeTimers.forEach((timer) => window.clearTimeout(timer));
  state.activeTimers = [];
  els.playButton.classList.remove("is-playing");
  if (state.sampler && state.activeNotes.length) {
    if (typeof state.sampler.releaseAll === "function") {
      state.sampler.releaseAll(time);
    } else {
      state.sampler.triggerRelease(state.activeNotes, time);
    }
  }
  state.activeNotes = [];
  if (state.chart) state.chart.allUp();
  if (clearIndex) state.activeIndex = -1;
  renderEvents();
  renderTheory();
}

function renderKeyboard(target, highlightedNotes, noteColors) {
  const whiteNotes = buildWhiteNotes(4);
  const blackNotes = buildBlackNotes(4);
  const whiteWidth = 44;
  const blackWidth = 26;
  const blackHeight = 74;
  const height = 126;
  const width = whiteNotes.length * whiteWidth;
  const highlights = new Set(highlightedNotes.map((note) => note.note || note));

  const whiteKeys = whiteNotes.map((note, index) => {
    const fill = noteColors[note] || (highlights.has(note) ? "#f4fbff" : "#ffffff");
    const textColor = getKeyTextColor(fill);
    return `
      <g>
        <rect data-note="${note}" data-base-fill="${fill}" data-base-stroke="#1f2530" data-base-stroke-width="1.3" x="${index * whiteWidth}" y="0" width="${whiteWidth}" height="${height}" rx="4" fill="${fill}" stroke="#1f2530" stroke-width="1.3"></rect>
        <text x="${index * whiteWidth + whiteWidth / 2}" y="112" text-anchor="middle" fill="${textColor}" font-size="10" font-weight="780">${stripOctave(note)}</text>
      </g>
    `;
  }).join("");

  const blackKeys = blackNotes.map(({ note, afterWhite }) => {
    const fill = noteColors[note] ? shadeColor(noteColors[note]) : "#151922";
    const textColor = noteColors[note] ? "#ffffff" : "#d7dde6";
    const x = (afterWhite + 1) * whiteWidth - blackWidth / 2;
    return `
      <g>
        <rect data-note="${note}" data-base-fill="${fill}" data-base-stroke="#111827" data-base-stroke-width="1" x="${x}" y="0" width="${blackWidth}" height="${blackHeight}" rx="4" fill="${fill}" stroke="#111827" stroke-width="1"></rect>
        <text x="${x + blackWidth / 2}" y="60" text-anchor="middle" fill="${textColor}" font-size="8.5" font-weight="780">${stripOctave(note)}</text>
      </g>
    `;
  }).join("");

  target.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Piano keyboard" preserveAspectRatio="xMidYMid meet">
      ${whiteKeys}
      ${blackKeys}
    </svg>
  `;

  return {
    keyDown(note) {
      getKeyRects(target, note).forEach((rect) => setKeyActive(rect));
    },
    keyUp(note) {
      getKeyRects(target, note).forEach((rect) => restoreKey(rect));
    },
    allUp() {
      target.querySelectorAll("rect[data-note]").forEach((rect) => forceRestoreKey(rect));
    },
  };
}

function buildWhiteNotes(octaveCount) {
  const notes = [];
  for (let octave = 2; octave <= 2 + octaveCount; octave += 1) {
    ["C", "D", "E", "F", "G", "A", "B"].forEach((name) => {
      if (octave === 2 + octaveCount && name !== "C") return;
      notes.push(`${name}${octave}`);
    });
  }
  return notes;
}

function buildBlackNotes(octaveCount) {
  const notes = [];
  for (let octave = 2; octave < 2 + octaveCount; octave += 1) {
    const offset = (octave - 2) * 7;
    [["C#", 0], ["D#", 1], ["F#", 3], ["G#", 4], ["A#", 5]].forEach(([name, afterWhite]) => {
      notes.push({ note: `${name}${octave}`, afterWhite: offset + afterWhite });
    });
  }
  return notes;
}

function getKeyRects(target, note) {
  return Array.from(target.querySelectorAll("rect[data-note]")).filter((rect) => rect.dataset.note === (note.note || note));
}

function setKeyActive(rect) {
  const activeCount = Number(rect.dataset.activeCount || 0) + 1;
  rect.dataset.activeCount = String(activeCount);
  rect.setAttribute("fill", "#fff176");
  rect.setAttribute("stroke", "#0f172a");
  rect.setAttribute("stroke-width", "2.6");
  rect.style.filter = "drop-shadow(0 0 7px rgba(255, 214, 10, 0.78))";
}

function restoreKey(rect) {
  const activeCount = Math.max(0, Number(rect.dataset.activeCount || 0) - 1);
  rect.dataset.activeCount = String(activeCount);
  if (activeCount > 0) return;
  forceRestoreKey(rect);
}

function forceRestoreKey(rect) {
  rect.removeAttribute("data-active-count");
  rect.setAttribute("fill", rect.dataset.baseFill || "#ffffff");
  rect.setAttribute("stroke", rect.dataset.baseStroke || "#1f2530");
  rect.setAttribute("stroke-width", rect.dataset.baseStrokeWidth || "1");
  rect.style.filter = "";
}

function syncTempoFromInput() {
  els.tempoRange.value = els.tempoInput.value;
}

function syncTempoFromRange() {
  els.tempoInput.value = els.tempoRange.value;
}

function rampTempo() {
  const next = Math.min(Number(els.rampCeiling.value || 132), Number(els.tempoInput.value || 84) + Number(els.rampStep.value || 2));
  els.tempoInput.value = String(next);
  els.tempoRange.value = String(next);
}

function saveCurrentLine() {
  const name = els.saveName.value.trim() || `${state.preset.name} copy`;
  const saved = {
    id: `saved-${Date.now()}`,
    name,
    technique: state.preset.technique,
    preset: {
      ...state.preset,
      name,
      leftDegrees: parseDegreeInput(els.leftDegrees.value),
      rightDegrees: parseDegreeInput(els.rightDegrees.value),
    },
  };
  state.saved.unshift(saved);
  window.localStorage.setItem("twoHandsArpSaved", JSON.stringify(state.saved));
  els.saveName.value = "";
  renderSaved();
}

function loadSaved() {
  try {
    return JSON.parse(window.localStorage.getItem("twoHandsArpSaved") || "[]");
  } catch {
    return [];
  }
}

function renderSaved() {
  if (!state.saved.length) {
    const empty = document.createElement("p");
    empty.textContent = "No saved shapes yet.";
    els.savedList.replaceChildren(empty);
    return;
  }
  els.savedList.replaceChildren(...state.saved.map((item) => {
    const row = document.createElement("div");
    const label = document.createElement("div");
    const name = document.createElement("strong");
    const meta = document.createElement("span");
    const button = document.createElement("button");
    row.className = "saved-item";
    name.textContent = item.name;
    meta.textContent = item.technique;
    label.append(name, document.createElement("br"), meta);
    button.className = "command";
    button.type = "button";
    button.textContent = "Load";
    button.addEventListener("click", () => loadPreset(item.preset));
    row.append(label, button);
    return row;
  }));
}

function intervalName(semitones) {
  const names = {
    0: "unison",
    1: "m2",
    2: "M2",
    3: "m3",
    4: "M3",
    5: "P4",
    6: "tritone",
    7: "P5",
    8: "m6",
    9: "M6",
    10: "m7",
    11: "M7",
    12: "octave",
  };
  const compound = Math.abs(semitones);
  const octaves = Math.floor(compound / 12);
  const simple = compound % 12;
  if (compound === 0) return names[0];
  return `${octaves ? `${octaves} octave + ` : ""}${names[simple] || `${simple} st`}`;
}

function rootMidiNear(root, baseMidi) {
  let midi = midiFromSemitone(root, Math.floor(baseMidi / 12) - 1);
  while (midi > baseMidi) midi -= 12;
  while (midi + 12 <= baseMidi) midi += 12;
  return midi;
}

function midiFromSemitone(semitone, octave) {
  return (octave + 1) * 12 + normalizeSemitone(semitone);
}

function midiToNote(midi) {
  const semitone = normalizeSemitone(midi);
  const octave = Math.floor(midi / 12) - 1;
  return `${SHARP_NAMES[semitone]}${octave}`;
}

function normalizeSemitone(value) {
  return ((Number(value) % 12) + 12) % 12;
}

function stripOctave(note) {
  return String(note).replace(/\d+$/, "");
}

function shadeColor(color) {
  if (color === ROLE_COLORS.extension) return "#1a8450";
  if (color === ROLE_COLORS.root) return "#b63232";
  if (color === ROLE_COLORS.seventh) return "#9f6814";
  if (color === ROLE_COLORS.third) return "#bd2f83";
  if (color === ROLE_COLORS.fifth) return "#dc79ad";
  if (color === ROLE_COLORS.flat) return "#265fbd";
  if (color === ROLE_COLORS.sharp) return "#6239c2";
  if (color === HAND_COLORS.left) return "#265fbd";
  if (color === HAND_COLORS.right) return "#1a8450";
  return color;
}

function getKeyTextColor(fill) {
  const hex = fill.replace("#", "");
  if (hex.length !== 6) return "#ffffff";
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return brightness > 170 ? "#4c5563" : "#ffffff";
}
