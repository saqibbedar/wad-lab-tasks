const images = document.querySelectorAll("img[data-src]");

function isVisibleInViewport(element) {
  const rect = element.getBoundingClientRect();
  const windowHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  return (
    rect.top <= windowHeight &&
    rect.bottom >= 0 &&
    rect.left <= windowWidth &&
    rect.right >= 0
  );
}


function loadImages() {
  document.querySelectorAll("img[data-src]").forEach((img) => {
    if (isVisibleInViewport(img)) {
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
    }
  });
}


window.addEventListener("scroll", loadImages);

document.querySelectorAll(".img-container").forEach((container) => {
  container.addEventListener("scroll", loadImages);
});

// show HTML, if js has loaded the initial images.
document.addEventListener("DOMContentLoaded", () => {
  loadImages();
  document.documentElement.classList.remove("hide-visibility");
  document.documentElement.classList.add("show-visibility");
});
