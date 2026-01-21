
import * as THREE from 'three';
import { PlayerInput } from '../../../types';
import { applyFootRot, animateBreathing } from '../AnimationUtils';

export class MovementAction {
    static animate(player: any, parts: any, dt: number, damp: number, input: PlayerInput, skipRightArm: boolean = false) {
        const isRunning = input.isRunning;
        const isHolding = !!player.config.selectedItem;
        const stance = player.config.weaponStance;
        const isMaleStyle = player.config.bodyType === 'female'; 
        const locomotion = player.locomotion ?? player;
        const isCrouching = locomotion.isCrouching ?? false;
        
        const lerp = THREE.MathUtils.lerp;
        const clamp = THREE.MathUtils.clamp;
        const sin = Math.sin;
        const cos = Math.cos;
        const ease = (t: number) => t * t * (3 - 2 * t); // smoothstep
        
        // Inputs
        const forwardInput = -input.y;
        const sideInput = input.x;
        const isPureStrafe = Math.abs(sideInput) > 0.6 && Math.abs(forwardInput) < 0.3;

        // Smoothly blend into strafe speed instead of snapping
        const strafeBlendRaw = ((Math.abs(sideInput) - 0.4) / 0.4) * (1 - Math.abs(forwardInput) / 0.3);
        const strafeBlend = clamp(strafeBlendRaw, 0, 1);
        let speedMult = lerp(isRunning ? 18 : 9, 10, strafeBlend);
        
        if (isCrouching) {
            speedMult *= 0.6; // Slower animation when crouching
        }

        const strafeDamp = isPureStrafe ? damp * 2 : damp;
        const walkDt = dt || 0;
        locomotion.walkTime = (locomotion.walkTime || 0) + walkDt * speedMult;
        const t = locomotion.walkTime;

        // Step Sound Detection
        const stepCycle = (t - Math.PI * 0.5) / Math.PI;
        const currentSteps = Math.floor(stepCycle);
        if (currentSteps > (locomotion.lastStepCount ?? 0)) {
            locomotion.didStep = true;
            locomotion.lastStepCount = currentSteps;
        }

        animateBreathing(player, parts, Date.now() * 0.002, isRunning ? 2.5 : 1.5);

        const isBackward = forwardInput < -0.1;
        const isStrafingLeft = sideInput < -0.1;
        const isStrafingRight = sideInput > 0.1;

        let baseHeight = 0.89 * player.config.legScale;
        let torsoLeanOffset = 0;
        let headTiltOffset = 0;

        if (isCrouching) {
            baseHeight -= 0.35;
            torsoLeanOffset = 0.5;
            headTiltOffset = -0.4;
        }

        // --- HIPS & TORSO ---
        
        // Bounce Logic
        let bounce = 0;
        if (isPureStrafe) {
            // Double bounce for strafe (one for each foot plant)
            // t goes 0->2PI for full cycle (Lead Step + Trail Step)
            // We want a bounce peak at middle of each step (PI/2 and 3PI/2) roughly
            bounce = Math.abs(sin(t)) * 0.04;
        } else {
            const bounceAmp = isRunning ? 0.08 : (isMaleStyle ? 0.02 : 0.03); 
            bounce = cos(2 * t) * bounceAmp;
        }
        
        const runSquat = isRunning ? 0.05 : 0.0;
        parts.hips.position.y = lerp(parts.hips.position.y, baseHeight - runSquat + bounce, strafeDamp * 2);

        // Sway & Twist
        let sway = 0;
        let twist = 0;
        let roll = 0;

        if (isPureStrafe) {
            // Strafe specific body mechanics
            // Lean slightly into turn
            const leanDir = isStrafingLeft ? 1 : -1;
            twist = leanDir * 0.25; // Turn hips into movement
            roll = leanDir * 0.05;  // Bank hips
            sway = 0; // Keep hips centered, legs do the work
        } else {
            const swayAmp = isRunning ? 0.04 : (isMaleStyle ? 0.015 : 0.07);
            sway = -sin(t) * swayAmp; 
            if (isStrafingLeft) sway -= 0.03;
            if (isStrafingRight) sway += 0.03;

            const twistAmp = isRunning ? 0.12 : 0.15;
            twist = -sin(t) * twistAmp;
            if (!isPureStrafe) twist *= Math.sign(forwardInput || 1);

            const rollAmp = isRunning ? 0.05 : (isMaleStyle ? 0.01 : 0.04);
            roll = sin(t) * rollAmp;
            if (isStrafingLeft) roll -= 0.06;
            if (isStrafingRight) roll += 0.06;
        }

        parts.hips.position.x = lerp(parts.hips.position.x, sway, strafeDamp);
        parts.hips.rotation.y = lerp(parts.hips.rotation.y, twist, strafeDamp);
        parts.hips.rotation.z = lerp(parts.hips.rotation.z, roll, strafeDamp);

        // Forward Lean
        const leanBaseForward = isRunning ? 0.35 : 0.1;
        const leanBase = isBackward ? 0.1 : leanBaseForward;
        const leanBob = Math.abs(cos(t)) * 0.05;
        parts.hips.rotation.x = lerp(parts.hips.rotation.x, (isPureStrafe ? 0.05 : leanBase) + leanBob, strafeDamp);

        parts.torsoContainer.rotation.y = lerp(parts.torsoContainer.rotation.y, -twist * 0.7 + (isPureStrafe ? (isStrafingLeft ? -0.2 : 0.2) : 0), strafeDamp); 
        parts.torsoContainer.rotation.z = lerp(parts.torsoContainer.rotation.z, -parts.hips.rotation.z * 0.5, strafeDamp); 
        
        // Removed direct torso override logic here as it's merged into the lerp above

        const targetTorsoX = (isRunning && !isPureStrafe) ? 0.1 : 0.02;
        parts.torsoContainer.rotation.x = lerp(parts.torsoContainer.rotation.x, targetTorsoX + torsoLeanOffset, strafeDamp);
        
        // --- DYNAMIC SKIRT FLARING ---
        if (parts.pelvis && parts.pelvis.children.length > 0) {
            // Find the skirt mesh in pelvis children (Must be explicitly named or it might pick up the PelvisMesh skin)
            const skirt = parts.pelvis.children.find((c: any) => c.name && c.name.includes('Skirt'));
            if (skirt) {
                const legMove = Math.max(
                    Math.abs(parts.leftThigh.rotation.x),
                    Math.abs(parts.rightThigh.rotation.x),
                    Math.abs(parts.leftThigh.rotation.z),
                    Math.abs(parts.rightThigh.rotation.z)
                );
                // Flare more aggressively for the skirt
        const flare = 1.0 + (legMove * 0.45);
        if (!isNaN(flare) && isFinite(flare)) {
            skirt.scale.x = lerp(skirt.scale.x, flare, strafeDamp);
            skirt.scale.z = lerp(skirt.scale.z, flare, strafeDamp);
        }
            }
        }

        parts.neck.rotation.y = -parts.torsoContainer.rotation.y * 0.5;
        parts.head.rotation.x = lerp(parts.head.rotation.x, 0.1 - leanBob + headTiltOffset, damp);


        // --- LEGS ---

        if (isPureStrafe) {
            // === TWO-BEAT STRAFE LOGIC ===
            // Cycle 0..PI: Lead Leg Steps Out
            // Cycle PI..2PI: Trail Leg Steps In
            
            const isLeft = isStrafingLeft;
            const cyc = t % (Math.PI * 2);
            const phase1 = cyc < Math.PI; // Lead moving
            const p = (cyc % Math.PI) / Math.PI; // 0..1 progress within phase

            // Identify Limbs
            const leadThigh = isLeft ? parts.leftThigh : parts.rightThigh;
            const leadShin = isLeft ? parts.leftShin : parts.rightShin;
            const trailThigh = isLeft ? parts.rightThigh : parts.leftThigh;
            const trailShin = isLeft ? parts.rightShin : parts.leftShin;

            // Directions (Z-Rotation: Positive is Left-Out for Left Leg, Negative is Right-Out for Right Leg)
            // Normalized "Opening" value: 0 = Closed, 1 = Wide
            // We'll apply sign at the end.
            
            const baseStance = 0.12; 
            const stepWidth = 0.32; // Reduced from 0.45 to prevent unnatural over-extension

            let leadOpen = 0;
            let trailOpen = 0;
            let leadLift = 0;
            let trailLift = 0;
            let leadFoot = 0;
            let trailFoot = 0;

            if (phase1) {
                // --- PHASE 1: LEAD STEP ---
                // Lead leg lifts and reaches out.
                // Trail leg stays grounded. Since body moves away, Trail leg angle must increase (widen) to stay put.
                
                // LEAD: Active Step
                // Lift: Sine wave
                leadLift = sin(p * Math.PI) * 0.6; // Reduced lift slightly
                // Reach: Interpolate from Base to Wide
                leadOpen = baseStance + (stepWidth * sin(p * Math.PI/2)); // Ease out
                leadFoot = -leadLift * 0.3; // Toe dip

                // TRAIL: Grounded Slide
                // Linearly increase openness to counteract body movement
                trailOpen = lerp(baseStance, baseStance + stepWidth, ease(p));
                trailLift = 0;
                trailFoot = 0;

            } else {
                // --- PHASE 2: TRAIL STEP ---
                // Lead leg is now planted Wide. Body moves over it towards Lead side.
                // So Lead leg angle decreases (narrows).
                // Trail leg lifts and catches up (narrows).

                // LEAD: Grounded Slide
                // Linearly decrease openness
                leadOpen = lerp(baseStance + stepWidth, baseStance, ease(p));
                leadLift = 0;
                leadFoot = 0;

                // TRAIL: Active Catch-up
                // Lift: Lower shuffle
                trailLift = sin(p * Math.PI) * 0.4; 
                // Catch Up: Wide to Base
                trailOpen = lerp(baseStance + stepWidth, baseStance, ease(p));
                trailFoot = -trailLift * 0.5; // Drag toe
            }

            // Apply Values
            // Note: Thigh Z direction -> Left: + is Out. Right: - is Out.
            
            // Correct logic for Right Strafe (!isLeft):
            // Left Leg (Trail) needs to point Left (+Z) to drag behind body moving Right.
            // Right Leg (Lead) needs to point Right (-Z) to step out.
            
            parts.leftThigh.rotation.z = lerp(parts.leftThigh.rotation.z, isLeft ? leadOpen : trailOpen, strafeDamp);
            parts.rightThigh.rotation.z = lerp(parts.rightThigh.rotation.z, isLeft ? -trailOpen : -leadOpen, strafeDamp); 

            parts.leftThigh.rotation.x = lerp(parts.leftThigh.rotation.x, 0, strafeDamp);
            parts.rightThigh.rotation.x = lerp(parts.rightThigh.rotation.x, 0, strafeDamp);

            parts.leftShin.rotation.x = lerp(parts.leftShin.rotation.x, isLeft ? leadLift : trailLift, strafeDamp);
            parts.rightShin.rotation.x = lerp(parts.rightShin.rotation.x, isLeft ? trailLift : leadLift, strafeDamp);

            // Feet Compensation: Rotate Z opposite to Thigh to stay flat
            applyFootRot(parts.leftShin, isLeft ? leadFoot : trailFoot, isLeft ? -leadOpen : -trailOpen);
            applyFootRot(parts.rightShin, isLeft ? trailFoot : leadFoot, isLeft ? trailOpen : leadOpen);

        } else {
            // === STANDARD WALK/RUN LOGIC ===
            const calcLeg = (offset: number) => {
                const phase = t + offset;
                const s = sin(phase);
                const c = cos(phase);
                
                let thighX = 0;
                let shinX = 0;
                let footX = 0;

                if (isBackward) {
                    // Backward
                    const isSwing = c > 0;
                    thighX = s * (isRunning ? 0.9 : 0.65);
                    if (isSwing) {
                        const lift = c;
                        shinX = lift * (isRunning ? 2.2 : 1.6);
                        thighX -= lift * 0.2;
                        footX = lift * 0.4;
                    } else {
                        shinX = 0.1;
                        footX = -thighX;
                    }
                } else {
                    // Forward
                    const isSwing = c > 0;
                    thighX = -s * (isRunning ? 1.1 : 0.55);
                    if (isSwing) {
                        shinX = c * (isRunning ? 2.4 : 1.4);
                        thighX -= c * (isRunning ? 0.8 : 0.3);
                        footX = -0.3 * c;
                    } else {
                        const loading = Math.max(0, sin(phase - 0.5));
                        if (!isRunning) shinX = loading * 0.1;
                        footX = s * (s > 0 ? -0.4 : -0.8);
                    }
                }
                return { thighX, shinX, footX };
            };

            const left = calcLeg(0);
            const right = calcLeg(Math.PI);

            const walkStance = isMaleStyle ? 0.13 : 0.04;
            const baseStanceZ = isRunning ? 0.08 : walkStance;

            parts.leftThigh.rotation.x = left.thighX;
            parts.leftThigh.rotation.z = -baseStanceZ;
            parts.leftShin.rotation.x = left.shinX;
            applyFootRot(parts.leftShin, left.footX, baseStanceZ);

            parts.rightThigh.rotation.x = right.thighX;
            parts.rightThigh.rotation.z = baseStanceZ;
            parts.rightShin.rotation.x = right.shinX;
            applyFootRot(parts.rightShin, right.footX, -baseStanceZ);
        }

        // --- ARMS ---
        let armAmp = isRunning ? 1.4 : 0.6;
        if (isPureStrafe) armAmp *= 0.4; 

        // Arm Spread
        const armSpread = isMaleStyle ? 0.2 : 0.15;

        parts.leftArm.rotation.x = sin(t) * armAmp;
        parts.leftArm.rotation.z = armSpread + (isStrafingLeft ? 0.2 : 0);
        
        parts.leftForeArm.rotation.x = isRunning ? -2.0 : -0.3;
        parts.leftHand.rotation.y = lerp(parts.leftHand.rotation.y, Math.PI / 2, damp);

        if (!skipRightArm) {
            if (isHolding) {
                if (stance === 'shoulder') {
                     parts.rightArm.rotation.x = -0.5 + cos(t) * 0.1;
                     parts.rightForeArm.rotation.x = -2.0;
                     parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2, damp);
                } else {
                     parts.rightArm.rotation.x = sin(t + Math.PI) * (armAmp * 0.5);
                     parts.rightForeArm.rotation.x = -0.5;
                     parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -1.2, damp);
                     parts.rightHand.rotation.z = lerp(parts.rightHand.rotation.z, -0.4, damp);
                }
            } else {
                parts.rightHand.rotation.y = lerp(parts.rightHand.rotation.y, -Math.PI / 2, damp);
                parts.rightHand.rotation.z = lerp(parts.rightHand.rotation.z, 0, damp);
                parts.rightArm.rotation.x = sin(t + Math.PI) * armAmp;
                parts.rightArm.rotation.z = -armSpread - (isStrafingRight ? 0.2 : 0);
                
                parts.rightForeArm.rotation.x = isRunning ? -2.0 : -0.3;
            }
        }

        // --- FEMALE BUTTOCKS PHYSICS ---
        if (player.config.bodyType === 'female' && parts.buttocks && !isPureStrafe) {
            const rightCheek = parts.buttocks.children[0];
            const leftCheek = parts.buttocks.children[1];

            if (rightCheek && leftCheek) {
                const jiggleAmp = isRunning ? 0.04 : 0.015;
                const physicsDamp = damp * 12;

                // 1. Vertical Bounce (Jiggle)
                // Offset from hip bounce to create lag/secondary motion
                const bounceL = -Math.cos(2 * t - 0.5) * jiggleAmp;
                const bounceR = -Math.cos(2 * t - 0.5) * jiggleAmp; 
                
                // Sway Inertia (Side-to-side drag)
                const swayInertia = -Math.sin(t) * jiggleAmp * 2.0;
                
                // Configurable base position (must respect sliders)
                const baseY = -0.06 + player.config.buttY;
                
                // Apply Position Y
                leftCheek.position.y = lerp(leftCheek.position.y, baseY + bounceL + swayInertia, physicsDamp);
                rightCheek.position.y = lerp(rightCheek.position.y, baseY + bounceR - swayInertia, physicsDamp);

                // 2. Rotational Flap (X-Axis) - Squish/Stretch response
                // Sin(t) approximates leg extension phase
                const legExtL = Math.sin(t); 
                const legExtR = Math.sin(t + Math.PI);
                const rotJiggle = isRunning ? 0.15 : 0.05;
                
                const baseRotX = 0.2;
                
                leftCheek.rotation.x = lerp(leftCheek.rotation.x, baseRotX + legExtL * rotJiggle + bounceL * 5, physicsDamp);
                rightCheek.rotation.x = lerp(rightCheek.rotation.x, baseRotX + legExtR * rotJiggle + bounceR * 5, physicsDamp);
                
                // 3. Twist (Y-Axis) - Inertial Lag
                const baseRotY_L = 0.25; 
                const baseRotY_R = -0.25;
                
                // Twist outward slightly on impact/step
                const twistImpulse = Math.abs(Math.sin(t)) * (isRunning ? 0.2 : 0.08);
                
                leftCheek.rotation.y = lerp(leftCheek.rotation.y, baseRotY_L + twistImpulse, physicsDamp);
                rightCheek.rotation.y = lerp(rightCheek.rotation.y, baseRotY_R - twistImpulse, physicsDamp);
            }
        }
    }
}
