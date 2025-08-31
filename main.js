document.addEventListener("DOMContentLoaded", () => {
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
        "<strong>Movement:</strong> Keep your elbows stationary at your sides and perform the curl in a controlled manner.",
        "<strong>Environment:</strong> Have a clear background for accurate detection.",
      ],
      url: "arm_curls.html", 
    },
    squats: {
      title: "Instructions for Squats",
      instructions: [
        "<strong>Camera Position:</strong> Ensure your entire body from head to feet is visible.",
        "<strong>Alignment:</strong> Stand with your feet shoulder-width apart, facing the camera.",
        "<strong>Movement:</strong> Keep your chest up and back straight as you lower your hips.",
        "<strong>Environment:</strong> Ensure you have enough space and a clear background.",
      ],
      url: "squats.html", 
    },
    pushups: {
      title: "Instructions for Push-ups",
      instructions: [
        "<strong>Camera Position:</strong> Place the camera on the floor, viewing you from the side.",
        "<strong>Alignment:</strong> Ensure your entire body is visible in a plank position.",
        "<strong>Movement:</strong> Lower your body until your chest is close to the floor, then push back up.",
        "<strong>Environment:</strong> Have a clear background for accurate detection.",
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
        modalInstructions.innerHTML = data.instructions.map((item) => `<li>${item}</li>`).join("");
        modal.style.display = "flex";
      }
    });
  });

  const closeModal = () => { modal.style.display = "none"; };
  closeButton.addEventListener("click", closeModal);
  window.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });

  startExerciseBtn.addEventListener("click", () => {
    const data = exerciseData[selectedExercise];
    if (data && data.url) {
      window.location.href = data.url;
    }
  });
});