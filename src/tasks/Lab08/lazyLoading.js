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
  for (let i = 0; i < images.length; i++) {
    const img = images[i];

    if (isVisibleInViewport(img) && img.dataset.src) {
      img.src = img.dataset.src;
      delete img.dataset.src;
    }
  }
}

// Load images on page load
loadImages();

// load the images when scrolling
window.addEventListener("scroll", loadImages);
