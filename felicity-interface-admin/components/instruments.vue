<script setup lang="ts">
import { SmileOutlined } from "@ant-design/icons-vue";
import { IInstrument } from "~~/models/instrument";
import { useInstrumentStore } from "~~/store/instrument";
import { io } from "socket.io-client";
import { BACKEND_WS } from "~~/utils/constants";
import { useNotification } from '@kyvg/vue3-notification';

const { notify } = useNotification()

const socket = io(`${BACKEND_WS}/instrument`);
const { setInstrument } = useInstrumentComposable();
const instrumentStore = useInstrumentStore();

socket.on("session", (payload) => {
  console.log("session: ", payload);
  if(payload["message"]){
    notify({
      title: "Notification",
      text: payload["message"],
      type: 'warn',
    });
  }

  instrumentStore.addOrUpdate(payload);
});

const columns = [
  {
    name: "#ID",
    dataIndex: "id",
    key: "id",
  },
  {
    name: "Name",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Code",
    dataIndex: "code",
    key: "code",
  },
  {
    title: "Connection Summary",
    key: "summary",
  },
  {
    title: "Status",
    key: "status",
  },
  {
    title: "Configurations",
    key: "action",
  },
];

instrumentStore.fetchInstruments();
const fetching = computed(() => instrumentStore.isFetching);

const openConfig = (instrumet: IInstrument) => {
  setInstrument(toRaw(instrumet));
};

const startConnection = async (instrument: IInstrument) => {
  await useFetch(`${BACKEND_API}/instrument/${instrument.id}/connect`, {
    method: "POST",
  });
};

const endConnection = async (instrument: IInstrument) => {
  await useFetch(`${BACKEND_API}/instrument/${instrument.id}/disconnect`, {
    method: "POST",
  });
};

const confirmDelete = async (instrument: IInstrument) => {
  await useFetch(`${BACKEND_API}/instrument/${instrument.id}`, {
    method: "DELETE",
  }).then(res => instrumentStore.remove(instrument.id!));
};

const canConnect = (instrument: IInstrument) =>
  !instrument.connected && !instrument.connecting;

const canDisConnect = (instrument: IInstrument) =>
  instrument.connected || instrument.connecting;
</script>

<template>
  <a-button type="primary" @click="setInstrument(null)" class="mb-4"
    >Add Instrument</a-button
  >

  <a-table
    :columns="columns"
    :data-source="instrumentStore.instruments"
    :loading="fetching"
  >
    <template #headerCell="{ column }">
      <template v-if="column.key === 'name'">
        <span>
          <smile-outlined />
          Name
        </span>
      </template>
    </template>

    <template #bodyCell="{ column, record }">

      <template v-if="column.key === 'summary'">
        <a-tag :color="record.connectionType === 'tcpip' ? 'geekblue' : 'green'">
          {{ record.connectionType?.toUpperCase() }}
        </a-tag>
        <span v-if="record.connectionType === 'tcpip'">
          <a-tag v-show="record.isClient" color="green"> CLIENT </a-tag>
          <a-tag v-show="!record.isClient" color="blue"> SERVER </a-tag>
        </span>
        <a-tag :color="record.protocol === 'hl7' ? 'geekblue' : 'green'">
          {{ record.protocol?.toUpperCase() }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'status'">
        <div class="flex justify-start gap-x-4 items-center">
          <question-outlined
            v-show="!record.connected && !record.connecting"
            class="animate-bounce"
          />
          <loading-outlined v-show="record.connecting" />
          <thunderbolt-outlined v-show="record.connected" class="animate-pulse" />
        </div>
      </template>

      <template v-else-if="column.key === 'action'">
        <div class="flex justify-start gap-x-4 items-center">
          <a @click="openConfig(record)">Open</a>
          <a @click="startConnection(record)" v-show="canConnect(record)">Connect</a>
          <a @click="endConnection(record)" v-show="canDisConnect(record)">Disconnect</a>
          <a-popconfirm
          title="Are you sure delete this Instrument?"
          ok-text="Yes"
          cancel-text="No"
          @confirm="confirmDelete(record)"
        >
          <a href="#">Delete</a>
        </a-popconfirm>
        </div>
      </template>

    </template>
  </a-table>

  <instrument-form></instrument-form>
</template>
