// sketch.js - Universal Exercise Controller with DEBUG LOGS

let video;
let poseNet;
let poses = [];
let db;

let appState = "goal_selection";
let goalButtons, endButton;
let sessionStartTime;

let analysisReport = null;
let isLoadingAnalysis = false;

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
    saveSessionToFirebase(); // Still save the raw data to Firestore

    isLoadingAnalysis = true;
    analysisReport = null;
    
    // Use fetch() to call your Replit server
    const replitUrl = 'https://16b3808e-398c-44fb-9a03-5113c40a0c1a-00-jrce623my29i.pike.replit.dev/generate-analysis';

    fetch(replitUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reps_data: currentTracker.repsData,
        exercise_name: currentTracker.name,
        goal: currentTracker.goal
      })
    })
    .then(response => {
        if (!response.ok) { // Check if the server responded with an error (like 500)
            throw new Error('Server responded with an error.');
        }
        return response.json();
    })
    .then(data => {
      // Use the AI-generated text if successful
      analysisReport = data.analysis; 
      isLoadingAnalysis = false;
    })
    .catch(error => {
      // --- THIS IS THE FALLBACK ---
      console.warn("AI analysis failed, using local rule-based analysis instead. Error:", error);
      
      const localReport = currentTracker.generateAnalysis(); // Call the local function
      analysisReport = `Here is a local analysis:\n\n${localReport.summary}\n\nRecommendation:\n${localReport.recommendation}`;

      isLoadingAnalysis = false;
    });
      
    appState = "results";
  } else {
    currentTracker.reset();
    analysisReport = null;
    appState = "goal_selection";
  }
  updateButtonVisibility();
}

function saveSessionToFirebase() {
  if (currentTracker.count === 0) return;
  const sessionEndTime = new Date();
  const durationInSeconds = (sessionEndTime.getTime() - sessionStartTime.getTime()) / 1000;
  const sessionData = {
    exercise: currentTracker.name, goal: currentTracker.goal, completed_reps: currentTracker.count,
    startTime: sessionStartTime, endTime: sessionEndTime, duration_seconds: parseFloat(durationInSeconds.toFixed(2)),
    reps_data: currentTracker.repsData,
  };
  db.collection("workout_sessions").add(sessionData)
    .then((docRef) => console.log("%cSUCCESS: Session saved with ID: " + docRef.id, "color: green;"))
    .catch((error) => console.error("%cFIREBASE ERROR: ", "color: red;", error));
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
    handleEndRestart(); // Call the main end/save function
  }
  drawKeypoints(); drawSkeleton(); currentTracker.drawUI();
}

/* function drawResultsScreen() {
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
 }*/
function drawResultsScreen() {
  background(20);
  fill(255);
  noStroke();
  textAlign(CENTER, TOP);
  textSize(40);
  text("Exercise Summary", width / 2, 20);
  
  textSize(22);
  text(`Total ${currentTracker.name}: ${currentTracker.count} / ${currentTracker.goal}`, width / 2, 80);

  if (isLoadingAnalysis) {
    textSize(20);
    fill(200);
    text("Generating AI analysis, please wait...", width / 2, height / 2);
  } else if (analysisReport) {
    textAlign(LEFT, TOP);
    fill(220);
    textSize(18);
    text(analysisReport, 40, 140, width - 80, height - 160); 
  }
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