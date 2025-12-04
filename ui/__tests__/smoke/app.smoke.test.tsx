/**
 * SMOKE TESTS - Critical Path Verification
 *
 * These tests verify that the most critical user flows work end-to-end.
 * If any of these fail, the app is fundamentally broken.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

describe('Smoke Tests - App Critical Paths', () => {
  it('should render the app without crashing', async () => {
    render(<App />);

    // App should show the main layout
    await waitFor(() => {
      expect(screen.getByText('Workflow Runner')).toBeInTheDocument();
    });
  });

  it('should display navigation sidebar', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Runs')).toBeInTheDocument();
      expect(screen.getByText('Workflows')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  it('should navigate between views', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Navigate to Workflows
    await user.click(screen.getByText('Workflows'));
    await waitFor(() => {
      expect(screen.getByText('Create Workflow')).toBeInTheDocument();
    });

    // Navigate to Runs
    await user.click(screen.getByText('Runs'));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Runs' })).toBeInTheDocument();
    });

    // Navigate to Settings
    await user.click(screen.getByText('Settings'));
    await waitFor(() => {
      expect(screen.getByText('Gemini API Key')).toBeInTheDocument();
    });

    // Navigate back to Dashboard
    await user.click(screen.getByText('Dashboard'));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    });
  });

  it('should load and display workflows from API', async () => {
    render(<App />);
    const user = userEvent.setup();

    // Navigate to Workflows
    await user.click(screen.getByText('Workflows'));

    // Should show workflows from mock API
    await waitFor(() => {
      expect(screen.getByText('Test Workflow')).toBeInTheDocument();
    });
  });

  it('should load and display runs page', async () => {
    render(<App />);
    const user = userEvent.setup();

    // Navigate to Runs
    await user.click(screen.getByText('Runs'));

    // Should show the Runs page header
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Runs' })).toBeInTheDocument();
    });
  });
});

describe('Smoke Tests - Settings Page', () => {
  it('should save API key to localStorage', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to Settings
    await user.click(screen.getByText('Settings'));

    await waitFor(() => {
      expect(screen.getByText('Gemini API Key')).toBeInTheDocument();
    });

    // Find the API key input and enter a value
    const input = screen.getByPlaceholderText('Enter your Gemini API key');
    await user.clear(input);
    await user.type(input, 'test-api-key-12345');

    // Click save
    await user.click(screen.getByText('Save API Key'));

    // Verify it was saved to localStorage
    await waitFor(() => {
      expect(localStorage.getItem('gemini_api_key')).toBe('test-api-key-12345');
    });
  });

  it('should toggle confirm deletes preference', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText('Settings'));

    await waitFor(() => {
      expect(screen.getByText('Confirm before deleting')).toBeInTheDocument();
    });

    // Find and click the toggle
    const toggleButton = screen.getByText('Confirm before deleting').closest('label')?.querySelector('button');
    expect(toggleButton).toBeInTheDocument();

    if (toggleButton) {
      await user.click(toggleButton);
      expect(localStorage.getItem('confirm_deletes')).toBe('false');
    }
  });
});
