import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const teamsData = [
  {
    name: "FC Étoile",
    color: "#1e40af",
    logo: "⭐",
    players: [
      { name: "Marc Dupont", number: 1, position: "Gardien" },
      { name: "Pierre Bernard", number: 2, position: "Défenseur" },
      { name: "Jean Moreau", number: 3, position: "Défenseur" },
      { name: "Luc Fontaine", number: 4, position: "Défenseur" },
      { name: "Thomas Leclerc", number: 5, position: "Milieu" },
      { name: "Antoine Rousseau", number: 6, position: "Milieu" },
      { name: "Nicolas Petit", number: 7, position: "Attaquant" },
      { name: "Olivier Girard", number: 8, position: "Attaquant" },
      { name: "Maxime Lefevre", number: 9, position: "Attaquant" },
      { name: "David Renard", number: 10, position: "Milieu" },
      { name: "Christophe Blanc", number: 11, position: "Attaquant" },
    ],
  },
  {
    name: "AS Dragons",
    color: "#dc2626",
    logo: "🐉",
    players: [
      { name: "Fabrice Martin", number: 1, position: "Gardien" },
      { name: "Sébastien Durand", number: 2, position: "Défenseur" },
      { name: "Raphaël Gérard", number: 3, position: "Défenseur" },
      { name: "Grégory Leroy", number: 4, position: "Défenseur" },
      { name: "Stéphane Mercier", number: 5, position: "Milieu" },
      { name: "Jérôme Arnould", number: 6, position: "Milieu" },
      { name: "Adrien Gauthier", number: 7, position: "Attaquant" },
      { name: "Benoît Lemoine", number: 8, position: "Attaquant" },
      { name: "Cédric Renault", number: 9, position: "Attaquant" },
      { name: "Frédéric Lecomte", number: 10, position: "Milieu" },
      { name: "Hervé Deschamps", number: 11, position: "Attaquant" },
    ],
  },
  {
    name: "Olympique Bleu",
    color: "#0369a1",
    logo: "🏅",
    players: [
      { name: "Laurent Fournier", number: 1, position: "Gardien" },
      { name: "Michaël Renard", number: 2, position: "Défenseur" },
      { name: "Yannick Lefevre", number: 3, position: "Défenseur" },
      { name: "Valentin Gros", number: 4, position: "Défenseur" },
      { name: "Quentin Legrand", number: 5, position: "Milieu" },
      { name: "Romain Petit", number: 6, position: "Milieu" },
      { name: "Samuel Leroy", number: 7, position: "Attaquant" },
      { name: "Théo Mercier", number: 8, position: "Attaquant" },
      { name: "Ulysse Arnould", number: 9, position: "Attaquant" },
      { name: "Victor Gauthier", number: 10, position: "Milieu" },
      { name: "Xavier Lemoine", number: 11, position: "Attaquant" },
    ],
  },
  {
    name: "FC Victoire",
    color: "#16a34a",
    logo: "🏆",
    players: [
      { name: "Alain Renault", number: 1, position: "Gardien" },
      { name: "Bruno Lecomte", number: 2, position: "Défenseur" },
      { name: "Claude Deschamps", number: 3, position: "Défenseur" },
      { name: "Daniel Fournier", number: 4, position: "Défenseur" },
      { name: "Éric Renard", number: 5, position: "Milieu" },
      { name: "François Lefevre", number: 6, position: "Milieu" },
      { name: "Gaston Gros", number: 7, position: "Attaquant" },
      { name: "Henri Legrand", number: 8, position: "Attaquant" },
      { name: "Ignace Petit", number: 9, position: "Attaquant" },
      { name: "Jacques Leroy", number: 10, position: "Milieu" },
      { name: "Kévin Mercier", number: 11, position: "Attaquant" },
    ],
  },
]

async function seedDatabase() {
  try {
    console.log("[v0] Début de l'initialisation des données de test...")

    for (const teamData of teamsData) {
      // Créer l'équipe
      const teamRef = await addDoc(collection(db, "teams"), {
        name: teamData.name,
        color: teamData.color,
        logo: teamData.logo,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      console.log(`[v0] Équipe créée: ${teamData.name} (ID: ${teamRef.id})`)

      // Ajouter les joueurs
      for (const player of teamData.players) {
        await addDoc(collection(db, "players"), {
          name: player.name,
          number: player.number,
          position: player.position,
          teamId: teamRef.id,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      }

      console.log(`[v0] ${teamData.players.length} joueurs ajoutés à ${teamData.name}`)
    }

    console.log("[v0] ✅ Données de test créées avec succès!")
    console.log(
      `[v0] ${teamsData.length} équipes et ${teamsData.reduce((sum, t) => sum + t.players.length, 0)} joueurs ont été ajoutés.`,
    )
    process.exit(0)
  } catch (error) {
    console.error("[v0] Erreur lors de l'initialisation:", error)
    process.exit(1)
  }
}

seedDatabase()
