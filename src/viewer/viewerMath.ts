export type Vec3 = [number, number, number];
export type StandardView = 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right' | 'iso';

export function measureDistance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function standardViewDir(v: StandardView): Vec3 {
  switch (v) {
    case 'top': return [0, 0, 1];
    case 'bottom': return [0, 0, -1];
    case 'front': return [0, -1, 0];
    case 'back': return [0, 1, 0];
    case 'left': return [-1, 0, 0];
    case 'right': return [1, 0, 0];
    case 'iso': {
      const k = 1 / Math.sqrt(3);
      return [k, -k, k];
    }
  }
}

// Camera distance to frame a bbox of the given size for a vertical fov (degrees).
export function fitDistance(size: Vec3, fovDeg: number): number {
  const radius = Math.hypot(size[0], size[1], size[2]) / 2;
  const fov = (fovDeg * Math.PI) / 180;
  return (radius / Math.sin(fov / 2)) * 1.1; // 10% margin
}
