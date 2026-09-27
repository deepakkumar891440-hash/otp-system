import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut
} from
  "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";


// =====================================
// PASTE YOUR FIREBASE CONFIG HERE
// =====================================

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};


// Firebase start
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


// Elements
const phoneSection = document.getElementById("phoneSection");
const otpSection = document.getElementById("otpSection");
const successSection = document.getElementById("successSection");

const phoneInput = document.getElementById("phone");
const otpInput = document.getElementById("otp");

const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifyBtn = document.getElementById("verifyBtn");
const backBtn = document.getElementById("backBtn");
const logoutBtn = document.getElementById("logoutBtn");

const message = document.getElementById("message");
const verifiedNumber = document.getElementById("verifiedNumber");


// =====================================
// reCAPTCHA
// =====================================

let recaptchaVerifier;

function setupRecaptcha() {

  if (recaptchaVerifier) return;

  recaptchaVerifier = new RecaptchaVerifier(
    auth,
    "recaptcha-container",
    {
      size: "normal",
      callback: () => {
        console.log("reCAPTCHA completed");
      },
      "expired-callback": () => {
        showMessage("reCAPTCHA expired. Please try again.");
      }
    }
  );

  recaptchaVerifier.render();
}

setupRecaptcha();


// =====================================
// SEND OTP
// =====================================

sendOtpBtn.addEventListener("click", async () => {

  clearMessage();

  const phone = phoneInput.value.trim();

  if (!/^[0-9]{10}$/.test(phone)) {
    showMessage("Please enter a valid 10 digit mobile number.");
    return;
  }

  const fullPhoneNumber = "+91" + phone;

  sendOtpBtn.disabled = true;
  sendOtpBtn.textContent = "Sending...";

  try {

    const confirmationResult =
      await signInWithPhoneNumber(
        auth,
        fullPhoneNumber,
        recaptchaVerifier
      );

    // Save confirmation result
    window.confirmationResult = confirmationResult;

    phoneSection.classList.add("hidden");
    otpSection.classList.remove("hidden");

    showMessage("OTP sent successfully.", true);

  } catch (error) {

    console.error(error);

    showMessage(
      "OTP send nahi hua. Number aur Firebase settings check karo."
    );

    // Reset reCAPTCHA
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
      setupRecaptcha();
    }

  } finally {

    sendOtpBtn.disabled = false;
    sendOtpBtn.textContent = "Send OTP";
  }
});


// =====================================
// VERIFY OTP
// =====================================

verifyBtn.addEventListener("click", async () => {

  clearMessage();

  const otp = otpInput.value.trim();

  if (!/^[0-9]{6}$/.test(otp)) {
    showMessage("Please enter the 6 digit OTP.");
    return;
  }

  if (!window.confirmationResult) {
    showMessage("Please request OTP first.");
    return;
  }

  verifyBtn.disabled = true;
  verifyBtn.textContent = "Verifying...";

  try {

    const result =
      await window.confirmationResult.confirm(otp);

    const user = result.user;

    console.log("Verified user:", user);

    showSuccess(user.phoneNumber);

  } catch (error) {

    console.error(error);

    showMessage("Invalid OTP. Please try again.");

  } finally {

    verifyBtn.disabled = false;
    verifyBtn.textContent = "Verify OTP";
  }
});


// =====================================
// SHOW SUCCESS
// =====================================

function showSuccess(number) {

  phoneSection.classList.add("hidden");
  otpSection.classList.add("hidden");

  successSection.classList.remove("hidden");

  verifiedNumber.textContent =
    "Verified number: " + number;

  clearMessage();
}


// =====================================
// CHANGE NUMBER
// =====================================

backBtn.addEventListener("click", () => {

  otpSection.classList.add("hidden");
  phoneSection.classList.remove("hidden");

  otpInput.value = "";
  clearMessage();

});


// =====================================
// LOGOUT
// =====================================

logoutBtn.addEventListener("click", async () => {

  await signOut(auth);

  successSection.classList.add("hidden");
  phoneSection.classList.remove("hidden");

  phoneInput.value = "";
  otpInput.value = "";

});


// =====================================
// AUTH STATE
// =====================================

onAuthStateChanged(auth, (user) => {

  if (user) {

    showSuccess(user.phoneNumber);

  }

});


// =====================================
// MESSAGES
// =====================================

function showMessage(text, success = false) {

  message.textContent = text;

  if (success) {
    message.style.color = "#16a34a";
  } else {
    message.style.color = "#dc2626";
  }
}


function clearMessage() {

  message.textContent = "";

}