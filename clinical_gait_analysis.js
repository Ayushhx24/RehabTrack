/* // clinical_gait_analysis.js

const clinicalGaitTracker = {
  name: "Clinical Gait Analysis",
  state: 'idle', // idle, calibrating, static_balance, tug_sit, tug_walk_out, tug_turn, tug_walk_back, analyzing
  feedback: "Click 'Start Clinical Test' to begin.",
  
  // Test parameters
  CALIBRATION_DISTANCE_METERS: 2,
  TUG_DISTANCE_METERS: 3,
  STATIC_BALANCE_DURATION_S: 15,

  // Collected data
  pixelsPerMeter: 0,
  history: [],
  testData: {
    staticSwayPixels: 0,
    tugStartTime: 0,
    tugEndTime: 0,
    sitToStandTime: 0,
    walkOutStartTime: 0,
    walkOutEndTime: 0,
    turnStartTime: 0,
    turnEndTime: 0,
    stepsToTurn: 0,
    stepLengths: [],
  },

  // --- PROTOCOL MANAGEMENT ---
  startTest: function() {
    if (this.state === 'idle') {
      this.reset();
      this.state = 'calibrating';
      this.feedback = `Stand ${this.CALIBRATION_DISTANCE_METERS} meters from the camera and hold still.`;
      setTimeout(() => this.startNextPhase(), 5000); // Give user time to position
    }
  },

  startNextPhase: function() {
    switch(this.state) {
      case 'calibrating':
        this.state = 'static_balance';
        this.feedback = `Stand still with feet together for ${this.STATIC_BALANCE_DURATION_S} seconds.`;
        setTimeout(() => this.startNextPhase(), this.STATIC_BALANCE_DURATION_S * 1000);
        break;
      case 'static_balance':
        this.state = 'tug_sit';
        this.feedback = `Position yourself as if sitting on a chair on the left side of the screen. Press 'Go' when ready.`;
        break;
      case 'tug_sit':
        this.state = 'tug_walk_out';
        this.testData.tugStartTime = millis();
        this.testData.walkOutStartTime = millis();
        this.feedback = `Stand up and walk ${this.TUG_DISTANCE_METERS} meters across the screen.`;
        break;
      case 'analyzing':
        this.feedback = 'Analysis complete!';
        handleEndRestart();
        break;
    }
  },

  reset: function() {
    this.state = 'idle';
    this.pixelsPerMeter = 0;
    this.history = [];
    this.repsData = [];
    this.testData = { staticSwayPixels: 0, tugStartTime: 0, tugEndTime: 0, sitToStandTime: 0, walkOutStartTime: 0, walkOutEndTime: 0, turnStartTime: 0, turnEndTime: 0, stepsToTurn: 0, stepLengths: [], };
  },

  // --- DATA CAPTURE (called every frame) ---
  detect: function(pose) {
    if (!pose.nose) return; // Basic check if a person is detected
    this.history.push(pose); // Store pose history for analysis

    switch(this.state) {
      case 'calibrating':
        // Average the shoulder width over the last few frames for stability
        if (this.history.length > 30) {
            const lastPoses = this.history.slice(-30);
            let avgShoulderWidth = 0;
            for(const p of lastPoses) {
                if(p.leftShoulder.confidence > 0.5 && p.rightShoulder.confidence > 0.5) {
                    avgShoulderWidth += Math.abs(p.leftShoulder.x - p.rightShoulder.x);
                }
            }
            avgShoulderWidth /= lastPoses.length;
            // Assuming average shoulder width is ~0.45 meters
            this.pixelsPerMeter = avgShoulderWidth / 0.45;
        }
        break;

      case 'static_balance':
        if (this.history.length > 1) {
          const prevHip = this.history[this.history.length - 2].rightHip;
          const currentHip = pose.rightHip;
          if (prevHip.confidence > 0.5 && currentHip.confidence > 0.5) {
            this.testData.staticSwayPixels += Math.hypot(currentHip.x - prevHip.x, currentHip.y - prevHip.y);
          }
        }
        break;

      case 'tug_walk_out':
         // Sit-to-stand time (hip Y position changes significantly)
        if (this.testData.sitToStandTime === 0 && pose.rightHip.y < height * 0.7) {
            this.testData.sitToStandTime = (millis() - this.testData.walkOutStartTime) / 1000;
        }
        // Check if user has walked the required distance
        const walkDistPixels = this.TUG_DISTANCE_METERS * this.pixelsPerMeter;
        if (pose.nose.x > walkDistPixels) {
            this.state = 'tug_turn';
            this.testData.walkOutEndTime = millis();
            this.testData.turnStartTime = millis();
            this.feedback = 'Turn around and walk back.';
        }
        break;

      case 'tug_turn':
        // Rudimentary turn detection: user's nose is no longer facing forward
        const noseToShoulder = Math.abs(pose.nose.x - pose.rightShoulder.x);
        if (noseToShoulder < 20) { // If nose is roughly aligned with shoulder
            this.state = 'tug_walk_back';
            this.testData.turnEndTime = millis();
            this.feedback = 'Walk back to your starting position.';
        }
        break;

      case 'tug_walk_back':
        // Check if user has returned to the start
        if (pose.nose.x < 100) { // Within 100 pixels of the left edge
            this.state = 'analyzing';
            this.testData.tugEndTime = millis();
            this.startNextPhase();
        }
        break;
    }
  },

  // --- ANALYSIS ---
  generateAnalysis: function() {
    if (this.pixelsPerMeter === 0) {
        return { summary: "Calibration failed.", recommendation: "Please ensure you are standing clearly in frame during calibration." };
    }

    // CALCULATE METRICS
    const tugTotalTime = (this.testData.tugEndTime - this.testData.tugStartTime) / 1000;
    const walkOutTime = (this.testData.walkOutEndTime - this.testData.walkOutStartTime) / 1000;
    const walkingSpeed = this.TUG_DISTANCE_METERS / walkOutTime;
    const staticSwayCm = (this.testData.staticSwayPixels / this.pixelsPerMeter) * 100;

    // BUILD REPORT
    let summary = `Timed Up & Go: ${tugTotalTime.toFixed(1)}s | Walking Speed: ${walkingSpeed.toFixed(2)} m/s | Static Sway: ${staticSwayCm.toFixed(1)} cm.`;
    let recommendation = [];

    // Clinical Recommendations
    if (tugTotalTime > 13.5) {
        recommendation.push("Your TUG score may indicate a higher risk of falls. Focus on dynamic balance exercises and lower body strengthening.");
    } else if (tugTotalTime < 10) {
        recommendation.push("Your TUG score is excellent, indicating good mobility and a low risk of falls.");
    }

    if (walkingSpeed < 1.0) {
        recommendation.push("Your walking speed is below the typical threshold for healthy aging. Regular, brisk walking and leg strengthening can help improve this metric.");
    }

    if (staticSwayCm > 20) {
        recommendation.push("Your static balance test showed significant sway. Improve this with exercises like single-leg stands and tandem walking.");
    }

    const analysisReport = { summary: summary, recommendation: recommendation.join('\n\n') };
    this.repsData.push(analysisReport);
    return analysisReport;
  },
  
  // --- UI DRAWING ---
  drawUI: function() {
      // Draw general UI
      fill(255); stroke(0); strokeWeight(4); textAlign(LEFT, TOP); textSize(24);
      text(`Clinical Gait Test`, 10, 20);
      text(`Status: ${this.state}`, 10, 50);

      // Draw instructions
      fill(255, 255, 0);
      textAlign(CENTER, CENTER);
      text(this.feedback, width / 2, height - 50);

      // Draw visual aids for the test
      if (this.state.includes('tug') && this.pixelsPerMeter > 0) {
          stroke(0, 255, 0);
          strokeWeight(4);
          const finishLineX = this.TUG_DISTANCE_METERS * this.pixelsPerMeter;
          line(finishLineX, 0, finishLineX, height);
          textAlign(CENTER, TOP);
          fill(0, 255, 0);
          noStroke();
          text("Finish Line", finishLineX, 10);
      }
  },
  checkForm: function() {},
};

var currentTracker = clinicalGaitTracker; */

// clinical_gait_analysis.js (Corrected for Mirrored Video)

/* const clinicalGaitTracker = {
  name: "Clinical Gait Analysis",
  state: 'idle', // idle, calibrating, static_balance, tug_sit, tug_walk_out, tug_turn, tug_walk_back, analyzing
  feedback: "Click 'Start Clinical Test' to begin.",
  
  // Test parameters
  CALIBRATION_DISTANCE_METERS: 2,
  TUG_DISTANCE_METERS: 3,
  STATIC_BALANCE_DURATION_S: 15,

  // Collected data
  pixelsPerMeter: 0,
  history: [],
  repsData: [],
  testData: {
    staticSwayPixels: 0,
    tugStartTime: 0,
    tugEndTime: 0,
    sitToStandTime: 0,
    walkOutStartTime: 0,
    walkOutEndTime: 0,
    turnStartTime: 0,
    turnEndTime: 0,
  },

  // --- PROTOCOL MANAGEMENT ---
  startTest: function() {
    if (this.state === 'idle') {
      this.reset();
      this.state = 'calibrating';
      this.feedback = `Stand ${this.CALIBRATION_DISTANCE_METERS} meters from the camera and hold still.`;
      setTimeout(() => this.startNextPhase(), 5000); 
    }
  },

  startNextPhase: function() {
    switch(this.state) {
      case 'calibrating':
        this.state = 'static_balance';
        this.feedback = `Stand still with feet together for ${this.STATIC_BALANCE_DURATION_S} seconds.`;
        setTimeout(() => this.startNextPhase(), this.STATIC_BALANCE_DURATION_S * 1000);
        break;
      case 'static_balance':
        this.state = 'tug_sit';
        this.feedback = `Position yourself as if sitting on a chair on the left side of the screen. Press 'Go' when ready.`;
        break;
      case 'tug_sit':
        this.state = 'tug_walk_out';
        this.testData.tugStartTime = millis();
        this.testData.walkOutStartTime = millis();
        this.feedback = `Stand up and walk towards the finish line.`;
        break;
      case 'analyzing':
        this.feedback = 'Analysis complete!';
        handleEndRestart();
        break;
    }
  },

  reset: function() {
    this.state = 'idle';
    this.pixelsPerMeter = 0;
    this.history = [];
    this.repsData = [];
    this.testData = { staticSwayPixels: 0, tugStartTime: 0, tugEndTime: 0, sitToStandTime: 0, walkOutStartTime: 0, walkOutEndTime: 0, turnStartTime: 0, turnEndTime: 0 };
  },

  // --- DATA CAPTURE (called every frame) ---
  detect: function(pose) {
    if (!pose.nose) return;
    const currentPose = { ...pose, timestamp: millis() };
    this.history.push(currentPose);

    switch(this.state) {
      case 'calibrating':
        if (this.history.length > 30) {
            const lastPoses = this.history.slice(-30);
            let avgShoulderWidth = 0;
            let validPoses = 0;
            for(const p of lastPoses) {
                if(p.leftShoulder.confidence > 0.5 && p.rightShoulder.confidence > 0.5) {
                    avgShoulderWidth += Math.abs(p.leftShoulder.x - p.rightShoulder.x);
                    validPoses++;
                }
            }
            if (validPoses > 0) {
                avgShoulderWidth /= validPoses;
                this.pixelsPerMeter = avgShoulderWidth / 0.45; // Assuming avg shoulder width is 0.45m
            }
        }
        break;

      case 'static_balance':
        if (this.history.length > 1) {
          const prevHip = this.history[this.history.length - 2].rightHip;
          const currentHip = currentPose.rightHip;
          if (prevHip.confidence > 0.5 && currentHip.confidence > 0.5) {
            this.testData.staticSwayPixels += Math.hypot(currentHip.x - prevHip.x, currentHip.y - prevHip.y);
          }
        }
        break;

      case 'tug_walk_out':
        if (this.testData.sitToStandTime === 0 && currentPose.rightHip.y < height * 0.75) {
            this.testData.sitToStandTime = (millis() - this.testData.walkOutStartTime) / 1000;
        }
        // CORRECTED: Check if user's nose has a SMALLER x-value than the finish line
        const finishLineX = width - (this.TUG_DISTANCE_METERS * this.pixelsPerMeter);
        if (currentPose.nose.x < finishLineX) {
            this.state = 'tug_turn';
            this.testData.walkOutEndTime = millis();
            this.testData.turnStartTime = millis();
            this.feedback = 'Turn around and walk back.';
        }
        break;

      case 'tug_turn':
        const noseToShoulder = Math.abs(currentPose.nose.x - currentPose.rightShoulder.x);
        if (noseToShoulder < 25) { 
            this.state = 'tug_walk_back';
            this.testData.turnEndTime = millis();
            this.feedback = 'Walk back to your starting position.';
        }
        break;

      case 'tug_walk_back':
        // CORRECTED: Check if user has returned to the start (a LARGE x-value)
        if (currentPose.nose.x > width - 150) { // Within 150px of the starting side
            this.state = 'analyzing';
            this.testData.tugEndTime = millis();
            this.startNextPhase();
        }
        break;
    }
  },

  // --- ANALYSIS ---
  generateAnalysis: function() {
    if (this.pixelsPerMeter === 0) {
        return { summary: "Calibration failed.", recommendation: "Please ensure you are standing clearly in frame during calibration." };
    }

    const tugTotalTime = (this.testData.tugEndTime - this.testData.tugStartTime) / 1000;
    const walkOutTime = (this.testData.walkOutEndTime - this.testData.walkOutStartTime) / 1000;
    const walkingSpeed = walkOutTime > 0 ? this.TUG_DISTANCE_METERS / walkOutTime : 0;
    const staticSwayCm = (this.testData.staticSwayPixels / this.pixelsPerMeter) * 100;

    let summary = `Timed Up & Go: ${tugTotalTime.toFixed(1)}s | Walking Speed: ${walkingSpeed.toFixed(2)} m/s | Static Sway: ${staticSwayCm.toFixed(1)} cm.`;
    let recommendation = [];

    if (tugTotalTime > 13.5) {
        recommendation.push("Your TUG score may indicate a higher risk of falls. Focus on dynamic balance exercises and lower body strengthening.");
    } else if (tugTotalTime > 0) {
        recommendation.push("Your TUG score is excellent, indicating good mobility and a low risk of falls.");
    }

    if (walkingSpeed > 0 && walkingSpeed < 1.0) {
        recommendation.push("Your walking speed is below the typical threshold for healthy aging. Regular, brisk walking can help improve this metric.");
    }

    if (staticSwayCm > 20) {
        recommendation.push("Your static balance test showed significant sway. Improve this with exercises like single-leg stands.");
    }

    if (recommendation.length === 0) {
      recommendation.push("Your performance shows good mobility and balance. Keep up the great work!");
    }

    const analysisReport = { summary: summary, recommendation: recommendation.join('\n\n') };
    this.repsData.push(analysisReport);
    return analysisReport;
  },
  
  // --- UI DRAWING ---
  drawUI: function() {
      fill(255); stroke(0); strokeWeight(4); textAlign(LEFT, TOP); textSize(24);
      text(`Clinical Gait Test`, 10, 20);
      text(`Status: ${this.state}`, 10, 50);

      fill(255, 255, 0);
      textAlign(CENTER, CENTER);
      text(this.feedback, width / 2, height - 50);

      if (this.state.includes('tug') && this.pixelsPerMeter > 0) {
          stroke(0, 255, 0);
          strokeWeight(4);
          // CORRECTED: Calculate finish line from the right side of the canvas
          const finishLineX = width - (this.TUG_DISTANCE_METERS * this.pixelsPerMeter);
          line(finishLineX, 0, finishLineX, height);
          textAlign(CENTER, TOP);
          fill(0, 255, 0);
          noStroke();
          text("Finish Line", finishLineX - 50, 10);
      }
  },
  checkForm: function() {},
};

var currentTracker = clinicalGaitTracker; */

// clinical_gait_analysis.js (Corrected with Robust Calibration and Debug Info)

const clinicalGaitTracker = {
  name: "Clinical Gait Analysis",
  state: 'idle', 
  feedback: "Click 'Start Clinical Test' to begin.",
  
  // Test parameters
  CALIBRATION_DISTANCE_METERS: 2,
  TUG_DISTANCE_METERS: 3,
  STATIC_BALANCE_DURATION_S: 15,

  // Collected data
  pixelsPerMeter: 0,
  history: [],
  repsData: [],
  testData: {
    staticSwayPixels: 0,
    tugStartTime: 0,
    tugEndTime: 0,
    sitToStandTime: 0,
    walkOutStartTime: 0,
    walkOutEndTime: 0,
    turnStartTime: 0,
    turnEndTime: 0,
  },

  // --- PROTOCOL MANAGEMENT ---
  startTest: function() {
    if (this.state === 'idle') {
      this.reset();
      this.state = 'calibrating';
      this.feedback = `Stand ${this.CALIBRATION_DISTANCE_METERS} meters from the camera and hold still.`;
      setTimeout(() => this.startNextPhase(), 5000); 
    }
  },

  startNextPhase: function() {
    // ROBUSTNESS: Check if calibration was successful
    if (this.state === 'calibrating' && this.pixelsPerMeter === 0) {
        this.state = 'analyzing'; // End the test early
        this.feedback = 'Calibration failed. Please try again with better lighting.';
        setTimeout(() => this.startNextPhase(), 2000);
        return;
    }

    switch(this.state) {
      case 'calibrating':
        this.state = 'static_balance';
        this.feedback = `Stand still with feet together for ${this.STATIC_BALANCE_DURATION_S} seconds.`;
        setTimeout(() => this.startNextPhase(), this.STATIC_BALANCE_DURATION_S * 1000);
        break;
      case 'static_balance':
        this.state = 'tug_sit';
        this.feedback = `Position yourself as if sitting on a chair on the left side of the screen. Press 'Go' when ready.`;
        break;
      case 'tug_sit':
        this.state = 'tug_walk_out';
        this.testData.tugStartTime = millis();
        this.testData.walkOutStartTime = millis();
        this.feedback = `Stand up and walk towards the finish line.`;
        break;
      case 'analyzing':
        this.feedback = 'Analysis complete!';
        handleEndRestart();
        break;
    }
  },

  reset: function() {
    this.state = 'idle';
    this.pixelsPerMeter = 0;
    this.history = [];
    this.repsData = [];
    this.testData = { staticSwayPixels: 0, tugStartTime: 0, tugEndTime: 0, sitToStandTime: 0, walkOutStartTime: 0, walkOutEndTime: 0, turnStartTime: 0, turnEndTime: 0 };
  },

  // --- DATA CAPTURE ---
  detect: function(pose) {
    if (!pose.nose) return;
    const currentPose = { ...pose, timestamp: millis() };
    this.history.push(currentPose);

    switch(this.state) {
      case 'calibrating':
        if (this.history.length > 30) {
            const lastPoses = this.history.slice(-30);
            let avgShoulderWidth = 0;
            let validPoses = 0;
            for(const p of lastPoses) {
                if(p.leftShoulder.confidence > 0.6 && p.rightShoulder.confidence > 0.6) { // Increased confidence
                    avgShoulderWidth += Math.abs(p.leftShoulder.x - p.rightShoulder.x);
                    validPoses++;
                }
            }
            if (validPoses > 10) { // Require at least 10 good frames
                avgShoulderWidth /= validPoses;
                this.pixelsPerMeter = avgShoulderWidth / 0.45;
            }
        }
        break;

      case 'static_balance':
        if (this.history.length > 1) {
          const prevHip = this.history[this.history.length - 2].rightHip;
          const currentHip = currentPose.rightHip;
          if (prevHip.confidence > 0.5 && currentHip.confidence > 0.5) {
            this.testData.staticSwayPixels += Math.hypot(currentHip.x - prevHip.x, currentHip.y - prevHip.y);
          }
        }
        break;

      case 'tug_walk_out':
        if (this.testData.sitToStandTime === 0 && currentPose.rightHip.y < height * 0.75) {
            this.testData.sitToStandTime = (millis() - this.testData.walkOutStartTime) / 1000;
        }
        
        const finishLineX = width - (this.TUG_DISTANCE_METERS * this.pixelsPerMeter);
        // Only check if calibration is valid
        if (this.pixelsPerMeter > 0 && currentPose.nose.x < finishLineX) {
            this.state = 'tug_turn';
            this.testData.walkOutEndTime = millis();
            this.testData.turnStartTime = millis();
            this.feedback = 'Turn around and walk back.';
        }
        break;

      case 'tug_turn':
        const noseToShoulder = Math.abs(currentPose.nose.x - currentPose.rightShoulder.x);
        if (noseToShoulder < 30) { 
            this.state = 'tug_walk_back';
            this.testData.turnEndTime = millis();
            this.feedback = 'Walk back to your starting position.';
        }
        break;

      case 'tug_walk_back':
        if (currentPose.nose.x > width - 150) {
            this.state = 'analyzing';
            this.testData.tugEndTime = millis();
            this.startNextPhase();
        }
        break;
    }
  },

  // --- ANALYSIS ---
  generateAnalysis: function() {
    if (this.pixelsPerMeter === 0) {
        return { summary: "Calibration failed.", recommendation: "A clear view of your shoulders from 2 meters away is needed. Please ensure good lighting and try again." };
    }
    // ... (rest of the analysis function is the same)
    const tugTotalTime = (this.testData.tugEndTime - this.testData.tugStartTime) / 1000;
    const walkOutTime = (this.testData.walkOutEndTime - this.testData.walkOutStartTime) / 1000;
    const walkingSpeed = walkOutTime > 0 ? this.TUG_DISTANCE_METERS / walkOutTime : 0;
    const staticSwayCm = (this.testData.staticSwayPixels / this.pixelsPerMeter) * 100;

    let summary = `Timed Up & Go: ${tugTotalTime.toFixed(1)}s | Walking Speed: ${walkingSpeed.toFixed(2)} m/s | Static Sway: ${staticSwayCm.toFixed(1)} cm.`;
    let recommendation = [];

    if (tugTotalTime > 13.5) {
        recommendation.push("Your TUG score may indicate a higher risk of falls. Focus on dynamic balance exercises and lower body strengthening.");
    } else if (tugTotalTime > 0) {
        recommendation.push("Your TUG score is excellent, indicating good mobility and a low risk of falls.");
    }

    if (walkingSpeed > 0 && walkingSpeed < 1.0) {
        recommendation.push("Your walking speed is below the typical threshold for healthy aging. Regular, brisk walking can help improve this metric.");
    }

    if (staticSwayCm > 20) {
        recommendation.push("Your static balance test showed significant sway. Improve this with exercises like single-leg stands.");
    }

    if (recommendation.length === 0) {
      recommendation.push("Your performance shows good mobility and balance. Keep up the great work!");
    }

    const analysisReport = { summary: summary, recommendation: recommendation.join('\n\n') };
    this.repsData.push(analysisReport);
    return analysisReport;
  },
  
  // --- UI DRAWING with DEBUG INFO ---
  drawUI: function() {
      // General UI
      fill(255); stroke(0); strokeWeight(4); textAlign(LEFT, TOP); textSize(24);
      text(`Clinical Gait Test`, 10, 20);
      text(`Status: ${this.state}`, 10, 50);

      // Instructions
      fill(255, 255, 0);
      textAlign(CENTER, CENTER);
      text(this.feedback, width / 2, height - 50);

      // Draw visual aids and DEBUG info
      if (this.state.includes('tug') && this.pixelsPerMeter > 0) {
          stroke(0, 255, 0);
          strokeWeight(4);
          const finishLineX = width - (this.TUG_DISTANCE_METERS * this.pixelsPerMeter);
          line(finishLineX, 0, finishLineX, height);
          
          textAlign(CENTER, TOP);
          fill(0, 255, 0);
          noStroke();
          text("Finish Line", finishLineX, 10);

          // DEBUG: Show the user's current nose position
          const lastPose = this.history[this.history.length - 1];
          if (lastPose) {
              fill(255, 0, 0);
              textAlign(LEFT, TOP);
              text(`Your X: ${lastPose.nose.x.toFixed(0)}`, 10, 80);
              text(`Finish X: ${finishLineX.toFixed(0)}`, 10, 110);
          }
      }
      
      // DEBUG: Show calibration status
      if (this.state === 'calibrating') {
        fill(255, 0, 0);
        textAlign(LEFT, TOP);
        text(`pixelsPerMeter: ${this.pixelsPerMeter.toFixed(2)}`, 10, 80);
      }
  },
  checkForm: function() {},
};

var currentTracker = clinicalGaitTracker;