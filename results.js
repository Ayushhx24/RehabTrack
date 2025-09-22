document.addEventListener("DOMContentLoaded", () => {
  // Get elements
  const exerciseNameEl = document.getElementById("exercise-name");
  const goalRepsEl = document.getElementById("goal-reps");
  const completedRepsEl = document.getElementById("completed-reps");
  const completionRateEl = document.getElementById("completion-rate");
  const summaryEl = document.getElementById("analysis-summary");
  const recommendationEl = document.getElementById("analysis-recommendation");
  const redoBtn = document.getElementById("redo-btn");
  const mainMenuBtn = document.getElementById("main-menu-btn");

  // Retrieve data from sessionStorage
  const exerciseName = sessionStorage.getItem("exerciseName");
  const goalReps = parseInt(sessionStorage.getItem("exerciseGoal"), 10) || 0;
  const completedReps =
    parseInt(sessionStorage.getItem("completedReps"), 10) || 0;
  const analysisReport = sessionStorage.getItem("analysisReport");

  // Populate the page
  if (exerciseName) {
    exerciseNameEl.textContent = exerciseName;
  }

  goalRepsEl.textContent = `${goalReps} Reps`;
  completedRepsEl.textContent = `${completedReps} Reps`;

  // Calculate and display completion rate
  const completionRate =
    goalReps > 0 ? Math.round((completedReps / goalReps) * 100) : 0;
  completionRateEl.textContent = `${completionRate}%`;

  // Parse and display the analysis
  if (analysisReport) {
    // Attempt to split the report into summary and recommendation.
    // This assumes the AI response has a "Recommendation:" or similar keyword.
    // A simple split by a double newline is a good fallback.
    const parts = analysisReport.split(/\n\s*\n/);

    const summary = parts[0] || "No summary available.";
    const recommendation =
      parts.slice(1).join("\n\n") ||
      "No specific recommendations provided. Keep up the good work!";

    summaryEl.innerHTML = `<p>${summary}</p>`;
    recommendationEl.innerHTML = `<p>${recommendation}</p>`;
  } else {
    summaryEl.innerHTML = "<p>Could not load analysis.</p>";
    recommendationEl.innerHTML = "";
  }

  // Set up button actions
/*   redoBtn.addEventListener("click", () => {
    if (exerciseName) {
      window.location.href = `${exerciseName
        .toLowerCase()
        .replace(/ /g, "_")}.html`;
    } else {
      window.location.href = "index.html";
    }
  }); */

  // In results.js

  // Set up button actions
  redoBtn.addEventListener("click", () => {
    if (exerciseName) {
      let url = "index.html"; // Default fallback

      if (exerciseName.toLowerCase().includes("balance")) {
        url = "balance_assessment.html"; // CORRECTED: Points to the correct filename
      } else if (exerciseName.toLowerCase().includes("gait")) {
        url = "clinical_gait_analysis.html";
      } else {
        url = `${exerciseName.toLowerCase().replace(/ /g, "_")}.html`;
      }
      window.location.href = url;
    } else {
      window.location.href = "index.html";
    }
  });

  mainMenuBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
});
