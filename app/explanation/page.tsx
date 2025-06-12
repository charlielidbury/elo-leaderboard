import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Math } from "@/components/ui/math";

export default function EloExplanation() {
  return (
    <div className="min-h-screen bg-background max-w-[500px] mx-auto">
      <div className="mx-auto p-6">
        {/* Header with back button */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-center">ELO Rating System</h1>
        </div>

        {/* Content */}
        <div className="space-y-8 text-base leading-7 text-center max-w-3xl mx-auto">
          <p>
            In the ELO system, points are never created or destroyed, only
            transferred. Everyone starts with <strong>1000</strong> points.
          </p>

          <p>
            The amount of points transferred to the winner of a match depends on
            how <em>surprising</em> the result was. So if a high rated player
            loses to a low rated player, a lot of points are transferred, but if
            a high rated player wins against a low rated player, not many points
            are transferred.
          </p>

          <div className="space-y-6">
            <div>
              <p className="mb-8">
                The exact amount of points transferred in a game between Alice
                and Bob, where Alice has rating <Math>A</Math> and Bob has
                rating <Math>B</Math> is given by the following formula:
              </p>
            </div>

            <div className="text-2xl">
              <Math block>
                {
                  "32 \\left( R - \\frac{1}{1 + 10^{(\\dfrac{B-A}{400})}} \\right)"
                }
              </Math>
            </div>

            <div className="space-y-3 pt-4">
              <div className="text-center">
                <Math block>
                  {
                    "\\text{where} \\, R = \\begin{cases} 1 & \\text{Alice won} \\\\ 0 & \\text{Alice lost} \\\\ 0.5 & \\text{The game was a draw} \\end{cases}"
                  }
                </Math>
              </div>
            </div>

            <div className="text-sm text-muted-foreground pt-6">
              Laying that out was a <em>struggle</em>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
