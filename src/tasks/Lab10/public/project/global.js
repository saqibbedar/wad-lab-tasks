let userProfileIconArea = document.getElementById("user-profile");
let currentLoginUrl = userProfileIconArea.href;
const userInfo = JSON.parse(localStorage.getItem("user_login_info")) || false;
const toggleVisibility = false;
if (userInfo.isLoggedIn) {
  userProfileIconArea.href = "#";
  userProfileIconArea.title = "View Profile";
  userProfileIconArea.style.cursor = "auto";
  document.querySelector(".account-id").textContent = userInfo._id;
  document.querySelector(".account-username").textContent = userInfo.username;
  // Once logged in now show him profile options
  userProfileIconArea.addEventListener("click", (e) => {
    document
      .querySelector(".loggedInUserInfo")
      .classList.toggle("toggle_user_info");

    // logout request
    document
      .querySelector(".logout_user")
      .addEventListener("click", async () => {
        // alert("working")
        let endpoint = "/api/logout";
        try {
          const res = await fetch(endpoint, { method: "POST" });
          if (!res.ok) {
            alert(res.error || "Logout Failed");
          }
          localStorage.removeItem("user_login_info");
          localStorage.removeItem("APP_CART");
          alert("Logged out successfully");
          window.location.reload();
        } catch (error) {
          localStorage.removeItem("user_login_info");
          localStorage.removeItem("APP_CART");
          console.error("Logout error: ", error);
          alert("Server error");
        }
      });
  });
} else {
  userProfileIconArea.href = currentLoginUrl;
  userProfileIconArea.title = "Login";
  userProfileIconArea.style.cursor = "pointer";
}


const CART_KEY = "APP_CART";

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || {};
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCart(productId, delta) {
  const cart = getCart();

  if (!cart[productId]) {
    cart[productId] = { qty: 0 };
  }

  cart[productId].qty += delta;

  if (cart[productId].qty <= 0) {
    delete cart[productId];
  }

  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
}
