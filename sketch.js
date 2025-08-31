// sketch.js - Universal Exercise Controller with DEBUG LOGS

let video;
let poseNet;
let poses = [];
let db;

let appState = "goal_selection";
let goalButtons, endButton;
let sessionStartTime;


function setup() {
  createCanvas(640, 480);
  db = firebase.firestore();
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();
  poseNet = ml5.poseNet(video, () => console.log(`PoseNet Model Loaded for ${currentTracker.name}!`));
  poseNet.on("pose", (results) => { poses = results; });

  goalButtons = selectAll(".goalButton");
  goalButtons.forEach((button) =>
    button.mousePressed(() => setGoal(button.attribute("data-goal")))
  );
  endButton = select("#endButton");
  endButton.mousePressed(handleEndRestart);
  updateButtonVisibility();
}

function draw() {
  if (appState === "goal_selection") drawGoalScreen();
  else if (appState === "exercise") drawExerciseScreen();
  else if (appState === "results") drawResultsScreen();
}

function setGoal(goal) {
  currentTracker.setGoal(goal);
  appState = "exercise";
  sessionStartTime = new Date();
  updateButtonVisibility();
}

function handleEndRestart() {
  if (appState === "exercise") {
    // DEBUG: Check if the button click is triggering the save
    console.log("'End Early' button clicked. Attempting to save...");
    saveSessionToFirebase();
    appState = "results";
  } else {
    currentTracker.reset();
    appState = "goal_selection";
  }
  updateButtonVisibility();
}

function saveSessionToFirebase() {
  // DEBUG: Check if the function is being entered and if the data is valid
  console.log("Inside saveSessionToFirebase function.");
  console.log("Is the database connection valid?", db);
  console.log("Data to be saved:", currentTracker);

  if (currentTracker.count === 0) {
    console.log("Save cancelled: No completed reps.");
    return;
  }
  
  const sessionEndTime = new Date();
  const durationInSeconds = (sessionEndTime.getTime() - sessionStartTime.getTime()) / 1000;
  
  const sessionData = {
    exercise: currentTracker.name,
    goal: currentTracker.goal,
    completed_reps: currentTracker.count,
    startTime: sessionStartTime,
    endTime: sessionEndTime,
    duration_seconds: parseFloat(durationInSeconds.toFixed(2)),
    reps_data: currentTracker.repsData,
  };

  db.collection("workout_sessions").add(sessionData)
    .then((docRef) => {
      console.log("%cSUCCESS: Session saved with ID: " + docRef.id, "color: green; font-weight: bold;");
      alert(`Workout Saved! You completed ${currentTracker.count} of ${currentTracker.goal} reps.`);
    })
    .catch((error) => {
        // DEBUG: Catch and display any error from Firebase
        console.error("%cFIREBASE ERROR: ", "color: red; font-weight: bold;", error);
        alert("SAVE FAILED. Check the console (F12) for error details.");
    });
}

function updateButtonVisibility() {
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
}

function drawGoalScreen() {
  background(0); fill(255); textAlign(CENTER, CENTER); textSize(32);
  text(`Select a Goal for ${currentTracker.name}`, width / 2, height / 2 - 50);
}

function drawExerciseScreen() {
  push(); translate(width, 0); scale(-1, 1); image(video, 0, 0, width, height); pop();
  if (poses.length > 0) {
    currentTracker.detect(poses[0].pose);
    currentTracker.checkForm(poses[0].pose);
  }
  if (currentTracker.goal > 0 && currentTracker.count >= currentTracker.goal && appState === 'exercise') {
    // DEBUG: Check if reaching the goal is triggering the save
    console.log("Goal reached. Attempting to save...");
    saveSessionToFirebase();
    appState = "results";
    updateButtonVisibility();
  }
  drawKeypoints(); drawSkeleton(); currentTracker.drawUI();
}

function drawResultsScreen() {
  background(20); fill(255); noStroke(); textAlign(CENTER, TOP); textSize(40);
  text("Exercise Summary", width / 2, 20);
  textSize(28);
  text(`Total ${currentTracker.name}: ${currentTracker.count} / ${currentTracker.goal}`, width / 2, 80);
  currentTracker.drawGraph();
}

function drawKeypoints() {
  if (!poses) return;
  for (let pose of poses) for (let keypoint of pose.pose.keypoints) if (keypoint.score > 0.2) {
    fill(0, 255, 0); noStroke();
    ellipse(width - keypoint.position.x, keypoint.position.y, 10, 10);
  }
}

function drawSkeleton() {
  if (!poses) return;
  for (let pose of poses) for (let skeleton of pose.skeleton) {
    let partA = skeleton[0], partB = skeleton[1];
    stroke(0, 255, 255);
    line(width - partA.position.x, partA.position.y, width - partB.position.x, partB.position.y);
  }
}