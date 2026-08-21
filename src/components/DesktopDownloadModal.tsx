import React, { useState, useEffect } from "react";
import {
  Download,
  Monitor,
  CheckCircle2,
  Copy,
  ExternalLink,
  Laptop,
  Apple,
  Sparkles,
  Zap,
  Shield,
  Layers,
  ArrowRight,
  HelpCircle,
  FileCode,
  X,
  Share2
} from "lucide-react";

interface DesktopDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any; // BeforeInstallPromptEvent
  onInstalled?: () => void;
}

export const DesktopDownloadModal: React.FC<DesktopDownloadModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalled
}) => {
  const [activeTab, setActiveTab] = useState<"auto" | "windows" | "mac" | "shortcuts">("auto");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [detectedOs, setDetectedOs] = useState<"windows" | "mac" | "linux" | "other">("windows");

  useEffect(() => {
    // Detect user OS
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (userAgent.includes("win")) {
        setDetectedOs("windows");
      } else if (userAgent.includes("mac")) {
        setDetectedOs("mac");
      } else if (userAgent.includes("linux")) {
        setDetectedOs("linux");
      } else {
        setDetectedOs("other");
      }
    }
  }, []);

  if (!isOpen) return null;

  const currentAppUrl = typeof window !== "undefined" ? window.location.href : "https://partssource.co.za";

  // Handle native PWA install prompt
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If deferredPrompt not available, switch to step-by-step guidance
      setActiveTab(detectedOs === "mac" ? "mac" : "windows");
      return;
    }

    try {
      setIsInstalling(true);
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setInstallSuccess(true);
        if (onInstalled) onInstalled();
      }
    } catch (err) {
      console.error("Install prompt error:", err);
    } finally {
      setIsInstalling(false);
    }
  };

  // Copy app URL to clipboard
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentAppUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  // Generate & Download Windows Desktop Shortcut (.url file)
  const handleDownloadWindowsShortcut = () => {
    const shortcutContent = `[InternetShortcut]\nURL=${currentAppUrl}\nIconIndex=0\nIconFile=${window.location.origin}/icon.svg\n[{000214A0-0000-0000-C000-000000000046}]\nProp3=19,0\n`;
    const blob = new Blob([shortcutContent], { type: "application/internet-shortcut" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Partssource ZA.url";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate & Download Windows Dedicated App Window Launcher (.bat script)
  const handleDownloadWindowsBatLauncher = () => {
    const batContent = `@echo off\r\n` +
      `:: Partssource ZA Desktop App Launcher\r\n` +
      `title Launching Partssource ZA...\r\n` +
      `start msedge --app="${currentAppUrl}" 2>nul || start chrome --app="${currentAppUrl}" 2>nul || start "" "${currentAppUrl}"\r\n` +
      `exit\r\n`;
    const blob = new Blob([batContent], { type: "application/x-bat" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Launch Partssource ZA Desktop.bat";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate & Download Linux .desktop launcher
  const handleDownloadLinuxDesktop = () => {
    const desktopContent = `[Desktop Entry]\n` +
      `Version=1.0\n` +
      `Type=Application\n` +
      `Name=Partssource ZA\n` +
      `Comment=South African Truck & Car Spares Network\n` +
      `Exec=xdg-open "${currentAppUrl}"\n` +
      `Icon=applications-internet\n` +
      `Terminal=false\n` +
      `Categories=Network;WebBrowser;\n`;
    const blob = new Blob([desktopContent], { type: "application/x-desktop" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Partssource_ZA.desktop";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-6 sm:p-7 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-600/30 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4 relative z-10">
            {/* App Icon preview */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-0.5 shadow-lg shadow-blue-600/30 flex items-center justify-center shrink-0 border border-blue-400/40">
              <div className="w-8 h-8 sm:w-9 sm:h-9 border-2 border-white rotate-45 flex items-center justify-center">
                <div className="w-3 h-3 bg-amber-400 rotate-45" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                  Native Desktop App
                </span>
                <span className="text-blue-300 text-xs font-semibold">
                  Windows • macOS • Linux
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
                Download Partssource ZA to Desktop
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Install as a standalone desktop application with instant 1-click dock access, real-time parts request alerts, and no browser tab clutter.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-2.5 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab("auto")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "auto"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>1-Click Install</span>
          </button>

          <button
            onClick={() => setActiveTab("windows")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "windows"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            <Laptop className="w-3.5 h-3.5 text-blue-500" />
            <span>Windows (Chrome / Edge)</span>
          </button>

          <button
            onClick={() => setActiveTab("mac")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "mac"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            <Apple className="w-3.5 h-3.5 text-slate-700" />
            <span>Mac (Safari / Chrome)</span>
          </button>

          <button
            onClick={() => setActiveTab("shortcuts")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "shortcuts"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-600" />
            <span>Desktop Shortcuts (.url / .bat)</span>
          </button>
        </div>

        {/* Modal Main Content Body */}
        <div className="p-6 sm:p-7 space-y-6">
          {/* TAB 1: 1-Click Install & Overview */}
          {activeTab === "auto" && (
            <div className="space-y-6 animate-fade-in">
              {installSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                  <h3 className="text-lg font-black text-emerald-950 font-display">
                    Partssource ZA Successfully Installed!
                  </h3>
                  <p className="text-xs text-emerald-800 max-w-md mx-auto">
                    You can now find Partssource ZA in your desktop applications list, Start Menu, or Mac Launchpad.
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/40 border border-blue-200/80 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-blue-600" />
                        <h3 className="text-base font-black text-slate-900 font-display">
                          Direct Browser App Installation
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Click below to launch the native Progressive Web App desktop installer.
                      </p>
                    </div>

                    <button
                      onClick={handleInstallClick}
                      disabled={isInstalling}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-black text-xs px-6 py-3.5 rounded-2xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      <span>{deferredPrompt ? "Install Desktop App Now" : "Launch Install Guide"}</span>
                    </button>
                  </div>

                  {!deferredPrompt && (
                    <div className="pt-2 border-t border-blue-200/60 text-xs text-slate-500 flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        If the automatic prompt is not shown in this preview window, use the <strong>Windows</strong> or <strong>Mac</strong> tab above for 2-second browser menu install instructions.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Desktop Benefits Bento Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm">
                    ⚡
                  </div>
                  <h4 className="text-xs font-black text-slate-900">Taskbar & Dock Launch</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Pin directly to your Windows Taskbar or Mac Dock for 1-click startup.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-sm">
                    💬
                  </div>
                  <h4 className="text-xs font-black text-slate-900">WhatsApp & Leads Fast</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Direct lead routing to scrap yard sellers and fast quote replies.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-sm">
                    🛡️
                  </div>
                  <h4 className="text-xs font-black text-slate-900">Zero Browser Clutter</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Clean, dedicated window with no URL bar, extra tabs, or distractions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Windows Chrome & Edge Step-by-Step */}
          {activeTab === "windows" && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    How to Install on Windows (Google Chrome / MS Edge)
                  </h3>
                </div>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-900 block">Look at the browser address bar (top right):</strong>
                      <span>
                        Click the <strong>"Install Partssource ZA"</strong> monitor icon with a down arrow located inside your browser's URL address bar.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-900 block">Or use the 3-dots Menu:</strong>
                      <span>
                        In Chrome: Click <strong>⋮ (Menu)</strong> &rarr; <strong>"Cast, save, and share"</strong> (or "Install and Save") &rarr; Click <strong>"Install Partssource ZA..."</strong>.
                      </span>
                      <span className="block mt-1 text-slate-500">
                        In Edge: Click <strong>... (Settings)</strong> &rarr; <strong>"Apps"</strong> &rarr; Click <strong>"Install this site as an app"</strong>.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-900 block">Pin to Taskbar & Desktop:</strong>
                      <span>
                        When prompted, check <strong>"Pin to taskbar"</strong> and <strong>"Create Desktop shortcut"</strong>, then click <strong>"Allow"</strong>.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Windows Shortcut Generator */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-blue-50/80 border border-blue-200 rounded-2xl p-4 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">Prefer a direct desktop shortcut file?</span>
                  <span className="text-slate-600 text-[11px]">Downloads a ready-to-use .url or .bat shortcut for your desktop folder.</span>
                </div>
                <button
                  onClick={handleDownloadWindowsShortcut}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .URL Shortcut</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Mac Safari & Chrome */}
          {activeTab === "mac" && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Apple className="w-5 h-5 text-slate-900" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    How to Install on macOS (Safari / Chrome)
                  </h3>
                </div>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-900 block">Safari (macOS Sonoma / Sequoia):</strong>
                      <span>
                        In Safari, click the <strong>"Share"</strong> icon (square with arrow up) or click <strong>File</strong> in the top menu bar, then choose <strong>"Add to Dock"</strong>.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-900 block">Google Chrome for Mac:</strong>
                      <span>
                        Click the <strong>Install</strong> icon in the address bar (or Chrome menu <strong>⋮</strong> &rarr; <strong>Save and Share</strong> &rarr; <strong>Install Partssource ZA</strong>).
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-900 block">Launch anytime from Mac Launchpad & Dock:</strong>
                      <span>
                        Partssource ZA appears with its custom icon in your Applications folder and macOS Dock.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Copy URL quick action */}
              <div className="flex items-center justify-between gap-3 bg-slate-100 p-3.5 rounded-2xl text-xs">
                <div className="truncate text-slate-600 font-mono text-[11px]">
                  {currentAppUrl}
                </div>
                <button
                  onClick={handleCopyUrl}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  {copiedUrl ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? "Copied Link!" : "Copy App Link"}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Direct Shortcut & Script Downloads */}
          {activeTab === "shortcuts" && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs text-slate-600 leading-relaxed">
                Download pre-configured desktop shortcut files that launch Partssource ZA in a single click directly from your desktop folder:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Windows .URL Shortcut */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
                      Windows (.URL)
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">Desktop Internet Shortcut</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Standard Windows desktop shortcut icon for all browsers.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadWindowsShortcut}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .URL</span>
                  </button>
                </div>

                {/* Windows Standalone App Window Launcher (.bat) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider bg-slate-200 px-2 py-0.5 rounded">
                      App Mode (.BAT)
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">Dedicated Window Launcher</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Launches in a borderless app window without address bars.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadWindowsBatLauncher}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .BAT</span>
                  </button>
                </div>

                {/* Linux .desktop launcher */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
                      Linux (.desktop)
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">Linux Desktop Entry</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Freedesktop compatible launcher for Ubuntu, Fedora, Debian.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadLinuxDesktop}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .desktop</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified 100% Safe • South African Spares Network</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyUrl}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Copy web link"
            >
              {copiedUrl ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? "Copied" : "Share"}</span>
            </button>

            <button
              onClick={onClose}
              className="bg-slate-950 hover:bg-slate-800 text-white text-xs font-black px-5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
