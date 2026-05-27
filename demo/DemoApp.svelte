<script lang="ts">
  import SplatWallpaperLayer from '../src/components/SplatWallpaperLayer.svelte';

  const defaultPly =
    import.meta.env.VITE_DEMO_PLY_URL?.trim() || '/ply/demo.compressed.ply';

  let plyUrl = $state(defaultPly);
  let poster = $state<string | null>(null);
  let speed = $state(1);
  let status = $state<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  let statusMsg = $state('');

  $effect(() => {
    document.body.classList.toggle('ply-wallpaper-active', status === 'ready');
    return () => document.body.classList.remove('ply-wallpaper-active');
  });
</script>

<div class="demo-root">
  <SplatWallpaperLayer
    {plyUrl}
    {poster}
    {speed}
    onStatus={(s, msg) => {
      status = s;
      statusMsg = msg ?? '';
    }}
  />

  <div class="demo-hud">
    <h1>GS Ambient Wallpaper</h1>
    <p>
      Full-screen 3D Gaussian Splatting background. Desktop uses WebGL; mobile falls back to
      poster when provided.
    </p>

    <div class="demo-panel gs-glass-panel">
      <label for="ply-url">PLY / SOG URL</label>
      <input id="ply-url" type="text" bind:value={plyUrl} spellcheck="false" />
    </div>

    <div class="demo-panel gs-glass-panel">
      <label for="poster-url">Poster URL (optional)</label>
      <input id="poster-url" type="text" bind:value={poster} placeholder="/poster.jpg" />
    </div>

    <div class="demo-panel gs-glass-panel">
      <label for="speed">Parallax speed: {speed.toFixed(2)}</label>
      <input id="speed" type="range" min="0.2" max="2" step="0.1" bind:value={speed} />
    </div>

    <p class="demo-status">Status: {status}{statusMsg ? ` — ${statusMsg}` : ''}</p>
  </div>
</div>
