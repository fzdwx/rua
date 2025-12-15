import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col justify-center text-center flex-1 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Rua Documentation
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          A modern, extensible command palette launcher for Linux, built with Tauri + React + TypeScript.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold mb-2">🚀 Fast & Lightweight</h3>
            <p className="text-sm text-muted-foreground">
              Built with Tauri for optimal performance and minimal resource usage.
            </p>
          </div>
          
          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold mb-2">🔌 Extensible</h3>
            <p className="text-sm text-muted-foreground">
              Plugin system with hot reload support for easy customization.
            </p>
          </div>
          
          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold mb-2">🎨 Beautiful UI</h3>
            <p className="text-sm text-muted-foreground">
              Dark/light theme support with keyboard-first navigation.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/docs" 
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
          <Link 
            href="/docs/api/overview"
            className="inline-flex items-center justify-center px-6 py-3 border border-input rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            API Reference
          </Link>
        </div>
      </div>
    </div>
  );
}
