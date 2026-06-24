# MuscleBot v2.0 - Remaining Phases Roadmap

We have already completed **Phase 1 (3D Body Heatmap)** and **Phase 2 (AI-Driven Nutrition & Meal Planning)**. 

Here is the comprehensive, detailed plan for the remaining phases to elevate MuscleBot to the absolute top tier of AI fitness applications.

---

## Phase 3: Progressive Overload Intelligence
**Goal:** Automate the mathematics of muscle growth so the user never has to guess what weight to pick up next.

### Key Features
1. **AI Weight Suggestions:** When logging a workout, if the user did 135lbs for 10 reps last week, the system will suggest `140lbs for 8-10 reps` or `135lbs for 12 reps` today based on optimal progressive overload formulas.
2. **1RM (One Rep Max) Tracking:** Automatically calculate the user's estimated 1RM for big compound lifts (Bench, Squat, Deadlift) based on their working sets using the Brzycki formula. 
3. **Plateau Detection:** If a user hasn't increased their estimated 1RM or volume load on a specific exercise in 3 weeks, the AI Coach will proactively flag a "Plateau" and suggest variations (e.g., swapping Barbell Bench for Dumbbell Press) to break through.

### Implementation Details
* **Database:** Add a `1rm_history` table to track estimated maxes over time.
* **UI:** Add a "Progression Chart" to the Dashboard specifically for compound lifts. Add ghost text inside the Workout Logger input fields that shows what they did last session as a benchmark.

---

## Phase 4: Recovery & Readiness System
**Goal:** Prevent overtraining and injury by intelligently calculating when muscles are fully recovered, similar to Whoop or BodBot.

### Key Features
1. **Readiness Score (0-100%):** A daily score on the dashboard indicating how primed the user is for a workout.
2. **Muscle Fatigue Tracking:** Every logged workout adds "fatigue" to specific muscle groups. Fatigue decays over 48-72 hours.
3. **Dynamic Routine Adjustment:** If the user selects a "Leg Day" but their hamstrings are still at 80% fatigue, the AI suggests modifying the routine to focus on less fatigued muscles (e.g., swapping Romanian Deadlifts for Leg Extensions) or converting it to an active recovery day.

### Implementation Details
* **Logic:** Implement a decay algorithm in `src/lib/fitnessUtils.js`. If Chest volume was > 5000lbs, set Chest fatigue to 100%. Reduce by 33% every 24 hours.
* **UI Integration:** Overlay a red/yellow/green color code onto the **3D Body Heatmap** we built in Phase 1 to visually represent which muscles are recovered vs. fatigued.

---

## Phase 5: Enhanced Workout Experience
**Goal:** Make the actual act of logging a workout feel as fluid, satisfying, and frictionless as possible.

### Key Features
1. **Supersets & Drop Sets:** UI support for linking exercises together into supersets (e.g., Bicep Curls directly into Tricep Pushdowns with no rest).
2. **Advanced Rest Timer:** Auto-start rest timers based on the *type* of exercise (e.g., 3 mins for heavy squats, 60 seconds for bicep curls) with background notifications and haptics for mobile.
3. **RPE (Rate of Perceived Exertion) Tracking:** Allow users to log how hard a set felt (1-10 scale), feeding that data back into the Phase 3 Progressive Overload AI to adjust future weights.

### Implementation Details
* **Database:** Update the `workout_logs` JSON schema to support `isSuperset` flags and `rpe` values.
* **UI:** Overhaul the Active Session view to support complex linked sets and visual countdown arcs for rest periods.

---

## Phase 6: Social, Gamification & Wearables
**Goal:** Drive long-term retention through community, competition, and seamless hardware integrations.

### Key Features
1. **Leaderboards & Challenges:** Global or friend-based leaderboards for metrics like "Total Volume Lifted this Month" or "Longest Workout Streak."
2. **Achievement Badges:** Unlockable badges for milestones (e.g., "The 1000lb Club", "30-Day Streak", "Early Bird: 5AM Workout").
3. **HealthKit / Google Fit / Smartwatch Sync:** (Mobile App Focus) Pulling sleep data, step counts, and active calories from native OS health APIs to improve the TDEE (Nutrition) and Readiness (Recovery) algorithms.

### Implementation Details
* **Database:** `achievements` and `user_badges` tables.
* **Capacitor Plugins:** Implement `@capacitor-community/healthkit` for iOS and Google Fit integrations for Android to read sleep/steps data automatically.

---

**Next Steps:**
Please review these phases and let me know if you want to proceed with **Phase 3 (Progressive Overload)** or if another phase catches your eye!
