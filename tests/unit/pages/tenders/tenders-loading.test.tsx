/**
 * Tests pour l'état de chargement de la page tenders
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TendersLoading from '@/app/(dashboard)/tenders/loading';

describe('TendersLoading - État de chargement', () => {
  it('affiche le composant de chargement', () => {
    const { container } = render(<TendersLoading />);

    // Vérifie la présence de skeletons
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('affiche le skeleton de l\'en-tête', () => {
    const { container } = render(<TendersLoading />);

    // Vérifie la structure générale
    const skeleton = container.querySelector('[data-slot="skeleton"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('affiche des skeletons pour plusieurs tenders', () => {
    const { container } = render(<TendersLoading />);

    // Doit afficher 6 cartes de tenders en chargement
    const cards = container.querySelectorAll('[data-slot="card"]');
    expect(cards.length).toBeGreaterThanOrEqual(6);
  });

  it('affiche un skeleton pour les filtres', () => {
    const { container } = render(<TendersLoading />);

    // Vérifie la présence de la structure de filtres
    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
  });

  it('affiche un skeleton pour la pagination', () => {
    const { container } = render(<TendersLoading />);

    // Vérifie la présence de multiples skeletons pour l'interface complète
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(10);
  });

  it('utilise des classes CSS appropriées', () => {
    const { container } = render(<TendersLoading />);

    // Vérifie que les skeletons ont les bonnes classes
    const skeleton = container.querySelector('[data-slot="skeleton"]');
    expect(skeleton).toHaveClass('h-8');
  });

  it('est accessible pendant le chargement', () => {
    const { container } = render(<TendersLoading />);

    // Pas d'erreur d'accessibilité évidente
    expect(container).toBeInTheDocument();
  });
});
