"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface TierInfo {
  tier: string;
  name: string;
  creditsPerMonth: number;
  features: string[];
}

interface SubscriptionData {
  tier: string;
  tierInfo: TierInfo;
  credits: number;
}

const TIERS: TierInfo[] = [
  {
    tier: "free",
    name: "Free",
    creditsPerMonth: 1000,
    features: ["1,000 credits/month", "Basic voices", "Standard quality"],
  },
  {
    tier: "pro",
    name: "Pro",
    creditsPerMonth: 80000,
    features: [
      "80,000 credits/month",
      "All voices",
      "High quality",
      "Priority processing",
    ],
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    creditsPerMonth: 300000,
    features: [
      "300,000 credits/month",
      "All voices",
      "Premium quality",
      "Priority processing",
      "Dedicated support",
    ],
  },
];

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await fetch("/api/subscriptions/current", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.tier) {
        setSubscription(data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (tier: string) => {
    setProcessing(tier);
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handlePortal = async () => {
    setProcessing("portal");
    try {
      const res = await fetch("/api/subscriptions/portal", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to create portal session");
      }
    } catch (error) {
      console.error("Portal error:", error);
    } finally {
      setProcessing(null);
    }
  };

  const getCurrentTierIndex = () => {
    return TIERS.findIndex((t) => t.tier === subscription?.tier);
  };

  const currentTierIndex = getCurrentTierIndex();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Billing</h1>
          <button
            onClick={handlePortal}
            disabled={processing === "portal"}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {processing === "portal" ? "Loading..." : "Manage Billing"}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
            Subscription updated successfully!
          </div>
        )}

        {canceled && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
            Subscription was canceled. Your changes have not been saved.
          </div>
        )}

        {/* Current Plan */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Current Plan
          </h2>
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <svg
                className="animate-spin h-8 w-8 mx-auto text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          ) : subscription ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-slate-900">
                      {subscription.tierInfo.name}
                    </span>
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1">
                    {subscription.tierInfo.creditsPerMonth.toLocaleString()}{" "}
                    credits/month
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Available Credits</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {subscription.credits.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Usage Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Usage</span>
                  <span className="text-slate-900 font-medium">
                    {subscription.credits.toLocaleString()} /{" "}
                    {subscription.tierInfo.creditsPerMonth.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-900 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, ((subscription.tierInfo.creditsPerMonth - subscription.credits) / subscription.tierInfo.creditsPerMonth) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
              Unable to load subscription data
            </div>
          )}
        </div>

        {/* Available Plans */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Available Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map((tier, index) => {
              const isCurrentPlan = index === currentTierIndex;
              const isUpgrade =
                index > currentTierIndex && currentTierIndex >= 0;
              const isDowngrade = index < currentTierIndex;

              return (
                <div
                  key={tier.tier}
                  className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
                    isCurrentPlan ? "border-amber-400" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-slate-900">
                      {tier.name}
                    </h3>
                    {isCurrentPlan && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                        Current
                      </span>
                    )}
                  </div>

                  <p className="text-3xl font-bold text-slate-900 mb-1">
                    {tier.creditsPerMonth.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-500 mb-6">credits/month</p>

                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm text-slate-600"
                      >
                        <svg
                          className="w-4 h-4 text-green-500 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full py-3 bg-slate-100 text-slate-400 font-medium rounded-lg cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCheckout(tier.tier)}
                      disabled={processing === tier.tier}
                      className={`w-full py-3 font-medium rounded-lg transition-colors ${
                        isUpgrade
                          ? "bg-slate-900 text-white hover:bg-slate-800"
                          : "bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {processing === tier.tier
                        ? "Processing..."
                        : isUpgrade
                          ? "Upgrade"
                          : "Downgrade"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
