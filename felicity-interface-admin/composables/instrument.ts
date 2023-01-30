import { ref } from 'vue'
import { IInstrument } from '~~/models/instrument'

const showModal = ref(false)
const instrument = ref<IInstrument | null>(null)

export function useInstrumentComposable() {

  const setShowModal = (show: boolean) => showModal.value = show
  const setInstrument = (inst: IInstrument | null) => {
    instrument.value = inst;
    showModal.value = true
  }

  return { 
        showModal, 
        setShowModal,
        instrument,
        setInstrument
    }
}