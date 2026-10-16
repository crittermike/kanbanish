import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import BOARD_TEMPLATES from '../../data/boardTemplates';
import NewBoardTemplateModal from './NewBoardTemplateModal';

describe('NewBoardTemplateModal', () => {
  const onSelectTemplate = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (props = {}) =>
    render(
      <NewBoardTemplateModal
        isOpen={true}
        onClose={onClose}
        onSelectTemplate={onSelectTemplate}
        {...props}
      />
    );

  test('renders nothing when closed', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('lists every template as a ?template= link', () => {
    renderModal();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(BOARD_TEMPLATES.length);
    expect(screen.getByRole('link', { name: /Lean Coffee/ })).toHaveAttribute('href', '?template=lean-coffee');
  });

  test('clicking a template selects it immediately', () => {
    renderModal();
    fireEvent.click(screen.getByRole('link', { name: /Lean Coffee/ }));
    expect(onSelectTemplate).toHaveBeenCalledWith(expect.objectContaining({ id: 'lean-coffee' }));
  });

  test('does not select while disabled', () => {
    renderModal({ disabled: true });
    fireEvent.click(screen.getByRole('link', { name: /Lean Coffee/ }));
    expect(onSelectTemplate).not.toHaveBeenCalled();
  });

  test('filters by search and Enter picks the first match', () => {
    renderModal();
    const input = screen.getByPlaceholderText('Search templates');
    fireEvent.change(input, { target: { value: 'sailboat' } });

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    expect(links.length).toBeLessThan(BOARD_TEMPLATES.length);

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelectTemplate).toHaveBeenCalledTimes(1);
    expect(onSelectTemplate.mock.calls[0][0].name.toLowerCase()).toContain('sailboat');
  });

  test('shows an empty message when nothing matches', () => {
    renderModal();
    fireEvent.change(screen.getByPlaceholderText('Search templates'), { target: { value: 'zzzz-no-match' } });
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });

  test('close button calls onClose', () => {
    renderModal();
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
