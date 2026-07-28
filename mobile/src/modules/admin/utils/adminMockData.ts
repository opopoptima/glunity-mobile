import { AdminUserListItem } from '../api/admin.api';

export interface UserStats {
  posts: number;
  comments: number;
  events: number;
  followers: number;
  reports: number;
  warnings: number;
  deletedContent: number;
  logins: number;
  purchases: number;
  reviews: number;
}

export interface RiskAnalysis {
  score: 'low' | 'medium' | 'high';
  scoreLabel: string;
  reports: number;
  spamFlags: number;
  deletedPosts: number;
  prevSuspensions: number;
  toxicityScore: number; // 0 to 100
  fakeAccountIndicator: 'low' | 'medium' | 'high';
}

export interface ActivityTimelineItem {
  id: string;
  type: 'event' | 'post' | 'comment' | 'profile' | 'purchase' | 'login' | 'report' | 'delete' | 'warning' | 'suspension';
  title: string;
  description: string;
  date: string;
  icon: string;
  color: string;
}

export interface ContentPreviewItem {
  id: string;
  title: string;
  previewText: string;
  date: string;
  status?: string;
  extraInfo?: string;
}

export interface ReportItem {
  id: string;
  reporter: string;
  category: string;
  description: string;
  date: string;
  evidence: string;
  status: 'pending' | 'resolved' | 'dismissed' | 'escalated';
}

export interface ModerationHistoryItem {
  id: string;
  action: string;
  adminName: string;
  date: string;
  reason: string;
  duration?: string;
}

export interface EnrichedUserDetail {
  user: AdminUserListItem;
  phone: string;
  location: string;
  accountAge: string;
  lastActiveLabel: string;
  stats: UserStats;
  risk: RiskAnalysis;
  timeline: ActivityTimelineItem[];
  tabsData: {
    posts: ContentPreviewItem[];
    comments: ContentPreviewItem[];
    events: ContentPreviewItem[];
    marketplace: ContentPreviewItem[];
    reviews: ContentPreviewItem[];
    purchases: ContentPreviewItem[];
  };
  reports: ReportItem[];
  history: ModerationHistoryItem[];
}

// Simple deterministic hash based on user ID string
function getHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getEnrichedUserDetail(user: AdminUserListItem): EnrichedUserDetail {
  const hash = getHash(user.id || user.fullName);

  // Stats calculation
  const posts = (hash % 15) + 1;
  const comments = (hash % 45) + 3;
  const events = user.profileType === 'pro_commerce' || user.profileType === 'pro_health' ? (hash % 6) + 1 : (hash % 2);
  const followers = (hash % 350) + 12;
  const warnings = user.status === 'suspended' ? (hash % 3) + 1 : (hash % 2);
  
  // A suspended user or user with reports has higher risk factors
  let reports = 0;
  if (user.status === 'suspended') {
    reports = (hash % 4) + 2;
  } else if (hash % 5 === 0) {
    reports = (hash % 3) + 1;
  }
  
  const deletedContent = (hash % 4) + (reports > 0 ? 1 : 0);
  const logins = (hash % 120) + 15;
  const purchases = user.profileType === 'celiac' ? (hash % 12) : 0;
  const reviews = (hash % 8);

  const stats: UserStats = {
    posts,
    comments,
    events,
    followers,
    reports,
    warnings,
    deletedContent,
    logins,
    purchases,
    reviews
  };

  // Phone and location
  const phone = `+33 6 ${(hash % 90000000) + 10000000}`;
  const location = user.city && user.city !== 'Non spécifié' ? user.city : ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Nantes', 'Strasbourg'][(hash % 7)];
  
  // Account age
  const joinedDate = new Date(user.joinedDate);
  const diffTime = Math.abs(new Date().getTime() - joinedDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  let accountAge = `${diffDays} jours`;
  if (diffDays > 365) {
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    accountAge = `${years} an${years > 1 ? 's' : ''} ${months} mois`;
  } else if (diffDays > 30) {
    const months = Math.floor(diffDays / 30);
    accountAge = `${months} mois`;
  }

  // Last active label
  const activeHoursAgo = hash % 24;
  const lastActiveLabel = activeHoursAgo === 0 ? 'À l\'instant' : `Il y a ${activeHoursAgo}h`;

  // Risk Score determination
  let score: 'low' | 'medium' | 'high' = 'low';
  let scoreLabel = 'Faible Risque';
  if (user.status === 'suspended') {
    score = 'high';
    scoreLabel = 'Risque Élevé';
  } else if (reports >= 2 || warnings > 1 || deletedContent >= 3) {
    score = 'high';
    scoreLabel = 'Risque Élevé';
  } else if (reports === 1 || deletedContent > 0 || hash % 4 === 0) {
    score = 'medium';
    scoreLabel = 'Risque Modéré';
  }

  const risk: RiskAnalysis = {
    score,
    scoreLabel,
    reports,
    spamFlags: hash % 3,
    deletedPosts: deletedContent,
    prevSuspensions: user.status === 'suspended' ? 1 : 0,
    toxicityScore: (hash % 30) + (reports * 15),
    fakeAccountIndicator: (hash % 7 === 0) ? 'medium' : 'low'
  };

  // Timeline Items
  const timeline: ActivityTimelineItem[] = [
    {
      id: `${user.id}-tl-1`,
      type: 'login',
      title: 'Utilisateur connecté',
      description: `Connexion à l'application depuis ${location}`,
      date: 'Aujourd\'hui, 10:24',
      icon: 'login',
      color: '#3B82F6'
    }
  ];

  if (posts > 0) {
    timeline.push({
      id: `${user.id}-tl-2`,
      type: 'post',
      title: 'Publication créée',
      description: 'A partagé une nouvelle recette sans gluten',
      date: 'Hier, 15:40',
      icon: 'file-text',
      color: '#8BC34A'
    });
  }

  if (comments > 0) {
    timeline.push({
      id: `${user.id}-tl-3`,
      type: 'comment',
      title: 'Commentaire ajouté',
      description: 'A répondu sur le fil : "Meilleurs restaus gluten-free à Paris"',
      date: 'Il y a 2 jours',
      icon: 'message-square',
      color: '#A855F7'
    });
  }

  if (reports > 0) {
    timeline.push({
      id: `${user.id}-tl-4`,
      type: 'report',
      title: 'Signalement reçu',
      description: 'Contenu signalé pour comportement inapproprié (Spam)',
      date: 'Il y a 5 jours',
      icon: 'alert-triangle',
      color: '#EF4444'
    });
  }

  if (warnings > 0) {
    timeline.push({
      id: `${user.id}-tl-5`,
      type: 'warning',
      title: 'Avertissement envoyé',
      description: 'Averti par Admin Claire pour propos hors-sujet répétitifs',
      date: 'Il y a 10 jours',
      icon: 'bell',
      color: '#F59E0B'
    });
  }

  if (user.status === 'suspended') {
    timeline.push({
      id: `${user.id}-tl-6`,
      type: 'suspension',
      title: 'Compte Suspendu',
      description: 'Suspendu pour non-respect des conditions d\'utilisation (Harcèlement)',
      date: 'Il y a 12 jours',
      icon: 'user-x',
      color: '#EF4444'
    });
  } else {
    timeline.push({
      id: `${user.id}-tl-7`,
      type: 'profile',
      title: 'Profil mis à jour',
      description: 'Modification de la bio et des préférences de régime',
      date: 'Il y a 2 semaines',
      icon: 'user',
      color: '#06B6D4'
    });
  }

  // Previews Data for Content Tabs
  const tabsData = {
    posts: Array.from({ length: posts }).map((_, i) => ({
      id: `${user.id}-post-${i}`,
      title: `Recette délicieuse #${i + 1}`,
      previewText: `Voici comment préparer un pain sans gluten extra-moelleux en utilisant de la farine de riz et du psyllium...`,
      date: `Le ${new Date(joinedDate.getTime() + i * 24 * 3600 * 1000).toLocaleDateString('fr-FR')}`,
      status: i % 3 === 0 ? 'Reported' : 'Active',
      extraInfo: `${12 + i * 4} j'aime • ${2 + i} commentaires`
    })),
    comments: Array.from({ length: comments }).map((_, i) => ({
      id: `${user.id}-comment-${i}`,
      title: `Sur : Guide des farines alternatives`,
      previewText: `Je recommande vivement d'ajouter une cuillère à café de gomme de guar, ça change tout pour la texture !`,
      date: `Le ${new Date(joinedDate.getTime() + i * 12 * 3600 * 1000).toLocaleDateString('fr-FR')}`,
      status: 'Active',
      extraInfo: `Score d'utilité : ${i * 3}`
    })),
    events: Array.from({ length: events }).map((_, i) => ({
      id: `${user.id}-event-${i}`,
      title: `Atelier Cuisine Sans Gluten #${i + 1}`,
      previewText: `Rejoignez-nous pour un cours pratique de pâtisserie pour apprendre à faire des chouquettes parfaites.`,
      date: `Prévu le : 14/09/2026`,
      status: 'A venir',
      extraInfo: `${15 + i * 5} inscrits • En ligne`
    })),
    marketplace: user.profileType === 'pro_commerce' ? Array.from({ length: 3 }).map((_, i) => ({
      id: `${user.id}-item-${i}`,
      title: `Pain Artisanal Bio - ${6 + i}€`,
      previewText: `Produit frais préparé chaque matin dans notre boulangerie certifiée AFDIAG.`,
      date: `Publié le 12/06/2026`,
      status: 'En stock',
      extraInfo: `Ventes : ${i * 8}`
    })) : [],
    reviews: Array.from({ length: reviews }).map((_, i) => ({
      id: `${user.id}-review-${i}`,
      title: `Note de 4.5/5 pour : Boulangerie L'Épi Sans Gluten`,
      previewText: `Super accueil et grand choix de pâtisseries fraîches. Un peu cher mais la qualité est au rendez-vous.`,
      date: `Le 25/05/2026`,
      status: 'Approuvé'
    })),
    purchases: Array.from({ length: purchases }).map((_, i) => ({
      id: `${user.id}-purchase-${i}`,
      title: `Commande #${10240 + i}`,
      previewText: `Achat de : Panier Découverte Gluten-Free • Total : ${(25 + i * 5).toFixed(2)} €`,
      date: `Le 02/06/2026`,
      status: i % 2 === 0 ? 'Livré' : 'Expédié'
    }))
  };

  // Reports
  const reportsList: ReportItem[] = Array.from({ length: reports }).map((_, i) => {
    const categories = ['Spam', 'Harcèlement', 'Contenu Inapproprié', 'Hate Speech'];
    const statuses: ('pending' | 'resolved' | 'dismissed' | 'escalated')[] = ['pending', 'resolved', 'dismissed', 'escalated'];
    return {
      id: `${user.id}-rep-${i}`,
      reporter: `Utilisateur_${100 + i}`,
      category: categories[i % categories.length],
      description: `Comportement agressif et spam de liens promotionnels dans les commentaires de l'événement.`,
      date: `Le ${new Date(joinedDate.getTime() + (i + 1) * 3600 * 24 * 1000).toLocaleDateString('fr-FR')}`,
      evidence: `Commentaire ID #${hash % 1000 + i} : "Visitez mon site pour des remèdes miracles sans gluten !!"`,
      status: statuses[i % statuses.length]
    };
  });

  // History
  const history: ModerationHistoryItem[] = [];
  if (warnings > 0) {
    history.push({
      id: `${user.id}-hist-1`,
      action: 'Avertissement',
      adminName: 'Admin_Sophie',
      date: '10/07/2026',
      reason: 'Spam mineur de commentaires promotionnels.'
    });
  }
  if (user.status === 'suspended') {
    history.push({
      id: `${user.id}-hist-2`,
      action: 'Suspension Temporaire',
      adminName: 'Admin_Marc',
      date: '15/07/2026',
      reason: 'Récidive de spam commercial agressif après avertissement.',
      duration: '7 jours'
    });
  }

  return {
    user,
    phone,
    location,
    accountAge,
    lastActiveLabel,
    stats,
    risk,
    timeline,
    tabsData,
    reports: reportsList,
    history
  };
}
