<script setup lang="ts">
import { useInstrumentStore } from "~~/store/instrument";
import { IInstrument } from "./../models/instrument";
import { UnwrapRef } from "vue";

const { showModal, setShowModal, instrument } = useInstrumentComposable();
const { addOrUpdate } = useInstrumentStore();

const confirmLoading = ref<boolean>(false);
const modalTitle = ref<string>("");

// form
const labelCol = { style: { width: "150px" } };
const wrapperCol = { span: 14 };

interface FormState {
  form: IInstrument;
}

const formState: UnwrapRef<FormState> = reactive({
  form: {
    name: "",
    code: "",
    protocol: "astm",
    isClient: true,
    port: undefined,
    host: "",
    path:"/dev/tty/USB0",
    baudRate: 9600,
    autoReconnect: true,
    connectionType: "tcpip",
    ...(instrument.value ?? {}),
  },
});

watch(
  () => instrument,
  (update) => {
    formState.form = { ...(update.value ?? {}) } as IInstrument;
    modalTitle.value = !update?.value?.id
      ? "Add a new Instrument"
      : "Update " + update.value?.name;
  },
  { deep: true }
);

const handleOk = async () => {
  confirmLoading.value = true;
  let url = `${BACKEND_API}/instrument`;
  let formData = formState.form;
  if(formData.connectionType === "tcpip") {
    formData = remove_propeties(formData, [
      "path",
      "baudRate",
    ])
  }
  if(formData.connectionType === "serial") {
    formData = remove_propeties(formData, [
      "port",
      "host",
    ])
  }
  formData = remove_propeties(formData, [
    "connecting",
    "connected",
    "message",
  ])
  let options = { method: "POST", body: formData } as any;
  if (instrument.value?.id) {
    url += `/${instrument.value?.id}`;
    options["method"] = "PATCH";
  }
  await useFetch(url, options)
    .then(async (result) => {
      await addOrUpdate(result.data.value as IInstrument);
      setShowModal(false)
      confirmLoading.value = false;
    })
    .catch((error) => {
      console.log("error!", error);
      confirmLoading.value = false;
    });
};
</script>

<template>
  <a-modal
    v-model:visible="showModal"
    :title="modalTitle"
    :confirm-loading="confirmLoading"
    @ok="handleOk"
  >
    <a-form :model="formState.form" :label-col="labelCol" :wrapper-col="wrapperCol">
      <a-form-item label="Name">
        <a-input v-model:value="formState.form.name" />
      </a-form-item>
      <a-form-item label="Code">
        <a-input v-model:value="formState.form.code" />
      </a-form-item>
      <a-form-item label="Connection">
        <a-radio-group v-model:value="formState.form.connectionType">
          <a-radio value="tcpip" name="type">TCPIP</a-radio>
          <a-radio value="serial" name="type">Serial</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item label="Protocol" >
        <a-radio-group v-model:value="formState.form.protocol">
          <a-radio value="hl7" name="type" v-show="formState.form.connectionType === 'tcpip'">Hl7</a-radio>
          <a-radio value="astm" name="type">ASTM</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item label="Is Client" v-show="formState.form.connectionType === 'tcpip'">
        <a-switch v-model:checked="formState.form.isClient" checked-children="client" un-checked-children="server" />
      </a-form-item>
      <a-form-item label="TCP IP Host" v-show="formState.form.connectionType === 'tcpip'">
        <a-input v-model:value="formState.form.host" />
      </a-form-item>
      <a-form-item label="TCP IP Port" v-show="formState.form.connectionType === 'tcpip'">
        <a-input type="number" v-model:value="formState.form.port" />
      </a-form-item>

      <a-form-item label="Serial Path" v-show="formState.form.connectionType === 'serial'">
        <a-input v-model:value="formState.form.path" />
      </a-form-item>
      <a-form-item label="Serial Baud Rate" v-show="formState.form.connectionType === 'serial'">
        <a-input type="number" v-model:value="formState.form.baudRate" />
      </a-form-item>

      <a-form-item label="Auto reconnect">
        <a-switch v-model:checked="formState.form.autoReconnect" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
