// src/components/PrivacyPolicy.jsx
export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-slate-400 mb-6">
          <strong>Effective Date:</strong> August 9, 2025
        </p>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">
            1. Information We Collect
          </h2>
          <p className="text-slate-300 mb-2">
            When you use WordWebs, we may collect:
          </p>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            <li>Discord User ID</li>
            <li>Username and Display Name</li>
            <li>Avatar URL (if available)</li>
            <li>
              Guild and Channel IDs (only when needed for posting results)
            </li>
            <li>
              Game progress, guesses, solved groups, attempts remaining,
              completion time
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">
            2. How We Use Your Information
          </h2>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            <li>Authenticate you via Discord</li>
            <li>Load and save your puzzle progress</li>
            <li>Prevent duplicate guesses</li>
            <li>Display your username in-game</li>
            <li>Optionally post results to your Discord channel</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">
            3. Data Storage and Retention
          </h2>
          <p className="text-slate-300">
            Game progress is stored securely on our backend. We retain daily
            puzzle data for up to 30 days.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">
            4. Sharing of Information
          </h2>
          <p className="text-slate-300">
            We do not sell or trade your data. We may share limited data with
            Discord for authentication, with your server if you post results, or
            when required by law.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">5. Your Rights</h2>
          <p className="text-slate-300">
            You may request access to or deletion of your data by contacting us
            at:
          </p>
          <p className="text-purple-400 font-semibold">
            zachary.sutton001@gmail.com
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">6. Contact</h2>
          <p className="text-slate-300">
            For any questions, email us at:{" "}
            <span className="text-purple-400">zachary.sutton001@gmail.com</span>
          </p>
        </section>
      </div>
    </div>
  );
}
