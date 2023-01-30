import { defineStore } from 'pinia'
import { IInstrument } from '~~/models/instrument';

export const useInstrumentStore = defineStore('instrument', {
    state: () => ({ instruments: [], fetching: false } as {
        fetching: boolean,
        instruments: IInstrument[]
    }),
    getters: {
        isFetching: (state) => state.fetching,
        getInstruments: (state) => state.instruments,
    },
    actions: {
      async fetchInstruments() {
        this.fetching = true;
        await useFetch<IInstrument[]>(
            `${BACKEND_API}/instrument`
        ).then((results) => {
            this.instruments = results.data.value ?? [];
        }).finally(() => (this.fetching = false));
      },

      async addOrUpdate(instrument: IInstrument) {
        if(!instrument) {
            return;
        }
        const index = this.instruments.findIndex(inst => inst.id === instrument.id);
        if(index > -1) {
            this.instruments[index] = { ...instrument }
        } else {
            this.instruments = [instrument, ...this.instruments]
        }
      }
    },
})