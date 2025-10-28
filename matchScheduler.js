const teams = [
  // Ajoutez ici les noms des équipes
  "Equipe 1",
  "Equipe 2",
  "Equipe 3",
  "Equipe 4",
];

function generateSchedule(teams) {
  const schedule = [];
  const totalTeams = teams.length;

  // Aller-retour
  for (let i = 0; i < totalTeams - 1; i++) {
    for (let j = i + 1; j < totalTeams; j++) {
      schedule.push({ home: teams[i], away: teams[j] });
      schedule.push({ home: teams[j], away: teams[i] });
    }
  }

  return schedule;
}

function assignThursdays(schedule) {
  const matchesWithDates = [];
  let currentDate = new Date();

  // Trouver le prochain jeudi
  while (currentDate.getDay() !== 4) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Assigner un jeudi à chaque match
  for (const match of schedule) {
    matchesWithDates.push({
      ...match,
      date: new Date(currentDate),
    });
    currentDate.setDate(currentDate.getDate() + 7); // Passer au jeudi suivant
  }

  return matchesWithDates;
}

const results = []; // Stocker les résultats des matchs
const standings = {}; // Classement des équipes

// Initialiser le classement
teams.forEach((team) => {
  standings[team] = { points: 0, goalsFor: 0, goalsAgainst: 0 };
});

function recordMatchResult(match, homeScore, awayScore, scorers) {
  const { home, away } = match;

  // Enregistrer le score et les buteurs
  results.push({
    home,
    away,
    homeScore,
    awayScore,
    scorers, // { home: [{ name, assists }], away: [{ name, assists }] }
  });

  // Mettre à jour les statistiques des équipes
  standings[home].goalsFor += homeScore;
  standings[home].goalsAgainst += awayScore;
  standings[away].goalsFor += awayScore;
  standings[away].goalsAgainst += homeScore;

  // Attribuer les points
  if (homeScore > awayScore) {
    standings[home].points += 3;
  } else if (homeScore < awayScore) {
    standings[away].points += 3;
  } else {
    standings[home].points += 1;
    standings[away].points += 1;
  }
}

// Générer et afficher le planning
const schedule = generateSchedule(teams);
const scheduledMatches = assignThursdays(schedule);

// Enregistrer un résultat de match
recordMatchResult(
  scheduledMatches[0],
  2, // Score de l'équipe à domicile
  1, // Score de l'équipe à l'extérieur
  {
    home: [
      { name: "Joueur 1", assists: 1 },
      { name: "Joueur 2", assists: 0 },
    ],
    away: [{ name: "Joueur 3", assists: 0 }],
  }
);

console.log("Résultats des matchs :", results);
console.log("Classement :", standings);

export { generateSchedule, assignThursdays, recordMatchResult };
