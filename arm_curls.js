// arm_curls.js

const armCurlsTracker = {
  name: "Arm Curls", userContext: "",
  goal: 0, count: 0, state: "down", history: [], currentAngle: 0,
  feedback: "", lastStateTime: 0, debounce: 500, repsData: [],
  minAngleForRep: 180, maxAngleForRep: 0,

  setGoal: function (g) { this.goal = parseInt(g); this.reset(); },
  
  reset: function () {
    this.count = 0; this.history = []; this.repsData = [];
    this.feedback = "Start curling!"; this.state = "down";
    this.currentAngle = 0; this.lastStateTime = 0;
  },

  generateAnalysis: function () {
    if (this.repsData.length < 3) {
      return {
        summary: "Not enough reps were completed for a detailed analysis.",
        recommendation: "Try to complete at least 3 reps to get an analysis."
      };
    }

    // --- 1. Calculate Averages and Find Outliers ---
    let totalTopAngle = 0, totalBottomAngle = 0, totalTempo = 0;
    let worstTopRep = { top_angle: 0, rep_number: 0 }; // Rep with largest top_angle
    let worstBottomRep = { bottom_angle: 180, rep_number: 0 }; // Rep with smallest bottom_angle

    for (const rep of this.repsData) {
      totalTopAngle += rep.top_angle;
      totalBottomAngle += rep.bottom_angle;
      totalTempo += rep.rep_duration_seconds;
      if (rep.top_angle > worstTopRep.top_angle) worstTopRep = rep;
      if (rep.bottom_angle < worstBottomRep.bottom_angle) worstBottomRep = rep;
    }
    const avgTop = totalTopAngle / this.repsData.length;
    const avgBottom = totalBottomAngle / this.repsData.length;
    const avgTempo = totalTempo / this.repsData.length;

    // --- 2. Build a List of Recommendations Based on Rules ---
    let recommendations = [];

    // Priority #1: Full Extension (Bottom of rep)
    if (avgBottom < 165) {
      recommendations.push(`Your top priority is full extension. On rep #${worstBottomRep.rep_number}, your arm only straightened to ${worstBottomRep.bottom_angle}°. Focus on lowering the weight all the way down to engage the full muscle.`);
    }

    // Priority #2: Full Contraction (Top of rep)
    if (avgTop > 60) {
      recommendations.push(`Focus on a full contraction at the top. On rep #${worstTopRep.rep_number}, you only curled to ${worstTopRep.top_angle}°. Squeeze the bicep at the top of the movement.`);
    }

    // Priority #3: Tempo (Control)
    if (avgTempo < 2.0) {
      recommendations.push(`Your pace is fast (${avgTempo.toFixed(1)}s per rep). Slow down, especially on the way down (the eccentric phase), to maximize muscle engagement and prevent using momentum.`);
    }

    // --- 3. Format the Final Report ---
    const summary = `Your average range of motion was from ${avgBottom.toFixed(1)}° (extended) to ${avgTop.toFixed(1)}° (curled).`;
    let finalRecommendation = "";

    if (recommendations.length === 0) {
      finalRecommendation = "Excellent work! Your form shows a full and consistent range of motion with good control. Keep it up.";
    } else {
      finalRecommendation = recommendations.map(rec => `• ${rec}`).join('\n\n');
    }
    
    return { summary, recommendation: finalRecommendation };
  },

  detect: function (pose) {
    const { leftShoulder, leftElbow, leftWrist } = pose;

    if (leftShoulder.confidence > 0.2 && leftElbow.confidence > 0.2 && leftWrist.confidence > 0.2) {
      this.currentAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
      this.history.push(this.currentAngle);

      console.log(`Angle: ${this.currentAngle.toFixed(1)} | State: ${this.state}`);

      if (this.state === "up") {
        this.minAngleForRep = Math.min(this.minAngleForRep, this.currentAngle);
        this.maxAngleForRep = Math.max(this.maxAngleForRep, this.currentAngle);
      }
      
      const currentTime = millis();
      if (this.currentAngle < 60 && this.state === "down" && currentTime - this.lastStateTime > this.debounce) {
        this.state = "up";
        this.lastStateTime = currentTime;
        this.minAngleForRep = 180;
        this.maxAngleForRep = 0;
      }

      if (this.currentAngle > 160 && this.state === "up" && currentTime - this.lastStateTime > this.debounce) {
        this.state = "down";
        this.count++;
        
        const repDuration = (currentTime - this.lastStateTime) / 1000;
        this.lastStateTime = currentTime;

        this.repsData.push({
          rep_number: this.count,
          top_angle: parseFloat(this.minAngleForRep.toFixed(1)),
          bottom_angle: parseFloat(this.maxAngleForRep.toFixed(1)),
          rep_duration_seconds: parseFloat(repDuration.toFixed(2)),
        });
      }
    }
  },

  checkForm: function (pose) {
    if (this.state === "up" && this.currentAngle > 80) this.feedback = "Bring arm up higher!";
    else if (this.state === "down" && this.currentAngle < 140) this.feedback = "Extend arm fully!";
    else this.feedback = "Good Form!";
  },

  calculateAngle: function (A, B, C) {
    const BA = [A.x - B.x, A.y - B.y];
    const BC = [C.x - B.x, C.y - B.y];
    const dotProduct = BA[0] * BC[0] + BA[1] * BC[1];
    const magnitudeBA = Math.sqrt(BA[0] ** 2 + BA[1] ** 2);
    const magnitudeBC = Math.sqrt(BC[0] ** 2 + BC[1] ** 2);
    if (magnitudeBA === 0 || magnitudeBC === 0) return 0;
    const angleRad = Math.acos(dotProduct / (magnitudeBA * magnitudeBC));
    return (angleRad * 180) / Math.PI;
  },

  drawUI: function () {
    fill(255); stroke(0); strokeWeight(4); textAlign(LEFT, TOP); textSize(32);
    text(`Curls: ${this.count} / ${this.goal}`, 10, 30);
    text(`Angle: ${this.currentAngle.toFixed(0)}°`, 10, 70);
    textSize(28);
    fill(this.feedback.includes("Good") ? [0, 255, 0] : [255, 0, 0]);
    text(`Form: ${this.feedback}`, 10, 110);
  },

  drawGraph: function () {
    if (this.history.length > 1) {
      textAlign(LEFT, CENTER); fill(150); textSize(12);
      text("180°", 20, 150); text("90°", 20, height / 2); text("0°", 20, height - 50);
      noFill(); stroke(0, 255, 255); strokeWeight(2);
      beginShape();
      for (let i = 0; i < this.history.length; i++) {
        const x = map(i, 0, this.history.length - 1, 60, width - 20);
        const y = map(this.history[i], 0, 180, height - 50, 150);
        vertex(x, y);
      }
      endShape();
    }
  },
};
var currentTracker = armCurlsTracker;