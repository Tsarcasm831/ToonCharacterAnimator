import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { ModelExporter } from '../ModelExporter';

type ZipFileContents = Map<string, string>;

const zipFileContents: ZipFileContents = new Map();
const generateAsyncMock = vi.fn();

vi.mock('jszip', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      file: (name: string, content: string) => {
        zipFileContents.set(name, content);
      },
      generateAsync: generateAsyncMock,
    })),
  };
});

describe('ModelExporter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    zipFileContents.clear();
    generateAsyncMock.mockResolvedValue({});

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:mock'),
      revokeObjectURL: vi.fn(),
    });

    const anchor = {
      href: '',
      download: '',
      click: vi.fn(),
    };

    vi.stubGlobal('document', {
      createElement: vi.fn().mockReturnValue(anchor),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    });
  });

  it('exports geometry data while skipping configured meshes and names', async () => {
    const root = new THREE.Group();
    root.name = 'Root';

    const includedMesh = new THREE.Mesh(
      new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.Float32BufferAttribute([1.23456, -2.34567, 3.45678], 3)
      )
        .setAttribute(
          'normal',
          new THREE.Float32BufferAttribute([0.11111, 0.22222, 0.33333], 3)
        )
        .setIndex([0, 1, 2]),
      new THREE.MeshStandardMaterial({ color: 0xffaa00 })
    );
    includedMesh.name = 'BodyMesh';

    const shirtMesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial());
    shirtMesh.name = 'ShirtMesh';

    const underwearMesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial());
    underwearMesh.name = 'UnderwearMesh';

    const braStrapMesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial());
    braStrapMesh.name = 'BraStrapMesh';

    const braCupMesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial());
    braCupMesh.name = 'BraCupMesh';

    const undieMesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial());
    undieMesh.name = 'undie';

    const hitboxGroup = new THREE.Group();
    hitboxGroup.name = 'HitboxOverlay';
    hitboxGroup.add(new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial()));

    root.add(
      includedMesh,
      shirtMesh,
      underwearMesh,
      braStrapMesh,
      braCupMesh,
      undieMesh,
      hitboxGroup
    );

    const mockPlayer = {
      model: {
        group: root,
        shirtMeshes: [shirtMesh],
        parts: {
          underwearBottom: underwearMesh,
          braStrap: braStrapMesh,
          braCups: [braCupMesh],
        },
      },
    } as any;

    await ModelExporter.exportAndDownloadZip(mockPlayer);

    expect(zipFileContents.has('ExportedCharacter.ts')).toBe(true);
    expect(zipFileContents.has('geometryData.ts')).toBe(true);

    const exportedScript = zipFileContents.get('ExportedCharacter.ts') ?? '';
    const dataScript = zipFileContents.get('geometryData.ts') ?? '';

    expect(exportedScript).toContain('BodyMesh');
    expect(exportedScript).not.toContain('undie');
    expect(exportedScript).not.toContain('HitboxOverlay');
    expect(exportedScript).not.toContain('ShirtMesh');
    expect(exportedScript).not.toContain('UnderwearMesh');
    expect(exportedScript).not.toContain('BraStrapMesh');
    expect(exportedScript).not.toContain('BraCupMesh');

    expect(dataScript).toContain('1.235');
    expect(dataScript).toContain('-2.346');
    expect(dataScript).toContain('3.457');
    expect(dataScript).toContain('0.111');
    expect(dataScript).toContain('0.222');
    expect(dataScript).toContain('0.333');
    expect(dataScript).not.toMatch(/-?\d+\.\d{4,}/);
  });
});
