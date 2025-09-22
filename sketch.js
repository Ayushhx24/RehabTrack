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

/* function initializeSketch() {
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
} */

/* function initializeSketch() {
  console.log("4. Initializing Sketch (loading PoseNet)...");
  poseNet = ml5.poseNet(video, () => {
    console.log(`5. PoseNet Model Loaded for ${currentTracker.name}!`);
    
    // Setup UI based on exercise type
    if (currentTracker.name === "Gait Analysis") {
      appState = "exercise";
      const startStopButton = createButton('Start Test');
      startStopButton.position(width / 2 - 50, height - 40);
      startStopButton.mousePressed(() => {
          currentTracker.toggleTest();
          startStopButton.html(currentTracker.state === 'walking' ? 'Stop Test & Analyze' : 'Start Test');
      });
    } else {
      // This logic runs for all other exercises
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
    console.log("6. Initialization complete. Starting draw loop.");
    loop(); // IMPORTANT: Start the draw loop now.
  });

  // This part stays the same
  poseNet.on("pose", (results) => {
    poses = results;
  });
} */
// In sketch.js

/* function initializeSketch() {
  console.log("4. Initializing Sketch (loading PoseNet)...");
  poseNet = ml5.poseNet(video, () => {
    console.log(`5. PoseNet Model Loaded for ${currentTracker.name}!`);

    // --- NEW LOGIC TO HANDLE ALL EXERCISE TYPES ---
    if (currentTracker.name === "Clinical Gait Analysis") {
      appState = "exercise"; 
      const startButton = createButton('Start Clinical Test');
      startButton.position(width / 2 - 80, height / 2);
      startButton.mousePressed(() => {
        currentTracker.startTest();
        // Special logic for the 'Go' button during the TUG test
        if (currentTracker.state === 'tug_sit') {
            startButton.html('Go!');
            startButton.mousePressed(() => currentTracker.startNextPhase());
        } else {
            startButton.hide(); // Hide button after test starts
        }
      });
    } else if (currentTracker.name === "Gait Analysis") {
      // This is the logic for your OLD gait test, in case you still use it
      appState = "exercise";
      const startStopButton = createButton('Start Test');
      startStopButton.position(width / 2 - 50, height - 40);
      startStopButton.mousePressed(() => {
        currentTracker.toggleTest();
        startStopButton.html(currentTracker.state === 'walking' ? 'Stop Test & Analyze' : 'Start Test');
      });
    } else {
      // This is your existing logic for Curls, Squats, etc.
      appState = "goal_selection";
      const goalButtons = selectAll(".goalButton");
      goalButtons.forEach((button) => {
        button.mousePressed(() => setGoal(button.attribute("data-goal")));
      });
      const endButton = select("#endButton");
      endButton.mousePressed(handleEndRestart);
    }
    // --- END NEW LOGIC ---

    updateButtonVisibility(); // It's still good practice to call this
    isReady = true;
    loop();
  });

  poseNet.on("pose", (results) => {
    poses = results;
  });
} */
// In sketch.js, replace the entire function

/* function initializeSketch() {
  console.log("4. Initializing Sketch (loading PoseNet)...");
  poseNet = ml5.poseNet(video, () => {
    console.log(`5. PoseNet Model Loaded for ${currentTracker.name}!`);

    if (currentTracker.name.includes("Gait Analysis")) {
      appState = "exercise";
      // Create the initial button
      const startButton = createButton('Start Clinical Test');
      startButton.position(width / 2 - 80, height / 2);
      startButton.mousePressed(() => {
        currentTracker.startTest();
        startButton.hide(); // Click it once, it starts the test and disappears.
      });
    } else {
      // Logic for Curls, Squats, etc. remains the same
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
} */
// In sketch.js, replace the entire function

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

/* window.handleEndRestart = function () {
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
}; */
// In sketch.js, replace the entire function

/* window.handleEndRestart = function () {
  if (appState === "exercise") {
    
    // --- THIS IS THE NEW LOGIC ---
    let dataForAI;
    let localReport;

    if (currentTracker.name.includes("Gait") || currentTracker.name.includes("Balance")) {
      // For clinical tests, generate the report first
      localReport = currentTracker.generateAnalysis();
      // Send the raw test data that was used to generate the report
      dataForAI = currentTracker.testData; 
    } else {
      // For rep-based exercises, use the existing logic
      localReport = currentTracker.generateAnalysis();
      dataForAI = currentTracker.repsData;
    }
    // --- END OF NEW LOGIC ---

    saveSessionToFirebase(); 
    
    const replitUrl = "https://16b3808e-398c-44fb-9a03-5113c40a0c1a-00-jrce623my29i.pike.replit.dev/generate-analysis"; */

window.handleEndRestart = function () {
  // --- THIS IS THE FIX ---
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
        reps_data: dataForAI, // Send the correct data package
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

/* window.saveSessionToFirebase = function () {
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
}; */
/* function saveSessionToFirebase() {
  if (!currentUser) {
    console.error("Cannot save: No user is logged in.");
    return;
  }

  let sessionData = {};
  const sessionEndTime = new Date();

  // Check if the current exercise is Gait Analysis
  if (currentTracker.name === "Gait Analysis") {
    // For Gait, calculate duration from the tracker's internal start/end times
    const durationInSeconds = (currentTracker.endTime - currentTracker.startTime) / 1000;
    
    sessionData = {
      exercise: currentTracker.name,
      goal: 'N/A',
      completed_reps: 0, // Not applicable for gait
      steps: currentTracker.steps || 0,
      // We create new Date objects here for consistency in Firestore
      startTime: new Date(sessionEndTime.getTime() - (durationInSeconds * 1000)),
      endTime: sessionEndTime,
      duration_seconds: parseFloat(durationInSeconds.toFixed(2)),
      reps_data: currentTracker.repsData || [],
    };

  } else {
    // This is the original logic for all other exercises
    if (currentTracker.count === 0 && currentTracker.name !== "Gait Analysis") return;
    
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
} */
// In sketch.js

function saveSessionToFirebase() {
  if (!currentUser) {
    console.error("Cannot save: No user is logged in.");
    return;
  }

  let sessionData = {};
  const sessionEndTime = new Date();

  // --- THIS IS THE CORRECTED CHECK ---
  // It now correctly handles ANY exercise with "Gait Analysis" in its name
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
    // This is the original logic for all other exercises (Curls, Squats)
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

// --- All other helper and drawing functions must also be attached to the window object ---
/* window.updateButtonVisibility = function () {
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
}; */
/* function updateButtonVisibility() {
    const goalSel = select("#goalSelection");
    const endBtn = select("#endButton");

    // This handles the unique UI for Gait Analysis
    if (currentTracker.name === "Gait Analysis") {
        if (goalSel) goalSel.hide(); // Hide goal buttons if they exist
        if (endBtn) endBtn.hide();   // Hide the end button if it exists
        return; // <-- This is the crucial part that stops the crash
    }

    // This is your original logic for all other exercises
    if (appState === "goal_selection") {
        goalSel.style("display", "block");
        endBtn.hide();
    } else {
        goalSel.style("display", "none");
        endBtn.html(appState === "exercise" ? "End Early & Save" : "Restart");
        endBtn.show();
    }
} */
// In sketch.js

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
    // --- END UPDATED LOGIC ---

    // This is the original logic for all other exercises (Squats, Curls, etc.)
    // It will only run if the exercise is NOT a gait analysis.
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
