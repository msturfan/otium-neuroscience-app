type GreetingCondition = {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayType: 'weekday' | 'weekend' | 'monday' | 'friday';
};

type Greeting = {
  message: string;
  conditions?: Partial<GreetingCondition>;
  weight?: number;
};

const greetings: Greeting[] = [
  // Morning greetings
  { message: "What's on your mind this morning?", conditions: { timeOfDay: 'morning' }, weight: 2 },
  { message: "Ready to capture today's thoughts?", conditions: { timeOfDay: 'morning' } },
  { message: "How can I help you start the day?", conditions: { timeOfDay: 'morning' } },
  { message: "Fresh morning, fresh ideas?", conditions: { timeOfDay: 'morning' } },
  
  // Afternoon greetings
  { message: "How's your day unfolding?", conditions: { timeOfDay: 'afternoon' } },
  { message: "What's worth noting this afternoon?", conditions: { timeOfDay: 'afternoon' } },
  { message: "Ready to capture some midday thoughts?", conditions: { timeOfDay: 'afternoon' } },
  { message: "How can I assist you today?", conditions: { timeOfDay: 'afternoon' } },
  
  // Evening greetings
  { message: "How did your day go?", conditions: { timeOfDay: 'evening' } },
  { message: "What's worth reflecting on today?", conditions: { timeOfDay: 'evening' } },
  { message: "Ready to unwind with some thoughts?", conditions: { timeOfDay: 'evening' } },
  { message: "Time to reflect and capture today's moments?", conditions: { timeOfDay: 'evening' } },
  
  // Night greetings
  { message: "Still thinking? I'm here to help.", conditions: { timeOfDay: 'night' } },
  { message: "Late night thoughts on your mind?", conditions: { timeOfDay: 'night' } },
  { message: "What's keeping you up tonight?", conditions: { timeOfDay: 'night' } },
  
  // Monday specific
  { message: "Fresh week, fresh thoughts?", conditions: { dayType: 'monday' }, weight: 3 },
  { message: "Ready to tackle this new week?", conditions: { dayType: 'monday' }, weight: 2 },
  
  // Friday specific
  { message: "Wrapping up the week with some thoughts?", conditions: { dayType: 'friday' }, weight: 3 },
  { message: "How did this week treat you?", conditions: { dayType: 'friday' }, weight: 2 },
  
  // Weekend specific
  { message: "Weekend vibes - what's on your mind?", conditions: { dayType: 'weekend' }, weight: 2 },
  { message: "Taking some time to reflect this weekend?", conditions: { dayType: 'weekend' } },
  
  // General/fallback greetings
  { message: "What can I help with?", weight: 1 },
  { message: "What's on your mind?", weight: 2 },
  { message: "Ready to capture your thoughts?", weight: 2 },
  { message: "How can I assist you today?", weight: 2 },
  { message: "What would you like to explore?", weight: 1 },
  { message: "Share what's on your mind.", weight: 2 },
];

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

function getDayType(): 'weekday' | 'weekend' | 'monday' | 'friday' {
  const day = new Date().getDay();
  
  if (day === 1) return 'monday';
  if (day === 5) return 'friday';
  if (day === 0 || day === 6) return 'weekend';
  return 'weekday';
}

function filterGreetingsByConditions(
  greetings: Greeting[], 
  currentConditions: GreetingCondition
): Greeting[] {
  return greetings.filter(greeting => {
    if (!greeting.conditions) return true;
    
    return Object.entries(greeting.conditions).every(([key, value]) => {
      return currentConditions[key as keyof GreetingCondition] === value;
    });
  });
}

function weightedRandomSelection(greetings: Greeting[]): string {
  const weightedGreetings: string[] = [];
  
  greetings.forEach(greeting => {
    const weight = greeting.weight || 1;
    for (let i = 0; i < weight; i++) {
      weightedGreetings.push(greeting.message);
    }
  });
  
  const randomIndex = Math.floor(Math.random() * weightedGreetings.length);
  return weightedGreetings[randomIndex];
}

// Server-side function to get dynamic greeting
export function getServerSideGreeting(): string {
  const currentConditions: GreetingCondition = {
    timeOfDay: getTimeOfDay(),
    dayType: getDayType(),
  };
  
  const relevantGreetings = filterGreetingsByConditions(greetings, currentConditions);
  
  const finalGreetings = relevantGreetings.length > 0 
    ? relevantGreetings 
    : greetings.filter(g => !g.conditions);
  
  return weightedRandomSelection(finalGreetings);
}