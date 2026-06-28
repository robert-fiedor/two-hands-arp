const patterns = {
  Up: ["C3", "E3", "G3", "C4", "E4", "G4", "C5", "E5"],
  Down: ["E5", "C5", "G4", "E4", "C4", "G3", "E3", "C3"],
  Split: ["C3", "C4", "E3", "E4", "G3", "G4", "C4", "C5"],
};

const noteLane = document.querySelector("#noteLane");
const patternLabel = document.querySelector("#patternLabel");
const buttons = [...document.querySelectorAll("[data-pattern]")];
let activePattern = "Up";
let activeStep = 0;

function renderPattern() {
  const notes = patterns[activePattern];
  patternLabel.textContent = activePattern;
  noteLane.replaceChildren(
    ...notes.map((note, index) => {
      const tile = document.createElement("span");
      tile.className = `note${index === activeStep ? " hot" : ""}`;
      tile.style.setProperty("--lift", String(index % 4));
      tile.textContent = note;
      return tile;
    }),
  );
}

function setPattern(pattern) {
  activePattern = pattern;
  activeStep = 0;
  buttons.forEach((button) => {
    const isActive = button.dataset.pattern === pattern;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  renderPattern();
}

buttons.forEach((button) => {
  button.addEventListener("click", () => setPattern(button.dataset.pattern));
});

setInterval(() => {
  activeStep = (activeStep + 1) % patterns[activePattern].length;
  renderPattern();
}, 620);

renderPattern();
