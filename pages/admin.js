import { useState } from "react";

export default function AdminPage() {
  const [matchData, setMatchData] = useState({
    homeTeam: "",
    awayTeam: "",
    homeScore: 0,
    awayScore: 0,
    homeScorers: [],
    awayScorers: [],
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMatchData({ ...matchData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Match Data Submitted:", matchData);
    // Ici, vous pouvez envoyer les données à votre backend ou les traiter localement
  };

  return (
    <div>
      <h1>Ajouter les informations du match</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Équipe à domicile:</label>
          <input
            type="text"
            name="homeTeam"
            value={matchData.homeTeam}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Équipe à l'extérieur:</label>
          <input
            type="text"
            name="awayTeam"
            value={matchData.awayTeam}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Score de l'équipe à domicile:</label>
          <input
            type="number"
            name="homeScore"
            value={matchData.homeScore}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Score de l'équipe à l'extérieur:</label>
          <input
            type="number"
            name="awayScore"
            value={matchData.awayScore}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Buteurs de l'équipe à domicile (séparés par des virgules):</label>
          <input
            type="text"
            name="homeScorers"
            value={matchData.homeScorers}
            onChange={(e) =>
              setMatchData({ ...matchData, homeScorers: e.target.value.split(",") })
            }
          />
        </div>
        <div>
          <label>Buteurs de l'équipe à l'extérieur (séparés par des virgules):</label>
          <input
            type="text"
            name="awayScorers"
            value={matchData.awayScorers}
            onChange={(e) =>
              setMatchData({ ...matchData, awayScorers: e.target.value.split(",") })
            }
          />
        </div>
        <button type="submit">Enregistrer</button>
      </form>
    </div>
  );
}
