import { StrokePath, DrawingTool, DrawingLayer, DrawingProject } from '@/types';

export interface DrawingEngineOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
}

export class DrawingEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  private layers: DrawingLayer[] = [
    { id: 'layer-1', name: 'Layer 1', visible: true, locked: false, opacity: 1.0 },
  ];
  private activeLayerId: string = 'layer-1';

  private strokes: StrokePath[] = [];
  private undoStack: StrokePath[][] = [];
  private redoStack: StrokePath[][] = [];

  private currentStroke: StrokePath | null = null;
  private currentTool: DrawingTool = 'glow';
  private currentColor: string = '#00f3ff';
  private currentWidth: number = 6;
  private currentOpacity: number = 0.9;
  private symmetryAxis: boolean = false; // vertical center mirror

  private onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;

  constructor(options: DrawingEngineOptions) {
    this.canvas = options.canvas;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Failed to get 2D canvas context');
    this.ctx = context;
    this.width = options.width;
    this.height = options.height;
    this.onHistoryChange = options.onHistoryChange;

    this.resize(this.width, this.height);
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.redrawAll();
  }

  // --- Configuration ---
  public setTool(tool: DrawingTool) {
    this.currentTool = tool;
  }
  public getTool(): DrawingTool {
    return this.currentTool;
  }
  public setColor(color: string) {
    this.currentColor = color;
  }
  public getColor(): string {
    return this.currentColor;
  }
  public setWidth(width: number) {
    this.currentWidth = width;
  }
  public getWidth(): number {
    return this.currentWidth;
  }
  public setOpacity(opacity: number) {
    this.currentOpacity = opacity;
  }
  public setSymmetry(enabled: boolean) {
    this.symmetryAxis = enabled;
  }

  // --- Layers ---
  public getLayers(): DrawingLayer[] {
    return [...this.layers];
  }
  public addLayer(name?: string): string {
    const id = `layer-${Date.now()}`;
    this.layers.push({
      id,
      name: name || `Layer ${this.layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1.0,
    });
    this.activeLayerId = id;
    return id;
  }
  public setActiveLayer(layerId: string) {
    if (this.layers.some((l) => l.id === layerId)) {
      this.activeLayerId = layerId;
    }
  }
  public toggleLayerVisibility(layerId: string) {
    const layer = this.layers.find((l) => l.id === layerId);
    if (layer) {
      layer.visible = !layer.visible;
      this.redrawAll();
    }
  }

  // --- Stroke Lifecycle ---
  public startStroke(normalizedX: number, normalizedY: number, mirrorX: boolean = true) {
    const activeLayer = this.layers.find((l) => l.id === this.activeLayerId);
    if (activeLayer?.locked || !activeLayer?.visible) return;

    // Push state to undo stack before starting new stroke
    this.pushUndo();

    const x = (mirrorX ? 1.0 - normalizedX : normalizedX) * this.width;
    const y = normalizedY * this.height;

    this.currentStroke = {
      id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tool: this.currentTool,
      color: this.currentColor,
      width: this.currentWidth,
      opacity: this.currentOpacity,
      points: [{ x, y, timestamp: performance.now() }],
      layerId: this.activeLayerId,
    };

    this.renderCurrentSegment();
  }

  public addPoint(normalizedX: number, normalizedY: number, mirrorX: boolean = true) {
    if (!this.currentStroke) return;

    const x = (mirrorX ? 1.0 - normalizedX : normalizedX) * this.width;
    const y = normalizedY * this.height;

    // Reject jitter if moved less than 2px
    const pts = this.currentStroke.points;
    const last = pts[pts.length - 1];
    const distSq = (x - last.x) ** 2 + (y - last.y) ** 2;
    if (distSq < 4) return;

    pts.push({ x, y, timestamp: performance.now() });
    this.renderCurrentSegment();
  }

  public endStroke() {
    if (!this.currentStroke) return;

    if (this.currentStroke.points.length > 0) {
      this.strokes.push(this.currentStroke);
      this.redoStack = []; // Clear redo on new action
      this.notifyHistory();
    }
    this.currentStroke = null;
    this.redrawAll();
  }

  public cancelStroke() {
    this.currentStroke = null;
    this.redrawAll();
  }

  // --- History Management (Undo / Redo) ---
  private pushUndo() {
    this.undoStack.push(JSON.parse(JSON.stringify(this.strokes)));
    if (this.undoStack.length > 30) this.undoStack.shift();
    this.redoStack = [];
    this.notifyHistory();
  }

  public undo(): boolean {
    if (this.undoStack.length === 0) return false;
    this.redoStack.push(JSON.parse(JSON.stringify(this.strokes)));
    this.strokes = this.undoStack.pop() || [];
    this.currentStroke = null;
    this.redrawAll();
    this.notifyHistory();
    return true;
  }

  public redo(): boolean {
    if (this.redoStack.length === 0) return false;
    this.undoStack.push(JSON.parse(JSON.stringify(this.strokes)));
    this.strokes = this.redoStack.pop() || [];
    this.currentStroke = null;
    this.redrawAll();
    this.notifyHistory();
    return true;
  }

  public clearAll() {
    this.pushUndo();
    this.strokes = [];
    this.currentStroke = null;
    this.redrawAll();
    this.notifyHistory();
  }

  private notifyHistory() {
    if (this.onHistoryChange) {
      this.onHistoryChange(this.undoStack.length > 0, this.redoStack.length > 0);
    }
  }

  // --- Rendering ---
  public redrawAll() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (const layer of this.layers) {
      if (!layer.visible) continue;

      this.ctx.save();
      this.ctx.globalAlpha = layer.opacity;

      const layerStrokes = this.strokes.filter((s) => s.layerId === layer.id);
      for (const stroke of layerStrokes) {
        this.renderStroke(stroke);
        if (this.symmetryAxis) {
          this.renderSymmetricStroke(stroke);
        }
      }

      this.ctx.restore();
    }

    if (this.currentStroke) {
      this.renderStroke(this.currentStroke);
      if (this.symmetryAxis) {
        this.renderSymmetricStroke(this.currentStroke);
      }
    }
  }

  private renderCurrentSegment() {
    if (!this.currentStroke || this.currentStroke.points.length < 2) return;

    const stroke = this.currentStroke;
    const pts = stroke.points;
    const p1 = pts[pts.length - 2];
    const p2 = pts[pts.length - 1];

    this.ctx.save();
    this.applyToolStyle(stroke);

    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.stroke();

    if (this.symmetryAxis) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.width - p1.x, p1.y);
      this.ctx.lineTo(this.width - p2.x, p2.y);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private renderStroke(stroke: StrokePath) {
    if (stroke.points.length === 0) return;

    this.ctx.save();
    this.applyToolStyle(stroke);

    if (stroke.points.length === 1) {
      this.ctx.beginPath();
      this.ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
      return;
    }

    // Handle shape tools
    if (stroke.tool === 'line') {
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      this.ctx.beginPath();
      this.ctx.moveTo(start.x, start.y);
      this.ctx.lineTo(end.x, end.y);
      this.ctx.stroke();
      this.ctx.restore();
      return;
    }

    if (stroke.tool === 'rectangle') {
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      this.ctx.beginPath();
      this.ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      this.ctx.restore();
      return;
    }

    if (stroke.tool === 'circle') {
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      const radius = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
      this.ctx.beginPath();
      this.ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
      return;
    }

    // Smooth Bezier Curve through Points
    this.ctx.beginPath();
    this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length - 1; i++) {
      const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
      const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
      this.ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
    }

    const last = stroke.points[stroke.points.length - 1];
    this.ctx.lineTo(last.x, last.y);
    this.ctx.stroke();

    this.ctx.restore();
  }

  private renderSymmetricStroke(stroke: StrokePath) {
    const symmetricStroke: StrokePath = {
      ...stroke,
      points: stroke.points.map((p) => ({
        ...p,
        x: this.width - p.x,
      })),
    };
    this.renderStroke(symmetricStroke);
  }

  private applyToolStyle(stroke: StrokePath) {
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.lineWidth = stroke.width;

    if (stroke.tool === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.strokeStyle = 'rgba(0,0,0,1)';
      this.ctx.fillStyle = 'rgba(0,0,0,1)';
      return;
    }

    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.globalAlpha = stroke.opacity;

    if (stroke.tool === 'glow') {
      this.ctx.shadowBlur = stroke.width * 1.8;
      this.ctx.shadowColor = stroke.color;
      this.ctx.strokeStyle = stroke.color;
      this.ctx.fillStyle = stroke.color;
    } else if (stroke.tool === 'highlighter') {
      this.ctx.globalAlpha = 0.35;
      this.ctx.lineWidth = stroke.width * 2.2;
      this.ctx.strokeStyle = stroke.color;
    } else {
      this.ctx.shadowBlur = 0;
      this.ctx.strokeStyle = stroke.color;
      this.ctx.fillStyle = stroke.color;
    }
  }

  // --- Exporting & Serialization ---
  public exportPNG(transparent: boolean = true): string {
    if (transparent) {
      return this.canvas.toDataURL('image/png');
    }

    // Export with futuristic dark HUD background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.width;
    tempCanvas.height = this.height;
    const tempCtx = tempCanvas.getContext('2d')!;

    tempCtx.fillStyle = '#030712';
    tempCtx.fillRect(0, 0, this.width, this.height);
    tempCtx.drawImage(this.canvas, 0, 0);

    return tempCanvas.toDataURL('image/png');
  }

  public exportSVG(): string {
    const paths = this.strokes
      .map((s) => {
        if (s.points.length < 2) return '';
        let d = `M ${s.points[0].x} ${s.points[0].y}`;
        for (let i = 1; i < s.points.length; i++) {
          d += ` L ${s.points[i].x} ${s.points[i].y}`;
        }
        return `<path d="${d}" stroke="${s.color}" stroke-width="${s.width}" stroke-opacity="${s.opacity}" fill="none" stroke-linecap="round" stroke-linejoin="round" />`;
      })
      .join('\n');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.width} ${this.height}" width="${this.width}" height="${this.height}">
  <rect width="100%" height="100%" fill="#030712"/>
  ${paths}
</svg>`;
  }

  public toProject(title: string = 'Air Drawing'): DrawingProject {
    return {
      id: `proj-${Date.now()}`,
      title,
      width: this.width,
      height: this.height,
      layers: this.layers,
      strokes: this.strokes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      thumbnail: this.exportPNG(true),
    };
  }

  public loadProject(project: DrawingProject) {
    this.layers = project.layers || [
      { id: 'layer-1', name: 'Layer 1', visible: true, locked: false, opacity: 1.0 },
    ];
    this.activeLayerId = this.layers[0]?.id || 'layer-1';
    this.strokes = project.strokes || [];
    this.undoStack = [];
    this.redoStack = [];
    this.currentStroke = null;
    this.redrawAll();
    this.notifyHistory();
  }
}
