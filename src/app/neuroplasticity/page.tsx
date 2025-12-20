import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUser } from "@/auth/server";
import { getUserProfile } from "@/lib/user-utils";
import { getServerSideGreeting } from "@/lib/greetings-server";
import { Brain } from "lucide-react";

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 22) return "Good evening";
  return "Good night";
}

export default async function NeuroplasticityPage() {
  const user = await getUser();
  const userProfile = await getUserProfile(user);
  const greeting = getTimeBasedGreeting();
  const userName = userProfile?.name || user?.email?.split("@")[0] || "there";

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Header Section */}
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-3">
          <Brain className="text-primary h-12 w-12" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Neuroplasticity
          </h1>
        </div>
        <p className="text-muted-foreground text-xl">
          {greeting}, {userName}! 👋
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Feature Coming Soon
          </CardTitle>
          <CardDescription>
            We're working hard to bring you an amazing neuroplasticity
            experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            This feature is currently under development. We're building
            something special that will help you understand and harness the
            power of neuroplasticity in your daily life. Stay tuned for updates!
          </p>
        </CardContent>
      </Card>

      {/* What is Neuroplasticity Card */}
      <Card>
        <CardHeader>
          <CardTitle>What is Neuroplasticity?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            <strong>Neuroplasticity</strong> is the brain's remarkable ability
            to reorganize itself by forming new neural connections throughout
            life. This means your brain is not fixed or static—it can change,
            adapt, and grow based on your experiences, thoughts, and actions.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Think of it as your brain's way of rewiring itself. Every time you
            learn something new, practice a skill, or even change your thinking
            patterns, your brain creates new pathways and strengthens existing
            ones. This process happens continuously, allowing you to develop new
            abilities, recover from injuries, and adapt to new situations.
          </p>
        </CardContent>
      </Card>

      {/* How Does It Work Card */}
      <Card>
        <CardHeader>
          <CardTitle>How Does Neuroplasticity Work?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h3 className="mb-2 font-semibold">1. Synaptic Plasticity</h3>
              <p className="text-muted-foreground leading-relaxed">
                When you repeatedly use certain neural pathways, the connections
                (synapses) between neurons become stronger. This is often
                described as "neurons that fire together, wire together."
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">2. Structural Changes</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your brain can physically change its structure. New neurons can
                form (neurogenesis), and existing neurons can grow new branches
                (dendrites) to create more connections.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">
                3. Functional Reorganization
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                If one part of your brain is damaged, other areas can take over
                its functions. This is why people can recover abilities after
                strokes or brain injuries.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">4. Experience-Dependent</h3>
              <p className="text-muted-foreground leading-relaxed">
                The changes in your brain are driven by your experiences. The
                more you practice, learn, and engage with new activities, the
                more your brain adapts and grows.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Practical Applications Card */}
      <Card>
        <CardHeader>
          <CardTitle>Why It Matters</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            Understanding neuroplasticity empowers you to take control of your
            brain's development. By engaging in activities like learning new
            skills, practicing mindfulness, exercising regularly, and
            maintaining social connections, you can actively shape your brain's
            structure and function. This means you're never too old to learn,
            change, or improve your cognitive abilities.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
