<template>
  <div class="min-h-screen bg-gray-50">
    <header class="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-3">
      <i class="pi pi-cart-plus text-xl text-orange-600"></i>
      <span class="font-bold text-base text-gray-900">Cloud Kitchen</span>
      <nav class="ml-auto flex items-center gap-4 text-sm">
        <router-link to="/track" class="text-gray-600 hover:text-gray-900 transition-colors">Track Order</router-link>
        <router-link to="/portal" class="text-gray-600 hover:text-gray-900 transition-colors">My Orders</router-link>
      </nav>
    </header>
    <main class="max-w-2xl mx-auto p-6">
      <router-view />
    </main>
  </div>
</template>
