import { parseISO, format, addDays, isBefore, startOfDay } from 'date-fns';

export function generateApplicableDates(startDateStr, endDateStr, activeDays) {
  const start = startOfDay(parseISO(startDateStr));
  const end = startOfDay(parseISO(endDateStr));
  const dates = [];
  
  let curr = start;
  let iterations = 0;
  while (!isBefore(end, curr) && iterations < 3650) { // Max 10 years safety
    if (isNaN(curr.getTime())) break;
    if (activeDays.includes(curr.getDay())) {
      dates.push(format(curr, 'yyyy-MM-dd'));
    }
    curr = addDays(curr, 1);
    iterations++;
  }
  return dates;
}

export function computeProgramStats(program, logs) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const applicableDates = generateApplicableDates(program.createdAt, todayStr, program.activeDays);
  
  let currentStreak = 0;
  let longestStreak = 0;
  let totalScore = 0;
  let missedDays = 0;
  let comebackBonusRemaining = 0;
  
  let daysWithGoodIntensity = 0;
  let totalIntensity = 0;

  // sort logs for this program by date
  const programLogs = logs.filter(l => l.programId === program.id);
  const logMap = programLogs.reduce((acc, log) => {
    acc[log.date] = log;
    return acc;
  }, {});

  const dailyScores = {}; // store date -> score

  for (const date of applicableDates) {
    const log = logMap[date];
    
    // For today, if it's not logged yet, we don't apply penalty until midnight. Wait, rule says:
    // "If a day is missed (past applicable day with no log), auto-log intensity=0 at midnight"
    // So if it's today and not logged, we just treat it as pending (do not compute) unless it's past today.
    if (!log && date === todayStr) {
      continue;
    }

    const intensity = log ? log.intensity : 0;
    const isFreeze = log ? !!log.isFreeze : false;

    if (intensity > 0 || isFreeze) {
      // It's a "good" day
      missedDays = 0;
      currentStreak += 1;
      if (currentStreak > longestStreak) longestStreak = currentStreak;

      if (intensity > 0) {
        daysWithGoodIntensity += 1;
        totalIntensity += intensity;
      }

      let basePoints = intensity * 10;
      let streakMultiplier = Math.min(1 + ((currentStreak - 1) * 0.05), 3.0); // before adding this day or including? let's say including this day minus 1
      let dailyScore = basePoints * streakMultiplier;

      if (currentStreak === 7) dailyScore += 25;
      else if (currentStreak === 21) dailyScore += 50;
      else if (currentStreak === 30) dailyScore += 75;
      else if (currentStreak === 60) dailyScore += 150;
      else if (currentStreak === 100) dailyScore += 300;

      if (comebackBonusRemaining > 0) {
        dailyScore += 2;
        comebackBonusRemaining -= 1;
      }

      totalScore += dailyScore;
      dailyScores[date] = dailyScore;
    } else {
      // Missed day or intensity 0
      if (currentStreak > 0) {
        // Just broke the streak
        comebackBonusRemaining = 3; // for the next 3 good days
      }
      currentStreak = 0;
      missedDays += 1;

      let penalty = 0;
      if (missedDays === 1) penalty = 5;
      else if (missedDays >= 2 && missedDays <= 3) penalty = 15;
      else if (missedDays >= 4 && missedDays <= 7) penalty = 40;
      else if (missedDays >= 8) penalty = 80;

      totalScore = Math.max(0, totalScore - penalty);
      dailyScores[date] = -penalty;
    }
  }

  const completionRate = applicableDates.length > 0 && datesBeforeOrEqualTodayLogged(applicableDates, todayStr) > 0
    ? daysWithGoodIntensity / datesBeforeOrEqualTodayLogged(applicableDates, todayStr)
    : 0;

  const avgIntensity = daysWithGoodIntensity > 0 ? (totalIntensity / daysWithGoodIntensity) : 0;

  return {
    currentStreak,
    longestStreak,
    totalScore: Math.round(totalScore),
    completionRate,
    avgIntensity,
    dailyScores,
    applicableDates
  };
}

function datesBeforeOrEqualTodayLogged(dates, todayStr) {
    return dates.filter(d => d < todayStr || d === todayStr).length;
}
