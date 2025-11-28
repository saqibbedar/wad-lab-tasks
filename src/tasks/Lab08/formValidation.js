let form = document.getElementById("form");
let errorLines = document.querySelectorAll(".error-line");
// console.log(errorLines);

let validationStates = {
  fname: { isValid: false },
  lname: { isValid: false },
  email: { isValid: false },
  password: { isValid: false },
  confirmPassword: { isValid: false },
  policy: { isValid: false },
};

// patterns
const nameRegex = /^[a-zA-Z]+$/;
const emailRegex =
  /^(?<user>[a-zA-Z0-9._%+-]+)(?<at>@)(?<domain>[a-zA-Z0-9.-]+)(?<dot>\.)(?<tld>[a-zA-Z]{2,})$/;
const passRegex = /^(?<password>[A-Za-z0-9!@#$%^&*()]{4,6})$/;

// validators
function validateEmail(email) {
  if (email.trim() === "") {
    return false;
  } else if (!emailRegex.test(email)) {
    return false;
  }
  return true;
}

function validatePassword(password) {
  if (password.trim() === "") {
    return false;
  } else if (!passRegex.test(password)) {
    return false;
  }
  return true;
}

function validateConfirmPassword(password, confirmPassword) {
  if (confirmPassword.trim() === "") {
    return false;
  } else if (password !== confirmPassword) {
    return false;
  }
  return true;
}

function validateName(name) {
  if (name.trim() === "") {
    return false;
  } else if (!nameRegex.test(name)) {
    return false;
  }
  return true;
}

// when element gets active
form.addEventListener(
  "focus",
  (e) => {
    const target = e.target;

    if (target.id === "fname" && target.value.trim() === "") {
      errorLines[0].classList.remove("show");
      target.classList.add("bg-red");
      validationStates.fname.isValid = false;
    }
    if (target.id === "email" && target.value.trim() === "") {
      errorLines[1].classList.remove("show");
      target.classList.add("bg-red");
      validationStates.email.isValid = false;
    }
    if (target.id === "password" && target.value.trim() === "") {
      errorLines[2].classList.remove("show");
      target.classList.add("bg-red");
      validationStates.password.isValid = false;
    }
    if (target.id === "confirm-password" && target.value.trim() === "") {
      errorLines[3].classList.remove("show");
      target.classList.add("bg-red");
      validationStates.confirmPassword.isValid = false;
    }
  },
  true
);

// blur listener
form.addEventListener(
  "blur",
  (e) => {
    const target = e.target;

    if (target.id === "fname" && target.value.trim() !== "") {
      if (!validateName(target.value)) {
        errorLines[0].classList.remove("show");
        target.classList.add("bg-red");
        validationStates.fname.isValid = false;
      } else {
        errorLines[0].classList.add("show");
        target.classList.remove("bg-red");
        validationStates.fname.isValid = true;
      }
    }

    if (target.id === "email" && target.value.trim() !== "") {
      if (!validateEmail(target.value)) {
        errorLines[1].classList.remove("show");
        target.classList.add("bg-red");
        validationStates.email.isValid = false;
      } else {
        errorLines[1].classList.add("show");
        target.classList.remove("bg-red");
        validationStates.email.isValid = true;
      }
    }

    if (target.id === "password" && target.value.trim() !== "") {
      if (!validatePassword(target.value)) {
        errorLines[2].classList.remove("show");
        target.classList.add("bg-red");
        validationStates.password.isValid = false;
      } else {
        errorLines[2].classList.add("show");
        target.classList.remove("bg-red");
        validationStates.password.isValid = true;
      }
    }

    if (target.id === "confirm-password" && target.value.trim() !== "") {
      if (
        !validateConfirmPassword(
          form.password.value.trim(),
          target.value.trim()
        )
      ) {
        errorLines[3].classList.remove("show");
        target.classList.add("bg-red");
        validationStates.confirmPassword.isValid = false;
      } else {
        errorLines[3].classList.add("show");
        target.classList.remove("bg-red");
        validationStates.confirmPassword.isValid = true;
      }
    }
  },
  true
);

// input listener
form.addEventListener(
  "input",
  (e) => {
    const target = e.target;

    let password = form.password.value.trim();
    let confirmPassword = form["confirm-password"].value.trim();

    // fname
    if (target.id === "fname" && target.value.trim() === "") {
      errorLines[0].classList.remove("show");
      target.classList.add("bg-red");
      validationStates.fname.isValid = false;
    } else if (target.id === "fname") {
      if (!validateName(target.value)) {
        target.classList.add("bg-red");
        errorLines[0].classList.remove("show");
        validationStates.fname.isValid = false;
      } else {
        target.classList.remove("bg-red");
        errorLines[0].classList.add("show");
        validationStates.fname.isValid = true;
      }
    }

    // email
    if (target.id === "email" && target.value.trim() === "") {
      errorLines[1].classList.remove("show");
      target.classList.add("bg-red");
      validationStates.email.isValid = false;
    } else if (target.id === "email") {
      if (!validateEmail(target.value)) {
        errorLines[1].classList.remove("show");
        target.classList.add("bg-red");
        validationStates.email.isValid = false;
      } else {
        errorLines[1].classList.add("show");
        target.classList.remove("bg-red");
        validationStates.email.isValid = true;
      }
    }

    // password
    if (target.id === "password" && target.value.trim() === "") {
      errorLines[2].classList.remove("show");
      target.classList.add("bg-red");
      validationStates.password.isValid = false;
    } else if (target.id === "password") {
      if (!validatePassword(target.value)) {
        target.classList.add("bg-red");
        errorLines[2].classList.remove("show");
        validationStates.password.isValid = false;
      } else {
        errorLines[2].classList.add("show");
        target.classList.remove("bg-red");
        validationStates.password.isValid = true;
      }
    }

    // confirm password
    if (target.id === "confirm-password" && target.value.trim() === "") {
      errorLines[3].classList.remove("show");
      validationStates.confirmPassword.isValid = false;
    } else if (target.id === "confirm-password") {
      if (!validateConfirmPassword(password, confirmPassword)) {
        errorLines[3].classList.remove("show");
        target.classList.add("bg-red");
        validationStates.confirmPassword.isValid = false;
      } else {
        errorLines[3].classList.add("show");
        target.classList.remove("bg-red");
        validationStates.confirmPassword.isValid = true;
      }
    }

    // policy checkbox (you wrote this correctly)
    if (target.id === "policy") {
      if (target.checked) {
        errorLines[4].classList.add("show");
        validationStates.policy.isValid = true;
      } else {
        errorLines[4].classList.remove("show");
        validationStates.policy.isValid = false;
      }
    }
  },
  true
);

// submit listener
form.addEventListener(
  "submit",
  (e) => {
    e.preventDefault();

    let f = e.currentTarget;
    let success = document.querySelector(".success");

    if (
      !validationStates.fname.isValid ||
      !validationStates.email.isValid ||
      !validationStates.password.isValid ||
      !validationStates.confirmPassword.isValid ||
      !validationStates.policy.isValid
    ) {
      errorLines[5].classList.remove("show");
      success.classList.add("show");
      return;
    } else {
      errorLines[5].classList.add("show");
      document.querySelector(".success").classList.remove("show");

      const payload = {
        fname: f.fname.value.trim(),
        lname: f.lname.value.trim() || "",
        email: f.email.value.trim(),
        password: f.password.value.trim(),
        confirmPassword: f["confirm-password"].value.trim(),
        policy: f.policy.checked,
      };

      console.log("form submitted with payload: ", payload);
    }
  },
  true
);
