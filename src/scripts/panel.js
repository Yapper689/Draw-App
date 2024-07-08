let wrapper = document.querySelector("#wrapper");
let header = wrapper.querySelector("#header");
let isPointerDown = false;
let offsetX = 0;
let offsetY = 0;
window.isDraggingPanel = false;

window.toggleMinimize = function() {

  const headerHeight = `${header.clientHeight}px`;

  if (!wrapper.style.height || wrapper.style.height !== headerHeight) {
    wrapper.style.height = headerHeight;
    wrapper.classList.add('overflow-hidden');
  } else {
    wrapper.style.height = '';
    wrapper.classList.remove('overflow-hidden');
  }
}

header.addEventListener("pointerdown", (e) => {
  isPointerDown = true;
  isDraggingPanel = true;
  offsetX = wrapper.offsetLeft - e.clientX;
  offsetY = wrapper.offsetTop - e.clientY;
  console.log(offsetX, offsetY);
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
});