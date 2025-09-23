import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- p5.js and App Variables ---
let video;
let poseNet;
let poses = [];
let currentUser = null;
let appState = "goal_selection";
let goalButtons, endButton;
let sessionStartTime;
let isReady = false;
let goButton = null;
let isSaving = false;

// 'currentTracker' is defined by the exercise-specific file (e.g., arm_curls.js)

// We assign p5.js functions to the global window object so p5 can find them
window.setup = function () {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  noLoop(); // Pause draw() loop until ready

  // Use the 'auth' object we initialized above
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      console.log("User is authenticated with UID:", currentUser.uid);
      initializeSketch();
    } else {
      console.log("No user signed in. Redirecting to login page.");
      window.location.href = "login.html";
    }
  });
};


function initializeSketch() {
  console.log("4. Initializing Sketch (loading PoseNet)...");
  poseNet = ml5.poseNet(video, () => {
    console.log(`5. PoseNet Model Loaded for ${currentTracker.name}!`);

    appState = "exercise"; // Default for our special tests

    if (currentTracker.name === "Advanced Balance Assessment") {
      const startButton = createButton('Start Balance Test');
      startButton.position(width / 2 - 80, height / 2);
      startButton.mousePressed(() => {
        currentTracker.startTest();
        startButton.hide();
      });
    } else if (currentTracker.name === "Clinical Gait Analysis") {
      const startButton = createButton('Start Clinical Test');
      startButton.position(width / 2 - 80, height / 2);
      startButton.mousePressed(() => {
        currentTracker.startTest();
        if (currentTracker.state === 'tug_sit') {
            startButton.html('Go!');
            startButton.mousePressed(() => currentTracker.startNextPhase());
        } else {
            startButton.hide();
        }
      });
    } else {
      // Logic for Curls, Squats, etc.
      appState = "goal_selection";
      const goalButtons = selectAll(".goalButton");
      goalButtons.forEach((button) => {
        button.mousePressed(() => setGoal(button.attribute("data-goal")));
      });
      const endButton = select("#endButton");
      endButton.mousePressed(handleEndRestart);
    }

    updateButtonVisibility();
    isReady = true;
    loop();
  });

  poseNet.on("pose", (results) => {
    poses = results;
  });
}

window.draw = function () {
  if (!isReady) {
    background(0);
    fill(255);
    textAlign(CENTER, CENTER);
    text("Authenticating...", width / 2, height / 2);
    return;
  }

  if (appState === "goal_selection") drawGoalScreen();
  else if (appState === "exercise") drawExerciseScreen();
  // The results screen is now on a separate page
  if (currentTracker.name === "Clinical Gait Analysis") {
      // If we are in the 'tug_sit' state AND the button doesn't exist yet
      if (currentTracker.state === 'tug_sit' && goButton === null) {
        goButton = createButton('Go!');
        goButton.position(width / 2 - 30, height / 2);
        goButton.mousePressed(() => {
          currentTracker.startNextPhase();
          goButton.remove(); // Remove the button after it's clicked
          goButton = null;   // Reset the variable
        });
      }
}
};

window.setGoal = function (goal) {
  currentTracker.setGoal(goal);
  appState = "exercise";
  sessionStartTime = new Date();
  isSaving = false;
  updateButtonVisibility();
};

window.handleEndRestart = function () {
  if (isSaving) {
    return; // If we are already in the process of saving, do nothing.
  }
  isSaving = true; // Set the lock to prevent this from running again.
  // ---------------------

  if (appState === "exercise") {
    let dataForAI;
    let localReport;

    if (currentTracker.name.includes("Gait") || currentTracker.name.includes("Balance")) {
      localReport = currentTracker.generateAnalysis();
      dataForAI = currentTracker.testData; 
    } else {
      localReport = currentTracker.generateAnalysis();
      dataForAI = currentTracker.repsData;
    }
    
    saveSessionToFirebase(); 
    
    const replitUrl = "https://16b3808e-398c-44fb-9a03-5113c40a0c1a-00-jrce623my29i.pike.replit.dev/generate-analysis";

    fill(0, 0, 0, 150);
    rect(0, 0, width, height);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("Generating Analysis...", width / 2, height / 2);

fetch(replitUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    reps_data: dataForAI, 
    exercise_name: currentTracker.name,
    goal: currentTracker.goal,
  }),
})
  .then((response) => {
    if (!response.ok) throw new Error("Server responded with an error.");
    return response.json();
  })
  .then((data) => {
    sessionStorage.setItem("analysisReport", data.analysis);
    sessionStorage.setItem("exerciseName", currentTracker.name);
    sessionStorage.setItem("exerciseGoal", currentTracker.goal || 'N/A');
    sessionStorage.setItem("completedReps", currentTracker.count || 0);
    // ----------------------
    window.location.href = "results.html";
  })
  .catch((error) => {
    console.warn("AI analysis failed, using local analysis instead. Error:", error);
    
    const analysisReport = `${localReport.summary}\n\n${localReport.recommendation}`;

    sessionStorage.setItem("analysisReport", analysisReport);
    sessionStorage.setItem("exerciseName", currentTracker.name);
    sessionStorage.setItem("exerciseGoal", currentTracker.goal || 'N/A');
    sessionStorage.setItem("completedReps", currentTracker.count || 0);
    window.location.href = "results.html";
  });
  }
};

function saveSessionToFirebase() {
  if (!currentUser) {
    console.error("Cannot save: No user is logged in.");
    return;
  }

  let sessionData = {};
  const sessionEndTime = new Date();

  if (currentTracker.name.includes("Gait Analysis")) {
    const durationInSeconds = (currentTracker.testData.tugEndTime - currentTracker.testData.tugStartTime) / 1000;
    
    sessionData = {
      exercise: currentTracker.name,
      goal: 'N/A',
      completed_reps: 0, 
      steps: currentTracker.steps || 0,
      startTime: new Date(sessionEndTime.getTime() - (durationInSeconds * 1000)),
      endTime: sessionEndTime,
      duration_seconds: parseFloat(durationInSeconds.toFixed(2)),
      reps_data: currentTracker.repsData || [],
    };

  } else {
    if (typeof sessionStartTime === 'undefined' || sessionStartTime === null) {
        console.error("Session start time not set for a non-gait exercise.");
        return; // Prevent crash
    }
    if (currentTracker.count === 0) return;
    
    const durationInSeconds = (sessionEndTime.getTime() - sessionStartTime.getTime()) / 1000;

    sessionData = {
      exercise: currentTracker.name,
      goal: currentTracker.goal,
      completed_reps: currentTracker.count,
      startTime: sessionStartTime,
      endTime: sessionEndTime,
      duration_seconds: parseFloat(durationInSeconds.toFixed(2)),
      reps_data: currentTracker.repsData,
    };
  }

  // Now, save the prepared sessionData to Firebase
  const userWorkoutsRef = collection(db, "users", currentUser.uid, "workouts");
  addDoc(userWorkoutsRef, sessionData)
    .then((docRef) => {
      console.log("%cSUCCESS: Session saved for user " + currentUser.uid, "color: green;");
    })
    .catch((error) => {
      console.error("%cFIREBASE ERROR: ", "color: red;", error);
    });
}

function updateButtonVisibility() {
    const goalSel = select("#goalSelection");
    const endBtn = select("#endButton");

    // --- UPDATED LOGIC ---
    // This now checks if the exercise NAME INCLUDES "Gait Analysis"
    if (currentTracker.name.includes("Gait Analysis")) {
        if (goalSel) goalSel.hide(); // Hide goal buttons if they exist
        if (endBtn) endBtn.hide();   // Hide the end button if it exists
        return; // Exit early to prevent crash
    }

    if (appState === "goal_selection") {
        if (goalSel) goalSel.style("display", "block");
        if (endBtn) endBtn.hide();
    } else {
        if (goalSel) goalSel.style("display", "none");
        if (endBtn) {
            endBtn.html(appState === "exercise" ? "End Early & Save" : "Restart");
            endBtn.show();
        }
    }
}

window.drawGoalScreen = function () {
  background(0);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(32);
  text(`Select a Goal for ${currentTracker.name}`, width / 2, height / 2 - 50);
};

window.drawExerciseScreen = function () {
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  if (poses.length > 0) {
    currentTracker.detect(poses[0].pose);
    currentTracker.checkForm(poses[0].pose);
  }
  if (
    currentTracker.goal > 0 &&
    currentTracker.count >= currentTracker.goal &&
    appState === "exercise"
  ) {
    handleEndRestart();
  }
  drawKeypoints();
  drawSkeleton();
  currentTracker.drawUI();
};

window.drawKeypoints = function () {
  if (!poses) return;
  for (let pose of poses) {
    for (let keypoint of pose.pose.keypoints) {
      if (keypoint.score > 0.2) {
        fill(0, 255, 0);
        noStroke();
        ellipse(width - keypoint.position.x, keypoint.position.y, 10, 10);
      }
    }
  }
};

window.drawSkeleton = function () {
  if (!poses) return;
  for (let pose of poses) {
    for (let skeleton of pose.skeleton) {
      let partA = skeleton[0];
      let partB = skeleton[1];
      stroke(0, 255, 255);
      line(
        width - partA.position.x,
        partA.position.y,
        width - partB.position.x,
        partB.position.y
      );
    }
  }
};
