import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { SceneModel, Part, RGB } from '../contracts/sceneModel';
import { fitDistance, standardViewDir, type StandardView, type Vec3 } from './viewerMath';

export type DisplayMode = 'shaded' | 'shaded-edges' | 'wireframe';
const EDGE_TRI_LIMIT = 400_000; // skip edge extraction above this many triangles
const DEFAULT_COLOR: RGB = [0.8, 0.8, 0.82];

export class Viewer {
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private root = new THREE.Group();
  private meshes = new Map<string, THREE.Mesh>();
  private edges = new Map<string, THREE.LineSegments>();
  private clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
  private bboxSize: Vec3 = [1, 1, 1];
  private center = new THREE.Vector3();
  private mode: DisplayMode = 'shaded-edges';
  private sectionOn = false;

  // --- measure mode ---
  private measureGroup = new THREE.Group();
  private raycaster = new THREE.Raycaster();
  private measurePoints: THREE.Vector3[] = [];
  private measureOn = false;
  private measureChange: ((mm: number | null) => void) | null = null;
  private pointerDown: { x: number; y: number } | null = null;

  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.localClippingEnabled = false; // section is OFF until the user enables it
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.01, 1e6);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.scene.background = new THREE.Color(0x202024);
    this.scene.add(this.root);
    this.scene.add(this.measureGroup);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(1, 1, 2);
    this.scene.add(dir);
    this.scene.add(new THREE.GridHelper(100, 20, 0x444444, 0x333333));

    this.resize();
    window.addEventListener('resize', this.resize);
    this.renderer.setAnimationLoop(() => {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    });
  }

  loadModel(model: SceneModel) {
    this.clear();
    const box = new THREE.Box3(
      new THREE.Vector3(...model.meta.bbox.min),
      new THREE.Vector3(...model.meta.bbox.max),
    );
    box.getCenter(this.center);
    const size = new THREE.Vector3();
    box.getSize(size);
    this.bboxSize = [size.x || 1, size.y || 1, size.z || 1];

    for (const part of model.parts) this.addPart(part);
    this.setDisplayMode(this.mode);
    this.standardView('iso');
  }

  private addPart(part: Part) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(part.positions, 3));
    if (part.normals) g.setAttribute('normal', new THREE.BufferAttribute(part.normals, 3));
    else g.computeVertexNormals();
    if (part.indices) g.setIndex(new THREE.BufferAttribute(part.indices, 1));

    const color = new THREE.Color(...(part.color ?? DEFAULT_COLOR));
    const mat = new THREE.MeshStandardMaterial({
      color, metalness: 0.1, roughness: 0.7, side: THREE.DoubleSide,
      clippingPlanes: this.sectionOn ? [this.clipPlane] : [], // attach plane only when sectioning
    });
    const mesh = new THREE.Mesh(g, mat);
    mesh.userData.partId = part.id;
    this.root.add(mesh);
    this.meshes.set(part.id, mesh);
  }

  setPartVisibility(id: string, visible: boolean) {
    const m = this.meshes.get(id); if (m) m.visible = visible;
    const e = this.edges.get(id); if (e) e.visible = visible && this.mode === 'shaded-edges';
  }

  setPartColor(id: string, color: RGB) {
    const m = this.meshes.get(id);
    if (m) (m.material as THREE.MeshStandardMaterial).color.setRGB(...color);
  }

  setDisplayMode(mode: DisplayMode) {
    this.mode = mode;
    const tris = this.totalTriangles();
    for (const [id, mesh] of this.meshes) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.wireframe = mode === 'wireframe';
      if (mode === 'shaded-edges' && tris <= EDGE_TRI_LIMIT) {
        if (!this.edges.has(id)) {
          const eg = new THREE.EdgesGeometry(mesh.geometry as THREE.BufferGeometry, 30);
          const line = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: 0x111111 }));
          line.userData.partId = id;
          this.root.add(line);
          this.edges.set(id, line);
        }
        this.edges.get(id)!.visible = mesh.visible;
      } else {
        const e = this.edges.get(id); if (e) e.visible = false;
      }
    }
  }

  setSection(enabled: boolean, axis: 'x' | 'y' | 'z' = 'z', offset = 0) {
    this.sectionOn = enabled;
    this.renderer.localClippingEnabled = enabled;
    const normals: Record<string, Vec3> = { x: [-1, 0, 0], y: [0, -1, 0], z: [0, 0, -1] };
    this.clipPlane.normal.set(...normals[axis]);
    this.clipPlane.constant = offset;
    for (const m of this.meshes.values()) {
      (m.material as THREE.MeshStandardMaterial).clippingPlanes = enabled ? [this.clipPlane] : [];
    }
  }

  standardView(view: StandardView) {
    const dir = new THREE.Vector3(...standardViewDir(view));
    const dist = fitDistance(this.bboxSize, this.camera.fov);
    this.camera.position.copy(this.center).add(dir.multiplyScalar(dist));
    this.camera.up.set(0, 0, 1);
    this.camera.lookAt(this.center);
    this.controls.target.copy(this.center);
    this.controls.update();
  }

  fitView() { this.standardView('iso'); }

  /**
   * Imperative point-to-point measure mode.
   * ON: clicks (not orbit-drags) raycast the part meshes; the 2nd surface point
   * draws a line + sphere markers and reports the Euclidean distance via onChange.
   * A 3rd click starts a fresh measurement. OFF: tears down listeners + visuals.
   */
  setMeasureMode(on: boolean, onChange?: (mm: number | null) => void) {
    if (on) {
      this.measureChange = onChange ?? null;
      if (!this.measureOn) {
        this.measureOn = true;
        const el = this.renderer.domElement;
        el.addEventListener('pointerdown', this.onMeasurePointerDown);
        el.addEventListener('pointerup', this.onMeasurePointerUp);
      }
      this.clearMeasureVisuals();
      this.measureChange?.(null);
    } else {
      if (this.measureOn) {
        const el = this.renderer.domElement;
        el.removeEventListener('pointerdown', this.onMeasurePointerDown);
        el.removeEventListener('pointerup', this.onMeasurePointerUp);
      }
      this.measureOn = false;
      this.pointerDown = null;
      this.clearMeasureVisuals();
      this.measureChange?.(null);
      this.measureChange = null;
    }
  }

  private onMeasurePointerDown = (e: PointerEvent) => {
    this.pointerDown = { x: e.clientX, y: e.clientY };
  };

  private onMeasurePointerUp = (e: PointerEvent) => {
    const down = this.pointerDown;
    this.pointerDown = null;
    if (!down) return;
    // Distinguish a click from an orbit-drag: ignore if the pointer moved much.
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    if (moved >= 5) return;

    const hit = this.pickSurfacePoint(e.clientX, e.clientY);
    if (!hit) return;

    // A 3rd pick starts a fresh measurement.
    if (this.measurePoints.length >= 2) this.clearMeasureVisuals();

    this.measurePoints.push(hit);
    this.addMeasureMarker(hit);

    if (this.measurePoints.length === 2) {
      const [a, b] = this.measurePoints;
      this.addMeasureLine(a, b);
      this.measureChange?.(a.distanceTo(b));
    } else {
      this.measureChange?.(null);
    }
  };

  private pickSurfacePoint(clientX: number, clientY: number): THREE.Vector3 | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const targets = [...this.meshes.values()].filter((m) => m.visible);
    const hits = this.raycaster.intersectObjects(targets, false);
    return hits.length ? hits[0].point.clone() : null;
  }

  private markerRadius(): number {
    return Math.max(...this.bboxSize) * 0.01 || 0.01;
  }

  private addMeasureMarker(p: THREE.Vector3) {
    const geom = new THREE.SphereGeometry(this.markerRadius(), 16, 12);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffcc00, depthTest: false });
    const sphere = new THREE.Mesh(geom, mat);
    sphere.position.copy(p);
    sphere.renderOrder = 999;
    this.measureGroup.add(sphere);
  }

  private addMeasureLine(a: THREE.Vector3, b: THREE.Vector3) {
    const geom = new THREE.BufferGeometry().setFromPoints([a, b]);
    const mat = new THREE.LineBasicMaterial({ color: 0xffcc00, depthTest: false });
    const line = new THREE.Line(geom, mat);
    line.renderOrder = 999;
    this.measureGroup.add(line);
  }

  private clearMeasureVisuals() {
    this.measurePoints = [];
    for (const child of [...this.measureGroup.children]) {
      this.measureGroup.remove(child);
      const obj = child as THREE.Mesh | THREE.Line;
      obj.geometry.dispose();
      (obj.material as THREE.Material).dispose();
    }
  }

  screenshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  private totalTriangles(): number {
    let n = 0;
    for (const m of this.meshes.values()) {
      const g = m.geometry as THREE.BufferGeometry;
      n += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
    }
    return n;
  }

  private clear() {
    for (const m of this.meshes.values()) { this.root.remove(m); m.geometry.dispose(); (m.material as THREE.Material).dispose(); }
    for (const e of this.edges.values()) { this.root.remove(e); e.geometry.dispose(); (e.material as THREE.Material).dispose(); }
    this.meshes.clear(); this.edges.clear();
    this.clearMeasureVisuals();
  }

  private resize = () => {
    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 600;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  dispose() {
    window.removeEventListener('resize', this.resize);
    this.renderer.setAnimationLoop(null);
    this.setMeasureMode(false); // remove pointer listeners + measure visuals
    this.clear();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
