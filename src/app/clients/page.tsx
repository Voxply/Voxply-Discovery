export default function ClientsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Clients</h1>
        <p className="text-neutral-400">
          Official Voxply clients. All clients connect directly to hubs — no intermediary servers.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Desktop</p>
          <h2 className="font-semibold text-lg mb-1">Windows · macOS · Linux</h2>
          <p className="text-sm text-neutral-400 mb-4">
            Full feature set including voice chat, screen share, and games.
          </p>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-neutral-500 uppercase tracking-wide">Built with Tauri</span>
            <a
              href="https://github.com/Voxply/Voxply-desktop/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm text-center transition-colors"
            >
              Download →
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Web</p>
          <h2 className="font-semibold text-lg mb-1">Browser client</h2>
          <p className="text-sm text-neutral-400 mb-4">
            Connect to any hub without installing anything. Voice and screen share require a modern browser.
          </p>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-neutral-500 uppercase tracking-wide">React + WebRTC</span>
            <a
              href="https://github.com/Voxply/Voxply-web"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg border border-neutral-700 hover:border-indigo-500 text-neutral-300 text-sm text-center transition-colors"
            >
              View on GitHub →
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Android</p>
          <h2 className="font-semibold text-lg mb-1">Native Android</h2>
          <p className="text-sm text-neutral-400 mb-4">
            Chat and voice on mobile. Screen share and games coming soon.
          </p>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-neutral-500 uppercase tracking-wide">Tauri for Android</span>
            <a
              href="https://github.com/Voxply/Voxply-android"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg border border-neutral-700 hover:border-indigo-500 text-neutral-300 text-sm text-center transition-colors"
            >
              View on GitHub →
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
        <h2 className="font-semibold mb-2">One identity, every client</h2>
        <p className="text-sm text-neutral-400 leading-relaxed">
          Your identity is an Ed25519 keypair stored on your device. The same keypair
          works across all clients and all hubs — no accounts, no passwords, no central
          authority. Export your key once and import it anywhere.
        </p>
      </div>
    </div>
  );
}
