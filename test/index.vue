<template>
    <div>
        <span>hello world</span>
        <!-- #ifdef MP-WEIXIN -->
        hello world
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        41564867877877
        <!-- #endif -->
    </div>
</template>

<script>
export default {
}
</script>

<style>

</style>