/**
 * Fixtures de données de test pour les pages Tenders
 * Données réutilisables à travers tous les tests
 */

import type { Tender, TenderDetail, TenderWithRelevance, TenderDocument } from '@/types';

/**
 * Tender de base pour les tests
 */
export const baseTender: Tender = {
  id: '1',
  reference: 'REF-001',
  title: 'Fourniture de matériel informatique',
  client: 'Mairie de Paris',
  source: 'BOAMP',
  status: 'NEW',
  budget: 50000,
  deadline: '2026-03-15T23:59:59Z',
  publication_date: '2026-01-20T10:00:00Z',
  url: 'https://boamp.example.com/tender/001',
  description: 'Achat de matériel informatique pour les services municipaux',
  cpv_codes: ['30213000-5'],
  score: 85,
  risk_score: 20,
  created_at: '2026-01-20T10:00:00Z',
  updated_at: '2026-01-20T10:00:00Z',
};

/**
 * Liste de tenders avec différents statuts
 */
export const mockTenders: Tender[] = [
  baseTender,
  {
    id: '2',
    reference: 'REF-002',
    title: 'Maintenance des espaces verts',
    client: 'Conseil Départemental',
    source: 'TED',
    status: 'ANALYZING',
    budget: 120000,
    deadline: '2026-02-28T23:59:59Z',
    publication_date: '2026-01-18T09:00:00Z',
    url: 'https://ted.example.com/tender/002',
    description: 'Entretien des parcs et jardins publics',
    cpv_codes: ['77310000-6'],
    score: 65,
    risk_score: 45,
    created_at: '2026-01-18T09:00:00Z',
    updated_at: '2026-01-20T08:00:00Z',
  },
  {
    id: '3',
    reference: 'REF-003',
    title: 'Construction de bureaux',
    client: 'Préfecture',
    source: 'PLACE',
    status: 'SCORED',
    budget: 2500000,
    deadline: '2026-04-30T23:59:59Z',
    publication_date: '2026-01-15T14:00:00Z',
    description: 'Construction de nouveaux locaux administratifs',
    cpv_codes: ['45000000-7'],
    score: 72,
    risk_score: 35,
    created_at: '2026-01-15T14:00:00Z',
    updated_at: '2026-01-19T16:00:00Z',
  },
];

/**
 * Tenders avec scores de pertinence
 */
export const mockRelevantTenders: TenderWithRelevance[] = mockTenders.map(
  (tender, index) =>
    ({
      ...tender,
      relevance_score: 90 - index * 10,
      relevance_details: {
        domain_match: 35 - index * 5,
        cpv_match: 20 - index * 2,
        geo_match: 12,
        budget_match: 8,
        cert_match: 10,
      },
      recommendation: index === 0 ? 'excellent' : index === 1 ? 'bon' : 'moyen',
      matched_keywords: ['informatique', 'équipement'],
    } as TenderWithRelevance)
);

/**
 * Tender détaillé complet
 */
export const mockTenderDetail: TenderDetail = {
  id: 'tender-123',
  reference: 'REF-2026-001',
  title: 'Fourniture de matériel informatique pour établissements scolaires',
  client: 'Mairie de Lyon',
  source: 'BOAMP',
  status: 'ANALYZING',
  budget: 250000,
  deadline: '2026-03-15T23:59:59Z',
  publication_date: '2026-01-20T10:00:00Z',
  url: 'https://boamp.example.com/tender/001',
  description:
    'Achat de matériel informatique (ordinateurs, tablettes, projecteurs) pour équiper les établissements scolaires de la ville de Lyon. Le marché comprend également la maintenance du matériel pendant 3 ans.',
  cpv_codes: ['30213000-5', '30231300-0'],
  score: 85,
  risk_score: 25,
  created_at: '2026-01-20T10:00:00Z',
  updated_at: '2026-01-22T14:30:00Z',
  acheteur: {
    nom: 'Mairie de Lyon',
    adresse: '1 Place de la Comédie, 69001 Lyon',
    contact: 'marches@mairie-lyon.fr',
  },
  criteres_jugement: [
    { critere: 'Prix', ponderation: 40 },
    { critere: 'Qualité technique', ponderation: 35 },
    { critere: 'Délais de livraison', ponderation: 15 },
    { critere: 'Service après-vente', ponderation: 10 },
  ],
  delais: {
    depot: '2026-03-15T23:59:59Z',
    execution: '6 mois',
    garantie: '3 ans',
  },
  lots: [
    {
      lot_number: 1,
      title: 'Ordinateurs portables',
      description: '200 ordinateurs portables pour les enseignants',
      budget: 150000,
    },
    {
      lot_number: 2,
      title: 'Tablettes numériques',
      description: '500 tablettes pour les élèves',
      budget: 75000,
    },
    {
      lot_number: 3,
      title: 'Projecteurs interactifs',
      description: '50 projecteurs pour les salles de classe',
      budget: 25000,
    },
  ],
  requirements: [
    {
      id: 'req-1',
      type: 'TECHNIQUE',
      title: 'Certification CE pour tout le matériel',
      description: 'Tous les équipements doivent être certifiés CE',
      mandatory: true,
      score: 95,
    },
    {
      id: 'req-2',
      type: 'TECHNIQUE',
      title: 'Garantie constructeur minimum 3 ans',
      description: "Garantie pièces et main d'œuvre",
      mandatory: true,
      score: 90,
    },
    {
      id: 'req-3',
      type: 'ADMINISTRATIVE',
      title: 'Assurance RC professionnelle',
      description: "Attestation d'assurance valide",
      mandatory: true,
      score: 100,
    },
    {
      id: 'req-4',
      type: 'COMMERCIAL',
      title: 'Délai de livraison maximum 3 mois',
      description: 'À partir de la notification du marché',
      mandatory: false,
      score: 70,
    },
  ],
  documents: [
    {
      name: 'DCE_complet.pdf',
      type: 'application/pdf',
      size: 2456789,
      modified: '2026-01-20T10:00:00Z',
    },
    {
      name: 'CCTP.pdf',
      type: 'application/pdf',
      size: 856234,
      modified: '2026-01-20T10:00:00Z',
    },
    {
      name: 'RC.pdf',
      type: 'application/pdf',
      size: 345678,
      modified: '2026-01-20T10:00:00Z',
    },
  ],
};

/**
 * Documents de test
 */
export const mockDocuments: TenderDocument[] = [
  {
    name: 'DCE_complet.pdf',
    type: 'application/pdf',
    size: 2456789,
    modified: '2026-01-20T10:00:00Z',
  },
  {
    name: 'CCTP.pdf',
    type: 'application/pdf',
    size: 856234,
    modified: '2026-01-20T10:00:00Z',
  },
  {
    name: 'RC.pdf',
    type: 'application/pdf',
    size: 345678,
    modified: '2026-01-20T10:00:00Z',
  },
  {
    name: 'Annexe_technique.pdf',
    type: 'application/pdf',
    size: 1234567,
    modified: '2026-01-20T10:00:00Z',
  },
];

/**
 * Résultats de matching de test
 */
export const mockMatchingResults = {
  matching_rate: 78.5,
  matched_products: [
    {
      requirement_id: 'req-1',
      product_id: 'prod-a1b2c3',
      score: 0.92,
    },
    {
      requirement_id: 'req-2',
      product_id: 'prod-d4e5f6',
      score: 0.85,
    },
    {
      requirement_id: 'req-3',
      product_id: 'prod-g7h8i9',
      score: 0.68,
    },
  ],
};

/**
 * Résultats de matching avec taux élevé
 */
export const mockHighMatchingResults = {
  matching_rate: 92.3,
  matched_products: [
    {
      requirement_id: 'req-1',
      product_id: 'prod-x1y2z3',
      score: 0.95,
    },
    {
      requirement_id: 'req-2',
      product_id: 'prod-a4b5c6',
      score: 0.91,
    },
    {
      requirement_id: 'req-3',
      product_id: 'prod-d7e8f9',
      score: 0.89,
    },
    {
      requirement_id: 'req-4',
      product_id: 'prod-g1h2i3',
      score: 0.94,
    },
  ],
};

/**
 * Résultats de matching avec taux faible
 */
export const mockLowMatchingResults = {
  matching_rate: 45.2,
  matched_products: [
    {
      requirement_id: 'req-1',
      product_id: 'prod-low1',
      score: 0.52,
    },
  ],
};

/**
 * Résultats de conformité de test
 */
export const mockComplianceResults = {
  compliance_score: 88,
  checks: [
    {
      check_id: 'check-1',
      name: 'Vérification des certifications',
      passed: true,
      details: 'Toutes les certifications requises sont présentes',
    },
    {
      check_id: 'check-2',
      name: 'Vérification des délais',
      passed: true,
      details: 'Les délais proposés respectent les exigences',
    },
    {
      check_id: 'check-3',
      name: 'Vérification des capacités financières',
      passed: false,
      details: "Chiffre d'affaires insuffisant pour le montant du marché",
    },
  ],
};

/**
 * Résultats de conformité parfaite
 */
export const mockPerfectComplianceResults = {
  compliance_score: 100,
  checks: [
    {
      check_id: 'check-1',
      name: 'Vérification des certifications',
      passed: true,
      details: 'Toutes les certifications sont présentes et valides',
    },
    {
      check_id: 'check-2',
      name: 'Vérification des délais',
      passed: true,
      details: 'Les délais respectent parfaitement les exigences',
    },
    {
      check_id: 'check-3',
      name: 'Vérification des capacités financières',
      passed: true,
      details: 'Capacités financières largement suffisantes',
    },
    {
      check_id: 'check-4',
      name: 'Vérification des références',
      passed: true,
      details: 'Références clients excellentes',
    },
  ],
};

/**
 * Résultats de conformité faible
 */
export const mockPoorComplianceResults = {
  compliance_score: 42,
  checks: [
    {
      check_id: 'check-1',
      name: 'Vérification des certifications',
      passed: false,
      details: 'Certifications manquantes ou expirées',
    },
    {
      check_id: 'check-2',
      name: 'Vérification des délais',
      passed: false,
      details: 'Délais proposés dépassent les limites acceptables',
    },
    {
      check_id: 'check-3',
      name: 'Vérification des capacités financières',
      passed: true,
      details: 'Capacités financières suffisantes',
    },
    {
      check_id: 'check-4',
      name: 'Vérification technique',
      passed: false,
      details: 'Spécifications techniques non conformes',
    },
  ],
};

/**
 * Tender sans données optionnelles
 */
export const mockMinimalTender: Tender = {
  id: 'minimal-1',
  reference: 'MIN-001',
  title: 'Tender minimal',
  client: 'Client Test',
  source: 'UPLOAD',
  status: 'NEW',
  created_at: '2026-01-20T10:00:00Z',
  updated_at: '2026-01-20T10:00:00Z',
};

/**
 * Tender expiré
 */
export const mockExpiredTender: Tender = {
  ...baseTender,
  id: 'expired-1',
  status: 'EXPIRED',
  deadline: '2025-12-31T23:59:59Z',
};

/**
 * Tender avec budget très élevé
 */
export const mockHighBudgetTender: Tender = {
  ...baseTender,
  id: 'high-budget-1',
  budget: 15000000,
  title: 'Construction d\'infrastructure majeure',
};

/**
 * Tender sans budget
 */
export const mockNoBudgetTender: Tender = {
  ...baseTender,
  id: 'no-budget-1',
  budget: undefined,
};

/**
 * Liste de tenders pour pagination (25 items)
 */
export const mockPaginatedTenders: Tender[] = Array.from({ length: 25 }, (_, i) => ({
  ...baseTender,
  id: `paginated-${i + 1}`,
  reference: `REF-PAG-${String(i + 1).padStart(3, '0')}`,
  title: `Tender paginé ${i + 1}`,
}));

/**
 * Erreur réseau simulée
 */
export const mockNetworkError = new Error('Network request failed');

/**
 * Erreur 404 simulée
 */
export const mock404Error = new Error('Tender not found');

/**
 * Erreur 500 simulée
 */
export const mock500Error = new Error('Internal server error');

/**
 * Factory pour créer un tender personnalisé
 */
export function createMockTender(overrides: Partial<Tender> = {}): Tender {
  return {
    ...baseTender,
    ...overrides,
    id: overrides.id || `custom-${Math.random().toString(36).substr(2, 9)}`,
  };
}

/**
 * Factory pour créer un tender détaillé personnalisé
 */
export function createMockTenderDetail(overrides: Partial<TenderDetail> = {}): TenderDetail {
  return {
    ...mockTenderDetail,
    ...overrides,
    id: overrides.id || `custom-detail-${Math.random().toString(36).substr(2, 9)}`,
  };
}

/**
 * Factory pour créer des résultats de matching personnalisés
 */
export function createMockMatchingResults(matchingRate: number, productCount: number = 3) {
  return {
    matching_rate: matchingRate,
    matched_products: Array.from({ length: productCount }, (_, i) => ({
      requirement_id: `req-${i + 1}`,
      product_id: `prod-${Math.random().toString(36).substr(2, 6)}`,
      score: Math.random() * 0.4 + 0.6, // Score entre 0.6 et 1.0
    })),
  };
}

/**
 * Factory pour créer des résultats de conformité personnalisés
 */
export function createMockComplianceResults(score: number, checkCount: number = 3) {
  const passedCount = Math.round((checkCount * score) / 100);

  return {
    compliance_score: score,
    checks: Array.from({ length: checkCount }, (_, i) => ({
      check_id: `check-${i + 1}`,
      name: `Vérification ${i + 1}`,
      passed: i < passedCount,
      details: i < passedCount ? 'Conforme' : 'Non conforme',
    })),
  };
}
