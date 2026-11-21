(function (globalScope, factory) {
  'use strict';

  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  globalScope.SilentLibretto = api;

  if (typeof document !== 'undefined') {
    const start = () => document.querySelectorAll('[data-silent-libretto]').forEach(api.init);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function clamp(value, minimum, maximum) {
    return Math.min(Math.max(Number(value) || 0, minimum), maximum);
  }

  function formatTime(value) {
    const seconds = Math.max(0, Math.floor(Number(value) || 0));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function passageIndex(passages, time) {
    const position = Number(time) || 0;
    const index = passages.findIndex((passage) => (
      position >= Number(passage.start) && position < Number(passage.end)
    ));

    if (index >= 0) return index;

    const lastIndex = passages.length - 1;
    if (lastIndex >= 0 && position === Number(passages[lastIndex].end)) return lastIndex;
    return -1;
  }

  function passageProgress(passages, index, time) {
    if (index < 0 || !passages[index]) return 0;

    const passage = passages[index];
    const start = Number(passage.start);
    const length = Number(passage.end) - start;
    if (length <= 0) return 100;
    return clamp(((Number(time) - start) / length) * 100, 0, 100);
  }

  function previousPassageStart(passages, time) {
    if (!passages.length) return 0;

    let index = passageIndex(passages, time);
    if (index < 0 && Number(time) >= Number(passages[passages.length - 1].end)) {
      index = passages.length - 1;
    }
    if (index <= 0) return 0;
    return Number(passages[index - 1].start);
  }

  async function downloadAudioBlob(url, onProgress, fetchImplementation) {
    const request = fetchImplementation || (
      typeof fetch === 'function' ? fetch.bind(globalThis) : null
    );
    if (!request) throw new Error('Audio downloads are not supported in this browser.');

    const response = await request(url, { cache: 'force-cache' });
    if (!response.ok) throw new Error('Audio download failed with status ' + response.status + '.');

    const report = typeof onProgress === 'function' ? onProgress : () => {};
    const total = Number(response.headers.get('Content-Length')) || 0;

    if (!response.body || typeof response.body.getReader !== 'function') {
      const blob = await response.blob();
      report(1, blob.size, blob.size);
      return blob;
    }

    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;

    while (true) {
      const result = await reader.read();
      if (result.done) break;
      chunks.push(result.value);
      received += result.value.byteLength;
      report(total > 0 ? clamp(received / total, 0, 1) : null, received, total);
    }

    report(1, received, total || received);
    return new Blob(chunks, {
      type: response.headers.get('Content-Type') || 'audio/mpeg',
    });
  }

  function init(player) {
    if (!player || player.dataset.librettoReady === 'true') return null;

    const audio = player.querySelector('[data-libretto-audio]');
    const passageData = player.querySelector('[data-libretto-passages]');
    const line = player.querySelector('[data-libretto-line]');
    const intro = player.querySelector('[data-libretto-intro]');
    const cue = player.querySelector('[data-libretto-cue]');
    const progress = player.querySelector('[data-libretto-progress]');
    const currentTime = player.querySelector('[data-libretto-current]');
    const playButton = player.querySelector('[data-libretto-play]');
    const previousButton = player.querySelector('[data-libretto-previous]');
    const fullscreenButton = player.querySelector('[data-libretto-fullscreen]');
    const status = player.querySelector('[data-libretto-status]');
    const openButton = player.querySelector('[data-libretto-transcript-open]');
    const closeButton = player.querySelector('[data-libretto-transcript-close]');
    const transcript = player.querySelector('[data-libretto-transcript]');
    const transcriptList = player.querySelector('[data-libretto-transcript-list]');

    if (!audio || !passageData || !line || !progress || !playButton || !previousButton) return null;

    let passages;
    try {
      passages = JSON.parse(passageData.textContent);
    } catch (error) {
      if (status) status.textContent = 'The timed story could not be loaded.';
      return null;
    }

    const authoredDuration = Number(player.dataset.duration) || Number(progress.max) || 0;
    const title = player.dataset.title || 'this performance';
    const audioSource = audio.dataset.src;
    const readyIntro = intro ? intro.textContent : '';
    let activeIndex = -1;
    let frameId = null;
    let hasStarted = false;
    let transcriptOpener = null;
    let fallbackFullscreen = false;
    let audioReady = false;
    let audioLoading = false;
    let audioLoadFailed = false;
    let audioObjectUrl = null;
    let lastDownloadPercent = -1;

    player.dataset.librettoReady = 'true';

    function duration() {
      return Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : authoredDuration;
    }

    function setProgress(position) {
      const total = duration();
      const safePosition = clamp(position, 0, total);
      const percent = total > 0 ? (safePosition / total) * 100 : 0;

      progress.max = String(total || authoredDuration);
      progress.value = String(safePosition);
      progress.style.setProperty('--libretto-progress', `${percent}%`);
      progress.setAttribute('aria-valuetext', `${formatTime(safePosition)} of ${formatTime(total)}`);
      if (currentTime) currentTime.textContent = formatTime(safePosition);
    }

    function setTranscriptAvailability(ready) {
      if (!transcriptList) return;
      transcriptList.querySelectorAll('[data-passage-index]').forEach((button) => {
        if (ready) button.removeAttribute('aria-disabled');
        else button.setAttribute('aria-disabled', 'true');
      });
    }

    function setDownloadProgress(fraction) {
      const hasPercentage = Number.isFinite(fraction);
      const percent = hasPercentage ? Math.round(clamp(fraction, 0, 1) * 100) : null;
      if (percent === lastDownloadPercent) return;
      lastDownloadPercent = percent;

      const label = percent === null ? 'Loading…' : 'Loading ' + percent + '%';
      playButton.textContent = label;
      playButton.setAttribute('aria-label', label + ' ' + title);
      progress.style.setProperty('--libretto-progress', (percent || 0) + '%');
      progress.setAttribute('aria-valuetext', percent === null ? 'Loading music' : 'Music ' + percent + '% loaded');
      if (intro && !hasStarted) intro.textContent = 'Loading the music…';
    }

    function waitForBlobSource(blob) {
      return new Promise((resolve, reject) => {
        const cleanup = () => {
          audio.removeEventListener('canplay', handleReady);
          audio.removeEventListener('error', handleError);
        };
        const handleReady = () => {
          cleanup();
          resolve();
        };
        const handleError = () => {
          cleanup();
          reject(new Error('The downloaded audio could not be decoded.'));
        };

        audio.addEventListener('canplay', handleReady, { once: true });
        audio.addEventListener('error', handleError, { once: true });
        if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl);
        audioObjectUrl = URL.createObjectURL(blob);
        audio.src = audioObjectUrl;
        audio.load();
      });
    }

    async function loadAudio() {
      if (audioLoading || audioReady) return;

      audioLoading = true;
      audioLoadFailed = false;
      lastDownloadPercent = -1;
      player.setAttribute('aria-busy', 'true');
      playButton.disabled = true;
      previousButton.disabled = true;
      progress.disabled = true;
      setTranscriptAvailability(false);
      setDownloadProgress(null);
      if (status) status.textContent = 'Loading the complete recording.';

      try {
        if (!audioSource) throw new Error('The audio source is missing.');
        const blob = await downloadAudioBlob(audioSource, setDownloadProgress);
        await waitForBlobSource(blob);

        audioReady = true;
        playButton.disabled = false;
        previousButton.disabled = false;
        progress.disabled = false;
        playButton.textContent = 'Play';
        playButton.setAttribute('aria-label', 'Play ' + title);
        player.setAttribute('aria-busy', 'false');
        setTranscriptAvailability(true);
        if (intro && !hasStarted) intro.textContent = readyIntro;
        if (status) status.textContent = 'The complete recording is ready to play.';
        setProgress(0);
      } catch (error) {
        audioLoadFailed = true;
        playButton.disabled = false;
        playButton.textContent = 'Retry';
        playButton.setAttribute('aria-label', 'Retry loading ' + title);
        player.setAttribute('aria-busy', 'false');
        progress.style.setProperty('--libretto-progress', '0%');
        progress.setAttribute('aria-valuetext', 'Music failed to load');
        if (intro && !hasStarted) intro.textContent = 'The music could not load. Try again.';
        if (status) status.textContent = 'The music could not load. Use Retry to try again.';
      } finally {
        audioLoading = false;
      }
    }

    function setPassageProgress(index, position) {
      const percent = audio.ended ? 100 : passageProgress(passages, index, position);
      line.style.setProperty('--scene-progress', `${percent}%`);
      line.setAttribute('data-scene-progress', String(Math.round(percent)));
    }

    function markTranscript(index) {
      if (!transcriptList) return;

      transcriptList.querySelectorAll('[data-passage-index]').forEach((button) => {
        const isActive = Number(button.dataset.passageIndex) === index;
        button.classList.toggle('is-active', isActive);
        if (isActive) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
      });
    }

    function showPassage(index, force) {
      if (!hasStarted && audio.currentTime === 0) return;
      if (index < 0 || (!force && index === activeIndex)) return;

      activeIndex = index;
      const passage = passages[index];
      const total = passages.length;

      if (intro) intro.hidden = true;
      line.classList.remove('is-visible');
      line.textContent = passage.text;
      if (cue) cue.textContent = `Scene ${String(index + 1).padStart(2, '0')} / ${total}`;

      void line.offsetWidth;
      line.classList.add('is-visible');
      markTranscript(index);
    }

    function render(force) {
      const position = audio.currentTime || 0;
      const index = passageIndex(passages, position);
      setProgress(position);
      showPassage(index, Boolean(force));
      setPassageProgress(index, position);
    }

    function stopFrameLoop() {
      if (frameId !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(frameId);
      }
      frameId = null;
    }

    function frameLoop() {
      render(false);
      if (!audio.paused && !audio.ended && typeof requestAnimationFrame === 'function') {
        frameId = requestAnimationFrame(frameLoop);
      } else {
        frameId = null;
      }
    }

    function startFrameLoop() {
      stopFrameLoop();
      if (typeof requestAnimationFrame === 'function') frameId = requestAnimationFrame(frameLoop);
    }

    function seek(value) {
      if (!audioReady) return;
      hasStarted = true;
      audio.currentTime = clamp(value, 0, duration());
      render(true);
    }

    function previousPassage() {
      seek(previousPassageStart(passages, audio.currentTime || 0));
    }

    function play() {
      if (!audioReady) return;
      hasStarted = true;
      if (audio.ended) seek(0);
      const promise = audio.play();

      if (promise && typeof promise.catch === 'function') {
        promise.catch(() => {
          if (status) status.textContent = 'Playback could not start. Please try the Play button again.';
        });
      }
    }

    function togglePlayback() {
      if (audioLoadFailed) {
        loadAudio();
        return;
      }
      if (!audioReady) return;
      if (audio.paused || audio.ended) play();
      else audio.pause();
    }

    function openTranscript() {
      transcriptOpener = document.activeElement;
      if (typeof transcript.showModal === 'function') transcript.showModal();
      else transcript.setAttribute('open', '');
      closeButton.focus();
    }

    function closeTranscript() {
      if (typeof transcript.close === 'function') transcript.close();
      else transcript.removeAttribute('open');
      if (transcriptOpener && typeof transcriptOpener.focus === 'function') transcriptOpener.focus();
    }

    function fullscreenActive() {
      return document.fullscreenElement === player || fallbackFullscreen;
    }

    function updateFullscreenButton() {
      if (!fullscreenButton) return;
      const active = fullscreenActive();
      fullscreenButton.textContent = active ? 'Exit full screen' : 'Full screen';
      fullscreenButton.setAttribute('aria-pressed', String(active));
    }

    function enterFallbackFullscreen() {
      fallbackFullscreen = true;
      player.classList.add('is-fullscreen-fallback');
      document.body.classList.add('has-libretto-fullscreen');
      updateFullscreenButton();
    }

    function exitFallbackFullscreen() {
      fallbackFullscreen = false;
      player.classList.remove('is-fullscreen-fallback');
      document.body.classList.remove('has-libretto-fullscreen');
      updateFullscreenButton();
    }

    async function toggleFullscreen() {
      if (fallbackFullscreen) {
        exitFallbackFullscreen();
        return;
      }

      try {
        if (document.fullscreenElement === player) {
          await document.exitFullscreen();
        } else if (typeof player.requestFullscreen === 'function') {
          await player.requestFullscreen();
        } else {
          enterFallbackFullscreen();
        }
      } catch (error) {
        enterFallbackFullscreen();
      }
      updateFullscreenButton();
    }

    function fitToViewport() {
      if (fullscreenActive()) return;
      const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const top = Math.max(0, player.getBoundingClientRect().top);
      const availableHeight = Math.max(480, Math.floor(viewportHeight - top - 8));
      player.style.setProperty('--libretto-available-height', `${availableHeight}px`);
    }

    passages.forEach((passage, index) => {
      if (!transcriptList) return;

      const item = document.createElement('li');
      const button = document.createElement('button');
      const when = document.createElement('span');
      const text = document.createElement('span');

      button.type = 'button';
      button.className = 'libretto-transcript__jump';
      button.dataset.passageIndex = String(index);
      button.setAttribute('aria-label', `Jump to ${formatTime(passage.start)}: ${passage.text}`);
      button.setAttribute('aria-disabled', 'true');
      when.className = 'libretto-transcript__time';
      when.textContent = formatTime(passage.start);
      text.textContent = passage.text;
      button.append(when, text);
      button.addEventListener('click', () => {
        if (!audioReady) return;
        seek(passage.start);
        closeTranscript();
        play();
      });
      item.append(button);
      transcriptList.append(item);
    });

    playButton.addEventListener('click', togglePlayback);
    previousButton.addEventListener('click', previousPassage);
    progress.addEventListener('input', (event) => seek(event.target.value));
    openButton.addEventListener('click', openTranscript);
    closeButton.addEventListener('click', closeTranscript);
    if (fullscreenButton) fullscreenButton.addEventListener('click', toggleFullscreen);

    player.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && fallbackFullscreen) {
        event.preventDefault();
        exitFallbackFullscreen();
        return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (transcript && transcript.open) return;

      const target = event.target;
      const isInteractive = target.matches('button, input, a, select, textarea');
      if (isInteractive) return;

      if (event.code === 'Space') {
        event.preventDefault();
        togglePlayback();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        seek((audio.currentTime || 0) - 5);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        seek((audio.currentTime || 0) + 5);
      }
    });

    audio.addEventListener('play', () => {
      hasStarted = true;
      playButton.textContent = 'Pause';
      playButton.setAttribute('aria-label', `Pause ${title}`);
      if (status) status.textContent = 'Playback started.';
      render(true);
      startFrameLoop();
    });

    audio.addEventListener('pause', () => {
      if (!audioReady) return;
      if (!audio.ended) {
        playButton.textContent = 'Play';
        playButton.setAttribute('aria-label', `Resume ${title}`);
      }
      stopFrameLoop();
      render(false);
    });

    audio.addEventListener('ended', () => {
      playButton.textContent = 'Replay';
      playButton.setAttribute('aria-label', `Replay ${title}`);
      if (status) status.textContent = 'The performance has ended.';
      stopFrameLoop();
      render(true);
    });

    ['timeupdate', 'seeking', 'seeked', 'loadedmetadata', 'durationchange'].forEach((eventName) => {
      audio.addEventListener(eventName, () => { if (audioReady) render(eventName === 'seeked'); });
    });

    audio.addEventListener('error', () => {
      if (audioReady && status) status.textContent = 'The audio could not be played.';
    });

    document.addEventListener('fullscreenchange', updateFullscreenButton);
    window.addEventListener('resize', fitToViewport, { passive: true });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', fitToViewport, { passive: true });
    window.addEventListener('beforeunload', () => {
      if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl);
    }, { once: true });

    fitToViewport();
    render(false);
    loadAudio();

    return { render, seek, previousPassage, togglePlayback, toggleFullscreen, loadAudio, passages };
  }

  return { clamp, formatTime, passageIndex, passageProgress, previousPassageStart, downloadAudioBlob, init };
});
