
import * as THREE from 'three';
import { playerModelResetFeet, applyFootRot } from '../AnimationUtils';

export class ClimbAction {
    static animate(player: any, parts: any, dt: number, damp: number) {
        const lerp = THREE.MathUtils.lerp;
        // Cubic ease for smoother transitions
        const smoothstep = (t: number) => t * t * (3 - 2 * t);
        
        // Force set for deterministic keyframes
        const setRot = (part: any, x: number, y: number, z: number) => {
            part.rotation.x = x;
            part.rotation.y = y;
            part.rotation.z = z;
        };

        const climbDuration = 1.2;
        const ledgeGrabTime = player.locomotion?.ledgeGrabTime ?? player.ledgeGrabTime ?? 0;
        const p = Math.min(Math.max(ledgeGrabTime / climbDuration, 0), 1.0);

        // --- DEFINING KEY POSES ---
        // These are the target rotations for each phase.
        
        // POSE 1: HANG (Start)
        // Arms reaching up, body straight, legs dangling.
        const hang = {
            armR: { x: -2.8, y: 0, z: 0.2 },
            armL: { x: -2.8, y: 0, z: -0.2 },
            forearm: { x: -0.1, y: 0, z: 0 },
            hips: { x: 0, y: 0, z: 0 },
            spine: { x: 0 },
            neck: { x: -0.6 }, // Looking up
            thigh: { x: 0.1, z: 0.1 }, // Slight spread
            shin: { x: 0.1 }
        };

        // POSE 2: APEX (Pull Up)
        // Body pulled high, elbows driven down/back, one knee driving up (Right Leg)
        const apex = {
            armR: { x: 1.2, y: 0, z: -0.5 },
            armL: { x: 1.2, y: 0, z: 0.5 },
            forearm: { x: -1.8, y: 0, z: 0 }, // Deep bend
            hips: { x: 0.4, y: 0, z: 0 },     // Lean forward
            spine: { x: 0.2 },
            neck: { x: 0.4 },                 // Looking at landing
            thighR: { x: -2.0, z: -0.1 },     // High Knee drive
            thighL: { x: 0.2, z: 0.1 },       // Trail leg
            shinR: { x: 2.2 },                // Deep knee bend
            shinL: { x: 0.2 }
        };

        // POSE 3: STAND (Finish)
        // Upright, ready to idle
        const stand = {
            arm: { x: 0, y: 0, z: 0.1 }, // Arms at sides
            forearm: { x: 0, y: 0, z: 0 },
            hips: { x: 0, y: 0, z: 0 },
            spine: { x: 0 },
            neck: { x: 0 },
            thigh: { x: 0, z: 0.1 },
            shin: { x: 0 }
        };

        // --- INTERPOLATION LOGIC ---
        
        // We calculate 'target' rotations based on 'p'
        const tObj = {
            armR: { ...hang.armR },
            armL: { ...hang.armL },
            forearmR: { ...hang.forearm },
            forearmL: { ...hang.forearm },
            hips: { ...hang.hips },
            spine: hang.spine.x,
            neck: hang.neck.x,
            thighR: { x: hang.thigh.x, z: -hang.thigh.z },
            thighL: { x: hang.thigh.x, z: hang.thigh.z },
            shinR: hang.shin.x,
            shinL: hang.shin.x
        };

        if (p < 0.15) {
            // === PHASE 1: HANG ===
            // Hold the hang pose.
            // No interpolation needed, already set to hang defaults.
            
            // Optional: Slight settle/sway could go here, but keeping it stable for now.

        } else if (p < 0.65) {
            // === PHASE 2: PULL ===
            // Interpolate Hang -> Apex
            const t = (p - 0.15) / 0.5; 
            const ease = smoothstep(t);

            // Arms: Pull down
            tObj.armR.x = lerp(hang.armR.x, apex.armR.x, ease);
            tObj.armL.x = lerp(hang.armL.x, apex.armL.x, ease);
            tObj.armR.z = lerp(hang.armR.z, apex.armR.z, ease);
            tObj.armL.z = lerp(hang.armL.z, apex.armL.z, ease);

            // Forearms: Bend
            tObj.forearmR.x = lerp(hang.forearm.x, apex.forearm.x, ease);
            tObj.forearmL.x = lerp(hang.forearm.x, apex.forearm.x, ease);

            // Body: Lean in
            tObj.hips.x = lerp(hang.hips.x, apex.hips.x, ease);
            tObj.spine = lerp(hang.spine.x, apex.spine.x, ease);
            tObj.neck = lerp(hang.neck.x, apex.neck.x, ease);

            // Legs: Right knee drive
            tObj.thighR.x = lerp(hang.thigh.x, apex.thighR.x, ease);
            tObj.shinR = lerp(hang.shin.x, apex.shinR.x, ease);
            
            // Left leg trails
            tObj.thighL.x = lerp(hang.thigh.x, apex.thighL.x, ease);
            tObj.shinL = lerp(hang.shin.x, apex.shinL.x, ease);

        } else {
            // === PHASE 3: MANTLE TO STAND ===
            // Interpolate Apex -> Stand
            const t = (p - 0.65) / 0.35;
            const ease = smoothstep(t);

            // Arms: Recover to sides
            tObj.armR.x = lerp(apex.armR.x, stand.arm.x, ease);
            tObj.armL.x = lerp(apex.armL.x, stand.arm.x, ease);
            tObj.armR.z = lerp(apex.armR.z, -stand.arm.z, ease); // Note sign
            tObj.armL.z = lerp(apex.armL.z, stand.arm.z, ease);

            // Forearms: Straighten
            tObj.forearmR.x = lerp(apex.forearm.x, stand.forearm.x, ease);
            tObj.forearmL.x = lerp(apex.forearm.x, stand.forearm.x, ease);

            // Body: Straighten
            tObj.hips.x = lerp(apex.hips.x, stand.hips.x, ease);
            tObj.spine = lerp(apex.spine.x, stand.spine.x, ease);
            tObj.neck = lerp(apex.neck.x, stand.neck.x, ease);

            // Legs: Plant and stand
            tObj.thighR.x = lerp(apex.thighR.x, stand.thigh.x, ease);
            tObj.shinR = lerp(apex.shinR.x, stand.shin.x, ease);
            tObj.thighL.x = lerp(apex.thighL.x, stand.thigh.x, ease);
            tObj.shinL = lerp(apex.shinL.x, stand.shin.x, ease);
            
            // Spread
            tObj.thighR.z = lerp(apex.thighR.z, -stand.thigh.z, ease);
            tObj.thighL.z = lerp(apex.thighL.z, stand.thigh.z, ease);
        }

        // --- APPLY TO RIG ---
        // We use a high blend factor to strictly follow the calculated animation path,
        // reducing 'flailing' caused by loose damping.
        const applyDamp = 0.4; // Very snappy 

        // Hips
        parts.hips.rotation.x = lerp(parts.hips.rotation.x, tObj.hips.x, applyDamp);
        parts.hips.rotation.y = lerp(parts.hips.rotation.y, tObj.hips.y, applyDamp);
        parts.hips.rotation.z = lerp(parts.hips.rotation.z, tObj.hips.z, applyDamp);
        
        // Stabilize Hips Pos (Keep local 0, let Root handle movement)
        parts.hips.position.x = lerp(parts.hips.position.x, 0, applyDamp);
        parts.hips.position.z = lerp(parts.hips.position.z, 0, applyDamp);

        // Spine
        if (parts.torsoContainer) {
            parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, tObj.spine, applyDamp);
        }
        parts.neck.rotation.x = lerp(parts.neck.rotation.x, tObj.neck, applyDamp);

        // Arms
        setRot(parts.rightArm, 
            lerp(parts.rightArm.rotation.x, tObj.armR.x, applyDamp),
            lerp(parts.rightArm.rotation.y, tObj.armR.y, applyDamp),
            lerp(parts.rightArm.rotation.z, tObj.armR.z, applyDamp)
        );
        setRot(parts.leftArm, 
            lerp(parts.leftArm.rotation.x, tObj.armL.x, applyDamp),
            lerp(parts.leftArm.rotation.y, tObj.armL.y, applyDamp),
            lerp(parts.leftArm.rotation.z, tObj.armL.z, applyDamp)
        );

        // Forearms
        setRot(parts.rightForeArm, 
            lerp(parts.rightForeArm.rotation.x, tObj.forearmR.x, applyDamp),
            lerp(parts.rightForeArm.rotation.y, tObj.forearmR.y, applyDamp),
            lerp(parts.rightForeArm.rotation.z, tObj.forearmR.z, applyDamp)
        );
        setRot(parts.leftForeArm, 
            lerp(parts.leftForeArm.rotation.x, tObj.forearmL.x, applyDamp),
            lerp(parts.leftForeArm.rotation.y, tObj.forearmL.y, applyDamp),
            lerp(parts.leftForeArm.rotation.z, tObj.forearmL.z, applyDamp)
        );

        // Legs
        setRot(parts.rightThigh, 
            lerp(parts.rightThigh.rotation.x, tObj.thighR.x, applyDamp),
            0,
            lerp(parts.rightThigh.rotation.z, tObj.thighR.z, applyDamp)
        );
        setRot(parts.leftThigh, 
            lerp(parts.leftThigh.rotation.x, tObj.thighL.x, applyDamp),
            0,
            lerp(parts.leftThigh.rotation.z, tObj.thighL.z, applyDamp)
        );

        parts.rightShin.rotation.x = lerp(parts.rightShin.rotation.x, tObj.shinR, applyDamp);
        parts.leftShin.rotation.x = lerp(parts.leftShin.rotation.x, tObj.shinL, applyDamp);

        // Reset feet
        playerModelResetFeet(parts, applyDamp);
        
        // Final foot adjustment for planting
        if (p >= 0.65) {
             const spread = 0.12;
             applyFootRot(parts.leftShin, 0, -spread);
             applyFootRot(parts.rightShin, 0, spread);
        }
    }
}
