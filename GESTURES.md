# Hand Gesture Operating & Calibration Manual: LOCAL JARVIS 1.0

## 1. Overview & Landmarks Model

LOCAL JARVIS leverages on-device MediaPipe Hand Landmarker to track 21 three-dimensional anatomical joints on each hand in real-time.

```
       8 (Index Tip)   12 (Middle Tip)  16 (Ring Tip)  20 (Pinky Tip)
       |                |                |              |
       7 (Index DIP)   11 (Middle DIP)  15 (Ring DIP)  19 (Pinky DIP)
       |                |                |              |
       6 (Index PIP)   10 (Middle PIP)  14 (Ring PIP)  18 (Pinky PIP)
4 (Thumb Tip) |         |                |              |
    |  \       5 (Index MCP) 9 (Mid MCP)13 (Ring MCP) 17 (Pinky MCP)
    3 (Thumb IP) \      |        |       |             /
    |             \     |        |       |            /
    2 (Thumb MCP)   \   |        |       |           /
    |                 \ |        |       |          /
    1 (Thumb CMC)       +--------+-------+---------+
    |                                    |
    +------------------------------------+
                      |
                   0 (Wrist)
```

---

## 2. Core Gesture Vocabulary

### 1. Air Drawing Pose (`DRAWING_POSE`)
* **Hand Shape**: Index finger extended vertically/forward; middle, ring, and pinky curled into the palm; thumb neutral.
* **Primary Action**: Emits drawing strokes on the 2D canvas in Air Drawing Studio.
* **Stroke Lifecycle**: The stroke begins instantly when the pose is recognized. Terminating the pose or losing hand tracking immediately finalizes the stroke to prevent unwanted line artifacts.

### 2. Pinch Selection (`PINCH`)
* **Hand Shape**: Thumb tip (`landmark 4`) and index fingertip (`landmark 8`) brought together within 50mm proximity.
* **Primary Action**: Triggers a virtual click at the active virtual cursor coordinates. In the 3D Workspace, pinches and drags 3D primitives across the camera plane.

### 3. Open Palm (`OPEN_PALM`)
* **Hand Shape**: All 5 fingers (thumb through pinky) extended and spread wide.
* **Primary Action**: In the 3D Workspace, smoothly rotates the camera or selected 3D object. In the Media Center, holding open palm pauses/resumes audio playback.

### 4. Closed Fist (`CLOSED_FIST`)
* **Hand Shape**: All 5 fingers curled tightly into the palm.
* **Primary Action**: Emergency safety stop. Halts continuous drawing or transforms, and clears active drawing selections when configured.

### 5. Victory / Peace Pose (`VICTORY`)
* **Hand Shape**: Index and middle fingers extended upward in a "V" shape; ring, pinky, and thumb curled.
* **Primary Action**: Quick HUD toggling; reveals or hides translucent interface panels for focus mode.

### 6. Thumbs Up (`THUMBS_UP`)
* **Hand Shape**: Thumb pointing upward, other 4 fingers curled.
* **Primary Action**: Toggles webcam hardware capture stream on/off.

### 7. Swipes (`SWIPE_LEFT`, `SWIPE_RIGHT`, `SWIPE_UP`, `SWIPE_DOWN`)
* **Hand Movement**: Rapid translational velocity of palm center ($>0.45\text{ normalized units/sec}$) over an 80ms to 300ms window.
* **Primary Action**:
  * `SWIPE_RIGHT`: Next track in Media Center, Redo in Drawing.
  * `SWIPE_LEFT`: Previous track in Media Center, Undo in Drawing.
  * `SWIPE_UP` / `SWIPE_DOWN`: Volume increment / decrement.

### 8. Two-Hand Framing (`TWO_HAND_FRAME`)
* **Hand Shape**: Both hands simultaneously visible in the camera viewport.
* **Primary Action**: In the 3D Workspace, dynamically scales the selected mesh in real-time based on the Euclidean distance between left and right hands.

---

## 3. Calibration & Best Practices

1. **Camera Positioning**: Position your webcam directly in front of you at chest or face level, approximately 50cm to 100cm away.
2. **Lighting**: Ensure adequate, even lighting on your hands. Avoid intense backlighting (e.g. sitting directly in front of a bright window).
3. **Calibration Wizard**: Open the **Camera & Vision** tab and click **Open Calibration Wizard**. Move your hand across the comfortable range within the dashed border to calibrate normalized screen bounds.
4. **Smoothing Adjustment**: If your hand tracking shows micro-jitter, increase the **Smoothing Factor** in Settings (default 60%). If you desire ultra-low latency, decrease it to 30%-40%.
