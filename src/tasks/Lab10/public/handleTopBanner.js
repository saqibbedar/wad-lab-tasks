const topBanner = document.querySelector(".top-banner");

if (localStorage.getItem("tbr") === "hide") {
  topBanner.classList.add("hide");
}

topBanner.lastElementChild.addEventListener("click", () => {
  const isHidden = topBanner.classList.toggle("hide");

  if (isHidden) {
    localStorage.setItem("tbr", "hide");
  } else {
    localStorage.removeItem("tbr");
  }
});


// handle menu (safe + works after resize)
let previousScrollYPosition = 0;

const menu = document.querySelector(".menu");
const shopMenuButtons = document.querySelectorAll(".shop-menu");

const setShopText = (text) => {
  shopMenuButtons.forEach((btn) => (btn.textContent = text));
};

const toggleMenu = () => {
  if (!menu) return;

  const isOpen = menu.classList.toggle("control-visibility");

  if (isOpen) {
    setShopText("Close");
    document.body.style.overflow = "hidden";
    previousScrollYPosition = window.scrollY || document.documentElement.scrollTop || 0;

    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  } else {
    setShopText("SHOP");
    document.body.style.overflow = "auto";

    const y = previousScrollYPosition;
    previousScrollYPosition = 0;

    if (y > 0) window.scrollTo({ top: y, left: 0, behavior: "smooth" });
  }
};

shopMenuButtons.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    // ensure we always change the right element(s)
    toggleMenu();
  });
});