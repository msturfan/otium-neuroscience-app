type GreetingCondition = {
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  dayType: "weekday" | "weekend" | "monday" | "friday";
};

type Greeting = {
  message: string;
  conditions?: Partial<GreetingCondition>;
  weight?: number;
};

const greetings: Greeting[] = [
  { message: "What are you training today?", conditions: { timeOfDay: "morning" }, weight: 2 },
  { message: "Ready to plan a workout?", conditions: { timeOfDay: "morning" } },
  { message: "What’s your goal for this session?", conditions: { timeOfDay: "morning" } },
  { message: "Need a quick routine or something longer?", conditions: { timeOfDay: "afternoon" } },
  { message: "Ask me about form, splits, or recovery.", conditions: { timeOfDay: "afternoon" } },
  { message: "What muscle group or movement do you want to focus on?", conditions: { timeOfDay: "evening" } },
  { message: "Evening session or winding down with mobility?", conditions: { timeOfDay: "evening" } },
  { message: "Still thinking about training? I’m here.", conditions: { timeOfDay: "night" } },
  { message: "Light stretch or sleep prep tonight?", conditions: { timeOfDay: "night" } },
  { message: "New week — what’s your training focus?", conditions: { dayType: "monday" }, weight: 2 },
  { message: "Friday finish: strength or cardio?", conditions: { dayType: "friday" }, weight: 2 },
  { message: "Weekend workout or active recovery?", conditions: { dayType: "weekend" } },
  { message: "What workout question can I help with?", weight: 3 },
  { message: "Tell me your equipment and time available.", weight: 2 },
  { message: "What would you like to train?", weight: 3 },
];

function getTimeOfDay(): GreetingCondition["timeOfDay"] {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

function getDayType(): GreetingCondition["dayType"] {
  const day = new Date().getDay();
  if (day === 1) return "monday";
  if (day === 5) return "friday";
  if (day === 0 || day === 6) return "weekend";
  return "weekday";
}

function filterGreetingsByConditions(
  list: Greeting[],
  currentConditions: GreetingCondition,
): Greeting[] {
  return list.filter((greeting) => {
    if (!greeting.conditions) return true;
    return Object.entries(greeting.conditions).every(
      ([key, value]) =>
        currentConditions[key as keyof GreetingCondition] === value,
    );
  });
}

function weightedRandomSelection(list: Greeting[]): string {
  const weighted: string[] = [];
  list.forEach((greeting) => {
    const weight = greeting.weight || 1;
    for (let i = 0; i < weight; i++) {
      weighted.push(greeting.message);
    }
  });
  const randomIndex = Math.floor(Math.random() * weighted.length);
  return weighted[randomIndex];
}

export function getWorkoutGreeting(): string {
  const currentConditions: GreetingCondition = {
    timeOfDay: getTimeOfDay(),
    dayType: getDayType(),
  };
  const relevant = filterGreetingsByConditions(greetings, currentConditions);
  const finalGreetings =
    relevant.length > 0 ? relevant : greetings.filter((g) => !g.conditions);
  return weightedRandomSelection(finalGreetings);
}
