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
    protocol: "hl7",
    client: true,
    clientPort: undefined,
    clientHost: "",
    server: false,
    serverPort: undefined,
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
  let options = { method: "POST", body: formState.form } as any;
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
          <a-radio value="astm" name="type">Serial ASTM</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="Protocol">
        <a-radio-group v-model:value="formState.form.protocol">
          <a-radio value="hl7" name="type">Hl7</a-radio>
          <a-radio value="astm" name="type">Serial ASTM</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item label="Is Client">
        <a-switch v-model:checked="formState.form.client" />
      </a-form-item>
      <a-form-item label="Client Host">
        <a-input v-model:value="formState.form.clientHost" />
      </a-form-item>
      <a-form-item label="Client Port">
        <a-input type="number" v-model:value="formState.form.clientPort" />
      </a-form-item>

      <a-form-item label="Is Server">
        <a-switch v-model:checked="formState.form.server" />
      </a-form-item>
      <a-form-item label="Client Port">
        <a-input type="number" v-model:Server="formState.form.serverPort" />
      </a-form-item>

      <a-form-item label="Auto reconnect">
        <a-switch v-model:checked="formState.form.autoReconnect" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
