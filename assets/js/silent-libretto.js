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
    const backButton = player.querySelector('[data-libretto-back]');
    const status = player.querySelector('[data-libretto-status]');
    const openButton = player.querySelector('[data-libretto-transcript-open]');
    const closeButton = player.querySelector('[data-libretto-transcript-close]');
    const transcript = player.querySelector('[data-libretto-transcript]');
    const transcriptList = player.querySelector('[data-libretto-transcript-list]');

    if (!audio || !passageData || !line || !progress || !playButton) return null;

    let passages;
    try {
      passages = JSON.parse(passageData.textContent);
    } catch (error) {
      if (status) status.textContent = 'The timed story could not be loaded.';
      return null;
    }

    const authoredDuration = Number(player.dataset.duration) || Number(progress.max) || 0;
    const title = player.dataset.title || 'this performance';
    let activeIndex = -1;
    let frameId = null;
    let hasStarted = false;
    let transcriptOpener = null;

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
      if (cue) {
        cue.textContent = `Scene ${String(index + 1).padStart(2, '0')} / ${total} · ${formatTime(passage.start)}–${formatTime(passage.end)}`;
      }

      // Restart only the restrained fade when a new passage arrives.
      void line.offsetWidth;
      line.classList.add('is-visible');
      markTranscript(index);
    }

    function render(force) {
      const position = audio.currentTime || 0;
      setProgress(position);
      showPassage(passageIndex(passages, position), Boolean(force));
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
      hasStarted = true;
      audio.currentTime = clamp(value, 0, duration());
      render(true);
    }

    function play() {
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
      when.className = 'libretto-transcript__time';
      when.textContent = formatTime(passage.start);
      text.textContent = passage.text;
      button.append(when, text);
      button.addEventListener('click', () => {
        seek(passage.start);
        closeTranscript();
        play();
      });
      item.append(button);
      transcriptList.append(item);
    });

    playButton.addEventListener('click', togglePlayback);
    backButton.addEventListener('click', () => seek((audio.currentTime || 0) - 10));
    progress.addEventListener('input', (event) => seek(event.target.value));
    openButton.addEventListener('click', openTranscript);
    closeButton.addEventListener('click', closeTranscript);

    player.addEventListener('keydown', (event) => {
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
      audio.addEventListener(eventName, () => render(eventName === 'seeked'));
    });

    audio.addEventListener('error', () => {
      if (status) status.textContent = 'The audio could not be loaded.';
    });

    render(false);

    return { render, seek, togglePlayback, passages };
  }

  return { clamp, formatTime, passageIndex, init };
});
