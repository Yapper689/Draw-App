let wrapper = document.querySelector("#wrapper");
let header = wrapper.querySelector("#header");
isMouseDown = false;

let offsetX = 0;
let offsetY = 0;

function handleMouseDown(event) {
  event.stopImmediatePropagation();
  event.stopPropagation();
  event.preventDefault();
}

function toggleMinimize() {
  const wrapper = document.querySelector("#wrapper");
  const header = document.querySelector("#header");

  const headerHeight = `${header.clientHeight}px`;

  if (!wrapper.style.height || wrapper.style.height !== headerHeight) {
    wrapper.style.height = headerHeight;
    wrapper.classList.add('overflow-hidden');
  } else {
    wrapper.style.height = '';
    wrapper.classList.remove('overflow-hidden');
  }
}

header.addEventListener("mousedown", (e) => {
  isMouseDown = true;
  offsetX = wrapper.offsetLeft - e.clientX;
  offsetY = wrapper.offsetTop - e.clientY;
  console.log(offsetX, offsetY);
});

document.addEventListener("mousemove", (e) => {
  if (!isMouseDown) return;
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

document.addEventListener("mouseup", () => {
  isMouseDown = false;
});