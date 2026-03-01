/**
 * @file period-filter.test.tsx
 * @description Tests unitaires pour le composant PeriodFilter
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PeriodFilter, PeriodValue, PeriodPreset } from '@/components/dashboard/filters/period-filter';
import { startOfDay, endOfDay } from 'date-fns';

const defaultValue: PeriodValue = {
  preset: 'last_7_days',
  startDate: startOfDay(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)),
  endDate: endOfDay(new Date()),
};

const customValue: PeriodValue = {
  preset: 'custom',
  startDate: startOfDay(new Date('2026-01-01')),
  endDate: endOfDay(new Date('2026-01-31')),
};

describe('PeriodFilter', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let onChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    user = userEvent.setup();
    onChange = vi.fn();
    vi.clearAllMocks();
  });

  describe('Rendu initial', () => {
    it('affiche le bouton de declenchement', () => {
      render(<PeriodFilter value={defaultValue} onChange={onChange} />);

      const trigger = screen.getByRole('button');
      expect(trigger).toBeInTheDocument();
    });

    it('affiche l\'icone calendrier', () => {
      render(<PeriodFilter value={defaultValue} onChange={onChange} />);

      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('affiche le label du preset actif (7 derniers jours)', () => {
      render(<PeriodFilter value={defaultValue} onChange={onChange} />);

      expect(screen.getByText(/7 derniers jours/i)).toBeInTheDocument();
    });

    it('affiche la plage de dates formatee pour le mode custom', () => {
      render(<PeriodFilter value={customValue} onChange={onChange} />);

      // For custom mode, shows formatted date range
      const button = screen.getByRole('button');
      expect(button.textContent).toContain('janv');
    });
  });

  describe('Ouverture du popover', () => {
    it('ouvre le popover au clic sur le bouton', async () => {
      render(<PeriodFilter value={defaultValue} onChange={onChange} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      // The presets should now be visible - "Hier" is not in the trigger button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Hier$/i })).toBeInTheDocument();
      });
    });

    it('affiche les presets par defaut dans le popover', async () => {
      render(<PeriodFilter value={defaultValue} onChange={onChange} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        // Default presets include these
        expect(screen.getByRole('button', { name: /Aujourd'hui/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Hier/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /30 derniers jours/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Ce mois/i })).toBeInTheDocument();
      });
    });
  });

  describe('Selection de presets', () => {
    it('appelle onChange avec le bon preset au clic sur "Aujourd\'hui"', async () => {
      render(<PeriodFilter value={defaultValue} onChange={onChange} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Aujourd'hui/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Aujourd'hui/i }));

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ preset: 'today' })
      );
    });

    it('appelle onChange avec le bon preset au clic sur "7 derniers jours"', async () => {
      // Use a different initial preset to avoid ambiguity
      const todayValue: PeriodValue = {
        preset: 'today',
        startDate: startOfDay(new Date()),
        endDate: endOfDay(new Date()),
      };
      render(<PeriodFilter value={todayValue} onChange={onChange} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        // "7 derniers jours" appears only inside the popover when preset is "today"
        expect(screen.getByRole('button', { name: /7 derniers jours/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /7 derniers jours/i }));

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ preset: 'last_7_days' })
      );
    });

    it('appelle onChange avec le bon preset au clic sur "Ce mois"', async () => {
      render(<PeriodFilter value={defaultValue} onChange={onChange} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Ce mois/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Ce mois/i }));

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ preset: 'this_month' })
      );
    });

    it('inclut startDate et endDate dans le changement de preset', async () => {
      render(<PeriodFilter value={defaultValue} onChange={onChange} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Hier/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Hier/i }));

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          preset: 'yesterday',
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        })
      );
    });

    it('ferme le popover apres selection d\'un preset non-custom', async () => {
      render(<PeriodFilter value={defaultValue} onChange={onChange} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Aujourd'hui/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Aujourd'hui/i }));

      // The popover should close (the separate preset buttons disappear)
      await waitFor(() => {
        // Wait for popover to close - the "Hier" button inside popover should be gone
        const presetsContainer = document.querySelector('.border-r.p-2');
        expect(presetsContainer).toBeNull();
      });
    });
  });

  describe('Mode personnalise (custom)', () => {
    it('affiche le calendrier quand preset=custom', async () => {
      render(<PeriodFilter value={customValue} onChange={onChange} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        // Calendar should be visible (has navigation buttons and cells)
        const calendar = document.querySelector('[data-slot="calendar"]') ||
                         document.querySelector('.rdp') ||
                         document.querySelector('[class*="calendar"]');
        expect(calendar).toBeTruthy();
      });
    });

    it('n\'affiche pas le calendrier pour un preset non-custom', async () => {
      render(<PeriodFilter value={defaultValue} onChange={onChange} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        // Verify popover is open but no calendar
        expect(screen.getByRole('button', { name: /Aujourd'hui/i })).toBeInTheDocument();
      });

      // No calendar grid should be visible
      const calendar = document.querySelector('[data-slot="calendar"]') ||
                       document.querySelector('.rdp');
      expect(calendar).toBeNull();
    });

    it('affiche le bouton Appliquer en mode custom', async () => {
      render(<PeriodFilter value={customValue} onChange={onChange} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Appliquer/i })).toBeInTheDocument();
      });
    });

    it('bascule vers le mode custom au clic sur "Personnalise"', async () => {
      render(<PeriodFilter value={defaultValue} onChange={onChange} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Personnalise/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Personnalise/i }));

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ preset: 'custom' })
      );
    });
  });

  describe('Option de comparaison', () => {
    it('n\'affiche pas le switch de comparaison par defaut', async () => {
      render(<PeriodFilter value={defaultValue} onChange={onChange} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Aujourd'hui/i })).toBeInTheDocument();
      });

      expect(screen.queryByLabelText(/Comparer/i)).not.toBeInTheDocument();
    });

    it('affiche le switch de comparaison si showComparison=true', async () => {
      render(<PeriodFilter value={defaultValue} onChange={onChange} showComparison />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(/Comparer a la periode precedente/i)).toBeInTheDocument();
      });
    });

    it('active la comparaison au clic sur le switch', async () => {
      render(<PeriodFilter value={defaultValue} onChange={onChange} showComparison />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('switch')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('switch'));

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ compareEnabled: true })
      );
    });
  });

  describe('Presets personnalises', () => {
    it('affiche uniquement les presets fournis', async () => {
      const customPresets: PeriodPreset[] = ['today', 'last_7_days', 'this_month'];
      // Use today as the current preset so "last_7_days" won't be in the trigger button
      const todayValue: PeriodValue = {
        preset: 'today',
        startDate: startOfDay(new Date()),
        endDate: endOfDay(new Date()),
      };
      render(<PeriodFilter value={todayValue} onChange={onChange} presets={customPresets} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /7 derniers jours/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Ce mois/i })).toBeInTheDocument();
      });

      // "Hier" should not be visible since it's not in customPresets
      expect(screen.queryByRole('button', { name: /^Hier$/i })).not.toBeInTheDocument();
      // "30 derniers jours" should not be visible
      expect(screen.queryByRole('button', { name: /30 derniers jours/i })).not.toBeInTheDocument();
    });
  });

  describe('Variantes', () => {
    it('applique la variante outline par defaut', () => {
      render(<PeriodFilter value={defaultValue} onChange={onChange} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-variant', 'outline');
    });

    it('applique la taille sm', () => {
      render(<PeriodFilter value={defaultValue} onChange={onChange} size="sm" />);

      const button = screen.getByRole('button');
      // Size sm adds h-8 class
      expect(button.className).toContain('h-8');
    });

    it('applique la taille lg', () => {
      render(<PeriodFilter value={defaultValue} onChange={onChange} size="lg" />);

      const button = screen.getByRole('button');
      // Size lg adds h-11 class
      expect(button.className).toContain('h-11');
    });

    it('applique le className personnalise', () => {
      render(<PeriodFilter value={defaultValue} onChange={onChange} className="my-period-filter" />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('my-period-filter');
    });
  });

  describe('Preset actif mis en evidence', () => {
    it('marque le preset actuel comme secondaire', async () => {
      // Use "today" as preset so the trigger button shows "Aujourd'hui"
      // and inside the popover the "Aujourd'hui" button will be marked secondary
      const todayValue: PeriodValue = {
        preset: 'today',
        startDate: startOfDay(new Date()),
        endDate: endOfDay(new Date()),
      };
      render(<PeriodFilter value={todayValue} onChange={onChange} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        // "Hier" button is inside the popover and should be ghost (not secondary)
        const hierButton = screen.getByRole('button', { name: /^Hier$/i });
        expect(hierButton).toHaveAttribute('data-variant', 'ghost');

        // Find all buttons with "Aujourd'hui" - the one inside the popover (has no aria-controls)
        const allTodayButtons = screen.getAllByRole('button', { name: /Aujourd'hui/i });
        // The popover preset button (not the trigger) should be secondary
        const presetButton = allTodayButtons.find((btn) => !btn.hasAttribute('aria-controls'));
        expect(presetButton).toHaveAttribute('data-variant', 'secondary');
      });
    });
  });
});
