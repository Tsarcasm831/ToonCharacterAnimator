import * as THREE from 'three';

export class PlayerEquipment {
    static updateHeldItem(
        itemName: string | null,
        currentHeldItem: string | null,
        parts: any,
        equippedMeshes: any
    ): string | null {
        if (currentHeldItem === itemName) return currentHeldItem;

        if (equippedMeshes.heldItem) {
            parts.rightHandMount.remove(equippedMeshes.heldItem);
            equippedMeshes.heldItem = undefined;
        }

        if (!itemName) return null;

        const itemGroup = new THREE.Group();
        // Hand Mount X-axis is the Grip Axis (Tunnel).
        // Hand Mount Z-axis is Knuckle Direction.

        const woodMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.85, roughness: 0.2, flatShading: false });

        if (itemName === 'Axe') {
            const handleLength = 0.65;
            
            // Handle
            const handleGeo = new THREE.CylinderGeometry(0.016, 0.02, handleLength, 12);
            const handle = new THREE.Mesh(handleGeo, woodMat);
            handle.rotation.z = -Math.PI / 2; // Align with X-axis (Grip)
            
            // Grip Offset: Lower on handle
            handle.position.x = handleLength * 0.15; 
            handle.castShadow = true; 
            itemGroup.add(handle);

            // Handle Bands
            for (let i = 0; i < 3; i++) {
                const band = new THREE.Mesh(new THREE.TorusGeometry(0.017, 0.003, 6, 12), new THREE.MeshStandardMaterial({ color: 0x212121 }));
                band.rotation.y = Math.PI / 2;
                band.position.x = (handleLength * 0.15) - (handleLength * 0.25) + (i * 0.08);
                itemGroup.add(band);
            }

            // Blade
            const axeShape = new THREE.Shape();
            axeShape.moveTo(0, 0.045);
            axeShape.lineTo(0.12, 0.09);
            axeShape.quadraticCurveTo(0.18, 0, 0.12, -0.16); 
            axeShape.lineTo(0.03, -0.06);
            axeShape.lineTo(0, -0.045);
            axeShape.lineTo(0, 0.045);

            const extrudeSettings = { depth: 0.032, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.01, bevelSegments: 3 };
            const bladeGeo = new THREE.ExtrudeGeometry(axeShape, extrudeSettings);
            bladeGeo.translate(0, 0, -0.016);
            
            const blade = new THREE.Mesh(bladeGeo, metalMat);
            
            // Orientation: No X rotation => Vertical Plane (XY)
            
            blade.position.set(handleLength * 0.55, 0, 0); 
            blade.castShadow = true;
            itemGroup.add(blade);

            const poll = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.055), metalMat);
            poll.position.set(handleLength * 0.55, 0, 0); 
            itemGroup.add(poll);

        } else if (itemName === 'Sword') {
            const hiltLen = 0.22;
            const bladeLen = 0.85;
            
            const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, hiltLen, 12), woodMat);
            hilt.rotation.z = -Math.PI / 2; 
            hilt.position.x = 0; 
            hilt.castShadow = true; 
            itemGroup.add(hilt);
            
            const guard = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.2, 0.038), new THREE.MeshStandardMaterial({ color: 0xbf9b30, metalness: 0.6, roughness: 0.3 }));
            guard.position.x = hiltLen / 2;
            // Guard Vertical (Y)
            itemGroup.add(guard);
            
            const bladeGeo = new THREE.CylinderGeometry(0.012, 0.045, bladeLen, 4);
            const blade = new THREE.Mesh(bladeGeo, metalMat);
            blade.rotation.z = -Math.PI / 2; 
            
            // Vertical flat blade (Thin in Z)
            blade.scale.set(1, 1, 0.12); 
            
            blade.position.x = (hiltLen / 2) + (bladeLen / 2);
            blade.castShadow = true; 
            itemGroup.add(blade);

        } else if (itemName === 'Pickaxe') {
            const handleLength = 0.65;
            
            const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, handleLength, 8), woodMat);
            handle.rotation.z = -Math.PI / 2; 
            handle.position.x = handleLength * 0.15;
            handle.castShadow = true; 
            itemGroup.add(handle);

            const pickHead = new THREE.Group();
            pickHead.position.x = handleLength * 0.55; 
            // No rotation -> Up is Y (Vertical).
            
            const block = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), metalMat);
            pickHead.add(block);
            
            const armGeo = new THREE.CylinderGeometry(0.014, 0.028, 0.3, 8);
            const botArm = new THREE.Mesh(armGeo, metalMat);
            botArm.position.y = -0.15; botArm.rotation.x = Math.PI; botArm.castShadow = true; pickHead.add(botArm);
            
            const topArm = new THREE.Mesh(armGeo, metalMat);
            topArm.position.y = 0.15; topArm.castShadow = true; pickHead.add(topArm);
            
            const tipGeo = new THREE.ConeGeometry(0.014, 0.08, 8);
            const tip1 = new THREE.Mesh(tipGeo, metalMat);
            tip1.position.y = -0.3; tip1.rotation.x = Math.PI; pickHead.add(tip1);
            
            const tip2 = new THREE.Mesh(tipGeo, metalMat);
            tip2.position.y = 0.3; pickHead.add(tip2);
            
            itemGroup.add(pickHead);

        } else if (itemName === 'Knife') {
             const handleLen = 0.14;
             
             const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, handleLen, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
             handle.rotation.z = -Math.PI / 2; 
             handle.position.x = 0; 
             handle.castShadow = true; 
             itemGroup.add(handle);
             
             const guard = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.08, 0.03), metalMat);
             guard.position.x = handleLen/2; 
             // Guard Vertical
             itemGroup.add(guard);
             
             const bladeLen = 0.25;
             const bladeGeo = new THREE.CylinderGeometry(0.005, 0.04, bladeLen, 3);
             const blade = new THREE.Mesh(bladeGeo, metalMat);
             blade.rotation.z = -Math.PI / 2; 
             
             // Vertical blade edge
             blade.scale.set(1, 1, 0.18); 
             
             blade.position.x = handleLen/2 + bladeLen/2;
             blade.castShadow = true; 
             itemGroup.add(blade);
        }

        parts.rightHandMount.add(itemGroup);
        equippedMeshes.heldItem = itemGroup;
        return itemName;
    }

    static updateArmor(equipment: any, parts: any, equippedMeshes: any) {
        const { helm, shoulders, shield } = equipment;
        if (helm && !equippedMeshes.helm) {
            const h = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.15, 16), new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.6 }));
            h.position.y = 0.1; h.castShadow = true; parts.headMount.add(h); equippedMeshes.helm = h;
        } else if (!helm && equippedMeshes.helm) { parts.headMount.remove(equippedMeshes.helm); delete equippedMeshes.helm; }
        if (shoulders && !equippedMeshes.leftPauldron) {
            const p = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16, 0, Math.PI*2, 0, Math.PI/2), new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.6 }));
            const lp = p.clone(); parts.leftShoulderMount.add(lp); equippedMeshes.leftPauldron = lp;
            const rp = p.clone(); parts.rightShoulderMount.add(rp); equippedMeshes.rightPauldron = rp;
        } else if (!shoulders && equippedMeshes.leftPauldron) {
            parts.leftShoulderMount.remove(equippedMeshes.leftPauldron!);
            parts.rightShoulderMount.remove(equippedMeshes.rightPauldron!);
            delete equippedMeshes.leftPauldron; delete equippedMeshes.rightPauldron;
        }
        if (shield && !equippedMeshes.shield) {
            const shape = new THREE.Shape();
            shape.moveTo(0, 0.2); shape.lineTo(0.15, 0.15); shape.lineTo(0.12, -0.1); shape.quadraticCurveTo(0, -0.3, -0.12, -0.1); shape.lineTo(-0.15, 0.15); shape.lineTo(0, 0.2);
            const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 });
            const s = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x5d4037 }));
            s.rotation.x = -Math.PI / 2; s.rotation.z = Math.PI / 2; s.castShadow = true;
            parts.leftShieldMount.add(s); equippedMeshes.shield = s;
        } else if (!shield && equippedMeshes.shield) { parts.leftShieldMount.remove(equippedMeshes.shield); delete equippedMeshes.shield; }
    }
}