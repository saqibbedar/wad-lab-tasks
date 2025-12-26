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
let previousScrollYPosition; // preserve last scroll position

document.querySelector(".shop-menu").addEventListener("click", (e)=>{
  let menu = document.querySelector(".menu");
  menu.classList.toggle("control-visibility");
  if(menu.classList.contains("control-visibility")) {
    e.target.textContent = "Close";
    document.body.style.overflow = "hidden";

    // save the last location where user scrolled
    previousScrollYPosition = window.scrollY || document.documentElement.scrollTop;
    // console.log(previousScrollYPosition)

    // scroll to top when user is exploring menu
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth"
    });
  } else {
    e.target.textContent = "SHOP";
    document.body.style.overflow = "auto"

    // console.log(previousScrollYPosition)
    // send back to original position after menu exploration is done
    if(previousScrollYPosition > 0) {
      window.scrollTo({
        top: previousScrollYPosition,
        left: 0,
        behavior: "smooth",
      });
      previousScrollYPosition = 0;
    }
  }
})
