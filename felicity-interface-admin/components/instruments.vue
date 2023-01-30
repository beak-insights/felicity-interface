<script setup lang="ts">
import { SmileOutlined } from "@ant-design/icons-vue";
import { IInstrument } from "~~/models/instrument";
import { useInstrumentStore } from "~~/store/instrument";
const { setInstrument } = useInstrumentComposable();

const instrumentStore = useInstrumentStore();

const columns = [
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
    title: "Connection Type",
    dataIndex: "connectionType",
    key: "connectionType",
  },
  {
    title: "Protocol",
    key: "protocol",
    dataIndex: "protocol",
  },
  {
    title: "Server",
    key: "server",
    dataIndex: "server",
  },
  {
    title: "Client",
    key: "client",
    dataIndex: "client",
  },
  {
    title: "Configurations",
    key: "action",
  },
];

instrumentStore.fetchInstruments();
const fetching = computed(() => instrumentStore.isFetching);

const openConfig = (instrumet: IInstrument) => {
  setInstrument(toRaw(instrumet))
}
</script>

<template>
  <a-button type="primary" @click="setInstrument(null)" class="mb-4"
    >Add Instrument</a-button
  >

  <a-table :columns="columns" :data-source="instrumentStore.instruments" :loading="fetching">
    <template #headerCell="{ column }">
      <template v-if="column.key === 'name'">
        <span>
          <smile-outlined />
          Name
        </span>
      </template>
    </template>

    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'protocol'">
        <a-tag :color="record.protocol === 'hl7' ? 'geekblue' : 'green'">
          {{ record.protocol?.toUpperCase() }}
        </a-tag>
      </template>
      <template v-else-if="column.key === 'connectionType'">
        <a-tag :color="record.connectionType === 'tcpip' ? 'geekblue' : 'green'">
          {{ record.connectionType?.toUpperCase() }}
        </a-tag>
      </template>
      <template v-else-if="column.key === 'server'">
        <div class="flex justify-start gap-x-4 items-center">
          <check-outlined v-show="record.server" />
          <close-outlined v-show="!record.server"/>
          <sync-outlined  class="animate-spin" />
        </div>
      </template>
      <template v-else-if="column.key === 'client'">
        <div class="flex justify-start gap-x-4 items-center">
          <check-outlined v-show="record.client" />
          <close-outlined v-show="!record.client"/>
          <question-outlined  class="animate-bounce" />
        </div>
      </template>
      <template v-else-if="column.key === 'mode'">
        <span>
          <a-tag v-show="record.client" color="green">
            CLIENT
          </a-tag>
          <a-tag v-show="record.server" color="blue">
            SERVER
          </a-tag>
        </span>
      </template>
      <template v-else-if="column.key === 'action'">
        <span>
          <a @click="openConfig(record)">Open</a>
        </span>
      </template>
    </template>
  </a-table>

  <instrument-form></instrument-form>
</template>


