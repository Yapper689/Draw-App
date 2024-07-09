import { saveSvgAsPng } from 'save-svg-as-png';

let wrapper = document.querySelector("#wrapper");
let header = wrapper.querySelector("#header");
let iconMinimize = wrapper.querySelector("#minimize");
let iconDark = wrapper.querySelector("#dark");
let isPointerDown = false;
let offsetX = 0;
let offsetY = 0;
window.isDraggingPanel = false;

window.toggleMinimize = function() {

  const headerHeight = `${header.clientHeight}px`;

  if (!wrapper.style.height || wrapper.style.height !== headerHeight) {
    wrapper.style.height = headerHeight;
    wrapper.classList.add('overflow-hidden');
    iconMinimize.classList.remove('fa-minus');
    iconMinimize.classList.add('fa-plus');
  } else {
    wrapper.style.height = '';
    wrapper.classList.remove('overflow-hidden');
    iconMinimize.classList.remove('fa-plus');
    iconMinimize.classList.add('fa-minus');
  }
}

window.toggleDarkMode = function() {
  const html = document.documentElement;
  const isDarkMode = html.classList.contains('dark');

  if (isDarkMode) {
    html.classList.remove('dark');
    iconDark.classList.remove('fa-moon');
    iconDark.classList.add('fa-sun');
  } else {
    html.classList.add('dark');
    iconDark.classList.remove('fa-sun');
    iconDark.classList.add('fa-moon');
  }
}

header.addEventListener("pointerdown", (e) => {
  isPointerDown = true;
  isDraggingPanel = true;
  offsetX = wrapper.offsetLeft - e.clientX;
  offsetY = wrapper.offsetTop - e.clientY;
  wrapper.style.transition = 'none';
});

document.addEventListener("pointermove", (e) => {
  if (!isPointerDown) return;
  e.preventDefault();
  let left = e.clientX + offsetX;
  let top = e.clientY + offsetY;
  wrapper.classList.remove("left-0");
  wrapper.classList.remove("top-0");
  wrapper.classList.remove("right-0");
  wrapper.classList.remove("bottom-0");
  wrapper.style.left = left + "px";
  wrapper.style.top = top + "px";
});

document.addEventListener("pointerup", () => {
  isPointerDown = false;
  isDraggingPanel = false;
  wrapper.style.transition = 'all 0.1s ease-in-out';
});

document.getElementById("saveImage").addEventListener("click", function() {
  saveSvgAsPng(document.getElementById("freehand-canvas"), "image.png");
});