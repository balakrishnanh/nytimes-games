import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col bg-white text-black font-sans">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 sm:py-32">
        <h2 className="text-5xl md:text-7xl font-serif font-bold mb-6 tracking-tight text-black">
          Your Games. <br /> Your Rules.
        </h2>
        <p className="max-w-xl text-lg md:text-xl text-gray-600 mb-10 leading-relaxed">
          Create custom versions of your favorite daily puzzles. Build a personalized Wordle, 
          design a tricky Connections board, or craft a Mini Crossword to challenge your friends.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link href="/dashboard"> {/* Points to dashboard now (middleware/auth check handles redirect) */}
            <Button size="lg" className="h-12 px-8 text-lg w-full sm:w-auto shadow-lg hover:shadow-xl transition-all">
              Start Creating
            </Button>
          </Link>
          <Link href="https://github.com" target="_blank">
             <Button variant="outline" size="lg" className="h-12 px-8 text-lg w-full sm:w-auto">
                View on GitHub
             </Button>
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl px-4">
            {[
                { title: "Wordle", desc: "Set your own 5-letter target word.", bg: "bg-emerald-50", border: "border-emerald-200" },
                { title: "Connections", desc: "Create 4 groups of 4 tricky words.", bg: "bg-purple-50", border: "border-purple-200" },
                { title: "Mini Crossword", desc: "Design a quick 5x5 grid.", bg: "bg-sky-50", border: "border-sky-200" },
                { title: "Spelling Bee", desc: "Choose 7 unique letters and a center letter.", bg: "bg-yellow-50", border: "border-yellow-200" }
            ].map((game) => (
                <div key={game.title} className={`p-8 rounded-xl border ${game.border} ${game.bg} text-left transition-transform hover:-translate-y-1`}>
                    <h3 className="font-serif text-2xl font-bold mb-3 text-gray-900">{game.title}</h3>
                    <p className="text-gray-700 leading-relaxed">{game.desc}</p>
                </div>
            ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-gray-400 border-t mt-auto">
        <p>Built for fun. Not affiliated with The New York Times.</p>
      </footer>
    </div>
  );
}