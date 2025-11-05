<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-grey-1 text-dark">
      <q-toolbar>
        <q-toolbar-title class="text-body1 text-weight-bold"> 電表階層管理系統 </q-toolbar-title>

        <div class="text-caption text-grey-7 q-mr-sm">Bob Kuo</div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup></script>
