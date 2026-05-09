import { SettlementManager } from './SettlementManager';
import { SettlementRenderer } from './SettlementRenderer';

export class SettlementInputController {
  private renderer: SettlementRenderer;
  private manager: SettlementManager;
  private readonly onPointerDown: (event: PointerEvent) => void;

  constructor(renderer: SettlementRenderer, manager: SettlementManager) {
    this.renderer = renderer;
    this.manager = manager;
    this.onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement;
      if (target.closest('button, input, select, textarea, .no-capture')) return;
      const cell = this.renderer.pickCell(event.clientX, event.clientY);
      if (!cell) return;
      this.manager.handleCellAction(cell.x, cell.y);
    };

    this.renderer.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
  }

  dispose(): void {
    this.renderer.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
  }
}
