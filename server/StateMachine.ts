export interface StateMachineData<SN extends string, EN extends string> {
    states: StateMachineState<SN>[];
    data: Partial<{
        isPlaying: boolean;
        player: any;
        events: {
            [eventName in EN]: boolean;
        };
        playlist?: SpotifyApi.SinglePlaylistResponse;
    }>;
    transitions: StateMachineTransition<SN>[];
    initialState: SN;
}

export interface StateMachineState<SN extends string> {
    name: SN;
}

export interface StateMachineTransition<SN extends string> {
    source: SN;
    target: SN;
    value: (d: any) => boolean;
}

export type StateMachineEvtCallback<SN extends string> = (
    state: StateMachineState<SN>,
) => void;

export class StateMachine<StateName extends string, EventName extends string> {
    private _data: Partial<StateMachineData<StateName, EventName>>;

    data: StateMachineData<StateName, EventName>["data"];
    states: StateMachineState<StateName>[];
    afterHandlers: StateMachineEvtCallback<StateName>[];
    handlers: { [name in StateName]?: StateMachineEvtCallback<StateName>[] };
    currentState: StateName;
    currentTransitions: StateMachineTransition<StateName>[];
    finalState: StateName;
    running: boolean;

    public constructor(
        data: Partial<StateMachineData<StateName, EventName>> = {},
    ) {
        this._data = data;
        this.data = data.data || {};
        this.states = data.states;
        this.afterHandlers = [];
        this.handlers = {};
        data.states.forEach(s => {
            this.handlers[s.name] = [];
        });
    }

    setState(state: StateName) {
        this.currentState = state;
        this.currentTransitions = this._data.transitions.filter(t => {
            return t.source == state;
        });
        this.emit(state);

        if (this.finalState == state) {
            this.running = false;
            return;
        }
    }

    update() {
        if (!this.running) {
            return;
        }
        let data = this.data;
        let next = null;
        this.currentTransitions.forEach(s => {
            if (s.value(data)) {
                next = s;
            }
        });
        if (next) {
            let data;
            if (next.target) {
                data = this.get(next.target);

                this.setState(next.target);

                if (this.finalState == next.target) {
                    this.running = false;
                }
            }
            if (next.event) {
                next.event();
            }
            this.emitAfter(data);
        }
    }

    get(state: StateName) {
        return this.states.find(function(s) {
            return s.name == state;
        });
    }

    start() {
        this.running = true;
        this.setState(this._data.initialState);
        this.emitAfter();
    }

    emit(state: StateName) {
        let item = this.get(state);
        this.handlers[state].forEach(f => {
            f(item);
        });
    }

    emitAfter(data?: any) {
        this.afterHandlers.forEach(f => {
            f(data);
        });
    }

    on(state: StateName, f: StateMachineEvtCallback<StateName>) {
        this.handlers[state].push(f);
    }

    after(f: StateMachineEvtCallback<StateName>) {
        this.afterHandlers.push(f);
    }
}
