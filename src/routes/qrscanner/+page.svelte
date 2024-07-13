<!-- <script type="module" lang="ts">
  import QrScanner from 'qr-scanner';
</script> -->
<script lang="ts">
  import { browser } from '$app/environment';
  import { onDestroy, onMount } from 'svelte';
  import QrScanner from 'qr-scanner';

  import Drawer from '$lib/components/drawer/Drawer.svelte';
  let drawerOpen = false;

  import { GEARS_ENTITY, CAMERA_FLASH_ENTITY, SUN_ENTITY } from '$lib/constants/entities';
  import SEO from '$lib/components/seo/SEO.svelte';
  const pageTitle = 'QR Scanner';
  const pageCaption = 'QR Scanner page';
  const seoProps = { pageTitle, pageCaption, slug: 'qrscanner' };

  const STORAGE_KEY = 'qr-scanner-serrings';

  const scannerStyles = [
    // Demo styles
    { className: 'default-style', name: 'Default style' },
    { className: 'example-style-1', name: 'Example custom style 1' },
    { className: 'example-style-2', name: 'Example custom style 2' }
  ];
  const scanModes = [
    { value: 'original', name: 'Scan original (dark QR code on bright background)' },
    { value: 'invert', name: 'Scan with inverted colors (bright QR code on dark background)' },
    { value: 'both', name: 'Scan both' }
  ];
  let settings = getDefaultSettings();
  const resultDisplayTime_ms = 5000; // Time to keep the scan result on page.
  const drawerAnimation_s = 0.25; // Time to animate Drawer open/close.

  let scanner: QrScanner | null = null;

  let videoElement: HTMLVideoElement | undefined;
  let camList: { value: string; name: string }[] = [];
  let camListDefault = [
    { value: 'environment', name: 'Environment Facing (default)' },
    { value: 'user', name: 'User Facing' }
  ];
  let selectCamera = camListDefault[0].value;

  let scanActive = false;
  let scanResult: string | undefined;
  let haveCamera = false;
  let haveFlash = false;
  let isFlashOn = false;
  let camQrResultMsg = '';
  let camQrResultNew = false;
  let camQrResultNewTimer: ReturnType<typeof setTimeout> | null;
  let camQrResultTimestamp: Date | null;

  function getDefaultSettings() {
    return {
      doAutoStart: true,
      doAutoStop: true,
      fakeFlash: false,
      scannerStyle: scannerStyles[2].className,
      scanMode: scanModes[0].value // QrScanner.InversionMode
    };
  }
  function getSavedOrDefaultSettings() {
    const defaultSettings = getDefaultSettings();
    let settings: ReturnType<typeof getDefaultSettings>;
    try {
      settings = JSON.parse((browser && localStorage.getItem(STORAGE_KEY)) || '');
    } catch (e) {
      settings = defaultSettings;
    }
    settings = { ...defaultSettings, ...settings };
    // console.log('DEBUG: getSavedOrDefaultSettings()', settings);
    return settings;
  }

  function setStoredSettings(settings: ReturnType<typeof getDefaultSettings> | undefined) {
    if (settings && browser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      // console.log('DEBUG: setStoredSettings()', settings);
    }
  }
  function onSettingsChange() {
    setStoredSettings(settings);
  }

  function setResultEx(timestamp: Date, value: string, newResult: boolean) {
    camQrResultTimestamp = timestamp;
    camQrResultMsg = value;
    camQrResultNew = newResult;
  }
  function clearTimer(doResetNew = true) {
    if (camQrResultNewTimer) {
      clearTimeout(camQrResultNewTimer);
      camQrResultNewTimer = null;
    }
    if (doResetNew) {
      camQrResultMsg = '';
      camQrResultNew = false;
    }
  }
  function setResult(
    result: QrScanner.ScanResult | undefined,
    error: string | Error | undefined = undefined
  ) {
    const timestamp = new Date();
    if (error) {
      scanResult = undefined;
      if (!camQrResultNew && camQrResultMsg !== error.toString()) {
        setResultEx(timestamp, error.toString(), false);
      }
    } else if (result && result.data) {
      console.log('QR Scanner: ', result.data, timestamp);
      scanResult = result.data;
      if (camQrResultMsg === result.data) {
        camQrResultTimestamp = timestamp;
      } else {
        clearTimer(false);
        setResultEx(timestamp, result.data, true);
        if (!settings.doAutoStop) {
          camQrResultNewTimer = setTimeout(clearTimer, resultDisplayTime_ms);
        }
      }
      if (settings.doAutoStop) {
        onStopClick();
      }
    }
  }

  function preloadScanner() {
    // console.log('DEBUG: in preloadScanner()');
    settings = getSavedOrDefaultSettings();

    // https://github.com/nimiq/qr-scanner
    if (videoElement) {
      // See https://w3c.github.io/picture-in-picture/#dom-htmlvideoelement-disablepictureinpicture :
      videoElement.setAttribute('disablepictureinpicture', 'true'); // Has no effect on Vivaldi (vivaldi://settings/webpages "Picture-In-Picture Button on Videos" has effect)
      videoElement.removeAttribute('controls'); // This removes "controls" boolean attribute
      scanner = new QrScanner(videoElement, (result) => setResult(result), {
        onDecodeError: (error) => setResult(undefined, error),
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: 'environment'
        // calculateScanRegion?: (video: HTMLVideoElement) => QrScanner.ScanRegion;
        // maxScansPerSecond?: number;
        // overlay?: HTMLDivElement;
        // returnDetailedScanResult?: true;
      });

      if (settings.doAutoStart) {
        onStart()?.then(() => {
          onUpdateCameraList();
        });
      } else {
        onUpdateCameraList();
      }

      // for debugging
      (window as unknown as { scanner: QrScanner | undefined }).scanner = scanner;
    }
  }
  onMount(preloadScanner);

  function unloadScanner() {
    scanner?.destroy();
    scanner = null;
  }
  onDestroy(unloadScanner);

  function onUpdateCameraList() {
    // List cameras after the scanner started to avoid listCamera's stream and the scanner's stream being requested
    // at the same time which can result in listCamera's unconstrained stream also being offered to the scanner.
    // Note that we can also start the scanner after listCameras, we just have it this way around in the demo to
    // start the scanner earlier.
    QrScanner?.hasCamera().then((hasCamera) => {
      haveCamera = hasCamera;
    });
    QrScanner?.listCameras(true).then((cameras) => {
      let pref: QrScanner.Camera | undefined;
      camList = [...camListDefault];
      cameras.forEach((camera) => {
        // Example of how to select an heuristic preferred camera
        // TODO: (when needed) convert the code to check against a list, so can keep database of special devices - mostly ones with multi-cameras need that. Also maintain a mirror flag to fix user-facing autodetection.
        if (camera.label.startsWith('camera2 0')) {
          pref = camera; // {label: 'No camera2 0 found in list', list, id: 'environment'}
        }

        camList = [...camList, { value: camera.id, name: camera.label }];
      });
      if (pref && scanner)
        // console.log('Using Camera: ', pref)
        scanner.setCamera(pref.id).then(
          () => {
            // Camera Set
          },
          (err) => {
            console.error('Failed to set camera', err); // TODO: (now) Pop a toast - permission error (and how to fix it) or no camera found.
          }
        );
    });
  }
  const updateFlashAvailability = () => {
    scanner?.hasFlash().then((hasFlash) => {
      haveFlash = hasFlash;
    });
  };

  function onStyleSelect() {
    // settings.scannerStyle = select.value;
    // reposition the highlight for cases when style sets "position: relative"
    // scanner?._updateOverlay(); // Private method. TypeScript throws warnings.
    if (typeof window === 'object') {
      // if (typeof Event === 'function') {
      //   // modern browsers
      window.dispatchEvent(new Event('resize')); // Same effect as scanner?._updateOverlay()
      // We don't care of IE anymore
      // } else {
      //   // for IE and other old browsers
      //   // causes deprecation warning on modern browsers
      //   var evt = window.document.createEvent('UIEvents');
      //   evt.initUIEvent('resize', true, false, window, 0);
      //   window.dispatchEvent(evt);
      // }
    }
    setStoredSettings(settings);
  }

  function onRegionSelect(target: HTMLInputElement) {
    const label = target.parentNode;
    if (scanner) {
      if (label) {
        label.parentNode?.insertBefore(scanner.$canvas, label.nextSibling);
      }
      scanner.$canvas.style.display = target.checked ? 'block' : 'none';
    }
  }

  function onModeSelect() {
    // settings.scanMode = target.value as QrScanner.InversionMode;
    scanner?.setInversionMode(settings.scanMode as QrScanner.InversionMode);
    setStoredSettings(settings);
  }

  function onCamSelect() {
    // selectCamera = target.value;
    scanner?.setCamera(selectCamera).then(updateFlashAvailability);
  }

  function getFlashState() {
    // if (!settings.fakeFlash || haveFlash) {
    isFlashOn = !!scanner?.isFlashOn();
    // }
  }
  function onFlash(enable: boolean | undefined = undefined) {
    if (settings.fakeFlash && !haveFlash) {
      isFlashOn = !isFlashOn;
      return;
    }
    if (scanner) {
      (enable === undefined
        ? scanner.toggleFlash.bind(scanner)
        : enable
          ? scanner.turnFlashOn.bind(scanner)
          : scanner.turnFlashOff.bind(scanner))().then(getFlashState);
    }
  }

  function onStart() {
    clearTimer();
    return scanner
      ?.start()
      .then(() => {
        scanActive = true;
        updateFlashAvailability();
      })
      .catch((e) => {
        // handle error
        console.error('Error %o in QrScanner.start()', e); // TODO: (now) Pop a toast - permission error (and how to fix it) or no camera found.
      });
  }
  function onStartClick() {
    onStart();
  }

  function onStopClick() {
    scanActive = false;
    scanner?.stop();
  }
</script>

<SEO {...seoProps} />

{#if true}
  <div class="drawerContainer" class:open={drawerOpen}>
    <Drawer
      open={drawerOpen}
      size="300px"
      duration={drawerAnimation_s}
      on:clickAway={() => (drawerOpen = false)}
      placement="right"
    >
      <button on:click={() => (drawerOpen = false)}>Close ></button>

      <div class="demo">
        <label>
          <span class="label">Highlight Style:</span>
          <select
            id="scan-region-highlight-style-select"
            bind:value={settings.scannerStyle}
            on:change={onStyleSelect}
          >
            {#each scannerStyles as s}
              <option value={s.className}>{s.name}</option>
            {/each}
          </select>
        </label>
      </div>

      <div class="demo">
        <label>
          <span class="label">Decoding Mode:</span>
          <select
            id="inversion-mode-select"
            bind:value={settings.scanMode}
            on:change={onModeSelect}
          >
            {#each scanModes as mode}
              <option value={mode.value}>{mode.name}</option>
            {/each}
          </select>
        </label>
      </div>

      <div class="demo">
        <span class="label">Device has camera:</span>
        <span>{haveCamera ? 'Yes' : 'Camera not found'}</span>
      </div>
      <div class="demo">
        <label>
          <span class="label">Preferred camera:</span>
          <select id="cam-list" bind:value={selectCamera} on:change={onCamSelect}>
            {#each camList as camera}
              <option value={camera.value}>{camera.name}</option>
            {/each}
          </select>
        </label>
      </div>
      <div class="demo">
        <span class="label">Device has flash:</span>
        <span>{haveFlash ? 'Yes' : settings.fakeFlash ? 'fakeFlash' : 'Flash not found'}</span>
      </div>

      <div class="demo">
        <span class="label">Detected QR code:</span>
        <br />
        <span id="cam-qr-result-raw">
          {scanResult ?? ''}
        </span>
        <br />
        <span id="cam-qr-result" class:new={camQrResultNew}>
          {camQrResultMsg}
        </span>
        <br />
        <span class="label">When:</span>
        <br />
        <span id="cam-qr-result-timestamp">{(camQrResultTimestamp ?? '').toString()}</span>
      </div>

      <div class="demo">
        <label>
          <input
            id="auto-start"
            type="checkbox"
            bind:checked={settings.doAutoStart}
            on:change={onSettingsChange}
          />
          <span class="label">AutoStart</span>
        </label>

        <label>
          <input
            id="auto-stop"
            type="checkbox"
            bind:checked={settings.doAutoStop}
            on:change={onSettingsChange}
          />
          <span class="label">AutoStop</span>
        </label>
      </div>

      <div class="demo">
        <label>
          <input
            id="show-scan-region"
            type="checkbox"
            on:change={(e) => onRegionSelect(e.currentTarget)}
          />
          <span class="label">Show scan region image</span>
        </label>
      </div>
    </Drawer>
  </div>
{/if}

<section id="container">
  <div id="video-container" class={settings.scannerStyle}>
    <div id="video-overlay" />
    <!-- TODO: (when needed) Use <video poster="..."></video> -->
    <video
      class:active={scanActive}
      class:inactive={!scanActive}
      bind:this={videoElement}
      id="qr-video"
      muted
      on:contextmenu={() => false}
    />
  </div>
</section>

<div id="middle">
  <div class="toolbar-left">
    {#if scanActive}
      <div>
        <button disabled={!haveFlash && !settings.fakeFlash} on:click={() => onFlash()}>
          {#if isFlashOn}
            {SUN_ENTITY}
          {:else}
            {CAMERA_FLASH_ENTITY}
          {/if}
        </button>
      </div>
    {/if}
  </div>

  <div class="middle-space">
    <div id="header">
      <h1>{pageTitle}</h1>
    </div>
    <div class="div-qr-result">
      <h2 class="qr-result" class:new={camQrResultNew}>
        {camQrResultMsg}
      </h2>
    </div>
  </div>

  <div class="toolbar-right">
    <button class="drawerBtn" on:click={() => (drawerOpen = true)}>{GEARS_ENTITY}</button>
  </div>
</div>

{#if true}
  <div id="footer">
    {#if scanner}
      {#if scanActive}
        <div class="scan-toolbar">
          <div class="stop-button">
            <button class="stop-button" on:click={onStopClick}>Stop</button>
          </div>
        </div>
      {:else}
        <div class="scan-button">
          <div>
            <button on:click={onStartClick}>Scan</button>
          </div>
        </div>
      {/if}
    {:else}
      <div>Loading...</div>
    {/if}
  </div>
{/if}

<style lang="scss">
  /* Set container to cover the whole window */
  #container {
    z-index: -300; /* Make sure to draw everything below Layout's Nav and Foot */
    position: absolute;
    left: 0;
    top: 0;
    overflow: hidden;
    min-width: 100vw;
    width: 100vw !important;
    min-height: 100vh;
    height: 100vh !important;
  }

  // #footer {}

  #header {
    h1 {
      margin: 0;
    }
  }

  #middle {
    flex-grow: 1;
    display: flex;
    flex-direction: row;

    div {
      flex: 0;
      min-width: 2.5em;
      display: flex;
      flex-direction: column;
    }
    // div.toolbar-left {}
    div.middle-space {
      text-align: center;
      flex: 1;
      display: flex;
      flex-direction: column;
      .qr-result {
        color: var(--color-text-2);
      }
      .qr-result.new {
        color: blue;
      }
    }
    // div.toolbar-right {}
  }

  .drawerContainer {
    width: 100vw;
  }
  #video-container {
    line-height: 0;
  }

  #video-overlay {
    z-index: 100;
    position: absolute;
    min-width: 100vw;
    width: 100vw !important;
    height: 100vh !important;
    display: none; /* TODO: (when needed) Use the overlay to show custom info over the video */
  }
  #qr-video {
    z-index: -200; /* Below all other elements */
    /* Set video to fill the window, no scrollbars. */
    position: absolute;
    top: 0;
    bottom: 0;
    width: 100vw !important;
    height: 100vh !important;
    object-fit: cover; /* Scale video uniformly, chop off what does not fit */
    /* object-position: top 0 left 0;  /* Can use this to shift the feed within the video frame, e.g. to compensate for cameras in the corner */
    /* background-color: black; /* Color to show before video starts. */
    pointer-events: none; /* Shut off all right-click/context menu, hover events/so pip button does not show and controls can't be enabled */
  }
  #qr-video.inactive {
    background-color: transparent; /* Color to show when not scanning */
  }

  :global(#video-container.example-style-1 .scan-region-highlight-svg),
  :global(#video-container.example-style-1 .code-outline-highlight) {
    stroke: #64a2f3 !important;
  }

  :global(#video-container.example-style-2) {
    width: max-content;
    height: max-content;
    overflow: hidden;
  }
  :global(#video-container.example-style-2 .scan-region-highlight) {
    border-radius: 30px;
    outline: rgba(255, 255, 255, 0.5) solid 50vmax; // Light theme
  }
  :global(#video-container.example-style-2 .scan-region-highlight-svg) {
    display: none;
  }
  :global(#video-container.example-style-2 .code-outline-highlight) {
    stroke-width: 15 !important;
    stroke-dasharray: none !important;
    stroke: rgba(255, 255, 255, 0.5) !important; // Light theme
  }

  #cam-qr-result {
    color: var(--color-text);
  }
  #cam-qr-result.new {
    color: blue; // Light theme
  }

  div.demo {
    margin-bottom: 16px;
  }

  .scan-button,
  .scan-toolbar {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 1em;
    div {
      flex: 1;
      button {
        width: 100%;
      }
    }
  }

  /* Drawer */
  :global(.app .drawerContainer .drawer .overlay) {
    z-index: 100;
    background: rgba(255, 255, 255, 0.5);
  }
  :global(.app .drawerContainer .drawer .panel) {
    padding: 0.5em;
    background: var(--color-bg-1);
    color: var(--color-text);
  }
  :global(:root[color-scheme='dark']) {
    // Dark Theme
    :global(#video-container.example-style-2 .scan-region-highlight) {
      outline: rgba(0, 0, 0, 0.5) solid 50vmax;
    }
    :global(#video-container.example-style-2 .code-outline-highlight) {
      stroke: rgba(0, 0, 0, 0.5) !important;
    }
    #middle div.middle-space .qr-result.new,
    #cam-qr-result.new {
      color: #a0a0ff;
    }
    :global(.app .drawerContainer .drawer .overlay) {
      background: rgba(0, 0, 0, 0.5);
    }
  }

  /* Set z-index of all overlapping elements */
  :global(.app .drawerContainer),
  :global(.app .drawerContainer .drawer .panel) {
    z-index: 2000;
  }
  // :global(.app .drawerContainer .drawer) {}
  // :global(.app .drawerContainer.open .drawer) {}

  // #header,
  #footer,
  #middle,
  #footer .scan-button,
  #footer .scan-button *,
  #footer .scan-toolbar,
  #footer .scan-toolbar * {
    z-index: 1000;
  }
  #video-container,
  :global(#video-container .scan-region-highlight) {
    z-index: -100;
  }
  /* Hide controls if they somehow show */
  #video-container :global(video::-webkit-media-controls) {
    display: none !important;
  }
</style>
