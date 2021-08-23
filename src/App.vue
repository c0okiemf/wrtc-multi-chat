<template>
  <Chat />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Chat from './components/Chat.vue';
import './assets/css/main.css';

export default defineComponent({
  name: 'App',
  components: {
    Chat,
  },
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  padding-top: 20px;
  display: flex;
  flex-flow: column;
  height: 100%;
}
</style>
