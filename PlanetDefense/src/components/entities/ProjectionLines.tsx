import { useGameStore } from '../../store/useGameStore';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useMemo } from 'react';

export function ProjectionLines() {
  const enemies = useGameStore(s => s.enemies);

  return (
    <group>
      {enemies.map((enemy) => {
        const start = enemy.position;
        const end = new THREE.Vector3(enemy.position.x, 0, enemy.position.z);
        
        return (
          <Line
            key={enemy.id}
            points={[start, end]}
            color={enemy.position.y > 0 ? "#00ffff" : "#ff0088"} // Cyan for above, pink for below
            lineWidth={0.5}
            dashed={true}
            dashSize={0.5}
            gapSize={0.5}
            transparent
            opacity={0.4}
          />
        );
      })}
    </group>
  );
}
