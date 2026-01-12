
import * as THREE from 'three';

export class RockFactory {
    static createRock(position: THREE.Vector3, scale: number) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const geo = new THREE.DodecahedronGeometry(1, 1);
        const mat = new THREE.MeshStandardMaterial({ color: 0x757575, flatShading: true });
        const rock = new THREE.Mesh(geo, mat);
        rock.scale.set(scale, scale * 0.8, scale);
        rock.position.y = scale * 0.4;
        rock.castShadow = true;
        rock.receiveShadow = true;
        rock.userData = { type: 'hard', material: 'stone' };
        
        group.add(rock);
        return { group, rock };
    }
}
