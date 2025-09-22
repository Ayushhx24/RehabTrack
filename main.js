/* document.addEventListener("DOMContentLoaded", () => {
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
    
    gait: {
    title: "Clinical Gait Test Protocol",
    instructions: [
      "This is a multi-part test to assess your mobility and balance.",
      "<strong>1. Calibration:</strong> You will first stand 2 meters away to calibrate the system.",
      "<strong>2. Balance:</strong> You will then be asked to stand still for 15 seconds.",
      "<strong>3. Timed Walk:</strong> Finally, you will perform a timed 'sit-to-stand-and-walk' test.",
      "Please ensure you have a clear, well-lit space of at least 3 meters to walk.",
    ],
    url: "clinical_gait_analysis.html", // <-- This now points to the new HTML file
  },
    balance: {
    title: "Advanced Balance Assessment",
    instructions: [
      "This multi-part test assesses your static and dynamic balance.",
      "<strong>1. Calibration:</strong> Stand 2 meters away to calibrate the system.",
      "<strong>2. Static Test:</strong> You will be asked to stand still with your feet together.",
      "<strong>3. Dynamic Tests:</strong> You will perform a functional reach and a single-leg stance for each leg.",
      "Please ensure you have a clear, well-lit space and are near a wall or chair for safety."
    ],
    url: "balance_assessment.html",
  },

    Scapular_Retraction: {
    title: "Scapular Retraction",
    instructions: [
      "This exercise focuses on improving shoulder stability and posture.",
      "<strong>1. Setup:</strong> Stand or sit with your back straight and shoulders relaxed.",
      "<strong>2. Movement:</strong> Pull your shoulder blades back and down, as if trying to pinch a pencil between them.",
      "<strong>3. Hold:</strong> Maintain this position for a few seconds, then release.",
      "Please ensure you have a clear, well-lit space to perform this exercise.",
      "<strong>3. Dynamic Tests:</strong> You will perform a functional reach and a single-leg stance for each leg.",
      "Please ensure you have a clear, well-lit space and are near a wall or chair for safety."
    ],
    url: "scapular_retraction.html",
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
    const userInput = document.getElementById('userInput').value; // Get the user's input

    if (data && data.url) {
        // Append the user's input to the URL as a query parameter
        window.location.href = `${data.url}?context=${encodeURIComponent(userInput)}`;
    }
});
  }
}); */

// main.js (Updated with Justification Modal)

document.addEventListener("DOMContentLoaded", () => {
  // --- Burger Menu, Firebase, and Auth Logic (remains the same) ---
  const burgerIcon = document.getElementById("burgerIcon");
  const sideNav = document.getElementById("sideNav");
  if (burgerIcon && sideNav) {
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
  window.addEventListener("click", (event) => {
    if (sideNav.style.width === "250px" && !sideNav.contains(event.target)) {
      sideNav.style.width = "0"; // Close the panel
      burgerIcon.classList.remove("active"); // Revert the icon to lines
    }
  });
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
    
  });
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
    // ... (entries for curls, squats, pushups, gait, balance are the same)
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
    gait: {
        title: "Clinical Gait Test Protocol",
        instructions: [
          "This is a multi-part test to assess your mobility and balance.",
          "<strong>1. Calibration:</strong> You will first stand 2 meters away to calibrate the system.",
          "<strong>2. Balance:</strong> You will then be asked to stand still for 15 seconds.",
          "<strong>3. Timed Walk:</strong> Finally, you will perform a timed 'sit-to-stand-and-walk' test.",
          "Please ensure you have a clear, well-lit space of at least 3 meters to walk.",
        ],
        url: "clinical_gait_analysis.html",
    },
    balance: {
        title: "Advanced Balance Assessment",
        instructions: [
          "This multi-part test assesses your static and dynamic balance.",
          "<strong>1. Calibration:</strong> Stand 2 meters away to calibrate the system.",
          "<strong>2. Static Test:</strong> You will be asked to stand still with your feet together.",
          "<strong>3. Dynamic Tests:</strong> You will perform a functional reach and a single-leg stance for each leg.",
          "Please ensure you have a clear, well-lit space and are near a wall or chair for safety."
        ],
        url: "balance_assessment.html",
    },
    Scapular_Retraction: {
      title: "Instructions for Scapular Retraction",
      instructions: [
        "<strong>Camera Position:</strong> Ensure the camera has a clear view of your upper body from the SIDE.",
        "<strong>Alignment:</strong> Stand or sit up straight, looking forward.",
        "<strong>Movement:</strong> Pull your elbows straight back, squeezing your shoulder blades together. <span class='info-icon' id='retraction-info'>&#9432;</span>",
      ],
      url: "scapular_retraction.html",
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
        
        // --- NEW LOGIC TO ACTIVATE THE INFO ICON ---
        const infoIcon = document.getElementById('retraction-info');
        if (infoIcon) {
            infoIcon.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevents the main modal from closing
                showJustificationModal();
            });
        }
        // ------------------------------------------
      }
    });
  });

  const closeModal = () => { if (modal) modal.style.display = "none"; };
  if (closeButton) closeButton.addEventListener("click", closeModal);
  window.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
  
  if (startExerciseBtn) {
    startExerciseBtn.addEventListener("click", () => {
      const data = exerciseData[selectedExercise];
      const userInput = document.getElementById('userInput').value;
      if (data && data.url) {
        window.location.href = `${data.url}?context=${encodeURIComponent(userInput)}`;
      }
    });
  }

  // --- NEW FUNCTION TO SHOW THE JUSTIFICATION MODAL ---
  function showJustificationModal() {
    // Create modal elements
    const justificationBackdrop = document.createElement('div');
    justificationBackdrop.className = 'justification-modal-backdrop';

    const justificationModal = document.createElement('div');
    justificationModal.className = 'justification-modal-content';

    justificationModal.innerHTML = `
        <h3>How We Measure Your Form</h3>
        <p>This app tracks the angle of your upper arm to ensure you're pulling back far enough to fully squeeze your shoulder blades together. A 70-degree angle is used as a benchmark to confirm a complete and effective repetition.</p>
        <h4>Clinical Reasoning:</h4>
        <p>The standard range for pure shoulder extension (moving the arm back) is 50-60°. To achieve the 70° angle measured by the app, you must actively engage your scapular retractors, confirming that the target muscles have been activated for a therapeutically valuable movement.</p>
        <button id="close-justification-modal">Close</button>
    `;

    justificationBackdrop.appendChild(justificationModal);
    document.body.appendChild(justificationBackdrop);

    // Event listeners to close the modal
    const closeJustificationBtn = document.getElementById('close-justification-modal');
    closeJustificationBtn.addEventListener('click', () => {
        document.body.removeChild(justificationBackdrop);
    });
    justificationBackdrop.addEventListener('click', (e) => {
        if (e.target === justificationBackdrop) {
            document.body.removeChild(justificationBackdrop);
        }
    });
  }
