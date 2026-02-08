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
  // Morning greetings - neuroscience focused
  { message: "What neuroscience question is on your mind this morning?", conditions: { timeOfDay: 'morning' }, weight: 2 },
  { message: "Ready to explore neuroplasticity today?", conditions: { timeOfDay: 'morning' } },
  { message: "What would you like to learn about the brain this morning?", conditions: { timeOfDay: 'morning' } },
  { message: "Fresh morning, fresh neural pathways to explore?", conditions: { timeOfDay: 'morning' } },
  { message: "How can I help you understand neuroplasticity today?", conditions: { timeOfDay: 'morning' } },
  
  // Afternoon greetings
  { message: "What neuroscience topic interests you today?", conditions: { timeOfDay: 'afternoon' } },
  { message: "Curious about how the brain works?", conditions: { timeOfDay: 'afternoon' } },
  { message: "Ready to dive into neuroplasticity?", conditions: { timeOfDay: 'afternoon' } },
  { message: "What brain-related question can I help answer?", conditions: { timeOfDay: 'afternoon' } },
  { message: "How can I assist your neuroscience exploration?", conditions: { timeOfDay: 'afternoon' } },
  
  // Evening greetings
  { message: "What neuroscience insights are you reflecting on?", conditions: { timeOfDay: 'evening' } },
  { message: "Ready to explore the brain's amazing capabilities?", conditions: { timeOfDay: 'evening' } },
  { message: "What neuroplasticity question is on your mind?", conditions: { timeOfDay: 'evening' } },
  { message: "Time to learn about how your brain adapts?", conditions: { timeOfDay: 'evening' } },
  { message: "What would you like to know about neuroscience?", conditions: { timeOfDay: 'evening' } },
  
  // Night greetings
  { message: "Still curious about the brain? I'm here to help.", conditions: { timeOfDay: 'night' } },
  { message: "Late night neuroscience thoughts?", conditions: { timeOfDay: 'night' } },
  { message: "What's keeping your mind active about neuroplasticity?", conditions: { timeOfDay: 'night' } },
  { message: "Ready to explore the mysteries of the brain?", conditions: { timeOfDay: 'night' } },
  
  // Monday specific
  { message: "Fresh week, fresh questions about neuroplasticity?", conditions: { dayType: 'monday' }, weight: 3 },
  { message: "Ready to start the week with neuroscience insights?", conditions: { dayType: 'monday' }, weight: 2 },
  { message: "New week, new neural pathways to explore?", conditions: { dayType: 'monday' }, weight: 2 },
  
  // Friday specific
  { message: "Wrapping up the week with some neuroscience questions?", conditions: { dayType: 'friday' }, weight: 3 },
  { message: "What brain-related insights did you gain this week?", conditions: { dayType: 'friday' }, weight: 2 },
  { message: "Ready to explore neuroplasticity before the weekend?", conditions: { dayType: 'friday' }, weight: 2 },
  
  // Weekend specific
  { message: "Weekend vibes - what neuroscience topic interests you?", conditions: { dayType: 'weekend' }, weight: 2 },
  { message: "Taking time to explore the brain this weekend?", conditions: { dayType: 'weekend' } },
  { message: "What neuroplasticity question can we explore together?", conditions: { dayType: 'weekend' } },
  
  // General/fallback greetings - neuroscience focused
  { message: "What neuroscience question can I help answer?", weight: 2 },
  { message: "What would you like to know about neuroplasticity?", weight: 3 },
  { message: "Ready to explore how the brain works?", weight: 2 },
  { message: "What interests you about neuroscience?", weight: 2 },
  { message: "How can I help you understand the brain?", weight: 2 },
  { message: "What neuroplasticity topic would you like to explore?", weight: 3 },
  { message: "Curious about how your brain adapts and changes?", weight: 2 },
  { message: "What brain-related question is on your mind?", weight: 2 },
  { message: "Ready to learn about neural pathways?", weight: 1 },
  { message: "What would you like to discover about neuroscience?", weight: 2 },
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

// Server-side function to get dynamic neuroscience greeting
export function getNeuroscienceGreeting(): string {
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
