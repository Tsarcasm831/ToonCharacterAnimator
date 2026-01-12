
import * as THREE from 'three';
import { TreeFactory } from './objects/TreeFactory';
import { PlantFactory } from './objects/PlantFactory';
import { PropFactory } from './objects/PropFactory';
import { RockFactory } from './objects/RockFactory';
import { DebrisFactory } from './objects/DebrisFactory';
import { FaunaFactory } from './objects/FaunaFactory';

export class ObjectFactory {
    // Trees
    static createTree(position: THREE.Vector3) {
        return TreeFactory.createTree(position);
    }

    static createDeadTree(position: THREE.Vector3) {
        return TreeFactory.createDeadTree(position);
    }

    static createAutumnTree(position: THREE.Vector3) {
        return TreeFactory.createAutumnTree(position);
    }

    static createPineTree(position: THREE.Vector3, scale: number = 1.0) {
        return TreeFactory.createPineTree(position, scale);
    }

    // Plants
    static createCactus(position: THREE.Vector3, scale: number = 1.0) {
        return PlantFactory.createCactus(position, scale);
    }

    static createCattail(position: THREE.Vector3) {
        return PlantFactory.createCattail(position);
    }

    static createLilyPad(position: THREE.Vector3) {
        return PlantFactory.createLilyPad(position);
    }

    // Props
    static createLightpole(position: THREE.Vector3) {
        return PropFactory.createLightpole(position);
    }

    static createBarrel(position: THREE.Vector3) {
        return PropFactory.createBarrel(position);
    }

    static createCrate(position: THREE.Vector3) {
        return PropFactory.createCrate(position);
    }

    static createTire(position: THREE.Vector3) {
        return PropFactory.createTire(position);
    }

    static createBlueBlock() {
        return PropFactory.createBlueBlock();
    }

    // Rocks
    static createRock(position: THREE.Vector3, scale: number) {
        return RockFactory.createRock(position, scale);
    }

    // Debris / Destruction
    static createDebrisChunk(position: THREE.Vector3, material: THREE.Material) {
        return DebrisFactory.createDebrisChunk(position, material);
    }

    static createStump(position: THREE.Vector3, quaternion: THREE.Quaternion, material: THREE.Material) {
        return DebrisFactory.createStump(position, quaternion, material);
    }

    static createLogs(position: THREE.Vector3, quaternion: THREE.Quaternion) {
        return DebrisFactory.createLogs(position, quaternion);
    }

    static createFallingTrunk(position: THREE.Vector3, material: THREE.Material) {
        return DebrisFactory.createFallingTrunk(position, material);
    }

    // Fauna
    static createDeadWolf(position: THREE.Vector3, rotationY: number) {
        return FaunaFactory.createDeadWolf(position, rotationY);
    }

    static createWolfModel(color: number = 0x555555) {
        return FaunaFactory.createWolfModel(color);
    }

    static createBearModel(color: number = 0x5C4033) {
        return FaunaFactory.createBearModel(color);
    }

    static createOwlModel(color: number = 0x8B4513) {
        return FaunaFactory.createOwlModel(color);
    }
}
