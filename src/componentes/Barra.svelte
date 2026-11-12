<script lang="ts">
  let { valor, color, alto = '0.45rem', etiqueta }: { valor: number; color?: string; alto?: string; etiqueta?: string } = $props();
  const pct = $derived(Math.round(Math.min(1, Math.max(0, valor)) * 100));
</script>

<div class="barra" style:height={alto} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={etiqueta}>
  <span style:width="{pct}%" style:--color={color}></span>
</div>
