import { getCreditBalance } from "@/lib/actions";

export default async function DashboardPage() {
  const result = await getCreditBalance();
  const credits = result.success ? (result.data?.balance ?? 0) : 0;
  const tier = result.success ? (result.data?.tier ?? "free") : "unknown";
  const userId = result.success ? (result.data?.userId ?? "") : "";

  const tierColors: Record<string, string> = {
    free: "bg-gray-100 text-gray-800",
    pro: "bg-blue-100 text-blue-800",
    enterprise: "bg-purple-100 text-purple-800",
  };

  const tierLabels: Record<string, string> = {
    free: "Free",
    pro: "Pro",
    enterprise: "Enterprise",
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-gray-500 text-sm">Total Credits</h2>
          <p className="text-3xl font-bold mt-2">{credits.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">
            User ID: {userId.slice(0, 8)}...
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-gray-500 text-sm">Credits Used</h2>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-gray-500 text-sm">Subscription Tier</h2>
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
              tierColors[tier] || tierColors.free
            }`}
          >
            {tierLabels[tier] || tier}
          </span>
        </div>
      </div>
    </div>
  );
}
