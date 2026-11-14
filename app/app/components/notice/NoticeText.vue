<script setup lang="ts">
import MarkdownIt from 'markdown-it'

const props = defineProps<{ markdown: string }>()

// html: false escapes any HTML in the text, so v-html shows only the
// elements generated from Markdown
const md = new MarkdownIt({ html: false, linkify: true, breaks: true })

const html = computed(() => md.render(props.markdown))
</script>

<!-- Text written by the DPO: it can use bold and the other Markdown styles,
     outside the design system rules -->
<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="notice-text" v-html="html" />
</template>

<style scoped>
.notice-text :deep(h1),
.notice-text :deep(h2),
.notice-text :deep(h3) {
  font-weight: 500;
  margin: 1.5rem 0 0.5rem;
}
.notice-text :deep(h1) {
  font-size: 1.25rem;
}
.notice-text :deep(h2) {
  font-size: 1.125rem;
}
.notice-text :deep(p),
.notice-text :deep(ul),
.notice-text :deep(ol) {
  margin-bottom: 0.75rem;
}
.notice-text :deep(ul) {
  list-style: disc;
  padding-left: 1.5rem;
}
.notice-text :deep(ol) {
  list-style: decimal;
  padding-left: 1.5rem;
}
.notice-text :deep(a) {
  text-decoration: underline;
}
</style>
