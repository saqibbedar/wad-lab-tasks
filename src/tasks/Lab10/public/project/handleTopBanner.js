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


// handle menu
document.querySelector(".shop-menu").addEventListener("click", (e)=>{
  let menu = document.querySelector(".menu");
  menu.classList.toggle("control-visibility");
  if(menu.classList.contains("control-visibility")) {
    e.target.textContent = "Close";
    document.body.style.overflow = "hidden";
  } else {
    e.target.textContent = "SHOP";
    document.body.style.overflow = "auto"
  }
})
