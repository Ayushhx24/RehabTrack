document.addEventListener("DOMContentLoaded", () => {
  // --- Burger Menu Logic ---
  const burgerIcon = document.getElementById("burgerIcon");
  const sideNav = document.getElementById("sideNav");

  if (burgerIcon && sideNav) {
    // This listener handles OPENING and CLOSING the menu when the icon is clicked
    burgerIcon.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevents the window click listener from firing immediately
      burgerIcon.classList.toggle("active");
      if (sideNav.style.width === "250px") {
        sideNav.style.width = "0";
      } else {
        sideNav.style.width = "250px";
      }
    });
  }

  // --- Close SideNav on ANY Outside Click ---
  window.addEventListener("click", (event) => {
    // If the menu is open and the click is NOT inside the nav panel
    if (sideNav.style.width === "250px" && !sideNav.contains(event.target)) {
      sideNav.style.width = "0"; // Close the panel
      burgerIcon.classList.remove("active"); // Revert the icon to lines
    }
  });

  // --- Firebase services & Auth Check ---
  const auth = firebase.auth();
  const db = firebase.firestore();

  auth.onAuthStateChanged((user) => {
    const mainContent = document.querySelector("main");
    const topBar = document.querySelector(".top-bar");

    if (user) {
      mainContent.style.display = "block";
      topBar.style.display = "flex";

      db.collection("users")
        .doc(user.uid)
        .get()
        .then((doc) => {
          if (doc.exists) {
            const userData = doc.data();
            document.getElementById("username").textContent = userData.username;
          } else {
            document.getElementById("username").textContent = "User";
          }
        });
    } else {
      window.location.href = "login.html";
    }
  });

  // --- Logout Button Logic ---
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      auth.signOut();
    });
  }

  // --- Modal and Navigation Logic ---
  const cards = document.querySelectorAll(".card");
  const modal = document.getElementById("exerciseModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalInstructions = document.getElementById("modalInstructions");
  const closeButton = document.querySelector(".close-button");
  const startExerciseBtn = document.getElementById("startExerciseBtn");
  let selectedExercise = "";

  const exerciseData = {
    curls: {
      title: "Instructions for Arm Curls",
      instructions: [
        "<strong>Camera Position:</strong> Ensure your entire upper body is visible and well-lit.",
        "<strong>Alignment:</strong> Stand or sit facing the camera directly.",
        "<strong>Movement:</strong> Keep your elbows stationary at your sides.",
      ],
      url: "arm_curls.html",
    },
    squats: {
      title: "Instructions for Squats",
      instructions: [
        "<strong>Camera Position:</strong> Ensure your entire body from head to feet is visible.",
        "<strong>Alignment:</strong> Stand with your feet shoulder-width apart.",
        "<strong>Movement:</strong> Keep your chest up and back straight as you lower your hips.",
      ],
      url: "squats.html",
    },
    pushups: {
      title: "Instructions for Push-ups",
      instructions: [
        "<strong>Camera Position:</strong> Place the camera on the floor, viewing you from the side.",
        "<strong>Alignment:</strong> Ensure your entire body is visible in a plank position.",
        "<strong>Movement:</strong> Lower your body until your chest is close to the floor.",
      ],
      url: "pushups.html",
    },
  };

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      selectedExercise = card.getAttribute("data-exercise");
      const data = exerciseData[selectedExercise];
      if (data) {
        modalTitle.innerText = data.title;
        modalInstructions.innerHTML = data.instructions
          .map((item) => `<li>${item}</li>`)
          .join("");
        modal.style.display = "flex";
      }
    });
  });

  const closeModal = () => {
    if (modal) modal.style.display = "none";
  };
  if (closeButton) closeButton.addEventListener("click", closeModal);
  window.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  if (startExerciseBtn) {
    startExerciseBtn.addEventListener("click", () => {
      const data = exerciseData[selectedExercise];
      if (data && data.url) {
        window.location.href = data.url;
      }
    });
  }
});
