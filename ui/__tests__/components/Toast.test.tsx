import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { ToastContainer, useToast, ToastMessage } from './Toast';
import React from 'react';

// Test component that uses the useToast hook
function ToastTestHarness() {
  const { toasts, dismissToast, showSuccess, showError, showInfo } = useToast();

  return (
    <div>
      <button data-testid="show-success" onClick={() => showSuccess('Success message')}>
        Show Success
      </button>
      <button data-testid="show-error" onClick={() => showError('Error message')}>
        Show Error
      </button>
      <button data-testid="show-info" onClick={() => showInfo('Info message')}>
        Show Info
      </button>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

describe('Toast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when there are no toasts', () => {
    const { container } = render(
      <ToastContainer toasts={[]} onDismiss={() => {}} />
    );
    expect(container.querySelector('.fixed')).toBeNull();
  });

  it('renders a toast message', () => {
    const toasts: ToastMessage[] = [
      { id: '1', type: 'success', message: 'Test success' }
    ];

    render(<ToastContainer toasts={toasts} onDismiss={() => {}} />);

    expect(screen.getByText('Test success')).toBeInTheDocument();
  });

  it('renders multiple toasts', () => {
    const toasts: ToastMessage[] = [
      { id: '1', type: 'success', message: 'Success toast' },
      { id: '2', type: 'error', message: 'Error toast' },
      { id: '3', type: 'info', message: 'Info toast' }
    ];

    render(<ToastContainer toasts={toasts} onDismiss={() => {}} />);

    expect(screen.getByText('Success toast')).toBeInTheDocument();
    expect(screen.getByText('Error toast')).toBeInTheDocument();
    expect(screen.getByText('Info toast')).toBeInTheDocument();
  });

  it('calls onDismiss when close button is clicked', () => {
    const onDismiss = vi.fn();
    const toasts: ToastMessage[] = [
      { id: 'toast-1', type: 'success', message: 'Dismissable toast' }
    ];

    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(onDismiss).toHaveBeenCalledWith('toast-1');
  });

  it('auto-dismisses after 4 seconds', () => {
    const onDismiss = vi.fn();
    const toasts: ToastMessage[] = [
      { id: 'auto-dismiss', type: 'info', message: 'Auto dismiss toast' }
    ];

    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(onDismiss).toHaveBeenCalledWith('auto-dismiss');
  });
});

describe('useToast Hook', () => {
  it('showSuccess adds a success toast', () => {
    render(<ToastTestHarness />);

    fireEvent.click(screen.getByTestId('show-success'));

    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('showError adds an error toast', () => {
    render(<ToastTestHarness />);

    fireEvent.click(screen.getByTestId('show-error'));

    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('showInfo adds an info toast', () => {
    render(<ToastTestHarness />);

    fireEvent.click(screen.getByTestId('show-info'));

    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('can show multiple toasts', () => {
    render(<ToastTestHarness />);

    fireEvent.click(screen.getByTestId('show-success'));
    fireEvent.click(screen.getByTestId('show-error'));

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });
});
