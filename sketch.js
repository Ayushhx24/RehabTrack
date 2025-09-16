// // sketch.js - FINAL VERSION with MODERN FIREBASE v9+ SYNTAX

// // --- Firebase Imports ---
// // We import the functions we need from the Firebase SDKs
// import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
// import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
// import { getFirestore, collection, doc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// // --- Firebase Initialization ---
// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app);

// // --- p5.js and App Variables ---
// let video;
// let poseNet;
// let poses = [];
// let currentUser = null;
// let appState = "goal_selection";
// let goalButtons, endButton;
// let sessionStartTime;
// let analysisReport = null;
// let isLoadingAnalysis = false;
// let isReady = false;

// // 'currentTracker' is defined by the exercise-specific file (e.g., arm_curls.js)

// // We assign p5.js functions to the global window object so p5 can find them
// window.setup = function() {
//   createCanvas(640, 480);
//   video = createCapture(VIDEO);
//   video.size(width, height);
//   video.hide();

//   noLoop(); // Pause draw() loop until ready

//   // Use the 'auth' object we initialized above
//   onAuthStateChanged(auth, user => {
//     if (user) {
//       currentUser = user;
//       console.log("User is authenticated with UID:", currentUser.uid);
//       initializeSketch();
//     } else {
//       console.log("No user signed in. Redirecting to login page.");
//       window.location.href = 'login.html';
//     }
//   });
// }

// function initializeSketch() {
//   poseNet = ml5.poseNet(video, () => console.log(`PoseNet Model Loaded for ${currentTracker.name}!`));
//   poseNet.on("pose", (results) => { poses = results; });

//   goalButtons = selectAll(".goalButton");
//   goalButtons.forEach((button) =>
//     button.mousePressed(() => setGoal(button.attribute("data-goal")))
//   );
//   endButton = select("#endButton");
//   endButton.mousePressed(handleEndRestart);
//   updateButtonVisibility();

//   isReady = true;
//   loop(); // Start the draw() loop
// }

// window.draw = function() {
//   if (!isReady) {
//     background(0); fill(255); textAlign(CENTER, CENTER);
//     text("Authenticating...", width / 2, height / 2);
//     return;
//   }

//   if (appState === "goal_selection") drawGoalScreen();
//   else if (appState === "exercise") drawExerciseScreen();
//   else if (appState === "results") drawResultsScreen();
// }

// window.setGoal = function(goal) {
//     currentTracker.setGoal(goal);
//     appState = "exercise";
//     sessionStartTime = new Date();
//     updateButtonVisibility();
// }
// window.handleEndRestart = function() {
//     if (appState === "exercise") {
//     saveSessionToFirebase();
//     isLoadingAnalysis = true;
//     analysisReport = null;
//     const replitUrl = 'https://16b3808e-398c-44fb-9a03-5113c40a0c1a-00-jrce623my29i.pike.replit.dev/generate-analysis'; // PASTE YOUR REPLIT
//     fetch(replitUrl, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         reps_data: currentTracker.repsData,
//         exercise_name: currentTracker.name,
//         goal: currentTracker.goal
//       })
//     })
//     .then(response => {
//         if (!response.ok) throw new Error('Server responded with an error.');
//         return response.json();
//     })
//     .then(data => {
//       analysisReport = data.analysis;
//       isLoadingAnalysis = false;
//     })
//     .catch(error => {
//       console.warn("AI analysis failed, using local analysis instead. Error:", error);
//       const localReport = currentTracker.generateAnalysis();
//       analysisReport = `AI analysis is currently unavailable.\n\nHere is a local analysis:\n\n${localReport.summary}\n\nRecommendation:\n${localReport.recommendation}`;
//       isLoadingAnalysis = false;
//     });
//     appState = "results";
//   } else {
//     currentTracker.reset();
//     analysisReport = null;
//     appState = "goal_selection";
//   }
//   updateButtonVisibility();
// }

// window.saveSessionToFirebase = function() {
//   if (!currentUser) {
//     console.error("Cannot save: No user is logged in.");
//     return;
//   }
//   if (currentTracker.count === 0) return;

//   const sessionEndTime = new Date();
//   const durationInSeconds = (sessionEndTime.getTime() - sessionStartTime.getTime()) / 1000;
//   const sessionData = {
//     exercise: currentTracker.name, goal: currentTracker.goal, completed_reps: currentTracker.count,
//     startTime: sessionStartTime, endTime: sessionEndTime, // Note: Timestamps are client-side
//     duration_seconds: parseFloat(durationInSeconds.toFixed(2)),
//     reps_data: currentTracker.repsData,
//   };

//   // Use the modern 'addDoc' and 'collection' functions
//   const userWorkoutsRef = collection(db, "users", currentUser.uid, "workouts");
//   addDoc(userWorkoutsRef, sessionData)
//     .then((docRef) => console.log("%cSUCCESS: Session saved for user " + currentUser.uid, "color: green;"))
//     .catch((error) => console.error("%cFIREBASE ERROR: ", "color: red;", error));
// }

// // --- All other helper and drawing functions must also be attached to the window object ---
// window.updateButtonVisibility = function() {const goalSel = select("#goalSelection");
//   const endBtn = select("#endButton");
//   if (appState === "goal_selection") {
//     goalSel.style("display", "block");
//     endBtn.hide();
//   } else {
//     goalSel.style("display", "none");
//     endBtn.html(appState === "exercise" ? "End Early & Save" : "Restart");
//     endBtn.show();
//   }
// }
// window.drawGoalScreen = function() {
//   background(0); fill(255); textAlign(CENTER, CENTER); textSize(32);
//   text(`Select a Goal for ${currentTracker.name}`, width / 2, height / 2 - 50);
// }
// window.drawExerciseScreen = function() {
//   push(); translate(width, 0); scale(-1, 1); image(video, 0, 0, width, height); pop();
//   if (poses.length > 0) {
//     currentTracker.detect(poses[0].pose);
//     currentTracker.checkForm(poses[0].pose);
//   }
//   if (currentTracker.goal > 0 && currentTracker.count >= currentTracker.goal && appState === 'exercise') {
//     handleEndRestart();
//   }
//   drawKeypoints(); drawSkeleton(); currentTracker.drawUI();}
// window.drawResultsScreen = function() {
//   background(20);
//   fill(255);
//   noStroke();
//   textAlign(CENTER, TOP);
//   textSize(40);
//   text("Exercise Summary", width / 2, 20);
//   textSize(22);
//   text(`Total ${currentTracker.name}: ${currentTracker.count} / ${currentTracker.goal}`, width / 2, 80);
//   if (isLoadingAnalysis) {
//     textSize(20);
//     fill(200);
//     text("Generating AI analysis, please wait...", width / 2, height / 2);
//   } else if (analysisReport) {
//     textAlign(LEFT, TOP);
//     fill(220);
//     textSize(18);
//     text(analysisReport, 40, 140, width - 80, height - 160);
//   }
// }
// window.drawKeypoints = function() {
//   if (!poses) return;
//   for (let pose of poses) for (let keypoint of pose.pose.keypoints) if (keypoint.score > 0.2) {
//     fill(0, 255, 0); noStroke();
//     ellipse(width - keypoint.position.x, keypoint.position.y, 10, 10);
//   }
// }
// window.drawSkeleton = function() {
//   if (!poses) return;
//   for (let pose of poses) for (let skeleton of pose.skeleton) {
//     let partA = skeleton[0], partB = skeleton[1];
//     stroke(0, 255, 255);
//     line(width - partA.position.x, partA.position.y, width - partB.position.x, partB.position.y);
//   }
// }

// sketch.js - FINAL VERSION with MODERN FIREBASE v9+ SYNTAX & REDIRECT

// --- Firebase Imports ---
// We import the functions we need from the Firebase SDKs
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
  poseNet = ml5.poseNet(video, () =>
    console.log(`PoseNet Model Loaded for ${currentTracker.name}!`)
  );
  poseNet.on("pose", (results) => {
    poses = results;
  });

  goalButtons = selectAll(".goalButton");
  goalButtons.forEach((button) =>
    button.mousePressed(() => setGoal(button.attribute("data-goal")))
  );
  endButton = select("#endButton");
  endButton.mousePressed(handleEndRestart);
  updateButtonVisibility();

  isReady = true;
  loop(); // Start the draw() loop
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
};

window.setGoal = function (goal) {
  currentTracker.setGoal(goal);
  appState = "exercise";
  sessionStartTime = new Date();
  updateButtonVisibility();
};

window.handleEndRestart = function () {
  if (appState === "exercise") {
    saveSessionToFirebase();
    const replitUrl =
      "https://16b3808e-398c-44fb-9a03-5113c40a0c1a-00-jrce623my29i.pike.replit.dev/generate-analysis"; // Your Replit URL

    // Show a loading indicator on the exercise screen
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
        reps_data: currentTracker.repsData,
        exercise_name: currentTracker.name,
        goal: currentTracker.goal,
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Server responded with an error.");
        return response.json();
      })
      .then((data) => {
        // Save data to session storage for the results page to access
        sessionStorage.setItem("analysisReport", data.analysis);
        sessionStorage.setItem("exerciseName", currentTracker.name);
        // Redirect to the new results page
        window.location.href = "results.html";
      })
      .catch((error) => {
        console.warn(
          "AI analysis failed, using local analysis instead. Error:",
          error
        );
        const localReport = currentTracker.generateAnalysis();
        const analysisReport = `AI analysis is currently unavailable.\n\nHere is a local analysis:\n\n${localReport.summary}\n\nRecommendation:\n${localReport.recommendation}`;

        // Save fallback data and still redirect
        sessionStorage.setItem("analysisReport", analysisReport);
        sessionStorage.setItem("exerciseName", currentTracker.name);
        sessionStorage.setItem("exerciseGoal", currentTracker.goal);
        sessionStorage.setItem("completedReps", currentTracker.count);
        window.location.href = "results.html";
      });
  } else {
    // This part handles the "Restart" button on the end screen, but since we redirect, it's no longer used.
    // Kept here in case you revert the changes.
    currentTracker.reset();
    appState = "goal_selection";
    updateButtonVisibility();
  }
};

window.saveSessionToFirebase = function () {
  if (!currentUser) {
    console.error("Cannot save: No user is logged in.");
    return;
  }
  if (currentTracker.count === 0) return;

  const sessionEndTime = new Date();
  const durationInSeconds =
    (sessionEndTime.getTime() - sessionStartTime.getTime()) / 1000;
  const sessionData = {
    exercise: currentTracker.name,
    goal: currentTracker.goal,
    completed_reps: currentTracker.count,
    startTime: sessionStartTime,
    endTime: sessionEndTime,
    duration_seconds: parseFloat(durationInSeconds.toFixed(2)),
    reps_data: currentTracker.repsData,
  };

  // Use the modern 'addDoc' and 'collection' functions
  const userWorkoutsRef = collection(db, "users", currentUser.uid, "workouts");
  addDoc(userWorkoutsRef, sessionData)
    .then((docRef) =>
      console.log(
        "%cSUCCESS: Session saved for user " + currentUser.uid,
        "color: green;"
      )
    )
    .catch((error) =>
      console.error("%cFIREBASE ERROR: ", "color: red;", error)
    );
};

// --- All other helper and drawing functions must also be attached to the window object ---
window.updateButtonVisibility = function () {
  const goalSel = select("#goalSelection");
  const endBtn = select("#endButton");
  if (appState === "goal_selection") {
    goalSel.style("display", "block");
    endBtn.hide();
  } else {
    goalSel.style("display", "none");
    endBtn.html(appState === "exercise" ? "End Early & Save" : "Restart");
    endBtn.show();
  }
};

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
