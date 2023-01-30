<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});


const activeKey = ref("2");


</script>

<template>
  <div class="container mx-auto mt-8">

    <a-tabs v-model:activeKey="activeKey">
      <a-tab-pane key="1" tab="Orders">Content of Tab Pane 1</a-tab-pane>
      <a-tab-pane key="2" tab="Instruments" force-render>
        <instruments />
      </a-tab-pane>
    </a-tabs>

  </div>
</template>
