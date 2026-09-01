import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Flashlight, SwitchCamera, CheckCircle, AlertCircle, Volume2, VolumeX, Sparkles, Send } from 'lucide-react';
import { i18n } from '../../services/i18nService';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
  subtitle?: string;
  continuousModeDefault?: boolean;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title,
  subtitle,
  continuousModeDefault = false
}) => {
  const [currentLang, setCurrentLang] = useState<'bn' | 'en'>(() => i18n.getLanguage());
  const [isContinuous, setIsContinuous] = useState(continuousModeDefault);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [manualInput, setManualInput] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const html5QrCodeInstanceRef = useRef<any>(null);

  const isEn = currentLang === 'en';

  useEffect(() => {
    const handleLang = () => setCurrentLang(i18n.getLanguage());
    window.addEventListener('dokan_lang_changed', handleLang);
    return () => window.removeEventListener('dokan_lang_changed', handleLang);
  }, []);

  // Web Audio Synthesizer Beep Sound on successful scan
  const playBeepSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1850, audioCtx.currentTime); // High-pitch crisp feedback beep
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio beep error:', e);
    }
  };

  const handleDetectedCode = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    playBeepSound();
    setLastScannedCode(trimmed);
    onScanSuccess(trimmed);

    if (!isContinuous) {
      cleanupScanner();
      onClose();
    }
  };

  // Start Camera Stream & Detection
  const startScanner = async (currentFacing: 'environment' | 'user' = facingMode) => {
    try {
      setErrorStatus(null);
      cleanupScanner();

      // Check for BarcodeDetector support
      const hasNativeBarcodeDetector = 'BarcodeDetector' in window;

      // 1. Get user media camera stream
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: currentFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);

        // Check torch support
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
          setHasTorch(Boolean(capabilities.torch));
        }

        // 2. Continuous scanning loop using BarcodeDetector if available
        if (hasNativeBarcodeDetector) {
          const detector = new (window as any).BarcodeDetector({
            formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'itf']
          });

          const scanFrame = async () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes && barcodes.length > 0) {
                  const rawVal = barcodes[0].rawValue;
                  if (rawVal) {
                    handleDetectedCode(rawVal);
                    // Add delay before next detection in continuous mode
                    if (isContinuous) {
                      await new Promise(r => setTimeout(r, 900));
                    }
                  }
                }
              } catch {
                // Ignore detection misses
              }
            }
            if (streamRef.current) {
              animFrameIdRef.current = requestAnimationFrame(scanFrame);
            }
          };

          animFrameIdRef.current = requestAnimationFrame(scanFrame);
        } else {
          // Fallback: Dynamically load Html5Qrcode if native detector is missing
          try {
            const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
            const containerId = 'dokan_camera_mount_container';
            const containerEl = document.getElementById(containerId);
            if (containerEl) {
              const html5Qr = new Html5Qrcode(containerId, {
                formatsToSupport: [
                  Html5QrcodeSupportedFormats.QR_CODE,
                  Html5QrcodeSupportedFormats.EAN_13,
                  Html5QrcodeSupportedFormats.EAN_8,
                  Html5QrcodeSupportedFormats.CODE_128,
                  Html5QrcodeSupportedFormats.CODE_39,
                  Html5QrcodeSupportedFormats.UPC_A,
                  Html5QrcodeSupportedFormats.UPC_E,
                  Html5QrcodeSupportedFormats.ITF,
                ],
                verbose: false
              });
              html5QrCodeInstanceRef.current = html5Qr;

              await html5Qr.start(
                { facingMode: currentFacing },
                { fps: 15, qrbox: { width: 280, height: 180 } },
                (decodedText: string) => {
                  handleDetectedCode(decodedText);
                },
                () => {}
              );
            }
          } catch (fallbackErr) {
            console.warn('Fallback scanner initialization:', fallbackErr);
          }
        }
      }
    } catch (err: any) {
      console.error('Camera stream error:', err);
      setIsScanning(false);
      setErrorStatus(
        err?.name === 'NotAllowedError' || err?.message?.includes('Permission')
          ? (isEn ? 'Camera access permission denied. Please allow camera in browser settings.' : 'ক্যামেরা ব্যবহারের পারমিশন দেওয়া হয়নি। ব্রাউজারের ক্যামেরা পারমিশন অন করুন।')
          : (isEn ? 'Unable to access camera. Please enter code manually below.' : 'ক্যামেরা চালু করা সম্ভব হয়নি। নিচে সরাসরি কোড লিখে সাবমিট করুন।')
      );
    }
  };

  const cleanupScanner = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (html5QrCodeInstanceRef.current) {
      try {
        if (html5QrCodeInstanceRef.current.isScanning) {
          html5QrCodeInstanceRef.current.stop().catch(() => {});
        }
        html5QrCodeInstanceRef.current.clear();
      } catch {}
      html5QrCodeInstanceRef.current = null;
    }
    setIsScanning(false);
    setTorchOn(false);
  };

  // Flip camera front / back
  const handleFlipCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startScanner(nextFacing);
  };

  // Torch toggle
  const handleToggleTorch = async () => {
    if (!streamRef.current || !hasTorch) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        const nextTorch = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextTorch }]
        });
        setTorchOn(nextTorch);
      }
    } catch (e) {
      console.warn('Torch toggle error:', e);
    }
  };

  // Manual fallback code submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleDetectedCode(manualInput.trim());
      setManualInput('');
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLastScannedCode(null);
      setErrorStatus(null);
      const timer = setTimeout(() => {
        startScanner(facingMode);
      }, 200);
      return () => {
        clearTimeout(timer);
        cleanupScanner();
      };
    } else {
      cleanupScanner();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={() => {
          cleanupScanner();
          onClose();
        }} 
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-slate-900 text-white rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden z-10 flex flex-col my-auto max-h-[96vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-inner">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-1.5">
                <span>{title || (isEn ? 'Live Camera Barcode Scanner' : 'ক্যামেরা বারকোড ও QR স্ক্যানার')}</span>
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400">
                {subtitle || (isEn ? 'Point camera at product barcode or IMEI' : 'পণ্যের বারকোড বা IMEI এর দিকে ক্যামেরা ধরুন')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              cleanupScanner();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Video Container */}
        <div className="relative bg-black flex items-center justify-center overflow-hidden min-h-[280px] sm:min-h-[340px]">
          
          {/* Native HTML5 Video Element */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover max-h-[360px]"
          />

          {/* Mount point for fallback */}
          <div id="dokan_camera_mount_container" className="absolute inset-0 w-full h-full pointer-events-none opacity-0" />

          {/* Aiming Reticle & Laser Scan Line */}
          {isScanning && !errorStatus && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-64 sm:w-72 h-44 sm:h-48 border-2 border-blue-400/80 rounded-2xl shadow-2xl shadow-blue-500/30 flex flex-col justify-between p-2">
                {/* 4 Corner Markers */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />

                {/* Animated Red Laser Scan Line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_12px_#f43f5e] animate-pulse my-auto" />
                
                <div className="text-center text-[10px] font-mono text-blue-200/90 bg-slate-950/80 px-2.5 py-0.5 rounded-full mx-auto backdrop-blur-xs">
                  {isEn ? 'Auto-Detecting Barcode / QR...' : 'বারকোড ডিটেক্ট হচ্ছে...'}
                </div>
              </div>
            </div>
          )}

          {/* Error Message Display */}
          {errorStatus && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-rose-200 max-w-xs">{errorStatus}</p>
              <button
                type="button"
                onClick={() => startScanner(facingMode)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                {isEn ? 'Retry Camera' : 'আবার চেষ্টা করুন'}
              </button>
            </div>
          )}
        </div>

        {/* Last Scanned Code Banner */}
        {lastScannedCode && (
          <div className="bg-emerald-950/80 border-t border-b border-emerald-500/30 px-4 py-2.5 flex items-center justify-between text-xs animate-in slide-in-from-top duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-emerald-300 block">{isEn ? 'Scanned Code' : 'স্ক্যান করা কোড'}:</span>
                <span className="font-mono font-bold text-white tracking-wider">{lastScannedCode}</span>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">
              {isEn ? 'Success' : 'সফল'}
            </span>
          </div>
        )}

        {/* Manual Fallback Input Form */}
        <form onSubmit={handleManualSubmit} className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder={isEn ? "Or enter barcode manually here..." : "অথবা এখানে সরাসরি কোড লিখে সাবমিট করুন..."}
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!manualInput.trim()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isEn ? 'Submit' : 'ইনপুট'}</span>
          </button>
        </form>

        {/* Scanner Controls Toolbar */}
        <div className="p-3 sm:p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs">
          
          {/* Left: Continuous Mode & Sound */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsContinuous(!isContinuous)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer text-[11px] ${
                isContinuous
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title={isEn ? 'Continuous scan multiple items without closing' : 'একসাথে একাধিক পণ্য স্ক্যান মোড'}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isEn ? 'Continuous' : 'ধারাবাহিক স্ক্যান'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                  : 'bg-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={soundEnabled ? (isEn ? 'Beep sound enabled' : 'বীপ সাউন্ড চালু') : (isEn ? 'Muted' : 'মিউট')}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Right: Camera Flip, Torch & Done */}
          <div className="flex items-center gap-2">
            {hasTorch && (
              <button
                type="button"
                onClick={handleToggleTorch}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  torchOn
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title={isEn ? 'Toggle Flashlight' : 'ফ্ল্যাশলাইট'}
              >
                <Flashlight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleFlipCamera}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-colors text-[11px]"
              title={isEn ? 'Flip Camera' : 'ক্যামেরা বদল'}
            >
              <SwitchCamera className="w-3.5 h-3.5 text-blue-400" />
              <span>{isEn ? 'Flip' : 'ক্যামেরা'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                cleanupScanner();
                onClose();
              }}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-bold cursor-pointer transition-colors text-[11px]"
            >
              {isEn ? 'Done' : 'সম্পন্ন'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
