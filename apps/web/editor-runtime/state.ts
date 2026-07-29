(() => {
  interface StateApp {
    _deps: Record<string, unknown>;
    engine: { wavesurfer: { backend: { buffer: unknown } } };
    fireEvent: (name: string, value?: unknown, value2?: unknown) => unknown;
    listenFor: (name: string, listener: AMRuntimeEventListener) => void;
    mrk?: { ser(context?: unknown): unknown };
    multitrack?: { getState(): unknown };
  }

  interface StateDependencies extends Record<string, unknown> {
    state?: new (depth: number, app: StateApp) => AMRuntimeStateManager;
  }

  class RuntimeStateManager implements AMRuntimeStateManager {
    private nextId = 1;
    private undo: AMRuntimeStateSnapshot[] = [];
    private redo: AMRuntimeStateSnapshot[] = [];

    constructor(
      private readonly depth: number,
      private readonly app: StateApp,
    ) {
      app.listenFor('StateRequestPush', (state) => {
        if (state && typeof state === 'object') this.pushUndoState(state as AMRuntimeStateSnapshot);
      });
      app.listenFor('StateRequestUndo', () => this.popUndoState());
      app.listenFor('StateRequestRedo', () => this.shiftRedoState());
      app.listenFor('StateRequestClearAll', () => this.clearAllState());
      app.listenFor('StateRequestLastState', () => {
        app.fireEvent('StateDidLastState', this.getLastUndoState());
      });
    }

    private currentStateFor(state: AMRuntimeStateSnapshot): AMRuntimeStateSnapshot {
      const current: AMRuntimeStateSnapshot = {
        data: this.app.engine.wavesurfer.backend.buffer,
      };
      if (state.type === 'mult' && this.app.multitrack) {
        current.mt = this.app.multitrack.getState();
      }
      if (state.type === 'mrk' && this.app.mrk) {
        current.markers = this.app.mrk.ser(state.ctx);
      }
      return current;
    }

    private updateStateData(state: AMRuntimeStateSnapshot, current: AMRuntimeStateSnapshot) {
      state.data = current.data;
      if (current.mt) state.mt = current.mt;
      if (current.markers) state.markers = current.markers;
    }

    getLastUndoState() {
      return this.undo.at(-1);
    }

    pushUndoState(state: AMRuntimeStateSnapshot) {
      if (!state) return false;
      if (!state.id) state.id = ++this.nextId;
      if (this.undo.length >= Math.max(1, this.depth || 1)) this.undo.shift();

      const lastUndo = this.undo.at(-1);
      if (lastUndo && lastUndo.id !== state.id - 1) this.undo = [];
      if (this.redo[0] && this.redo[0].id !== state.id + 1) this.redo = [];

      this.undo.push(state);
      this.app.fireEvent('StatePush', this.undo.length);
      this.app.fireEvent('DidStateChange', this.undo, this.redo);
      return true;
    }

    popUndoState() {
      const state = this.undo.pop();
      if (!state) return undefined;

      if (this.redo[0] && this.redo[0].id !== (state.id ?? 0) + 1) this.redo = [];
      const current = this.currentStateFor(state);
      this.app.fireEvent('StateDidPop', state, 1);
      this.updateStateData(state, current);
      this.redo.unshift(state);
      this.app.fireEvent('DidStateChange', this.undo, this.redo);
      return state;
    }

    shiftRedoState() {
      const state = this.redo.shift();
      if (!state) return undefined;

      const lastUndo = this.undo.at(-1);
      if (lastUndo && lastUndo.id !== (state.id ?? 0) - 1) this.undo = [];
      const current = this.currentStateFor(state);
      this.app.fireEvent('StateDidPop', state, 0);
      this.updateStateData(state, current);
      this.undo.push(state);
      this.app.fireEvent('DidStateChange', this.undo, this.redo);
      return state;
    }

    clearAllState() {
      this.undo = [];
      this.redo = [];
      this.app.fireEvent('StateClearAll');
      this.app.fireEvent('DidStateChange', [], []);
    }
  }

  const app = PKAudioEditor as StateApp;
  (app._deps as StateDependencies).state = RuntimeStateManager;
})();
