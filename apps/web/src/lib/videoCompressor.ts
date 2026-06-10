/**
 * Lightweight browser-native video compressor using Canvas rendering and MediaRecorder.
 * Downscales videos exceeding 720p down to a viewable 720p format, retaining original aspect ratio.
 */
export const compressVideo = (
  file: File,
  progressCallback?: (progress: number) => void
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = false;
    video.playsInline = true;
    // Prevent rendering issues
    video.crossOrigin = 'anonymous';

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video file for compression.'));
    };

    video.onloadedmetadata = () => {
      let width = video.videoWidth;
      let height = video.videoHeight;
      const duration = video.duration;

      // Limit resolution to a maximum of 1280px on the longest dimension (720p baseline)
      const maxDim = Math.max(width, height);
      if (maxDim > 1280) {
        const scale = 1280 / maxDim;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      // Ensure dimensions are even numbers (required by many video encoders)
      if (width % 2 !== 0) width--;
      if (height % 2 !== 0) height--;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx2d = canvas.getContext('2d');

      if (!ctx2d) {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to initialize canvas context.'));
        return;
      }

      // Capture canvas stream at 30 fps
      const fps = 30;
      const canvasStream = (canvas as any).captureStream
        ? (canvas as any).captureStream(fps)
        : (canvas as any).mozCaptureStream
        ? (canvas as any).mozCaptureStream(fps)
        : null;

      if (!canvasStream) {
        URL.revokeObjectURL(video.src);
        reject(new Error('Canvas stream capture is not supported by this browser.'));
        return;
      }

      // Capture audio from video element using Web Audio API if audio tracks exist
      let hasAudio = false;
      let audioTracks: MediaStreamTrack[] = [];
      let audioCtx: AudioContext | null = null;
      let audioSource = null;
      let audioDest = null;

      try {
        // Create a temporary stream to verify audio tracks existence
        const tempStream = (video as any).captureStream 
          ? (video as any).captureStream() 
          : (video as any).mozCaptureStream 
          ? (video as any).mozCaptureStream() 
          : null;

        if (tempStream && tempStream.getAudioTracks().length > 0) {
          hasAudio = true;
        }
      } catch (e) {
        // Fallback checks
        hasAudio = true; // Assume audio, catch routing error below if it fails
      }

      if (hasAudio) {
        try {
          audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioSource = audioCtx.createMediaElementSource(video);
          audioDest = audioCtx.createMediaStreamDestination();
          audioSource.connect(audioDest);
          // Connect to destination to enable audio encoding without speaker playback (silence)
          audioTracks = audioDest.stream.getAudioTracks();
        } catch (e) {
          console.warn('Audio context routing failed, proceeding with video only', e);
          hasAudio = false;
        }
      }

      // Combine video tracks and audio tracks
      const videoTracks = canvasStream.getVideoTracks();
      const combinedTracks = [...videoTracks, ...audioTracks];
      const recordStream = new MediaStream(combinedTracks);

      // Determine the best supported mimeType
      let mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=h264,opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4;codecs=avc1.42401F,mp4a.40.2';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(recordStream, {
          mimeType,
          videoBitsPerSecond: 1500000, // 1.5 Mbps target bitrate for viewable 720p
        });
      } catch (e) {
        URL.revokeObjectURL(video.src);
        if (audioCtx) audioCtx.close();
        reject(new Error('Failed to create MediaRecorder for target format.'));
        return;
      }

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      let intervalId: any;

      recorder.onstop = () => {
        clearInterval(intervalId);
        const blob = new Blob(chunks, { type: mimeType });
        const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
        
        // Generate new compressed file
        const originalNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        const compressedFile = new File(
          [blob],
          `${originalNameWithoutExt}_compressed.${extension}`,
          {
            type: mimeType,
            lastModified: Date.now(),
          }
        );

        // Cleanup resources
        URL.revokeObjectURL(video.src);
        if (audioCtx) {
          audioCtx.close();
        }
        resolve(compressedFile);
      };

      // Set up frame drawer interval
      const drawFrame = () => {
        ctx2d.drawImage(video, 0, 0, width, height);
        if (progressCallback && duration) {
          const pct = Math.min(99, Math.round((video.currentTime / duration) * 100));
          progressCallback(pct);
        }
      };

      // Start compression playback
      video.play()
        .then(() => {
          recorder.start(100); // slice data every 100ms
          intervalId = setInterval(() => {
            if (video.paused || video.ended) {
              clearInterval(intervalId);
              return;
            }
            drawFrame();
          }, 1000 / fps);
        })
        .catch((err) => {
          URL.revokeObjectURL(video.src);
          if (audioCtx) audioCtx.close();
          reject(new Error('Failed to play video for encoding.'));
        });

      video.onended = () => {
        clearInterval(intervalId);
        if (progressCallback) progressCallback(100);
        recorder.stop();
      };

      video.onerror = () => {
        clearInterval(intervalId);
        recorder.stop();
        reject(new Error('Video playback interrupted during encoding.'));
      };
    };
  });
};
