let userProfileIconArea = document.getElementById("user-profile");
let currentLoginUrl = userProfileIconArea.href;
const userInfo = JSON.parse(localStorage.getItem("user_login_info")) || false;
const toggleVisibility = false;

document.querySelector(".admin-dashboard-button").style.display = "none";

// manage user profile area
if (userInfo.isLoggedIn) {
  userProfileIconArea.href = "#";
  userProfileIconArea.title = "View Profile";
  userProfileIconArea.style.cursor = "auto";
  document.querySelector(".account-id").textContent = userInfo._id;
  document.querySelector(".account-username").textContent = userInfo.username;
  
  if(userInfo.username === "admin"){
    document.querySelector(".admin-dashboard-button").style.display = "block";
  }

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
            // alert(res.error || "Logout Failed");
          }
          localStorage.removeItem("user_login_info");
          localStorage.removeItem("tbr");
          localStorage.removeItem("cart-size");
          // alert("Logged out successfully");
          window.location.reload();
        } catch (error) {
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
