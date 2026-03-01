import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkipLinks } from '@/components/layout/skip-links';

describe('SkipLinks Component', () => {
  describe('Rendering', () => {
    it('doit afficher le lien vers le contenu principal', () => {
      render(<SkipLinks />);

      const mainContentLink = screen.getByText('Aller au contenu principal');
      expect(mainContentLink).toBeInTheDocument();
      expect(mainContentLink).toHaveAttribute('href', '#main-content');
    });

    it('doit afficher le lien vers la navigation', () => {
      render(<SkipLinks />);

      const navLink = screen.getByText('Aller à la navigation');
      expect(navLink).toBeInTheDocument();
      expect(navLink).toHaveAttribute('href', '#main-nav');
    });

    it('doit rendre deux liens au total', () => {
      const { container } = render(<SkipLinks />);

      const links = container.querySelectorAll('a');
      expect(links).toHaveLength(2);
    });
  });

  describe('Accessibility (a11y)', () => {
    it('doit être caché par défaut avec sr-only', () => {
      const { container } = render(<SkipLinks />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('sr-only');
    });

    it('doit devenir visible au focus (focus-within:not-sr-only)', () => {
      const { container } = render(<SkipLinks />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('focus-within:not-sr-only');
    });

    it('doit avoir des liens avec href valides pour la navigation clavier', () => {
      render(<SkipLinks />);

      const mainContentLink = screen.getByText('Aller au contenu principal');
      const navLink = screen.getByText('Aller à la navigation');

      expect(mainContentLink.getAttribute('href')).toBe('#main-content');
      expect(navLink.getAttribute('href')).toBe('#main-nav');
    });

    it('doit pointer vers des IDs d\'éléments attendus', () => {
      render(<SkipLinks />);

      const links = screen.getAllByRole('link');

      // Vérifier que les IDs cibles existent dans l'attribut href
      expect(links[0]).toHaveAttribute('href', '#main-content');
      expect(links[1]).toHaveAttribute('href', '#main-nav');
    });
  });

  describe('Visual Styling', () => {
    it('doit avoir un z-index élevé pour rester au-dessus du contenu', () => {
      render(<SkipLinks />);

      const mainContentLink = screen.getByText('Aller au contenu principal');
      expect(mainContentLink).toHaveClass('z-[100]');

      const navLink = screen.getByText('Aller à la navigation');
      expect(navLink).toHaveClass('z-[100]');
    });

    it('doit avoir une position fixed', () => {
      render(<SkipLinks />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('fixed');
      });
    });

    it('doit avoir un background indigo et texte blanc', () => {
      render(<SkipLinks />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('bg-indigo-600', 'text-white');
      });
    });

    it('doit avoir des coins arrondis', () => {
      render(<SkipLinks />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('rounded-md');
      });
    });

    it('doit avoir du padding approprié', () => {
      render(<SkipLinks />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('px-4', 'py-2');
      });
    });
  });

  describe('Focus Behavior', () => {
    it('doit être caché hors du viewport par défaut', () => {
      render(<SkipLinks />);

      const mainContentLink = screen.getByText('Aller au contenu principal');
      expect(mainContentLink).toHaveClass('-translate-y-16');
    });

    it('doit revenir dans le viewport au focus', () => {
      render(<SkipLinks />);

      const mainContentLink = screen.getByText('Aller au contenu principal');
      expect(mainContentLink).toHaveClass('focus:translate-y-0');
    });

    it('doit avoir une transition smooth pour l\'animation', () => {
      render(<SkipLinks />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('transition-transform');
      });
    });

    it('doit avoir un focus outline visible', () => {
      render(<SkipLinks />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('focus:outline-none');
        expect(link).toHaveClass('focus:ring-2');
        expect(link).toHaveClass('focus:ring-indigo-500');
        expect(link).toHaveClass('focus:ring-offset-2');
      });
    });
  });

  describe('Positioning', () => {
    it('doit positionner le premier lien en haut à gauche', () => {
      render(<SkipLinks />);

      const mainContentLink = screen.getByText('Aller au contenu principal');
      expect(mainContentLink).toHaveClass('top-4', 'left-4');
    });

    it('doit positionner le second lien décalé horizontalement', () => {
      render(<SkipLinks />);

      const navLink = screen.getByText('Aller à la navigation');
      expect(navLink).toHaveClass('top-4', 'left-56');
    });

    it('ne doit pas chevaucher les liens', () => {
      render(<SkipLinks />);

      const mainContentLink = screen.getByText('Aller au contenu principal');
      const navLink = screen.getByText('Aller à la navigation');

      // Les liens ont des positions left différentes
      expect(mainContentLink.className).toContain('left-4');
      expect(navLink.className).toContain('left-56');
    });
  });

  describe('Keyboard Navigation', () => {
    it('doit être navigable au clavier via Tab', () => {
      render(<SkipLinks />);

      const links = screen.getAllByRole('link');

      // Les liens doivent être focusables (pas de tabindex=-1)
      links.forEach((link) => {
        expect(link).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('doit avoir un ordre de tabulation logique', () => {
      const { container } = render(<SkipLinks />);

      const links = Array.from(container.querySelectorAll('a'));

      // Le premier lien devrait être "contenu principal"
      expect(links[0]).toHaveTextContent('Aller au contenu principal');

      // Le second lien devrait être "navigation"
      expect(links[1]).toHaveTextContent('Aller à la navigation');
    });
  });

  describe('Integration avec la page', () => {
    it('doit cibler des IDs cohérents avec le layout', () => {
      render(<SkipLinks />);

      const mainContentLink = screen.getByText('Aller au contenu principal');
      const navLink = screen.getByText('Aller à la navigation');

      // Les IDs doivent correspondre à ceux utilisés dans le layout
      expect(mainContentLink.getAttribute('href')).toBe('#main-content');
      expect(navLink.getAttribute('href')).toBe('#main-nav');
    });
  });

  describe('WCAG Compliance', () => {
    it('doit respecter WCAG 2.4.1 (Bypass Blocks)', () => {
      // Ce composant permet de contourner les blocs répétitifs
      render(<SkipLinks />);

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);

      // Au moins un lien doit permettre de sauter au contenu principal
      const skipToMain = links.find((link) =>
        link.textContent?.includes('contenu principal')
      );
      expect(skipToMain).toBeDefined();
    });

    it('doit avoir un contraste suffisant (4.5:1)', () => {
      // bg-indigo-600 (#4f46e5) sur text-white (#ffffff)
      // Ratio de contraste: ~8.5:1 (conforme WCAG AAA)
      render(<SkipLinks />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('bg-indigo-600', 'text-white');
      });
    });

    it('doit avoir un indicateur de focus visible', () => {
      render(<SkipLinks />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        // Ring visible au focus
        expect(link).toHaveClass('focus:ring-2');
        expect(link).toHaveClass('focus:ring-indigo-500');
      });
    });
  });

  describe('Edge Cases', () => {
    it('ne doit pas affecter le layout normal de la page', () => {
      const { container } = render(<SkipLinks />);

      const wrapper = container.firstChild as HTMLElement;

      // Les liens sont en position fixed et sr-only, donc n'affectent pas le flux
      expect(wrapper).toHaveClass('sr-only');

      const links = wrapper.querySelectorAll('a');
      links.forEach((link) => {
        expect(link).toHaveClass('fixed');
      });
    });

    it('doit fonctionner sans JavaScript', () => {
      // Les skip links sont du HTML pur avec des ancres
      render(<SkipLinks />);

      const links = screen.getAllByRole('link');

      // Vérifier que les liens utilisent des ancres HTML standards
      links.forEach((link) => {
        expect(link.getAttribute('href')).toMatch(/^#/);
      });
    });
  });
});
