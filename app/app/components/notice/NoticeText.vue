<script setup lang="ts">
import MarkdownIt from 'markdown-it'

// headingLevel: the HTML level of a top heading (#) of the text, so its
// headings follow the ones of the page
const props = withDefaults(defineProps<{ markdown: string; headingLevel?: number }>(), { headingLevel: 3 })

// html: false escapes any HTML in the text, so v-html shows only the
// elements generated from Markdown
const md = new MarkdownIt({ html: false, linkify: true, breaks: true })

md.core.ruler.push('shift_headings', (state) => {
  for (const token of state.tokens) {
    if (token.type === 'heading_open' || token.type === 'heading_close') {
      const level = Math.min(Number(token.tag.slice(1)) + props.headingLevel - 1, 6)
      token.tag = `h${level}`
    }
  }
})

const html = computed(() => md.render(props.markdown))
</script>

<!-- Text written by the DPO: it can use bold and the other Markdown styles,
     outside the design system rules -->
<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="notice-text" v-html="html" />
</template>

<style scoped>
.notice-text :deep(h3),
.notice-text :deep(h4),
.notice-text :deep(h5),
.notice-text :deep(h6) {
  font-weight: 500;
  margin: 1.5rem 0 0.5rem;
}
.notice-text :deep(h3) {
  font-size: 1.25rem;
}
.notice-text :deep(h4) {
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
