import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

const timestamp = Date.now()

const testTeamData = {
  teamName: 'Les Champions FC',
  schoolName: 'École Oasis Internationale',
  teamGrade: '1ère',
  captain: {
    firstName: 'Rami',
    lastName: 'Khalil',
    email: `rami.khalil.${timestamp}@test.com`,
    phone: '+20 123 456 7800'
  },
  players: [
    {
      firstName: 'Rami',
      lastName: 'Khalil',
      nickname: 'Captain',
      email: `rami.khalil.${timestamp}@test.com`,
      phone: '+20 123 456 7800',
      birthDate: '2007-03-15',
      age: 17,
      height: 175,
      tshirtSize: 'M',
      position: 'Milieu',
      foot: 'Droitier',
      jerseyNumber: 10,
      grade: '1ère'
    },
    {
      firstName: 'Youssef',
      lastName: 'Test',
      nickname: 'YL',
      email: 'youssefloay@gmail.com',
      phone: '+20 123 456 7801',
      birthDate: '2007-05-20',
      age: 17,
      height: 178,
      tshirtSize: 'L',
      position: 'Attaquant',
      foot: 'Droitier',
      jerseyNumber: 7,
      grade: '1ère'
    },
    {
      firstName: 'Sami',
      lastName: 'Nour',
      nickname: 'Sam',
      email: `sami.nour.${timestamp}@test.com`,
      phone: '+20 123 456 7802',
      birthDate: '2007-01-10',
      age: 17,
      height: 180,
      tshirtSize: 'L',
      position: 'Défenseur',
      foot: 'Gaucher',
      jerseyNumber: 4,
      grade: '1ère'
    },
    {
      firstName: 'Fadi',
      lastName: 'Zaki',
      nickname: 'Fado',
      email: `fadi.zaki.${timestamp}@test.com`,
      phone: '+20 123 456 7803',
      birthDate: '2007-07-25',
      age: 17,
      height: 182,
      tshirtSize: 'XL',
      position: 'Gardien',
      foot: 'Droitier',
      jerseyNumber: 1,
      grade: '1ère'
    },
    {
      firstName: 'Nabil',
      lastName: 'Farid',
      nickname: 'Nab',
      email: `nabil.farid.${timestamp}@test.com`,
      phone: '+20 123 456 7804',
      birthDate: '2007-09-12',
      age: 17,
      height: 176,
      tshirtSize: 'M',
      position: 'Milieu',
      foot: 'Ambidextre',
      jerseyNumber: 8,
      grade: '1ère'
    },
    {
      firstName: 'Walid',
      lastName: 'Saad',
      nickname: 'Wally',
      email: `walid.saad.${timestamp}@test.com`,
      phone: '+20 123 456 7805',
      birthDate: '2007-11-30',
      age: 16,
      height: 174,
      tshirtSize: 'M',
      position: 'Attaquant',
      foot: 'Droitier',
      jerseyNumber: 11,
      grade: '1ère'
    },
    {
      firstName: 'Adel',
      lastName: 'Hani',
      nickname: 'Adi',
      email: `adel.hani.${timestamp}@test.com`,
      phone: '+20 123 456 7806',
      birthDate: '2007-04-18',
      age: 17,
      height: 179,
      tshirtSize: 'L',
      position: 'Défenseur',
      foot: 'Droitier',
      jerseyNumber: 5,
      grade: '1ère'
    }
  ],
  status: 'pending',
  submittedAt: serverTimestamp(),
  createdAt: serverTimestamp()
}

async function submitTestTeam() {
  try {
    console.log('📝 Soumission de l\'équipe de test...')
    
    const docRef = await addDoc(collection(db, 'teamRegistrations'), testTeamData)
    
    console.log('✅ Équipe inscrite avec succès!')
    console.log('ID:', docRef.id)
    console.log('Nom:', testTeamData.teamName)
    console.log('École:', testTeamData.schoolName)
    console.log('Joueurs:', testTeamData.players.length)
    console.log('\n📧 Email de test inclus: youssefloay@gmail.com (Joueur #2)')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

submitTestTeam()
