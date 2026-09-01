import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, Flashlight, SwitchCamera, CheckCircle, AlertCircle, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { i18n } from '../../services/i18nService';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
  continuousModeDefault?: boolean;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title,
  continuousModeDefault = false
}) => {
  const [currentLang, setCurrentLang] = useState<'bn' | 'en'>(() => i18n.getLanguage());
  const [isContinuous, setIsContinuous] = useState(continuousModeDefault);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'dokan_camera_scanner_view';

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
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, audioCtx.currentTime); // High pitch crisp beep (A6)
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  };

  // Start Scanner function
  const startCameraScanner = async (cameraIdOrFacingMode?: string) => {
    try {
      setErrorStatus(null);
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId, {
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
      }

      // Query available video devices
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear') || d.label.toLowerCase().includes('environment'));
        const activeCamId = cameraIdOrFacingMode || (backCamera ? backCamera.id : devices[0].id);
        setSelectedCameraId(activeCamId);

        const config = {
          fps: 15,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.333,
        };

        await html5QrCodeRef.current.start(
          activeCamId,
          config,
          (decodedText: string) => {
            // Success scan callback
            playBeepSound();
            setLastScannedCode(decodedText);
            onScanSuccess(decodedText);

            if (!isContinuous) {
              stopCameraScanner();
              onClose();
            }
          },
          () => {
            // Ignore scan parse frame misses
          }
        );

        setIsScanning(true);

        // Check torch capability
        try {
          const capabilities = html5QrCodeRef.current.getRunningTrackCapabilities();
          if (capabilities && (capabilities as any).torch) {
            setHasTorch(true);
          }
        } catch {
          setHasTorch(false);
        }
      } else {
        setErrorStatus(isEn ? 'No camera device found on this device.' : 'আপনার ডিভাইসে কোনো ক্যামেরা পাওয়া যায়নি।');
      }
    } catch (err: any) {
      console.error('Camera Scanner start error:', err);
      setErrorStatus(
        err?.message?.includes('Permission') || err?.name === 'NotAllowedError'
          ? (isEn ? 'Camera access permission denied. Please allow camera access in your browser settings.' : 'ক্যামেরা ব্যবহারের অনুমতি দেওয়া হয়নি। ব্রাউজার সেটিংসে গিয়ে ক্যামেরার পারমিশন দিন।')
          : (isEn ? 'Unable to start camera scanner.' : 'ক্যামেরা স্ক্যানার চালু করা সম্ভব হয়নি।')
      );
      setIsScanning(false);
    }
  };

  // Stop Scanner function
  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
    }
    setIsScanning(false);
    setTorchOn(false);
  };

  // Switch camera toggle
  const handleSwitchCamera = async () => {
    if (cameras.length < 2) return;
    const currentIndex = cameras.findIndex(c => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamId = cameras[nextIndex].id;
    setSelectedCameraId(nextCamId);

    await stopCameraScanner();
    await startCameraScanner(nextCamId);
  };

  // Torch toggle
  const handleToggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorch) return;
    try {
      const nextTorch = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as any]
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn('Failed to toggle torch:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLastScannedCode(null);
      setErrorStatus(null);
      const timer = setTimeout(() => {
        startCameraScanner();
      }, 250);
      return () => {
        clearTimeout(timer);
        stopCameraScanner();
      };
    } else {
      stopCameraScanner();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={() => {
          stopCameraScanner();
          onClose();
        }} 
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-slate-900 text-white rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden z-10 flex flex-col my-auto max-h-[95vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-inner">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-1.5">
                <span>{title || (isEn ? 'Live Camera Barcode Scanner' : 'ক্যামেরা বারকোড ও QR স্ক্যানার')}</span>
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400">
                {isEn ? 'Position barcode inside the viewfinder box' : 'ভিউফাইন্ডারের ভেতরে বারকোড ধরুন'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCameraScanner();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewfinder Box Container */}
        <div className="relative bg-black flex items-center justify-center overflow-hidden min-h-[300px] sm:min-h-[360px]">
          
          {/* HTML5 QR Code Mount point */}
          <div id={scannerContainerId} className="w-full h-full max-h-[380px] overflow-hidden" />

          {/* Aiming Reticle & Animated Scan Line (Shown while scanning) */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-64 sm:w-72 h-44 sm:h-48 border-2 border-blue-400/70 rounded-2xl shadow-2xl shadow-blue-500/20 flex flex-col justify-between p-2">
                {/* 4 Corner Markers */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />

                {/* Animated Red/Cyan Laser Scan Line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_12px_#f43f5e] animate-pulse my-auto" />
                
                <div className="text-center text-[10px] font-mono text-blue-200/90 bg-slate-950/70 px-2 py-0.5 rounded-full mx-auto backdrop-blur-xs">
                  {isEn ? 'Auto Detecting Code...' : 'বারকোড ডিটেক্ট হচ্ছে...'}
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {errorStatus && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-rose-200 max-w-xs">{errorStatus}</p>
              <button
                type="button"
                onClick={() => startCameraScanner()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                {isEn ? 'Try Again' : 'আবার চেষ্টা করুন'}
              </button>
            </div>
          )}
        </div>

        {/* Last Scanned Code Banner Notification */}
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

        {/* Scanner Controls Toolbar */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs">
          
          {/* Left: Continuous Mode Toggle & Sound Toggle */}
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

          {/* Right: Camera Flip & Torch Toggle */}
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
                title={isEn ? 'Toggle Flashlight / Torch' : 'ফ্ল্যাশলাইট / আলো'}
              >
                <Flashlight className="w-4 h-4" />
              </button>
            )}

            {cameras.length > 1 && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-colors text-[11px]"
                title={isEn ? 'Switch Camera' : 'ক্যামেরা পরিবর্তন'}
              >
                <SwitchCamera className="w-3.5 h-3.5 text-blue-400" />
                <span>{isEn ? 'Flip Cam' : 'ক্যামেরা বদল'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                stopCameraScanner();
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
