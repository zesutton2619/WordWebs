// src/components/TermsOfService.jsx
export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-slate-400 mb-6">
          <strong>Effective Date:</strong> August 9, 2025
        </p>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">
            1. Description of Service
          </h2>
          <p className="text-slate-300">
            WordWebs is a word puzzle game that runs exclusively inside Discord
            using the Discord Embedded App SDK.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">2. Acceptable Use</h2>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            <li>No illegal activity</li>
            <li>No hacking or exploiting the game</li>
            <li>No harassment of other players</li>
            <li>No automated tools or bots to play</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">
            3. Intellectual Property
          </h2>
          <p className="text-slate-300">
            All puzzles, game logic, and UI are the property of WordWebs. You
            may not copy or redistribute without permission.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">4. Disclaimer</h2>
          <p className="text-slate-300">
            WordWebs is provided "as is" without warranties of any kind. We do
            not guarantee uninterrupted service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">5. Contact</h2>
          <p className="text-slate-300">
            For questions, email:{" "}
            <span className="text-purple-400">zachary.sutton001@gmail.com</span>
          </p>
        </section>
      </div>
    </div>
  );
}
