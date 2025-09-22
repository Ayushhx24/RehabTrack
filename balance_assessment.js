/* // balance_assessment.js

const balanceAssessmentTracker = {
  name: "Advanced Balance Assessment",
  state: 'idle', // idle, calibrating, static_feet_together, reach_prep, functional_reach, single_leg_left, single_leg_right, tandem_stance, analyzing
  feedback: "Click 'Start Balance Test' to begin.",
  
  // Test parameters
  STATIC_DURATION_S: 10,
  REACH_DURATION_S: 7,
  SINGLE_LEG_DURATION_S: 20,
  TANDEM_DURATION_S: 20,

  // Collected data
  pixelsPerMeter: 0,
  history: [],
  repsData: [],
  testData: {
    staticSwayCm: 0,
    functionalReachCm: 0,
    leftLegHoldTimeS: 0,
    rightLegHoldTimeS: 0,
    tandemHoldTimeS: 0,
  },
  phaseStartTime: 0,
  isHoldingPose: false,

  // --- PROTOCOL MANAGEMENT ---
  startTest: function() {
    if (this.state === 'idle') {
      this.reset();
      this.state = 'calibrating';
      this.feedback = `Stand 2 meters from the camera and hold still for calibration.`;
      setTimeout(() => this.startNextPhase(), 5000); 
    }
  },

  startNextPhase: function() {
    if (this.state === 'calibrating' && this.pixelsPerMeter === 0) {
        this.state = 'analyzing';
        this.feedback = 'Calibration failed. Please try again.';
        setTimeout(() => this.startNextPhase(), 2000);
        return;
    }

    switch(this.state) {
      case 'calibrating':
        this.state = 'static_feet_together';
        this.feedback = `Stand still with feet together for ${this.STATIC_DURATION_S} seconds.`;
        this.phaseStartTime = millis();
        setTimeout(() => this.startNextPhase(), this.STATIC_DURATION_S * 1000);
        break;
      case 'static_feet_together':
        this.state = 'reach_prep';
        this.feedback = 'Stand sideways, raise your arm, and prepare to reach.';
        break;
      case 'functional_reach':
        this.state = 'single_leg_left';
        this.feedback = `Prepare to stand on your LEFT leg for up to ${this.SINGLE_LEG_DURATION_S} seconds.`;
        this.phaseStartTime = millis();
        this.isHoldingPose = false;
        break;
      case 'single_leg_left':
        this.state = 'single_leg_right';
        this.feedback = `Prepare to stand on your RIGHT leg for up to ${this.SINGLE_LEG_DURATION_S} seconds.`;
        this.phaseStartTime = millis();
        this.isHoldingPose = false;
        break;
      case 'single_leg_right':
         this.state = 'analyzing';
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
    this.testData = { staticSwayCm: 0, functionalReachCm: 0, leftLegHoldTimeS: 0, rightLegHoldTimeS: 0, tandemHoldTimeS: 0 };
  },

  // --- DATA CAPTURE ---
  detect: function(pose) {
    if (!pose.nose) return;
    this.history.push(pose);

    switch(this.state) {
      case 'calibrating':
        // (Same calibration logic as gait)
        if (this.history.length > 30) {
            let avgShoulderWidth = 0, validPoses = 0;
            this.history.slice(-30).forEach(p => {
                if (p.leftShoulder.confidence > 0.6 && p.rightShoulder.confidence > 0.6) {
                    avgShoulderWidth += Math.abs(p.leftShoulder.x - p.rightShoulder.x);
                    validPoses++;
                }
            });
            if (validPoses > 10) this.pixelsPerMeter = (avgShoulderWidth / validPoses) / 0.45;
        }
        break;

      case 'static_feet_together':
        if (this.history.length > 1) {
            const sway = Math.hypot(pose.nose.x - this.history[this.history.length - 2].nose.x, pose.nose.y - this.history[this.history.length - 2].nose.y);
            this.testData.staticSwayCm += sway / this.pixelsPerMeter * 100;
        }
        break;

      case 'reach_prep':
        // Wait for user to raise their arm before starting the reach test
        if (pose.rightWrist.y < pose.rightShoulder.y && pose.rightWrist.confidence > 0.5) {
            this.state = 'functional_reach';
            this.feedback = `Reach forward as far as you can for ${this.REACH_DURATION_S} seconds!`;
            this.phaseStartTime = millis();
            setTimeout(() => this.startNextPhase(), this.REACH_DURATION_S * 1000);
        }
        break;
      
      case 'functional_reach':
        const reach = Math.abs(pose.rightWrist.x - pose.rightShoulder.x);
        if (reach > this.testData.functionalReachCm * this.pixelsPerMeter / 100) {
            this.testData.functionalReachCm = reach / this.pixelsPerMeter * 100;
        }
        break;

      case 'single_leg_left':
      case 'single_leg_right':
        // Check if one foot is lifted off the ground
        const isLifted = Math.abs(pose.leftAnkle.y - pose.rightAnkle.y) > 30; // 30 pixels difference in height
        if (isLifted && !this.isHoldingPose) {
            this.isHoldingPose = true;
            this.phaseStartTime = millis(); // Start timer when pose is achieved
        }
        if (isLifted && this.isHoldingPose) {
            const holdTime = (millis() - this.phaseStartTime) / 1000;
            if (this.state === 'single_leg_left') this.testData.leftLegHoldTimeS = holdTime;
            if (this.state === 'single_leg_right') this.testData.rightLegHoldTimeS = holdTime;
            if (holdTime >= this.SINGLE_LEG_DURATION_S) this.startNextPhase();
        }
        if (!isLifted && this.isHoldingPose) { // If they put their foot down
            this.startNextPhase();
        }
        break;
    }
  },

  // --- ANALYSIS ---
  generateAnalysis: function() {
    if (this.pixelsPerMeter === 0) {
        return { summary: "Calibration failed.", recommendation: "A clear view of your shoulders from 2 meters away is needed." };
    }

    const { staticSwayCm, functionalReachCm, leftLegHoldTimeS, rightLegHoldTimeS } = this.testData;
    let summary = `Static Sway: ${staticSwayCm.toFixed(1)}cm | Functional Reach: ${functionalReachCm.toFixed(1)}cm | Left Leg Stance: ${leftLegHoldTimeS.toFixed(1)}s | Right Leg Stance: ${rightLegHoldTimeS.toFixed(1)}s.`;
    let recommendation = [];

    if (functionalReachCm < 25 && functionalReachCm > 0) {
        recommendation.push("Your functional reach score is limited, which may indicate a higher fall risk. Core strengthening and dynamic balance exercises are recommended.");
    }
    
    if (Math.abs(leftLegHoldTimeS - rightLegHoldTimeS) > 5) {
        recommendation.push("A significant asymmetry was detected between your left and right leg stance times. Focus on single-leg exercises for your weaker side.");
    }

    if (leftLegHoldTimeS < 10 || rightLegHoldTimeS < 10) {
        recommendation.push("Your single-leg stance time is below the typical threshold for healthy adults. Improving this is key for fall prevention.");
    }

    if (recommendation.length === 0) {
      recommendation.push("You demonstrated good balance across all tests. Continue with your current activity level to maintain this excellent stability!");
    }

    const analysisReport = { summary: summary, recommendation: recommendation.join('\n\n') };
    this.repsData.push(analysisReport);
    return analysisReport;
  },
  
  // --- UI DRAWING ---
  drawUI: function() {
      fill(255); stroke(0); strokeWeight(4); textAlign(LEFT, TOP); textSize(24);
      text(`Advanced Balance Assessment`, 10, 20);
      text(`Status: ${this.state}`, 10, 50);

      fill(255, 255, 0);
      textAlign(CENTER, CENTER);
      text(this.feedback, width / 2, height - 50);
      
      // Timer for timed holds
      if (this.state.includes('single_leg') && this.isHoldingPose) {
          const holdTime = (millis() - this.phaseStartTime) / 1000;
          textSize(48);
          text(holdTime.toFixed(1) + "s", width / 2, height / 2);
      }
  },
  checkForm: function() {},
};

var currentTracker = balanceAssessmentTracker; */

// balance_assessment.js (Corrected with robust arm detection and debug info)

const balanceAssessmentTracker = {
  name: "Advanced Balance Assessment",
  state: 'idle', 
  feedback: "Click 'Start Balance Test' to begin.",
  
  // Test parameters
  STATIC_DURATION_S: 10,
  REACH_DURATION_S: 7,
  SINGLE_LEG_DURATION_S: 20,
  TANDEM_DURATION_S: 20,

  // Collected data
  pixelsPerMeter: 0,
  history: [],
  repsData: [],
  testData: {
    staticSwayCm: 0,
    functionalReachCm: 0,
    leftLegHoldTimeS: 0,
    rightLegHoldTimeS: 0,
    tandemHoldTimeS: 0,
  },
  phaseStartTime: 0,
  isHoldingPose: false,

  // --- PROTOCOL MANAGEMENT ---
  startTest: function() {
    if (this.state === 'idle') {
      this.reset();
      this.state = 'calibrating';
      this.feedback = `Stand 2 meters from the camera and hold still for calibration.`;
      setTimeout(() => this.startNextPhase(), 5000); 
    }
  },

  startNextPhase: function() {
    if (this.state === 'calibrating' && this.pixelsPerMeter === 0) {
        this.state = 'analyzing';
        this.feedback = 'Calibration failed. Please try again.';
        setTimeout(() => this.startNextPhase(), 2000);
        return;
    }

    switch(this.state) {
      case 'calibrating':
        this.state = 'static_feet_together';
        this.feedback = `Stand still with feet together for ${this.STATIC_DURATION_S} seconds.`;
        this.phaseStartTime = millis();
        setTimeout(() => this.startNextPhase(), this.STATIC_DURATION_S * 1000);
        break;
      case 'static_feet_together':
        this.state = 'reach_prep';
        this.feedback = 'Stand sideways, then raise your arm straight out in front of you.';
        break;
      case 'functional_reach':
        this.state = 'single_leg_left';
        this.feedback = `Prepare to stand on your LEFT leg for up to ${this.SINGLE_LEG_DURATION_S} seconds.`;
        this.phaseStartTime = millis();
        this.isHoldingPose = false;
        break;
      case 'single_leg_left':
        this.state = 'single_leg_right';
        this.feedback = `Prepare to stand on your RIGHT leg for up to ${this.SINGLE_LEG_DURATION_S} seconds.`;
        this.phaseStartTime = millis();
        this.isHoldingPose = false;
        break;
      case 'single_leg_right':
         this.state = 'analyzing';
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
    this.testData = { staticSwayCm: 0, functionalReachCm: 0, leftLegHoldTimeS: 0, rightLegHoldTimeS: 0, tandemHoldTimeS: 0 };
  },

  // --- DATA CAPTURE ---
  detect: function(pose) {
    if (!pose.nose) return;
    this.history.push(pose);

    switch(this.state) {
      case 'calibrating':
        if (this.history.length > 30) {
            let avgShoulderWidth = 0, validPoses = 0;
            this.history.slice(-30).forEach(p => {
                if (p.leftShoulder.confidence > 0.6 && p.rightShoulder.confidence > 0.6) {
                    avgShoulderWidth += Math.abs(p.leftShoulder.x - p.rightShoulder.x);
                    validPoses++;
                }
            });
            if (validPoses > 10) this.pixelsPerMeter = (avgShoulderWidth / validPoses) / 0.45;
        }
        break;

      case 'static_feet_together':
        if (this.history.length > 1) {
            const sway = Math.hypot(pose.nose.x - this.history[this.history.length - 2].nose.x, pose.nose.y - this.history[this.history.length - 2].nose.y);
            if(this.pixelsPerMeter > 0) this.testData.staticSwayCm += sway / this.pixelsPerMeter * 100;
        }
        break;
      
      // --- CORRECTED LOGIC ---
      case 'reach_prep':
        const rWrist = pose.rightWrist;
        const rShoulder = pose.rightShoulder;
        const lWrist = pose.leftWrist;
        const lShoulder = pose.leftShoulder;

        // Check if either the right OR left arm is raised
        const isRightArmUp = rWrist.confidence > 0.5 && rWrist.y < rShoulder.y;
        const isLeftArmUp = lWrist.confidence > 0.5 && lWrist.y < lShoulder.y;

        if (isRightArmUp || isLeftArmUp) {
            this.state = 'functional_reach';
            this.feedback = `Reach forward as far as you can for ${this.REACH_DURATION_S} seconds!`;
            this.phaseStartTime = millis();
            setTimeout(() => this.startNextPhase(), this.REACH_DURATION_S * 1000);
        }
        break;
      
      case 'functional_reach':
        const reach = Math.abs(pose.rightWrist.x - pose.rightShoulder.x);
        if (this.pixelsPerMeter > 0) {
            const reachCm = reach / this.pixelsPerMeter * 100;
            if (reachCm > this.testData.functionalReachCm) {
                this.testData.functionalReachCm = reachCm;
            }
        }
        break;

      case 'single_leg_left':
      case 'single_leg_right':
        const isLifted = Math.abs(pose.leftAnkle.y - pose.rightAnkle.y) > 30;
        if (isLifted && !this.isHoldingPose) {
            this.isHoldingPose = true;
            this.phaseStartTime = millis(); 
        }
        if (isLifted && this.isHoldingPose) {
            const holdTime = (millis() - this.phaseStartTime) / 1000;
            if (this.state === 'single_leg_left') this.testData.leftLegHoldTimeS = holdTime;
            if (this.state === 'single_leg_right') this.testData.rightLegHoldTimeS = holdTime;
            if (holdTime >= this.SINGLE_LEG_DURATION_S) this.startNextPhase();
        }
        if (!isLifted && this.isHoldingPose) {
            this.startNextPhase();
        }
        break;
    }
  },

  // --- ANALYSIS ---
  generateAnalysis: function() {
    // ... (Analysis logic is the same)
    if (this.pixelsPerMeter === 0) {
        return { summary: "Calibration failed.", recommendation: "A clear view of your shoulders from 2 meters away is needed." };
    }

    const { staticSwayCm, functionalReachCm, leftLegHoldTimeS, rightLegHoldTimeS } = this.testData;
    let summary = `Static Sway: ${staticSwayCm.toFixed(1)}cm | Functional Reach: ${functionalReachCm.toFixed(1)}cm | Left Leg Stance: ${leftLegHoldTimeS.toFixed(1)}s | Right Leg Stance: ${rightLegHoldTimeS.toFixed(1)}s.`;
    let recommendation = [];

    if (functionalReachCm < 25 && functionalReachCm > 0) {
        recommendation.push("Your functional reach score is limited, which may indicate a higher fall risk. Core strengthening and dynamic balance exercises are recommended.");
    }
    
    if (Math.abs(leftLegHoldTimeS - rightLegHoldTimeS) > 5) {
        recommendation.push("A significant asymmetry was detected between your left and right leg stance times. Focus on single-leg exercises for your weaker side.");
    }

    if ((leftLegHoldTimeS > 0 && leftLegHoldTimeS < 10) || (rightLegHoldTimeS > 0 && rightLegHoldTimeS < 10)) {
        recommendation.push("Your single-leg stance time is below the typical threshold for healthy adults. Improving this is key for fall prevention.");
    }

    if (recommendation.length === 0) {
      recommendation.push("You demonstrated good balance across all tests. Continue with your current activity level to maintain this excellent stability!");
    }

    const analysisReport = { summary: summary, recommendation: recommendation.join('\n\n') };
    this.repsData.push(analysisReport);
    return analysisReport;
  },
  
  // --- UI DRAWING ---
  drawUI: function() {
      fill(255); stroke(0); strokeWeight(4); textAlign(LEFT, TOP); textSize(24);
      text(`Advanced Balance Assessment`, 10, 20);
      text(`Status: ${this.state}`, 10, 50);

      fill(255, 255, 0);
      textAlign(CENTER, CENTER);
      text(this.feedback, width / 2, height - 50);
      
      if (this.state.includes('single_leg') && this.isHoldingPose) {
          const holdTime = (millis() - this.phaseStartTime) / 1000;
          textSize(48);
          text(holdTime.toFixed(1) + "s", width / 2, height / 2);
      }

      // --- NEW DEBUG INFO ---
      if (this.state === 'reach_prep') {
          const lastPose = this.history[this.history.length - 1];
          if (lastPose) {
              fill(255, 0, 0);
              textAlign(LEFT, TOP);
              text(`Right Wrist Y: ${lastPose.rightWrist.y.toFixed(0)} | Shoulder Y: ${lastPose.rightShoulder.y.toFixed(0)}`, 10, 80);
              text(`Left Wrist Y: ${lastPose.leftWrist.y.toFixed(0)} | Shoulder Y: ${lastPose.leftShoulder.y.toFixed(0)}`, 10, 110);
          }
      }
  },
  checkForm: function() {},
};

var currentTracker = balanceAssessmentTracker;