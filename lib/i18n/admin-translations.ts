export type Language = 'fr' | 'en'

export interface AdminTranslations {
  // Common
  common: {
    back: string
    save: string
    cancel: string
    delete: string
    edit: string
    close: string
    search: string
    filter: string
    loading: string
    error: string
    success: string
    confirm: string
    yes: string
    no: string
    actions: string
    details: string
    refresh: string
    total: string
    pending: string
    approved: string
    rejected: string
  }
  
  // Accounts page
  accounts: {
    title: string
    subtitle: string
    users: string
    players: string
    coaches: string
    admins: string
    all: string
    role: string
    team: string
    user: string
    player: string
    admin: string
    resetPassword: string
    deleteAccount: string
    saveChanges: string
    cancelEdit: string
  }
  
  // Team Accounts page
  teamAccounts: {
    title: string
    subtitle: string
    connected: string
    neverConnected: string
    noAccount: string
    resendTeam: string
    createAccount: string
    resendEmail: string
    lastLogin: string
    accountCreated: string
    lastResend: string
    coaches: string
  }
  
  // Search page
  search: {
    title: string
    subtitle: string
    placeholder: string
    noResults: string
    email: string
    phone: string
    position: string
    jerseyNumber: string
    nickname: string
    birthDate: string
    height: string
    foot: string
    tshirtSize: string
    grade: string
    schoolName: string
    teamName: string
    lastLogin: string
    emailVerified: string
    saveChanges: string
    cancelEdit: string
  }
  
  // Stats page
  stats: {
    title: string
    subtitle: string
    overview: string
    teams: string
    withCoach: string
    withoutCoach: string
    players: string
    captains: string
    actingCoaches: string
    matches: string
    played: string
    upcoming: string
    registrations: string
    approved: string
    pending: string
  }
  
  // Media page
  media: {
    title: string
    subtitle: string
    seedPlayers: string
    updateStats: string
    teams: string
    players: string
    logosAdded: string
    photosAdded: string
  }
  
  // Archives page
  archives: {
    title: string
    subtitle: string
    noArchives: string
    archivedAt: string
    teams: string
    players: string
    matches: string
    viewArchive: string
  }
  
  // User Accounts page
  userAccounts: {
    title: string
    subtitle: string
    neverLoggedIn: string
    verified: string
    unknown: string
    disabled: string
    searchPlaceholder: string
    filterByRole: string
    filterByStatus: string
  }
  
  // Duplicate Players page
  duplicatePlayers: {
    title: string
    subtitle: string
    found: string
    noDuplicates: string
    removeFromTeam: string
    confirmRemove: string
    email: string
    name: string
    team: string
    source: string
  }
  
  // Compare Teams page
  compareTeams: {
    title: string
    compareAll: string
    compareAllDesc: string
    team1: string
    team2: string
    selectTeam: string
    searchCriteria: string
    byEmail: string
    byName: string
    compare: string
    comparing: string
    comparingAll: string
    noCommon: string
    commonPlayers: string
    playersInBoth: string
    noDuplicates: string
    selectCriteria: string
    selectTwoTeams: string
    teamsMustBeDifferent: string
  }
  
  // Notification Tracking page
  notificationTracking: {
    title: string
    subtitle: string
    totalRecipients: string
    notificationsRead: string
    averageReadRate: string
    sentAt: string
    targetType: string
    targetValue: string
    readCount: string
    recipientCount: string
    readRate: string
  }
  
  // Team Registrations page
  teamRegistrations: {
    title: string
    subtitle: string
    all: string
    pending: string
    approved: string
    rejected: string
    waitingList: string
    stats: {
      total: string
      pending: string
      approved: string
      rejected: string
      waitingList: string
    }
    filters: {
      all: string
      pending: string
      approved: string
      rejected: string
      waitingList: string
    }
    actions: {
      approve: string
      reject: string
      edit: string
      delete: string
      viewDetails: string
      moveToWaitingList: string
      removeFromWaitingList: string
      sendEmail: string
    }
    details: {
      captain: string
      coach: string
      players: string
      school: string
      createdAt: string
      status: string
    }
    waitingList: {
      title: string
      subtitle: string
      enable: string
      disable: string
      customMessage: string
      saveMessage: string
      teamsInWaitingList: string
      noTeams: string
      movedToWaitingList: string
    }
    noRegistrations: string
  }
}

export const translations: Record<Language, AdminTranslations> = {
  fr: {
    common: {
      back: 'Retour',
      save: 'Sauvegarder',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      close: 'Fermer',
      search: 'Rechercher',
      filter: 'Filtrer',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      confirm: 'Confirmer',
      yes: 'Oui',
      no: 'Non',
      actions: 'Actions',
      details: 'Détails',
      refresh: 'Actualiser',
      total: 'Total',
      pending: 'En attente',
      approved: 'Approuvé',
      rejected: 'Rejeté',
    },
    accounts: {
      title: 'Gestion des Comptes',
      subtitle: 'Gérez les rôles et les équipes des utilisateurs',
      users: 'Utilisateurs',
      players: 'Joueurs',
      coaches: 'Coachs',
      admins: 'Admins',
      all: 'Tous',
      role: 'Rôle',
      team: 'Équipe',
      user: 'Utilisateur',
      player: 'Joueur',
      admin: 'Admin',
      resetPassword: 'Réinitialiser mot de passe',
      deleteAccount: 'Supprimer le compte',
      saveChanges: 'Sauvegarder',
      cancelEdit: 'Annuler',
    },
    teamAccounts: {
      title: 'Comptes par équipe',
      subtitle: 'Statut de connexion et activation',
      connected: 'Déjà connectés',
      neverConnected: 'Jamais connectés',
      noAccount: 'Sans compte',
      resendTeam: "Relancer l'équipe",
      createAccount: 'Créer le compte',
      resendEmail: "Renvoyer l'email",
      lastLogin: 'Dernière connexion',
      accountCreated: 'Compte créé',
      lastResend: 'Dernière relance',
      coaches: 'Coachs',
    },
    search: {
      title: 'Recherche globale',
      subtitle: 'Recherchez rapidement un joueur ou un entraîneur',
      placeholder: 'Tapez un nom, email, équipe ou position...',
      noResults: 'Aucun résultat trouvé',
      email: 'Email',
      phone: 'Téléphone',
      position: 'Position',
      jerseyNumber: 'Numéro',
      nickname: 'Surnom',
      birthDate: 'Date de naissance',
      height: 'Taille',
      foot: 'Pied',
      tshirtSize: 'Taille T-shirt',
      grade: 'Niveau',
      schoolName: 'École',
      teamName: 'Équipe',
      lastLogin: 'Dernière connexion',
      emailVerified: 'Email vérifié',
      saveChanges: 'Sauvegarder',
      cancelEdit: 'Annuler',
    },
    stats: {
      title: 'Statistiques',
      subtitle: "Vue d'ensemble de la plateforme",
      overview: 'Vue d\'ensemble',
      teams: 'Équipes',
      withCoach: 'Avec coach',
      withoutCoach: 'Sans coach',
      players: 'Joueurs',
      captains: 'Capitaines',
      actingCoaches: 'Coaches intérimaires',
      matches: 'Matchs',
      played: 'Joués',
      upcoming: 'À venir',
      registrations: 'Inscriptions',
      approved: 'Approuvées',
      pending: 'En attente',
    },
    media: {
      title: 'Gestion des Médias',
      subtitle: 'Gérez les logos d\'équipes, photos de joueurs et statistiques FIFA',
      seedPlayers: 'Seed Joueurs + Photos',
      updateStats: 'Mettre à jour les stats',
      teams: 'Équipes',
      players: 'Joueurs',
      logosAdded: 'Logos ajoutés',
      photosAdded: 'Photos ajoutées',
    },
    archives: {
      title: 'Archives des Saisons',
      subtitle: 'Consultez les statistiques des saisons passées',
      noArchives: 'Aucune saison archivée pour le moment',
      archivedAt: 'Archivé le',
      teams: 'Équipes',
      players: 'Joueurs',
      matches: 'Matchs',
      viewArchive: 'Voir l\'archive',
    },
    userAccounts: {
      title: 'Comptes utilisateurs',
      subtitle: 'Gérer tous les comptes Firebase Auth',
      neverLoggedIn: 'Jamais connectés',
      verified: 'Vérifiés',
      unknown: 'Inconnus',
      disabled: 'Désactivés',
      searchPlaceholder: 'Rechercher par nom, email ou équipe...',
      filterByRole: 'Filtrer par rôle',
      filterByStatus: 'Filtrer par statut',
    },
    duplicatePlayers: {
      title: 'Joueurs dans Plusieurs Équipes',
      subtitle: 'Détecter et gérer les joueurs présents dans plusieurs équipes validées',
      found: 'joueur trouvé dans plusieurs équipes',
      noDuplicates: 'Aucun joueur trouvé dans plusieurs équipes',
      removeFromTeam: 'Retirer de l\'équipe',
      confirmRemove: 'Retirer ce joueur de cette équipe spécifique?',
      email: 'Email',
      name: 'Nom',
      team: 'Équipe',
      source: 'Source',
    },
    compareTeams: {
      title: 'Comparer Deux Équipes',
      compareAll: 'Comparer toutes les équipes entre elles',
      compareAllDesc: 'Compare toutes les équipes deux par deux pour trouver tous les joueurs en commun',
      team1: 'Équipe 1',
      team2: 'Équipe 2',
      selectTeam: 'Sélectionner une équipe',
      searchCriteria: 'Critères de recherche',
      byEmail: 'Par email',
      byName: 'Par nom + prénom',
      compare: 'Comparer',
      comparing: 'Comparaison...',
      comparingAll: 'Comparaison de toutes les équipes...',
      noCommon: 'Aucun joueur en commun',
      commonPlayers: 'Joueurs dans les 2 équipes',
      playersInBoth: 'joueur en commun',
      noDuplicates: 'Aucun doublon',
      selectCriteria: 'Sélectionnez les critères et cliquez sur "Comparer"',
      selectTwoTeams: 'Sélectionnez les deux équipes et les critères de recherche',
      teamsMustBeDifferent: 'Les deux équipes doivent être différentes',
    },
    notificationTracking: {
      title: 'Suivi des notifications',
      subtitle: 'Statistiques de lecture et engagement',
      totalRecipients: 'Total destinataires',
      notificationsRead: 'Notifications lues',
      averageReadRate: 'Taux de lecture moyen',
      sentAt: 'Envoyé le',
      targetType: 'Type de cible',
      targetValue: 'Valeur cible',
      readCount: 'Lus',
      recipientCount: 'Destinataires',
      readRate: 'Taux de lecture',
    },
    teamRegistrations: {
      title: 'Inscriptions d\'équipes',
      subtitle: 'Gérez les inscriptions et validations d\'équipes',
      all: 'Toutes',
      pending: 'En attente',
      approved: 'Approuvées',
      rejected: 'Rejetées',
      waitingList: 'Waiting List',
      stats: {
        total: 'Total',
        pending: 'En attente',
        approved: 'Approuvées',
        rejected: 'Rejetées',
        waitingList: 'Waiting List',
      },
      filters: {
        all: 'Toutes',
        pending: 'En attente',
        approved: 'Approuvées',
        rejected: 'Rejetées',
        waitingList: 'Waiting List',
      },
      actions: {
        approve: 'Approuver',
        reject: 'Rejeter',
        edit: 'Modifier',
        delete: 'Supprimer',
        viewDetails: 'Voir les détails',
        moveToWaitingList: 'Mettre en waiting list',
        removeFromWaitingList: 'Retirer de la waiting list',
        sendEmail: 'Email',
      },
      details: {
        captain: 'Capitaine',
        coach: 'Entraîneur',
        players: 'Joueurs',
        school: 'École',
        createdAt: 'Créé le',
        status: 'Statut',
      },
      waitingList: {
        title: 'Gestion de la Liste d\'Attente',
        subtitle: 'Activez ou désactivez le système de waiting list pour les inscriptions d\'équipes',
        enable: 'Activer',
        disable: 'Désactiver',
        customMessage: 'Message personnalisé',
        saveMessage: 'Enregistrer le message',
        teamsInWaitingList: 'Équipes en Waiting List',
        noTeams: 'Aucune équipe en waiting list',
        movedToWaitingList: 'Mise en waiting list le',
      },
      noRegistrations: 'Aucune inscription trouvée',
    },
  },
  en: {
    common: {
      back: 'Back',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      search: 'Search',
      filter: 'Filter',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      actions: 'Actions',
      details: 'Details',
      refresh: 'Refresh',
      total: 'Total',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
    },
    accounts: {
      title: 'Account Management',
      subtitle: 'Manage user roles and teams',
      users: 'Users',
      players: 'Players',
      coaches: 'Coaches',
      admins: 'Admins',
      all: 'All',
      role: 'Role',
      team: 'Team',
      user: 'User',
      player: 'Player',
      admin: 'Admin',
      resetPassword: 'Reset Password',
      deleteAccount: 'Delete Account',
      saveChanges: 'Save',
      cancelEdit: 'Cancel',
    },
    teamAccounts: {
      title: 'Team Accounts',
      subtitle: 'Connection and activation status',
      connected: 'Already connected',
      neverConnected: 'Never connected',
      noAccount: 'No account',
      resendTeam: 'Resend team',
      createAccount: 'Create account',
      resendEmail: 'Resend email',
      lastLogin: 'Last login',
      accountCreated: 'Account created',
      lastResend: 'Last resend',
      coaches: 'Coaches',
    },
    search: {
      title: 'Global Search',
      subtitle: 'Quickly search for a player or coach',
      placeholder: 'Type a name, email, team or position...',
      noResults: 'No results found',
      email: 'Email',
      phone: 'Phone',
      position: 'Position',
      jerseyNumber: 'Number',
      nickname: 'Nickname',
      birthDate: 'Birth Date',
      height: 'Height',
      foot: 'Foot',
      tshirtSize: 'T-shirt Size',
      grade: 'Grade',
      schoolName: 'School',
      teamName: 'Team',
      lastLogin: 'Last login',
      emailVerified: 'Email verified',
      saveChanges: 'Save',
      cancelEdit: 'Cancel',
    },
    stats: {
      title: 'Statistics',
      subtitle: 'Platform overview',
      overview: 'Overview',
      teams: 'Teams',
      withCoach: 'With coach',
      withoutCoach: 'Without coach',
      players: 'Players',
      captains: 'Captains',
      actingCoaches: 'Acting coaches',
      matches: 'Matches',
      played: 'Played',
      upcoming: 'Upcoming',
      registrations: 'Registrations',
      approved: 'Approved',
      pending: 'Pending',
    },
    media: {
      title: 'Media Management',
      subtitle: 'Manage team logos, player photos and FIFA statistics',
      seedPlayers: 'Seed Players + Photos',
      updateStats: 'Update stats',
      teams: 'Teams',
      players: 'Players',
      logosAdded: 'Logos added',
      photosAdded: 'Photos added',
    },
    archives: {
      title: 'Season Archives',
      subtitle: 'View statistics from past seasons',
      noArchives: 'No archived seasons yet',
      archivedAt: 'Archived on',
      teams: 'Teams',
      players: 'Players',
      matches: 'Matches',
      viewArchive: 'View archive',
    },
    userAccounts: {
      title: 'User Accounts',
      subtitle: 'Manage all Firebase Auth accounts',
      neverLoggedIn: 'Never logged in',
      verified: 'Verified',
      unknown: 'Unknown',
      disabled: 'Disabled',
      searchPlaceholder: 'Search by name, email or team...',
      filterByRole: 'Filter by role',
      filterByStatus: 'Filter by status',
    },
    duplicatePlayers: {
      title: 'Players in Multiple Teams',
      subtitle: 'Detect and manage players present in multiple validated teams',
      found: 'player found in multiple teams',
      noDuplicates: 'No player found in multiple teams',
      removeFromTeam: 'Remove from team',
      confirmRemove: 'Remove this player from this specific team?',
      email: 'Email',
      name: 'Name',
      team: 'Team',
      source: 'Source',
    },
    compareTeams: {
      title: 'Compare Two Teams',
      compareAll: 'Compare all teams with each other',
      compareAllDesc: 'Compare all teams two by two to find all common players',
      team1: 'Team 1',
      team2: 'Team 2',
      selectTeam: 'Select a team',
      searchCriteria: 'Search criteria',
      byEmail: 'By email',
      byName: 'By name + surname',
      compare: 'Compare',
      comparing: 'Comparing...',
      comparingAll: 'Comparing all teams...',
      noCommon: 'No common players',
      commonPlayers: 'Players in both teams',
      playersInBoth: 'player in common',
      noDuplicates: 'No duplicates',
      selectCriteria: 'Select criteria and click "Compare"',
      selectTwoTeams: 'Select both teams and search criteria',
      teamsMustBeDifferent: 'The two teams must be different',
    },
    notificationTracking: {
      title: 'Notification Tracking',
      subtitle: 'Read and engagement statistics',
      totalRecipients: 'Total recipients',
      notificationsRead: 'Notifications read',
      averageReadRate: 'Average read rate',
      sentAt: 'Sent on',
      targetType: 'Target type',
      targetValue: 'Target value',
      readCount: 'Read',
      recipientCount: 'Recipients',
      readRate: 'Read rate',
    },
    teamRegistrations: {
      title: 'Team Registrations',
      subtitle: 'Manage team registrations and validations',
      all: 'All',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      waitingList: 'Waiting List',
      stats: {
        total: 'Total',
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        waitingList: 'Waiting List',
      },
      filters: {
        all: 'All',
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        waitingList: 'Waiting List',
      },
      actions: {
        approve: 'Approve',
        reject: 'Reject',
        edit: 'Edit',
        delete: 'Delete',
        viewDetails: 'View Details',
        moveToWaitingList: 'Move to Waiting List',
        removeFromWaitingList: 'Remove from Waiting List',
        sendEmail: 'Email',
      },
      details: {
        captain: 'Captain',
        coach: 'Coach',
        players: 'Players',
        school: 'School',
        createdAt: 'Created on',
        status: 'Status',
      },
      waitingList: {
        title: 'Waiting List Management',
        subtitle: 'Enable or disable the waiting list system for team registrations',
        enable: 'Enable',
        disable: 'Disable',
        customMessage: 'Custom message',
        saveMessage: 'Save message',
        teamsInWaitingList: 'Teams in Waiting List',
        noTeams: 'No teams in waiting list',
        movedToWaitingList: 'Moved to waiting list on',
      },
      noRegistrations: 'No registrations found',
    },
  },
}

